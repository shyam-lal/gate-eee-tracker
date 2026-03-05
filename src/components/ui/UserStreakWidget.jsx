import React from 'react';
import { Flame, Calendar, CheckCircle2 } from 'lucide-react';

// Predefined tool colors for visual distinction
const TOOL_COLORS = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-violet-500', 'bg-orange-500', 'bg-teal-500'
];

const UserStreakWidget = ({ currentStreak = 0, activeDays = [], toolsByDay = {}, tools = [] }) => {

    // Timezone-safe local date string formatter
    const toDateStr = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build a color map for tools
    const toolColorMap = {};
    tools.forEach((tool, i) => {
        toolColorMap[tool.id] = TOOL_COLORS[i % TOOL_COLORS.length];
    });

    // Build calendar-week-aligned grid (Sun-Sat rows)
    // Go back ~4 weeks and start from that week's Sunday
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 27);
    const gridStart = new Date(rangeStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // back to Sunday

    const todayStr = toDateStr(today);

    const weeks = [];
    let cursor = new Date(gridStart);
    while (cursor <= today) {
        const week = [];
        for (let dow = 0; dow < 7; dow++) {
            const d = new Date(cursor);
            d.setDate(d.getDate() + dow);
            const dateStr = toDateStr(d);
            const isFuture = d > today;
            const toolsForDay = toolsByDay[dateStr] || [];

            week.push({
                date: d,
                dateStr,
                isToday: dateStr === todayStr,
                isActive: !isFuture && activeDays.includes(dateStr),
                isFuture,
                toolsActive: toolsForDay
            });
        }
        weeks.push(week);
        cursor.setDate(cursor.getDate() + 7);
    }

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 space-y-5">
            {/* Streak Header */}
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${currentStreak > 0 ? 'bg-orange-500/15 border border-orange-500/20' : 'bg-slate-800 border border-slate-700'}`}>
                    <Flame
                        size={28}
                        className={currentStreak > 0 ? 'text-orange-400' : 'text-slate-600'}
                        fill={currentStreak > 0 ? 'currentColor' : 'none'}
                    />
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-black tracking-tighter ${currentStreak > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
                            {currentStreak}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Day{currentStreak !== 1 ? 's' : ''} Streak
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                        {currentStreak > 0 ? "Keep it going!" : "Log activity to start"}
                    </p>
                </div>
            </div>

            {/* 4-Week Heatmap */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Last 4 Weeks</span>
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                        {activeDays.filter(d => {
                            const dayDate = new Date(d + 'T12:00:00');
                            const diff = Math.round((today - dayDate) / (1000 * 60 * 60 * 24));
                            return diff >= 0 && diff < 28;
                        }).length} / 28 Days Active
                    </span>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {dayLabels.map((d, i) => (
                        <div key={i} className="text-[8px] font-black text-slate-700 text-center">{d}</div>
                    ))}
                </div>

                {/* Heatmap grid */}
                <div className="space-y-1">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-1">
                            {week.map((day) => {
                                const numTools = day.toolsActive.length;

                                if (day.isFuture) {
                                    return (
                                        <div key={day.dateStr} className="relative h-7 rounded-lg flex items-center justify-center bg-slate-800/10" />
                                    );
                                }

                                return (
                                    <div
                                        key={day.dateStr}
                                        className={`
                                            relative h-7 rounded-lg flex items-center justify-center transition-all group cursor-default
                                            ${day.isActive
                                                ? numTools > 1
                                                    ? 'bg-amber-500/30 ring-1 ring-amber-500/20'
                                                    : 'bg-amber-500/20'
                                                : 'bg-slate-800/40'
                                            }
                                            ${day.isToday ? 'ring-2 ring-indigo-500/40' : ''}
                                        `}
                                        title={day.isActive
                                            ? `${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${day.toolsActive.map(t => t.name).join(', ')}`
                                            : day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                        }
                                    >
                                        {/* Tool color dots */}
                                        {day.isActive && numTools > 0 ? (
                                            <div className="flex gap-0.5">
                                                {day.toolsActive.slice(0, 3).map((tool, ti) => (
                                                    <div
                                                        key={ti}
                                                        className={`w-2 h-2 rounded-full ${toolColorMap[tool.id] || 'bg-amber-500'}`}
                                                    />
                                                ))}
                                                {numTools > 3 && (
                                                    <span className="text-[7px] text-slate-400 font-bold">+{numTools - 3}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tool legend */}
            {tools.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {tools.map((tool, i) => (
                        <div key={tool.id} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${TOOL_COLORS[i % TOOL_COLORS.length]}`} />
                            <span className="text-[9px] font-bold text-slate-500 truncate max-w-[80px]">{tool.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserStreakWidget;
