import React from 'react';
import {
    BookOpen, RotateCcw, Zap, Clock, Star, CheckCircle, SkipForward,
    Play, ChevronRight, Flame, TrendingUp, Target, AlertTriangle, ArrowUpRight
} from 'lucide-react';

const REASON_CONFIG = {
    CARRYOVER: { label: 'Carried Over', icon: '↻', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    HIGH_WEIGHTAGE: { label: 'High Weightage', icon: '⚡', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    LOW_CONFIDENCE: { label: 'Needs Work', icon: '📉', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    URGENT: { label: 'Urgent', icon: '🔥', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    EASY_WIN: { label: 'Easy Win', icon: '✨', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    CHALLENGING: { label: 'Challenging', icon: '💪', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    PRIORITY_PICK: { label: 'Priority', icon: '🎯', color: 'text-primary-400 bg-primary-500/10 border-primary-500/20' },
};

const TYPE_CONFIG = {
    LEARN: { label: 'Learn', icon: BookOpen, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    REVISE: { label: 'Revise', icon: RotateCcw, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    FLASHCARD: { label: 'Flashcard', icon: Zap, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const formatDuration = (mins) => {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
};

const DifficultyStars = ({ level }) => {
    const stars = Math.min(5, Math.max(1, level || 3));
    return (
        <div className="flex items-center gap-0.5" title={`Difficulty: ${stars}/5`}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    size={10}
                    className={i <= stars ? 'text-amber-400' : 'text-surface-600'}
                    fill={i <= stars ? 'currentColor' : 'none'}
                />
            ))}
        </div>
    );
};

/**
 * TaskCard - Renders a single task in the mission queue.
 * Variant "hero" renders the large current-task card.
 * Variant "queue" renders a compact queue card.
 */
const TaskCard = ({
    task,
    variant = 'queue', // 'hero' | 'queue'
    onComplete,
    onSkip,
    onStart,
    actionLoading,
}) => {
    const typeConfig = TYPE_CONFIG[task.type] || TYPE_CONFIG.LEARN;
    const TypeIcon = typeConfig.icon;
    const reasons = task.reasons || [];
    const isActive = task.status === 'ACTIVE';
    const isCompleted = task.status === 'COMPLETED';
    const isSkipped = task.status === 'SKIPPED';
    const isPending = task.status === 'PENDING';
    const isLoading = actionLoading === task.id;

    // ─── Hero Card (current active task) ───
    if (variant === 'hero' && isActive) {
        return (
            <div className="bg-gradient-to-br from-primary-600/20 to-primary-900/20 backdrop-blur-xl border border-primary-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary-500/10">
                <div className="flex items-center gap-2 mb-4">
                    <Target size={14} className="text-primary-400" />
                    <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">Current Mission</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-heading uppercase tracking-tighter mb-1">
                    {task.topic_name}
                </h2>
                <p className="text-xs text-surface-400 font-bold uppercase tracking-widest mb-4">{task.subject_name}</p>

                {/* Meta row */}
                <div className="flex items-center gap-3 flex-wrap mb-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${typeConfig.color}`}>
                        <TypeIcon size={12} /> {typeConfig.label}
                    </span>
                    <span className="text-surface-400 text-sm font-bold flex items-center gap-1.5">
                        <Clock size={14} /> {formatDuration(task.duration_minutes)}
                    </span>
                    <DifficultyStars level={task.difficulty_stars || task.difficulty_level} />
                </div>

                {/* Reason tags */}
                {reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                        {reasons.map(reason => {
                            const config = REASON_CONFIG[reason];
                            if (!config) return null;
                            return (
                                <span key={reason} className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${config.color}`}>
                                    {config.icon} {config.label}
                                </span>
                            );
                        })}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => onComplete?.(task.id)}
                        disabled={isLoading}
                        className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary-500/25 active:scale-[0.98] disabled:opacity-50"
                    >
                        <CheckCircle size={16} /> Mark Complete
                    </button>
                    <button
                        onClick={() => onSkip?.(task.id)}
                        disabled={isLoading}
                        className="px-5 py-4 bg-surface-800/80 hover:bg-surface-700 text-surface-400 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <SkipForward size={16} /> Skip
                    </button>
                </div>
            </div>
        );
    }

    // ─── Queue Card (compact) ───
    const statusIndicator = isCompleted
        ? <CheckCircle size={18} className="text-emerald-400" />
        : isActive
        ? <div className="w-4 h-4 bg-primary-500 rounded-full animate-pulse shadow-lg shadow-primary-500/50" />
        : isSkipped
        ? <SkipForward size={18} className="text-body opacity-60" />
        : <div className="w-4 h-4 border-2 border-body opacity-40 rounded-full" />;

    return (
        <div className={`bg-surface-900/40 backdrop-blur-xl border rounded-2xl p-4 sm:p-5 transition-all ${
            isActive ? 'border-primary-500/40 bg-primary-500/5 shadow-lg shadow-primary-500/5' :
            isCompleted ? 'border-emerald-500/20 opacity-70' :
            isSkipped ? 'border-surface-800 opacity-40' :
            'border-white/[var(--glass-border-opacity)] hover:border-surface-600'
        }`}>
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="pt-0.5 shrink-0">{statusIndicator}</div>

                <div className="flex-1 min-w-0">
                    <h4 className={`font-black uppercase tracking-tighter text-sm sm:text-base leading-tight mb-1 ${
                        isCompleted ? 'text-surface-500 line-through' :
                        isSkipped ? 'text-surface-500 line-through' :
                        isActive ? 'text-heading' : 'text-body opacity-80'
                    }`}>
                        {task.topic_name}
                    </h4>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[10px] text-body opacity-60 font-bold uppercase tracking-widest">{task.subject_name}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${typeConfig.color}`}>
                            <TypeIcon size={9} /> {typeConfig.label}
                        </span>
                        <span className="text-xs text-body opacity-60 font-bold flex items-center gap-1">
                            <Clock size={10} /> {formatDuration(task.duration_minutes)}
                        </span>
                        <DifficultyStars level={task.difficulty_stars || task.difficulty_level} />
                        {/* Compact reason tags — show top 2 */}
                        {reasons.filter(r => r !== 'PRIORITY_PICK').slice(0, 2).map(reason => {
                            const config = REASON_CONFIG[reason];
                            if (!config) return null;
                            return (
                                <span key={reason} className={`text-[9px] font-black uppercase tracking-widest ${config.color.split(' ')[0]}`}>
                                    {config.icon} {config.label}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                {isPending && (
                    <button
                        onClick={() => onStart?.(task.id)}
                        disabled={isLoading}
                        className="shrink-0 p-2.5 bg-surface-800 hover:bg-primary-600 text-body opacity-70 hover:text-white hover:opacity-100 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        title="Start this task"
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                )}
                {isActive && (
                    <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => onComplete?.(task.id)} disabled={isLoading}
                            className="p-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50" title="Complete">
                            <CheckCircle size={16} />
                        </button>
                        <button onClick={() => onSkip?.(task.id)} disabled={isLoading}
                            className="p-2.5 bg-surface-800 hover:bg-surface-700 text-body opacity-70 rounded-xl transition-all active:scale-95 disabled:opacity-50" title="Skip">
                            <SkipForward size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
