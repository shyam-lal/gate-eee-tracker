import React from 'react';
import { Flame } from 'lucide-react';

const GlobalActivityGrid = ({ currentStreak = 0, activeDays = [], toolsByDay = {} }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Grid calculations
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday... 6 = Saturday
    const daysToSaturday = 6 - currentDayOfWeek;
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysToSaturday);
    
    const totalDays = 28;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    const days = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }

    const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Calculate active days in the last 28 days
    const activeDaysInPeriod = days.filter(d => {
        if (d > today) return false;
        return activeDays.includes(formatDate(d));
    }).length;

    // Tool color mapping
    const getToolDots = (dateStr) => {
        const tools = toolsByDay[dateStr] || [];
        const dots = [];
        
        if (tools.some(t => t.type === 'revision')) dots.push('bg-emerald-500');
        if (tools.some(t => t.type === 'flashcard' || t.type === 'flashcards')) dots.push('bg-teal-500');
        if (tools.some(t => t.type === 'module')) dots.push('bg-amber-500');
        if (tools.some(t => t.type === 'battle_plan')) dots.push('bg-rose-500');
        if (tools.some(t => t.type === 'focus')) dots.push('bg-blue-500');
        
        // Default active if no specific tool type found but day is active
        if (dots.length === 0 && activeDays.includes(dateStr)) dots.push('bg-surface-400');
        
        return dots.slice(0, 3); // Max 3 dots for visual fit
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl border border-surface-700/50 flex items-center justify-center bg-surface-800/20">
                    <Flame size={28} className={currentStreak > 0 ? "text-amber-500" : "text-surface-600"} strokeWidth={1.5} />
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-heading leading-none">{currentStreak}</span>
                        <span className="text-xs font-black text-surface-500 uppercase tracking-widest">Days Streak</span>
                    </div>
                    <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mt-2">
                        {currentStreak > 0 ? `Active for ${currentStreak} days` : 'Log activity to start'}
                    </p>
                </div>
            </div>

            {/* Grid Header */}
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Last 4 Weeks</span>
                <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">{activeDaysInPeriod} / 28 Days Active</span>
            </div>

            {/* Grid */}
            <div className="flex-1 flex flex-col justify-center mb-6">
                <div className="grid grid-cols-7 gap-y-3 gap-x-2 w-full max-w-sm mx-auto">
                    {/* Day Labels */}
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={`label-${i}`} className="text-center text-[10px] font-black text-surface-600 mb-2">
                            {day}
                        </div>
                    ))}
                    
                    {/* Days */}
                    {days.map((d, i) => {
                        const dateStr = formatDate(d);
                        const isToday = d.getTime() === today.getTime();
                        const isFuture = d > today;
                        const dots = getToolDots(dateStr);
                        const isActive = dots.length > 0;

                        return (
                            <div key={i} className="flex items-center justify-center relative">
                                {isToday && (
                                    <div className="absolute inset-0 ring-2 ring-blue-500/80 ring-offset-2 ring-offset-surface-900 rounded-xl" />
                                )}
                                
                                {isActive ? (
                                    <div className="w-10 h-10 bg-amber-900/30 border border-amber-900/50 rounded-[10px] flex items-center justify-center gap-1 shadow-inner relative z-10">
                                        {dots.map((dotColor, dotIdx) => (
                                            <div key={dotIdx} className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`w-10 h-10 flex items-center justify-center relative z-10`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isFuture ? 'bg-surface-800' : 'bg-surface-700'}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap mt-auto">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-surface-500">Revision</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                    <span className="text-[10px] font-bold text-surface-500">Flashcards</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] font-bold text-surface-500">Modules</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <span className="text-[10px] font-bold text-surface-500">Battle Plan</span>
                </div>
            </div>
        </div>
    );
};

export default GlobalActivityGrid;
