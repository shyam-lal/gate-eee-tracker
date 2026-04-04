import { useState, useCallback, useEffect, useRef } from 'react';
import LinearTable from './LinearTable';
import DraggableCard from './DraggableCard';
import { Users, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * SeatingLinearSparkTool — Node 30: Linear Seating Arrangements
 *
 * 5 people in a row facing North.
 */

const TOTAL_SEATS = 5;
const PEOPLE = ['P', 'Q', 'R', 'S', 'T'];

// Solution: S(0), P(1), T(2), Q(3), R(4)
// Clue 1: T is exactly in the middle → T=2
// Clue 2: Q is to the immediate right of T → Q=3
// Clue 3: P is to the immediate left of T → P=1
// Clue 4: S sits at an extreme end. S is not adjacent to P → Wait, if S is at end, S=0 or S=4. 
// If S=0, adjacent to P(1). So S cannot be 0. So S=4.
// Let's change Clue 4: "S and R sit at the extreme ends. S is to the left of P."
// P=1. "S is to the left of P" means S=0. Then R=4.
// Solution: S(0), P(1), T(2), Q(3), R(4)

const SOLUTION = { S: 0, P: 1, T: 2, Q: 3, R: 4 };

const CLUES = [
    { id: 1, text: 'T sits exactly in the middle of the row.', validate: (placements) => {
        if (placements.T === null) return null;
        return placements.T === 2;
    }},
    { id: 2, text: 'Q is to the immediate right of T.', validate: (placements) => {
        if (placements.T === null || placements.Q === null) return null;
        const rel = LinearTable.getRelations(placements.T, TOTAL_SEATS);
        return rel.right === placements.Q;
    }},
    { id: 3, text: 'P is to the immediate left of T.', validate: (placements) => {
        if (placements.P === null || placements.T === null) return null;
        const rel = LinearTable.getRelations(placements.T, TOTAL_SEATS);
        return rel.left === placements.P;
    }},
    { id: 4, text: 'S sits at an extreme left end.', validate: (placements) => {
        if (placements.S === null) return null;
        return placements.S === 0;
    }},
];

export default function SeatingLinearSparkTool({ node, unitMeta, onConceptMastered }) {
    const [placements, setPlacements] = useState(
        Object.fromEntries(PEOPLE.map(p => [p, null]))
    );
    const [seatOccupants, setSeatOccupants] = useState(
        Array.from({ length: TOTAL_SEATS }, () => null)
    );
    const [cardStates, setCardStates] = useState(
        Object.fromEntries(PEOPLE.map(p => [p, 'tray']))
    );
    const [completed, setCompleted] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const feedbackTimeout = useRef(null);

    const checkPlacement = useCallback((person, seatIndex, currentPlacements) => {
        const testPlacements = { ...currentPlacements, [person]: seatIndex };

        for (const clue of CLUES) {
            const result = clue.validate(testPlacements);
            if (result === false) return { valid: false, clue };
        }

        if (SOLUTION[person] !== seatIndex) {
            return { valid: false, clue: null };
        }

        return { valid: true };
    }, []);

    const checkCompletion = useCallback((newPlacements) => {
        const allPlaced = PEOPLE.every(p => newPlacements[p] !== null);
        if (!allPlaced) return false;
        return PEOPLE.every(p => newPlacements[p] === SOLUTION[p]);
    }, []);

    const showFeedbackMessage = (type, message) => {
        clearTimeout(feedbackTimeout.current);
        setFeedback({ type, message });
        feedbackTimeout.current = setTimeout(() => setFeedback(null), 2500);
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

        const newPlacements = { ...placements, [cardId]: seatIndex };
        const { valid, clue } = checkPlacement(cardId, seatIndex, placements);

        if (!valid) {
            setCardStates(s => ({ ...s, [cardId]: 'shaking' }));
            showFeedbackMessage('error', clue ? `Violates: "${clue.text}"` : `${cardId} doesn't belong here.`);
            setTimeout(() => {
                setCardStates(s => ({ ...s, [cardId]: 'tray' }));
                setPlacements(p => ({ ...p, [cardId]: null }));
                if (oldSeat !== null) {
                    const restored = [...seatOccupants];
                    restored[seatIndex] = null;
                    setSeatOccupants(restored);
                }
            }, 600);
            return;
        }

        newOccupants[seatIndex] = cardId;
        setSeatOccupants(newOccupants);
        setPlacements(newPlacements);
        setCardStates(s => ({ ...s, [cardId]: 'confirmed' }));
        showFeedbackMessage('success', `${cardId} locked in seat ${seatIndex + 1}!`);

        if (checkCompletion(newPlacements)) {
            setTimeout(() => {
                setCompleted(true);
                setShowOverlay(true);
                onConceptMastered?.(true);
            }, 500);
        }
    }, [placements, seatOccupants, cardStates, checkPlacement, checkCompletion, onConceptMastered]);

    const seatData = Array.from({ length: TOTAL_SEATS }, (_, i) => ({
        id: i,
        occupant: seatOccupants[i],
        state: seatOccupants[i] ? cardStates[seatOccupants[i]] : 'empty',
    }));

    const trayCards = PEOPLE.filter(p => cardStates[p] === 'tray' || cardStates[p] === 'shaking');

    return (
        <div className="seating-spark-tool">
            <div className="flex items-center gap-2 mb-1">
                <Users size={16} style={{ color: unitMeta.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: unitMeta.color }}>
                    Structure Lab — Linear Seating
                </span>
            </div>
            <p className="text-xs text-surface-500 mb-4">
                Drag each person to their seat on the bench.
            </p>

            <div className="sl-clues mb-5">
                {CLUES.map(clue => {
                    const result = clue.validate(placements);
                    return (
                        <div key={clue.id} className={`sl-clue ${result === true ? 'sl-clue--met' : result === false ? 'sl-clue--violated' : ''}`}
                            style={result === true ? { borderColor: `${unitMeta.color}40`, background: `${unitMeta.color}08` } : {}}>
                            <span className="sl-clue__num" style={result === true ? { background: unitMeta.color } : {}}>
                                {result === true ? '✓' : clue.id}
                            </span>
                            <span className="sl-clue__text">{clue.text}</span>
                        </div>
                    );
                })}
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
                        <h3 className="text-xl font-black text-heading mb-2">Linear Logic Summary</h3>
                        <h4 className="text-sm font-black mb-3" style={{ color: unitMeta.color }}>The "Absolute Anchor"</h4>
                        <div className="text-sm text-surface-400 leading-relaxed space-y-2">
                            <p>Unlike circular tables, linear rows have absolute start and end points.</p>
                            <p><strong className="text-heading">Step 1:</strong> Look for clues giving absolute positions (like "extreme left" or "exactly in the middle"). Here, T is in the middle.</p>
                            <p><strong className="text-heading">Step 2:</strong> Anchor T at seat 3 (index 2).</p>
                            <p><strong className="text-heading">Step 3:</strong> Build out around T (Q to the right, P to the left).</p>
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
