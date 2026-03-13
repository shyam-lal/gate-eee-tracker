import React, { useState, useEffect } from 'react';
import { Brain, ArrowLeft, Plus } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';
import DeckManager from './DeckManager';
import CardEditor from './CardEditor';
import StudySession from './StudySession';

const FlashcardDashboard = ({ tool }) => {
    // view can be 'decks', 'manage_cards', 'study'
    const [view, setView] = useState('decks');
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
        <div className="w-full max-w-7xl mx-auto h-[calc(100vh-8rem)]">
            {view === 'decks' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <DeckManager toolId={tool.id} onStudyDeck={handleDeckAction} />
                </div>
            )}

            {view === 'manage_cards' && activeDeck && (
                <div className="animate-in slide-in-from-right-8 duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={goBackToDecks} className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{activeDeck.name}</h2>
                            <p className="text-xs text-slate-500 font-medium">Deck Details & Cards</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden">
                        <CardEditor deckId={activeDeck.id} />
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
