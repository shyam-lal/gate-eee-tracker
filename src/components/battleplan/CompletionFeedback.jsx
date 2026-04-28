import React, { useState } from 'react';
import { CheckCircle, TrendingUp, Clock, ArrowRight, Brain } from 'lucide-react';

const CONFIDENCE_OPTIONS = [
    { value: 1, emoji: '😟', label: 'Not at all', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', activeRing: 'ring-red-500' },
    { value: 2, emoji: '😐', label: 'Somewhat', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', activeRing: 'ring-amber-500' },
    { value: 3, emoji: '🙂', label: 'Fairly', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20', activeRing: 'ring-primary-500' },
    { value: 4, emoji: '😎', label: 'Very confident', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', activeRing: 'ring-emerald-500' },
];

/**
 * CompletionFeedback — Modal shown after completing a task.
 * Shows actual vs planned duration, self-assessment rating, and topic progress feedback.
 */
const CompletionFeedback = ({
    task,
    actualMinutes,
    setActualMinutes,
    onConfirm,
    onCancel,
    isLoading,
}) => {
    const [selfRating, setSelfRating] = useState(null);

    if (!task) return null;

    const planned = task.duration_minutes || 0;
    const actual = parseInt(actualMinutes) || 0;
    const timeDiff = actual - planned;
    const timeDiffLabel = timeDiff > 0
        ? `+${timeDiff}m over planned`
        : timeDiff < 0
        ? `${Math.abs(timeDiff)}m under planned`
        : 'Right on schedule';

    const handleConfirm = () => {
        onConfirm(selfRating);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
            <div
                className="bg-surface-950 border border-surface-700 p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                        <CheckCircle size={22} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-heading text-lg uppercase tracking-tighter">Task Complete!</h3>
                        <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">{task.topic_name}</p>
                    </div>
                </div>

                {/* Subject */}
                <p className="text-xs text-surface-500 font-bold mb-5">{task.subject_name}</p>

                {/* Time Input */}
                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4 mb-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-primary-400" />
                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Study Duration</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="0"
                            className="flex-1 bg-surface-800 border border-surface-700 rounded-xl text-heading text-2xl font-black text-center outline-none py-3 focus:border-primary-500 transition-colors"
                            value={actualMinutes}
                            onChange={e => setActualMinutes(e.target.value)}
                            autoFocus
                        />
                        <span className="text-surface-500 text-sm font-black uppercase">min</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-surface-500">Planned: {planned} min</span>
                        <span className={timeDiff > 5 ? 'text-amber-400' : timeDiff < -5 ? 'text-emerald-400' : 'text-surface-500'}>
                            {actual > 0 ? timeDiffLabel : ''}
                        </span>
                    </div>
                </div>

                {/* Self-Assessment */}
                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4 mb-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Brain size={14} className="text-primary-400" />
                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">How confident do you feel?</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {CONFIDENCE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setSelfRating(opt.value)}
                                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${
                                    selfRating === opt.value
                                        ? `${opt.bg} ring-2 ${opt.activeRing} scale-105`
                                        : 'bg-surface-800/50 border-surface-700 hover:border-surface-600'
                                }`}
                            >
                                <span className="text-xl">{opt.emoji}</span>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${
                                    selfRating === opt.value ? opt.color : 'text-surface-500'
                                }`}>
                                    {opt.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    {selfRating && selfRating <= 2 && (
                        <p className="text-[10px] text-amber-400/70 font-bold text-center">
                            We'll schedule more practice for this topic 💪
                        </p>
                    )}
                    {selfRating && selfRating >= 4 && (
                        <p className="text-[10px] text-emerald-400/70 font-bold text-center">
                            Great! We'll move you forward faster 🚀
                        </p>
                    )}
                </div>

                {/* Progress Feedback */}
                <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-primary-400" />
                        <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Progress Update</span>
                    </div>
                    <p className="text-xs text-surface-400">
                        Your confidence rating will adaptively adjust your study plan for{' '}
                        <span className="text-heading font-bold">{task.topic_name}</span>.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-surface-800 text-heading py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-surface-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || selfRating === null}
                        className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompletionFeedback;
