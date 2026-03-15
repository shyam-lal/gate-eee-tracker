import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Trash2, Play, History, ArrowLeft, BarChart3, Clock, Target, BookOpen, Loader2 } from 'lucide-react';
import { revision as revisionApi } from '../../services/api';
import SetCreator from './SetCreator';
import QuestionBank from './QuestionBank';
import TestEngine from './TestEngine';
import TestResults from './TestResults';

const RevisionDashboard = ({ tool }) => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'create', 'questions', 'test', 'results'
    const [activeSet, setActiveSet] = useState(null);
    const [activeAttempt, setActiveAttempt] = useState(null);
    const [testMode, setTestMode] = useState('exam'); // 'exam' or 'study'

    useEffect(() => { loadSets(); }, []);

    const loadSets = async () => {
        try {
            setLoading(true);
            const data = await revisionApi.getUserSets();
            setSets(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSetCreated = (newSet) => {
        setActiveSet(newSet);
        setView('questions');
        loadSets();
    };

    const handleDeleteSet = async (setId) => {
        if (!confirm('Delete this revision set and all its questions?')) return;
        try {
            await revisionApi.deleteSet(setId);
            loadSets();
        } catch (err) { alert('Failed to delete set'); }
    };

    const handleStartTest = (set, attempt, mode = 'exam') => {
        setActiveSet(set);
        setActiveAttempt(attempt);
        setTestMode(mode);
        setView('test');
    };

    const handleTestComplete = (attempt) => {
        setActiveAttempt(attempt);
        setView('results');
        loadSets();
    };

    const goBack = () => {
        setView('list');
        setActiveSet(null);
        setActiveAttempt(null);
        loadSets();
    };

    if (view === 'create') {
        return <SetCreator onCreated={handleSetCreated} onBack={() => setView('list')} />;
    }

    if (view === 'questions' && activeSet) {
        return <QuestionBank set={activeSet} onStartTest={handleStartTest} onBack={goBack} />;
    }

    if (view === 'test' && activeSet) {
        return <TestEngine set={activeSet} attempt={activeAttempt} mode={testMode} toolId={tool?.id} onComplete={handleTestComplete} onExit={goBack} />;
    }

    if (view === 'results' && activeAttempt) {
        return <TestResults attemptId={activeAttempt.id || activeAttempt} set={activeSet} onBack={goBack} onRetry={() => {
            setActiveAttempt(null);
            setView('questions');
        }} />;
    }

    // Main Set Listing
    return (
        <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-300 p-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <ClipboardCheck className="text-amber-400" size={32} /> Revision Tests
                    </h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Generate • Review • Test • Improve</p>
                </div>
                <button
                    onClick={() => setView('create')}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                >
                    <Plus size={16} /> New Revision Set
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-slate-500" size={32} />
                </div>
            ) : sets.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <ClipboardCheck size={64} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">No Revision Sets Yet</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">Create your first revision set by entering topics and pasting AI-generated questions.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sets.map(set => (
                        <div key={set.id} className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:border-amber-500/20 transition-all group relative">
                            {/* Delete button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                                className="absolute top-4 right-4 p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete Set"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="cursor-pointer" onClick={() => { setActiveSet(set); setView('questions'); }}>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 pr-8">{set.title}</h3>

                                {/* Topic tags */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {set.topics.split(',').map((t, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                            {t.trim()}
                                        </span>
                                    ))}
                                </div>

                                {/* Stats row */}
                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><BookOpen size={12} /> {set.actual_question_count || 0} Qs</span>
                                    <span className="flex items-center gap-1"><Play size={12} /> {set.attempt_count || 0} Attempts</span>
                                    {set.best_score !== null && set.best_max_score && (
                                        <span className="flex items-center gap-1 text-emerald-400">
                                            <Target size={12} /> Best: {set.best_score}/{set.best_max_score}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RevisionDashboard;
