import React, { useState, useEffect } from 'react';
import { Brain, ArrowLeft, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { flashcards as flashcardsApi } from '../../services/api';

const StudySession = ({ deck, onComplete }) => {
    const [dueCards, setDueCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showBack, setShowBack] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        loadDueCards();
    }, [deck.id]);

    const loadDueCards = async () => {
        try {
            setLoading(true);
            const cards = await flashcardsApi.getDueCards(deck.id);
            if (cards.length === 0) {
                setCompleted(true);
            } else {
                setDueCards(cards);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFlip = () => {
        setShowBack(true);
    };

    const handleReview = async (score) => {
        if (submitting) return;
        try {
            setSubmitting(true);
            const card = dueCards[currentIndex];
            await flashcardsApi.submitReview(card.id, score);

            // Move to next card
            if (currentIndex + 1 < dueCards.length) {
                setShowBack(false);
                setCurrentIndex(prev => prev + 1);
            } else {
                setCompleted(true);
            }
        } catch (err) {
            alert('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest flex items-center justify-center h-full">Loading Session...</div>;

    if (completed) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mb-6 relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full"></div>
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 text-center">Session Complete!</h2>
                <p className="text-slate-400 text-center max-w-sm mb-8 font-medium">
                    Great job! You've reviewed all due flashcards in <span className="text-white font-bold">{deck.name}</span> for today. Come back tomorrow!
                </p>
                <button
                    onClick={onComplete}
                    className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-colors shadow-lg flex items-center gap-3"
                >
                    <ArrowLeft size={16} /> Back to Decks
                </button>
            </div>
        );
    }

    const currentCard = dueCards[currentIndex];

    // Calculate dynamic UI labels reflecting Anki algorithm
    const getExpectedInterval = (score, repetition, interval, easeFactor) => {
        let newInterval;
        let ef = parseFloat(easeFactor);
        if (score < 3) return 0;

        if (repetition === 0) {
            if (score === 3) newInterval = 0;
            else if (score === 4) newInterval = 1;
            else if (score === 5) newInterval = 4;
        } else if (repetition === 1) {
            if (score === 3) newInterval = 1;
            else if (score === 4) newInterval = 6;
            else if (score === 5) newInterval = 8;
        } else {
            if (score === 3) newInterval = Math.round(interval * 1.2);
            else if (score === 4) newInterval = Math.round(interval * ef);
            else if (score === 5) newInterval = Math.round(interval * ef * 1.3);
        }
        return newInterval;
    };

    const formatInterval = (days) => {
        if (days === 0) return "< 1 min";
        if (days === 1) return "1 day";
        if (days < 30) return `${days} days`;
        const months = Math.round(days / 3.0) / 10;
        return `${months} mo`;
    };

    // Safety check just in case
    if (!currentCard) return null;

    const rep = currentCard.repetition || 0;
    const intDays = currentCard.interval_days || 0;
    const ef = currentCard.ease_factor || 2.5;

    const lblAgain = formatInterval(getExpectedInterval(0, rep, intDays, ef));
    const lblHard = formatInterval(getExpectedInterval(3, rep, intDays, ef));
    const lblGood = formatInterval(getExpectedInterval(4, rep, intDays, ef));
    const lblEasy = formatInterval(getExpectedInterval(5, rep, intDays, ef));

    const extractImage = (content) => {
        const match = content?.match(/\[IMAGE:(.*?)\]/);
        if (match) {
            return { text: content.replace(match[0], '').trim(), image: match[1] };
        }
        return { text: content || '', image: null };
    };

    const frontData = extractImage(currentCard.front_content);
    const backData = extractImage(currentCard.back_content);

    return (
        <div className="h-full flex flex-col max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <button onClick={onComplete} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <ArrowLeft size={16} /> Exit
                </button>
                <div className="text-center">
                    <h2 className="text-white font-black uppercase tracking-tighter text-lg">{deck.name}</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{currentIndex + 1} / {dueCards.length} Due</p>
                </div>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            {/* Flashcard Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full perspective-1000 mb-8 min-h-0">
                <div className="w-full h-full relative transition-all duration-500 transform-style-3d group">

                    {/* Front of Card */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden flex flex-col bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] shadow-2xl p-6 sm:p-10 transition-all duration-500 ${showBack ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 z-10'}`}>
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 mx-auto self-start flex-shrink-0">
                            <Brain size={24} />
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col fade-edge-y pb-2">
                            <div className="m-auto flex flex-col items-center text-center space-y-8 w-full">
                                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-relaxed">{frontData.text}</h3>
                                {frontData.image && (
                                    <img src={frontData.image} alt="Front illustration" className="max-h-[40vh] rounded-2xl object-contain border border-slate-700 shadow-xl shadow-black/50" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Back of Card */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden flex flex-col bg-slate-800 border-2 border-indigo-500/50 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 p-6 sm:p-10 transition-all duration-500 ${!showBack ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 z-10'}`}>
                        <div className="flex items-center justify-between mb-6 opacity-50 pb-4 border-b border-slate-700 flex-shrink-0">
                            <div className="flex-1 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Question</p>
                                <p className="text-xs text-white font-medium line-clamp-2">{frontData.text}</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col fade-edge-y pb-2">
                            <div className="m-auto flex flex-col items-center text-center space-y-10 w-full">
                                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-100 leading-relaxed whitespace-pre-wrap">{backData.text}</p>
                                {backData.image && (
                                    <img src={backData.image} alt="Back illustration" className="max-h-[50vh] mx-auto rounded-2xl object-contain border border-slate-700 shadow-xl shadow-black/50" />
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Controls (Sticky Bottom) */}
            <div className="flex-shrink-0 flex justify-center w-full max-w-xl mx-auto h-24">
                {!showBack ? (
                    <button
                        onClick={handleFlip}
                        className="w-full max-w-sm h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4"
                    >
                        <RefreshCcw size={18} /> Reveal Answer
                    </button>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full animate-in fade-in slide-in-from-bottom-4">
                        <button
                            onClick={() => handleReview(0)} // Again
                            disabled={submitting}
                            className="bg-rose-500/10 border border-rose-500/20 hover:border-rose-500 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl h-16 sm:h-20 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                        >
                            <span className="font-black uppercase tracking-widest text-xs">Again</span>
                            <span className="text-[10px] opacity-70 font-semibold">{lblAgain}</span>
                        </button>
                        <button
                            onClick={() => handleReview(3)} // Hard
                            disabled={submitting}
                            className="bg-amber-500/10 border border-amber-500/20 hover:border-amber-500 hover:bg-amber-500 text-amber-500 hover:text-white rounded-2xl h-16 sm:h-20 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                        >
                            <span className="font-black uppercase tracking-widest text-xs">Hard</span>
                            <span className="text-[10px] opacity-70 font-semibold">{lblHard}</span>
                        </button>
                        <button
                            onClick={() => handleReview(4)} // Good
                            disabled={submitting}
                            className="bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl h-16 sm:h-20 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                        >
                            <span className="font-black uppercase tracking-widest text-xs">Good</span>
                            <span className="text-[10px] opacity-70 font-semibold">{lblGood}</span>
                        </button>
                        <button
                            onClick={() => handleReview(5)} // Easy
                            disabled={submitting}
                            className="bg-sky-500/10 border border-sky-500/20 hover:border-sky-500 hover:bg-sky-500 text-sky-500 hover:text-white rounded-2xl h-16 sm:h-20 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                        >
                            <span className="font-black uppercase tracking-widest text-xs">Easy</span>
                            <span className="text-[10px] opacity-70 font-semibold">{lblEasy}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudySession;
