import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, SkipForward, ChevronLeft, ChevronRight, Flag, X, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { revision as revisionApi } from '../../services/api';

const TestEngine = ({ set, attempt, onComplete, onExit }) => {
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

    const timerRef = useRef(null);
    const timePerQ = set.time_per_question || 180;

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
        if (paused || loading) return;
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
    }, [paused, loading, currentIdx]);

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
        <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col">
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
                    <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
                        <Clock size={14} className={timerPct > 80 ? 'text-red-400' : 'text-slate-400'} />
                        <span className={`text-sm font-mono font-black ${timerPct > 80 ? 'text-red-400' : 'text-white'}`}>{formatTime(timePerQ - timer)}</span>
                    </div>
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
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Answer (Numerical)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={answers[currentQId]?.value ?? ''}
                                    onChange={e => handleNATInput(e.target.value)}
                                    placeholder="Enter your answer"
                                    className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white text-lg font-mono font-bold focus:border-amber-500 outline-none transition-colors"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentQ.question_type === 'msq' && (
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Select one or more correct answers</p>
                                )}
                                {(currentQ.options || []).map((opt, optIdx) => {
                                    const selected = currentQ.question_type === 'msq'
                                        ? (Array.isArray(answers[currentQId]) && answers[currentQId].includes(optIdx))
                                        : (Array.isArray(answers[currentQId]) && answers[currentQId][0] === optIdx);

                                    return (
                                        <button
                                            key={optIdx}
                                            onClick={() => currentQ.question_type === 'msq' ? handleMSQToggle(optIdx) : handleMCQSelect(optIdx)}
                                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group ${selected
                                                    ? 'border-amber-500 bg-amber-500/10'
                                                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${selected ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                                                }`}>
                                                {String.fromCharCode(65 + optIdx)}
                                            </div>
                                            <span className={`text-sm font-medium ${selected ? 'text-white' : 'text-slate-300'}`}>{opt}</span>
                                        </button>
                                    );
                                })}
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
