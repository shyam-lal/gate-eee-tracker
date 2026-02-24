import React from 'react';
import {
    Rocket, Search, Bell, Settings,
    ChevronRight, Play, Clock, Target,
    Zap, Calendar, BarChart3, LayoutGrid,
    BookOpen, Trophy, Sparkles, Users
} from 'lucide-react';

const Dashboard = ({ user, syllabus, onOpenVault, onOpenProfile, onOpenSocial, progress }) => {
    const nextUp = syllabus?.[0]?.topics?.[0] || { name: 'Initialize Syllabus', subject: 'Architecture' };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden relative">
            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Top Bar */}
            <header className="relative z-20 flex justify-between items-center px-8 py-6 max-w-[1400px] mx-auto w-full">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black italic text-white shadow-lg shadow-indigo-600/20">V</div>
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] leading-none mb-1">Gate <span className="text-indigo-400">Vault</span></h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic leading-none">Command Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex bg-slate-900/50 border border-slate-800 rounded-full px-4 py-2 items-center gap-3">
                        <Search size={14} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Global Search</span>
                        <div className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-slate-600">CTRL K</div>
                    </div>
                    <button onClick={onOpenProfile} className="relative group">
                        <div className="w-10 h-10 bg-slate-800 rounded-full border border-slate-700 overflow-hidden group-hover:border-indigo-500 transition-colors">
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black">
                                {user.username[0].toUpperCase()}
                            </div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-[#020617]"></div>
                    </button>
                </div>
            </header>

            {/* Main Command Hub */}
            <main className="relative z-10 max-w-[1400px] mx-auto px-8 py-8 h-[calc(100vh-100px)] flex flex-col">

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                    {/* Left: Mission Logic */}
                    <div className="lg:col-span-4 space-y-12">
                        <div className="space-y-4">
                            <span className="inline-flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
                                <Rocket size={12} /> Systems Active
                            </span>
                            <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                                Leveling <br /> <span className="text-slate-500">Up,</span> <br /> {user.username}.
                            </h2>
                            <p className="text-slate-400 text-sm font-medium max-w-xs leading-relaxed">
                                Your destination is {progress}% clear. Synchronize your study logs to update terminal targets.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] pl-1">Primary Objective</h3>
                            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] group hover:border-indigo-500/30 transition-all cursor-pointer shadow-2xl shadow-indigo-500/5">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-black uppercase tracking-widest">Ongoing</span>
                                </div>
                                <h4 className="text-white font-black uppercase tracking-tighter text-xl mb-2 group-hover:text-indigo-400 transition-colors">{nextUp.name}</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">{nextUp.subject || 'Engineering'}</p>
                                <button onClick={onOpenVault} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    Launch Terminal <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Center: The Core */}
                    <div className="lg:col-span-4 flex items-center justify-center perspective-[1000px]">
                        <div className="relative w-72 h-72 md:w-96 md:h-96">
                            {/* Visual Rings */}
                            <div className="absolute inset-0 border-[20px] border-slate-900/50 rounded-full"></div>
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle
                                    cx="50%" cy="50%" r="44%"
                                    stroke="currentColor" strokeWidth="20" fill="transparent"
                                    strokeDasharray="276%"
                                    strokeDashoffset={`${276 * (1 - progress / 100)}%`}
                                    className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>

                            {/* Inner Glow Circle */}
                            <div className="absolute inset-10 bg-[#020617] rounded-full border border-white/5 flex flex-col items-center justify-center group">
                                <div className="absolute inset-4 bg-indigo-500/5 rounded-full animate-pulse"></div>
                                <div className="relative text-center">
                                    <span className="block text-6xl md:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">{progress}%</span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1 drop-shadow-md">
                                        Vault Cleared <Sparkles size={10} />
                                    </span>
                                </div>

                                {/* Orbiting particles (CSS only simple version) */}
                                <div className="absolute inset-[-10px] border-2 border-dashed border-indigo-500/20 rounded-full animate-[spin_20s_linear_infinite] pointer-events-none"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Telemetry */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div onClick={onOpenSocial} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 w-fit mb-4 group-hover:scale-110 transition-transform"><Zap size={20} fill="currentColor" /></div>
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Weekly Streak</h5>
                                <p className="text-2xl font-black text-white tracking-tighter italic">{user.current_streak || 0} <span className="text-xs text-slate-600 uppercase not-italic">Days</span></p>
                            </div>
                            <div onClick={onOpenVault} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 w-fit mb-4"><Calendar size={20} /></div>
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Next Deadline</h5>
                                <p className="text-xl font-black text-white tracking-tighter italic uppercase">FEB 2027</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] space-y-8">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fleet Status</h4>
                                <BarChart3 size={14} className="text-slate-600" />
                            </div>

                            <div className="space-y-6">
                                {syllabus.slice(0, 3).map((sub, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500 truncate max-w-[150px]">{sub.name}</span>
                                            <span className="text-indigo-400">82%</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 w-[82%]"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={onOpenVault} className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all">
                                View Full Terminal <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Quick Access Bar */}
                <div className="relative z-20 pb-8 flex justify-center pt-8">
                    <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
                        <button onClick={() => onOpenVault()} className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
                            <LayoutGrid size={16} /> Syllabus Terminal
                        </button>
                        <button onClick={onOpenSocial} className="p-3 text-slate-400 hover:text-white transition-colors relative">
                            <Users size={20} />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2"></div>
                        <button className="p-3 text-slate-400 hover:text-white transition-colors"><Settings size={20} /></button>

                        <button className="p-3 text-slate-400 hover:text-white transition-colors relative">
                            <Bell size={20} />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900"></div>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
