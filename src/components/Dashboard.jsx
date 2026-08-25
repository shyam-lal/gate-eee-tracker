import React, { useState, useEffect } from 'react';
import {
    Clock, Target, Calendar, BarChart3,
    Flame, Timer, Activity, TrendingUp, CheckCircle, RotateCw, BookOpen, Shield, AlertTriangle, Save
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

const Dashboard = ({ guestMode, onSignUp, user, tools, streakData, onStartFocus, onOpenBattlePlan, onOpenTool, onOpenAdmin }) => {
    const [showCalculator, setShowCalculator] = useState(false);

    // Guest Mode State
    const [guestData, setGuestData] = useState(null);

    // Data states
    const [plan, setPlan] = useState(null);
    const [roadmap, setRoadmap] = useState(null);
    const [syllabusStats, setSyllabusStats] = useState({ completed: 0, total: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [globalInsights, setGlobalInsights] = useState(null);
    const [showInsights, setShowInsights] = useState(false);

    const hasBattlePlan = tools?.some(t => t.tool_type === 'battle_plan') || false;
    const moduleTool = tools?.find(t => t.tool_type === 'module');

    useEffect(() => {
        if (guestMode) {
            const data = localStorage.getItem('vault_guest_diagnostic');
            if (data) {
                setGuestData(JSON.parse(data));
            }
            return;
        }

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

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    if (guestMode) {
        const score = guestData?.score ?? 3;
        const total = guestData?.total ?? 5;
        const scorePercent = Math.round((score / total) * 100);
        const weakModules = guestData?.weakModules?.length > 0 ? guestData.weakModules : ["Algorithms & Data Structures"];
        
        // Calculate average time per question if available
        let avgTimeSeconds = 42;
        if (guestData?.answers?.length > 0) {
            const sumTime = guestData.answers.reduce((acc, a) => acc + (a.timeSeconds || 0), 0);
            if (sumTime > 0) avgTimeSeconds = Math.round(sumTime / guestData.answers.length);
        }

        return (
            <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 pb-36">
                {/* Top Badge */}
                <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> PREVIEW MODE &bull; GUEST DIAGNOSTIC RESULTS LOADED
                    </span>
                </div>

                {/* Sub-header */}
                <div className="mb-8 max-w-4xl">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                        Initial Assessment Complete, Engineer
                    </h1>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        Your diagnostic run is finished. Based on your inputs, we've mapped your current engineering baseline against industry benchmarks.
                    </p>
                </div>

                {/* Top 2 Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Accuracy Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center justify-between">
                        <div className="w-full">
                            <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
                                {/* SVG Circular Gauge */}
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-slate-100"
                                        strokeWidth="3.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-[#1b4332]"
                                        strokeDasharray={`${scorePercent}, 100`}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-slate-900 leading-none">{scorePercent}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accuracy</span>
                                </div>
                            </div>

                            <div className="inline-block bg-slate-100 text-slate-700 font-bold text-sm px-5 py-2 rounded-xl mb-4">
                                {score} / {total} Correct
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">
                            Accuracy is within expected bounds for a baseline diagnostic. Target accuracy for <span className="font-bold text-slate-600">TOP 100 Rank: 92%+</span>
                        </p>
                    </div>

                    {/* Primary Weak Spot Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Primary Weak Spot</h3>
                                    <p className="text-xs text-slate-400 font-medium">Critical Knowledge Gap Identified</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-5 mb-4">
                                <h4 className="font-bold text-slate-800 text-sm mb-2">{weakModules[0]}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    Based on your diagnostic performance, this area requires immediate attention. You showed consistent difficulty with "Asymptotic Analysis" and "Graph Traversals". Without mastering these foundations, advanced modules will be inaccessible.
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 font-semibold flex items-center gap-2">
                            <span className="text-slate-400">Next recommended focus:</span>
                            <span className="text-emerald-700 font-bold">Dynamic Programming</span>
                        </div>
                    </div>
                </div>

                {/* Bottom 2 Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Syllabus Progress Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
                        <div className="flex justify-between items-baseline mb-4">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SYLLABUS PROGRESS</span>
                            <span className="text-sm font-bold text-slate-900"><span className="text-base font-black">7</span> <span className="text-slate-400">/ 120 Modules</span></span>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mb-4">Initial Mapping</p>

                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '8%' }} />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                                        ✓
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">Core Logic & Math</span>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">Completed</span>
                            </div>

                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs" />
                                    <span className="text-sm font-bold text-slate-800">Digital Logic Systems</span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">Recommended</span>
                            </div>

                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center text-xs text-slate-300" />
                                    <span className="text-sm font-bold text-slate-400">Operating System Internals</span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">Locked</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Comparison Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">PERFORMANCE COMPARISON</span>

                            <div className="mb-5">
                                <div className="flex justify-between items-center text-xs font-bold mb-2">
                                    <span className="text-slate-800 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900" /> Your Speed</span>
                                    <span className="text-slate-900 font-mono text-sm">{avgTimeSeconds}s / question</span>
                                </div>
                                <div className="w-full h-7 bg-slate-100 rounded-xl overflow-hidden p-1 relative">
                                    <div className="h-full bg-slate-400 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider flex items-center px-3" style={{ width: '75%' }}>
                                        BASELINE PERFORMANCE
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between items-center text-xs font-bold mb-2">
                                    <span className="text-slate-800 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" /> GATE Topper Avg</span>
                                    <span className="text-slate-900 font-mono text-sm">30s / question</span>
                                </div>
                                <div className="w-full h-7 bg-slate-100 rounded-xl overflow-hidden p-1 relative">
                                    <div className="h-full bg-emerald-600/50 rounded-lg text-[9px] font-bold text-emerald-950 uppercase tracking-wider flex items-center px-3" style={{ width: '50%' }}>
                                        TARGET VELOCITY
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#173627] text-emerald-100 p-4 rounded-2xl flex items-start gap-3 shadow-md">
                            <span className="text-lg leading-none">💡</span>
                            <p className="text-xs leading-relaxed font-medium">
                                Toppers are 28.5% faster in decision making. Vault's "Timed Sprint" modules are specifically designed to bridge this 12-second gap.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sticky Bottom Bar */}
                <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 bg-white border border-slate-200/90 shadow-2xl rounded-3xl p-4 md:p-5 z-40 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                            <Save className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-bold text-sm">Save these diagnostic results to your profile</h4>
                            <p className="text-xs text-slate-500 hidden sm:block font-medium">Unlock a personalized 6-month roadmap tailored to your specific diagnostic data.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                localStorage.removeItem('vault_guest_diagnostic');
                                onSignUp();
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 transition-colors hidden sm:block uppercase tracking-wider"
                        >
                            Dismiss Preview
                        </button>
                        <button 
                            onClick={onSignUp}
                            className="bg-[#1b4332] hover:bg-[#2d6a4f] text-white px-6 py-3 rounded-2xl font-bold tracking-wide text-xs uppercase transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            <span>Save Progress & Sign Up</span>
                            <span className="text-emerald-400 text-sm">›</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-surface-400 overflow-hidden relative p-4 md:p-8 lg:p-12">
            {/* Header */}
            <header className="mb-12 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-heading uppercase tracking-tighter leading-none mb-3">
                        Welcome back, Engineer
                    </h1>
                    <p className="text-sm font-bold text-surface-500 tracking-widest uppercase">
                        {formattedDate} &bull; Phase 2: Technical Proficiency
                    </p>
                </div>
                {onOpenAdmin && (
                    <button 
                        onClick={onOpenAdmin}
                        className="bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        <Shield size={16} /> <span className="hidden sm:inline">Admin Panel</span>
                    </button>
                )}
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
