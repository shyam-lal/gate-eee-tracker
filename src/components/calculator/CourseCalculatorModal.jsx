import React, { useState, useMemo } from 'react';
import { Calculator, X, Calendar, Clock, RefreshCw, CheckCircle2, ChevronRight, AlertCircle, CalendarDays } from 'lucide-react';

const DAYS_OF_WEEK = [
    { label: 'S', name: 'Sunday', value: 0 },
    { label: 'M', name: 'Monday', value: 1 },
    { label: 'T', name: 'Tuesday', value: 2 },
    { label: 'W', name: 'Wednesday', value: 3 },
    { label: 'T', name: 'Thursday', value: 4 },
    { label: 'F', name: 'Friday', value: 5 },
    { label: 'S', name: 'Saturday', value: 6 }
];

const CourseCalculatorModal = ({ onClose }) => {
    // Inputs
    const [totalHours, setTotalHours] = useState('');
    const [mode, setMode] = useState('daysToComplete'); // 'daysToComplete' or 'hoursPerDay'
    const [dailyStudyHours, setDailyStudyHours] = useState('');

    // Dates
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    const [targetDate, setTargetDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
    });

    // Active days: defaults to Mon-Fri (1-5)
    const [activeDays, setActiveDays] = useState([false, true, true, true, true, true, false]);

    const toggleDay = (dayIndex) => {
        const newDays = [...activeDays];
        newDays[dayIndex] = !newDays[dayIndex];
        setActiveDays(newDays);
    };

    const toggleWeekdays = () => setActiveDays([false, true, true, true, true, true, false]);
    const toggleAllDays = () => setActiveDays([true, true, true, true, true, true, true]);
    const toggleWeekends = () => setActiveDays([true, false, false, false, false, false, true]);

    // Calculation Logic
    const result = useMemo(() => {
        const hours = parseFloat(totalHours);
        if (isNaN(hours) || hours <= 0) return null;

        const start = new Date(startDate);
        if (isNaN(start.getTime())) return null;

        const totalActiveInWeek = activeDays.filter(Boolean).length;
        if (totalActiveInWeek === 0) return { error: 'Please select at least one active study day.' };

        if (mode === 'daysToComplete') {
            const daily = parseFloat(dailyStudyHours);
            if (isNaN(daily) || daily <= 0) return null;

            let current = new Date(start);
            let remainingHours = hours;
            let activeDaysCount = 0;
            let totalDaysCount = 0;

            // Failsafe limit
            while (remainingHours > 0 && totalDaysCount < 3650) {
                totalDaysCount++;
                const dayOfWeek = current.getDay();
                if (activeDays[dayOfWeek]) {
                    activeDaysCount++;
                    remainingHours -= daily;
                }
                current.setDate(current.getDate() + 1);
            }

            // The last day added is the completion date (subtract 1 because we advanced)
            current.setDate(current.getDate() - 1);

            return {
                endDate: current.toISOString().split('T')[0],
                activeDaysCount,
                totalDaysCount,
                type: 'daysToComplete'
            };
        } else {
            const target = new Date(targetDate);
            if (isNaN(target.getTime())) return null;

            // Set times to midnight to calculate pure day differences
            const startStr = start.toISOString().split('T')[0];
            const targetStr = target.toISOString().split('T')[0];

            if (targetStr < startStr) {
                return { error: 'Target date must be after or equal to the start date.' };
            }

            let current = new Date(start);
            let activeDaysCount = 0;
            let totalDaysCount = 0;

            const targetTime = new Date(targetStr).getTime();
            let currentTime = new Date(startStr).getTime();

            while (currentTime <= targetTime) {
                totalDaysCount++;
                if (activeDays[current.getDay()]) {
                    activeDaysCount++;
                }
                current.setDate(current.getDate() + 1);
                currentTime = current.getTime();
            }

            if (activeDaysCount === 0) {
                return { error: 'No active study days found between start and target date.' };
            }

            const requiredDaily = (hours / activeDaysCount).toFixed(2);

            return {
                requiredDaily,
                activeDaysCount,
                totalDaysCount,
                type: 'hoursPerDay'
            };
        }
    }, [totalHours, mode, dailyStudyHours, targetDate, startDate, activeDays]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020617]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={handleBackdropClick}>
            <div className="bg-[#0b1121] border border-slate-700 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-800/50 bg-slate-900/40 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                            <Calculator size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-xl uppercase tracking-tighter">Course Estimator</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Calculate your study timeline</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-800/50 hover:bg-slate-700/80 rounded-2xl text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1 bg-slate-950/50 flex flex-col gap-8">

                    {/* Mode Toggle */}
                    <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                        <button
                            onClick={() => setMode('daysToComplete')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'daysToComplete' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Calendar size={16} /> Compute Days Needed
                        </button>
                        <button
                            onClick={() => setMode('hoursPerDay')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'hoursPerDay' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Clock size={16} /> Compute Daily Hours
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Course Size */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Course Length (Hours)</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input
                                    type="number"
                                    min="1"
                                    value={totalHours}
                                    onChange={(e) => setTotalHours(e.target.value)}
                                    placeholder="e.g. 150"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                            <div className="relative">
                                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Mode Specific Inputs */}
                        {mode === 'daysToComplete' ? (
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Planned Daily Study Hours</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={dailyStudyHours}
                                        onChange={(e) => setDailyStudyHours(e.target.value)}
                                        placeholder="e.g. 2.5"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target Completion Date</label>
                                <div className="relative">
                                    <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                    <input
                                        type="date"
                                        value={targetDate}
                                        onChange={(e) => setTargetDate(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active Days Selection */}
                    <div className="bg-slate-900/30 p-5 rounded-2xl border border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Study Days</label>
                                <p className="text-xs text-slate-500 font-medium">Which days of the week will you study?</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={toggleWeekdays} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors">Weekdays</button>
                                <button onClick={toggleWeekends} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors">Weekends</button>
                                <button onClick={toggleAllDays} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors">All</button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 justify-between mt-6">
                            {DAYS_OF_WEEK.map((day, idx) => (
                                <button
                                    key={day.value}
                                    onClick={() => toggleDay(day.value)}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black transition-all ${activeDays[day.value]
                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-110'
                                            : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                                        }`}
                                    title={day.name}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results Section */}
                    {result && !result.error && (
                        <div className={`p-6 sm:p-8 rounded-[2rem] border animate-in slide-in-from-bottom-4 duration-500 mt-2 ${mode === 'daysToComplete' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                            {result.type === 'daysToComplete' ? (
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Estimated Completion Date</p>
                                    <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-6">{new Date(result.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>

                                    <div className="flex justify-center gap-6 sm:gap-12 text-center border-t border-indigo-500/20 pt-6">
                                        <div>
                                            <p className="text-2xl font-black text-white">{result.activeDaysCount}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Study Days Needed</p>
                                        </div>
                                        <div className="w-px bg-indigo-500/20"></div>
                                        <div>
                                            <p className="text-2xl font-black text-white">{result.totalDaysCount}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Calendar Days</p>
                                        </div>
                                        <div className="w-px bg-indigo-500/20 hidden sm:block"></div>
                                        <div className="hidden sm:block">
                                            <p className="text-2xl font-black text-white">{(result.totalDaysCount / 7).toFixed(1)}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Weeks</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-3">Required Study Pace</p>
                                    <div className="flex items-baseline justify-center gap-2 mb-6">
                                        <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter">{result.requiredDaily}</h2>
                                        <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">hours / day</span>
                                    </div>

                                    <div className="flex justify-center gap-6 sm:gap-12 text-center border-t border-emerald-500/20 pt-6">
                                        <div>
                                            <p className="text-2xl font-black text-white">{result.activeDaysCount}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Available Study Days</p>
                                        </div>
                                        <div className="w-px bg-emerald-500/20"></div>
                                        <div>
                                            <p className="text-2xl font-black text-white">{result.totalDaysCount}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Calendar Days</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {result && result.error && (
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm font-bold mt-2">
                            <AlertCircle size={18} /> {result.error}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CourseCalculatorModal;
