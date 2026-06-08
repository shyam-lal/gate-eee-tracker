import React, { useState, useEffect } from 'react';
import { Bot, Copy, CheckCircle2, AlertTriangle, FileJson, Loader2, ArrowRight, Sparkles, Coins } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';
import { parseAIJson } from '../../utils/jsonUtils';
import { useCredits } from '../../contexts/CreditContext';

const LOADING_PHRASES = [
    "Deducting credits...",
    "Analyzing GATE topic...",
    "Searching semantic cache...",
    "Structuring LaTeX equations...",
    "Finalizing flashcards..."
];

const AIGenerator = ({ deckId, mode, onImportComplete, onCancel, onTopUp }) => {
    const { credits, refreshCredits } = useCredits();

    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(10);
    const [prompt, setPrompt] = useState('');
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [generatingAuto, setGeneratingAuto] = useState(false);
    const [copied, setCopied] = useState(false);

    const [jsonInput, setJsonInput] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');
    const [previewCards, setPreviewCards] = useState([]);
    
    const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);

    const isAuto = mode === 'auto';
    const maxCards = isAuto ? Math.max(1, Math.min(20, credits)) : 50;

    // Enforce max constraint if credits drop
    useEffect(() => {
        if (isAuto && count > maxCards && maxCards > 0) {
            setCount(maxCards);
        }
    }, [credits, isAuto, maxCards, count]);

    useEffect(() => {
        let interval;
        if (generatingAuto) {
            interval = setInterval(() => {
                setLoadingPhaseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
            }, 1800);
        } else {
            setLoadingPhaseIndex(0);
        }
        return () => clearInterval(interval);
    }, [generatingAuto]);

    const handleGeneratePrompt = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        
        if (isAuto) {
            if (credits === 0) return;
            setGeneratingAuto(true);
            setImportError('');
            try {
                await flashcardsApi.generateCards(deckId, topic.trim(), Math.min(count, maxCards));
                await refreshCredits(); // Sync global balance immediately
                onImportComplete();
            } catch (err) {
                setImportError(err.message || 'Failed to auto-generate cards');
                await refreshCredits(); // Sync in case of rollback
            } finally {
                setGeneratingAuto(false);
            }
            return;
        }

        setLoadingPrompt(true);
        try {
            const res = await flashcardsApi.getPrompt(topic.trim(), count);
            setPrompt(res.prompt);
        } catch (err) {
            alert('Failed to generate prompt');
        } finally {
            setLoadingPrompt(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleJsonChange = (e) => {
        const val = e.target.value;
        setJsonInput(val);
        setImportError('');

        if (!val.trim()) {
            setPreviewCards([]);
            return;
        }

        try {
            const parsed = parseAIJson(val);
            if (parsed && parsed.flashcards && Array.isArray(parsed.flashcards)) {
                setPreviewCards(parsed.flashcards);
            } else {
                setImportError('JSON must contain a "flashcards" array.');
            }
        } catch (err) {
            setImportError('Invalid JSON format or unparseable text.');
        }
    };

    const handleImport = async () => {
        if (previewCards.length === 0) return;
        setImportLoading(true);
        try {
            await flashcardsApi.importCards(deckId, previewCards);
            onImportComplete();
        } catch (err) {
            setImportError('Failed to import cards to server.');
        } finally {
            setImportLoading(false);
        }
    };

    const formDisabled = generatingAuto || loadingPrompt || (isAuto && credits === 0);

    return (
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-surface-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-xl text-primary-400">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-heading">AI Card Generator</h3>
                        <p className="text-xs text-surface-400 font-medium">Use AI to generate flashcards from a topic</p>
                    </div>
                </div>
                <button onClick={onCancel} disabled={generatingAuto} className="text-sm font-bold text-surface-500 hover:text-heading transition-colors disabled:opacity-50">Close</button>
            </div>

            <div className={`grid grid-cols-1 ${!isAuto ? 'md:grid-cols-2' : 'max-w-xl mx-auto'} gap-8`}>
                {/* Step 1: Generate Prompt or Auto Generate */}
                <div className="space-y-4">
                    {!isAuto ? (
                        <h4 className="flex items-center gap-2 text-sm font-black text-primary-400 uppercase tracking-widest"><span className="bg-primary-500/20 text-primary-300 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span> Get Prompt</h4>
                    ) : (
                        <h4 className="flex items-center gap-2 text-sm font-black text-primary-400 uppercase tracking-widest"><Sparkles size={16} /> Auto Generate Cards</h4>
                    )}
                    
                    <form onSubmit={handleGeneratePrompt} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5 ml-1">Topic / Syllabus Link</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                disabled={formDisabled}
                                placeholder="e.g. Nyquist Stability Criterion"
                                className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 text-heading font-medium text-sm focus:border-primary-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                required
                            />
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-1.5 px-1">
                                <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest">Card Count</label>
                                <span className="text-xs font-bold text-primary-400">{count} cards</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="1"
                                    max={maxCards}
                                    value={count}
                                    onChange={(e) => setCount(parseInt(e.target.value))}
                                    disabled={formDisabled}
                                    className="flex-1 accent-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max={maxCards}
                                    value={count}
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value) || 1;
                                        if (val > maxCards) val = maxCards;
                                        setCount(val);
                                    }}
                                    disabled={formDisabled}
                                    className="w-16 bg-surface-950 border border-surface-800 rounded-xl px-2 py-2 text-center text-heading font-medium text-sm focus:border-primary-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            {isAuto && (
                                <p className="text-[10px] text-surface-500 font-medium mt-1.5 ml-1 flex justify-between">
                                    <span>Costs {count} credit{count !== 1 ? 's' : ''}</span>
                                    <span className={credits === 0 ? 'text-amber-500 font-bold' : ''}>Balance: {credits}</span>
                                </p>
                            )}
                        </div>

                        {/* Footer Action Area */}
                        {isAuto && credits === 0 ? (
                            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between shadow-inner">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <Coins size={24} />
                                    <div>
                                        <p className="text-sm font-black">0 credits remaining.</p>
                                        <p className="text-[10px] font-medium opacity-80">Top up to generate AI flashcards.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onTopUp ? onTopUp() : alert('Route to topup!')}
                                    className="px-4 py-2 bg-amber-500 text-amber-950 rounded-lg font-bold text-xs tracking-wide hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                                >
                                    Top Up
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-end mt-2">
                                <button
                                    type="submit"
                                    disabled={loadingPrompt || generatingAuto || !topic.trim()}
                                    className="w-full h-[46px] bg-primary-600 disabled:bg-surface-800 text-white disabled:text-surface-500 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/20 disabled:shadow-none flex items-center justify-center gap-2 overflow-hidden relative"
                                >
                                    {generatingAuto ? (
                                        <div className="flex items-center gap-2 relative z-10">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : loadingPrompt ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        isAuto ? 'Generate & Deduct Credits' : 'Generate Prompt'
                                    )}
                                    {generatingAuto && (
                                        <div className="absolute inset-0 bg-primary-500/20 animate-pulse"></div>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>

                    {isAuto && importError && !generatingAuto && (
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                            <AlertTriangle size={14} className="shrink-0" /> <span className="break-words">{importError}</span>
                        </div>
                    )}

                    {generatingAuto && (
                        <div className="mt-6 flex flex-col items-center justify-center p-8 bg-surface-950/50 border border-primary-500/20 rounded-2xl transition-all duration-300">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-primary-500/30 rounded-full blur-xl animate-pulse"></div>
                                <Bot size={48} className="text-primary-400 relative z-10 animate-bounce" />
                            </div>
                            <h4 className="text-sm font-black text-heading mb-2 uppercase tracking-widest flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin text-primary-500" />
                                Working Magic
                            </h4>
                            <p className="text-xs text-primary-300/80 font-mono text-center h-4 overflow-hidden transition-all duration-300">
                                {LOADING_PHRASES[loadingPhaseIndex]}
                            </p>
                        </div>
                    )}

                    {!isAuto && prompt && (
                        <div className="mt-4 bg-surface-950 border border-surface-800 rounded-xl overflow-hidden relative group animate-in slide-in-from-top-2">
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 bg-surface-800/80 hover:bg-primary-600 text-surface-400 hover:text-white rounded-lg transition-colors backdrop-blur flex items-center justify-center"
                                    title="Copy Prompt"
                                >
                                    {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-48 text-xs text-surface-400 font-mono leading-relaxed whitespace-pre-wrap">
                                {prompt}
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 2: Paste JSON */}
                {!isAuto && (
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-surface-800 pt-6 md:pt-0 md:pl-8">
                        <h4 className="flex items-center gap-2 text-sm font-black text-emerald-400 uppercase tracking-widest"><span className="bg-emerald-500/20 text-emerald-300 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span> Paste Response</h4>
                        <p className="text-xs text-surface-500 font-medium">Copy the generated prompt, paste it into ChatGPT or Gemini, and paste the returned JSON below.</p>

                        <div>
                            <textarea
                                value={jsonInput}
                                onChange={handleJsonChange}
                                placeholder='{"flashcards": [...]}'
                                className="w-full h-40 bg-surface-950 border border-surface-800 rounded-xl p-4 text-emerald-400 font-mono text-xs focus:border-emerald-500 outline-none resize-none"
                            />
                        </div>

                        {importError && (
                            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                                <AlertTriangle size={14} /> {importError}
                            </div>
                        )}

                        {previewCards.length > 0 && !importError && (
                            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                <div className="flex items-center gap-3 text-emerald-400">
                                    <FileJson size={20} />
                                    <div>
                                        <p className="text-sm font-black">Valid JSON Detected</p>
                                        <p className="text-xs font-medium opacity-80">{previewCards.length} flashcards ready to import</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleImport}
                                    disabled={importLoading}
                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 disabled:shadow-none flex items-center gap-2"
                                >
                                    {importLoading ? <Loader2 size={16} className="animate-spin" /> : 'Import Cards'} <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIGenerator;
