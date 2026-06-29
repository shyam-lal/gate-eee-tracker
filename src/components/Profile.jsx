import React, { useState } from 'react';
import {
    ArrowLeft, Bell, Settings, Edit2, Shield, Lock,
    CreditCard, GraduationCap, Laptop, Smartphone,
    Check, AlertTriangle, Monitor, LogOut, Loader2,
    User, Activity, Sun, Moon, Trash2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { MODES, THEMES } from '../theme/colors';

const Profile = ({ user, onBack, onResetProgress, onLogout }) => {
    const { mode, toggleMode, theme, setTheme } = useTheme();
    const isDark = mode === MODES.DARK;

    const [learningMode, setLearningMode] = useState('parallel');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false
    });

    const themeOptions = [
        { id: THEMES.FOREST_GREEN, color: '#3D6652', name: 'Forest' },
        { id: THEMES.ORIGINAL_BLUE, color: '#6366f1', name: 'Blue' },
        { id: THEMES.AMETHYST_PURPLE, color: '#7535D4', name: 'Amethyst' },
        { id: THEMES.SUNSET_ORANGE, color: '#EA580C', name: 'Sunset' },
        { id: THEMES.CRIMSON_RED, color: '#E11D48', name: 'Crimson' }
    ];

    return (
        <div className="min-h-screen bg-base text-surface-400 font-sans pb-16">
            {/* Header */}
            {/* <nav className="border-b border-surface-800 bg-surface-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={onBack} className="flex items-center gap-2 text-surface-400 hover:text-heading transition-colors font-bold uppercase tracking-tighter text-xs">
                        <ArrowLeft size={16} /> Settings
                    </button>
                    <div className="flex items-center gap-4">
                        <button className="text-surface-400 hover:text-heading transition-colors"><CreditCard size={18} /></button>
                        <button className="text-surface-400 hover:text-heading transition-colors relative">
                            <Bell size={18} />
                            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center text-white text-xs font-black">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>
                </div>
            </nav> */}

            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT COLUMN */}
                    <aside className="w-full lg:w-72 shrink-0 space-y-6">

                        {/* Profile Card */}
                        <div className="bg-surface-900/30 border border-surface-800 rounded-3xl p-6 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary-600/20 overflow-hidden">
                                    {/* Placeholder for actual image */}
                                    {user?.username?.[0]?.toUpperCase()}
                                </div>
                                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-surface-400 hover:text-white transition-colors">
                                    <Edit2 size={12} />
                                </button>
                            </div>
                            <h2 className="text-lg font-black text-heading mb-1">{user?.username || 'Arunima'}</h2>
                            <p className="text-xs text-surface-500 mb-6">{user?.email || 'arunima1019@gmail.com'}</p>

                            <div className="w-full space-y-3">
                                <button className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <User size={14} /> Edit Profile
                                </button>
                                <button className="w-full py-2.5 bg-transparent border border-surface-700 hover:border-surface-600 text-heading rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <Lock size={14} /> Change Password
                                </button>
                                <button onClick={onLogout} className="w-full py-2.5 mt-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        </div>

                        {/* Subscription Card */}
                        <div className="bg-surface-900/30 border border-surface-800 rounded-3xl p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full mb-2">Active Plan</span>
                                    <h3 className="text-sm font-black text-heading">Standard Member</h3>
                                </div>
                                <div className="text-surface-700"><Settings size={24} /></div>
                            </div>

                            <div className="bg-surface-950/50 border border-surface-800/50 rounded-2xl p-4 mb-6">
                                <p className="text-[9px] text-surface-500 font-bold uppercase tracking-widest mb-1">AI Credits Balance</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-heading leading-none">0</span>
                                    <span className="text-xs font-bold text-surface-500">Credits</span>
                                </div>
                            </div>

                            <div className="w-full space-y-3">
                                <button className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <CreditCard size={14} /> Top-up Credits
                                </button>
                                <button className="w-full py-2.5 bg-transparent border border-surface-700 hover:border-surface-600 text-heading rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <Activity size={14} /> Transaction History
                                </button>
                            </div>
                        </div>

                    </aside>

                    {/* RIGHT COLUMN */}
                    <div className="flex-1 space-y-6">

                        <div className="mb-8">
                            <h1 className="text-xl font-black text-heading uppercase tracking-tighter mb-2">Manage Workspace</h1>
                            <p className="text-sm text-surface-500">Manage your account, preferences, and workspace configuration to maintain your academic sanctuary.</p>
                        </div>

                        {/* Academic Profile */}
                        <div className="bg-surface-900/30 border border-surface-800 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary-500/10 text-primary-400 rounded-lg"><GraduationCap size={18} /></div>
                                <h2 className="text-base font-black text-heading">Academic Profile</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-2">Target Exam & Branch</label>
                                    <select className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 text-sm font-bold text-heading focus:outline-none focus:border-primary-500 appearance-none">
                                        <option>GATE ith mattane 2027</option>
                                        {/* <option>GATE CS 2027</option> */}
                                    </select>
                                </div>
                                {/* <div>
                                    <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-2">Learning Mode</label>
                                    <div className="flex items-center justify-between bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 cursor-pointer" onClick={() => setLearningMode(learningMode === 'parallel' ? 'subject' : 'parallel')}>
                                        <div>
                                            <p className="text-sm font-bold text-heading">{learningMode === 'parallel' ? 'Parallel Study' : 'Subject by Subject'}</p>
                                            <p className="text-[9px] text-surface-500">{learningMode === 'parallel' ? 'Multiple subjects simultaneously' : 'Master one subject at a time'}</p>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${learningMode === 'parallel' ? 'bg-primary-500' : 'bg-surface-700'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${learningMode === 'parallel' ? 'right-1' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </div>

                        {/* App Preferences */}
                        <div className="bg-surface-900/30 border border-surface-800 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary-500/10 text-primary-400 rounded-lg"><Settings size={18} /></div>
                                <h2 className="text-base font-black text-heading">App Preferences</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-2">Theme Preference</label>
                                    <div className="flex bg-surface-950 border border-surface-800 rounded-xl p-1 w-full max-w-xs">
                                        <button onClick={() => isDark && toggleMode()} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${!isDark ? 'bg-surface-800 text-heading shadow' : 'text-surface-500 hover:text-heading'}`}>
                                            <Sun size={14} /> Day
                                        </button>
                                        <button onClick={() => !isDark && toggleMode()} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-surface-800 text-heading shadow' : 'text-surface-500 hover:text-heading'}`}>
                                            <Moon size={14} /> Midnight
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-2">Accent Color</label>
                                    <div className="flex flex-wrap gap-3">
                                        {themeOptions.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id)}
                                                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${theme === t.id ? 'ring-2 ring-offset-2 ring-offset-surface-900 ring-heading' : 'opacity-80 hover:opacity-100'}`}
                                                style={{ backgroundColor: t.color }}
                                                title={t.name}
                                            >
                                                {theme === t.id && <Check size={12} className="text-white" strokeWidth={4} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* TODO: Notification backend endpoints not implemented yet */}
                                {/* <div>
                                    <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-2">Notification Channels</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {Object.keys(notifications).map(key => (
                                            <div key={key} onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))} className="flex items-center justify-between bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 cursor-pointer select-none">
                                                <span className="text-sm font-bold text-heading capitalize">{key}</span>
                                                <div className={`w-5 h-5 rounded flex items-center justify-center ${notifications[key] ? 'bg-primary-500 text-white' : 'bg-surface-800 border border-surface-700'}`}>
                                                    {notifications[key] && <Check size={12} strokeWidth={4} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}
                            </div>
                        </div>

                        {/* Security */}
                        <div className="bg-surface-900/30 border border-surface-800 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary-500/10 text-primary-400 rounded-lg"><Shield size={18} /></div>
                                <h2 className="text-base font-black text-heading">Security</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* TODO: 2FA endpoint not implemented yet */}
                                <div>
                                    <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-2">Two-Factor Auth</label>
                                    <div className="flex items-center justify-between border border-surface-800 border-dashed rounded-xl p-4 bg-surface-950/50">
                                        <div className="flex gap-3 items-center">
                                            <Shield size={16} className="text-surface-500" />
                                            <div>
                                                <p className="text-xs font-bold text-heading">2FA is Disabled</p>
                                                <p className="text-[9px] text-surface-500">Secure your vault with an extra layer</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-1.5 bg-surface-800 text-heading text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-surface-700 transition-colors">Enable</button>
                                    </div>
                                </div>

                                {/* TODO: Active sessions endpoint not implemented yet */}
                                <div>
                                    <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-2">Active Sessions</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between bg-surface-950 border border-surface-800 rounded-xl px-4 py-3">
                                            <div className="flex gap-3 items-center">
                                                <Laptop size={16} className="text-surface-400" />
                                                <div>
                                                    <p className="text-xs font-bold text-heading">MacBook Pro</p>
                                                    <p className="text-[9px] text-emerald-500">Current Session • Delhi, IN</p>
                                                </div>
                                            </div>
                                            <LogOut size={14} className="text-surface-500 hover:text-rose-500 cursor-pointer" />
                                        </div>
                                        <div className="flex items-center justify-between bg-surface-950 border border-surface-800 rounded-xl px-4 py-3">
                                            <div className="flex gap-3 items-center">
                                                <Smartphone size={16} className="text-surface-400" />
                                                <div>
                                                    <p className="text-xs font-bold text-heading">iPhone 15</p>
                                                    <p className="text-[9px] text-surface-500">Last active 2 hrs ago</p>
                                                </div>
                                            </div>
                                            <LogOut size={14} className="text-surface-500 hover:text-rose-500 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-rose-500"><AlertTriangle size={18} /></div>
                                <h2 className="text-base font-black text-rose-500">Danger Zone</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <button onClick={() => {
                                    if (confirm("This will permanently delete your syllabus progress. Continue?")) {
                                        onResetProgress();
                                    }
                                }} className="py-3 border border-rose-500 text-rose-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                                    <Settings size={14} /> Reset Progress
                                </button>
                                <button className="py-3 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                                    <Trash2 size={14} /> Delete Account
                                </button>
                            </div>
                            <p className="text-[10px] text-surface-500 text-center uppercase tracking-widest">Warning: These actions are irreversible and will permanently remove your data from the Vault.</p>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
