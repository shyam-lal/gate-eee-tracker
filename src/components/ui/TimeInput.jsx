import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Clock } from 'lucide-react';

/**
 * TimeInput - A user-friendly time input with separate Hours and Minutes fields.
 * 
 * Props:
 *  - value: total minutes (number) — for prefilling (edit mode). null/undefined for empty.
 *  - onChange: (totalMinutes: number) => void — called on every change
 *  - compact: boolean — smaller layout for inline use
 *  - autoFocus: boolean — focus the hours field on mount
 */
const TimeInput = forwardRef(({ value = null, onChange, compact = false, autoFocus = false }, ref) => {
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');

    // Initialize from value prop (total minutes)
    useEffect(() => {
        if (value !== null && value !== undefined && value > 0) {
            const totalMins = Number(value) || 0;
            setHours(String(Math.floor(totalMins / 60)));
            setMinutes(String(Math.round(totalMins % 60)));
        }
    }, []); // Only on mount — don't override user typing

    // Report changes to parent
    useEffect(() => {
        if (onChange) {
            const h = parseInt(hours, 10) || 0;
            const m = parseInt(minutes, 10) || 0;
            onChange(h * 60 + m);
        }
    }, [hours, minutes]);

    // Expose getTotalMinutes via ref for imperative access
    useImperativeHandle(ref, () => ({
        getTotalMinutes: () => {
            const h = parseInt(hours, 10) || 0;
            const m = parseInt(minutes, 10) || 0;
            return h * 60 + m;
        },
        reset: () => {
            setHours('');
            setMinutes('');
        }
    }));

    if (compact) {
        return (
            <div className="flex items-center gap-1.5">
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={hours}
                        onChange={e => setHours(e.target.value)}
                        className="w-14 bg-slate-900 border border-slate-800 rounded-lg p-2 pr-1 text-xs text-center text-white focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-600 uppercase pointer-events-none">h</span>
                </div>
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="0"
                        value={minutes}
                        onChange={e => setMinutes(e.target.value)}
                        className="w-14 bg-slate-900 border border-slate-800 rounded-lg p-2 pr-1 text-xs text-center text-white focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-600 uppercase pointer-events-none">m</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-stretch gap-3">
            {/* Hours */}
            <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Hours</label>
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        placeholder="0"
                        autoFocus={autoFocus}
                        value={hours}
                        onChange={e => setHours(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white text-lg font-mono text-center focus:border-indigo-500 outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600 uppercase pointer-events-none">hr</span>
                </div>
            </div>

            {/* Separator */}
            <div className="flex items-end pb-5 text-slate-700 font-black text-xl">:</div>

            {/* Minutes */}
            <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Minutes</label>
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="0"
                        value={minutes}
                        onChange={e => setMinutes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white text-lg font-mono text-center focus:border-indigo-500 outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600 uppercase pointer-events-none">min</span>
                </div>
            </div>
        </div>
    );
});

TimeInput.displayName = 'TimeInput';

export default TimeInput;
