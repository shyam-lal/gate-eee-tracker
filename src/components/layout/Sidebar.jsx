import React from 'react';
import { LayoutGrid, BookOpen, Target, Brain, ClipboardCheck, FileText, Plus, Settings, HelpCircle, Calendar, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = ({ currentView, onViewChange, onSetupTool, isCollapsed, setIsCollapsed }) => {
    const { mode } = useTheme();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        { id: 'planner', label: 'Module Tracker', icon: BookOpen },
        { id: 'battle_plan', label: 'Battle Planner', icon: Target },
        { id: 'daily_planner', label: 'Daily Planner', icon: Calendar },
        { id: 'flashcards', label: 'Flashcards', icon: Brain },
        { id: 'revision_tests', label: 'Revision Tests', icon: ClipboardCheck },
        { id: 'mock_tests', label: 'PYQ Mock Tests', icon: FileText },
    ];

    return (
        <aside className={`fixed bottom-0 left-0 w-full h-16 bg-surface-950 border-t border-surface-800 flex flex-row items-center justify-around z-50 px-2 md:h-screen md:top-0 md:border-r md:border-t-0 md:flex-col md:px-0 md:items-stretch md:justify-start transition-all duration-300 ${isCollapsed ? 'md:w-[72px]' : 'md:w-64'}`}>
            {/* Logo/Header */}
            <div className={`hidden md:flex p-6 pb-8 border-b border-surface-900/50 items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-black italic text-white shadow-lg shadow-primary-500/20 shrink-0">V</div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] leading-none text-heading">Vault</h1>
                        <p className="text-[9px] text-surface-500 font-bold uppercase tracking-widest italic mt-1">Academic Command</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)} 
                    className="p-2 text-surface-500 hover:text-heading hover:bg-surface-800 rounded-lg transition-colors"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex flex-row w-full justify-around py-0 px-0 space-y-0 overflow-x-auto no-scrollbar md:flex-col md:flex-1 md:py-6 md:px-4 md:space-y-1 md:overflow-y-auto md:justify-start">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg w-auto min-w-[4rem] font-bold tracking-wide transition-all md:flex-row md:px-4 md:py-3 md:rounded-xl md:gap-3 ${isCollapsed ? 'md:justify-center md:px-0 md:w-12 md:mx-auto' : 'md:w-full md:justify-start'} ${isActive
                                    ? 'bg-primary-500/10 text-primary-400 shadow-inner'
                                    : 'text-surface-400 hover:bg-surface-900 hover:text-heading'
                                }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon size={18} className={`shrink-0 ${isActive ? 'text-primary-400' : 'opacity-70'}`} />
                            <span className={`text-[9px] md:text-sm ${isCollapsed ? 'md:hidden' : 'md:block'}`}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="hidden md:block p-4 space-y-4">
                {/* Upgrade to Pro Card */}
                {/* <div className="bg-emerald-900/40 border border-emerald-500/20 rounded-2xl p-4 cursor-pointer hover:bg-emerald-900/60 transition-colors">
                    <h4 className="text-sm font-black text-emerald-400 mb-1">Upgrade to Pro</h4>
                    <p className="text-[10px] text-surface-400 font-medium leading-tight">Unlock advanced analytics and cloud sync.</p>
                </div> */}

                <div className="space-y-1">
                    <button 
                        onClick={() => onViewChange('profile')} 
                        className={`flex items-center gap-3 py-3 text-surface-400 hover:bg-surface-900 hover:text-heading rounded-xl font-bold text-sm tracking-wide transition-all ${isCollapsed ? 'justify-center w-12 mx-auto px-0' : 'w-full px-4 justify-start'}`}
                        title={isCollapsed ? "Settings" : undefined}
                    >
                        <Settings size={18} className="shrink-0 opacity-70" />
                        <span className={isCollapsed ? 'hidden' : 'block'}>Settings</span>
                    </button>
                    <button 
                        className={`flex items-center gap-3 py-3 text-surface-400 hover:bg-surface-900 hover:text-heading rounded-xl font-bold text-sm tracking-wide transition-all ${isCollapsed ? 'justify-center w-12 mx-auto px-0' : 'w-full px-4 justify-start'}`}
                        title={isCollapsed ? "Help" : undefined}
                    >
                        <HelpCircle size={18} className="shrink-0 opacity-70" />
                        <span className={isCollapsed ? 'hidden' : 'block'}>Help</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
