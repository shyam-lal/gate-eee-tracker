import React, { useState, useEffect } from 'react';
import {
    Clock, Target, Calendar, BarChart3,
    Flame, Timer, Activity, TrendingUp, CheckCircle, RotateCw, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CourseCalculatorModal from './calculator/CourseCalculatorModal';
import StreakCalendar from './ui/StreakCalendar';
import GlobalActivityGrid from './ui/GlobalActivityGrid';
import GlobalInsightsModal from './ui/GlobalInsightsModal';
import { battlePlan, syllabus as syllabusApi, analytics } from '../services/api';

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

const Dashboard = ({ user, tools, streakData, onStartFocus, onOpenBattlePlan, onOpenTool }) => {
    const [showCalculator, setShowCalculator] = useState(false);

    // Data states
    const [plan, setPlan] = useState(null);
    const [roadmap, setRoadmap] = useState(null);
    const [syllabusStats, setSyllabusStats] = useState({ completed: 0, total: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [globalInsights, setGlobalInsights] = useState(null);
    const [showInsights, setShowInsights] = useState(false);

    const hasBattlePlan = tools?.some(t => t.tool_type === 'battle_plan') || false; // Or checking logic
    const moduleTool = tools?.find(t => t.tool_type === 'module');

    useEffect(() => {
        // Fetch Battle Plan Data
        battlePlan.getToday().then(setPlan).catch(() => { });
        battlePlan.getRoadmap().then(setRoadmap).catch(() => { });

        // Fetch Syllabus Data
        if (moduleTool) {
            syllabusApi.get(moduleTool.id).then(data => {
                const total = data.reduce((acc, s) => acc + s.topics.reduce((ta, t) => ta + (t.total_modules || 1), 0), 0);
                const completed = data.reduce((acc, s) => acc + s.topics.reduce((ta, t) => ta + (t.completed_modules || 0), 0), 0);
                setSyllabusStats({ completed, total });
            }).catch(() => { });
        }

        // Fetch Recent Activities and Global Insights
        analytics.getRecentActivities().then(setRecentActivities).catch(() => { });
        analytics.getGlobalInsights().then(setGlobalInsights).catch(() => { });
    }, [moduleTool]);

    // Derived stats
    const remainingMins = plan?.summary?.remaining_minutes || 0;
    const formattedRemaining = remainingMins > 0 ? `${Math.floor(remainingMins / 60)}h ${Math.round(remainingMins % 60)}m` : '0m';
    const totalGoalHours = roadmap?.settings?.daily_available_hours || 4;
    const goalProgress = totalGoalHours > 0 && plan?.summary?.completed_minutes
        ? Math.min(100, Math.round((plan.summary.completed_minutes / (totalGoalHours * 60)) * 100))
        : 0;
    const daysRemaining = roadmap?.exam?.days_remaining !== undefined && roadmap?.exam?.days_remaining !== null
        ? roadmap.exam.days_remaining
        : (moduleTool?.target_date ? Math.max(0, Math.ceil((new Date(moduleTool.target_date) - new Date()) / (1000 * 60 * 60 * 24))) : '?');

    const syllabusProgress = syllabusStats.total > 0 ? Math.round((syllabusStats.completed / syllabusStats.total) * 1000) / 10 : 0;

    // Date formatting
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="min-h-screen bg-transparent text-surface-400 overflow-hidden relative p-4 md:p-8 lg:p-12">
            {/* Header */}
            <header className="mb-12">
                <h1 className="text-3xl md:text-5xl font-black text-heading uppercase tracking-tighter leading-none mb-3">
                    Welcome back, Engineer
                </h1>
                <p className="text-sm font-bold text-surface-500 tracking-widest uppercase">
                    {formattedDate} &bull; Phase 2: Technical Proficiency
                </p>
            </header>

            {/* Top Grid: Daily Goal, Streak, Syllabus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                {/* Daily Goal Widget */}
                <div
                    onClick={() => onOpenBattlePlan && onOpenBattlePlan()}
                    className="bg-surface-900 border border-surface-800 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary-500/50 hover:bg-surface-800/50 transition-all"
                >
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest absolute top-6">Daily Goal</h3>

                    {plan ? (
                        <>
                            <div className="relative w-32 h-32 mt-6 mb-4 group-hover:scale-105 transition-transform">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-800" />
                                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * goalProgress / 100)} className="text-primary-500 transition-all duration-1000" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-heading leading-none">{formattedRemaining}</span>
                                    <span className="text-[10px] font-bold text-surface-500 uppercase mt-1">Left</span>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-surface-500">{daysRemaining} days until deadline</p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center mt-6 h-32 text-center opacity-50">
                            <Target size={32} className="text-surface-600 mb-3 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-bold text-surface-500">Setup Battle Plan<br />to track goals</p>
                        </div>
                    )}
                </div>

                {/* Current Streak Widget */}
                <div className="bg-surface-900 border border-surface-800 rounded-3xl overflow-hidden relative group p-6">
                    <GlobalActivityGrid
                        currentStreak={streakData?.currentStreak || 0}
                        activeDays={streakData?.activeDays || []}
                        toolsByDay={streakData?.toolsByDay || {}}
                    />
                </div>

                {/* Syllabus Mastery Widget */}
                <div
                    onClick={() => onOpenPlanner && onOpenPlanner()}
                    className="bg-surface-900 border border-surface-800 rounded-3xl p-6 relative flex flex-col justify-center cursor-pointer hover:border-primary-500/50 hover:bg-surface-800/50 transition-all group"
                >
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest absolute top-6 left-6">Syllabus Mastery</h3>
                    <div className="mt-6 group-hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-4xl font-black text-heading">{syllabusStats.completed} </span>
                                <span className="text-xl font-bold text-surface-500">/ {syllabusStats.total}</span>
                            </div>
                            <span className="text-primary-400 font-black text-lg">{syllabusProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-primary-500 transition-all duration-1000" style={{ width: `${syllabusProgress}%` }} />
                        </div>
                        {syllabusStats.total === 0 && (
                            <p className="text-xs font-bold text-surface-500">Add modules to track progress</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Grid: Charts and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Weekly Focus Trends */}
                <div 
                    className="bg-surface-900 border border-surface-800 rounded-3xl p-6 lg:col-span-2 min-h-[300px] flex flex-col cursor-pointer hover:border-primary-500/50 hover:bg-surface-800/50 transition-all group"
                    onClick={() => setShowInsights(true)}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest group-hover:text-primary-400 transition-colors">Weekly Activity Volume (Eq. Mins)</h3>
                        <div className="text-xs font-bold text-surface-400">Click for Global Insights</div>
                    </div>
                    <div className="flex-1 w-full h-full min-h-[200px] opacity-80 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={globalInsights?.heatmapData ? globalInsights.heatmapData.slice(-7).map(d => {
                                const [y, m, day] = d.date.split('-');
                                const dateObj = new Date(y, m - 1, day);
                                return { name: dateObj.toLocaleDateString('en-US', { weekday: 'short' }), uv: d.value };
                            }) : mockChartData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
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
                    <button onClick={() => setShowCalculator(true)} className="bg-surface-900 border border-surface-800 rounded-3xl p-6 flex flex-col items-center justify-center flex-1 hover:border-primary-500/50 hover:bg-surface-800/50 transition-all group active:scale-[0.98]">
                        <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <h4 className="text-base font-black text-heading mb-2">Run Estimator</h4>
                        <p className="text-xs font-bold text-surface-500 text-center px-4">Predict exam readiness based on logs</p>
                    </button>
                </div>
            </div>

            {/* Bottom Section: Recent Activity / Next Steps */}
            <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">
                        {recentActivities.length > 0 ? 'Recent Activity' : 'Next Steps'}
                    </h3>
                    {recentActivities.length > 0 && (
                        <button className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300">View History</button>
                    )}
                </div>

                <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                        recentActivities.slice(0, 3).map(activity => {
                            let Icon = CheckCircle;
                            let colorClass = 'bg-primary-500/10 text-primary-400';
                            let subLabel = activity.tool_type ? activity.tool_type.replace('_', ' ').toUpperCase() : 'ACTIVITY';
                            let title = activity.value > 0 ? `Logged ${activity.value} mins` : 'Completed activity';
                            if (activity.value === 0) {
                                if (activity.tool_type === 'battle_plan') title = 'Completed task';
                                if (activity.tool_type === 'module') title = 'Completed module';
                            }
                            if (activity.topic_name) {
                                title += activity.value > 0 ? ` in ${activity.topic_name}` : ` for ${activity.topic_name}`;
                            } else if (activity.tool_name) {
                                title += activity.value > 0 ? ` using ${activity.tool_name}` : ` using ${activity.tool_name}`;
                            }

                            if (activity.tool_type === 'module') {
                                Icon = BookOpen;
                                colorClass = 'bg-emerald-500/10 text-emerald-400';
                            } else if (activity.tool_type === 'flashcards') {
                                Icon = RotateCw;
                                colorClass = 'bg-fuchsia-500/10 text-fuchsia-400';
                            }

                            // Simple relative time (e.g. '2 hours ago', 'Yesterday')
                            const date = new Date(activity.created_at);
                            const now = new Date();
                            const diffHrs = Math.floor((now - date) / (1000 * 60 * 60));
                            let timeStr = 'Just now';
                            if (diffHrs > 24) {
                                timeStr = diffHrs < 48 ? 'Yesterday' : `${Math.floor(diffHrs / 24)} days ago`;
                            } else if (diffHrs > 0) {
                                timeStr = `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
                            } else {
                                const diffMins = Math.floor((now - date) / (1000 * 60));
                                if (diffMins > 0) timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                            }

                            return (
                                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-800/50 transition-colors">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black text-heading">{title}</h4>
                                        <p className="text-[9px] font-bold text-surface-500 uppercase tracking-widest mt-0.5">{subLabel}</p>
                                    </div>
                                    <span className="text-xs font-bold text-surface-500 shrink-0">{timeStr}</span>
                                </div>
                            );
                        })
                    ) : (
                        [
                            { id: 'battle_plan', icon: Target, label: 'Configure Battle Plan', sub: 'SET YOUR GOALS', colorClass: 'bg-primary-500/10 text-primary-400', action: onOpenBattlePlan },
                            { id: 'syllabus', icon: BookOpen, label: 'Track Syllabus Progress', sub: 'LOG YOUR MODULES', colorClass: 'bg-emerald-500/10 text-emerald-400', action: () => moduleTool && onOpenTool && onOpenTool(moduleTool) },
                            { id: 'focus', icon: Timer, label: 'Start a Focus Session', sub: 'LOG STUDY TIME', colorClass: 'bg-fuchsia-500/10 text-fuchsia-400', action: onStartFocus }
                        ].map(step => (
                            <div
                                key={step.id}
                                onClick={step.action}
                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-800/50 transition-colors cursor-pointer group"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step.colorClass} group-hover:scale-110 transition-transform`}>
                                    <step.icon size={18} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-black text-heading group-hover:text-primary-400 transition-colors">{step.label}</h4>
                                    <p className="text-[9px] font-bold text-surface-500 uppercase tracking-widest mt-0.5">{step.sub}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Course Calculator Modal */}
            {showCalculator && <CourseCalculatorModal onClose={() => setShowCalculator(false)} />}

            {/* Global Insights Modal */}
            {showInsights && <GlobalInsightsModal onClose={() => setShowInsights(false)} data={globalInsights} />}
        </div>
    );
};

export default Dashboard;
