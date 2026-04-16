import React, { useState, useEffect, useRef } from 'react';
import { battlePlan as api } from '../../services/api';
import {
    ArrowLeft, Target, Flame, Clock, Play, CheckCircle, SkipForward,
    BookOpen, RotateCcw, Zap, ChevronRight, Trophy, Sparkles,
    RefreshCw, AlertCircle, Coffee, Shield
} from 'lucide-react';

const BattlePlan = ({ onBack }) => {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // taskId being acted on
    const [completeModal, setCompleteModal] = useState(null); // { taskId, duration }
    const [actualMinutes, setActualMinutes] = useState('');
    const [showAllDone, setShowAllDone] = useState(false);

    useEffect(() => {
        loadPlan();
    }, []);

    const loadPlan = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getToday();
            setPlan(data);
            if (data.status === 'COMPLETED') setShowAllDone(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTask = async (taskId) => {
        setActionLoading(taskId);
        try {
            const data = await api.startTask(taskId);
            setPlan(data);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const handleCompleteTask = async (taskId) => {
        const task = plan?.tasks?.find(t => t.id === taskId);
        setCompleteModal({ taskId, duration: task?.duration_minutes || 0 });
        setActualMinutes(String(task?.duration_minutes || ''));
    };

    const submitComplete = async () => {
        if (!completeModal) return;
        setActionLoading(completeModal.taskId);
        try {
            const data = await api.completeTask(completeModal.taskId, parseInt(actualMinutes) || 0);
            setPlan(data);
            if (data.message || data.status === 'COMPLETED') setShowAllDone(true);
            setCompleteModal(null);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const handleSkipTask = async (taskId) => {
        if (!confirm('Skip this task? It will be rescheduled for tomorrow.')) return;
        setActionLoading(taskId);
        try {
            const data = await api.skipTask(taskId);
            setPlan(data);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const handleRegenerate = async () => {
        if (!confirm('Regenerate today\'s plan? This will replace all current tasks.')) return;
        setLoading(true);
        try {
            const data = await api.regenerate();
            setPlan(data);
            setShowAllDone(false);
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    const formatDuration = (mins) => {
        if (!mins) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
    };

    const getTaskTypeIcon = (type) => {
        switch (type) {
            case 'LEARN': return <BookOpen size={16} />;
            case 'REVISE': return <RotateCcw size={16} />;
            case 'FLASHCARD': return <Zap size={16} />;
            default: return <Target size={16} />;
        }
    };

    const getTaskTypeColor = (type) => {
        switch (type) {
            case 'LEARN': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'REVISE': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'FLASHCARD': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            default: return 'text-primary-400 bg-primary-500/10 border-primary-500/20';
        }
    };

    const getStatusIndicator = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle size={18} className="text-emerald-400" />;
            case 'ACTIVE': return <div className="w-4 h-4 bg-primary-500 rounded-full animate-pulse shadow-lg shadow-primary-500/50" />;
            case 'SKIPPED': return <SkipForward size={18} className="text-surface-600" />;
            default: return <div className="w-4 h-4 border-2 border-surface-600 rounded-full" />;
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto" />
                    <p className="text-surface-500 text-xs font-black uppercase tracking-widest">Generating Battle Plan...</p>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto">
                        <AlertCircle size={40} className="text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-heading text-xl font-black uppercase tracking-tighter mb-2">Plan Unavailable</h2>
                        <p className="text-surface-400 text-sm">{error}</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button onClick={onBack} className="px-6 py-3 bg-surface-800 text-heading rounded-2xl font-black text-xs uppercase tracking-widest">Back</button>
                        <button onClick={loadPlan} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!plan) return null;

    const { summary, current_task, tasks, status, safeguards } = plan;
    const progressPercent = summary?.progress_percent || 0;

    return (
        <div className="min-h-screen bg-transparent text-surface-400 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[var(--color-glow1)] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[var(--color-glow2)] rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="relative z-20 px-4 sm:px-6 lg:px-8 pt-6 pb-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="p-2 text-surface-500 hover:text-heading transition-colors rounded-xl hover:bg-surface-800/50">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        {safeguards?.is_buffer_day && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                                <Coffee size={10} /> Buffer Day
                            </span>
                        )}
                        {safeguards?.is_inactive_restart && (
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 px-3 py-1.5 rounded-full font-black uppercase tracking-widest">
                                Welcome Back
                            </span>
                        )}
                        <button onClick={handleRegenerate} className="p-2 text-surface-500 hover:text-primary-400 transition-colors rounded-xl hover:bg-surface-800/50" title="Regenerate plan">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Title + Date */}
                <div className="mb-6">
                    <span className="inline-flex items-center gap-2 text-primary-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                        <Shield size={12} /> Daily Battle Plan
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-heading uppercase tracking-tighter leading-[0.9]">
                        {new Date(plan.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h1>
                </div>

                {/* Progress Bar + Stats */}
                <div className="bg-surface-900/40 backdrop-blur-xl border border-white/[var(--glass-border-opacity)] rounded-3xl p-5 sm:p-6 space-y-4">
                    {/* Progress bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-black text-heading tracking-tighter">{progressPercent}%</span>
                                <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Complete</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-500">
                                <Flame size={14} fill="currentColor" />
                                <span className="text-sm font-black tracking-tighter">{summary?.streak || 0}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-surface-600">day streak</span>
                            </div>
                        </div>
                        <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-1000 ease-out relative"
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                            <p className="text-lg font-black text-heading tracking-tighter">{formatDuration(summary?.completed_minutes)}</p>
                            <p className="text-[9px] font-black text-surface-600 uppercase tracking-widest">Done</p>
                        </div>
                        <div className="text-center border-x border-surface-800">
                            <p className="text-lg font-black text-primary-400 tracking-tighter">{formatDuration(summary?.remaining_minutes)}</p>
                            <p className="text-[9px] font-black text-surface-600 uppercase tracking-widest">Left</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-heading tracking-tighter">{summary?.completed_count}/{summary?.total_count}</p>
                            <p className="text-[9px] font-black text-surface-600 uppercase tracking-widest">Tasks</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 space-y-4">

                {/* Current Task Card */}
                {current_task && status !== 'COMPLETED' && (
                    <div className="bg-gradient-to-br from-primary-600/20 to-primary-900/20 backdrop-blur-xl border border-primary-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary-500/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Target size={14} className="text-primary-400" />
                            <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">Current Mission</span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-heading uppercase tracking-tighter mb-1">
                            {current_task.topic_name}
                        </h2>
                        <p className="text-xs text-surface-400 font-bold uppercase tracking-widest mb-6">{current_task.subject_name}</p>

                        <div className="flex items-center gap-4 mb-6">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${getTaskTypeColor(current_task.type)}`}>
                                {current_task.type}
                            </span>
                            <span className="text-surface-400 text-sm font-bold flex items-center gap-1.5">
                                <Clock size={14} /> {formatDuration(current_task.duration_minutes)}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleCompleteTask(current_task.id)}
                                disabled={actionLoading === current_task.id}
                                className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary-500/25 active:scale-[0.98] disabled:opacity-50"
                            >
                                <CheckCircle size={16} /> Mark Complete
                            </button>
                            <button
                                onClick={() => handleSkipTask(current_task.id)}
                                disabled={actionLoading === current_task.id}
                                className="px-5 py-4 bg-surface-800/80 hover:bg-surface-700 text-surface-300 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                <SkipForward size={16} /> Skip
                            </button>
                        </div>
                    </div>
                )}

                {/* All Done Card */}
                {showAllDone && status === 'COMPLETED' && (
                    <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl shadow-emerald-500/10">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto">
                            <Trophy size={40} className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-black text-heading uppercase tracking-tighter">Mission Complete</h2>
                        <p className="text-surface-400 text-sm">You've conquered today's battle plan. Rest up and come back stronger tomorrow.</p>
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                            <Flame size={16} fill="currentColor" />
                            <span className="text-lg font-black">{summary?.streak || 0} day streak</span>
                        </div>
                    </div>
                )}

                {/* Task List */}
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-[0.3em] px-1 pt-2">
                        {status === 'COMPLETED' ? 'Completed Tasks' : 'Mission Queue'}
                    </h3>

                    {tasks?.map((task, idx) => (
                        <div
                            key={task.id}
                            className={`
                                bg-surface-900/40 backdrop-blur-xl border rounded-2xl p-4 sm:p-5 transition-all
                                ${task.status === 'ACTIVE' ? 'border-primary-500/40 bg-primary-500/5 shadow-lg shadow-primary-500/5' :
                                  task.status === 'COMPLETED' ? 'border-emerald-500/20 opacity-70' :
                                  task.status === 'SKIPPED' ? 'border-surface-800 opacity-40' :
                                  'border-white/[var(--glass-border-opacity)] hover:border-surface-600'}
                            `}
                        >
                            <div className="flex items-start gap-3 sm:gap-4">
                                {/* Status indicator */}
                                <div className="pt-0.5 shrink-0">
                                    {getStatusIndicator(task.status)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className={`font-black uppercase tracking-tighter text-sm sm:text-base leading-tight ${
                                            task.status === 'COMPLETED' ? 'text-surface-500 line-through' :
                                            task.status === 'SKIPPED' ? 'text-surface-600 line-through' :
                                            task.status === 'ACTIVE' ? 'text-heading' : 'text-surface-300'
                                        }`}>
                                            {task.topic_name}
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">{task.subject_name}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getTaskTypeColor(task.type)}`}>
                                            {task.type}
                                        </span>
                                        <span className="text-xs text-surface-500 font-bold flex items-center gap-1">
                                            <Clock size={10} /> {formatDuration(task.duration_minutes)}
                                        </span>
                                        {task.carryover && (
                                            <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">↻ Carried Over</span>
                                        )}
                                    </div>
                                </div>

                                {/* Action */}
                                {task.status === 'PENDING' && (
                                    <button
                                        onClick={() => handleStartTask(task.id)}
                                        disabled={actionLoading === task.id}
                                        className="shrink-0 p-2.5 bg-surface-800 hover:bg-primary-600 text-surface-400 hover:text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                        title="Start this task"
                                    >
                                        <Play size={16} fill="currentColor" />
                                    </button>
                                )}
                                {task.status === 'ACTIVE' && (
                                    <div className="flex gap-1.5 shrink-0">
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            disabled={actionLoading === task.id}
                                            className="p-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                            title="Complete"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleSkipTask(task.id)}
                                            disabled={actionLoading === task.id}
                                            className="p-2.5 bg-surface-800 hover:bg-surface-700 text-surface-400 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                            title="Skip"
                                        >
                                            <SkipForward size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Complete Task Modal */}
            {completeModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setCompleteModal(null)}>
                    <div className="bg-surface-950 border border-surface-700 p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="font-black text-heading text-xl mb-2 uppercase tracking-tighter flex items-center gap-2">
                            <CheckCircle size={20} className="text-emerald-400" /> Task Complete
                        </h3>
                        <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-6">How long did you actually study?</p>

                        <div className="mb-6">
                            <div className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-2xl p-4">
                                <input
                                    type="number"
                                    min="0"
                                    className="flex-1 bg-transparent text-heading text-2xl font-black text-center outline-none"
                                    value={actualMinutes}
                                    onChange={e => setActualMinutes(e.target.value)}
                                    autoFocus
                                />
                                <span className="text-surface-500 text-sm font-black uppercase">min</span>
                            </div>
                            <p className="text-[10px] text-surface-600 font-bold text-center mt-2">Planned: {completeModal.duration} min</p>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setCompleteModal(null)} className="flex-1 bg-surface-800 text-heading py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Cancel</button>
                            <button
                                onClick={submitComplete}
                                disabled={actionLoading === completeModal.taskId}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BattlePlan;
