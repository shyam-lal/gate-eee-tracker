import React from 'react';
import { createPortal } from 'react-dom';
import { Activity, X, Clock, Award, Flame, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9'];

const GlobalInsightsModal = ({ onClose, data }) => {
    if (!data) return null;

    const { heatmapData, consistencyScore, toolDistribution, weeklyRecap } = data;

    // Formatting for Last 7 Days
    const currentWeekMins = weeklyRecap?.currentWeekMins || 0;
    const hours = Math.floor(currentWeekMins / 60);
    const mins = currentWeekMins % 60;
    const pctChange = weeklyRecap?.percentageChange || 0;
    const isPositive = pctChange > 0;

    // Heatmap formatting for chart
    const formattedHeatmap = heatmapData?.map(d => {
        const [y, m, day] = d.date.split('-');
        const dateObj = new Date(y, m - 1, day);
        return {
            name: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            uv: d.value,
        };
    }) || [];

    // AI Insight text
    let aiInsight = "You're building consistent momentum. Keep logging your focus sessions and module completions to track your true academic velocity.";
    if (pctChange < 0) {
        aiInsight = `Your study volume is down slightly (${pctChange}%) this week. Consider setting a small, highly achievable 25m Focus Session today to rebuild momentum.`;
    } else if (pctChange > 20) {
        aiInsight = `Incredible progress! Your volume is up ${pctChange}%. Make sure to incorporate active recall to solidify these gains.`;
    }

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#0b1120] border border-surface-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-surface-800 flex justify-between items-start relative shrink-0">
                    <div className="flex items-center gap-3">
                        <Activity className="text-primary-500" size={24} />
                        <div>
                            <h2 className="text-heading font-black uppercase tracking-tighter text-2xl leading-none mb-1">
                                Global Insights
                            </h2>
                            <p className="text-[10px] text-surface-500 font-bold tracking-widest uppercase">
                                Cross-Tool Activity & Equivalent Time
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-surface-500 hover:text-heading transition-colors p-2 -mr-2">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto">
                    
                    {/* Top Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        
                        {/* Last 7 Days */}
                        <div className="bg-[#111827] border border-surface-800 rounded-2xl p-6 relative overflow-hidden group">
                            <Clock size={80} className="absolute -right-6 -top-6 text-surface-800/20 group-hover:text-primary-500/10 transition-colors" />
                            <h3 className="text-[10px] text-surface-500 font-black uppercase tracking-widest mb-4">Last 7 Days</h3>
                            <div className="text-4xl font-black text-heading tracking-tighter mb-4 relative z-10">
                                {hours > 0 && `${hours}h `}{mins}m
                            </div>
                            <div className="flex items-center gap-2 relative z-10">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-800 text-surface-400'}`}>
                                    {pctChange > 0 ? '+' : ''}{pctChange}%
                                </span>
                                <span className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">VS LAST WEEK</span>
                            </div>
                        </div>

                        {/* Consistency */}
                        <div className="bg-[#111827] border border-surface-800 rounded-2xl p-6 relative overflow-hidden group">
                            <Award size={80} className="absolute -right-6 -top-6 text-surface-800/20 group-hover:text-emerald-500/10 transition-colors" />
                            <h3 className="text-[10px] text-surface-500 font-black uppercase tracking-widest mb-4">Consistency</h3>
                            <div className="text-4xl font-black text-emerald-400 tracking-tighter mb-4 relative z-10">
                                {consistencyScore}%
                            </div>
                            <div className="text-[10px] text-surface-500 font-bold uppercase tracking-widest relative z-10">
                                DAYS ACTIVE OUT OF 30
                            </div>
                        </div>

                        {/* AI Insight */}
                        <div className="bg-[#111827] border border-surface-800 rounded-2xl p-6 relative">
                            <div className="flex items-center gap-2 mb-4">
                                <Flame size={14} className="text-primary-500" />
                                <h3 className="text-[10px] text-primary-500 font-black uppercase tracking-widest">AI Insight</h3>
                            </div>
                            <p className="text-sm font-medium text-surface-300 leading-relaxed">
                                {aiInsight}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* 30-Day Velocity Chart */}
                        <div className="bg-[#111827] border border-surface-800 rounded-2xl p-6 md:col-span-2 flex flex-col h-[300px]">
                            <div className="flex justify-between items-start mb-6 shrink-0">
                                <div>
                                    <h3 className="text-base font-black text-heading uppercase tracking-tighter mb-1">30-Day Velocity</h3>
                                    <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Equivalent Minutes & 3-Day Trend</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400">
                                    <TrendingUp size={14} />
                                </div>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={formattedHeatmap} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                            itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="uv" 
                                            stroke="#6366f1" 
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#6366f1', stroke: '#0f172a', strokeWidth: 2 }}
                                            name="Eq. Minutes"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Allocation Donut */}
                        <div className="bg-[#111827] border border-surface-800 rounded-2xl p-6 flex flex-col h-[300px]">
                            <div className="flex justify-between items-start mb-6 shrink-0">
                                <div>
                                    <h3 className="text-base font-black text-heading uppercase tracking-tighter mb-1">Allocation</h3>
                                    <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Time by Subject/Tool</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400">
                                    <PieChartIcon size={14} />
                                </div>
                            </div>
                            
                            <div className="flex-1 relative flex flex-col">
                                <div className="flex-1 min-h-[150px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={toolDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {toolDistribution?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                
                                <div className="mt-4 flex flex-col gap-2 max-h-[80px] overflow-y-auto no-scrollbar">
                                    {toolDistribution?.map((item, index) => {
                                        const hrs = Math.floor(item.value / 60);
                                        const mns = item.value % 60;
                                        return (
                                            <div key={index} className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="text-surface-400 truncate max-w-[120px]">{item.name}</span>
                                                </div>
                                                <span className="font-bold text-heading shrink-0">
                                                    {hrs > 0 ? `${hrs}h ` : ''}{mns}m
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {(!toolDistribution || toolDistribution.length === 0) && (
                                        <div className="text-center text-surface-500 text-xs">No data yet</div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default GlobalInsightsModal;
