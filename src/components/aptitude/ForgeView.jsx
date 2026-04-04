import { useState, useEffect, useRef } from 'react';
import { aptitude as api } from '../../services/api';
import { Flame, ArrowLeft, CheckCircle, XCircle, ChevronRight, AlertTriangle, RotateCcw, Trophy } from 'lucide-react';

export default function ForgeView({ node, unitMeta, onComplete, onBack }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [result, setResult] = useState(null);
    const startTime = useRef(Date.now());
    const qStartTime = useRef(Date.now());

    useEffect(() => { loadForge(); }, [node.id]);

    const loadForge = async () => {
        try {
            const data = await api.getForge(node.id);
            if (data.length === 0) throw new Error('No questions available');
            setQuestions(data);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleSelect = (key) => { if (!submitted) setSelected(key); };

    const handleSubmitAnswer = async () => {
        if (!selected) return;
        const q = questions[currentIdx];
        const correct = q.options?.find(o => o.isCorrect)?.key || q.answer;
        const isCorrect = selected === correct;
        const timeTaken = Math.round((Date.now() - qStartTime.current) / 1000);

        const answer = { contentId: q.id, nodeId: node.id, stage: 'forge', selectedAnswer: selected, timeTaken, isCorrect, correctAnswer: correct };
        setAnswers(prev => [...prev, answer]);
        setSubmitted(true);

        // Submit to server
        await api.submitAnswers([{ contentId: q.id, nodeId: node.id, stage: 'forge', selectedAnswer: selected, timeTaken }]).catch(() => {});
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setSelected(null);
            setSubmitted(false);
            qStartTime.current = Date.now();
        } else {
            // Show results
            const totalCorrect = answers.filter(a => a.isCorrect).length;
            const score = Math.round((totalCorrect / answers.length) * 100);
            setResult({ totalCorrect, total: answers.length, score });
            setShowResults(true);
        }
    };

    const handleCompleteStage = async () => {
        setCompleting(true);
        try {
            const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
            await api.completeStage(node.id, { stage: 'forge', score: result.score, timeSpent });
            onComplete();
        } catch (err) {
            setError(err.message);
            setCompleting(false);
        }
    };

    const handleRetry = () => {
        setCurrentIdx(0);
        setSelected(null);
        setSubmitted(false);
        setAnswers([]);
        setShowResults(false);
        setResult(null);
        startTime.current = Date.now();
        qStartTime.current = Date.now();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[300] bg-surface-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${unitMeta.color}40`, borderTopColor: unitMeta.color }} />
                    <p className="text-surface-500 font-bold text-xs uppercase tracking-widest">Loading Forge...</p>
                </div>
            </div>
        );
    }

    if (error || questions.length === 0) {
        return (
            <div className="fixed inset-0 z-[300] bg-surface-950 flex items-center justify-center p-4">
                <div className="bg-surface-900 border border-surface-700 rounded-3xl p-8 max-w-md text-center">
                    <AlertTriangle size={32} className="text-amber-500 mx-auto mb-4" />
                    <p className="text-surface-400 font-bold mb-2">No Forge questions yet</p>
                    <p className="text-surface-600 text-sm mb-6">{error}</p>
                    <button onClick={onBack} className="px-6 py-3 bg-surface-800 text-heading rounded-xl font-bold text-sm">Go Back</button>
                </div>
            </div>
        );
    }

    // Results Screen
    if (showResults && result) {
        const passed = result.score >= 75;
        return (
            <div className="fixed inset-0 z-[300] bg-surface-950 flex items-center justify-center p-4">
                <div className="bg-surface-900 border border-surface-700 rounded-3xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: passed ? `${unitMeta.color}20` : 'rgba(239,68,68,0.15)' }}>
                        {passed ? <Trophy size={36} style={{ color: unitMeta.color }} /> : <XCircle size={36} className="text-rose-500" />}
                    </div>
                    <h2 className="text-2xl font-black text-heading mb-1">{passed ? 'Forge Complete!' : 'Not Quite...'}</h2>
                    <p className="text-surface-500 text-sm mb-6">{passed ? 'Your conceptual foundation is solid.' : 'You need ≥75% to advance. Keep practicing!'}</p>

                    <div className="flex justify-center gap-6 mb-8">
                        <div className="text-center">
                            <p className="text-3xl font-black" style={{ color: passed ? unitMeta.color : '#ef4444' }}>{result.score}%</p>
                            <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">Score</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-black text-heading">{result.totalCorrect}/{result.total}</p>
                            <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">Correct</p>
                        </div>
                    </div>

                    {/* Answer Review */}
                    <div className="mb-8 space-y-2">
                        {answers.map((a, idx) => (
                            <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border text-left ${a.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                                {a.isCorrect ? <CheckCircle size={16} className="text-emerald-500 shrink-0" /> : <XCircle size={16} className="text-rose-500 shrink-0" />}
                                <span className="text-sm text-surface-400 flex-1">Q{idx + 1}: {questions[idx]?.title}</span>
                            </div>
                        ))}
                    </div>

                    {passed ? (
                        <button onClick={handleCompleteStage} disabled={completing}
                            className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: unitMeta.color }}>
                            {completing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue to Arena <ChevronRight size={16} /></>}
                        </button>
                    ) : (
                        <button onClick={handleRetry} className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm flex items-center justify-center gap-3 bg-surface-700 hover:bg-surface-600 transition-all">
                            <RotateCcw size={16} /> Try Again
                        </button>
                    )}
                    <button onClick={onBack} className="w-full mt-3 py-3 text-surface-500 font-bold text-xs uppercase tracking-widest hover:text-surface-300 transition-colors">Back to Skill Tree</button>
                </div>
            </div>
        );
    }

    // Question Screen
    const q = questions[currentIdx];
    const currentAnswer = submitted ? answers[answers.length - 1] : null;

    return (
        <div className="fixed inset-0 z-[300] bg-surface-950 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-surface-950/90 border-b border-surface-800/50">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={onBack} className="p-2 hover:bg-surface-800 rounded-xl text-surface-500 hover:text-heading transition-all"><ArrowLeft size={20} /></button>
                    <div className="flex items-center gap-2">
                        <Flame size={16} style={{ color: unitMeta.color }} />
                        <span className="text-sm font-black text-heading uppercase tracking-tight">The Forge</span>
                    </div>
                    <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">{currentIdx + 1}/{questions.length}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-surface-900"><div className="h-full transition-all duration-500" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, background: unitMeta.color }} /></div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Question */}
                <div className="mb-8">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-3 inline-block ${q.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-400' : q.difficulty === 'hard' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {q.difficulty}
                    </span>
                    <p className="text-lg text-heading font-bold leading-relaxed whitespace-pre-line">{q.body}</p>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-8">
                    {(q.options || []).map(opt => {
                        const isSelected = selected === opt.key;
                        const isCorrectOpt = opt.isCorrect;
                        let borderColor = 'border-surface-800';
                        let bgColor = 'bg-surface-900/40';

                        if (submitted) {
                            if (isCorrectOpt) { borderColor = 'border-emerald-500/50'; bgColor = 'bg-emerald-500/10'; }
                            else if (isSelected && !isCorrectOpt) { borderColor = 'border-rose-500/50'; bgColor = 'bg-rose-500/10'; }
                        } else if (isSelected) {
                            borderColor = 'border-primary-500/50'; bgColor = 'bg-primary-500/10';
                        }

                        return (
                            <button key={opt.key} onClick={() => handleSelect(opt.key)} disabled={submitted}
                                className={`w-full text-left p-4 rounded-2xl border ${borderColor} ${bgColor} transition-all flex items-center gap-4 ${!submitted ? 'hover:border-primary-500/30 cursor-pointer' : ''}`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${isSelected ? 'text-white' : 'text-surface-500 bg-surface-800'}`}
                                    style={isSelected ? { background: submitted ? (isCorrectOpt ? '#10b981' : '#ef4444') : unitMeta.color } : {}}>
                                    {opt.key}
                                </span>
                                <span className="text-surface-300 font-medium flex-1">{opt.text}</span>
                                {submitted && isCorrectOpt && <CheckCircle size={18} className="text-emerald-500 shrink-0" />}
                                {submitted && isSelected && !isCorrectOpt && <XCircle size={18} className="text-rose-500 shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation (shown after submit) */}
                {submitted && currentAnswer && (
                    <div className={`p-4 rounded-2xl border mb-8 ${currentAnswer.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                        <p className={`text-sm font-black uppercase tracking-widest mb-2 ${currentAnswer.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {currentAnswer.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                        </p>
                        {/* Find explanation from submitted answers server response or from question options */}
                    </div>
                )}

                {/* Action Button */}
                {!submitted ? (
                    <button onClick={handleSubmitAnswer} disabled={!selected}
                        className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-30 hover:opacity-90"
                        style={{ background: unitMeta.color }}>
                        Check Answer
                    </button>
                ) : (
                    <button onClick={handleNext}
                        className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:opacity-90"
                        style={{ background: unitMeta.color }}>
                        {currentIdx < questions.length - 1 ? 'Next Question' : 'See Results'} <ChevronRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
