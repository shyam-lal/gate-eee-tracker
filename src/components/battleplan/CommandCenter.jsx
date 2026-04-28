import React from 'react';
import { Flame, Clock, Target, TrendingUp, TrendingDown, Minus, Calendar, Settings } from 'lucide-react';
import SafeguardBadge from './SafeguardBadge';

const CommandCenter = ({ plan, roadmap, onOpenSettings, onOpenRoadmap }) => {
    const summary = plan?.summary;
    const safeguards = plan?.safeguards;
    const settings = plan?.settings || roadmap?.settings || {};
    const exam = roadmap?.exam;
    const readiness = roadmap?.readiness;
    const weeklyData = roadmap?.weekly_summary;
    const streak = summary?.streak || roadmap?.streak || 0;
    const progressPercent = summary?.progress_percent || 0;

    const formatDuration = (mins) => {
        if (!mins) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
    };

    const formatHours = (mins) => {
        if (!mins) return '0h';
        return `${(mins / 60).toFixed(1)}h`;
    };

    const trendIcon = weeklyData?.trend === 'improving'
        ? <TrendingUp size={12} className="text-emerald-400" />
        : weeklyData?.trend === 'declining'
        ? <TrendingDown size={12} className="text-rose-400" />
        : <Minus size={12} className="text-surface-500" />;

    return (
        <div className="space-y-4">
            {/* Top row — Exam info + Settings */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] flex items-center gap-1.5 mb-1">
                        <Target size={10} /> Battle Plan
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-heading uppercase tracking-tighter leading-[0.9]">
                        {new Date(plan?.date || Date.now()).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <SafeguardBadge safeguards={safeguards} />
                    <button
                        onClick={onOpenSettings}
                        className="p-2 text-surface-500 hover:text-primary-400 transition-colors rounded-xl hover:bg-surface-800/50"
                        title="Plan Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Main Stats Card */}
            <div className="bg-surface-900/40 backdrop-blur-xl border border-white/[var(--glass-border-opacity)] rounded-3xl p-5 sm:p-6 space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black text-heading tracking-tighter">{progressPercent}%</span>
                            <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Today</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-500">
                            <Flame size={14} fill="currentColor" />
                            <span className="text-sm font-black tracking-tighter">{streak}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-surface-500">streak</span>
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
                <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                        <p className="text-lg font-black text-heading tracking-tighter">{formatDuration(summary?.completed_minutes)}</p>
                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Done</p>
                    </div>
                    <div className="text-center border-x border-surface-800">
                        <p className="text-lg font-black text-primary-400 tracking-tighter">{formatDuration(summary?.remaining_minutes)}</p>
                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Left</p>
                    </div>
                    <div className="text-center border-r border-surface-800">
                        <p className="text-lg font-black text-heading tracking-tighter">{summary?.completed_count}/{summary?.total_count}</p>
                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Tasks</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black text-heading tracking-tighter flex items-center justify-center gap-1">
                            {formatHours(weeklyData?.this_week?.total_minutes)}
                            {trendIcon}
                        </p>
                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Week</p>
                    </div>
                </div>
            </div>

            {/* Readiness + Exam Countdown (only when roadmap data is loaded) */}
            {roadmap && (
                <div className="grid grid-cols-2 gap-3">
                    {/* Readiness Score */}
                    <div className="bg-surface-900/40 backdrop-blur-xl border border-white/[var(--glass-border-opacity)] rounded-2xl p-4 flex flex-col items-center justify-center">
                        <div className="relative w-16 h-16 mb-2">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="var(--color-surface-800)"
                                    strokeWidth="3"
                                />
                                <path
                                    d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={readiness?.overall_score >= 60 ? 'rgb(52, 211, 153)' : readiness?.overall_score >= 30 ? 'rgb(251, 191, 36)' : 'rgb(251, 113, 133)'}
                                    strokeWidth="3"
                                    strokeDasharray={`${readiness?.overall_score || 0}, 100`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-black text-heading">{readiness?.overall_score || 0}%</span>
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Readiness</p>
                    </div>

                    {/* Exam Countdown */}
                    <div className="bg-surface-900/40 backdrop-blur-xl border border-white/[var(--glass-border-opacity)] rounded-2xl p-4 flex flex-col items-center justify-center">
                        {exam?.days_remaining !== null && exam?.days_remaining !== undefined ? (
                            <>
                                <span className="text-3xl font-black text-heading tracking-tighter mb-1">{exam.days_remaining}</span>
                                <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Days Left</p>
                                {exam.name && (
                                    <p className="text-[9px] text-primary-400 font-bold mt-1">{exam.name}</p>
                                )}
                            </>
                        ) : (
                            <>
                                <Calendar size={24} className="text-surface-500 mb-2" />
                                <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">No Date Set</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Roadmap teaser button */}
            {roadmap && (
                <button
                    onClick={onOpenRoadmap}
                    className="w-full bg-surface-900/40 backdrop-blur-xl border border-white/[var(--glass-border-opacity)] rounded-2xl p-4 flex items-center justify-between hover:border-primary-500/30 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center">
                            <Target size={16} className="text-primary-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-black text-heading uppercase tracking-tighter">View Roadmap</p>
                            <p className="text-[10px] text-surface-500 font-bold">
                                {readiness?.mastered || 0} mastered · {readiness?.not_started || 0} remaining
                            </p>
                        </div>
                    </div>
                    <span className="text-surface-500 group-hover:text-primary-400 transition-colors text-[10px] font-black uppercase tracking-widest">
                        View →
                    </span>
                </button>
            )}
        </div>
    );
};

export default CommandCenter;
