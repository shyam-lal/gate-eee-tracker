import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Plus, Trash2, BrainCircuit, Edit3, Save, X, Image as ImageIcon, Loader2, Bot } from 'lucide-react';
import { flashcards as flashcardsApi, upload as uploadApi } from '../../services/api';
import { healLatexContent } from '../../utils/jsonUtils';
import AIGenerator from './AIGenerator';

window.katex = katex;

// Register Divider blot if not already
try {
    const BlockEmbed = Quill.import('blots/block/embed');
    class FCDividerBlot extends BlockEmbed { }
    FCDividerBlot.blotName = 'divider';
    FCDividerBlot.tagName = 'hr';
    Quill.register(FCDividerBlot, true);
} catch (e) { /* already registered */ }

const Delta = Quill.import('delta');

// Compact toolbar for flashcard editors
const COMPACT_MODULES = {
    clipboard: {
        matchers: [
            [Node.TEXT_NODE, function (node, delta) {
                const text = node.data;
                const latexRegex = /\\\((.+?)\\\)|\$([^$]+?)\$/g;
                if (!latexRegex.test(text)) return delta;
                latexRegex.lastIndex = 0;
                const newDelta = new Delta();
                let lastIndex = 0;
                let match;
                while ((match = latexRegex.exec(text)) !== null) {
                    if (match.index > lastIndex) newDelta.insert(text.slice(lastIndex, match.index));
                    // We just insert the text. The formula module is not needed.
                    newDelta.insert(`\\(${match[1] || match[2]}\\)`);
                    lastIndex = match.index + match[0].length;
                }
                if (lastIndex < text.length) newDelta.insert(text.slice(lastIndex));
                return newDelta;
            }]
        ]
    },
    toolbar: {
        container: [
            ['bold', 'italic', 'underline'],
            [{ 'color': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['code-block'],
            ['clean']
        ]
    }
};

const FORMATS = ['bold', 'italic', 'underline', 'color', 'list', 'code-block'];

const CardEditor = ({ deckId }) => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [front, setFront] = useState('');
    const [frontImage, setFrontImage] = useState(null);
    const [uploadingFront, setUploadingFront] = useState(false);
    const [back, setBack] = useState('');
    const [backImage, setBackImage] = useState(null);
    const [uploadingBack, setUploadingBack] = useState(false);

    // Edit state
    const [editingCardId, setEditingCardId] = useState(null);
    const [editFront, setEditFront] = useState('');
    const [editFrontImage, setEditFrontImage] = useState(null);
    const [editUploadingFront, setEditUploadingFront] = useState(false);
    const [editBack, setEditBack] = useState('');
    const [editBackImage, setEditBackImage] = useState(null);
    const [editUploadingBack, setEditUploadingBack] = useState(false);

    useEffect(() => {
        loadCards();
    }, [deckId]);

    const loadCards = async () => {
        try {
            setLoading(true);
            const data = await flashcardsApi.getCards(deckId);
            setCards(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isQuillEmpty = (html) => {
        if (!html) return true;
        const stripped = html.replace(/<[^>]*>/g, '').trim();
        return stripped.length === 0;
    };

    const handleCreateCard = async (e) => {
        e.preventDefault();
        if (isQuillEmpty(front) && !frontImage) return;
        if (isQuillEmpty(back) && !backImage) return;
        try {
            const finalFront = (isQuillEmpty(front) ? '' : front) + (frontImage ? `\n\n[IMAGE:${frontImage}]` : '');
            const finalBack = (isQuillEmpty(back) ? '' : back) + (backImage ? `\n\n[IMAGE:${backImage}]` : '');

            await flashcardsApi.createCard(deckId, finalFront, finalBack);
            setFront('');
            setFrontImage(null);
            setBack('');
            setBackImage(null);
            loadCards();
        } catch (err) {
            alert('Failed to create card');
        }
    };

    const handleImportComplete = () => {
        setShowAIGenerator(false);
        loadCards();
    };

    const handleDeleteCard = async (cardId) => {
        if (!confirm('Delete this card?')) return;
        try {
            await flashcardsApi.deleteCard(cardId);
            loadCards();
        } catch (err) {
            alert('Failed to delete card');
        }
    };

    const extractImage = (content) => {
        const healed = healLatexContent(content);
        const match = healed?.match(/\[IMAGE:(.*?)\]/);
        if (match) {
            return { text: healed.replace(match[0], '').trim(), image: match[1] };
        }
        return { text: healed || '', image: null };
    };

    const startEdit = (card) => {
        const frontData = extractImage(card.front_content);
        const backData = extractImage(card.back_content);

        setEditingCardId(card.id);
        setEditFront(frontData.text);
        setEditFrontImage(frontData.image);
        setEditBack(backData.text);
        setEditBackImage(backData.image);
    };

    const handleSaveEdit = async (cardId) => {
        if (isQuillEmpty(editFront) && !editFrontImage) return;
        if (isQuillEmpty(editBack) && !editBackImage) return;
        try {
            const finalFront = (isQuillEmpty(editFront) ? '' : editFront) + (editFrontImage ? `\n\n[IMAGE:${editFrontImage}]` : '');
            const finalBack = (isQuillEmpty(editBack) ? '' : editBack) + (editBackImage ? `\n\n[IMAGE:${editBackImage}]` : '');

            await flashcardsApi.updateCard(cardId, finalFront, finalBack);
            setEditingCardId(null);
            loadCards();
        } catch (err) {
            alert('Failed to update card');
        }
    };

    const handleImageUpload = async (e, setUrl, setUploading) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit");
            return;
        }

        try {
            setUploading(true);
            const res = await uploadApi.image(file);
            setUrl(res.url);
        } catch (err) {
            alert(err.message || 'Failed to upload image. Make sure server has valid B2 API keys.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest flex items-center justify-center h-full">Loading Cards...</div>;

    const formatLocalDate = (dateVal) => {
        if (!dateVal) return '9999-12-31';
        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = formatLocalDate(new Date());
    const dueCount = cards.filter(c => c.next_review_date && formatLocalDate(c.next_review_date) <= todayStr).length;
    const learnedCards = cards.filter(c => c.repetition > 0);
    const avgEaseNode = learnedCards.length > 0
        ? (learnedCards.reduce((acc, c) => acc + parseFloat(c.ease_factor), 0) / learnedCards.length).toFixed(2)
        : '2.50';

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Quill Styles */}
            <style>{`
                .fc-quill .quill { display: flex; flex-direction: column; height: 100%; }
                .fc-quill .ql-toolbar {
                    background-color: rgba(15, 23, 42, 0.8) !important;
                    border: none !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    padding: 6px 8px !important;
                    border-radius: 0.75rem 0.75rem 0 0;
                }
                .fc-quill .ql-container {
                    border: none !important;
                    background-color: transparent;
                    font-family: inherit;
                }
                .fc-quill .ql-editor { font-size: 0.875rem; color: #e2e8f0; padding: 12px 16px; min-height: 80px; max-height: 120px; overflow-y: auto; }
                .fc-quill .ql-editor.ql-blank::before { color: #64748b; font-style: italic; }
                .fc-quill .ql-editor hr { border: 0; height: 1px; background: rgba(255, 255, 255, 0.1); margin: 0.5rem 0; }
                .fc-quill .ql-snow .ql-stroke { stroke: #94a3b8; }
                .fc-quill .ql-snow .ql-fill { fill: #94a3b8; }
                .fc-quill .ql-snow .ql-picker { color: #94a3b8; }
                .fc-quill .ql-snow .ql-picker-options { background-color: #0f172a; border-color: rgba(255,255,255,0.1); }
                .fc-quill .ql-snow .ql-picker-item:hover { color: #fff; }
                .fc-quill button.ql-active .ql-stroke { stroke: #8b5cf6 !important; }
                .fc-quill .ql-tooltip {
                    background-color: #0f172a !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
                    border-radius: 0.5rem !important;
                    color: white !important;
                    z-index: 100 !important;
                }
                .fc-quill .ql-tooltip input[type=text] {
                    background: #1e293b !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    color: white !important;
                }
                .fc-quill .ql-tooltip[data-mode="formula"]::before { color: #94a3b8 !important; }

                .fc-quill-edit .ql-editor { min-height: 70px; max-height: 100px; }

                /* Card display rich content */
                .card-rich-display { color: #e2e8f0; font-size: 0.875rem; line-height: 1.6; }
                .card-rich-display p { margin: 0.25em 0; }
                .card-rich-display strong { color: white; }
                .card-rich-display ul, .card-rich-display ol { padding-left: 1.5em; margin: 0.25em 0; }
                .card-rich-display .ql-formula { font-size: 1em; }
                .card-rich-display pre.ql-syntax { background: #1e293b; border-radius: 0.5rem; padding: 0.5rem; font-size: 0.8rem; overflow-x: auto; }
            `}</style>

            {/* Deck Analytics Summary */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 flex-shrink-0 flex flex-col gap-4 z-20 shadow-md">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white px-2">Deck Details</h3>
                    <button
                        onClick={() => setShowAIGenerator(!showAIGenerator)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${showAIGenerator ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}
                    >
                        {showAIGenerator ? <X size={14} /> : <Bot size={14} />}
                        {showAIGenerator ? 'Close AI' : 'AI Generate'}
                    </button>
                </div>

                {showAIGenerator && (
                    <div className="pt-2">
                        <AIGenerator
                            deckId={deckId}
                            onImportComplete={handleImportComplete}
                            onCancel={() => setShowAIGenerator(false)}
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cards</p>
                        <p className="text-2xl font-black text-white">{cards.length}</p>
                    </div>
                    <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Due Today</p>
                        <p className="text-2xl font-black text-amber-400">{dueCount}</p>
                    </div>
                    <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Learned</p>
                        <p className="text-2xl font-black text-indigo-400">{learnedCards.length}</p>
                    </div>
                    <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Avg Ease</p>
                        <p className="text-2xl font-black text-emerald-400">{avgEaseNode}</p>
                    </div>
                </div>
            </div>

            {/* New Card Form (Sticky Top) */}
            <div className="bg-slate-900/90 border-b border-slate-800 p-6 flex-shrink-0 z-10 backdrop-blur-md">
                <form onSubmit={handleCreateCard} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Front (Question)</label>
                            <label className={`text-[10px] ${uploadingFront ? 'text-slate-400 bg-slate-800' : 'text-indigo-400 bg-indigo-500/10 hover:text-indigo-300'} font-bold uppercase tracking-widest flex items-center gap-1 transition-colors px-2 py-1 rounded cursor-pointer`}>
                                {uploadingFront ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                {uploadingFront ? 'Uploading...' : 'Add Image'}
                                <input type="file" accept="image/*" className="hidden" disabled={uploadingFront} onChange={(e) => handleImageUpload(e, setFrontImage, setUploadingFront)} />
                            </label>
                        </div>
                        <div className="fc-quill bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                            <ReactQuill
                                theme="snow"
                                value={front}
                                onChange={setFront}
                                modules={COMPACT_MODULES}
                                formats={FORMATS}
                                placeholder="e.g. What is KVL?"
                            />
                        </div>
                        {frontImage && (
                            <div className="relative inline-block mt-2">
                                <img src={frontImage} alt="Front preview" className="h-20 rounded-lg border border-slate-800" />
                                <button type="button" onClick={() => setFrontImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow hover:scale-110 transition-transform"><X size={12} /></button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Back (Answer)</label>
                            <label className={`text-[10px] ${uploadingBack ? 'text-slate-400 bg-slate-800' : 'text-indigo-400 bg-indigo-500/10 hover:text-indigo-300'} font-bold uppercase tracking-widest flex items-center gap-1 transition-colors px-2 py-1 rounded cursor-pointer`}>
                                {uploadingBack ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                {uploadingBack ? 'Uploading...' : 'Add Image'}
                                <input type="file" accept="image/*" className="hidden" disabled={uploadingBack} onChange={(e) => handleImageUpload(e, setBackImage, setUploadingBack)} />
                            </label>
                        </div>
                        <div className="fc-quill bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                            <ReactQuill
                                theme="snow"
                                value={back}
                                onChange={setBack}
                                modules={COMPACT_MODULES}
                                formats={FORMATS}
                                placeholder="e.g. The sum of all voltages around a closed loop is zero."
                            />
                        </div>
                        {backImage && (
                            <div className="relative inline-block mt-2">
                                <img src={backImage} alt="Back preview" className="h-20 rounded-lg border border-slate-800" />
                                <button type="button" onClick={() => setBackImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow hover:scale-110 transition-transform"><X size={12} /></button>
                            </div>
                        )}
                    </div>
                    <div className="flex sm:flex-col justify-end pt-6">
                        <button
                            type="submit"
                            disabled={uploadingFront || uploadingBack || (isQuillEmpty(front) && !frontImage) || (isQuillEmpty(back) && !backImage)}
                            className="h-20 px-6 bg-indigo-600 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:shadow-none flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <Plus size={16} /> Add Card
                        </button>
                    </div>
                </form>
            </div>

            {/* Existing Cards List */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {cards.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <BrainCircuit size={48} className="text-slate-600 mb-4" />
                        <h3 className="text-xl font-black text-white mb-2">Deck is Empty</h3>
                        <p className="text-slate-400 text-sm max-w-sm">Use the form above to add your first flashcard to this deck.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cards.map(card => {
                            const nextReview = card.next_review_date ? new Date(card.next_review_date).toLocaleDateString() : 'N/A';
                            const isEditing = editingCardId === card.id;

                            if (isEditing) {
                                return (
                                    <div key={card.id} className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-5 flex flex-col gap-4 relative shadow-lg shadow-indigo-500/10">
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Front (Question)</label>
                                                    <label className={`text-[10px] ${editUploadingFront ? 'text-slate-400 bg-slate-800' : 'text-indigo-400 bg-indigo-500/10 hover:text-indigo-300'} font-bold uppercase tracking-widest flex items-center gap-1 transition-colors px-2 py-1 rounded cursor-pointer`}>
                                                        {editUploadingFront ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                                        {editUploadingFront ? 'Uploading...' : 'Image'}
                                                        <input type="file" accept="image/*" className="hidden" disabled={editUploadingFront} onChange={(e) => handleImageUpload(e, setEditFrontImage, setEditUploadingFront)} />
                                                    </label>
                                                </div>
                                                <div className="fc-quill fc-quill-edit bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                                                    <ReactQuill
                                                        theme="snow"
                                                        value={editFront}
                                                        onChange={setEditFront}
                                                        modules={COMPACT_MODULES}
                                                        formats={FORMATS}
                                                    />
                                                </div>
                                                {editFrontImage && (
                                                    <div className="relative inline-block mt-2">
                                                        <img src={editFrontImage} alt="Front preview" className="h-16 rounded-lg border border-slate-800" />
                                                        <button type="button" onClick={() => setEditFrontImage(null)} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full shadow hover:scale-110 transition-transform"><X size={10} /></button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Back (Answer)</label>
                                                    <label className={`text-[10px] ${editUploadingBack ? 'text-slate-400 bg-slate-800' : 'text-indigo-400 bg-indigo-500/10 hover:text-indigo-300'} font-bold uppercase tracking-widest flex items-center gap-1 transition-colors px-2 py-1 rounded cursor-pointer`}>
                                                        {editUploadingBack ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                                        {editUploadingBack ? 'Uploading...' : 'Image'}
                                                        <input type="file" accept="image/*" className="hidden" disabled={editUploadingBack} onChange={(e) => handleImageUpload(e, setEditBackImage, setEditUploadingBack)} />
                                                    </label>
                                                </div>
                                                <div className="fc-quill fc-quill-edit bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                                                    <ReactQuill
                                                        theme="snow"
                                                        value={editBack}
                                                        onChange={setEditBack}
                                                        modules={COMPACT_MODULES}
                                                        formats={FORMATS}
                                                    />
                                                </div>
                                                {editBackImage && (
                                                    <div className="relative inline-block mt-2">
                                                        <img src={editBackImage} alt="Back preview" className="h-16 rounded-lg border border-slate-800" />
                                                        <button type="button" onClick={() => setEditBackImage(null)} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full shadow hover:scale-110 transition-transform"><X size={10} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                            <button
                                                onClick={() => setEditingCardId(null)}
                                                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1.5"
                                            >
                                                <X size={14} /> Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSaveEdit(card.id)}
                                                disabled={editUploadingFront || editUploadingBack || ((isQuillEmpty(editFront) && !editFrontImage) || (isQuillEmpty(editBack) && !editBackImage))}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                                            >
                                                <Save size={14} /> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={card.id} className="bg-slate-950/50 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col gap-4 group transition-colors relative">
                                    <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-all z-10 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                                        <button
                                            onClick={() => startEdit(card)}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-indigo-500/20 transition-all border-r border-slate-800"
                                            title="Edit Card"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCard(card.id)}
                                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                            title="Delete Card"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1 pr-16 space-y-2">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Front</p>
                                        <div className="card-rich-display" dangerouslySetInnerHTML={{ __html: extractImage(card.front_content).text }} />
                                        {extractImage(card.front_content).image && (
                                            <img src={extractImage(card.front_content).image} alt="Front" className="h-16 rounded-lg border border-slate-800" />
                                        )}
                                    </div>
                                    <div className="w-full h-px bg-slate-800/50 block"></div>
                                    <div className="flex-1 space-y-2">
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1.5">Back</p>
                                        <div className="card-rich-display text-slate-300" dangerouslySetInnerHTML={{ __html: extractImage(card.back_content).text }} />
                                        {extractImage(card.back_content).image && (
                                            <img src={extractImage(card.back_content).image} alt="Back" className="h-16 rounded-lg border border-slate-800" />
                                        )}
                                    </div>

                                    <div className="pt-2 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                        <span>Rep: {card.repetition}</span>
                                        <span>Int: {card.interval_days}d</span>
                                        <span className="text-indigo-400/50">Due: {nextReview}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardEditor;
