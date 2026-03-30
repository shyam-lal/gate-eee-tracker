import { useState, useEffect, useRef, useCallback } from 'react';
import { revision as revisionApi } from '../services/api';

/**
 * useTestSession — reusable hook for all test-taking logic.
 * Powers revision tests, mock tests, PYQ tests — any question-based exam.
 *
 * @param {Object} config
 * @param {Object} config.set         — the question set { id, title, topics, time_per_question, ... }
 * @param {Object} config.attempt     — the attempt object { id, question_order, answers, current_question_index, time_taken_seconds }
 * @param {string} config.mode        — 'exam' | 'study'
 * @param {string} config.toolId      — tool ID for scoring
 * @param {Function} config.onComplete — called with result on submit
 * @param {Function} config.onExit    — called on exit
 */
export default function useTestSession({ set, attempt, mode = 'exam', toolId, onComplete, onExit }) {
    const [questions, setQuestions] = useState([]);        // ordered question IDs
    const [questionMap, setQuestionMap] = useState({});     // id → question object
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});             // { qId: answer }
    const [timeSpent, setTimeSpent] = useState({});         // { qId: seconds }
    const [marked, setMarked] = useState({});               // { qId: true }
    const [visited, setVisited] = useState({});             // { qId: true }
    const [timer, setTimer] = useState(0);                  // seconds on current question
    const [totalTime, setTotalTime] = useState(attempt?.time_taken_seconds || 0);
    const [paused, setPaused] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [checked, setChecked] = useState({});             // study mode: { qId: { isCorrect, revealed } }
    const [feedback, setFeedback] = useState(null);

    const timerRef = useRef(null);
    const timePerQ = set.time_per_question || 180;

    // ─── Load Questions ─────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const data = await revisionApi.getSet(set.id);
                const allQs = data.questions || [];
                const qMap = {};
                allQs.forEach(q => { qMap[q.id] = q; });
                setQuestionMap(qMap);

                const order = attempt.question_order || allQs.map(q => q.id);
                setQuestions(order);

                // Restore progress if resuming
                if (attempt.answers?.length > 0) {
                    const restored = {};
                    const restoredTime = {};
                    attempt.answers.forEach(a => {
                        restored[a.question_id] = a.user_answer;
                        restoredTime[a.question_id] = a.time_spent_seconds || 0;
                    });
                    setAnswers(restored);
                    setTimeSpent(restoredTime);
                }
                setCurrentIdx(attempt.current_question_index || 0);
                setTotalTime(attempt.time_taken_seconds || 0);
                // Mark first question as visited
                if (order.length > 0) {
                    setVisited(prev => ({ ...prev, [order[attempt.current_question_index || 0]]: true }));
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    // ─── Timer (exam mode: per-question countdown) ──────────────
    useEffect(() => {
        if (paused || loading || mode === 'study') return;
        timerRef.current = setInterval(() => {
            setTimer(t => {
                if (t + 1 >= timePerQ) {
                    handleNext(true);
                    return 0;
                }
                return t + 1;
            });
            setTotalTime(t => t + 1);
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [paused, loading, currentIdx, mode]);

    // ─── Timer (study mode: total time only) ────────────────────
    useEffect(() => {
        if (paused || loading || mode !== 'study') return;
        const iv = setInterval(() => setTotalTime(t => t + 1), 1000);
        return () => clearInterval(iv);
    }, [paused, loading, mode]);

    // ─── Derived ────────────────────────────────────────────────
    const currentQId = questions[currentIdx];
    const currentQ = questionMap[currentQId];
    const isLastQuestion = currentIdx === questions.length - 1;
    const timerPct = (timer / timePerQ) * 100;

    // ─── Answer Handling ────────────────────────────────────────
    const selectMCQ = (optionIdx) => {
        setAnswers(prev => ({ ...prev, [currentQId]: [optionIdx] }));
    };

    const toggleMSQ = (optionIdx) => {
        setAnswers(prev => {
            const current = Array.isArray(prev[currentQId]) ? [...prev[currentQId]] : [];
            const idx = current.indexOf(optionIdx);
            if (idx >= 0) current.splice(idx, 1);
            else current.push(optionIdx);
            return { ...prev, [currentQId]: current };
        });
    };

    const setNAT = (value) => {
        setAnswers(prev => ({ ...prev, [currentQId]: { value: parseFloat(value) || value } }));
    };

    const clearResponse = () => {
        setAnswers(prev => {
            const next = { ...prev };
            delete next[currentQId];
            return next;
        });
    };

    // ─── Mark / Flag ────────────────────────────────────────────
    const toggleMark = () => {
        setMarked(prev => ({ ...prev, [currentQId]: !prev[currentQId] }));
    };

    // ─── Study Mode: Check & Reveal ─────────────────────────────
    const isAnswerCorrect = (userAns, correctAns, type) => {
        if (!userAns) return false;
        if (type === 'mcq') return Array.isArray(userAns) && userAns[0] === correctAns[0];
        if (type === 'msq') {
            if (!Array.isArray(userAns) || userAns.length !== correctAns.length) return false;
            return userAns.every(v => correctAns.includes(v)) && correctAns.every(v => userAns.includes(v));
        }
        if (type === 'nat') {
            const val = parseFloat(userAns.value);
            const target = parseFloat(correctAns.value);
            const tol = parseFloat(correctAns.tolerance) || 0.01;
            return Math.abs(val - target) <= tol;
        }
        return false;
    };

    const checkAnswer = () => {
        const userAns = answers[currentQId];
        if (userAns === undefined || userAns === null) return;
        const isCorrect = isAnswerCorrect(userAns, currentQ.correct_answer, currentQ.question_type);
        setChecked(prev => ({ ...prev, [currentQId]: { ...prev[currentQId], isCorrect } }));
        setFeedback({
            isCorrect,
            message: isCorrect ? 'Excellent! That is correct.' : 'Not quite. Try again or reveal the answer.'
        });
    };

    const revealAnswer = () => {
        setChecked(prev => ({ ...prev, [currentQId]: { ...prev[currentQId], revealed: true } }));
    };

    // ─── Persistence ────────────────────────────────────────────
    const saveCurrentAnswer = async () => {
        const qId = currentQId;
        const answer = answers[qId];
        const spent = timer + (timeSpent[qId] || 0);
        setTimeSpent(prev => ({ ...prev, [qId]: spent }));
        if (answer !== undefined && answer !== null) {
            try {
                await revisionApi.saveAnswer(attempt.id, qId, answer, spent);
            } catch (err) { console.error('Save answer error:', err); }
        }
    };

    // ─── Navigation ─────────────────────────────────────────────
    const goTo = async (idx) => {
        await saveCurrentAnswer();
        setTimer(0);
        setFeedback(null);
        setCurrentIdx(idx);
        setVisited(prev => ({ ...prev, [questions[idx]]: true }));
    };

    const handleNext = async (autoAdvance = false) => {
        await saveCurrentAnswer();
        setTimer(0);
        setFeedback(null);
        if (currentIdx + 1 < questions.length) {
            const nextIdx = currentIdx + 1;
            setCurrentIdx(nextIdx);
            setVisited(prev => ({ ...prev, [questions[nextIdx]]: true }));
        } else if (!autoAdvance) {
            handleSubmit();
        }
    };

    const handlePrev = async () => {
        await saveCurrentAnswer();
        setTimer(0);
        if (currentIdx > 0) {
            const prevIdx = currentIdx - 1;
            setCurrentIdx(prevIdx);
            setVisited(prev => ({ ...prev, [questions[prevIdx]]: true }));
        }
    };

    // Save & Next (GATE-style: saves answer, advances)
    const saveAndNext = async () => {
        await handleNext();
    };

    // Mark for Review & Next (GATE-style: marks, then advances)
    const markAndNext = async () => {
        setMarked(prev => ({ ...prev, [currentQId]: true }));
        await handleNext();
    };

    // ─── Pause / Resume ─────────────────────────────────────────
    const pause = async () => {
        clearInterval(timerRef.current);
        setPaused(true);
        setShowPauseMenu(true);
        await saveCurrentAnswer();
        try {
            await revisionApi.pauseAttempt(attempt.id, currentIdx, totalTime);
        } catch (err) { console.error(err); }
    };

    const resume = () => {
        setPaused(false);
        setShowPauseMenu(false);
    };

    const exitSave = async () => {
        await saveCurrentAnswer();
        try {
            await revisionApi.pauseAttempt(attempt.id, currentIdx, totalTime);
        } catch (err) { console.error(err); }
        onExit();
    };

    // ─── Submit ─────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        clearInterval(timerRef.current);
        await saveCurrentAnswer();
        try {
            const result = await revisionApi.completeAttempt(attempt.id, toolId);
            onComplete({ id: attempt.id, ...result });
        } catch (err) {
            alert('Failed to submit test');
            setSubmitting(false);
        }
    };

    // ─── Question Status (for palette) ──────────────────────────
    const getQuestionStatus = (qId) => {
        const isAnswered = answers[qId] !== undefined && answers[qId] !== null;
        const isMarked = !!marked[qId];
        const isVisited = !!visited[qId];
        const isCurrent = qId === currentQId;

        if (isCurrent) return 'current';
        if (isAnswered && isMarked) return 'answered-marked';
        if (isAnswered) return 'answered';
        if (isMarked) return 'marked';
        if (isVisited) return 'not-answered'; // visited but blank
        return 'not-visited';
    };

    // ─── Format Time ────────────────────────────────────────────
    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    return {
        // State
        questions, questionMap, currentIdx, currentQ, currentQId,
        answers, marked, visited, checked, feedback,
        timer, totalTime, timePerQ, timerPct,
        paused, showPauseMenu, submitting, loading,
        isLastQuestion, mode,
        set,

        // Actions
        selectMCQ, toggleMSQ, setNAT, clearResponse,
        toggleMark, checkAnswer, revealAnswer,
        goTo, handleNext, handlePrev, saveAndNext, markAndNext,
        pause, resume, exitSave, handleSubmit,

        // Utils
        getQuestionStatus, formatTime,
    };
}
