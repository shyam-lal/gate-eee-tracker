import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

window.katex = katex;
const BlockEmbed = Quill.import('blots/block/embed');
class DividerBlot extends BlockEmbed { }
DividerBlot.blotName = 'divider';
DividerBlot.tagName = 'hr';
Quill.register(DividerBlot);
const Delta = Quill.import('delta');

import { planner as plannerApi } from '../../services/api';
import {
    ChevronLeft, ChevronRight, CheckCircle2,
    Circle, Clock, Plus, GripVertical, Trash2,
    LayoutGrid, CalendarDays, Maximize2, Minimize2, Columns
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
    return Array.from({ length: 12 }).map((_, i) => new Date(year, i, 1));
};

const getHalfYears = (year) => {
    return [new Date(year, 0, 1), new Date(year, 6, 1)]; // Jan 1st and Jul 1st
};

const getFirstAndLastOfMonth = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0) };
};

const getFirstAndLastOfHalfYear = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    if (m < 6) return { start: new Date(y, 0, 1), end: new Date(y, 6, 0) }; // H1
    return { start: new Date(y, 6, 1), end: new Date(y, 12, 0) }; // H2
};

const PlannerDashboard = ({ onBack }) => {
    const quillRef = useRef(null);

    // Context State
    const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'half_year'
    const [timelineDate, setTimelineDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // UI Layout State
    const [isTaskListCollapsed, setIsTaskListCollapsed] = useState(false);
    const [isKanbanCollapsed, setIsKanbanCollapsed] = useState(false);
    const [isDiaryCollapsed, setIsDiaryCollapsed] = useState(false);

    // Data State
    const [diaryContent, setDiaryContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [goals, setGoals] = useState([]);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [indicators, setIndicators] = useState([]);

    // --- EFFECT: Load Diary & Indicators ---
    useEffect(() => {
        loadDiaryAndIndicators();
        // eslint-disable-next-line
    }, [selectedDate, viewMode, timelineDate]);

    const loadDiaryAndIndicators = async () => {
        try {
            // Determine Note Type
            let noteType = 'daily';
            if (viewMode === 'month') noteType = 'monthly';
            if (viewMode === 'half_year') noteType = 'half_yearly';

            // 1. Fetch Diary Content
            const dateStr = formatDate(viewMode === 'week' ? selectedDate : timelineDate);
            const res = await plannerApi.getNote(dateStr, noteType);
            setDiaryContent(res.content || '');

            // 2. Fetch Indicators for Timeline Strip
            let startIndicatorStr, endIndicatorStr;
            if (viewMode === 'week') {
                const mon = getMonday(timelineDate);
                const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                startIndicatorStr = formatDate(mon);
                endIndicatorStr = formatDate(sun);
            } else if (viewMode === 'month') {
                startIndicatorStr = formatDate(new Date(timelineDate.getFullYear(), 0, 1));
                endIndicatorStr = formatDate(new Date(timelineDate.getFullYear(), 11, 31));
            } else if (viewMode === 'half_year') {
                startIndicatorStr = formatDate(new Date(timelineDate.getFullYear(), 0, 1));
                endIndicatorStr = formatDate(new Date(timelineDate.getFullYear(), 11, 31));
            }

            const indRes = await plannerApi.getNoteIndicators(startIndicatorStr, endIndicatorStr, noteType);
            setIndicators(indRes.dates.map(d => d.split('T')[0])); // extract YYYY-MM-DD
        } catch (error) {
            console.error('Failed to load diary or indicators:', error);
        }
    };

    // Auto-save logic
    const debouncedSave = useCallback(
        debounce(async (dateStr, content, type) => {
            setIsSaving(true);
            try {
                await plannerApi.saveNote(dateStr, content, type);
                // After save, update indicators just in case this was the first edit
                setIndicators(prev => {
                    const dStr = dateStr.split('T')[0];
                    if (content.trim().length > 0 && !prev.includes(dStr)) return [...prev, dStr];
                    if (content.trim().length === 0 && prev.includes(dStr)) return prev.filter(p => p !== dStr);
                    return prev;
                });
            } catch (err) {
                console.error("Failed to save note:", err);
            } finally {
                setIsSaving(false);
            }
        }, 1000),
        []
    );

    const handleDiaryChange = (value, delta, source, editor) => {
        setDiaryContent(value);
        let noteType = 'daily';
        if (viewMode === 'month') noteType = 'monthly';
        if (viewMode === 'half_year') noteType = 'half_yearly';

        const dateStr = formatDate(viewMode === 'week' ? selectedDate : timelineDate);

        let contentToSave = value;
        // Check via editor API first, then fallback to stripping HTML tags
        const plainText = editor ? editor.getText().trim() : value.replace(/<[^>]*>/g, '').trim();
        if (plainText.length === 0) {
            contentToSave = '';
        }

        debouncedSave(dateStr, contentToSave, noteType);
    };

    // --- EFFECT: Load Kanban Goals ---
    useEffect(() => {
        loadGoals();
        // eslint-disable-next-line
    }, [timelineDate, viewMode]);

    const loadGoals = async () => {
        try {
            let res;
            if (viewMode === 'week') {
                const mon = getMonday(timelineDate);
                res = await plannerApi.getGoals(formatDate(mon));
            } else if (viewMode === 'month') {
                const { start, end } = getFirstAndLastOfMonth(timelineDate);
                res = await plannerApi.getGoals(formatDate(start), formatDate(end));
            } else {
                const { start, end } = getFirstAndLastOfHalfYear(timelineDate);
                res = await plannerApi.getGoals(formatDate(start), formatDate(end));
            }
            setGoals(res);
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
            } else if (viewMode === 'month') {
                weekStartStr = formatDate(new Date(timelineDate.getFullYear(), timelineDate.getMonth(), 1));
            } else {
                // If adding in half-year view, map it to the start of the current half.
                const m = timelineDate.getMonth() < 6 ? 0 : 6;
                weekStartStr = formatDate(new Date(timelineDate.getFullYear(), m, 1));
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

    // Color-coded columns
    const columns = [
        { id: 'todo', title: 'To Do', icon: <Circle size={16} className="text-slate-400" />, bg: 'bg-slate-900/40', border: 'border-white/5' },
        { id: 'in_progress', title: 'Doing', icon: <Clock size={16} className="text-amber-500" />, bg: 'bg-amber-900/10', border: 'border-amber-500/10' },
        { id: 'completed', title: 'Done', icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: 'bg-emerald-900/10', border: 'border-emerald-500/10' }
    ];

    // --- TIMELINE CONTROLS ---
    const changeTimelineScope = (dir) => {
        const nd = new Date(timelineDate);
        if (viewMode === 'week') {
            nd.setDate(nd.getDate() + (dir * 7));
        } else if (viewMode === 'month') {
            nd.setFullYear(nd.getFullYear() + dir); // Month scroll strips shows a full year
        } else {
            nd.setFullYear(nd.getFullYear() + dir); // Half-Year scroll strip shows a full year
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
                isActive: formatDate(d) === formatDate(selectedDate),
                hasData: indicators.includes(formatDate(d))
            }));
        } else if (viewMode === 'month') {
            const year = timelineDate.getFullYear();
            return getMonthsInYear(year).map(d => ({
                label: d.toLocaleDateString('en-US', { month: 'short' }),
                subLabel: year,
                date: d,
                isActive: d.getMonth() === timelineDate.getMonth() && d.getFullYear() === timelineDate.getFullYear(),
                hasData: indicators.includes(formatDate(d))
            }));
        } else {
            const year = timelineDate.getFullYear();
            return getHalfYears(year).map((d, i) => ({
                label: year,
                subLabel: i === 0 ? 'H1' : 'H2',
                date: d,
                isActive: (d.getMonth() === 0 ? timelineDate.getMonth() < 6 : timelineDate.getMonth() >= 6) && d.getFullYear() === timelineDate.getFullYear(),
                hasData: indicators.includes(formatDate(d))
            }));
        }
    }, [viewMode, timelineDate, selectedDate, indicators]);

    const handleItemClick = (item) => {
        if (viewMode === 'week') {
            setSelectedDate(item.date);
        } else {
            setTimelineDate(item.date);
        }
    };

    const toggleTaskListCollapse = () => {
        if (!isTaskListCollapsed && isKanbanCollapsed && isDiaryCollapsed) setIsKanbanCollapsed(false);
        setIsTaskListCollapsed(!isTaskListCollapsed);
    };

    const toggleKanbanCollapse = () => {
        if (!isKanbanCollapsed && isDiaryCollapsed && isTaskListCollapsed) setIsDiaryCollapsed(false);
        setIsKanbanCollapsed(!isKanbanCollapsed);
    };

    const toggleDiaryCollapse = () => {
        if (!isDiaryCollapsed && isKanbanCollapsed && isTaskListCollapsed) setIsKanbanCollapsed(false);
        setIsDiaryCollapsed(!isDiaryCollapsed);
    };

    const changeViewMode = (mode) => {
        setViewMode(mode);
        // Do not force expand both anymore; user controls the collapse explicitly!
    };


    // --- QUILL CONFIG ---
    const customLinkHandler = useCallback(function (value) {
        if (value) {
            const quill = this.quill;
            const range = quill.getSelection();
            let text = '';
            if (range && range.length > 0) text = quill.getText(range.index, range.length);

            let linkText = prompt("Enter text to display (or leave blank to use URL):", text);
            if (linkText === null) return;

            let linkUrl = prompt("Enter the URL:");
            if (linkUrl) {
                if (!/^https?:\/\//i.test(linkUrl)) linkUrl = 'https://' + linkUrl;
                if (!linkText.trim()) linkText = linkUrl;
                if (range && range.length > 0) quill.deleteText(range.index, range.length);
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
        clipboard: {
            matchers: [
                [Node.TEXT_NODE, function (node, delta) {
                    const text = node.data;
                    // Match LaTeX delimiters: \(...\) or $...$
                    const latexRegex = /\\\((.+?)\\\)|$([^$]+?)$/g;
                    if (!latexRegex.test(text)) return delta;
                    latexRegex.lastIndex = 0;

                    const newDelta = new Delta();
                    let lastIndex = 0;
                    let match;
                    while ((match = latexRegex.exec(text)) !== null) {
                        if (match.index > lastIndex) {
                            newDelta.insert(text.slice(lastIndex, match.index));
                        }
                        const latex = match[1] || match[2];
                        newDelta.insert({ formula: latex });
                        lastIndex = match.index + match[0].length;
                    }
                    if (lastIndex < text.length) {
                        newDelta.insert(text.slice(lastIndex));
                    }
                    return newDelta;
                }]
            ]
        },
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'formula', 'code-block', 'divider'],
                ['clean']
            ],
            handlers: { link: customLinkHandler, divider: customDividerHandler }
        }
    }), [customLinkHandler, customDividerHandler]);

    // Compute grid spans dynamically based on collapse state
    let taskListCols = 'xl:col-span-12';
    let kanbanCols = 'xl:col-span-12';
    let diaryCols = 'xl:col-span-12';

    let openCount = (!isTaskListCollapsed ? 1 : 0) + (!isKanbanCollapsed ? 1 : 0) + (!isDiaryCollapsed ? 1 : 0);

    if (openCount === 3) {
        taskListCols = 'xl:col-span-2';
        kanbanCols = 'xl:col-span-5';
        diaryCols = 'xl:col-span-5';
    } else if (openCount === 2) {
        if (isTaskListCollapsed) { taskListCols = 'xl:col-span-1'; kanbanCols = 'xl:col-span-5'; diaryCols = 'xl:col-span-6'; }
        if (isKanbanCollapsed) { taskListCols = 'xl:col-span-3'; kanbanCols = 'xl:col-span-1'; diaryCols = 'xl:col-span-8'; }
        if (isDiaryCollapsed) { taskListCols = 'xl:col-span-3'; kanbanCols = 'xl:col-span-8'; diaryCols = 'xl:col-span-1'; }
    } else {
        if (!isTaskListCollapsed) { taskListCols = 'xl:col-span-10'; kanbanCols = 'xl:col-span-1'; diaryCols = 'xl:col-span-1'; }
        if (!isKanbanCollapsed) { taskListCols = 'xl:col-span-1'; kanbanCols = 'xl:col-span-10'; diaryCols = 'xl:col-span-1'; }
        if (!isDiaryCollapsed) { taskListCols = 'xl:col-span-1'; kanbanCols = 'xl:col-span-1'; diaryCols = 'xl:col-span-10'; }
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-4 md:p-8 selection:bg-indigo-500/30">
            {/* Custom Styles */}
            <style>{`
                .quill { display: flex; flex-direction: column; height: 100%; }
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
                .ql-editor { font-size: 1rem; color: #e2e8f0; padding: 24px; }
                .ql-editor hr { border: 0; height: 1px; background: rgba(255, 255, 255, 0.1); margin: 1rem 0; }
                .ql-editor.ql-blank::before { color: #64748b; font-style: italic; }
                .ql-snow .ql-stroke { stroke: #94a3b8; }
                .ql-snow .ql-fill { fill: #94a3b8; }
                .ql-snow .ql-picker { color: #94a3b8; }
                .ql-snow .ql-picker-options { background-color: #0f172a; border-color: rgba(255,255,255,0.1); }
                .ql-snow .ql-picker-item:hover { color: #fff; }
                button.ql-active .ql-stroke { stroke: #8b5cf6 !important; }
                
                .planner-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
                .planner-scroll::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 4px; }
                .planner-scroll::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 4px; }
                .planner-scroll::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.6); }

                .ql-divider::after { content: '—'; font-size: 14px; font-weight: bold; color: #94a3b8; }
                .ql-divider:hover::after { color: #fff; }

                /* Hide Quill tooltip natively and style beautifully */
                .ql-tooltip {
                    background-color: #0f172a !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
                    border-radius: 0.5rem !important;
                    color: white !important;
                }
                .ql-tooltip input[type=text] {
                    background: #1e293b !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    color: white !important;
                }
                .ql-tooltip[data-mode="formula"]::before {
                    color: #94a3b8 !important;
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
                        onClick={() => changeViewMode('week')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <LayoutGrid size={14} /> Weekly
                    </button>
                    <button
                        onClick={() => changeViewMode('month')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <CalendarDays size={14} /> Monthly
                    </button>
                    <button
                        onClick={() => changeViewMode('half_year')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'half_year' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Columns size={14} /> H-Yearly
                    </button>
                </div >

                {/* Horizontal Scroll Strip */}
                <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-2 py-4 rounded-[2.5rem] border border-white/5 flex-1 max-w-3xl justify-center">
                    <button onClick={() => changeTimelineScope(-1)} className="p-2 text-slate-400 hover:text-white shrink-0"><ChevronLeft size={16} /></button>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth px-2">
                        {scrollItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleItemClick(item)}
                                className={`relative flex flex-col items-center justify-center min-w-[2.8rem] p-1.5 pb-3 rounded-2xl transition-all cursor-pointer select-none shrink-0 ${item.isActive
                                    ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl border border-white/10 scale-105 z-10'
                                    : 'hover:bg-slate-800 border border-transparent'
                                    }`}
                            >
                                <span className={`text-[8px] font-black uppercase tracking-widest ${item.isActive ? 'text-indigo-400' : 'text-slate-500'}`}>{item.label}</span>
                                <span className={`text-base font-black tracking-tighter ${item.isActive ? 'text-white' : 'text-slate-400'}`}>{item.subLabel}</span>

                                {/* Diary Data Indicator */}
                                {item.hasData && (
                                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => changeTimelineScope(1)} className="p-2 text-slate-400 hover:text-white shrink-0"><ChevronRight size={16} /></button>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-8 min-h-[500px] h-auto xl:h-[calc(100vh-240px)]">

                {/* EXTREME LEFT PANE: TASK LIST */}
                {!isTaskListCollapsed ? (
                    <div className={`${taskListCols} transition-all duration-300 flex flex-col backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden bg-slate-900/20`}>
                        <div className="p-6 border-b border-white/5 bg-slate-900/60 shadow-md z-10 flex justify-between items-center group">
                            <div>
                                <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">Tasks</h2>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">ALL GOALS</p>
                            </div>
                            <button onClick={toggleTaskListCollapse} className="text-slate-500 hover:text-white p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-all" title="Minimize Task List">
                                <Minimize2 size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto planner-scroll p-4 space-y-2">
                            {goals.length > 0 ? goals.map(goal => (
                                <div key={goal.id} className="flex items-start gap-2 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                                    {goal.status === 'completed' ? (
                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                    ) : goal.status === 'in_progress' ? (
                                        <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    ) : (
                                        <Circle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                    )}
                                    <span className={`text-xs font-medium leading-snug break-words ${goal.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                        {goal.title}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center text-slate-500 text-xs py-4 font-bold uppercase tracking-widest">No goals</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div onClick={toggleTaskListCollapse} className={`${taskListCols} transition-all duration-300 flex xl:flex-col items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] cursor-pointer hover:bg-slate-800/60 h-16 xl:h-auto`}>
                        <div className="bg-slate-800 p-2 md:p-3 rounded-2xl text-slate-400 mr-4 xl:mr-0">
                            <Maximize2 size={18} />
                        </div>
                        <span className="xl:mt-4 xl:rotate-180 text-[10px] font-black tracking-widest uppercase text-slate-500" style={{ writingMode: 'vertical-rl' }}>
                            Task List
                        </span>
                    </div>
                )}

                {/* MIDDLE PANE: WEEKLY/MONTHLY KANBAN */}
                {!isKanbanCollapsed ? (
                    <div className={`${kanbanCols} transition-all duration-300 flex flex-col backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden bg-slate-900/20`}>
                        <div className="p-6 border-b border-white/5 bg-slate-900/60 shadow-md z-10 flex justify-between items-center group">
                            <div>
                                <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                    {viewMode === 'week' ? 'Weekly Objectives' : (viewMode === 'month' ? 'Monthly Board' : 'Half-Yearly Board')}
                                </h2>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">
                                    {viewMode === 'week' ? `Week of ${getMonday(timelineDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                                        : viewMode === 'month' ? `${timelineDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                            : `${timelineDate.getFullYear()} - ${timelineDate.getMonth() < 6 ? 'First Half (H1)' : 'Second Half (H2)'}`
                                    }
                                </p>
                            </div>
                            <button onClick={toggleKanbanCollapse} className="text-slate-500 hover:text-white p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-all" title="Minimize Kanban">
                                <Minimize2 size={16} />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-x-auto overflow-y-auto p-2 sm:p-4 gap-4 planner-scroll">
                            {columns.map(col => (
                                <div
                                    key={col.id}
                                    className={`flex-1 rounded-3xl p-4 transition-colors border min-w-[260px] xl:min-w-0 flex flex-col ${isDragging ? 'border-dashed border-indigo-500/30 bg-indigo-500/5' : col.bg + ' ' + col.border}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        {col.icon}
                                        <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">{col.title}</h3>
                                        <span className="ml-auto text-[10px] font-bold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                                            {goals.filter(g => g.status === col.id).length}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto planner-scroll space-y-3 pb-2 pr-1">
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
                                                {viewMode !== 'week' && goal.week_start_date && (
                                                    <div className="ml-5 mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                                        Week of {new Date(goal.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Quick Goal in To Do column */}
                                        {col.id === 'todo' && (
                                            <form onSubmit={handleAddGoal} className="mt-2 shrink-0">
                                                <div className="relative flex items-center bg-slate-950/30 border border-slate-700/50 rounded-2xl focus-within:border-indigo-500/50 transition-colors overflow-hidden">
                                                    <div className="pl-3 text-slate-500"><Plus size={14} /></div>
                                                    <input
                                                        type="text"
                                                        value={newGoalTitle}
                                                        onChange={e => setNewGoalTitle(e.target.value)}
                                                        placeholder={viewMode === 'week' ? "Add to this week..." : "Add to period start..."}
                                                        className="w-full bg-transparent border-none text-sm text-slate-200 p-3 focus:outline-none placeholder:text-slate-600 font-medium"
                                                    />
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div onClick={toggleKanbanCollapse} className={`${kanbanCols} transition-all duration-300 flex xl:flex-col items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] cursor-pointer hover:bg-slate-800/60 h-16 xl:h-auto`}>
                        <div className="bg-slate-800 p-2 md:p-3 rounded-2xl text-slate-400 mr-4 xl:mr-0">
                            <Maximize2 size={18} />
                        </div>
                        <span className="xl:mt-4 xl:rotate-180 text-[10px] font-black tracking-widest uppercase text-slate-500" style={{ writingMode: 'vertical-rl' }}>
                            {viewMode === 'week' ? 'Weekly Kanban' : (viewMode === 'month' ? 'Monthly Kanban' : 'Half-Yearly Kanban')}
                        </span>
                    </div>
                )}

                {/* RIGHT PANE: DAILY/MONTHLY/H-YEARLY DIARY (WYSIWYG) */}
                {!isDiaryCollapsed ? (
                    <div className={`${diaryCols} flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-300 h-[600px] xl:h-auto`}>
                        <div className="p-6 border-b border-white/5 bg-slate-900/60 flex justify-between items-center z-10 transition-all">
                            <div>
                                <h2 className="font-black text-white uppercase tracking-widest text-sm text-indigo-400">
                                    {viewMode === 'week' ? 'Daily Diary' : (viewMode === 'month' ? 'Monthly Diary' : 'H-Yearly Diary')}
                                </h2>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">
                                    {viewMode === 'week' ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                                        : viewMode === 'month' ? `${timelineDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                            : `${timelineDate.getFullYear()} - ${timelineDate.getMonth() < 6 ? 'First Half (H1)' : 'Second Half (H2)'}`
                                    }
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
                                placeholder="Start typing your notes..."
                            />
                        </div>
                    </div>
                ) : (
                    <div onClick={toggleDiaryCollapse} className={`${diaryCols} transition-all duration-300 flex xl:flex-col items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] cursor-pointer hover:bg-slate-800/60 h-16 xl:h-auto`}>
                        <div className="bg-slate-800 p-2 md:p-3 rounded-2xl text-slate-400 mr-4 xl:mr-0">
                            <Maximize2 size={18} />
                        </div>
                        <span className="xl:mt-4 xl:rotate-180 text-[10px] font-black tracking-widest uppercase text-slate-500 flex items-center justify-center gap-2" style={{ writingMode: 'vertical-rl' }}>
                            <span className="text-indigo-400 hidden xl:inline">•</span>
                            {viewMode === 'week' ? 'Daily Diary' : (viewMode === 'month' ? 'Monthly Diary' : 'H-Yearly Diary')}
                        </span>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PlannerDashboard;
