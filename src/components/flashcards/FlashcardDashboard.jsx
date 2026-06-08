import React, { useState, useEffect } from 'react';
import { Brain, ArrowLeft, Plus } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';
import DeckManager from './DeckManager';
import OfficialDecks from './OfficialDecks';
import CardEditor from './CardEditor';
import StudySession from './StudySession';
const FlashcardDashboard = ({ tool, user, onTopUp }) => {
    // view can be 'decks', 'manage_cards', 'study'
    const [view, setView] = useState('decks');
    const [activeTab, setActiveTab] = useState('official'); // 'official', 'personal'
    const [activeDeck, setActiveDeck] = useState(null);
    const [studyMode, setStudyMode] = useState('srs');

    const handleDeckAction = (deck, actionType) => {
        setActiveDeck(deck);
        if (actionType === 'study') {
            setStudyMode('srs');
            setView('study');
        }
        if (actionType === 'cram') {
            setStudyMode('cram');
            setView('study');
        }
        if (actionType === 'manage') setView('manage_cards');
    };

    const goBackToDecks = () => {
        setActiveDeck(null);
        setView('decks');
    };

    return (
        <div className={`w-full max-w-7xl mx-auto ${view === 'manage_cards' ? 'min-h-[calc(100vh-8rem)] pb-12' : 'h-[calc(100vh-8rem)]'}`}>
            {view === 'decks' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-center mb-8">
                        <div className="bg-surface-900 border border-surface-800 p-1 rounded-2xl flex gap-1">
                            <button 
                                onClick={() => setActiveTab('official')}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${activeTab === 'official' ? 'bg-primary-600 text-white shadow-lg' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}
                            >
                                Official Decks
                            </button>
                            <button 
                                onClick={() => setActiveTab('personal')}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${activeTab === 'personal' ? 'bg-primary-600 text-white shadow-lg' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}
                            >
                                My Personal Decks
                            </button>
                        </div>
                    </div>

                    {activeTab === 'official' ? (
                        <OfficialDecks toolId={tool.id} onStudyOfficial={handleDeckAction} />
                    ) : (
                        <DeckManager toolId={tool.id} onStudyDeck={handleDeckAction} />
                    )}
                </div>
            )}

            {view === 'manage_cards' && activeDeck && (
                <div className="animate-in slide-in-from-right-8 duration-300 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={goBackToDecks} className="w-10 h-10 flex items-center justify-center bg-surface-900 border border-surface-800 rounded-xl text-surface-400 hover:text-heading hover:border-slate-600 transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-heading uppercase tracking-tighter">{activeDeck.name}</h2>
                            <p className="text-xs text-surface-500 font-medium">Deck Details & Cards</p>
                        </div>
                    </div>
                    <div className="bg-surface-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden">
                        <CardEditor deckId={activeDeck.id} user={user} onTopUp={onTopUp} />
                    </div>
                </div>
            )}

            {view === 'study' && activeDeck && (
                <div className="animate-in slide-in-from-bottom-8 duration-300 h-full">
                    <StudySession deck={activeDeck} onComplete={goBackToDecks} mode={studyMode} />
                </div>
            )}
        </div>
    );
};

export default FlashcardDashboard;
