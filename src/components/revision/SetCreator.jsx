import React, { useState, useRef } from 'react';
import { ArrowLeft, Sparkles, Copy, Clipboard, Check, AlertCircle, Loader2 } from 'lucide-react';
import { revision as revisionApi } from '../../services/api';

const SetCreator = ({ onCreated, onBack }) => {
    const [step, setStep] = useState(1); // 1: details, 2: prompt, 3: paste JSON
    const [title, setTitle] = useState('');
    const [topics, setTopics] = useState('');
    const [questionCount, setQuestionCount] = useState(10);
    const [timePerQuestion, setTimePerQuestion] = useState(180);

    const [prompt, setPrompt] = useState('');
    const [copied, setCopied] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [createdSet, setCreatedSet] = useState(null);

    const handleGeneratePrompt = async () => {
        if (!title.trim() || !topics.trim()) return;
        try {
            const res = await revisionApi.getPrompt(topics, questionCount);
            setPrompt(res.prompt);
            setStep(2);
        } catch (err) {
            setError('Failed to generate prompt');
        }
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleProceedToPaste = async () => {
        try {
            // Create the set first
            const set = await revisionApi.createSet(title, topics, questionCount, timePerQuestion);
            setCreatedSet(set);
            setStep(3);
        } catch (err) {
            setError('Failed to create set');
        }
    };

    const handleImportJSON = async () => {
        if (!jsonInput.trim()) return;
        setError('');
        setImporting(true);
        try {
            let parsed = JSON.parse(jsonInput);
            // Accept both { questions: [...] } and bare [...]
            if (Array.isArray(parsed)) parsed = { questions: parsed };
            await revisionApi.importQuestions(createdSet.id, parsed);
            onCreated(createdSet);
        } catch (err) {
            if (err instanceof SyntaxError) {
                setError('Invalid JSON format. Make sure you paste the exact output from the AI.');
            } else {
                setError(err.message || 'Failed to import questions');
            }
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 p-2">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Create Revision Set</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Step {step} of 3</p>
                </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-amber-500' : 'bg-slate-800'}`} />
                ))}
            </div>

            {/* Step 1: Set Details */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 md:p-8 space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Set Title</label>
                            <input
                                type="text" autoFocus
                                value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Control Systems Week 3 Revision"
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:border-amber-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Topics (comma-separated)</label>
                            <textarea
                                value={topics} onChange={e => setTopics(e.target.value)}
                                placeholder="e.g. Bode Plot, Nyquist Criterion, Root Locus, Routh-Hurwitz"
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:border-amber-500 outline-none resize-none h-24 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Number of Questions</label>
                                <input
                                    type="number" min="1" max="50"
                                    value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value) || 10)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:border-amber-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Time Per Question (sec)</label>
                                <input
                                    type="number" min="30" step="30"
                                    value={timePerQuestion} onChange={e => setTimePerQuestion(parseInt(e.target.value) || 180)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:border-amber-500 outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGeneratePrompt}
                        disabled={!title.trim() || !topics.trim()}
                        className="w-full py-4 bg-amber-500 disabled:bg-slate-800 text-black disabled:text-slate-500 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <Sparkles size={18} /> Generate AI Prompt
                    </button>
                </div>
            )}

            {/* Step 2: Copy Prompt */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 md:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Generated Prompt</label>
                            <button
                                onClick={handleCopyPrompt}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-colors"
                            >
                                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                            </button>
                        </div>
                        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto no-scrollbar">
                            {prompt}
                        </pre>
                        <p className="text-xs text-slate-500 mt-4 font-medium leading-relaxed">
                            Copy this prompt and paste it into <strong className="text-white">Gemini</strong>, <strong className="text-white">ChatGPT</strong>, or <strong className="text-white">Claude</strong>. Then copy the JSON response for the next step.
                        </p>
                    </div>

                    <button
                        onClick={handleProceedToPaste}
                        className="w-full py-4 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                        <Clipboard size={18} /> I Have the Response — Paste JSON
                    </button>
                </div>
            )}

            {/* Step 3: Paste JSON */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 md:p-8 space-y-4">
                        <label className="block text-[10px] font-black text-amber-400 uppercase tracking-widest">Paste AI Response (JSON)</label>
                        <textarea
                            value={jsonInput} onChange={e => setJsonInput(e.target.value)}
                            placeholder={'Paste the JSON output from the AI here...\n\n{\n  "questions": [\n    {\n      "type": "mcq",\n      "question": "...",\n      ...\n    }\n  ]\n}'}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-mono focus:border-amber-500 outline-none resize-none h-48 transition-colors"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm font-bold">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <button
                        onClick={handleImportJSON}
                        disabled={!jsonInput.trim() || importing}
                        className="w-full py-4 bg-emerald-500 disabled:bg-slate-800 text-black disabled:text-slate-500 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {importing ? <><Loader2 size={18} className="animate-spin" /> Importing...</> : <><Check size={18} /> Import Questions</>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SetCreator;
