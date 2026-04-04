import { useState, useCallback, useRef } from 'react';
import LinearTable from './LinearTable';
import DraggableCard from './DraggableCard';
import { Users, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

const TOTAL_SEATS = 5;
const PEOPLE = ['P', 'Q', 'R', 'S', 'T'];

const SOLUTION = { S: 0, P: 1, T: 2, Q: 3, R: 4 };

const STEPS = [
    {
        id: 0,
        title: 'Step 1: The Absolute Anchor',
        instruction: 'Unlike circular tables, linear rows have absolute start and end points. "T sits exactly in the middle". Anchor T at Seat 3.',
        check: (p) => p.T === 2,
        error: 'Drag T to the middle seat (Seat 3).',
        allowedCards: ['T']
    },
    {
        id: 1,
        title: 'Step 2: Relative Placement',
        instruction: '"P is to the immediate left of T", and "Q is to the immediate right of T." Place P and Q.',
        check: (p) => p.P === 1 && p.Q === 3,
        error: 'Place P to the left of T (Seat 2), and Q to the right of T (Seat 4).',
        allowedCards: ['P', 'Q']
    },
    {
        id: 2,
        title: 'Step 3: The Extremes',
        instruction: '"S sits at the extreme left end." The remaining person R must take the other extreme end. Place S and R.',
        check: (p) => p.S === 0 && p.R === 4,
        error: 'Place S at the far left (Seat 1), and R at the far right (Seat 5).',
        allowedCards: ['S', 'R']
    }
];

export default function SeatingLinearSparkTool({ node, unitMeta, onConceptMastered }) {
    const [placements, setPlacements] = useState(Object.fromEntries(PEOPLE.map(p => [p, null])));
    const [seatOccupants, setSeatOccupants] = useState(Array.from({ length: TOTAL_SEATS }, () => null));
    const [cardStates, setCardStates] = useState(Object.fromEntries(PEOPLE.map(p => [p, 'tray'])));
    
    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const feedbackTimeout = useRef(null);

    const showFeedbackMessage = (type, message) => {
        clearTimeout(feedbackTimeout.current);
        setFeedback({ type, message });
        feedbackTimeout.current = setTimeout(() => setFeedback(null), 3000);
    };

    const handleDrop = useCallback((seatIndex, cardId) => {
        if (seatOccupants[seatIndex] && cardStates[seatOccupants[seatIndex]] === 'confirmed') return;

        if (seatOccupants[seatIndex]) {
            const prev = seatOccupants[seatIndex];
            setPlacements(p => ({ ...p, [prev]: null }));
            setCardStates(s => ({ ...s, [prev]: 'tray' }));
        }

        const oldSeat = placements[cardId];
        const newOccupants = [...seatOccupants];
        if (oldSeat !== null) newOccupants[oldSeat] = null;

        const currentStepData = STEPS[currentStep];

        // Ensure user is only placing cards relevant to the current step
        if (!currentStepData.allowedCards.includes(cardId)) {
            setCardStates(s => ({ ...s, [cardId]: 'shaking' }));
            showFeedbackMessage('error', `Not yet! Focus on the current step first.`);
            setTimeout(() => {
                setCardStates(s => ({ ...s, [cardId]: 'tray' }));
                if (oldSeat !== null) {
                    const restored = [...seatOccupants];
                    restored[seatIndex] = null;
                    setSeatOccupants(restored);
                }
            }, 600);
            return;
        }

        if (SOLUTION[cardId] !== seatIndex) {
            setCardStates(s => ({ ...s, [cardId]: 'shaking' }));
            showFeedbackMessage('error', currentStepData.error || 'Incorrect placement.');
            setTimeout(() => {
                setCardStates(s => ({ ...s, [cardId]: 'tray' }));
                if (oldSeat !== null) {
                    const restored = [...seatOccupants];
                    restored[seatIndex] = null;
                    setSeatOccupants(restored);
                }
            }, 600);
            return;
        }

        newOccupants[seatIndex] = cardId;
        const newPlacements = { ...placements, [cardId]: seatIndex };
        setSeatOccupants(newOccupants);
        setPlacements(newPlacements);
        setCardStates(s => ({ ...s, [cardId]: 'confirmed' }));
        showFeedbackMessage('success', `${cardId} placed correctly!`);

        const step = STEPS[currentStep];
        if (step.check(newPlacements)) {
            if (currentStep < STEPS.length - 1) {
                setTimeout(() => {
                    setCurrentStep(prev => prev + 1);
                    showFeedbackMessage('success', 'Step Complete! Moving to next step.');
                }, 800);
            } else {
                setTimeout(() => {
                    setCompleted(true);
                    setShowOverlay(true);
                    onConceptMastered?.(true);
                }, 800);
            }
        }
    }, [placements, seatOccupants, cardStates, currentStep, onConceptMastered]);

    const seatData = Array.from({ length: TOTAL_SEATS }, (_, i) => ({
        id: i,
        occupant: seatOccupants[i],
        state: seatOccupants[i] ? cardStates[seatOccupants[i]] : 'empty',
    }));

    const trayCards = PEOPLE.filter(p => cardStates[p] === 'tray' || cardStates[p] === 'shaking');

    return (
        <div className="seating-spark-tool">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users size={16} style={{ color: unitMeta.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: unitMeta.color }}>
                        Interactive Assistant — Linear
                    </span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-surface-500">
                    Step {Math.min(currentStep + 1, STEPS.length)} / {STEPS.length}
                </div>
            </div>

            <div className="mb-6 rounded-xl border border-surface-800 bg-surface-900/50 shadow-inner flex flex-col overflow-hidden">
                {STEPS.map((step, idx) => {
                    const isActive = idx === currentStep;
                    const isPast = idx < currentStep;
                    
                    return (
                        <div key={step.id} className={`p-4 border-b border-surface-800/50 last:border-b-0 transition-opacity ${isActive ? 'bg-surface-800/20' : isPast ? 'opacity-50' : 'opacity-30 grayscale'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {isPast ? <CheckCircle size={14} style={{ color: unitMeta.color }} /> : <span className="w-2 h-2 rounded-full" style={{ background: isActive ? unitMeta.color : 'transparent', border: isActive ? 'none' : '1px solid #475569' }} />}
                                <h3 className={`text-sm font-black ${isActive ? 'text-heading' : 'text-surface-300'}`} style={isActive ? { color: unitMeta.color } : {}}>
                                    {step.title}
                                </h3>
                            </div>
                            <p className="text-xs text-surface-400 leading-relaxed font-medium pl-6">
                                {step.instruction}
                            </p>
                        </div>
                    );
                })}
                {completed && (
                    <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center gap-2 justify-center">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <span className="text-sm font-black text-emerald-400">All Steps Completed!</span>
                    </div>
                )}
            </div>

            {feedback && (
                <div className={`sl-feedback ${feedback.type === 'error' ? 'sl-feedback--error' : 'sl-feedback--success'}`}
                    style={feedback.type === 'success' ? { borderColor: `${unitMeta.color}50`, background: `${unitMeta.color}10` } : {}}>
                    {feedback.type === 'success' ? <CheckCircle size={14} style={{ color: unitMeta.color }} /> : <AlertCircle size={14} className="text-rose-400" />}
                    <span>{feedback.message}</span>
                </div>
            )}

            <div className="mb-6 pt-4 px-4 overflow-x-auto no-scrollbar">
                <LinearTable seats={TOTAL_SEATS} seatData={seatData} onDrop={handleDrop} color={unitMeta.color} />
            </div>

            <div className="sl-tray">
                <span className="text-[9px] font-black text-surface-600 uppercase tracking-widest mb-2 block">
                    {trayCards.length > 0 ? 'Drag to seat ↑' : 'All seated ✓'}
                </span>
                <div className="sl-tray__cards">
                    {PEOPLE.map(p => (
                        <div key={p} style={{ display: cardStates[p] === 'confirmed' ? 'none' : 'block' }}>
                            <DraggableCard id={p} label={p} state={cardStates[p]} color={unitMeta.color} disabled={cardStates[p] === 'confirmed'} />
                        </div>
                    ))}
                </div>
            </div>

            {showOverlay && (
                <div className="sl-overlay">
                    <div className="sl-overlay__card">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: `${unitMeta.color}20` }}>
                            <Lightbulb size={28} style={{ color: unitMeta.color }} />
                        </div>
                        <h3 className="text-xl font-black text-heading mb-2">You did it!</h3>
                        <p className="text-sm text-surface-400 leading-relaxed mb-4">
                            You successfully separated the seating into logical steps. By fixing an absolute anchor first, the rest of the puzzle snaps into place.
                        </p>
                        <button onClick={() => setShowOverlay(false)}
                            className="mt-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all hover:opacity-90"
                            style={{ background: unitMeta.color }}>
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
