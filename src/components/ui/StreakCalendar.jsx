import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Flame, Clock, Layers } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const StreakCalendar = ({ toolId, currentStreak = 0, activeDays = [], dayDetails = {}, onMonthChange, formatTime }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [tooltip, setTooltip] = useState(null); // { day, x, y, details }

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSet = new Set(activeDays);

    const changeMonth = (delta) => {
        const newDate = new Date(year, month + delta, 1);
        setViewDate(newDate);
        if (onMonthChange) {
            onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
        }
    };

    const isActive = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return activeSet.has(dateStr);
    };

    const isToday = (day) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const getDateStr = (day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    // Determine streak connectivity for each day
    const getStreakClass = (day) => {
        if (!isActive(day)) return '';

        const dayOfWeek = new Date(year, month, day).getDay(); // 0=Sun, 6=Sat
        const prevDay = day - 1;
        const nextDay = day + 1;

        const hasPrev = prevDay >= 1 && isActive(prevDay) && dayOfWeek !== 0; // Not Sunday (start of row)
        const hasNext = nextDay <= daysInMonth && isActive(nextDay) && dayOfWeek !== 6; // Not Saturday (end of row)

        if (hasPrev && hasNext) return 'streak-mid';
        if (hasPrev && !hasNext) return 'streak-end';
        if (!hasPrev && hasNext) return 'streak-start';
        return 'streak-single';
    };

    const handleDayHover = (day, e) => {
        const dateStr = getDateStr(day);
        const details = dayDetails[dateStr];
        if (details && details.length > 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
                day,
                dateStr,
                details,
                x: rect.left + rect.width / 2,
                y: rect.top
            });
        }
    };

    const handleDayLeave = () => {
        setTooltip(null);
    };

    // Build the calendar grid
    const calendarCells = [];
    // Empty cells for offset
    for (let i = 0; i < firstDay; i++) {
        calendarCells.push({ type: 'empty', key: `e-${i}` });
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push({
            type: 'day',
            day: d,
            key: `d-${d}`,
            active: isActive(d),
            today: isToday(d),
            streakClass: getStreakClass(d),
            dateStr: getDateStr(d)
        });
    }

    return (
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl overflow-hidden shadow-inner h-full flex flex-col">
            {/* Header with streak badge */}
            <div className="px-5 pt-5 pb-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Flame size={16} className={`${currentStreak > 0 ? 'text-orange-400' : 'text-slate-700'}`} fill={currentStreak > 0 ? 'currentColor' : 'none'} />
                        <span className={`text-sm font-black tracking-tight ${currentStreak > 0 ? 'text-orange-400' : 'text-slate-700'}`}>
                            {currentStreak}
                        </span>
                    </div>
                    {currentStreak > 0 && (
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Day Streak</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-28 text-center">
                        {MONTHS[month].substring(0, 3)} {year}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-4">
                {DAYS.map((d, i) => (
                    <div key={`${d}-${i}`} className="text-[10px] font-black text-slate-600/50 text-center py-1">{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 px-3 pb-4 flex-1 items-start">
                {calendarCells.map((cell) => {
                    if (cell.type === 'empty') {
                        return <div key={cell.key} className="h-9" />;
                    }

                    const { day, active, today: isT, streakClass } = cell;

                    // Background classes for connected streaks
                    let bgClass = '';
                    let radiusClass = '';

                    if (active) {
                        bgClass = 'bg-amber-500/20';
                        switch (streakClass) {
                            case 'streak-start':
                                radiusClass = 'rounded-l-full';
                                break;
                            case 'streak-mid':
                                radiusClass = '';
                                break;
                            case 'streak-end':
                                radiusClass = 'rounded-r-full';
                                break;
                            case 'streak-single':
                                radiusClass = 'rounded-full';
                                break;
                        }
                    }

                    return (
                        <div
                            key={cell.key}
                            className={`h-9 flex items-center justify-center relative ${bgClass} ${radiusClass} transition-colors`}
                            onMouseEnter={active ? (e) => handleDayHover(day, e) : undefined}
                            onMouseLeave={active ? handleDayLeave : undefined}
                        >
                            <div
                                className={`
                                    w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold transition-all
                                    ${active
                                        ? isT
                                            ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30'
                                            : 'bg-amber-500/60 text-white font-black'
                                        : isT
                                            ? 'bg-indigo-600 text-white font-black ring-2 ring-indigo-400/30'
                                            : 'text-slate-500'
                                    }
                                `}
                            >
                                {day}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tooltip */}
            {tooltip && createPortal(
                <div
                    className="fixed z-[500] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y - 8,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 p-3 min-w-[180px] max-w-[240px]">
                        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">
                            {new Date(tooltip.dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="space-y-1.5">
                            {tooltip.details.map((d, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] text-slate-400 font-bold block truncate">{d.subject} › {d.topic}</span>
                                        <span className="text-[10px] font-mono text-white font-bold">
                                            {d.minutes > 0 && formatTime ? formatTime(d.minutes) : ''}
                                            {d.modules > 0 ? `${d.minutes > 0 ? ' · ' : ''}${d.modules} mod` : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center">
                        <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45 -mt-1" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StreakCalendar;
