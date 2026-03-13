import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCcw, CheckCircle2, XCircle, Minus, Clock, Target, TrendingUp, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { revision as revisionApi } from '../../services/api';

const TestResults = ({ attemptId, set, onBack, onRetry }) => {
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedQ, setExpandedQ] = useState(null);
    const [setData, setSetData] = useState(null);

    useEffect(() => { loadResults(); }, [attemptId]);

    const loadResults = async () => {
        try {
            setLoading(true);
            const id = typeof attemptId === 'object' ? attemptId.id : attemptId;
            const [attemptData, fullSet] = await Promise.all([
                revisionApi.getAttempt(id),
                set ? revisionApi.getSet(set.id) : null
            ]);
            setAttempt(attemptData);
            setSetData(fullSet);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-slate-500" size={32} /></div>;
    if (!attempt) return null;

    const answers = attempt.answers || [];
    const questions = setData?.questions || [];
    const questionMap = {};
    questions.forEach(q => { questionMap[q.id] = q; });

    const correct = answers.filter(a => a.is_correct).length;
    const wrong = answers.filter(a => !a.is_correct && a.user_answer !== null).length;
    const unanswered = questions.length - answers.length;
    const score = attempt.score || 0;
    const maxScore = attempt.max_score || 1;
    const pct = Math.round((score / maxScore) * 100);
    const totalTime = attempt.time_taken_seconds || 0;

    const getAnswerLabel = (q, answerData) => {
        if (!answerData || answerData === null) return 'Not answered';
        if (q.question_type === 'nat') {
            return answerData.value !== undefined ? String(answerData.value) : 'Not answered';
        }
        if (Array.isArray(answerData)) {
            return answerData.map(i => String.fromCharCode(65 + i)).join(', ');
        }
        return String(answerData);
    };

    const getCorrectLabel = (q) => {
        if (q.question_type === 'nat') {
            const ca = q.correct_answer;
            return `${ca.value}${ca.tolerance ? ` (±${ca.tolerance})` : ''}`;
        }
        if (Array.isArray(q.correct_answer)) {
            return q.correct_answer.map(i => String.fromCharCode(65 + i)).join(', ');
        }
        return String(q.correct_answer);
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 p-2">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Test Results</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{set?.title || 'Revision Set'}</p>
                </div>
            </div>

            {/* Score Hero */}
            <div className={`p-8 rounded-[2.5rem] border mb-8 text-center ${pct >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' :
                    pct >= 40 ? 'bg-amber-500/10 border-amber-500/20' :
                        'bg-rose-500/10 border-rose-500/20'
                }`}>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                    <h1 className="text-6xl font-black text-white">{score}</h1>
                    <span className="text-2xl font-bold text-slate-400">/ {maxScore}</span>
                </div>
                <p className={`text-lg font-black uppercase tracking-widest ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{pct}%</p>

                <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-white/5">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span className="text-2xl font-black text-white">{correct}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Correct</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <XCircle size={16} className="text-rose-400" />
                            <span className="text-2xl font-black text-white">{wrong}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Wrong</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Minus size={16} className="text-slate-400" />
                            <span className="text-2xl font-black text-white">{unanswered}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Skipped</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Clock size={16} className="text-indigo-400" />
                            <span className="text-2xl font-black text-white">{formatTime(totalTime)}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Time</p>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-8">
                <button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20">
                    <RefreshCcw size={16} /> Retry Test
                </button>
                <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">
                    <ArrowLeft size={16} /> Back to Set
                </button>
            </div>

            {/* Per-Question Breakdown */}
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Question Breakdown</h4>
            <div className="space-y-2">
                {questions.map((q, idx) => {
                    const ans = answers.find(a => a.question_id === q.id);
                    const isCorrect = ans?.is_correct;
                    const isExpanded = expandedQ === q.id;

                    return (
                        <div key={q.id} className={`border rounded-2xl transition-all ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' :
                                ans && !isCorrect ? 'bg-rose-500/5 border-rose-500/20' :
                                    'bg-slate-900/50 border-slate-800'
                            }`}>
                            <button onClick={() => setExpandedQ(isExpanded ? null : q.id)} className="w-full flex items-center gap-3 p-4 text-left">
                                <span className="text-xs font-black text-slate-500 w-6 text-center shrink-0">{idx + 1}</span>
                                {isCorrect ? (
                                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                ) : ans ? (
                                    <XCircle size={18} className="text-rose-400 shrink-0" />
                                ) : (
                                    <Minus size={18} className="text-slate-500 shrink-0" />
                                )}
                                <p className="text-sm text-white font-medium flex-1 line-clamp-1">
                                    {q.question_text}
                                </p>
                                {ans && (
                                    <span className="text-[10px] text-slate-500 font-bold shrink-0 mr-2">
                                        {ans.time_spent_seconds ? formatTime(ans.time_spent_seconds) : ''}
                                    </span>
                                )}
                                {isExpanded ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                            </button>
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">{q.question_text}</p>

                                    {q.options && (
                                        <div className="space-y-1.5 mb-4">
                                            {q.options.map((opt, oi) => {
                                                const isUserAnswer = ans?.user_answer && (Array.isArray(ans.user_answer) ? ans.user_answer.includes(oi) : false);
                                                const isCorrectOpt = Array.isArray(q.correct_answer) && q.correct_answer.includes(oi);
                                                return (
                                                    <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isCorrectOpt ? 'bg-emerald-500/10 text-emerald-400' :
                                                            isUserAnswer ? 'bg-rose-500/10 text-rose-400' :
                                                                'text-slate-400'
                                                        }`}>
                                                        <span className="font-black w-5">{String.fromCharCode(65 + oi)}</span>
                                                        <span className="font-medium">{opt}</span>
                                                        {isCorrectOpt && <CheckCircle2 size={12} className="ml-auto" />}
                                                        {isUserAnswer && !isCorrectOpt && <XCircle size={12} className="ml-auto" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {q.question_type === 'nat' && (
                                        <div className="flex gap-4 mb-4 text-xs">
                                            <div><span className="text-slate-500 font-bold">Your answer: </span><span className="text-white font-bold">{getAnswerLabel(q, ans?.user_answer)}</span></div>
                                            <div><span className="text-slate-500 font-bold">Correct: </span><span className="text-emerald-400 font-bold">{getCorrectLabel(q)}</span></div>
                                        </div>
                                    )}

                                    {q.explanation && (
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 mt-2">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Explanation</p>
                                            <p className="text-xs text-slate-300 leading-relaxed">{q.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TestResults;
