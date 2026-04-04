import { useState, useEffect, useMemo, useCallback } from 'react';
import { aptitude as aptitudeApi } from '../../services/api';
import {
    ArrowLeft, Lock, CheckCircle, Zap, Flame, Brain,
    BookOpen, Calculator, Sparkles, X, ChevronRight,
    Target, Trophy, Clock, Star
} from 'lucide-react';
import SparkView from './SparkView';
import ForgeView from './ForgeView';
import ArenaView from './ArenaView';
import './aptitude.css';

const UNIT_META = {
    quant: { icon: Calculator, color: '#6366f1', gradient: 'from-indigo-500 to-violet-600', label: 'Quantitative', slug: 'quant' },
    reasoning: { icon: Brain, color: '#10b981', gradient: 'from-emerald-500 to-teal-600', label: 'Reasoning', slug: 'reasoning' },
    verbal: { icon: BookOpen, color: '#f59e0b', gradient: 'from-amber-500 to-orange-600', label: 'Verbal', slug: 'verbal' },
};

const STATUS_LABELS = {
    locked: 'Locked',
    unlocked: 'Ready',
    spark_done: 'Spark ✓',
    forge_done: 'Forged',
    arena_done: 'Arena ✓',
    mastered: 'Mastered',
};

export default function AptitudeSkillTree({ onBack }) {
    const [treeData, setTreeData] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeUnit, setActiveUnit] = useState('all');
    const [selectedNode, setSelectedNode] = useState(null);
    const [error, setError] = useState(null);
    const [activeStage, setActiveStage] = useState(null); // { node, stage: 'spark'|'forge'|'arena' }

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tree, progress] = await Promise.all([
                aptitudeApi.getTree(),
                aptitudeApi.getProgress().catch(() => []) // Graceful if not logged in
            ]);
            setTreeData(tree);
            setProgressData(progress);
        } catch (err) {
            console.error('Failed to load skill tree:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Build a progress lookup map: node_id -> progress record
    const progressMap = useMemo(() => {
        const map = {};
        progressData.forEach(p => { map[p.node_id] = p; });
        return map;
    }, [progressData]);

    // Determine node status (based on progress + prerequisites)
    const getNodeStatus = (node) => {
        const progress = progressMap[node.id];
        if (progress) return progress.status;

        // Check prerequisites
        const prereqs = node.prerequisites || [];
        if (prereqs.length === 0) return 'unlocked'; // No prerequisites = always unlocked

        // All prerequisites must be at least spark_done
        const allNodes = treeData.flatMap(u => u.nodes || []);
        const allMet = prereqs.every(prereqSlug => {
            const prereqNode = allNodes.find(n => n.slug === prereqSlug);
            if (!prereqNode) return true;
            const prereqProgress = progressMap[prereqNode.id];
            return prereqProgress && ['spark_done', 'forge_done', 'arena_done', 'mastered'].includes(prereqProgress.status);
        });

        return allMet ? 'unlocked' : 'locked';
    };

    // Calculate unit-level stats
    const unitStats = useMemo(() => {
        const stats = {};
        treeData.forEach(unit => {
            const nodes = unit.nodes || [];
            const totalNodes = nodes.length;
            const mastered = nodes.filter(n => {
                const s = getNodeStatus(n);
                return s === 'mastered' || s === 'arena_done';
            }).length;
            const inProgress = nodes.filter(n => {
                const s = getNodeStatus(n);
                return ['spark_done', 'forge_done'].includes(s);
            }).length;
            const unlocked = nodes.filter(n => getNodeStatus(n) === 'unlocked').length;

            stats[unit.slug] = {
                total: totalNodes,
                mastered,
                inProgress,
                unlocked,
                percentage: totalNodes === 0 ? 0 : Math.round((mastered / totalNodes) * 100),
            };
        });
        return stats;
    }, [treeData, progressMap]);

    // Overall progress
    const overallStats = useMemo(() => {
        const total = Object.values(unitStats).reduce((a, s) => a + s.total, 0);
        const mastered = Object.values(unitStats).reduce((a, s) => a + s.mastered, 0);
        return {
            total,
            mastered,
            percentage: total === 0 ? 0 : Math.round((mastered / total) * 100),
        };
    }, [unitStats]);

    // Filter nodes by active unit
    const filteredUnits = useMemo(() => {
        if (activeUnit === 'all') return treeData;
        return treeData.filter(u => u.slug === activeUnit);
    }, [treeData, activeUnit]);

    const getUnitSlug = (unitId) => {
        const unit = treeData.find(u => u.id === unitId);
        return unit?.slug || 'quant';
    };

    const handleStageComplete = useCallback(() => {
        setActiveStage(null);
        setSelectedNode(null);
        loadData(); // Reload progress
    }, []);

    const launchStage = (node, stage) => {
        setSelectedNode(null);
        setActiveStage({ node, stage });
    };

    // ─── Render Active Stage View ───────────────
    if (activeStage) {
        const unitSlug = getUnitSlug(activeStage.node.unit_id);
        const meta = UNIT_META[unitSlug] || UNIT_META.quant;
        const stageProps = {
            node: activeStage.node,
            unitMeta: meta,
            onComplete: handleStageComplete,
            onBack: () => setActiveStage(null),
        };

        if (activeStage.stage === 'spark') return <SparkView {...stageProps} />;
        if (activeStage.stage === 'forge') return <ForgeView {...stageProps} />;
        if (activeStage.stage === 'arena') return <ArenaView {...stageProps} />;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    <p className="text-surface-500 font-bold text-xs uppercase tracking-widest">Loading Skill Tree...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-surface-950 border border-rose-500/30 rounded-3xl p-8 max-w-md text-center">
                    <p className="text-rose-400 font-bold mb-4">Failed to load skill tree</p>
                    <p className="text-surface-500 text-sm mb-6">{error}</p>
                    <button onClick={loadData} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-surface-400 font-sans selection:bg-primary-500/30">
            {/* ─── Header ──────────────────────────── */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-surface-950/80 border-b border-surface-800/50">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-surface-800 rounded-xl text-surface-500 hover:text-heading transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-heading uppercase tracking-tighter flex items-center gap-2">
                                <Sparkles size={18} className="text-primary-400" />
                                Aptitude Skill Tree
                            </h1>
                            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">
                                {overallStats.mastered}/{overallStats.total} Skills Mastered
                            </p>
                        </div>
                    </div>

                    {/* Overall Progress Ring */}
                    <div className="relative w-14 h-14">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-surface-800" />
                            <circle
                                cx="28" cy="28" r="24"
                                stroke="url(#progressGrad)"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={150.8}
                                strokeDashoffset={150.8 - (150.8 * overallStats.percentage) / 100}
                                strokeLinecap="round"
                                className="unit-ring"
                            />
                            <defs>
                                <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="50%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#f59e0b" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-black text-heading">{overallStats.percentage}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* ─── Unit Stats Cards ─────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    {treeData.map(unit => {
                        const meta = UNIT_META[unit.slug] || UNIT_META.quant;
                        const stats = unitStats[unit.slug] || { total: 0, mastered: 0, percentage: 0 };
                        const IconComp = meta.icon;
                        const isActive = activeUnit === unit.slug;

                        return (
                            <button
                                key={unit.id}
                                onClick={() => setActiveUnit(prev => prev === unit.slug ? 'all' : unit.slug)}
                                className={`relative p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden group ${isActive
                                    ? 'border-white/20 bg-surface-900/80 scale-[1.02]'
                                    : 'border-surface-800/50 bg-surface-950/50 hover:border-surface-700 hover:bg-surface-900/40'
                                    }`}
                            >
                                {/* Glow background when active */}
                                {isActive && (
                                    <div
                                        className="absolute inset-0 opacity-10 rounded-2xl"
                                        style={{ background: `radial-gradient(circle at 50% 50%, ${meta.color}, transparent 70%)` }}
                                    />
                                )}
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 rounded-lg" style={{ background: `${meta.color}15` }}>
                                            <IconComp size={16} style={{ color: meta.color }} />
                                        </div>
                                        <span className="text-2xl font-black" style={{ color: meta.color }}>{stats.percentage}%</span>
                                    </div>
                                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">{meta.label}</p>
                                    <p className="text-[9px] font-bold text-surface-600 mt-0.5">{stats.mastered}/{stats.total} mastered</p>
                                    {/* Mini progress bar */}
                                    <div className="h-1 bg-surface-800 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${stats.percentage}%`, background: meta.color }}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* ─── Hex Grid ──────────────────────────── */}
                {filteredUnits.map(unit => {
                    const meta = UNIT_META[unit.slug] || UNIT_META.quant;
                    const nodes = unit.nodes || [];

                    // Group nodes by hex_row
                    const rows = {};
                    nodes.forEach(n => {
                        if (!rows[n.hex_row]) rows[n.hex_row] = [];
                        rows[n.hex_row].push(n);
                    });
                    const sortedRowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);

                    return (
                        <div key={unit.id} className="space-y-4">
                            {/* Unit Header */}
                            <div className="flex items-center gap-3 pl-1">
                                <div className="w-1 h-8 rounded-full" style={{ background: meta.color }} />
                                <div>
                                    <h2 className="text-sm font-black text-heading uppercase tracking-tight">{unit.name}</h2>
                                    <p className="text-[10px] text-surface-500 font-bold">{unit.description}</p>
                                </div>
                            </div>

                            {/* Hex Rows */}
                            <div className="space-y-2 flex flex-col items-center">
                                {sortedRowKeys.map(rowIdx => {
                                    const rowNodes = rows[rowIdx].sort((a, b) => a.hex_col - b.hex_col);
                                    const isOddRow = rowIdx % 2 !== 0;

                                    return (
                                        <div
                                            key={rowIdx}
                                            className="flex gap-2 items-center"
                                            style={{ marginLeft: isOddRow ? '60px' : '0' }}
                                        >
                                            {rowNodes.map(node => {
                                                const status = getNodeStatus(node);
                                                const unitSlug = unit.slug;
                                                const isLocked = status === 'locked';
                                                const isMastered = status === 'mastered' || status === 'arena_done';
                                                const isInProgress = status === 'spark_done' || status === 'forge_done';
                                                const isUnlocked = status === 'unlocked';
                                                const progress = progressMap[node.id];
                                                const mastery = progress?.mastery_percentage || 0;

                                                const stateClass = isLocked ? 'hex-node--locked'
                                                    : isMastered ? 'hex-node--mastered'
                                                        : isInProgress ? 'hex-node--in-progress'
                                                            : 'hex-node--unlocked';

                                                return (
                                                    <div
                                                        key={node.id}
                                                        className={`hex-outline hex-outline--${unitSlug} ${isMastered ? 'hex-outline--mastered' : isUnlocked || isInProgress ? 'hex-outline--unlocked' : ''}`}
                                                    >
                                                        <div
                                                            className={`hex-node hex-node--${unitSlug} ${stateClass}`}
                                                            onClick={() => !isLocked && setSelectedNode(node)}
                                                        >
                                                            {/* Icon for locked state */}
                                                            {isLocked && <Lock size={14} className="mb-1 opacity-30" />}

                                                            {/* Check for mastered */}
                                                            {isMastered && <CheckCircle size={14} className="mb-1 text-white/80" />}

                                                            {/* Stage indicator for in-progress */}
                                                            {isInProgress && <Zap size={14} className="mb-1" style={{ color: meta.color }} />}

                                                            {/* Node name */}
                                                            <span className="leading-tight">{node.name}</span>

                                                            {/* Difficulty badge */}
                                                            {!isLocked && (
                                                                <span className={`hex-difficulty hex-difficulty--${node.difficulty}`}>
                                                                    {node.difficulty}
                                                                </span>
                                                            )}

                                                            {/* Mastery bar */}
                                                            {!isLocked && mastery > 0 && (
                                                                <div className="hex-mastery-bar">
                                                                    <div
                                                                        className={`hex-mastery-bar__fill hex-mastery-bar__fill--${unitSlug}`}
                                                                        style={{ width: `${mastery}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Node Detail Panel (Slide-up) ───────── */}
            {selectedNode && (
                <div
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setSelectedNode(null)}
                >
                    <div
                        className="node-detail-panel bg-surface-950 border border-surface-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {(() => {
                            const node = selectedNode;
                            const unitSlug = getUnitSlug(node.unit_id);
                            const meta = UNIT_META[unitSlug] || UNIT_META.quant;
                            const status = getNodeStatus(node);
                            const progress = progressMap[node.id];
                            const mastery = progress?.mastery_percentage || 0;

                            const stages = [
                                { key: 'spark', label: 'The Spark', sub: 'Learn', icon: Zap, done: ['spark_done', 'forge_done', 'arena_done', 'mastered'].includes(status) },
                                { key: 'forge', label: 'The Forge', sub: 'Practice', icon: Flame, done: ['forge_done', 'arena_done', 'mastered'].includes(status) },
                                { key: 'arena', label: 'The Arena', sub: 'Mock Test', icon: Trophy, done: ['arena_done', 'mastered'].includes(status) },
                            ];

                            return (
                                <>
                                    {/* Header */}
                                    <div className="px-6 py-5 border-b border-surface-800" style={{ background: `linear-gradient(135deg, ${meta.color}10, transparent)` }}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ background: `${meta.color}20`, color: meta.color }}>
                                                        {meta.label}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md hex-difficulty hex-difficulty--${node.difficulty}`}>
                                                        {node.difficulty}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-heading tracking-tight">{node.name}</h3>
                                                <p className="text-sm text-surface-500 mt-1">{node.description}</p>
                                            </div>
                                            <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-surface-800 rounded-xl text-surface-500 hover:text-heading transition-colors">
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-surface-500 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {node.estimated_minutes}m</span>
                                            <span className="flex items-center gap-1"><Target size={12} /> {mastery}% Mastery</span>
                                            <span className="flex items-center gap-1"><Star size={12} /> {STATUS_LABELS[status]}</span>
                                        </div>
                                    </div>

                                    {/* Mastery Loop Stages */}
                                    <div className="px-6 py-5 space-y-4">
                                        <h4 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Mastery Loop</h4>

                                        <div className="space-y-3">
                                            {stages.map((stage, idx) => {
                                                const StageIcon = stage.icon;
                                                const isCurrent = !stage.done && (idx === 0 || stages[idx - 1].done);
                                                return (
                                                    <div
                                                        key={stage.key}
                                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${stage.done
                                                            ? 'border-surface-700 bg-surface-900/30'
                                                            : isCurrent
                                                                ? 'border-primary-500/30 bg-primary-500/5'
                                                                : 'border-surface-800/30 bg-surface-950/30 opacity-50'
                                                            }`}
                                                    >
                                                        <div
                                                            className={`stage-dot ${stage.done ? 'stage-dot--completed' : isCurrent ? 'stage-dot--active' : ''}`}
                                                            style={{
                                                                background: stage.done ? meta.color : isCurrent ? `${meta.color}60` : 'rgba(100,116,139,0.3)',
                                                                boxShadow: stage.done ? `0 0 10px ${meta.color}40` : 'none',
                                                            }}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <StageIcon size={14} style={{ color: stage.done ? meta.color : 'rgb(100,116,139)' }} />
                                                                <span className="text-sm font-black text-heading">{stage.label}</span>
                                                                <span className="text-[9px] font-bold text-surface-600">— {stage.sub}</span>
                                                            </div>
                                                            {stage.done && (
                                                                <p className="text-[10px] text-surface-500 mt-1">Completed ✓</p>
                                                            )}
                                                        </div>
                                                        {isCurrent && (
                                                            <button
                                                                onClick={() => launchStage(node, stage.key)}
                                                                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                                                                style={{ background: meta.color, boxShadow: `0 0 15px ${meta.color}40` }}>
                                                                Start
                                                            </button>
                                                        )}
                                                        {stage.done && <CheckCircle size={16} style={{ color: meta.color }} />}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Interaction Tool Info */}
                                        <div className="mt-4 p-4 bg-surface-900/40 rounded-2xl border border-surface-800/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles size={14} className="text-primary-400" />
                                                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Interactive Tool</span>
                                            </div>
                                            <p className="text-sm text-surface-500">
                                                {node.interaction_type === 'relativity_engine' && '🔬 The Relativity Engine — Visual sliders and interactive models for quantitative intuition.'}
                                                {node.interaction_type === 'structure_lab' && '🧩 The Structure Lab — Drag-and-drop constraints, seating arrangers, and logic builders.'}
                                                {node.interaction_type === 'context_weaver' && '📝 The Context Weaver — Sentence snapping, logic magnets, and contextual fill tools.'}
                                            </p>
                                            <p className="text-[10px] text-primary-400/60 font-bold mt-2">Coming in Phase 3+</p>
                                        </div>

                                        {/* Prerequisites */}
                                        {node.prerequisites && node.prerequisites.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-2">Prerequisites</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {node.prerequisites.map(p => (
                                                        <span key={p} className="text-[10px] font-bold bg-surface-900 text-surface-400 px-3 py-1.5 rounded-lg border border-surface-800">
                                                            {p.replace(/-/g, ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
