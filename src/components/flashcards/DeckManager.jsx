import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Play, CalendarClock, MoreVertical, Trash2 } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';

const DeckManager = ({ toolId, onStudyDeck }) => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');

    useEffect(() => {
        loadDecks();
    }, [toolId]);

    const loadDecks = async () => {
        try {
            setLoading(true);
            const data = await flashcardsApi.getDecks(toolId);
            setDecks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDeck = async (e) => {
        e.preventDefault();
        if (!newDeckName.trim()) return;
        try {
            await flashcardsApi.createDeck(toolId, newDeckName.trim());
            setNewDeckName('');
            setShowCreate(false);
            loadDecks();
        } catch (err) {
            alert('Failed to create deck');
        }
    };

    const handleDeleteDeck = async (deckId, name) => {
        if (!confirm(`Delete deck "${name}" and all its cards?`)) return;
        try {
            await flashcardsApi.deleteDeck(deckId);
            loadDecks();
        } catch (err) {
            alert('Failed to delete deck');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest">Loading Decks...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Your Decks</h2>
                    <p className="text-xs text-slate-500 font-medium">Manage and study your flashcard collections.</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={16} /> New Deck
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreateDeck} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-4">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Deck Name (e.g. Electric Circuits Formulas)"
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-indigo-500 outline-none"
                    />
                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 text-slate-500 hover:text-white font-bold text-sm">Cancel</button>
                    <button type="submit" className="px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors">Create</button>
                </form>
            )}

            {decks.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2rem] p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mx-auto mb-4">
                        <FolderOpen size={32} />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">No Decks Yet</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">Create a deck to start adding flashcards and using the Spaced Repetition System.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decks.map((deck) => {
                        const dueCount = parseInt(deck.due_cards) || 0;
                        const totalCount = parseInt(deck.total_cards) || 0;

                        return (
                            <div key={deck.id} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 transition-all group relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                        <FolderOpen size={24} />
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDeck(deck.id, deck.name)}
                                        className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Deck"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3 className="text-lg font-black text-white mb-1 truncate pr-4">{deck.name}</h3>
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
                                    <span>{totalCount} Cards</span>
                                    {dueCount > 0 && (
                                        <span className="text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                            <CalendarClock size={12} /> {dueCount} Due
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onStudyDeck(deck, 'study')}
                                        disabled={dueCount === 0}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${dueCount > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                    >
                                        <Play size={16} fill="currentColor" /> Study Due
                                    </button>
                                    <button
                                        onClick={() => onStudyDeck(deck, 'manage')}
                                        className="py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
                                        title="View Deck Details"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DeckManager;
