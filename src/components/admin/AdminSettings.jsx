import React, { useState, useEffect } from 'react';
import { adminSettings } from '../../services/api';
import { Settings, Save, Sparkles, Loader2, RefreshCw } from 'lucide-react';

const AdminSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminSettings.getGlobalSettings();
            setSettings(data);
        } catch (err) {
            setError(err.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await adminSettings.updateGlobalSettings(settings);
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-heading flex items-center gap-2">
                    <Settings size={20} className="text-primary-400" /> Global Settings
                </h2>
                <p className="text-xs text-surface-500 font-bold uppercase tracking-widest">System-wide Configuration</p>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-bold">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-bold">
                    {success}
                </div>
            )}

            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-heading">AI Generation</h3>
                        <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">Control Prompt Generation Features</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest block mb-2">Global AI Generation Mode</label>
                        <select 
                            className="w-full sm:w-auto min-w-[300px] bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-heading focus:border-primary-500 outline-none"
                            value={settings?.ai_generation_mode || 'manual'}
                            onChange={(e) => setSettings({ ...settings, ai_generation_mode: e.target.value })}
                        >
                            <option value="disabled">Disabled (Feature hidden/blocked)</option>
                            <option value="manual">Manual (Generate prompt only)</option>
                            <option value="auto">Auto (Full LLM integration)</option>
                        </select>
                        <p className="text-[10px] text-surface-500 mt-2 max-w-2xl leading-relaxed">
                            This setting controls the default AI generation mode for all users. 
                            Individual users can have this overridden in their specific user profile settings.
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-surface-800 flex justify-end gap-3">
                    <button 
                        onClick={loadSettings}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-surface-400 bg-surface-800 hover:bg-surface-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> Reset
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
