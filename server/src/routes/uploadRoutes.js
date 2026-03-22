const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../services/uploadService');
const auth = require('../middleware/authMiddleware');

// Configure Multer for memory storage (we will buffer it to S3)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image uploads
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// @route   POST /api/upload
// @desc    Upload an image to Backblaze B2 storage
// @access  Private
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded.' });
        }

        // Upload to Cloudflare R2
        const { url: publicUrl } = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'flashcards');

        res.json({
            success: true,
            url: publicUrl
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error during upload', error: err.message });
    }
});

module.exports = router;
