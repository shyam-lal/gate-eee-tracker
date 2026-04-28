import React, { useState, useEffect } from 'react';
import { Library, FolderOpen, Download, Play } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';

const OfficialDecks = ({ toolId, onStudyOfficial }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importingId, setImportingId] = useState(null);

    useEffect(() => {
        loadOfficialDecks();
    }, []);

    const loadOfficialDecks = async () => {
        try {
            setLoading(true);
            const data = await flashcardsApi.getOfficialDecks();
            setMaterials(data || []);
        } catch (err) {
            console.error('Failed to load official decks', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (materialId, title) => {
        if (!confirm(`Import "${title}" to your personal Flashcard Decks?`)) return;
        
        try {
            setImportingId(materialId);
            await flashcardsApi.importOfficialDeck(materialId, toolId);
            alert('Deck successfully imported! You can now access it in the "My Decks" tab.');
        } catch (err) {
            console.error(err);
            alert('Failed to import deck.');
        } finally {
            setImportingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-surface-500 animate-pulse font-black uppercase tracking-widest">Loading Official Curated Library...</div>;
    }

    if (materials.length === 0) {
        return (
            <div className="bg-surface-900/50 border border-surface-800 border-dashed rounded-[2rem] p-12 text-center">
                <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center text-surface-500 mx-auto mb-4">
                    <Library size={32} />
                </div>
                <h3 className="text-lg font-black text-heading mb-2">No Official Decks</h3>
                <p className="text-surface-500 text-sm max-w-sm mx-auto">There are no curated flashcard decks available for your selected Exam/Syllabus at the moment.</p>
            </div>
        );
    }

    // Group materials by subject_name
    const grouped = materials.reduce((acc, mat) => {
        if (!acc[mat.subject_name]) {
            acc[mat.subject_name] = [];
        }
        acc[mat.subject_name].push(mat);
        return acc;
    }, {});

    return (
        <div className="space-y-12 pb-16">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-heading uppercase tracking-tighter">Official Decks</h2>
                    <p className="text-xs text-surface-500 font-medium pt-1">Curated high-yield flashcards by experts. Import these to add them to your personalized Spaced Repetition workflow.</p>
                </div>
            </div>

            <div className="space-y-10">
                {Object.entries(grouped).map(([subjectName, decks]) => (
                    <div key={subjectName} className="space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-surface-800">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <Library size={18} />
                            </div>
                            <h3 className="text-xl font-black text-heading">{subjectName}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {decks.map(deck => {
                                let cardsArray = [];
                                try {
                                    cardsArray = JSON.parse(deck.content);
                                } catch (e) {
                                    cardsArray = [];
                                }
                                const cardCount = cardsArray.length;

                                return (
                                    <div key={deck.id} className="bg-surface-900/80 border border-surface-800 hover:border-surface-700 rounded-3xl p-5 transition-all group relative">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                                <FolderOpen size={20} />
                                            </div>
                                        </div>

                                        <h4 className="text-lg font-black text-heading mb-1 truncate pr-4" title={deck.title}>{deck.title}</h4>
                                        <p className="text-xs text-surface-400 mb-6 truncate" title={deck.topic_name}>{deck.topic_name}</p>
                                        
                                        <div className="flex items-center gap-3 text-xs font-bold text-surface-500 uppercase tracking-widest mb-6">
                                            <span>{cardCount} Cards</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const mappedCards = cardsArray.map((c, i) => ({ id: `static-${i}`, front_content: c.front, back_content: c.back }));
                                                    onStudyOfficial({ id: deck.id, name: deck.title, staticCards: mappedCards }, 'cram');
                                                }}
                                                className="py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-surface-800 text-surface-300 hover:bg-surface-700 hover:text-white transition-all flex items-center justify-center gap-1.5"
                                                title="Preview/Study (No Progress Tracking)"
                                            >
                                                <Play size={14} fill="currentColor" /> Preview
                                            </button>
                                            <button
                                                onClick={() => handleImport(deck.id, deck.title)}
                                                disabled={importingId === deck.id}
                                                className={`py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center flex-1 transition-all
                                                    ${importingId === deck.id ? 'bg-surface-800 text-surface-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}
                                                `}
                                                title="Import to your personal Decks (Enables Spaced Repetition)"
                                            >
                                                {importingId === deck.id ? 'Importing...' : <><Download size={14} className="mr-1.5"/> Import to My Decks</>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OfficialDecks;
