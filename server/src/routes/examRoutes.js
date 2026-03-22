const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const examService = require('../services/examService');
const { importSyllabus } = require('../services/syllabusImportService');
const questionBankService = require('../services/questionBankService');
const { uploadFile } = require('../services/uploadService');
const googleDriveService = require('../services/googleDriveService');
const multer = require('multer');

// Configure Multer for PDF/document uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDFs and images are allowed!'), false);
        }
    }
});
// ═══════════════════════════════════════════════════
// Public Routes (no auth required)
// ═══════════════════════════════════════════════════

/**
 * GET /api/exams/categories
 * Get all active exam categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await examService.getCategories();
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

/**
 * GET /api/exams
 * Get all active exams (optionally filter by category_id query param)
 */
router.get('/', async (req, res) => {
    try {
        const exams = await examService.getExams(req.query.category_id || null);
        res.json(exams);
    } catch (err) {
        console.error('Error fetching exams:', err);
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
});

/**
 * GET /api/exams/:id
 * Get a single exam by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const exam = await examService.getExamById(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        console.error('Error fetching exam:', err);
        res.status(500).json({ error: 'Failed to fetch exam' });
    }
});

/**
 * GET /api/exams/:id/syllabus
 * Get full syllabus for an exam (subjects + topics)
 */
router.get('/:id/syllabus', async (req, res) => {
    try {
        const syllabus = await examService.getExamSyllabus(req.params.id);
        res.json(syllabus);
    } catch (err) {
        console.error('Error fetching syllabus:', err);
        res.status(500).json({ error: 'Failed to fetch syllabus' });
    }
});

/**
 * GET /api/exams/:id/materials
 * Get study materials for an exam (optionally filter by subject_id, topic_id, content_type)
 */
router.get('/:id/materials', async (req, res) => {
    try {
        const materials = await examService.getStudyMaterials(req.params.id, {
            subjectId: req.query.subject_id,
            topicId: req.query.topic_id,
            contentType: req.query.content_type,
        });
        res.json(materials);
    } catch (err) {
        console.error('Error fetching materials:', err);
        res.status(500).json({ error: 'Failed to fetch materials' });
    }
});

// ═══════════════════════════════════════════════════
// Authenticated User Routes
// ═══════════════════════════════════════════════════

/**
 * GET /api/exams/user/enrollments
 * Get all exams the current user is enrolled in
 */
router.get('/user/enrollments', authenticateToken, async (req, res) => {
    try {
        const enrollments = await examService.getUserEnrollments(req.user.id);
        res.json(enrollments);
    } catch (err) {
        console.error('Error fetching enrollments:', err);
        res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
});

/**
 * POST /api/exams/user/enroll
 * Enroll current user in an exam
 * Body: { exam_id, target_date? }
 */
router.post('/user/enroll', authenticateToken, async (req, res) => {
    try {
        const { exam_id, target_date } = req.body;
        if (!exam_id) return res.status(400).json({ error: 'exam_id is required' });

        // Verify exam exists
        const exam = await examService.getExamById(exam_id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const enrollment = await examService.enrollUser(req.user.id, exam_id, target_date);

        // Set as active exam if none set
        await examService.setActiveExam(req.user.id, exam_id);

        res.json(enrollment);
    } catch (err) {
        console.error('Error enrolling:', err);
        res.status(500).json({ error: 'Failed to enroll' });
    }
});

/**
 * POST /api/exams/user/switch
 * Switch active exam
 * Body: { exam_id }
 */
router.post('/user/switch', authenticateToken, async (req, res) => {
    try {
        const { exam_id } = req.body;
        if (!exam_id) return res.status(400).json({ error: 'exam_id is required' });

        // Verify enrollment
        const enrollments = await examService.getUserEnrollments(req.user.id);
        const isEnrolled = enrollments.some(e => e.exam_id === parseInt(exam_id));
        if (!isEnrolled) return res.status(403).json({ error: 'Not enrolled in this exam' });

        const result = await examService.setActiveExam(req.user.id, exam_id);
        res.json(result);
    } catch (err) {
        console.error('Error switching exam:', err);
        res.status(500).json({ error: 'Failed to switch exam' });
    }
});

/**
 * POST /api/exams/user/onboarding-complete
 * Mark onboarding as completed
 */
router.post('/user/onboarding-complete', authenticateToken, async (req, res) => {
    try {
        await examService.completeOnboarding(req.user.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error completing onboarding:', err);
        res.status(500).json({ error: 'Failed to complete onboarding' });
    }
});

// ═══════════════════════════════════════════════════
// Admin Routes
// ═══════════════════════════════════════════════════

// ─── Categories ────────────────────────────────────

router.post('/admin/categories', authenticateToken, adminAuth, async (req, res) => {
    try {
        const category = await examService.createCategory(req.body);
        res.status(201).json(category);
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

router.put('/admin/categories/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const category = await examService.updateCategory(req.params.id, req.body);
        if (!category) return res.status(400).json({ error: 'No updates provided' });
        res.json(category);
    } catch (err) {
        console.error('Error updating category:', err);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// ─── Exams ─────────────────────────────────────────

router.post('/admin/exams', authenticateToken, adminAuth, async (req, res) => {
    try {
        const exam = await examService.createExam(req.body);
        res.status(201).json(exam);
    } catch (err) {
        console.error('Error creating exam:', err);
        res.status(500).json({ error: 'Failed to create exam' });
    }
});

router.put('/admin/exams/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const exam = await examService.updateExam(req.params.id, req.body);
        if (!exam) return res.status(400).json({ error: 'No updates provided' });
        res.json(exam);
    } catch (err) {
        console.error('Error updating exam:', err);
        res.status(500).json({ error: 'Failed to update exam' });
    }
});

router.delete('/admin/exams/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const exam = await examService.deleteExam(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        res.json({ message: 'Exam deleted', exam });
    } catch (err) {
        console.error('Error deleting exam:', err);
        res.status(500).json({ error: 'Failed to delete exam' });
    }
});

// ─── Question Bank ───────────────────────────────────

router.post('/admin/exams/:examId/questions/import', authenticateToken, adminAuth, async (req, res) => {
    try {
        const { questions, clearExisting } = req.body;
        
        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Invalid payload: "questions" array is required.' });
        }

        const result = await questionBankService.importQuestions(
            req.params.examId, 
            questions, 
            clearExisting
        );
        
        res.json(result);
    } catch (err) {
        console.error('Error importing questions:', err);
        res.status(500).json({ error: err.message || 'Failed to import questions' });
    }
});

// ─── Syllabus (Subjects & Topics) ──────────────────

router.post('/admin/exams/:examId/subjects', authenticateToken, adminAuth, async (req, res) => {
    try {
        const subject = await examService.createSubject(req.params.examId, req.body);
        res.status(201).json(subject);
    } catch (err) {
        console.error('Error creating subject:', err);
        res.status(500).json({ error: 'Failed to create subject' });
    }
});

router.put('/admin/subjects/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const subject = await examService.updateSubject(req.params.id, req.body);
        if (!subject) return res.status(400).json({ error: 'No updates provided' });
        res.json(subject);
    } catch (err) {
        console.error('Error updating subject:', err);
        res.status(500).json({ error: 'Failed to update subject' });
    }
});

router.delete('/admin/subjects/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const subject = await examService.deleteSubject(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        res.json({ message: 'Subject deleted', subject });
    } catch (err) {
        console.error('Error deleting subject:', err);
        res.status(500).json({ error: 'Failed to delete subject' });
    }
});

router.post('/admin/subjects/:subjectId/topics', authenticateToken, adminAuth, async (req, res) => {
    try {
        const topic = await examService.createTopic(req.params.subjectId, req.body);
        res.status(201).json(topic);
    } catch (err) {
        console.error('Error creating topic:', err);
        res.status(500).json({ error: 'Failed to create topic' });
    }
});

router.put('/admin/topics/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const topic = await examService.updateTopic(req.params.id, req.body);
        if (!topic) return res.status(400).json({ error: 'No updates provided' });
        res.json(topic);
    } catch (err) {
        console.error('Error updating topic:', err);
        res.status(500).json({ error: 'Failed to update topic' });
    }
});

router.delete('/admin/topics/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const topic = await examService.deleteTopic(req.params.id);
        if (!topic) return res.status(404).json({ error: 'Topic not found' });
        res.json({ message: 'Topic deleted', topic });
    } catch (err) {
        console.error('Error deleting topic:', err);
        res.status(500).json({ error: 'Failed to delete topic' });
    }
});

// ─── Study Materials ───────────────────────────────

router.post('/admin/materials/upload', authenticateToken, adminAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Ensure required fields are present
        const { title, exam_id, content_type } = req.body;
        if (!title || !exam_id || !content_type) {
            return res.status(400).json({ error: 'Missing required fields: title, exam_id, content_type' });
        }

        let publicUrl, storageKey;
        
        console.log(`[Upload Debug] File Mimetype: ${req.file.mimetype}`);
        console.log(`[Upload Debug] Drive Configured?: ${googleDriveService.isDriveConfigured()}`);

        // Hybrid Upload Logic: PDF to Google Drive, Images and fallback to R2
        if (req.file.mimetype === 'application/pdf' && googleDriveService.isDriveConfigured()) {
            try {
                const result = await googleDriveService.uploadToDrive(
                    req.file.buffer,
                    title + '.pdf', // Use the user-provided title for the Drive filename
                    req.file.mimetype
                );
                publicUrl = result.url;
                storageKey = result.driveFileId;
            } catch (driveErr) {
                console.error("Google Drive upload failed, falling back to R2:", driveErr);
                const r2Result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'materials');
                publicUrl = r2Result.url;
                storageKey = r2Result.key;
            }
        } else {
            // R2 Upload for images or if Drive is not configured
            const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'materials');
            publicUrl = result.url;
            storageKey = result.key;
        }

        // Prepare material data matching frontend form + new fields
        const materialData = {
            exam_id: parseInt(exam_id),
            subject_id: req.body.subject_id ? parseInt(req.body.subject_id) : null,
            topic_id: req.body.topic_id ? parseInt(req.body.topic_id) : null,
            title,
            content_type,
            file_url: publicUrl,
            r2_key: storageKey,
            file_size_bytes: req.file.size,
            file_mime_type: req.file.mimetype,
            uploaded_by: req.user.id,
            source: 'admin'
        };

        const material = await examService.createMaterial(materialData);
        res.status(201).json(material);

    } catch (err) {
        console.error('Error uploading material:', err);
        res.status(500).json({ error: 'Failed to upload material' });
    }
});

router.post('/admin/materials', authenticateToken, adminAuth, async (req, res) => {
    try {
        const material = await examService.createMaterial(req.body);
        res.status(201).json(material);
    } catch (err) {
        console.error('Error creating material:', err);
        res.status(500).json({ error: 'Failed to create material' });
    }
});

router.put('/admin/materials/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const material = await examService.updateMaterial(req.params.id, req.body);
        if (!material) return res.status(400).json({ error: 'No updates provided' });
        res.json(material);
    } catch (err) {
        console.error('Error updating material:', err);
        res.status(500).json({ error: 'Failed to update material' });
    }
});

router.delete('/admin/materials/:id', authenticateToken, adminAuth, async (req, res) => {
    try {
        const material = await examService.deleteMaterial(req.params.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });
        res.json({ message: 'Material deleted', material });
    } catch (err) {
        console.error('Error deleting material:', err);
        res.status(500).json({ error: 'Failed to delete material' });
    }
});
// ─── Bulk Syllabus Import ──────────────────────────

/**
 * POST /api/exams/admin/exams/:examId/syllabus/import
 * Bulk import syllabus from JSON
 * Body: { subjects: [...], clearExisting?: boolean }
 */
router.post('/admin/exams/:examId/syllabus/import', authenticateToken, adminAuth, async (req, res) => {
    try {
        const { subjects, clearExisting } = req.body;
        if (!subjects || !Array.isArray(subjects)) {
            return res.status(400).json({ error: 'Request body must have a "subjects" array.' });
        }

        const result = await importSyllabus(
            parseInt(req.params.examId),
            { subjects },
            { clearExisting: !!clearExisting }
        );

        res.json({
            message: 'Syllabus import complete',
            subjectsCreated: result.subjectsCreated,
            topicsCreated: result.topicsCreated,
            errors: result.errors,
        });
    } catch (err) {
        console.error('Error importing syllabus:', err);
        res.status(500).json({ error: err.message || 'Failed to import syllabus' });
    }
});

module.exports = router;
