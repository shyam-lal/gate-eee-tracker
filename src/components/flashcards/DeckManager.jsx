import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Play, CalendarClock, Trash2, Zap, Library } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';

const DeckManager = ({ toolId, onStudyDeck }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI states for creation forms
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const [showCreateDeckFor, setShowCreateDeckFor] = useState(null); // groupId
    const [newDeckName, setNewDeckName] = useState('');

    useEffect(() => {
        loadGroups();
    }, [toolId]);

    const loadGroups = async () => {
        if (!toolId) return;
        try {
            setLoading(true);
            const data = await flashcardsApi.getGroups(toolId);
            setGroups(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            await flashcardsApi.createGroup(toolId, newGroupName.trim());
            setNewGroupName('');
            setShowCreateGroup(false);
            loadGroups();
        } catch (err) {
            alert('Failed to create subject');
        }
    };

    const handleDeleteGroup = async (groupId, name) => {
        if (!confirm(`Delete subject "${name}" and ALL its decks? This cannot be undone.`)) return;
        try {
            await flashcardsApi.deleteGroup(groupId);
            loadGroups();
        } catch (err) {
            alert('Failed to delete subject');
        }
    };

    const handleCreateDeck = async (e, groupId) => {
        e.preventDefault();
        if (!newDeckName.trim()) return;
        try {
            await flashcardsApi.createDeck(groupId, newDeckName.trim());
            setNewDeckName('');
            setShowCreateDeckFor(null);
            loadGroups();
        } catch (err) {
            alert('Failed to create deck');
        }
    };

    const handleDeleteDeck = async (deckId, name) => {
        if (!confirm(`Delete deck "${name}" and all its cards?`)) return;
        try {
            await flashcardsApi.deleteDeck(deckId);
            loadGroups();
        } catch (err) {
            alert('Failed to delete deck');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest">Loading Library...</div>;
    }

    return (
        <div className="space-y-12 pb-16">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Flashcard Vault</h2>
                    <p className="text-xs text-slate-500 font-medium">Organize and study your flashcards by subject.</p>
                </div>
                <button
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={16} /> New Subject
                </button>
            </div>

            {showCreateGroup && (
                <form onSubmit={handleCreateGroup} className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-4">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Subject Name (e.g. Electric Circuits, Power Systems)"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-indigo-500 outline-none"
                    />
                    <button type="button" onClick={() => setShowCreateGroup(false)} className="px-4 text-slate-500 hover:text-white font-bold text-sm">Cancel</button>
                    <button type="submit" className="px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors">Create</button>
                </form>
            )}

            {groups.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2rem] p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mx-auto mb-4">
                        <Library size={32} />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">Empty Vault</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">Create a subject (group) to start adding decks and organizing your flashcards.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {groups.map((group) => (
                        <div key={group.id} className="space-y-4">
                            {/* Subject Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <Library size={18} />
                                    </div>
                                    <h3 className="text-xl font-black text-white">{group.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowCreateDeckFor(group.id)}
                                        className="text-xs font-bold text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Deck
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGroup(group.id, group.name)}
                                        className="text-xs font-bold text-slate-500 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Deck Creation Form for this Subject */}
                            {showCreateDeckFor === group.id && (
                                <form onSubmit={(e) => handleCreateDeck(e, group.id)} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Deck Name (e.g. Chapter 1 Formulas)"
                                        value={newDeckName}
                                        onChange={(e) => setNewDeckName(e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold text-sm focus:border-emerald-500 outline-none"
                                    />
                                    <button type="button" onClick={() => setShowCreateDeckFor(null)} className="px-4 text-slate-500 hover:text-white font-bold text-sm">Cancel</button>
                                    <button type="submit" className="px-6 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors">Create Deck</button>
                                </form>
                            )}

                            {/* Deck List */}
                            {!group.decks || group.decks.length === 0 ? (
                                <div className="py-6 px-4 bg-slate-900/30 border border-slate-800/50 border-dashed rounded-2xl text-center">
                                    <p className="text-slate-500 text-sm font-medium">No decks in this subject yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {group.decks.map((deck) => {
                                        const dueCount = parseInt(deck.due_cards) || 0;
                                        const totalCount = parseInt(deck.total_cards) || 0;

                                        return (
                                            <div key={deck.id} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 transition-all group relative">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                                        <FolderOpen size={20} />
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteDeck(deck.id, deck.name)}
                                                        className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete Deck"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <h4 className="text-lg font-black text-white mb-1 truncate pr-4">{deck.name}</h4>
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
                                                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${dueCount > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500' : 'bg-slate-800/80 text-slate-600 cursor-not-allowed'}`}
                                                    >
                                                        <Play size={14} fill="currentColor" /> Study Due
                                                    </button>
                                                    <button
                                                        onClick={() => onStudyDeck(deck, 'cram')}
                                                        disabled={totalCount === 0}
                                                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${totalCount > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black hover:border-amber-500' : 'bg-slate-800/80 text-slate-600 cursor-not-allowed border border-transparent'}`}
                                                        title="Cram Mode (Study all cards without SRS)"
                                                    >
                                                        <Zap size={14} fill="currentColor" /> Cram
                                                    </button>
                                                    <button
                                                        onClick={() => onStudyDeck(deck, 'manage')}
                                                        className="py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center flex-1"
                                                        title="Manage Cards"
                                                    >
                                                        Manage
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeckManager;
