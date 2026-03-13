import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, SkipForward, ChevronLeft, ChevronRight, Flag, X, Loader2, Clock, AlertTriangle, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { revision as revisionApi } from '../../services/api';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/dist/contrib/auto-render.js';

const TestEngine = ({ set, attempt, mode = 'exam', onComplete, onExit }) => {
    const [questions, setQuestions] = useState([]);
    const [questionMap, setQuestionMap] = useState({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});     // { questionId: answer }
    const [timeSpent, setTimeSpent] = useState({}); // { questionId: seconds }
    const [marked, setMarked] = useState({});       // { questionId: true }
    const [timer, setTimer] = useState(0);          // seconds for current question
    const [totalTime, setTotalTime] = useState(attempt?.time_taken_seconds || 0);
    const [paused, setPaused] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [checked, setChecked] = useState({}); // { questionId: { isCorrect, revealed } }
    const [feedback, setFeedback] = useState(null); // { isCorrect, message }

    const timerRef = useRef(null);
    const containerRef = useRef(null);
    const timePerQ = set.time_per_question || 180;

    // Render LaTeX equations whenever the current question or feedback changes
    useEffect(() => {
        if (containerRef.current) {
            renderMathInElement(containerRef.current, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }
    }, [currentIdx, checked, feedback, questions]);

    // Load questions on mount
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const data = await revisionApi.getSet(set.id);
                const allQs = data.questions || [];
                const qMap = {};
                allQs.forEach(q => { qMap[q.id] = q; });
                setQuestionMap(qMap);

                // Use the attempt's question_order
                const order = attempt.question_order || allQs.map(q => q.id);
                setQuestions(order);

                // If resuming, restore answers and position
                if (attempt.answers && attempt.answers.length > 0) {
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
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        loadQuestions();
    }, []);

    // Timer
    useEffect(() => {
        if (paused || loading || mode === 'study') return; // Disable question timer in study mode or if paused
        timerRef.current = setInterval(() => {
            setTimer(t => {
                if (t + 1 >= timePerQ) {
                    // Time's up for this question, auto-advance
                    handleNext(true);
                    return 0;
                }
                return t + 1;
            });
            setTotalTime(t => t + 1);
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [paused, loading, currentIdx, mode]);

    // Secondary timer for total time if in study mode
    useEffect(() => {
        if (paused || loading || mode !== 'study') return;
        const interval = setInterval(() => {
            setTotalTime(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [paused, loading, mode]);

    const currentQId = questions[currentIdx];
    const currentQ = questionMap[currentQId];

    const handleSetAnswer = (answer) => {
        setAnswers(prev => ({ ...prev, [currentQId]: answer }));
    };

    const handleMCQSelect = (optionIdx) => {
        setAnswers(prev => ({ ...prev, [currentQId]: [optionIdx] }));
    };

    const handleMSQToggle = (optionIdx) => {
        setAnswers(prev => {
            const current = Array.isArray(prev[currentQId]) ? [...prev[currentQId]] : [];
            const idx = current.indexOf(optionIdx);
            if (idx >= 0) current.splice(idx, 1);
            else current.push(optionIdx);
            return { ...prev, [currentQId]: current };
        });
    };

    const handleNATInput = (value) => {
        setAnswers(prev => ({ ...prev, [currentQId]: { value: parseFloat(value) || value } }));
    };

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

    const handleCheckAnswer = () => {
        const userAns = answers[currentQId];
        if (userAns === undefined || userAns === null) return;

        const isCorrect = isAnswerCorrect(userAns, currentQ.correct_answer, currentQ.question_type);
        setChecked(prev => ({ ...prev, [currentQId]: { ...prev[currentQId], isCorrect } }));
        setFeedback({
            isCorrect,
            message: isCorrect ? 'Excellent! That is correct.' : 'Not quite. Try again or reveal the answer.'
        });
    };

    const handleRevealAnswer = () => {
        setChecked(prev => ({ ...prev, [currentQId]: { ...prev[currentQId], revealed: true } }));
    };

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

    const handleNext = async (autoAdvance = false) => {
        await saveCurrentAnswer();
        setTimer(0);
        setFeedback(null);
        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(prev => prev + 1);
        } else if (!autoAdvance) {
            // Last question, ask to submit
            handleSubmitTest();
        }
    };

    const handlePrev = async () => {
        await saveCurrentAnswer();
        setTimer(0);
        if (currentIdx > 0) setCurrentIdx(prev => prev - 1);
    };

    const jumpToQuestion = async (idx) => {
        await saveCurrentAnswer();
        setTimer(0);
        setFeedback(null);
        setCurrentIdx(idx);
    };

    const handlePause = async () => {
        clearInterval(timerRef.current);
        setPaused(true);
        setShowPauseMenu(true);
        await saveCurrentAnswer();
        try {
            await revisionApi.pauseAttempt(attempt.id, currentIdx, totalTime);
        } catch (err) { console.error(err); }
    };

    const handleResume = () => {
        setPaused(false);
        setShowPauseMenu(false);
    };

    const handleExitSave = async () => {
        await saveCurrentAnswer();
        try {
            await revisionApi.pauseAttempt(attempt.id, currentIdx, totalTime);
        } catch (err) { console.error(err); }
        onExit();
    };

    const handleSubmitTest = async () => {
        if (submitting) return;
        setSubmitting(true);
        clearInterval(timerRef.current);
        await saveCurrentAnswer();
        try {
            const result = await revisionApi.completeAttempt(attempt.id);
            onComplete({ id: attempt.id, ...result });
        } catch (err) {
            alert('Failed to submit test');
            setSubmitting(false);
        }
    };

    const toggleMark = () => {
        setMarked(prev => ({ ...prev, [currentQId]: !prev[currentQId] }));
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-500" size={32} /></div>;

    const timerPct = (timer / timePerQ) * 100;
    const isLastQuestion = currentIdx === questions.length - 1;

    return (
        <div ref={containerRef} className="fixed inset-0 z-[100] bg-[#020617] flex flex-col">
            {/* Top Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={handlePause} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors" title="Pause">
                        <Pause size={18} />
                    </button>
                    <div className="hidden sm:block">
                        <p className="text-xs font-black text-white uppercase tracking-tight">{set.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold">Q {currentIdx + 1} of {questions.length}</p>
                    </div>
                </div>

                {/* Timer */}
                <div className="flex items-center gap-3">
                    {mode === 'exam' ? (
                        <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
                            <Clock size={14} className={timerPct > 80 ? 'text-red-400' : 'text-slate-400'} />
                            <span className={`text-sm font-mono font-black ${timerPct > 80 ? 'text-red-400' : 'text-white'}`}>{formatTime(timePerQ - timer)}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                            <BookOpen size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Study Mode</span>
                        </div>
                    )}
                    <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2">
                        <span className="text-[10px] text-slate-500 font-bold">Total:</span>
                        <span className="text-xs font-mono font-bold text-slate-400">{formatTime(totalTime)}</span>
                    </div>
                </div>

                <button
                    onClick={handleSubmitTest}
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-500 text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>

            {/* Timer progress bar */}
            <div className="w-full h-1 bg-slate-900 shrink-0">
                <div
                    className={`h-full transition-all duration-1000 linear ${timerPct > 80 ? 'bg-red-500' : timerPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${100 - timerPct}%` }}
                />
            </div>

            {/* Question dots (horizontal scroll) */}
            <div className="bg-slate-900/50 border-b border-slate-800/50 px-4 py-2 overflow-x-auto no-scrollbar shrink-0">
                <div className="flex items-center gap-1.5 min-w-max">
                    {questions.map((qId, idx) => {
                        const isAnswered = answers[qId] !== undefined && answers[qId] !== null;
                        const isCurrent = idx === currentIdx;
                        const isMarked = marked[qId];
                        return (
                            <button
                                key={qId}
                                onClick={() => jumpToQuestion(idx)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${isCurrent ? 'bg-amber-500 text-black border-amber-400 scale-110' :
                                    isMarked ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                        isAnswered ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                            'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Question Content */}
            {currentQ && (
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-3xl mx-auto">
                        {/* Question type badge + marks */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${currentQ.question_type === 'mcq' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                currentQ.question_type === 'msq' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                {currentQ.question_type?.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">{currentQ.marks} mark{currentQ.marks > 1 ? 's' : ''}{currentQ.negative_marks > 0 ? ` | -${currentQ.negative_marks} negative` : ''}</span>
                            <button
                                onClick={toggleMark}
                                className={`ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${marked[currentQId] ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <Flag size={10} /> {marked[currentQId] ? 'Marked' : 'Mark'}
                            </button>
                        </div>

                        {/* Question text */}
                        <h3 className="text-lg md:text-xl font-bold text-white leading-relaxed mb-8">{currentQ.question_text}</h3>

                        {/* Answer area */}
                        {currentQ.question_type === 'nat' ? (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Answer (Numerical)</label>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <input
                                        type="number"
                                        step="any"
                                        disabled={checked[currentQId]?.isCorrect}
                                        value={answers[currentQId]?.value ?? ''}
                                        onChange={e => handleNATInput(e.target.value)}
                                        placeholder="Enter your answer"
                                        className={`w-full max-w-sm bg-slate-900 border rounded-2xl px-5 py-4 text-white text-lg font-mono font-bold outline-none transition-all ${checked[currentQId]?.isCorrect ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 focus:border-amber-500'
                                            }`}
                                        autoFocus
                                    />
                                    {mode === 'study' && !checked[currentQId]?.isCorrect && (
                                        <button onClick={handleCheckAnswer} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all">Check</button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentQ.question_type === 'msq' && (
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Select one or more correct answers</p>
                                )}
                                {(currentQ.options || []).map((opt, optIdx) => {
                                    const isCorrect = currentQ.correct_answer.includes(optIdx);
                                    const selected = currentQ.question_type === 'msq'
                                        ? (Array.isArray(answers[currentQId]) && answers[currentQId].includes(optIdx))
                                        : (Array.isArray(answers[currentQId]) && answers[currentQId][0] === optIdx);

                                    const isRevealed = checked[currentQId]?.revealed;
                                    const isVerified = checked[currentQId]?.isCorrect;

                                    let borderClass = 'border-slate-800 bg-slate-900/50 hover:border-slate-700';
                                    if (selected) borderClass = 'border-amber-500 bg-amber-500/10';
                                    if (mode === 'study' && (isRevealed || (selected && isVerified))) {
                                        if (isCorrect) borderClass = 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
                                        else if (selected) borderClass = 'border-rose-500 bg-rose-500/10';
                                    }

                                    return (
                                        <button
                                            key={optIdx}
                                            disabled={checked[currentQId]?.isCorrect || checked[currentQId]?.revealed}
                                            onClick={() => currentQ.question_type === 'msq' ? handleMSQToggle(optIdx) : handleMCQSelect(optIdx)}
                                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group ${borderClass}`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${selected ? 'bg-amber-500 text-black' :
                                                (mode === 'study' && (isRevealed || isVerified) && isCorrect) ? 'bg-emerald-500 text-white' :
                                                    'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                                                }`}>
                                                {String.fromCharCode(65 + optIdx)}
                                            </div>
                                            <span className={`text-sm font-medium flex-1 ${selected ? 'text-white' : 'text-slate-300'}`}>{opt}</span>
                                            {mode === 'study' && (isRevealed || isVerified) && isCorrect && <CheckCircle2 size={18} className="text-emerald-500 animate-in zoom-in" />}
                                        </button>
                                    );
                                })}
                                {mode === 'study' && !checked[currentQId]?.isCorrect && !checked[currentQId]?.revealed && (
                                    <button onClick={handleCheckAnswer} className="w-full py-4 mt-2 bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600/30 transition-all">Check Selected Answer</button>
                                )}
                            </div>
                        )}

                        {/* Study Feedback Section */}
                        {mode === 'study' && (
                            <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
                                {feedback && (
                                    <div className={`flex items-start gap-4 p-5 rounded-[2rem] border ${feedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                        <div className={`p-2 rounded-xl ${feedback.isCorrect ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                            {feedback.isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black uppercase tracking-widest text-xs mb-1">{feedback.isCorrect ? 'Correct!' : 'Incorrect'}</p>
                                            <p className="text-sm font-medium">{feedback.message}</p>
                                        </div>
                                        {!feedback.isCorrect && !checked[currentQId]?.revealed && (
                                            <button onClick={handleRevealAnswer} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-colors">Reveal Answer</button>
                                        )}
                                    </div>
                                )}

                                {checked[currentQId]?.revealed && (
                                    <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-[2rem] p-6 animate-in fade-in duration-500">
                                        <div className="flex items-center gap-2 mb-4 text-amber-400">
                                            <BookOpen size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">Explanation & Answer</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Correct Answer</p>
                                                <p className="text-sm font-bold text-white">
                                                    {currentQ.question_type === 'nat'
                                                        ? `${currentQ.correct_answer.value} (Tolerance: ±${currentQ.correct_answer.tolerance || 0.01})`
                                                        : currentQ.correct_answer.map(idx => String.fromCharCode(65 + idx)).join(', ')}
                                                </p>
                                            </div>
                                            <div className="text-sm text-slate-300 leading-relaxed study-explanation" dangerouslySetInnerHTML={{ __html: currentQ.explanation }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
                <button
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all disabled:opacity-30"
                >
                    <ChevronLeft size={16} /> Prev
                </button>
                <span className="text-xs font-black text-slate-500">{currentIdx + 1} / {questions.length}</span>
                <button
                    onClick={() => handleNext()}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isLastQuestion
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-amber-500 text-black hover:bg-amber-400'
                        }`}
                >
                    {isLastQuestion ? 'Finish' : 'Next'} <ChevronRight size={16} />
                </button>
            </div>

            {/* Pause Menu Overlay */}
            {showPauseMenu && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-[2rem] p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
                        <Pause size={48} className="text-amber-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Test Paused</h3>
                        <p className="text-sm text-slate-400 mb-6">Your progress has been saved.</p>
                        <div className="space-y-3">
                            <button onClick={handleResume} className="w-full py-3.5 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                                <Play size={16} /> Resume
                            </button>
                            <button onClick={handleExitSave} className="w-full py-3.5 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all">
                                Save & Exit
                            </button>
                            <button onClick={handleSubmitTest} className="w-full py-3.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500/30 transition-all">
                                Submit Test
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestEngine;
