import { useState, useEffect, useRef } from 'react';
import { aptitude as api } from '../../services/api';
import { Zap, ArrowLeft, CheckCircle, Clock, Sparkles, ChevronRight, AlertTriangle, Lock } from 'lucide-react';
import InteractiveSpark from './tools/InteractiveSpark';

export default function SparkView({ node, unitMeta, onComplete, onBack }) {
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completing, setCompleting] = useState(false);
    const [conceptMastered, setConceptMastered] = useState(false);
    const startTime = useRef(Date.now());
    const hasInteractiveTool = InteractiveSpark.hasToolFor(node.slug);

    useEffect(() => {
        loadSpark();
    }, [node.id]);

    const loadSpark = async () => {
        try {
            const data = await api.getSpark(node.id);
            setLesson(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        setCompleting(true);
        try {
            const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
            await api.completeStage(node.id, { stage: 'spark', score: 100, timeSpent });
            onComplete();
        } catch (err) {
            setError(err.message);
            setCompleting(false);
        }
    };

    // Simple markdown-to-HTML (handles headers, bold, tables, blockquotes, code)
    const renderMarkdown = (text) => {
        if (!text) return '';
        let html = text
            .replace(/^### (.+)$/gm, '<h3 class="spark-h3">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="spark-h2">$1</h2>')
            .replace(/^> 💡 (.+)$/gm, '<div class="spark-tip">💡 $1</div>')
            .replace(/^> (.+)$/gm, '<blockquote class="spark-quote">$1</blockquote>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.+?)`/g, '<code class="spark-code">$1</code>')
            .replace(/\n\n/g, '<br/><br/>');

        // Simple table rendering
        const lines = html.split('\n');
        let inTable = false;
        let tableHtml = '';
        const output = [];

        for (const line of lines) {
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) { inTable = true; tableHtml = '<table class="spark-table"><tbody>'; }
                if (line.includes('---')) continue; // separator row
                const cells = line.split('|').filter(c => c.trim());
                tableHtml += '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
            } else {
                if (inTable) { output.push(tableHtml + '</tbody></table>'); inTable = false; tableHtml = ''; }
                output.push(line);
            }
        }
        if (inTable) output.push(tableHtml + '</tbody></table>');
        return output.join('\n');
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[300] bg-surface-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${unitMeta.color}40`, borderTopColor: unitMeta.color }} />
                    <p className="text-surface-500 font-bold text-xs uppercase tracking-widest">Loading Spark...</p>
                </div>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="fixed inset-0 z-[300] bg-surface-950 flex items-center justify-center p-4">
                <div className="bg-surface-900 border border-surface-700 rounded-3xl p-8 max-w-md text-center">
                    <AlertTriangle size={32} className="text-amber-500 mx-auto mb-4" />
                    <p className="text-surface-400 font-bold mb-2">No Spark content yet</p>
                    <p className="text-surface-600 text-sm mb-6">{error || 'Content coming soon for this topic.'}</p>
                    <button onClick={onBack} className="px-6 py-3 bg-surface-800 text-heading rounded-xl font-bold text-sm">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[300] bg-surface-950 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-surface-950/90 border-b border-surface-800/50">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={onBack} className="p-2 hover:bg-surface-800 rounded-xl text-surface-500 hover:text-heading transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Zap size={16} style={{ color: unitMeta.color }} />
                        <span className="text-sm font-black text-heading uppercase tracking-tight">The Spark</span>
                    </div>
                    <div className="flex items-center gap-1 text-surface-500">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{hasInteractiveTool ? '~45s interact' : '~60s read'}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Title Card */}
                <div className="mb-8 p-6 rounded-2xl border border-surface-800" style={{ background: `linear-gradient(135deg, ${unitMeta.color}08, ${unitMeta.color}03)` }}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ background: `${unitMeta.color}20`, color: unitMeta.color }}>
                            {unitMeta.label}
                        </span>
                        <span className="text-[9px] font-black text-surface-600 uppercase tracking-widest">Spark Lesson</span>
                    </div>
                    <h1 className="text-2xl font-black text-heading tracking-tight mb-1">{lesson.title}</h1>
                    <p className="text-sm text-surface-500">{node.name} — Mental Model</p>
                </div>

                {/* Interactive Tool (if available) */}
                {hasInteractiveTool && (
                    <div className="mb-8 p-5 rounded-2xl border border-surface-800/60 bg-surface-900/30">
                        <InteractiveSpark node={node} unitMeta={unitMeta} onConceptMastered={setConceptMastered} />
                    </div>
                )}

                {/* Lesson Body */}
                <div className="spark-content prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.body) }} />

                {/* Complete Button */}
                <div className="mt-12 pb-8">
                    {hasInteractiveTool && !conceptMastered && (
                        <div className="flex items-center justify-center gap-2 mb-3 text-surface-600">
                            <Lock size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Explore the tool above to unlock</span>
                        </div>
                    )}
                    <button
                        onClick={handleComplete}
                        disabled={completing || (hasInteractiveTool && !conceptMastered)}
                        className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background: `linear-gradient(135deg, ${unitMeta.color}, ${unitMeta.color}cc)`, boxShadow: `0 0 30px ${unitMeta.color}30` }}
                    >
                        {completing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Got it — Continue to Forge
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
