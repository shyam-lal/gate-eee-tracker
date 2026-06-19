import React from 'react';
import { LayoutGrid, BookOpen, Target, Brain, ClipboardCheck, Plus, Settings, HelpCircle, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = ({ currentView, onViewChange, onSetupTool }) => {
    const { mode } = useTheme();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        { id: 'planner', label: 'Module Tracker', icon: BookOpen },
        { id: 'battle_plan', label: 'Battle Planner', icon: Target },
        { id: 'daily_planner', label: 'Daily Planner', icon: Calendar },
        { id: 'flashcards', label: 'Flashcards', icon: Brain },
        { id: 'mock_tests', label: 'Mock Tests', icon: ClipboardCheck },
    ];

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 bg-surface-950 border-r border-surface-800 flex flex-col z-40 transition-colors duration-300">
            {/* Logo/Header */}
            <div className="p-6 pb-8 border-b border-surface-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-black italic text-white shadow-lg shadow-primary-500/20">V</div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] leading-none text-heading">Vault</h1>
                        <p className="text-[9px] text-surface-500 font-bold uppercase tracking-widest italic mt-1">Academic Command</p>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
                                isActive 
                                    ? 'bg-primary-500/10 text-primary-400 shadow-inner' 
                                    : 'text-surface-400 hover:bg-surface-900 hover:text-heading'
                            }`}
                        >
                            <item.icon size={18} className={isActive ? 'text-primary-400' : 'opacity-70'} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 space-y-4">
                {/* Upgrade to Pro Card */}
                <div className="bg-emerald-900/40 border border-emerald-500/20 rounded-2xl p-4 cursor-pointer hover:bg-emerald-900/60 transition-colors">
                    <h4 className="text-sm font-black text-emerald-400 mb-1">Upgrade to Pro</h4>
                    <p className="text-[10px] text-surface-400 font-medium leading-tight">Unlock advanced analytics and cloud sync.</p>
                </div>

                <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-surface-400 hover:bg-surface-900 hover:text-heading rounded-xl font-bold text-sm tracking-wide transition-all">
                        <Settings size={18} className="opacity-70" />
                        Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-surface-400 hover:bg-surface-900 hover:text-heading rounded-xl font-bold text-sm tracking-wide transition-all">
                        <HelpCircle size={18} className="opacity-70" />
                        Help
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
