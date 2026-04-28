import React, { useState, useEffect, useRef } from 'react';
import {
    X, ChevronDown, Target, TrendingUp, TrendingDown, Minus,
    Calendar, Clock, CheckCircle, AlertTriangle, ArrowRight
} from 'lucide-react';
import SubjectProgressBar from './SubjectProgressBar';

const RoadmapDrawer = ({ roadmap, planHistory, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('subjects');
    const drawerRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen || !roadmap) return null;

    const { exam, readiness, subjects, weekly_summary, estimated_completion, settings } = roadmap;
    const trendData = weekly_summary;

    const trendIcon = trendData?.trend === 'improving'
        ? <TrendingUp size={14} className="text-emerald-400" />
        : trendData?.trend === 'declining'
        ? <TrendingDown size={14} className="text-rose-400" />
        : <Minus size={14} className="text-surface-500" />;

    const trendLabel = trendData?.trend === 'improving'
        ? 'Improving' : trendData?.trend === 'declining'
        ? 'Declining' : 'Stable';

    const trendColor = trendData?.trend === 'improving'
        ? 'text-emerald-400' : trendData?.trend === 'declining'
        ? 'text-rose-400' : 'text-surface-400';

    // Sort subjects by completion (weakest first)
    const sortedSubjects = [...(subjects || [])].sort((a, b) => a.completion_percent - b.completion_percent);

    return (
        <div className="fixed inset-0 z-[250]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className="absolute bottom-0 left-0 right-0 bg-surface-950 border-t border-surface-700 rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
            >
                {/* Handle + Header */}
                <div className="sticky top-0 bg-surface-950 rounded-t-3xl z-10 border-b border-surface-800">
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 bg-surface-700 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between px-6 pb-4">
                        <div>
                            <h2 className="text-xl font-black text-heading uppercase tracking-tighter">Roadmap</h2>
                            <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Strategic Overview</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-surface-500 hover:text-heading rounded-xl hover:bg-surface-800 transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 px-6 pb-3">
                        {[
                            { id: 'subjects', label: 'Subjects' },
                            { id: 'stats', label: 'Statistics' },
                            { id: 'timeline', label: 'Timeline' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                                        : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800/50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                    {/* ─── Subjects Tab ─── */}
                    {activeTab === 'subjects' && (
                        <div className="space-y-3">
                            {/* Overall Readiness Header */}
                            <div className="bg-surface-900/50 border border-white/[var(--glass-border-opacity)] rounded-2xl p-5 flex items-center gap-5">
                                <div className="relative w-20 h-20 shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none" stroke="var(--color-surface-800)" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={readiness?.overall_score >= 60 ? 'rgb(52, 211, 153)' : readiness?.overall_score >= 30 ? 'rgb(251, 191, 36)' : 'rgb(251, 113, 133)'}
                                            strokeWidth="3" strokeDasharray={`${readiness?.overall_score || 0}, 100`} strokeLinecap="round"
                                            className="transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-black text-heading">{readiness?.overall_score || 0}%</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-black text-heading uppercase tracking-tighter">Overall Readiness</p>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                                        <span className="text-emerald-400">✓ {readiness?.mastered || 0} Mastered</span>
                                        <span className="text-amber-400">↻ {readiness?.revising || 0} Revising</span>
                                        <span className="text-primary-400">▸ {readiness?.learning || 0} Learning</span>
                                        <span className="text-surface-500">○ {readiness?.not_started || 0} New</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subject List */}
                            {sortedSubjects.map(subject => (
                                <SubjectProgressBar key={subject.id} subject={subject} />
                            ))}
                        </div>
                    )}

                    {/* ─── Stats Tab ─── */}
                    {activeTab === 'stats' && (
                        <div className="space-y-4">
                            {/* Weekly Comparison */}
                            <div className="bg-surface-900/50 border border-white/[var(--glass-border-opacity)] rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-primary-400" />
                                    <h3 className="text-sm font-black text-heading uppercase tracking-tighter">Weekly Performance</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* This Week */}
                                    <div className="bg-surface-800/50 rounded-xl p-4 space-y-2">
                                        <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">This Week</p>
                                        <p className="text-2xl font-black text-heading tracking-tighter">
                                            {((trendData?.this_week?.total_minutes || 0) / 60).toFixed(1)}h
                                        </p>
                                        <div className="text-[10px] font-bold text-surface-400 space-y-0.5">
                                            <p>{trendData?.this_week?.completed_tasks || 0} tasks done</p>
                                            <p>{Math.round((trendData?.this_week?.completion_rate || 0) * 100)}% completion</p>
                                        </div>
                                    </div>

                                    {/* Last Week */}
                                    <div className="bg-surface-800/50 rounded-xl p-4 space-y-2">
                                        <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Last Week</p>
                                        <p className="text-2xl font-black text-surface-400 tracking-tighter">
                                            {((trendData?.last_week?.total_minutes || 0) / 60).toFixed(1)}h
                                        </p>
                                        <div className="text-[10px] font-bold text-surface-500 space-y-0.5">
                                            <p>{trendData?.last_week?.completed_tasks || 0} tasks done</p>
                                            <p>{Math.round((trendData?.last_week?.completion_rate || 0) * 100)}% completion</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trend */}
                                <div className={`flex items-center gap-2 text-sm font-bold ${trendColor}`}>
                                    {trendIcon}
                                    <span>{trendLabel}</span>
                                    <span className="text-[10px] text-surface-500 font-normal">vs last week</span>
                                </div>
                            </div>

                            {/* Study Breakdown */}
                            <div className="bg-surface-900/50 border border-white/[var(--glass-border-opacity)] rounded-2xl p-5 space-y-3">
                                <h3 className="text-sm font-black text-heading uppercase tracking-tighter flex items-center gap-2">
                                    <Clock size={16} className="text-primary-400" /> Study Commitment
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-surface-800/50 rounded-xl p-3 text-center">
                                        <p className="text-xl font-black text-heading tracking-tighter">{settings?.daily_available_hours || 2}h</p>
                                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Daily Target</p>
                                    </div>
                                    <div className="bg-surface-800/50 rounded-xl p-3 text-center">
                                        <p className="text-xl font-black text-heading tracking-tighter">{readiness?.total_topics || 0}</p>
                                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Total Topics</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Timeline Tab ─── */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-4">
                            {/* Estimated Completion */}
                            <div className={`rounded-2xl p-5 space-y-3 border ${
                                estimated_completion?.on_track
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-rose-500/5 border-rose-500/20'
                            }`}>
                                <div className="flex items-center gap-2">
                                    {estimated_completion?.on_track
                                        ? <CheckCircle size={18} className="text-emerald-400" />
                                        : <AlertTriangle size={18} className="text-rose-400" />
                                    }
                                    <h3 className="text-sm font-black text-heading uppercase tracking-tighter">
                                        {estimated_completion?.on_track ? 'On Track' : 'Behind Schedule'}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-3xl font-black text-heading tracking-tighter">
                                            {estimated_completion?.at_current_pace_days || '—'}
                                        </p>
                                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Days Needed</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-heading tracking-tighter">
                                            {exam?.days_remaining ?? '—'}
                                        </p>
                                        <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Days Available</p>
                                    </div>
                                </div>

                                {!estimated_completion?.on_track && exam?.days_remaining && (
                                    <p className="text-xs text-rose-400 font-bold">
                                        You need {(estimated_completion?.at_current_pace_days || 0) - (exam?.days_remaining || 0)} more days at your current pace.
                                        Consider increasing your daily study hours or focusing on high-weightage topics.
                                    </p>
                                )}
                            </div>

                            {/* Exam Details */}
                            <div className="bg-surface-900/50 border border-white/[var(--glass-border-opacity)] rounded-2xl p-5 space-y-3">
                                <h3 className="text-sm font-black text-heading uppercase tracking-tighter">Exam Details</h3>
                                <div className="space-y-2">
                                    {exam?.name && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-surface-500 font-bold">Exam</span>
                                            <span className="text-heading font-black">{exam.name}</span>
                                        </div>
                                    )}
                                    {exam?.target_date && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-surface-500 font-bold">Target Date</span>
                                            <span className="text-heading font-black">
                                                {new Date(exam.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-surface-500 font-bold">Daily Hours</span>
                                        <span className="text-heading font-black">{settings?.daily_available_hours || 2}h</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-surface-500 font-bold">Syllabus Progress</span>
                                        <span className="text-heading font-black">
                                            {readiness?.mastered || 0}/{readiness?.total_topics || 0} topics
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Topic Status Summary */}
                            <div className="bg-surface-900/50 border border-white/[var(--glass-border-opacity)] rounded-2xl p-5 space-y-3">
                                <h3 className="text-sm font-black text-heading uppercase tracking-tighter">Topic Breakdown</h3>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Mastered', count: readiness?.mastered || 0, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                                        { label: 'Revising', count: readiness?.revising || 0, color: 'bg-amber-500', textColor: 'text-amber-400' },
                                        { label: 'Learning', count: readiness?.learning || 0, color: 'bg-primary-500', textColor: 'text-primary-400' },
                                        { label: 'Not Started', count: readiness?.not_started || 0, color: 'bg-surface-600', textColor: 'text-surface-400' },
                                    ].map(item => {
                                        const pct = readiness?.total_topics > 0 ? (item.count / readiness.total_topics * 100) : 0;
                                        return (
                                            <div key={item.label} className="flex items-center gap-3">
                                                <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                                                <span className="text-xs font-bold text-surface-400 flex-1">{item.label}</span>
                                                <span className={`text-xs font-black ${item.textColor}`}>{item.count}</span>
                                                <span className="text-[10px] text-surface-500 font-bold w-10 text-right">{Math.round(pct)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoadmapDrawer;
