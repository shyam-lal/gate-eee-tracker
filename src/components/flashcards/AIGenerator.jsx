import React, { useState } from 'react';
import { Bot, Copy, CheckCircle2, AlertTriangle, FileJson, Loader2, ArrowRight } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';
import { parseAIJson } from '../../utils/jsonUtils';

const AIGenerator = ({ deckId, onImportComplete, onCancel }) => {
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(10);
    const [prompt, setPrompt] = useState('');
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [copied, setCopied] = useState(false);

    const [jsonInput, setJsonInput] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');
    const [previewCards, setPreviewCards] = useState([]);

    const handleGeneratePrompt = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
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

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">AI Card Generator</h3>
                        <p className="text-xs text-slate-400 font-medium">Use AI to generate flashcards from a topic</p>
                    </div>
                </div>
                <button onClick={onCancel} className="text-sm font-bold text-slate-500 hover:text-white transition-colors">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Step 1: Generate Prompt */}
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-black text-indigo-400 uppercase tracking-widest"><span className="bg-indigo-500/20 text-indigo-300 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span> Get Prompt</h4>
                    <form onSubmit={handleGeneratePrompt} className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Topic / Syllabus Link</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Nyquist Stability Criterion"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium text-sm focus:border-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Card Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={count}
                                    onChange={(e) => setCount(parseInt(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium text-sm focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={loadingPrompt || !topic.trim()}
                                    className="h-[46px] px-6 bg-indigo-600 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl font-bold text-sm tracking-wide hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:shadow-none flex items-center gap-2"
                                >
                                    {loadingPrompt ? <Loader2 size={16} className="animate-spin" /> : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {prompt && (
                        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative group animate-in slide-in-from-top-2">
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors backdrop-blur flex items-center justify-center"
                                    title="Copy Prompt"
                                >
                                    {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-48 text-xs text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
                                {prompt}
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 2: Paste JSON */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
                    <h4 className="flex items-center gap-2 text-sm font-black text-emerald-400 uppercase tracking-widest"><span className="bg-emerald-500/20 text-emerald-300 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span> Paste Response</h4>
                    <p className="text-xs text-slate-500 font-medium">Copy the generated prompt, paste it into ChatGPT or Gemini, and paste the returned JSON below.</p>

                    <div>
                        <textarea
                            value={jsonInput}
                            onChange={handleJsonChange}
                            placeholder='{"flashcards": [...]}'
                            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-400 font-mono text-xs focus:border-emerald-500 outline-none resize-none"
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
            </div>
        </div>
    );
};

export default AIGenerator;
