import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit3, ArrowLeft } from 'lucide-react';
import StreakCalendar from '../ui/StreakCalendar';

const SyllabusTracker = ({ 
    user, 
    activeTool, 
    syllabus, 
    toolStreakData, 
    loadToolStreak, 
    searchQuery, 
    openEditor, 
    setLoggingTopic, 
    setEditingLog,
    onBack
}) => {
    const [expanded, setExpanded] = useState({});

    // Auto-expand based on search query
    useEffect(() => {
        if (searchQuery && searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            const newExpanded = { ...expanded };
            let hasMatch = false;

            syllabus.forEach(sub => {
                const subMatch = sub.name.toLowerCase().includes(query);
                const topicMatch = sub.topics.some(t => t.name.toLowerCase().includes(query));
                
                if (subMatch || topicMatch) {
                    newExpanded[sub.id] = true;
                    hasMatch = true;
                }
            });

            if (hasMatch) {
                setExpanded(newExpanded);
            }
        }
    }, [searchQuery, syllabus]);

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Calculations
    const totalModules = syllabus.reduce((acc, sub) => acc + sub.topics.reduce((ta, t) => ta + (t.totalModules || 0), 0), 0);
    const completedModules = syllabus.reduce((acc, sub) => acc + sub.topics.reduce((ta, t) => ta + (t.completedModules || 0), 0), 0);
    const modulesLeft = Math.max(0, totalModules - completedModules);
    const progressPercentage = totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);

    const formatTime = (minutes) => {
        const mins = Number(minutes) || 0;
        if (mins <= 0) return "0m";
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        let res = "";
        if (h > 0) res += `${h}h `;
        if (m > 0 || h === 0) res += `${m}m`;
        return res.trim();
    };

    const trackingMode = activeTool?.tool_type || 'module';

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <header className="flex justify-between items-end gap-6 mb-8">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-black text-heading uppercase tracking-tighter leading-none mb-2">Syllabus Tracker</h1>
                    <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest italic">
                        Engineer: {user?.username} • MODULE MODE • {activeTool?.selected_exam || 'GATE CS'}
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {/* Hub button removed as per new sidebar navigation paradigm */}
                    <button 
                        onClick={() => openEditor()}
                        className="flex items-center gap-2 px-6 py-3 bg-surface-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10"
                    >
                        <Plus size={16} /> NEW SUBJECT
                    </button>
                </div>
            </header>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Streak Calendar Widget */}
                <div className="bg-surface-900 border border-surface-800 rounded-3xl overflow-hidden relative p-4 h-full">
                     <StreakCalendar 
                        toolId={activeTool?.id}
                        currentStreak={toolStreakData?.currentStreak || 0}
                        activeDays={toolStreakData?.activeDays || []}
                        dayDetails={toolStreakData?.dayDetails || {}}
                        onMonthChange={(y, m) => loadToolStreak(activeTool?.id, y, m)}
                        formatTime={formatTime}
                    />
                </div>

                {/* Modules Progress Widget */}
                <div className="bg-surface-900 border border-surface-800 rounded-3xl p-8 relative flex flex-col justify-center">
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest absolute top-6 left-6">Modules</h3>
                    
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-6xl font-black text-heading leading-none tracking-tighter">{completedModules}</span>
                        <span className="text-lg font-bold text-surface-500 mb-1">/ {totalModules} done</span>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className="text-surface-500">{modulesLeft} MODULES LEFT</span>
                            <span className="text-emerald-400">{progressPercentage}% Cleared</span>
                        </div>
                        <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </div>

                    {/* Placeholder Bar Chart Decoration */}
                    <div className="absolute right-8 bottom-8 flex items-end gap-2 opacity-20 pointer-events-none">
                        <div className="w-4 h-16 bg-surface-500 rounded-t-sm"></div>
                        <div className="w-4 h-24 bg-surface-500 rounded-t-sm"></div>
                        <div className="w-4 h-10 bg-surface-500 rounded-t-sm"></div>
                    </div>
                </div>
            </div>

            {/* Active Curriculum */}
            <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-black text-heading uppercase tracking-widest pl-2">
                    <span className="w-4 h-4 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center border border-primary-500/30">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                    </span>
                    Active Curriculum
                </h3>

                <div className="space-y-4">
                    {syllabus.map((sub) => {
                        const subTotal = trackingMode === 'module'
                            ? sub.topics.reduce((acc, t) => acc + (t.totalModules || 0), 0)
                            : sub.topics.reduce((acc, t) => acc + (t.time || 0), 0);
                        const subDone = trackingMode === 'module'
                            ? sub.topics.reduce((acc, t) => acc + (t.completedModules || 0), 0)
                            : sub.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
                        const subProgress = subTotal === 0 ? 0 : Math.round((subDone / subTotal) * 100);
                        const isOpen = expanded[sub.id];

                        // Search highlighting
                        const isSubMatch = searchQuery && sub.name.toLowerCase().includes(searchQuery.toLowerCase());

                        return (
                            <div key={sub.id} className={`bg-surface-900 border ${subProgress >= 100 ? 'border-emerald-500/30' : 'border-surface-800/50'} rounded-2xl p-6 transition-all relative group shadow-sm flex flex-col ${isSubMatch ? 'ring-2 ring-primary-500' : ''}`}>
                                <div className="flex justify-between items-start mb-4 cursor-pointer" onClick={() => toggleExpand(sub.id)}>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-black uppercase text-base sm:text-lg tracking-widest text-heading">{sub.name}</h3>
                                        <button onClick={(e) => { e.stopPropagation(); openEditor(sub); }} className="p-1.5 text-surface-600 hover:text-primary-400 transition-colors">
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-emerald-400 font-black text-lg">{subProgress}%</span>
                                        <ChevronDown size={20} className={`text-surface-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mb-2 text-[10px] font-black uppercase tracking-widest text-surface-500">
                                    <span>
                                        {trackingMode === 'module' ? `${subDone} / ${subTotal} Modules` : `${formatTime(subDone)} / ${formatTime(subTotal)}`}
                                    </span>
                                </div>

                                <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden mb-2 cursor-pointer" onClick={() => toggleExpand(sub.id)}>
                                    <div className={`h-full ${subProgress >= 100 ? 'bg-emerald-500' : 'bg-primary-500'} transition-all duration-1000`} style={{ width: `${subProgress}%` }} />
                                </div>

                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                                    <div className="space-y-3">
                                        {sub.topics.map((t, tIdx) => {
                                            const weight = trackingMode === 'module' ? t.totalModules : t.time;
                                            const done = trackingMode === 'module' ? t.completedModules : t.timeSpent;
                                            const tp = weight > 0 ? (done / weight) * 100 : 0;
                                            
                                            const isTopicMatch = searchQuery && t.name.toLowerCase().includes(searchQuery.toLowerCase());

                                            return (
                                                <div key={tIdx} className={`bg-transparent border border-surface-800 rounded-xl p-4 transition-all relative ${isTopicMatch ? 'bg-primary-500/10 border-primary-500 ring-1 ring-primary-500' : ''}`}>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span 
                                                            onClick={() => setLoggingTopic({ subId: sub.id, topicName: t.name, currentSpent: done, topicId: t.id, isCompleted: tp >= 100 })} 
                                                            className={`text-sm font-bold flex-1 cursor-pointer hover:text-primary-400 transition-colors ${tp >= 100 ? 'text-emerald-400/80' : 'text-surface-400'}`}
                                                        >
                                                            {t.name}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingLog({
                                                                        topicId: t.id,
                                                                        minutes: done,
                                                                        modules: done,
                                                                        topicName: t.name
                                                                    });
                                                                }} 
                                                                className="p-1.5 text-surface-600 hover:text-primary-400 transition-colors"
                                                            >
                                                                <Edit3 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Bottom progress border */}
                                                    <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 rounded-b-xl transition-all duration-500" style={{ width: `${Math.min(100, tp)}%` }} />
                                                </div>
                                            );
                                        })}
                                        
                                        <button onClick={() => openEditor(sub)} className="w-full py-4 border-2 border-dashed border-surface-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-surface-500 hover:text-primary-400 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all flex items-center justify-center gap-2 mt-4">
                                            <Plus size={14} /> Update Syllabus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {syllabus.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-surface-800 rounded-2xl bg-surface-900/50">
                            <p className="text-surface-500 font-bold text-sm uppercase tracking-widest">No syllabus data found.</p>
                            <button onClick={() => openEditor()} className="mt-4 px-6 py-2 bg-primary-500/10 text-primary-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all">Add Subject</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <button 
                onClick={() => openEditor()}
                className="fixed bottom-8 right-8 w-14 h-14 bg-surface-900 border border-surface-700 text-surface-400 hover:text-primary-400 hover:border-primary-500 hover:scale-110 rounded-full shadow-2xl flex items-center justify-center transition-all z-20"
                title="Add New Subject"
            >
                <Plus size={24} />
            </button>
        </div>
    );
};

export default SyllabusTracker;
