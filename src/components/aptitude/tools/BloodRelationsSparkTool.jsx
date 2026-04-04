import { useState, useCallback, useRef } from 'react';
import FamilyTreeTable from './FamilyTreeTable';
import DraggableCard from './DraggableCard';
import { Users, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

const TOTAL_SEATS = 6;
const PEOPLE = ['P', 'Q', 'R', 'S', 'T', 'U'];

const LAYOUT = [
    { x: 35, y: 15, label: 'Grandfather' },
    { x: 65, y: 15, label: 'Grandmother' },
    { x: 25, y: 50, label: 'Father' },
    { x: 45, y: 50, label: 'Mother' },
    { x: 75, y: 50, label: 'Uncle' },
    { x: 35, y: 85, label: 'Child (U)' },
];

const CONNECTIONS = [
    [0, 1], // married: GF-GM
    [0, 2], // child: F
    [0, 4], // child: Uncle
    [2, 3], // married: F-M
    [2, 5], // child: U
];

const SOLUTION = { R: 0, T: 1, Q: 2, S: 3, P: 4, U: 5 };

const STEPS = [
    {
        id: 0,
        title: 'Step 1: The Generational Backbone',
        instruction: '"R is the Grandfather of U." Separate them by 2 generations. Place R at the top left (Grandfather) and U at the bottom (Child).',
        check: (p) => p.R === 0 && p.U === 5,
        error: 'Drag R to the Grandfather dot, and U to the Child dot.',
        allowedCards: ['R', 'U']
    },
    {
        id: 1,
        title: 'Step 2: The Middle Generation',
        instruction: '"P is the brother of Q. Q is U\'s father. S is the wife of Q." Place Q (Father), S (Mother), and P (Uncle).',
        check: (p) => p.Q === 2 && p.S === 3 && p.P === 4,
        error: 'Place Q as Father, S as Mother, and P as Uncle.',
        allowedCards: ['P', 'Q', 'S']
    },
    {
        id: 2,
        title: 'Step 3: Completing the Family',
        instruction: '"T is the Grandmother of U." The only remaining spot is at Gen 1. Place T.',
        check: (p) => p.T === 1,
        error: 'Place T as the Grandmother.',
        allowedCards: ['T']
    }
];

export default function BloodRelationsSparkTool({ node, unitMeta, onConceptMastered }) {
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
        label: LAYOUT[i].label
    }));

    const trayCards = PEOPLE.filter(p => cardStates[p] === 'tray' || cardStates[p] === 'shaking');

    return (
        <div className="seating-spark-tool">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users size={16} style={{ color: unitMeta.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: unitMeta.color }}>
                        Interactive Assistant — Blood Relations
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

            <div className="mb-6 pt-4">
                <FamilyTreeTable 
                    seats={TOTAL_SEATS} 
                    seatData={seatData} 
                    layout={LAYOUT}
                    connections={CONNECTIONS}
                    onDrop={handleDrop} 
                    color={unitMeta.color} 
                />
            </div>

            <div className="sl-tray">
                <span className="text-[9px] font-black text-surface-600 uppercase tracking-widest mb-2 block">
                    {trayCards.length > 0 ? 'Drag to family tree ↑' : 'Tree complete ✓'}
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
                        <h3 className="text-xl font-black text-heading mb-2">Family Tree Summary</h3>
                        <h4 className="text-sm font-black mb-3" style={{ color: unitMeta.color }}>The "Generational Anchor"</h4>
                        <div className="text-sm text-surface-400 leading-relaxed space-y-2">
                            <p>Blood relation puzzles are solved by separating people into generations.</p>
                            <p><strong className="text-heading">Rule 1:</strong> Identify the oldest/youngest members. Draw them at the top/bottom.</p>
                            <p><strong className="text-heading">Rule 2:</strong> Connect the middle generation using sibling (horizontal) and marriage (double line) notation.</p>
                        </div>
                        <button onClick={() => setShowOverlay(false)}
                            className="mt-5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all hover:opacity-90"
                            style={{ background: unitMeta.color }}>
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
