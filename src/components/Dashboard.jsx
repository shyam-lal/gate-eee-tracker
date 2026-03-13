import React, { useState } from 'react';
import {
    Rocket, Search, Bell, Settings,
    ChevronRight, Play, Clock, Target,
    Zap, Calendar, BarChart3, LayoutGrid,
    BookOpen, Trophy, Sparkles, Users, Plus, Layers,
    MoreVertical, Edit3, Trash2, X, BrainCircuit, AlertCircle, Timer, RotateCcw, Activity, ClipboardCheck
} from 'lucide-react';
import UserStreakWidget from './ui/UserStreakWidget';
import GlobalAnalytics from './analytics/GlobalAnalytics';
import CourseCalculatorModal from './calculator/CourseCalculatorModal';

const Dashboard = ({ user, tools, streakData, onOpenTool, onOpenProfile, onOpenSocial, onOpenPlanner, onSetupTool, onDeleteTool, onRenameTool, onStartFocus, onClearToolData }) => {

    const [menuOpen, setMenuOpen] = useState(null); // toolId of open menu
    const [renamingTool, setRenamingTool] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [showInsights, setShowInsights] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);

    const hasTools = tools && tools.length > 0;

    const handleRename = (tool) => {
        setRenamingTool(tool.id);
        setRenameValue(tool.name);
        setMenuOpen(null);
    };

    const submitRename = () => {
        if (!renamingTool || !renameValue.trim()) {
            setRenamingTool(null);
            return;
        }
        onRenameTool(renamingTool, renameValue.trim());
        setRenamingTool(null);
    };

    const handleClearData = (tool) => {
        if (window.confirm(`Are you sure you want to clear all focus session history for ${tool.name}? Your auto-synced course progress will NOT be affected.`)) {
            onClearToolData(tool.id);
        }
        setMenuOpen(null);
    };

    const handleDelete = (tool) => {
        setMenuOpen(null);
        if (confirm(`Delete "${tool.name}"? All data (subjects, topics, logs) will be permanently lost.`)) {
            onDeleteTool(tool.id);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden relative">
            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Top Bar */}
            <header className="relative z-20 flex justify-between items-center px-6 sm:px-8 py-6 max-w-[1400px] mx-auto w-full">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black italic text-white shadow-lg shadow-indigo-600/20">V</div>
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] leading-none mb-1">Gate <span className="text-indigo-400">Vault</span></h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic leading-none">Command Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
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

            {/* Main Content */}
            <main className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 py-8">

                {/* Due Cards Global Alert */}
                {tools?.some(t => t.due_cards_count > 0) && (
                    <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="text-amber-500 font-black uppercase tracking-tighter text-sm">Flashcards Due for Review</h3>
                                <p className="text-amber-500/70 text-xs font-bold mt-0.5">
                                    You have {tools.reduce((sum, t) => sum + (t.due_cards_count || 0), 0)} flashcards across your decks waiting to be reviewed today.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Welcome + Streak */}
                <div className="mb-12 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    {/* Welcome text */}
                    <div className="space-y-4 flex-1">
                        <span className="inline-flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
                            <Rocket size={12} /> Systems Active
                        </span>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                            Welcome back, <br /> <span className="text-slate-500">{user.username}.</span>
                        </h2>
                        <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed mb-6">
                            {hasTools
                                ? `You have ${tools.length} tool${tools.length > 1 ? 's' : ''} configured. Launch one to continue your preparation or create a new one.`
                                : 'Your Vault is empty. Create your first tracking tool to begin your GATE preparation journey.'
                            }
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={onStartFocus}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 w-max"
                            >
                                <Target size={16} /> Start Focus Mode
                            </button>
                            <button
                                onClick={() => setShowInsights(true)}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 w-max border border-slate-700"
                            >
                                <Activity size={16} /> View Insights
                            </button>
                        </div>
                    </div>

                    {/* User Streak Widget */}
                    {streakData && (
                        <div className="w-full lg:w-80 shrink-0">
                            <UserStreakWidget
                                currentStreak={streakData.currentStreak}
                                activeDays={streakData.activeDays}
                                toolsByDay={streakData.toolsByDay}
                                tools={tools}
                            />
                        </div>
                    )}
                </div>

                {/* Tools Grid */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">My Tools</h3>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{tools?.length || 0} Active</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Existing Tool Cards */}
                        {tools?.map(tool => (
                            <div key={tool.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] group hover:border-indigo-500/30 transition-all relative shadow-2xl shadow-indigo-500/5">

                                {/* Context Menu Button */}
                                <div className="absolute top-5 right-5 z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === tool.id ? null : tool.id); }}
                                        className="p-2 text-slate-600 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {menuOpen === tool.id && (
                                        <div className="absolute top-10 right-0 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden w-44 animate-in fade-in zoom-in-95 duration-200 z-50">
                                            <button onClick={() => handleRename(tool)} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 flex items-center gap-3 uppercase tracking-widest transition-colors">
                                                <Edit3 size={14} /> Rename
                                            </button>

                                            {tool.tool_type === 'focus' ? (
                                                <button onClick={() => handleClearData(tool)} className="w-full text-left px-4 py-3 text-xs font-bold text-amber-400/60 hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-3 uppercase tracking-widest transition-colors">
                                                    <RotateCcw size={14} /> Clear Data
                                                </button>
                                            ) : (
                                                <button onClick={() => handleDelete(tool)} className="w-full text-left px-4 py-3 text-xs font-bold text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 flex items-center gap-3 uppercase tracking-widest transition-colors">
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Tool Content */}
                                <div className="mb-6">
                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform mb-5">
                                        {tool.tool_type === 'module' ? <Layers size={28} /> :
                                            tool.tool_type === 'flashcard' ? <BrainCircuit size={28} /> :
                                                tool.tool_type === 'revision' ? <ClipboardCheck size={28} /> :
                                                    tool.tool_type === 'focus' ? <Timer size={28} /> : <Clock size={28} />}
                                    </div>

                                    {/* Tool Name - editable when renaming */}
                                    {renamingTool === tool.id ? (
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenamingTool(null); }}
                                                className="flex-1 bg-slate-950 border border-indigo-500 rounded-xl px-3 py-2 text-white text-sm font-bold outline-none"
                                            />
                                            <button onClick={submitRename} className="px-3 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Save</button>
                                        </div>
                                    ) : (
                                        <h4 className="text-white font-black uppercase tracking-tighter text-xl mb-1 group-hover:text-indigo-400 transition-colors pr-8">
                                            {tool.name}
                                        </h4>
                                    )}

                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-black uppercase tracking-widest shrink-0">
                                            {tool.tool_type === 'module' ? 'Module' :
                                                tool.tool_type === 'flashcard' ? 'SRS' :
                                                    tool.tool_type === 'revision' ? 'Revision' :
                                                        tool.tool_type === 'focus' ? 'Focus' : 'Course'} Based
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest shrink-0">
                                            {tool.selected_exam || 'GATE'}
                                        </span>
                                        {tool.due_cards_count > 0 && (
                                            <span className="text-[10px] bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1 shrink-0 animate-pulse">
                                                <AlertCircle size={10} /> {tool.due_cards_count} Due
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => onOpenTool(tool)}
                                    className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg"
                                >
                                    Launch Terminal <ChevronRight size={14} />
                                </button>
                            </div>
                        ))}

                        {/* Create New Tool Card */}
                        <div
                            onClick={onSetupTool}
                            className="bg-slate-900/20 backdrop-blur-xl border-2 border-dashed border-slate-700 p-6 sm:p-8 rounded-[2.5rem] group hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 min-h-[280px]"
                        >
                            <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-700 group-hover:text-indigo-400 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all group-hover:scale-110">
                                <Plus size={32} />
                            </div>
                            <div className="text-center">
                                <h4 className="text-slate-400 font-black uppercase tracking-tighter text-lg group-hover:text-white transition-colors mb-1">
                                    Create New Tool
                                </h4>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                                    Course • Module • Focus
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div onClick={onOpenSocial} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 group-hover:scale-110 transition-transform"><Zap size={20} fill="currentColor" /></div>
                            <div>
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Streak</h5>
                                <p className="text-2xl font-black text-white tracking-tighter italic">{user.current_streak || 0} <span className="text-xs text-slate-600 uppercase not-italic">Days</span></p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Calendar size={20} /></div>
                            <div>
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Tools Active</h5>
                                <p className="text-2xl font-black text-white tracking-tighter italic">{tools?.length || 0} <span className="text-xs text-slate-600 uppercase not-italic">Configured</span></p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><BarChart3 size={20} /></div>
                            <div>
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Exam Target</h5>
                                <p className="text-xl font-black text-white tracking-tighter italic uppercase">GATE 2027</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Access Bar */}
                <div className="flex justify-center pb-8 pt-4">
                    <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl overflow-x-auto w-full max-w-lg md:max-w-none no-scrollbar snap-x relative z-50 pointer-events-auto">
                        <button onClick={onSetupTool} className="shrink-0 snap-start flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all">
                            <Plus size={16} /> New Tool
                        </button>
                        <button onClick={onOpenPlanner} className="shrink-0 snap-start flex items-center gap-2 px-6 py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600/30 hover:text-emerald-300 transition-all">
                            <BookOpen size={16} /> Planner
                        </button>
                        <button onClick={() => setShowCalculator(true)} className="shrink-0 snap-start flex items-center gap-2 px-6 py-3 bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-fuchsia-600/30 hover:text-fuchsia-300 transition-all">
                            <Timer size={16} /> Estimator
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2 shrink-0 hidden sm:block"></div>
                        <button onClick={onOpenSocial} className="p-3 text-slate-400 hover:text-white transition-colors relative shrink-0">
                            <Users size={20} />
                        </button>
                        <button className="p-3 text-slate-400 hover:text-white transition-colors shrink-0"><Settings size={20} /></button>
                        <button className="p-3 text-slate-400 hover:text-white transition-colors relative shrink-0">
                            <Bell size={20} />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900"></div>
                        </button>
                    </div>
                </div>
            </main>

            {/* Global Analytics Modal */}
            {showInsights && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setShowInsights(false)}>
                    <div className="bg-[#0b1121] border border-slate-700 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-800/50">
                            <div>
                                <h3 className="font-black text-white text-2xl uppercase tracking-tighter flex items-center gap-3">
                                    <Activity className="text-indigo-400" size={24} /> Global Insights
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cross-tool productivity analytics</p>
                            </div>
                            <button onClick={() => setShowInsights(false)} className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1 bg-slate-950/50">
                            <GlobalAnalytics />
                        </div>
                    </div>
                </div>
            )}

            {/* Course Calculator Modal */}
            {showCalculator && <CourseCalculatorModal onClose={() => setShowCalculator(false)} />}

            {/* Click-away listener for context menus */}
            {menuOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)}></div>
            )}
        </div>
    );
};

export default Dashboard;
