import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DatePicker = ({ value, onChange, label, placeholder = 'Select date', minDate = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) return new Date(value + 'T00:00:00');
        return new Date();
    });
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = value ? new Date(value + 'T00:00:00') : null;

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const selectDate = (day) => {
        const selected = new Date(year, month, day);
        const yyyy = selected.getFullYear();
        const mm = String(selected.getMonth() + 1).padStart(2, '0');
        const dd = String(selected.getDate()).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}`);
        setIsOpen(false);
    };

    const clearDate = (e) => {
        e.stopPropagation();
        onChange('');
    };

    const isDisabled = (day) => {
        if (!minDate) return false;
        const d = new Date(year, month, day);
        return d < new Date(minDate + 'T00:00:00');
    };

    const isToday = (day) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
    };

    const formatDisplay = () => {
        if (!value) return null;
        const d = new Date(value + 'T00:00:00');
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Calculate days remaining
    const getDaysRemaining = () => {
        if (!value) return null;
        const target = new Date(value + 'T00:00:00');
        const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'Overdue';
        if (diff === 0) return 'Today';
        return `${diff} day${diff !== 1 ? 's' : ''} left`;
    };

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{label}</label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-left hover:border-indigo-500/50 transition-all group"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                        <Calendar size={16} />
                    </div>
                    {value ? (
                        <div className="min-w-0">
                            <span className="text-white font-bold text-sm block truncate">{formatDisplay()}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${getDaysRemaining() === 'Overdue' ? 'text-rose-400' : 'text-indigo-400'}`}>
                                {getDaysRemaining()}
                            </span>
                        </div>
                    ) : (
                        <span className="text-slate-600 font-bold text-sm">{placeholder}</span>
                    )}
                </div>
                {value && (
                    <button
                        type="button"
                        onClick={clearDate}
                        className="p-1 text-slate-600 hover:text-rose-400 transition-colors shrink-0"
                    >
                        <X size={14} />
                    </button>
                )}
            </button>

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0b1121] border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {/* Month/Year Header */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            type="button"
                            onClick={prevMonth}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-black text-white uppercase tracking-wider">
                            {MONTHS[month]} {year}
                        </span>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {DAYS.map(d => (
                            <div key={d} className="text-[10px] font-black text-slate-600 text-center py-1 uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty slots for offset */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8" />
                        ))}
                        {/* Actual days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const disabled = isDisabled(day);
                            const selected = isSelected(day);
                            const todayMatch = isToday(day);

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => selectDate(day)}
                                    className={`h-8 w-full rounded-lg text-xs font-bold transition-all
                                        ${disabled ? 'text-slate-800 cursor-not-allowed' : 'hover:bg-indigo-500/20 hover:text-indigo-400 cursor-pointer'}
                                        ${selected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black' : ''}
                                        ${todayMatch && !selected ? 'text-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/30' : ''}
                                        ${!selected && !todayMatch && !disabled ? 'text-slate-400' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                const d = new Date();
                                d.setMonth(d.getMonth() + 6);
                                selectDate(d.getDate());
                                setViewDate(d);
                            }}
                            className="flex-1 text-[10px] font-black text-slate-500 uppercase tracking-widest py-2 hover:text-indigo-400 transition-colors"
                        >
                            +6 Months
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const d = new Date();
                                d.setFullYear(d.getFullYear() + 1);
                                selectDate(d.getDate());
                                setViewDate(d);
                            }}
                            className="flex-1 text-[10px] font-black text-slate-500 uppercase tracking-widest py-2 hover:text-indigo-400 transition-colors"
                        >
                            +1 Year
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
