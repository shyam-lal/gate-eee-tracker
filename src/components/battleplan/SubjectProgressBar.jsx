import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star, Circle, CheckCircle2, PlayCircle, RefreshCw, AlertTriangle, Zap } from 'lucide-react';

const SubjectProgressBar = ({ subject, compact = false }) => {
    const { name, total_topics, mastered, revising, learning, not_started, completion_percent, weightage, topics } = subject;
    const [isExpanded, setIsExpanded] = useState(false);

    const masteredPct = total_topics > 0 ? (mastered / total_topics * 100) : 0;
    const revisingPct = total_topics > 0 ? (revising / total_topics * 100) : 0;
    const learningPct = total_topics > 0 ? (learning / total_topics * 100) : 0;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'MASTERED': return <CheckCircle2 size={14} className="text-emerald-400" />;
            case 'REVISING': return <RefreshCw size={14} className="text-amber-400" />;
            case 'LEARNING': return <PlayCircle size={14} className="text-primary-400" />;
            default: return <Circle size={14} className="text-surface-600" />;
        }
    };

    if (compact) {
        return (
            <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-surface-300 truncate mr-2">{name}</span>
                    <span className="text-[10px] font-black text-surface-500 tabular-nums">{completion_percent}%</span>
                </div>
                <div className="h-2 bg-surface-800 rounded-full overflow-hidden flex">
                    {masteredPct > 0 && <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${masteredPct}%` }} />}
                    {revisingPct > 0 && <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${revisingPct}%` }} />}
                    {learningPct > 0 && <div className="bg-primary-500/50 h-full transition-all duration-500" style={{ width: `${learningPct}%` }} />}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-900/40 border border-white/[var(--glass-border-opacity)] rounded-2xl overflow-hidden transition-all duration-300">
            {/* Header / Trigger */}
            <div 
                className="p-4 space-y-3 cursor-pointer hover:bg-surface-800/20 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-sm font-black text-heading uppercase tracking-tighter">{name}</h4>
                        {weightage > 0 && (
                            <span className="text-[9px] text-surface-500 font-bold uppercase tracking-widest">
                                Weightage: {weightage}%
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-lg font-black tracking-tighter ${
                            completion_percent >= 80 ? 'text-emerald-400' :
                            completion_percent >= 50 ? 'text-amber-400' :
                            'text-surface-400'
                        }`}>
                            {completion_percent}%
                        </span>
                        <div className="p-1 rounded-lg bg-surface-800 text-surface-400">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>
                </div>

                {/* Stacked progress bar */}
                <div className="h-3 bg-surface-800 rounded-full overflow-hidden flex">
                    {masteredPct > 0 && (
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${masteredPct}%` }} />
                    )}
                    {revisingPct > 0 && (
                        <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${revisingPct}%` }} />
                    )}
                    {learningPct > 0 && (
                        <div className="bg-primary-500/50 h-full transition-all duration-500" style={{ width: `${learningPct}%` }} />
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered {mastered}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Revising {revising}
                    </span>
                    <span className="flex items-center gap-1 text-primary-400">
                        <span className="w-2 h-2 rounded-full bg-primary-500/50" /> Learning {learning}
                    </span>
                    <span className="flex items-center gap-1 text-surface-500">
                        <span className="w-2 h-2 rounded-full bg-surface-600" /> New {not_started}
                    </span>
                </div>
            </div>

            {/* Expandable Topic List */}
            {isExpanded && topics && topics.length > 0 && (
                <div className="border-t border-surface-800 bg-surface-950/50 divide-y divide-surface-800/50">
                    {topics.map(topic => {
                        const baseMinutes = (topic.base_hours || topic.estimated_hours || 2) * 60;
                        const remainingMinutes = (topic.estimated_hours || 0) * 60;
                        const progressPct = baseMinutes > 0
                            ? Math.min(100, Math.round((topic.time_spent / baseMinutes) * 100))
                            : 0;
                        
                        // Format hours nicely
                        const formatHours = (h) => {
                            if (h <= 0) return '0h';
                            if (h < 1) return `${Math.round(h * 60)}m`;
                            return `${Math.round(h * 10) / 10}h`;
                        };
                        
                        return (
                            <div key={topic.id} className="p-3 px-4 flex flex-col gap-2 hover:bg-surface-800/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(topic.status)}
                                        <div>
                                            <p className="text-xs font-bold text-surface-300">{topic.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            size={10} 
                                                            className={i < topic.difficulty ? 'text-rose-400 fill-rose-400' : 'text-surface-700'} 
                                                        />
                                                    ))}
                                                    <span className="text-[9px] text-surface-500 uppercase font-bold tracking-widest ml-1 hidden sm:inline">Diff</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                            topic.status === 'MASTERED' ? 'bg-emerald-500/10 text-emerald-400' :
                                            topic.status === 'REVISING' ? 'bg-amber-500/10 text-amber-400' :
                                            topic.status === 'LEARNING' ? 'bg-primary-500/10 text-primary-400' :
                                            'bg-surface-800 text-surface-500'
                                        }`}>
                                            {topic.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Progress Bar + Time tracking */}
                                <div className="pl-7 pr-2 space-y-1.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${
                                                    topic.status === 'MASTERED' ? 'bg-emerald-500' :
                                                    topic.status === 'REVISING' ? 'bg-amber-500' :
                                                    topic.status === 'NOT_STARTED' ? 'bg-surface-700' :
                                                    'bg-primary-500'
                                                }`}
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-surface-400 whitespace-nowrap tabular-nums">
                                            {Math.round(topic.time_spent)}m / {formatHours(topic.base_hours || topic.estimated_hours)}
                                        </span>
                                    </div>

                                    {/* Adaptive message */}
                                    {topic.adaptive_message && topic.status !== 'NOT_STARTED' && (
                                        <div className={`flex items-center gap-1.5 ${
                                            topic.multiplier > 1 
                                                ? 'text-amber-400/70'
                                                : topic.multiplier < 1 
                                                ? 'text-emerald-400/70' 
                                                : 'text-surface-500'
                                        }`}>
                                            {topic.multiplier > 1 
                                                ? <AlertTriangle size={10} />
                                                : <Zap size={10} />
                                            }
                                            <span className="text-[9px] font-bold">
                                                {topic.adaptive_message}
                                                {topic.estimated_hours > 0 && ` · ~${formatHours(topic.estimated_hours)} remaining`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SubjectProgressBar;
