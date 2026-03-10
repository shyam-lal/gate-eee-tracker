import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Standard theme
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Make katex globally available for Quill's formula module
window.katex = katex;

// Custom Divider Link
const BlockEmbed = Quill.import('blots/block/embed');
class DividerBlot extends BlockEmbed { }
DividerBlot.blotName = 'divider';
DividerBlot.tagName = 'hr';
Quill.register(DividerBlot);

import { planner as plannerApi } from '../../services/api';
import {
    ChevronLeft, ChevronRight, Calendar, CheckCircle2,
    Circle, Clock, Plus, GripVertical, Trash2, LayoutGrid, CalendarDays,
    Minimize2, Maximize2
} from 'lucide-react';
import debounce from 'lodash.debounce';

const getMonday = (d) => {
    const dCopy = new Date(d);
    const day = dCopy.getDay();
    const diff = dCopy.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(dCopy.setDate(diff));
};

const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getDaysInWeek = (monday) => {
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
};

const getMonthsInYear = (year) => {
    return Array.from({ length: 12 }).map((_, i) => {
        return new Date(year, i, 1);
    });
};

const getFirstAndLastOfMonth = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    return {
        start: new Date(y, m, 1),
        end: new Date(y, m + 1, 0)
    };
};

// -------------------------------------------------------------
// Component
// -------------------------------------------------------------
const PlannerDashboard = ({ onBack }) => {
    const quillRef = useRef(null);

    // Top Level State
    const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
    const [timelineDate, setTimelineDate] = useState(new Date());
    const [isKanbanCollapsed, setIsKanbanCollapsed] = useState(false);
    const [isDiaryCollapsed, setIsDiaryCollapsed] = useState(false);

    // Diary State (only actively used in 'week' mode)
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [diaryContent, setDiaryContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Goals State
    const [goals, setGoals] = useState([]);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // --- EFFECT: Load Diary ---
    useEffect(() => {
        if (viewMode === 'week') {
            loadDiary(selectedDate);
        }
    }, [selectedDate, viewMode]);

    const loadDiary = async (date) => {
        try {
            const dateStr = formatDate(date);
            const res = await plannerApi.getDailyNote(dateStr);
            setDiaryContent(res.content || '');
        } catch (error) {
            console.error('Failed to load diary:', error);
        }
    };

    // Auto-save logic
    const debouncedSave = useCallback(
        debounce(async (dateStr, content) => {
            setIsSaving(true);
            try {
                await plannerApi.saveDailyNote(dateStr, content);
            } catch (err) {
                console.error("Failed to save note:", err);
            } finally {
                setIsSaving(false);
            }
        }, 1000),
        []
    );

    const handleDiaryChange = (value) => {
        setDiaryContent(value);
        if (viewMode === 'week') {
            debouncedSave(formatDate(selectedDate), value);
        }
    };

    // --- EFFECT: Load Kanban Goals ---
    useEffect(() => {
        loadGoals();
        // eslint-disable-next-line
    }, [timelineDate, viewMode]);

    const loadGoals = async () => {
        try {
            if (viewMode === 'week') {
                const mon = getMonday(timelineDate);
                const res = await plannerApi.getGoals(formatDate(mon)); // exact week start
                setGoals(res);
            } else if (viewMode === 'month') {
                const { start, end } = getFirstAndLastOfMonth(timelineDate);
                const res = await plannerApi.getGoals(formatDate(start), formatDate(end));
                setGoals(res);
            }
        } catch (error) {
            console.error('Failed to load goals:', error);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoalTitle.trim()) return;
        try {
            let weekStartStr = '';
            if (viewMode === 'week') {
                weekStartStr = formatDate(getMonday(timelineDate));
            } else {
                weekStartStr = formatDate(new Date(timelineDate.getFullYear(), timelineDate.getMonth(), 1));
            }

            const newGoal = await plannerApi.createWeeklyGoal(weekStartStr, newGoalTitle);
            setGoals([...goals, newGoal]);
            setNewGoalTitle('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!confirm('Delete this objective?')) return;
        try {
            await plannerApi.deleteGoal(id);
            setGoals(goals.filter(g => g.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    // --- DRAG AND DROP ---
    const handleDragStart = (e, goalId) => {
        e.dataTransfer.setData('goalId', goalId);
        setIsDragging(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        setIsDragging(false);
        const goalId = e.dataTransfer.getData('goalId');
        if (!goalId) return;

        setGoals(goals.map(g => g.id == goalId ? { ...g, status: newStatus } : g));
        try {
            await plannerApi.updateGoalStatus(goalId, newStatus);
        } catch (err) {
            console.error(err);
            loadGoals();
        }
    };

    const columns = [
        { id: 'todo', title: 'To Do', icon: <Circle size={16} className="text-slate-400" /> },
        { id: 'in_progress', title: 'Doing', icon: <Clock size={16} className="text-amber-500" /> },
        { id: 'completed', title: 'Done', icon: <CheckCircle2 size={16} className="text-emerald-500" /> }
    ];

    // --- RENDER HELPERS ---
    const changeTimelineScope = (dir) => {
        const nd = new Date(timelineDate);
        if (viewMode === 'week') {
            nd.setDate(nd.getDate() + (dir * 7));
        } else {
            nd.setMonth(nd.getMonth() + dir);
        }
        setTimelineDate(nd);
    };

    const scrollItems = useMemo(() => {
        if (viewMode === 'week') {
            const monday = getMonday(timelineDate);
            return getDaysInWeek(monday).map(d => ({
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                subLabel: d.getDate(),
                date: d,
                isActive: formatDate(d) === formatDate(selectedDate)
            }));
        } else {
            const year = timelineDate.getFullYear();
            return getMonthsInYear(year).map(d => ({
                label: d.toLocaleDateString('en-US', { month: 'short' }),
                subLabel: year,
                date: d,
                isActive: d.getMonth() === timelineDate.getMonth() && d.getFullYear() === timelineDate.getFullYear()
            }));
        }
    }, [viewMode, timelineDate, selectedDate]);

    const handleItemClick = (item) => {
        if (viewMode === 'week') {
            setSelectedDate(item.date);
        } else {
            setTimelineDate(item.date);
        }
    };

    const toggleKanbanCollapse = () => {
        // Prevent collapsing both at the same time
        if (!isKanbanCollapsed && isDiaryCollapsed) {
            setIsDiaryCollapsed(false);
        }
        setIsKanbanCollapsed(!isKanbanCollapsed);
    };

    const toggleDiaryCollapse = () => {
        // Prevent collapsing both at the same time
        if (!isDiaryCollapsed && isKanbanCollapsed) {
            setIsKanbanCollapsed(false);
        }
        setIsDiaryCollapsed(!isDiaryCollapsed);
    };

    // --- QUILL CONFIG ---
    const customLinkHandler = useCallback(function (value) {
        if (value) {
            const quill = this.quill;
            const range = quill.getSelection();
            let text = '';
            if (range && range.length > 0) {
                text = quill.getText(range.index, range.length);
            }

            let linkText = prompt("Enter text to display (or leave blank to use URL):", text);
            if (linkText === null) return; // cancelled

            let linkUrl = prompt("Enter the URL:");
            if (linkUrl) {
                // Ensure proper protocol
                if (!/^https?:\/\//i.test(linkUrl)) {
                    linkUrl = 'https://' + linkUrl;
                }

                // If no text was selected or provided, use URL as text
                if (!linkText.trim()) linkText = linkUrl;

                if (range && range.length > 0) {
                    quill.deleteText(range.index, range.length);
                }
                const insertIndex = range ? range.index : 0;
                quill.insertText(insertIndex, linkText, 'link', linkUrl);
                quill.setSelection(insertIndex + linkText.length);
            }
        } else {
            this.quill.format('link', false);
        }
    }, []);

    const customDividerHandler = useCallback(function () {
        const quill = this.quill;
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'divider', true, Quill.sources.USER);
        quill.insertText(range.index + 1, '\n', Quill.sources.SILENT);
        quill.setSelection(range.index + 2, Quill.sources.SILENT);
    }, []);

    const modules = useMemo(() => ({
        formula: true,
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                [{ 'size': ['small', false, 'large', 'huge'] }], // Native font sizes
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'formula', 'code-block', 'divider'],
                ['clean']
            ],
            handlers: {
                link: customLinkHandler,
                divider: customDividerHandler
            }
        }
    }), [customLinkHandler, customDividerHandler]);

    // Compute grid spans cleanly
    // Base layout when both open is 5 + 7 = 12 columns
    let kanbanCols = 'xl:col-span-12';
    let diaryCols = 'xl:col-span-12';

    if (viewMode === 'week') {
        if (isKanbanCollapsed) {
            kanbanCols = 'xl:col-span-1';
            diaryCols = 'xl:col-span-11';
        } else if (isDiaryCollapsed) {
            kanbanCols = 'xl:col-span-11';
            diaryCols = 'xl:col-span-1';
        } else {
            kanbanCols = 'xl:col-span-5';
            diaryCols = 'xl:col-span-7';
        }
    }


    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-4 md:p-8 selection:bg-indigo-500/30">
            {/* Custom Styles for React Quill Dark Mode */}
            <style>{`
                .quill {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .ql-toolbar {
                    background-color: rgba(15, 23, 42, 0.8) !important;
                    border: none !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    border-radius: 1.5rem 1.5rem 0 0;
                    padding: 12px 16px !important;
                }
                .ql-container {
                    border: none !important;
                    background-color: transparent;
                    font-family: inherit;
                    flex-grow: 1;
                    overflow-y: auto;
                }
                .ql-editor {
                    font-size: 1rem;
                    color: #e2e8f0;
                    padding: 24px;
                }
                .ql-editor hr {
                    border: 0;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: 1rem 0;
                }
                .ql-editor.ql-blank::before {
                    color: #64748b;
                    font-style: italic;
                }
                .ql-snow .ql-stroke { stroke: #94a3b8; }
                .ql-snow .ql-fill { fill: #94a3b8; }
                .ql-snow .ql-picker { color: #94a3b8; }
                .ql-snow .ql-picker-options { background-color: #0f172a; border-color: rgba(255,255,255,0.1); }
                .ql-snow .ql-picker-item:hover { color: #fff; }
                button.ql-active .ql-stroke { stroke: #8b5cf6 !important; }
                
                /* Subtle scrollbar for Kanban to indicate scrollability on smaller screens */
                .planner-scroll::-webkit-scrollbar {
                    height: 6px;
                    width: 6px;
                }
                .planner-scroll::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 4px;
                }
                .planner-scroll::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.3);
                    border-radius: 4px;
                }
                .planner-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.6);
                }

                /* Add a custom icon content for our divider button */
                .ql-divider::after {
                    content: '—';
                    font-size: 14px;
                    font-weight: bold;
                    color: #94a3b8;
                }
                .ql-divider:hover::after {
                    color: #fff;
                }
            `}</style>

            {/* Header */}
            <header className="max-w-[1600px] mx-auto flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tighter cursor-pointer select-none">Command Center</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest cursor-default select-none">Hybrid Study Planner</p>
                    </div>
                </div>
            </header>

            {/* TIMELINE NAVIGATOR */}
            <div className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* View Toggles */}
                <div className="flex items-center bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    <button
                        onClick={() => setViewMode('week')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                    <LayoutGrid size={14} /> Weekly
                </button>
                <button
                    onClick={() => setViewMode('month')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                <CalendarDays size={14} /> Monthly
            </button>
        </div>

                {/* Horizontal Scroll Strip */ }
    <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-md p-2 rounded-[2rem] border border-white/5 overflow-hidden flex-1 max-w-3xl justify-center">
        <button onClick={() => changeTimelineScope(-1)} className="p-2 text-slate-400 hover:text-white shrink-0"><ChevronLeft size={16} /></button>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth px-2">
            {scrollItems.map((item, idx) => (
                <button
                    key={idx}
                    onClick={() => handleItemClick(item)}
                    className={`flex flex-col items-center justify-center min-w-[3rem] p-2 rounded-2xl transition-all cursor-pointer select-none shrink-0 ${
                item.isActive
                    ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl border border-white/10 scale-110 z-10'
                    : 'hover:bg-slate-800 border border-transparent'
            }`}
                            >
            <span className={`text-[9px] font-black uppercase tracking-widest ${item.isActive ? 'text-indigo-400' : 'text-slate-500'}`}>{item.label}</span>
        <span className={`text-lg font-black tracking-tighter ${item.isActive ? 'text-white' : 'text-slate-400'}`}>{item.subLabel}</span>
                            </button >
                        ))}
                    </div >

    <button onClick={() => changeTimelineScope(1)} className="p-2 text-slate-400 hover:text-white shrink-0"><ChevronRight size={16} /></button>
                </div >
            </div >

    <main className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-240px)]">

        {/* LEFT PANE: WEEKLY/MONTHLY KANBAN */}
        {(!isKanbanCollapsed || viewMode === 'month') ? (
            <div className={`${kanbanCols} transition-all duration-300 flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden`}>
        <div className="p-6 border-b border-white/5 bg-slate-900/60 shadow-md z-10 flex justify-between items-center group">
            <div>
                <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                    {viewMode === 'week' ? 'Weekly Objectives' : 'Monthly Board'}
                </h2>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                    {viewMode === 'week'
                        ?`Week of ${getMonday(timelineDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                    : `${timelineDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                }
                </p>
            </div>
            {viewMode === 'week' && (
                <button onClick={toggleKanbanCollapse} className="text-slate-500 hover:text-white p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-all" title="Minimize Kanban">
                    <Minimize2 size={16} />
                </button>
            )}
        </div>

        <div className="flex-1 flex overflow-x-auto overflow-y-auto p-2 sm:p-4 gap-4 planner-scroll">
            {columns.map(col => (
                <div
                    key={col.id}
                    className={`flex-1 rounded-3xl p-4 transition-colors border min-w-[260px] xl:min-w-0 flex flex-col ${isDragging ? 'border-dashed border-indigo-500/30 bg-indigo-500/5' : 'border-white/5 bg-slate-900/30'}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
                            >
            <div className="flex items-center gap-2 mb-4">
                {col.icon}
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">{col.title}</h3>
                <span className="ml-auto text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {goals.filter(g => g.status === col.id).length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-2">
                {goals.filter(g => g.status === col.id).map(goal => (
                    <div
                        key={goal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, goal.id)}
                        onDragEnd={() => setIsDragging(false)}
                        className="group bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-colors shadow-lg flex flex-col gap-2"
                    >
                        <div className="flex items-start gap-2">
                            <GripVertical size={14} className="text-slate-600 shrink-0 mt-0.5" />
                            <span className="text-sm font-medium text-slate-200 leading-snug break-words">
                                {goal.title}
                            </span>
                            <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="ml-auto text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        {/* Show week indicator if in monthly view since goals span multiple weeks */}
                        {viewMode === 'month' && goal.week_start_date && (
                            <div className="ml-5 mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                Week of {new Date(goal.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Quick Goal in To Do column */}
                {col.id === 'todo' && (
                    <form onSubmit={handleAddGoal} className="mt-2 shrink-0">
                        <div className="relative flex items-center bg-slate-950/50 border border-slate-800 rounded-2xl focus-within:border-indigo-500/50 transition-colors overflow-hidden">
                            <div className="pl-3 text-slate-500"><Plus size={14} /></div>
                            <input
                                type="text"
                                value={newGoalTitle}
                                onChange={e => setNewGoalTitle(e.target.value)}
                                placeholder={viewMode === 'week' ? "Add to this week..." : "Add to month start..."}
                                className="w-full bg-transparent border-none text-sm text-slate-200 p-3 focus:outline-none placeholder:text-slate-600 font-medium"
                            />
                        </div>
                    </form>
                )}
            </div>
        </div>
                        ))}
    </div>
                </div >
                ) : (
    <div onClick={toggleKanbanCollapse} className={`${kanbanCols} transition-all duration-300 flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-full overflow-hidden cursor-pointer hover:bg-slate-800/60 items-center justify-center p-4`}>
                        <div className="bg-slate-800 p-3 rounded-2xl text-slate-400">
                            <Maximize2 size={18} />
                        </div>
                        <span className="mt-4 rotate-180 text-[10px] font-black tracking-widest uppercase text-slate-500" style={{ writingMode: 'vertical-rl' }}>
                            Weekly Objectives
                        </span>
                    </div>
                )}

                {/* RIGHT PANE: DAILY DIARY (WYSIWYG) - Hidden in Monthly View */}
                {viewMode === 'week' && (
                    !isDiaryCollapsed ? (
                    <div className={`${diaryCols} flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-300`}>
                        <div className="p-6 border-b border-white/5 bg-slate-900/60 flex justify-between items-center z-10">
                            <div>
                                <h2 className="font-black text-white uppercase tracking-widest text-sm text-indigo-400">
                                    Daily Diary
                                </h2>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 flex items-center gap-2 shadow-inner">
                                    {isSaving ? (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest hidden sm:inline">Saving</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hidden sm:inline">Saved</span>
                                        </>
                                    )}
                                </div>
                                <button onClick={toggleDiaryCollapse} className="text-slate-500 hover:text-white p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-all" title="Minimize Diary">
                                    <Minimize2 size={16} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 w-full relative">
                            <ReactQuill 
                                ref={quillRef}
                                theme="snow" 
                                value={diaryContent} 
                                onChange={handleDiaryChange}
                                modules={modules}
                                placeholder="Start typing your daily notes..."
                            />
                        </div>
                    </div>
                    ) : (
                    <div onClick={toggleDiaryCollapse} className={`${diaryCols} transition-all duration-300 flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-full overflow-hidden cursor-pointer hover:bg-slate-800/60 items-center justify-center p-4`}>
                        <div className="bg-slate-800 p-3 rounded-2xl text-slate-400">
                            <Maximize2 size={18} />
                        </div>
                        <span className="mt-4 rotate-180 text-[10px] font-black tracking-widest uppercase text-slate-500 flex items-center justify-center gap-2" style={{ writingMode: 'vertical-rl' }}>
                            <span className="text-indigo-400">•</span>
                            Daily Diary
                        </span>
                    </div>
                    )
                )}
            </main>
        </div>
    );
};

export default PlannerDashboard;
