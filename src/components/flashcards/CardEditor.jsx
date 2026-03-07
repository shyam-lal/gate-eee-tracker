import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BrainCircuit, Edit3, Save, X, Image as ImageIcon } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';

const CardEditor = ({ deckId }) => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [front, setFront] = useState('');
    const [frontImage, setFrontImage] = useState(null);
    const [back, setBack] = useState('');
    const [backImage, setBackImage] = useState(null);

    // Edit state
    const [editingCardId, setEditingCardId] = useState(null);
    const [editFront, setEditFront] = useState('');
    const [editFrontImage, setEditFrontImage] = useState(null);
    const [editBack, setEditBack] = useState('');
    const [editBackImage, setEditBackImage] = useState(null);

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

    const handleCreateCard = async (e) => {
        e.preventDefault();
        if ((!front.trim() && !frontImage) || (!back.trim() && !backImage)) return;
        try {
            const finalFront = front.trim() + (frontImage ? `\n\n[IMAGE:${frontImage}]` : '');
            const finalBack = back.trim() + (backImage ? `\n\n[IMAGE:${backImage}]` : '');

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
        const match = content?.match(/\[IMAGE:(.*?)\]/);
        if (match) {
            return { text: content.replace(match[0], '').trim(), image: match[1] };
        }
        return { text: content || '', image: null };
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
        if ((!editFront.trim() && !editFrontImage) || (!editBack.trim() && !editBackImage)) return;
        try {
            const finalFront = editFront.trim() + (editFrontImage ? `\n\n[IMAGE:${editFrontImage}]` : '');
            const finalBack = editBack.trim() + (editBackImage ? `\n\n[IMAGE:${editBackImage}]` : '');

            await flashcardsApi.updateCard(cardId, finalFront, finalBack);
            setEditingCardId(null);
            loadCards();
        } catch (err) {
            alert('Failed to update card');
        }
    };

    // Helper for generating mock images temporarily
    const injectMockImage = (setter) => {
        const randomId = Math.floor(Math.random() * 1000);
        setter(`https://picsum.photos/seed/${randomId}/600/400`);
    };

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest flex items-center justify-center h-full">Loading Cards...</div>;

    // Derived analytics, ignoring UTC string shifts
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
            {/* Deck Analytics Summary */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-4 z-20 shadow-md">
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

            {/* New Card Form (Sticky Top) */}
            <div className="bg-slate-900/90 border-b border-slate-800 p-6 flex-shrink-0 z-10 backdrop-blur-md">
                <form onSubmit={handleCreateCard} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Front (Question)</label>
                            <button type="button" onClick={() => injectMockImage(setFrontImage)} className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded">
                                <ImageIcon size={12} /> Add Image
                            </button>
                        </div>
                        <textarea
                            value={front}
                            onChange={e => setFront(e.target.value)}
                            placeholder="e.g. What is KVL?"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm font-medium text-white focus:border-indigo-500 outline-none resize-none h-20 shadow-inner"
                        />
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
                            <button type="button" onClick={() => injectMockImage(setBackImage)} className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded">
                                <ImageIcon size={12} /> Add Image
                            </button>
                        </div>
                        <textarea
                            value={back}
                            onChange={e => setBack(e.target.value)}
                            placeholder="e.g. The sum of all voltages around a closed loop is zero."
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm font-medium text-white focus:border-indigo-500 outline-none resize-none h-20 shadow-inner"
                        />
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
                            disabled={(!front.trim() && !frontImage) || (!back.trim() && !backImage)}
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
                                                    <button type="button" onClick={() => injectMockImage(setEditFrontImage)} className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded">
                                                        <ImageIcon size={12} /> Image
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={editFront}
                                                    onChange={e => setEditFront(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-white focus:border-indigo-500 outline-none resize-none h-20"
                                                />
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
                                                    <button type="button" onClick={() => injectMockImage(setEditBackImage)} className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded">
                                                        <ImageIcon size={12} /> Image
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={editBack}
                                                    onChange={e => setEditBack(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-white focus:border-indigo-500 outline-none resize-none h-20"
                                                />
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
                                                disabled={(!editFront.trim() && !editFrontImage) || (!editBack.trim() && !editBackImage)}
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
                                        <p className="text-sm text-white font-medium whitespace-pre-wrap">{extractImage(card.front_content).text}</p>
                                        {extractImage(card.front_content).image && (
                                            <img src={extractImage(card.front_content).image} alt="Front" className="h-16 rounded-lg border border-slate-800" />
                                        )}
                                    </div>
                                    <div className="w-full h-px bg-slate-800/50 block"></div>
                                    <div className="flex-1 space-y-2">
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1.5">Back</p>
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{extractImage(card.back_content).text}</p>
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
