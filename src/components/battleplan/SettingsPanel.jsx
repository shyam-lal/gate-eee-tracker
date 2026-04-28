import React, { useState } from 'react';
import { Clock, Calendar, X, Save, RotateCcw } from 'lucide-react';

const SettingsPanel = ({ settings, onSave, onClose, onRegenerate }) => {
    const [dailyHours, setDailyHours] = useState(settings?.daily_available_hours || 2);
    const [targetDate, setTargetDate] = useState(settings?.target_date || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const formatHours = (h) => {
        if (h < 1) return `${h * 60} min`;
        const whole = Math.floor(h);
        const frac = h - whole;
        if (frac === 0) return `${whole}h`;
        return `${whole}h ${frac * 60}m`;
    };

    const hasChanges = dailyHours !== (settings?.daily_available_hours || 2)
        || targetDate !== (settings?.target_date || '');

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({ daily_available_hours: dailyHours, target_date: targetDate || undefined });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            alert(err.message);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-surface-950 border border-surface-700 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
                 onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-0">
                    <h3 className="font-black text-heading text-xl uppercase tracking-tighter">Plan Settings</h3>
                    <button onClick={onClose} className="p-2 text-surface-500 hover:text-heading rounded-xl hover:bg-surface-800 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Daily Study Hours */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary-400" />
                            <label className="text-sm font-bold text-heading">Daily Study Hours</label>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-3xl font-black text-heading tracking-tighter">{formatHours(dailyHours)}</span>
                                <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">per day</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="8"
                                step="0.5"
                                value={dailyHours}
                                onChange={e => setDailyHours(parseFloat(e.target.value))}
                                className="w-full h-2 bg-surface-800 rounded-full appearance-none cursor-pointer accent-primary-500
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-500/30 [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] text-surface-500 font-bold uppercase tracking-widest">
                                <span>30 min</span>
                                <span>8 hours</span>
                            </div>
                        </div>
                    </div>

                    {/* Target Date */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary-400" />
                            <label className="text-sm font-bold text-heading">Target Exam Date</label>
                        </div>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={e => setTargetDate(e.target.value)}
                            className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3.5 text-sm text-heading focus:border-primary-500 outline-none"
                        />
                    </div>

                    {/* Info Note */}
                    <p className="text-[10px] text-surface-500 font-medium bg-surface-900/50 border border-surface-800 rounded-xl p-3">
                        Changes will take effect from your <strong className="text-surface-400">next plan generation</strong>.
                        You can also regenerate today's plan to apply immediately.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                                saved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-primary-600 hover:bg-primary-500 text-white'
                            }`}
                        >
                            <Save size={14} />
                            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={onRegenerate}
                            className="px-5 py-4 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all"
                            title="Regenerate today's plan with new settings"
                        >
                            <RotateCcw size={14} /> Regen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
