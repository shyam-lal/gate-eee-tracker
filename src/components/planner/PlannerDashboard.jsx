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

    // UI Layout State removed (Fixed 3-column layout)
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
        { id: 'todo', title: 'To Do', icon: <Circle size={16} className="text-surface-400" />, bg: 'bg-surface-900/40', border: 'border-white/5' },
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

    const changeViewMode = (mode) => {
        setViewMode(mode);
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

    // Grid spans are now fixed in the JSX for responsiveness.

    return (
        <div className="min-h-screen bg-base text-surface-400 font-sans p-4 md:p-8 selection:bg-primary-500/30">
            {/* Custom Styles */}
            <style>{`
                .quill { display: flex; flex-direction: column; height: 100%; }
                .ql-toolbar {
                    background-color: transparent !important;
                    border: none !important;
                    border-bottom: 1px solid rgba(150, 150, 150, 0.1) !important;
                    border-radius: 1.5rem 1.5rem 0 0;
                    padding: 12px 16px !important;
                }
                .dark .ql-toolbar {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .ql-container {
                    border: none !important;
                    background-color: transparent;
                    font-family: inherit;
                    flex-grow: 1;
                    overflow-y: auto;
                }
                .ql-editor { font-size: 1rem; color: inherit; padding: 24px; }
                .ql-editor hr { border: 0; height: 1px; background: rgba(150, 150, 150, 0.1); margin: 1rem 0; }
                .dark .ql-editor hr { background: rgba(255, 255, 255, 0.1); }
                .ql-editor.ql-blank::before { color: #94a3b8; font-style: italic; }
                .ql-snow .ql-stroke { stroke: #64748b; }
                .dark .ql-snow .ql-stroke { stroke: #94a3b8; }
                .ql-snow .ql-fill { fill: #64748b; }
                .dark .ql-snow .ql-fill { fill: #94a3b8; }
                .ql-snow .ql-picker { color: #64748b; }
                .dark .ql-snow .ql-picker { color: #94a3b8; }
                .ql-snow .ql-picker-options { background-color: #ffffff; border-color: rgba(0,0,0,0.1); }
                .dark .ql-snow .ql-picker-options { background-color: #0f172a; border-color: rgba(255,255,255,0.1); }
                .ql-snow .ql-picker-item:hover { color: #000; }
                .dark .ql-snow .ql-picker-item:hover { color: #fff; }
                button.ql-active .ql-stroke { stroke: #059669 !important; }
                .dark button.ql-active .ql-stroke { stroke: #10b981 !important; }
                
                .planner-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
                .planner-scroll::-webkit-scrollbar-track { background: rgba(150, 150, 150, 0.1); border-radius: 4px; }
                .dark .planner-scroll::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
                .planner-scroll::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.3); border-radius: 4px; }
                .dark .planner-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
                .planner-scroll::-webkit-scrollbar-thumb:hover { background: rgba(150, 150, 150, 0.5); }
                .dark .planner-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }

                .ql-divider::after { content: '—'; font-size: 14px; font-weight: bold; color: #94a3b8; }
                .ql-divider:hover::after { color: #64748b; }
                .dark .ql-divider:hover::after { color: #fff; }
            `}</style>

            {/* Header */}
            <header className="w-full mb-8">
                <h1 className="text-3xl font-black text-heading tracking-tighter">Hybrid Planner</h1>
                <p className="text-sm font-medium text-surface-500 mt-1">Manage your long-term goals, weekly tasks, and daily diary.</p>
            </header>

            {/* TIMELINE NAVIGATOR */}
            <div className="w-full mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 bg-surface-50 dark:bg-surface-900/20 p-2 pl-4 rounded-3xl border border-surface-200 dark:border-white/5">
                
                {/* View Toggles */}
                <div className="flex items-center bg-surface-100 dark:bg-surface-900/50 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto">
                    <button
                        onClick={() => changeViewMode('week')}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white dark:bg-surface-800 text-heading shadow-sm' : 'text-surface-500 hover:text-surface-400'}`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => changeViewMode('month')}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white dark:bg-surface-800 text-heading shadow-sm' : 'text-surface-500 hover:text-surface-400'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => changeViewMode('half_year')}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'half_year' ? 'bg-white dark:bg-surface-800 text-heading shadow-sm' : 'text-surface-500 hover:text-surface-400'}`}
                    >
                        Half-Yearly
                    </button>
                </div>

                {/* Horizontal Scroll Strip */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pr-2 w-full lg:w-auto">
                    <button onClick={() => changeTimelineScope(-1)} className="p-2 text-surface-400 hover:text-heading shrink-0 hidden lg:block"><ChevronLeft size={16} /></button>

                    <div className="flex items-center gap-2 px-2">
                        {scrollItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleItemClick(item)}
                                className={`relative flex flex-col items-center justify-center min-w-[3.5rem] p-2 py-3 rounded-2xl transition-all cursor-pointer select-none shrink-0 ${item.isActive
                                    ? 'bg-primary-900 dark:bg-surface-800 shadow-md text-white dark:text-heading scale-105'
                                    : 'hover:bg-surface-200 dark:hover:bg-surface-900/50 text-surface-500'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold uppercase mb-1 ${item.isActive ? 'text-primary-200 dark:text-surface-400' : 'text-surface-600'}`}>{item.label.charAt(0)}</span>
                                <span className={`text-base font-black ${item.isActive ? 'text-white dark:text-heading' : 'text-surface-500'}`}>{item.subLabel}</span>
                                {item.hasData && (
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => changeTimelineScope(1)} className="p-2 text-surface-400 hover:text-heading shrink-0 hidden lg:block"><ChevronRight size={16} /></button>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <main className="w-full grid grid-cols-1 2xl:grid-cols-12 gap-6 h-auto 2xl:h-[calc(100vh-240px)]">

                {/* COL 1: GOALS & BACKLOG */}
                <div className="2xl:col-span-3 flex flex-col bg-white dark:bg-surface-900/20 rounded-[2rem] border border-surface-200 dark:border-white/5 overflow-hidden min-h-[400px]">
                    <div className="p-6 pb-4">
                        <h2 className="font-black text-heading uppercase tracking-widest text-xs flex items-center gap-2">Goals & Backlog</h2>
                    </div>
                    <div className="px-4">
                        <button className="w-full py-3 mb-4 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-700 hover:border-primary-500/50 text-surface-500 hover:text-heading flex items-center justify-center gap-2 text-sm font-bold transition-all">
                            <Plus size={16} /> Add Goal
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto planner-scroll px-4 pb-4 space-y-2">
                        {goals.length > 0 ? goals.map(goal => (
                            <div key={goal.id} className="flex items-start gap-2 bg-surface-50 dark:bg-surface-800/40 p-3 rounded-2xl border border-surface-200 dark:border-white/5">
                                {goal.status === 'completed' ? (
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                ) : goal.status === 'in_progress' ? (
                                    <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                ) : (
                                    <Circle size={16} className="text-surface-400 shrink-0 mt-0.5" />
                                )}
                                <span className={`text-xs font-medium leading-snug break-words ${goal.status === 'completed' ? 'line-through text-surface-400' : 'text-surface-700 dark:text-surface-400'}`}>
                                    {goal.title}
                                </span>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                                <div className="w-12 h-12 rounded-2xl border-2 border-surface-200 dark:border-surface-800 flex items-center justify-center mb-3 text-surface-400">
                                    <LayoutGrid size={24} />
                                </div>
                                <h3 className="text-sm font-black text-heading mb-1">No Goals</h3>
                                <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">Ready for your long-term vision.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COL 2: WEEKLY OBJECTIVES KANBAN */}
                <div className="2xl:col-span-6 flex flex-col rounded-[2rem] overflow-hidden min-h-[400px]">
                    <div className="p-2 pb-4">
                        <h2 className="font-black text-heading uppercase tracking-widest text-xs flex items-center gap-2 px-4">Weekly Objectives</h2>
                    </div>
                    <div className="flex-1 flex overflow-x-auto overflow-y-auto gap-4 planner-scroll snap-x">
                        {columns.map(col => (
                            <div
                                key={col.id}
                                className={`flex-1 rounded-[2rem] p-4 transition-colors min-w-[200px] snap-center flex flex-col bg-surface-50 dark:bg-surface-900/20 border border-surface-200 dark:border-white/5 ${isDragging ? 'border-dashed border-primary-500/30' : ''}`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className="flex items-center gap-2 mb-4 px-2">
                                    <h3 className="font-black text-heading uppercase tracking-widest text-[10px]">{col.title}</h3>
                                    <span className="text-[10px] font-bold text-surface-500 bg-surface-200 dark:bg-surface-800 px-2 py-0.5 rounded-full">
                                        {goals.filter(g => g.status === col.id).length}
                                    </span>
                                </div>

                                {col.id === 'todo' && (
                                    <form onSubmit={handleAddGoal} className="mb-3 shrink-0">
                                        <div className="relative flex items-center bg-white dark:bg-surface-950/30 border border-surface-200 dark:border-surface-700/50 rounded-2xl focus-within:border-primary-500/50 transition-colors overflow-hidden group">
                                            <div className="pl-3 text-surface-400 group-focus-within:text-primary-500 transition-colors"><Plus size={14} /></div>
                                            <input
                                                type="text"
                                                value={newGoalTitle}
                                                onChange={e => setNewGoalTitle(e.target.value)}
                                                placeholder="Add to this week"
                                                className="w-full bg-transparent border-none text-sm text-heading p-3 py-2.5 focus:outline-none placeholder:text-surface-500 font-medium"
                                            />
                                        </div>
                                    </form>
                                )}

                                <div className="flex-1 overflow-y-auto planner-scroll space-y-3 pb-2">
                                    {goals.filter(g => g.status === col.id).map(goal => (
                                        <div
                                            key={goal.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, goal.id)}
                                            onDragEnd={() => setIsDragging(false)}
                                            className="group bg-white dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/50 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:border-primary-500/50 transition-colors shadow-sm flex flex-col gap-2"
                                        >
                                            <div className="flex items-start gap-2">
                                                <GripVertical size={14} className="text-surface-400 shrink-0 mt-0.5" />
                                                <span className="text-sm font-medium text-heading leading-snug break-words">
                                                    {goal.title}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteGoal(goal.id)}
                                                    className="ml-auto text-surface-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all shrink-0"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            {viewMode !== 'week' && goal.week_start_date && (
                                                <div className="ml-5 mt-1 text-[9px] font-bold uppercase tracking-widest text-surface-500">
                                                    Week of {new Date(goal.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {goals.filter(g => g.status === col.id).length === 0 && col.id !== 'todo' && (
                                        <div className="h-24 flex items-center justify-center text-center px-4 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl">
                                            <p className="text-[10px] text-surface-400 uppercase tracking-widest font-bold">
                                                {col.id === 'in_progress' ? 'Drop active tasks here' : 'Drop completed tasks here'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COL 3: DAILY DIARY */}
                <div className="2xl:col-span-3 flex flex-col bg-white dark:bg-surface-900/20 rounded-[2rem] border border-surface-200 dark:border-white/5 overflow-hidden shadow-sm h-[600px] 2xl:h-auto min-h-[500px]">
                    <div className="p-6 pb-2 flex justify-between items-center z-10">
                        <div>
                            <h2 className="font-black text-heading uppercase tracking-widest text-xs">
                                {viewMode === 'week' ? 'Daily Diary' : (viewMode === 'month' ? 'Monthly Diary' : 'H-Yearly Diary')}
                            </h2>
                            <p className="text-[10px] text-surface-500 font-bold mt-1">
                                {viewMode === 'week' ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                                    : viewMode === 'month' ? `${timelineDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                        : `${timelineDate.getFullYear()} - ${timelineDate.getMonth() < 6 ? 'First Half (H1)' : 'Second Half (H2)'}`
                                }
                            </p>
                        </div>
                        <div className="flex items-center">
                            <div className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-surface-800/50 text-emerald-700 dark:text-emerald-500 border border-emerald-100 dark:border-transparent flex items-center gap-2">
                                {isSaving ? (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Saving</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Saved</span>
                                    </>
                                )}
                            </div>
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
                    
                    <div className="p-3 px-6 border-t border-surface-200 dark:border-white/5 bg-surface-50 dark:bg-surface-900/40 flex justify-between items-center">
                        <span className="text-xs text-surface-500 font-medium">
                            {diaryContent.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w.length > 0).length} words
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-heading">
                            <span>✨ AI Reflect Enabled</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlannerDashboard;
