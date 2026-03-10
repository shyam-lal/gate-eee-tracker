import React, { useState, useEffect } from 'react';
import { analytics as analyticsApi } from '../../services/api';
import {
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, YAxis
} from 'recharts';
import { TrendingUp, Activity, PieChart as PieChartIcon, Flame, Clock, Award } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

const GlobalAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await analyticsApi.getGlobalInsights();
            setData(res);
        } catch (error) {
            console.error("Failed to load analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-48 rounded-[2.5rem] border border-white/5 bg-slate-900/40 animate-pulse flex items-center justify-center">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Insights...</span>
        </div>
    );

    if (!data) return null;

    // Helper to format minutes
    const formatTime = (mins) => {
        if (!mins) return "0m";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // Calculate moving average for smoothing
    const smoothedHeatmap = data.heatmapData.map((d, idx, arr) => {
        // 3-day simple moving average
        let sum = d.value;
        let count = 1;
        if (idx > 0) { sum += arr[idx - 1].value; count++; }
        if (idx > 1) { sum += arr[idx - 2].value; count++; }
        return {
            ...d,
            ma: Math.round(sum / count),
            displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
    });

    return (
        <div className="space-y-6 mt-8 mb-12 animate-in fade-in duration-700">
            <div className="flex items-center gap-3 px-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <Activity size={20} />
                </div>
                <h3 className="font-black text-white text-xl uppercase tracking-tighter">Global Insights</h3>
            </div>

            {/* Top Level Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute -right-4 -top-4 opacity-5 text-indigo-500 group-hover:scale-110 transition-transform"><Clock size={100} /></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Last 7 Days</p>
                    <p className="text-3xl font-black text-white tracking-tighter relative z-10">
                        {formatTime(data.weeklyRecap?.currentWeekMins)}
                    </p>
                    <div className="flex items-center gap-1 mt-2 relative z-10">
                        {data.weeklyRecap?.percentageChange > 0 ? (
                            <span className="text-xs font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">+{data.weeklyRecap?.percentageChange}%</span>
                        ) : (
                            <span className="text-xs font-bold text-slate-500 flex items-center bg-slate-800 px-2 py-0.5 rounded-full">{data.weeklyRecap?.percentageChange}%</span>
                        )}
                        <span className="text-[9px] font-bold text-slate-600 uppercase">vs last week</span>
                    </div>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute -right-4 -top-4 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform"><Award size={100} /></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Consistency</p>
                    <p className="text-3xl font-black text-emerald-400 tracking-tighter relative z-10">
                        {data.consistencyScore}%
                    </p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-2 relative z-10">Days active out of 30</p>
                </div>

                <div className="col-span-2 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-xl border border-indigo-500/20 p-6 rounded-3xl flex items-center">
                    <div>
                        <h4 className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-xs mb-1">
                            <Flame size={14} /> AI Insight
                        </h4>
                        <p className="text-indigo-100/80 font-medium text-sm leading-relaxed">
                            {data.weeklyRecap?.currentWeekMins > data.weeklyRecap?.previousWeekMins
                                ? "You're accelerating! You've logged more deep work this week than last week. Keep riding this momentum."
                                : "Your study volume is down slightly this week. Consider setting a small, highly achievable 25m Focus Session today to rebuild momentum."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 30-Day Activity Trend */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-[2.5rem] relative">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h4 className="text-white font-black uppercase tracking-tighter text-lg mb-1">30-Day Velocity</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Daily Minutes & 3-Day Trend</p>
                        </div>
                        <div className="p-2 bg-slate-800 rounded-xl text-slate-400"><TrendingUp size={16} /></div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={smoothedHeatmap} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="displayDate"
                                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `${val}m`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '1rem', color: '#fff' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#334155"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Raw Daily Mins"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ma"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    dot={false}
                                    name="3-Day Average"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tool Distribution */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-[2.5rem] relative flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-white font-black uppercase tracking-tighter text-lg mb-1">Allocation</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Time by Subject/Tool</p>
                        </div>
                        <div className="p-2 bg-slate-800 rounded-xl text-slate-400"><PieChartIcon size={16} /></div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center">
                        {data.toolDistribution.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={data.toolDistribution}
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.toolDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatTime(value)}
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '1rem', color: '#fff', fontWeight: 'bold' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-full mt-4 space-y-2">
                                    {data.toolDistribution.map((entry, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                <span className="text-slate-300 font-bold truncate max-w-[120px]">{entry.name}</span>
                                            </div>
                                            <span className="text-white font-black">{formatTime(entry.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-sm font-bold text-slate-600 uppercase tracking-widest p-8">
                                No data logged yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalAnalytics;
