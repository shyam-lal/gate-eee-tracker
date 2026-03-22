import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { exams as examsApi } from '../services/api';

const ExamContext = createContext(null);

/**
 * ExamProvider — global state manager for exam context.
 * 
 * Provides:
 *   - activeExam: the currently active exam object (full details)
 *   - enrollments: list of all exams the user is enrolled in
 *   - availableExams: list of all exams (for onboarding/browsing)
 *   - categories: exam categories
 *   - switchExam(examId): switch the active exam
 *   - enrollInExam(examId, targetDate): enroll in a new exam
 *   - refreshEnrollments(): re-fetch enrollment data
 *   - loading: boolean
 */
export const ExamProvider = ({ children, user }) => {
    const [activeExam, setActiveExam] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [availableExams, setAvailableExams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load everything when user changes
    useEffect(() => {
        if (user) {
            loadInitialData();
        } else {
            setActiveExam(null);
            setEnrollments([]);
            setAvailableExams([]);
            setCategories([]);
            setLoading(false);
        }
    }, [user]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [cats, allExams, userEnrollments] = await Promise.all([
                examsApi.getCategories(),
                examsApi.getAll(),
                examsApi.getEnrollments()
            ]);
            setCategories(cats);
            setAvailableExams(allExams);
            setEnrollments(userEnrollments);

            // Determine active exam
            if (user.active_exam_id) {
                const active = allExams.find(e => e.id === user.active_exam_id)
                    || userEnrollments.find(e => e.exam_id === user.active_exam_id);
                if (active) {
                    setActiveExam(active);
                }
            } else if (userEnrollments.length > 0) {
                // Fallback to first enrollment
                const firstEnrolled = allExams.find(e => e.id === userEnrollments[0].exam_id);
                setActiveExam(firstEnrolled || null);
            }
        } catch (err) {
            console.error('ExamContext: Failed to load data:', err);
        }
        setLoading(false);
    };

    const switchExam = useCallback(async (examId) => {
        try {
            await examsApi.switchExam(examId);
            const exam = availableExams.find(e => e.id === examId);
            setActiveExam(exam || null);
        } catch (err) {
            console.error('ExamContext: Failed to switch exam:', err);
            throw err;
        }
    }, [availableExams]);

    const enrollInExam = useCallback(async (examId, targetDate = null) => {
        try {
            await examsApi.enroll(examId, targetDate);
            // Refresh enrollments
            const updated = await examsApi.getEnrollments();
            setEnrollments(updated);
            // Auto switch to the new exam
            const exam = availableExams.find(e => e.id === examId);
            setActiveExam(exam || null);
            return true;
        } catch (err) {
            console.error('ExamContext: Failed to enroll:', err);
            throw err;
        }
    }, [availableExams]);

    const refreshEnrollments = useCallback(async () => {
        try {
            const updated = await examsApi.getEnrollments();
            setEnrollments(updated);
        } catch (err) {
            console.error('ExamContext: Failed to refresh enrollments:', err);
        }
    }, []);

    const completeOnboarding = useCallback(async () => {
        try {
            await examsApi.completeOnboarding();
        } catch (err) {
            console.error('ExamContext: Failed to complete onboarding:', err);
        }
    }, []);

    const value = {
        activeExam,
        enrollments,
        availableExams,
        categories,
        loading,
        switchExam,
        enrollInExam,
        refreshEnrollments,
        completeOnboarding,
    };

    return (
        <ExamContext.Provider value={value}>
            {children}
        </ExamContext.Provider>
    );
};

export const useExam = () => {
    const context = useContext(ExamContext);
    if (!context) {
        throw new Error('useExam must be used within an ExamProvider');
    }
    return context;
};

export default ExamContext;
