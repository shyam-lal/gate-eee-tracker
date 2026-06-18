import React, { useState } from 'react';
import { 
    Clock, Target, Calendar, BarChart3, 
    Flame, Timer, Activity, TrendingUp, CheckCircle, RotateCw, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CourseCalculatorModal from './calculator/CourseCalculatorModal';

// Mock Data for Weekly Focus Trends
const mockChartData = [
    { name: 'Mon', uv: 2 },
    { name: 'Tue', uv: 3 },
    { name: 'Wed', uv: 1 },
    { name: 'Thu', uv: 4 },
    { name: 'Fri', uv: 2 },
    { name: 'Sat', uv: 5 },
    { name: 'Sun', uv: 3 },
];

const mockRecentActivity = [
    { id: 1, icon: CheckCircle, label: 'Mastered: Kirchhoff\'s Laws', sub: 'MODULE COMPLETION', time: '2 hours ago', colorClass: 'bg-emerald-500/10 text-emerald-400' },
    { id: 2, icon: RotateCw, label: 'Logged 45 mins in Power Systems', sub: 'FOCUS SESSION', time: '4 hours ago', colorClass: 'bg-primary-500/10 text-primary-400' },
    { id: 3, icon: BookOpen, label: 'Completed: Vector Calculus Mock Test', sub: 'EXAM SIMULATION', time: 'Yesterday', colorClass: 'bg-fuchsia-500/10 text-fuchsia-400' },
];

const Dashboard = ({ user, tools, streakData, onStartFocus }) => {
    const [showCalculator, setShowCalculator] = useState(false);

    const hasBattlePlan = tools?.some(t => t.tool_type === 'battle_plan') || false; // Mocking battle plan detection
    const moduleTool = tools?.find(t => t.tool_type === 'module');

    // Date formatting
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="min-h-screen bg-transparent text-surface-400 overflow-hidden relative p-8 md:p-12">
            {/* Header */}
            <header className="mb-12">
                <h1 className="text-4xl sm:text-5xl font-black text-heading uppercase tracking-tighter leading-none mb-3">
                    Welcome back, Engineer
                </h1>
                <p className="text-sm font-bold text-surface-500 tracking-widest uppercase">
                    {formattedDate} &bull; Phase 2: Technical Proficiency
                </p>
            </header>

            {/* Top Grid: Daily Goal, Streak, Syllabus */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Daily Goal Widget */}
                <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest absolute top-6">Daily Goal</h3>
                    
                    {hasBattlePlan ? (
                        <>
                            <div className="relative w-32 h-32 mt-6 mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-800" />
                                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="351.8" strokeDashoffset="175.9" className="text-primary-500" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-heading leading-none">2h</span>
                                    <span className="text-[10px] font-bold text-surface-500 uppercase">Left</span>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-surface-500">50% of 4-hour goal met</p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center mt-6 h-32 text-center opacity-50">
                            <Target size={32} className="text-surface-600 mb-3" />
                            <p className="text-xs font-bold text-surface-500">Setup Battle Plan<br/>to track goals</p>
                        </div>
                    )}
                </div>

                {/* Current Streak Widget */}
                <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6 flex flex-col items-center justify-center relative">
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest absolute top-6">Current Streak</h3>
                    <div className="mt-8 mb-4 text-orange-500 relative">
                        <Flame size={48} fill="currentColor" className="drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                    </div>
                    <div className="text-center mb-2">
                        <span className="text-3xl font-black text-heading">{streakData?.currentStreak || 14} </span>
                        <span className="text-xl font-bold text-heading">Days</span>
                    </div>
                    <p className="text-xs font-bold text-surface-500">Top 5% of learners this month</p>
                </div>

                {/* Syllabus Mastery Widget */}
                <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6 relative flex flex-col justify-center">
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest absolute top-6 left-6">Syllabus Mastery</h3>
                    <div className="mt-6">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-4xl font-black text-heading">45 </span>
                                <span className="text-xl font-bold text-surface-500">/ 120</span>
                            </div>
                            <span className="text-emerald-400 font-black text-lg">37.5%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-emerald-500" style={{ width: '37.5%' }} />
                        </div>
                        <p className="text-xs font-bold text-surface-500">7 modules added this week</p>
                    </div>
                </div>
            </div>

            {/* Middle Grid: Charts and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Weekly Focus Trends */}
                <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6 lg:col-span-2 min-h-[300px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Weekly Focus Trends</h3>
                        <select className="bg-transparent text-xs font-bold text-surface-400 outline-none cursor-pointer">
                            <option>Last 7 Days</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full h-full min-h-[200px] opacity-40">
                        {/* Placeholder Chart */}
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockChartData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                                <Bar dataKey="uv" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Actions Stack */}
                <div className="flex flex-col gap-6">
                    {/* Focus Overlay Action */}
                    <button onClick={onStartFocus} className="bg-surface-900 border border-surface-800 rounded-3xl p-6 flex flex-col items-center justify-center flex-1 hover:border-primary-500/50 hover:bg-surface-800/50 transition-all group active:scale-[0.98]">
                        <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Timer size={24} />
                        </div>
                        <h4 className="text-base font-black text-heading mb-2">Focus Overlay</h4>
                        <p className="text-xs font-bold text-surface-500 text-center px-4">Launch pomodoro tracker with ambient sound</p>
                    </button>

                    {/* Run Estimator Action */}
                    <button onClick={() => setShowCalculator(true)} className="bg-surface-900 border border-surface-800 rounded-3xl p-6 flex flex-col items-center justify-center flex-1 hover:border-emerald-500/50 hover:bg-surface-800/50 transition-all group active:scale-[0.98]">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <h4 className="text-base font-black text-heading mb-2">Run Estimator</h4>
                        <p className="text-xs font-bold text-surface-500 text-center px-4">Predict exam readiness based on logs</p>
                    </button>
                </div>
            </div>

            {/* Bottom Section: Recent Activity */}
            <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Recent Activity</h3>
                    <button className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300">View History</button>
                </div>
                
                <div className="space-y-4">
                    {mockRecentActivity.map(activity => (
                        <div key={activity.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-800/50 transition-colors">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.colorClass}`}>
                                <activity.icon size={18} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-heading">{activity.label}</h4>
                                <p className="text-[9px] font-bold text-surface-500 uppercase tracking-widest mt-0.5">{activity.sub}</p>
                            </div>
                            <span className="text-xs font-bold text-surface-500 shrink-0">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Course Calculator Modal */}
            {showCalculator && <CourseCalculatorModal onClose={() => setShowCalculator(false)} />}
        </div>
    );
};

export default Dashboard;
