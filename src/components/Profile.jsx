import React, { useState } from 'react';
import {
    User, Settings, Box, Trash2, Github,
    ChevronRight, Mail, Calendar, Shield,
    ArrowLeft, ExternalLink, Activity, Flame
} from 'lucide-react';

const Profile = ({ user, onBack, onResetProgress, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <User size={18} /> },
        { id: 'tools', label: 'Authorized Tools', icon: <Box size={18} /> },
        { id: 'settings', label: 'Privacy & Security', icon: <Shield size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Header */}
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-tighter text-xs">
                        <ArrowLeft size={16} /> Back to Vault
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black italic text-white text-xs">V</div>
                        <span className="font-black uppercase tracking-tighter text-sm">Vault <span className="text-indigo-500">Profile</span></span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Sidebar */}
                    <aside className="lg:w-64 shrink-0 space-y-8">
                        <div className="space-y-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-600/20">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tighter uppercase">{user.username}</h1>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{user.email}</p>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase tracking-tighter text-xs transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                            <div className="pt-4 border-t border-slate-800 mt-4">
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
                                <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-8">
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Profile Snapshot</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center gap-4 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
                                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Activity size={20} /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tracking Protocol</p>
                                                <p className="font-bold text-white uppercase tracking-tight">{user.tracking_mode || 'Not Set'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
                                            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400"><Flame size={20} fill="currentColor" /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Streak</p>
                                                <p className="font-bold text-white uppercase tracking-tight">{user.current_streak || 0} Days</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-8">
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Contribution Graph</h2>
                                    <div className="h-32 bg-slate-950/50 border border-slate-800/50 rounded-2xl flex items-center justify-center">
                                        <span className="text-slate-700 font-black text-[10px] uppercase tracking-[0.3em]">Temporal sync in progress...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tools' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center px-2">
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">My Active Tools</h2>
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">1 Active</span>
                                </div>

                                <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-slate-950/50 border border-slate-800/50 rounded-3xl group hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                <Box size={28} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-white uppercase tracking-tight">GATE Syllabus Tracker</h3>
                                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Curriculum & Time Sync Tool</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    if (confirm("DANGER: This will permanently delete your syllabus progress. Continue?")) {
                                                        onResetProgress();
                                                    }
                                                }}
                                                className="p-3 text-slate-600 hover:text-rose-500 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
                                            >
                                                <Trash2 size={16} /> Reset Data
                                            </button>
                                            <button onClick={onBack} className="px-6 py-2.5 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-tight text-xs transition-all flex items-center gap-2">
                                                Open Tool <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-8">Security Configuration</h2>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                                        <div>
                                            <p className="font-bold text-white text-sm">Two-Factor Authentication</p>
                                            <p className="text-xs text-slate-500 font-medium">Add an extra layer of security to your account.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-slate-800 rounded-full flex items-center px-1"><div className="w-4 h-4 bg-slate-600 rounded-full"></div></div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                                        <div>
                                            <p className="font-bold text-white text-sm">Email Notifications</p>
                                            <p className="text-xs text-slate-500 font-medium">Receive weekly progress reports and deadline alerts.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1"><div className="w-4 h-4 bg-white rounded-full shadow-md"></div></div>
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
