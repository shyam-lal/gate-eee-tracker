import { useState, useEffect, useRef, useCallback } from 'react';
import { aptitude as api } from '../../services/api';
import { Trophy, ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, RotateCcw, ChevronRight, Flag } from 'lucide-react';

export default function ArenaView({ node, unitMeta, onComplete, onBack }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [result, setResult] = useState(null);
    const [completing, setCompleting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const startTime = useRef(Date.now());
    const timerRef = useRef(null);

    useEffect(() => { loadArena(); return () => clearInterval(timerRef.current); }, [node.id]);

    const loadArena = async () => {
        try {
            const data = await api.getArena(node.id);
            if (data.length === 0) throw new Error('No questions available');
            setQuestions(data);
            // Calculate total time from all questions
            const total = data.reduce((sum, q) => sum + (q.time_limit_seconds || 60), 0);
            setTotalTime(total);
            setTimeLeft(total);
            // Start global timer
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    // Auto-submit when time runs out
    useEffect(() => {
        if (timeLeft === 0 && questions.length > 0 && !showResults && !submitting) {
            handleSubmitAll();
        }
    }, [timeLeft]);

    const handleSelect = (key) => {
        setSelectedAnswers(prev => ({ ...prev, [currentIdx]: key }));
    };

    const handleSubmitAll = async () => {
        if (submitting) return;
        setSubmitting(true);
        clearInterval(timerRef.current);

        try {
            const answers = questions.map((q, idx) => ({
                contentId: q.id, nodeId: node.id, stage: 'arena',
                selectedAnswer: selectedAnswers[idx] || null,
                timeTaken: Math.round((q.time_limit_seconds || 60))
            }));

            const response = await api.submitAnswers(answers);
            setResult(response);
            setShowResults(true);
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    const handleCompleteStage = async () => {
        setCompleting(true);
        try {
            const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
            await api.completeStage(node.id, { stage: 'arena', score: result.score, timeSpent });
            onComplete();
        } catch (err) {
            setError(err.message);
            setCompleting(false);
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[300] bg-surface-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${unitMeta.color}40`, borderTopColor: unitMeta.color }} />
                    <p className="text-surface-500 font-bold text-xs uppercase tracking-widest">Loading Arena...</p>
                </div>
            </div>
        );
    }

    if (error || questions.length === 0) {
        return (
            <div className="fixed inset-0 z-[300] bg-surface-950 flex items-center justify-center p-4">
                <div className="bg-surface-900 border border-surface-700 rounded-3xl p-8 max-w-md text-center">
                    <AlertTriangle size={32} className="text-amber-500 mx-auto mb-4" />
                    <p className="text-surface-400 font-bold mb-2">No Arena questions yet</p>
                    <p className="text-surface-600 text-sm mb-6">{error}</p>
                    <button onClick={onBack} className="px-6 py-3 bg-surface-800 text-heading rounded-xl font-bold text-sm">Go Back</button>
                </div>
            </div>
        );
    }

    // Results Screen
    if (showResults && result) {
        const passed = result.score >= 60;
        return (
            <div className="fixed inset-0 z-[300] bg-surface-950 overflow-y-auto no-scrollbar">
                <div className="max-w-lg mx-auto p-6 py-12">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                            style={{ background: passed ? `${unitMeta.color}20` : 'rgba(239,68,68,0.15)' }}>
                            {passed ? <Trophy size={40} style={{ color: unitMeta.color }} /> : <XCircle size={40} className="text-rose-500" />}
                        </div>
                        <h2 className="text-3xl font-black text-heading mb-1">{passed ? 'Node Mastered! 🎯' : 'Keep Going!'}</h2>
                        <p className="text-surface-500 text-sm">{passed ? 'Outstanding performance. This node is complete.' : 'You need ≥60% to master this node.'}</p>
                    </div>

                    <div className="flex justify-center gap-8 mb-8">
                        <div className="text-center">
                            <p className="text-4xl font-black" style={{ color: passed ? unitMeta.color : '#ef4444' }}>{result.score}%</p>
                            <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">Score</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-black text-heading">{result.totalCorrect}/{result.totalQuestions}</p>
                            <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">Correct</p>
                        </div>
                    </div>

                    {/* Detailed Results */}
                    <div className="space-y-3 mb-8">
                        {result.results.map((r, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border ${r.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                                <div className="flex items-start gap-3">
                                    {r.isCorrect ? <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" /> : <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-heading font-bold mb-1">Q{idx + 1}: {questions[idx]?.title}</p>
                                        {!r.isCorrect && (
                                            <p className="text-xs text-surface-500">
                                                Your answer: <span className="text-rose-400 font-bold">{r.selectedAnswer || '—'}</span> · Correct: <span className="text-emerald-400 font-bold">{r.correctAnswer}</span>
                                            </p>
                                        )}
                                        {r.explanation && <p className="text-xs text-surface-500 mt-2 leading-relaxed">{r.explanation}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {passed ? (
                        <button onClick={handleCompleteStage} disabled={completing}
                            className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: `linear-gradient(135deg, ${unitMeta.color}, ${unitMeta.color}cc)`, boxShadow: `0 0 30px ${unitMeta.color}30` }}>
                            {completing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={18} /> Mark as Mastered</>}
                        </button>
                    ) : (
                        <button onClick={() => { window.location.reload(); }}
                            className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm flex items-center justify-center gap-3 bg-surface-700 hover:bg-surface-600 transition-all">
                            <RotateCcw size={16} /> Try Again
                        </button>
                    )}
                    <button onClick={onBack} className="w-full mt-3 py-3 text-surface-500 font-bold text-xs uppercase tracking-widest hover:text-surface-300 transition-colors">Back to Skill Tree</button>
                </div>
            </div>
        );
    }

    // Quiz Screen
    const q = questions[currentIdx];
    const isUrgent = timeLeft < 30;
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
        <div className="fixed inset-0 z-[300] bg-surface-950 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-surface-950/90 border-b border-surface-800/50">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={onBack} className="p-2 hover:bg-surface-800 rounded-xl text-surface-500 hover:text-heading transition-all"><ArrowLeft size={20} /></button>
                    <div className="flex items-center gap-2">
                        <Trophy size={16} style={{ color: unitMeta.color }} />
                        <span className="text-sm font-black text-heading uppercase tracking-tight">The Arena</span>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${isUrgent ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-surface-800 text-surface-400'}`}>
                        <Clock size={14} />
                        <span className="text-sm font-black font-mono">{formatTime(timeLeft)}</span>
                    </div>
                </div>
                <div className="h-1 bg-surface-900"><div className="h-full transition-all duration-500" style={{ width: `${(timeLeft / totalTime) * 100}%`, background: isUrgent ? '#ef4444' : unitMeta.color }} /></div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Question navigator */}
                <div className="flex gap-2 mb-6 justify-center flex-wrap">
                    {questions.map((_, idx) => (
                        <button key={idx} onClick={() => setCurrentIdx(idx)}
                            className={`w-9 h-9 rounded-lg font-black text-xs transition-all ${
                                idx === currentIdx ? 'text-white scale-110' : selectedAnswers[idx] ? 'text-white/80 opacity-70' : 'bg-surface-800 text-surface-500 hover:bg-surface-700'}`}
                            style={idx === currentIdx || selectedAnswers[idx] ? { background: unitMeta.color } : {}}>
                            {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Question */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${q.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-400' : q.difficulty === 'hard' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {q.difficulty}
                        </span>
                        <span className="text-[10px] font-bold text-surface-600">Q{currentIdx + 1} of {questions.length}</span>
                    </div>
                    <p className="text-lg text-heading font-bold leading-relaxed whitespace-pre-line">{q.body}</p>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-8">
                    {(q.options || []).map(opt => {
                        const isSelected = selectedAnswers[currentIdx] === opt.key;
                        return (
                            <button key={opt.key} onClick={() => handleSelect(opt.key)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 hover:border-primary-500/30 cursor-pointer ${isSelected ? 'border-primary-500/50 bg-primary-500/10' : 'border-surface-800 bg-surface-900/40'}`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${isSelected ? 'text-white' : 'text-surface-500 bg-surface-800'}`}
                                    style={isSelected ? { background: unitMeta.color } : {}}>
                                    {opt.key}
                                </span>
                                <span className="text-surface-300 font-medium flex-1">{opt.text}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Nav + Submit */}
                <div className="flex gap-3">
                    {currentIdx > 0 && (
                        <button onClick={() => setCurrentIdx(prev => prev - 1)} className="flex-1 py-4 rounded-2xl font-black text-surface-300 uppercase tracking-widest text-sm bg-surface-800 hover:bg-surface-700 transition-all">
                            ← Previous
                        </button>
                    )}
                    {currentIdx < questions.length - 1 ? (
                        <button onClick={() => setCurrentIdx(prev => prev + 1)}
                            className="flex-1 py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm transition-all hover:opacity-90"
                            style={{ background: unitMeta.color }}>
                            Next →
                        </button>
                    ) : (
                        <button onClick={handleSubmitAll} disabled={submitting}
                            className="flex-1 py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: `linear-gradient(135deg, ${unitMeta.color}, #ef4444)` }}>
                            {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Flag size={16} /> Submit ({answeredCount}/{questions.length})</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
