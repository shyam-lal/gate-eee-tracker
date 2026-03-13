import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Play, Shuffle, Loader2, BookOpen, History, Clock, AlertCircle } from 'lucide-react';
import { revision as revisionApi } from '../../services/api';

const TYPE_BADGES = {
    mcq: { label: 'MCQ', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    msq: { label: 'MSQ', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    nat: { label: 'NAT', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    tf: { label: 'T/F', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
};

const QuestionBank = ({ set, onStartTest, onBack }) => {
    const [setData, setSetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [inProgress, setInProgress] = useState(null);

    useEffect(() => { loadData(); }, [set.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, hist, prog] = await Promise.all([
                revisionApi.getSet(set.id),
                revisionApi.getAttemptHistory(set.id),
                revisionApi.getInProgressAttempt(set.id)
            ]);
            setSetData(data);
            setHistory(hist);
            setInProgress(prog);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDeleteQuestion = async (qId) => {
        if (!confirm('Remove this question?')) return;
        try {
            await revisionApi.deleteQuestion(qId);
            loadData();
        } catch (err) { alert('Failed to delete question'); }
    };

    const handleStartTest = async (shuffle = false) => {
        if (!setData?.questions?.length) return;
        let order = setData.questions.map(q => q.id);
        if (shuffle) {
            for (let i = order.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [order[i], order[j]] = [order[j], order[i]];
            }
        }
        try {
            const attempt = await revisionApi.createAttempt(set.id, order);
            onStartTest(setData, attempt);
        } catch (err) { alert('Failed to start test'); }
    };

    const handleResumeAttempt = async () => {
        if (!inProgress) return;
        try {
            const attempt = await revisionApi.getAttempt(inProgress.id);
            onStartTest(setData, attempt);
        } catch (err) { alert('Failed to resume'); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-slate-500" size={32} /></div>;
    if (!setData) return null;

    const questions = setData.questions || [];

    return (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 p-2">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{setData.title}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {setData.topics.split(',').map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px] font-black uppercase tracking-widest">{t.trim()}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
                {inProgress && (
                    <button onClick={handleResumeAttempt} className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20">
                        <Play size={14} /> Resume Test
                    </button>
                )}
                <button onClick={() => handleStartTest(false)} disabled={questions.length === 0} className="flex items-center gap-2 px-5 py-3 bg-emerald-500 disabled:bg-slate-800 text-black disabled:text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none">
                    <Play size={14} /> Start Test
                </button>
                <button onClick={() => handleStartTest(true)} disabled={questions.length === 0} className="flex items-center gap-2 px-5 py-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500/30 transition-all disabled:opacity-40">
                    <Shuffle size={14} /> Shuffle & Start
                </button>
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-5 py-3 bg-slate-800 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">
                    <History size={14} /> History ({history.filter(h => h.status === 'completed').length})
                </button>
            </div>

            {/* History Panel */}
            {showHistory && history.length > 0 && (
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-4 duration-300">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Attempt History</h4>
                    <div className="space-y-2">
                        {history.filter(h => h.status === 'completed').map((a, i) => (
                            <div key={a.id} className="flex items-center justify-between bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-slate-500">#{history.filter(h => h.status === 'completed').length - i}</span>
                                    <span className="text-sm font-bold text-white">{a.score}/{a.max_score}</span>
                                    <span className="text-xs text-slate-500">({a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0}%)</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {Math.round((a.time_taken_seconds || 0) / 60)}m</span>
                                    <span>{new Date(a.started_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Questions List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest"><BookOpen size={14} className="inline mr-1" /> {questions.length} Questions</h4>
                </div>

                {questions.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <AlertCircle size={32} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-sm text-slate-400">No questions imported yet. Go back and import questions.</p>
                    </div>
                ) : (
                    questions.map((q, idx) => {
                        const badge = TYPE_BADGES[q.question_type] || TYPE_BADGES.mcq;
                        return (
                            <div key={q.id} className="bg-slate-950/50 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-start gap-4 group transition-colors">
                                <span className="text-xs font-black text-slate-600 mt-1 w-6 text-center shrink-0">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${badge.class}`}>{badge.label}</span>
                                        <span className="text-[10px] font-bold text-slate-500">{q.marks} mark{q.marks > 1 ? 's' : ''}{q.negative_marks > 0 ? ` / -${q.negative_marks}` : ''}</span>
                                    </div>
                                    <p className="text-sm text-white font-medium line-clamp-2">{q.question_text}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                    title="Remove question"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default QuestionBank;
