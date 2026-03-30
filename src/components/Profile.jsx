import React, { useState } from 'react';
import {
    User, Settings, Box, Trash2, Github,
    ChevronRight, Mail, Calendar, Shield,
    ArrowLeft, ExternalLink, Activity, Flame, Sun, Moon, Palette
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { MODES } from '../theme/colors';

const Profile = ({ user, onBack, onResetProgress, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const { mode, toggleMode } = useTheme();
    const isDark = mode === MODES.DARK;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <User size={18} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
        { id: 'tools', label: 'Authorized Tools', icon: <Box size={18} /> },
        { id: 'settings', label: 'Privacy & Security', icon: <Shield size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-base text-surface-400">
            {/* Header */}
            <nav className="border-b border-surface-800 bg-surface-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={onBack} className="flex items-center gap-2 text-surface-400 hover:text-heading transition-colors font-bold uppercase tracking-tighter text-xs">
                        <ArrowLeft size={16} /> Back to Vault
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-black italic text-white text-xs">V</div>
                        <span className="font-black uppercase tracking-tighter text-sm">Vault <span className="text-primary-500">Profile</span></span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Sidebar */}
                    <aside className="lg:w-64 shrink-0 space-y-8">
                        <div className="space-y-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary-600/20">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-heading tracking-tighter uppercase">{user.username}</h1>
                                <p className="text-surface-500 font-bold text-xs uppercase tracking-widest">{user.email}</p>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase tracking-tighter text-xs transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-surface-500 hover:bg-surface-800/50 hover:text-surface-400'}`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                            <div className="pt-4 border-t border-surface-800 mt-4">
                                <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase tracking-tighter text-xs text-rose-500 hover:bg-rose-500/10 transition-all w-full text-left">
                                    <Settings size={18} /> Sign Out
                                </button>
                            </div>
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <section className="flex-1 min-h-[500px]">
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-surface-900/30 border border-surface-800 rounded-[2.5rem] p-8">
                                    <h2 className="text-xl font-black text-heading uppercase tracking-tighter mb-6">Profile Snapshot</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center gap-4 bg-surface-950/50 p-6 rounded-3xl border border-surface-800/50">
                                            <div className="p-3 bg-primary-500/10 rounded-xl text-primary-400"><Activity size={20} /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Tracking Protocol</p>
                                                <p className="font-bold text-heading uppercase tracking-tight">{user.tracking_mode || 'Not Set'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-surface-950/50 p-6 rounded-3xl border border-surface-800/50">
                                            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400"><Flame size={20} fill="currentColor" /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Global Streak</p>
                                                <p className="font-bold text-heading uppercase tracking-tight">{user.current_streak || 0} Days</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="bg-surface-900/30 border border-surface-800 rounded-[2.5rem] p-8">
                                    <h2 className="text-xl font-black text-heading uppercase tracking-tighter mb-4">Contribution Graph</h2>
                                    <div className="h-32 bg-surface-950/50 border border-surface-800/50 rounded-2xl flex items-center justify-center">
                                        <span className="text-surface-700 font-black text-[10px] uppercase tracking-[0.3em]">Temporal sync in progress...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-surface-900/30 border border-surface-800 rounded-[2.5rem] p-8">
                                    <h2 className="text-xl font-black text-heading uppercase tracking-tighter mb-8">Appearance</h2>
                                    <div className="space-y-6">
                                        {/* Dark/Light Mode Toggle */}
                                        <div className="flex items-center justify-between p-5 bg-surface-950/50 border border-surface-800/50 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${isDark ? 'bg-surface-800 text-surface-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {isDark ? <Moon size={20} /> : <Sun size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-heading text-sm">Theme Mode</p>
                                                    <p className="text-xs text-surface-500 font-medium">
                                                        {isDark ? 'Dark mode is active — easy on the eyes during late-night studying.' : 'Light mode is active — clean and bright for daytime focus.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleMode}
                                                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isDark ? 'bg-surface-700' : 'bg-primary-500'}`}
                                            >
                                                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${isDark ? 'left-0.5' : 'left-[calc(100%-1.625rem)]'}`}>
                                                    {isDark ? <Moon size={12} className="text-surface-600" /> : <Sun size={12} className="text-amber-500" />}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Preview */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => !isDark && toggleMode()}
                                                className={`p-5 rounded-2xl border-2 transition-all text-left ${
                                                    isDark
                                                        ? 'border-primary-500 bg-surface-950/80'
                                                        : 'border-surface-800/30 bg-surface-950/30 opacity-60 hover:opacity-80'
                                                }`}
                                            >
                                                <div className="w-full h-16 bg-[#030712] rounded-xl mb-3 flex items-end p-2 gap-1">
                                                    <div className="w-6 h-3 bg-[#2E4D3D] rounded"></div>
                                                    <div className="w-4 h-2 bg-[#1c1e24] rounded"></div>
                                                    <div className="w-5 h-4 bg-[#111318] rounded"></div>
                                                </div>
                                                <p className="text-xs font-black text-heading uppercase tracking-widest">Dark</p>
                                                <p className="text-[10px] text-surface-500 font-bold mt-0.5">Midnight palette</p>
                                            </button>
                                            <button
                                                onClick={() => isDark && toggleMode()}
                                                className={`p-5 rounded-2xl border-2 transition-all text-left ${
                                                    !isDark
                                                        ? 'border-primary-500 bg-surface-950/80'
                                                        : 'border-surface-800/30 bg-surface-950/30 opacity-60 hover:opacity-80'
                                                }`}
                                            >
                                                <div className="w-full h-16 bg-[#f7f9f8] rounded-xl mb-3 flex items-end p-2 gap-1">
                                                    <div className="w-6 h-3 bg-[#2E4D3D] rounded"></div>
                                                    <div className="w-4 h-2 bg-[#e0e7e3] rounded"></div>
                                                    <div className="w-5 h-4 bg-[#eff3f1] rounded"></div>
                                                </div>
                                                <p className="text-xs font-black text-heading uppercase tracking-widest">Light</p>
                                                <p className="text-[10px] text-surface-500 font-bold mt-0.5">Daylight palette</p>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tools' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center px-2">
                                    <h2 className="text-xl font-black text-heading uppercase tracking-tighter">My Active Tools</h2>
                                    <span className="text-[10px] bg-surface-800 text-surface-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">1 Active</span>
                                </div>

                                <div className="bg-surface-900/30 border border-surface-800 rounded-[2.5rem] p-8 space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-surface-950/50 border border-surface-800/50 rounded-3xl group hover:border-primary-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                                                <Box size={28} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-heading uppercase tracking-tight">GATE Syllabus Tracker</h3>
                                                <p className="text-xs text-surface-500 font-semibold uppercase tracking-widest">Curriculum & Time Sync Tool</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    if (confirm("DANGER: This will permanently delete your syllabus progress. Continue?")) {
                                                        onResetProgress();
                                                    }
                                                }}
                                                className="p-3 text-surface-600 hover:text-rose-500 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
                                            >
                                                <Trash2 size={16} /> Reset Data
                                            </button>
                                            <button onClick={onBack} className="px-6 py-2.5 bg-surface-800 hover:bg-primary-600 text-white rounded-xl font-bold uppercase tracking-tight text-xs transition-all flex items-center gap-2">
                                                Open Tool <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="bg-surface-900/30 border border-surface-800 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-black text-heading uppercase tracking-tighter mb-8">Security Configuration</h2>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border-b border-surface-800/50">
                                        <div>
                                            <p className="font-bold text-heading text-sm">Two-Factor Authentication</p>
                                            <p className="text-xs text-surface-500 font-medium">Add an extra layer of security to your account.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-surface-800 rounded-full flex items-center px-1"><div className="w-4 h-4 bg-slate-600 rounded-full"></div></div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border-b border-surface-800/50">
                                        <div>
                                            <p className="font-bold text-heading text-sm">Email Notifications</p>
                                            <p className="text-xs text-surface-500 font-medium">Receive weekly progress reports and deadline alerts.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-primary-600 rounded-full flex items-center justify-end px-1"><div className="w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                                    </div>
                                    <div className="pt-8">
                                        <button className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 border border-rose-500/20 px-6 py-3 rounded-xl hover:bg-rose-500 hover:text-white transition-all">Delete Account Permanently</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                </div>
            </main>
        </div>
    );
};

export default Profile;
