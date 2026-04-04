import { useState, useCallback, useEffect, useRef } from 'react';
import CircularTable from './CircularTable';
import DraggableCard from './DraggableCard';
import { Users, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * SeatingCircularSparkTool — Node 31: Circular Seating Arrangements
 *
 * 6 people around a circular table. Clues constrain positions.
 * User drags cards to seats. Wrong placement → shake & snap back.
 * All correct → mastery + strategy overlay.
 */

const TOTAL_SEATS = 6;
const PEOPLE = ['A', 'B', 'C', 'D', 'E', 'F'];

// ═══════════════════════════════════════════════════
// PUZZLE: The correct solution
// Seat 0 = top (12 o'clock), numbered clockwise in bird's-eye view
//
// FACING CENTER orientation:
//   RIGHT = counter-clockwise (bird's-eye) = (i-1+n)%n
//   LEFT  = clockwise (bird's-eye)          = (i+1)%n
//
// Clue 1: A opposite F         → A=0, F=3 (0+3=3) ✓
// Clue 2: B to A's imm. right  → right of 0 = (0-1+6)%6 = 5, B=5 ✓
// Clue 3: D to E's imm. left   → left of E = (E+1)%6. E=1, D=2 ✓
// Remaining: C=4
// ═══════════════════════════════════════════════════
const SOLUTION = { A: 0, B: 5, C: 4, D: 2, E: 1, F: 3 };

const CLUES = [
    { id: 1, text: 'A is sitting opposite F.', validate: (placements) => {
        if (placements.A === null || placements.F === null) return null; // not yet placed
        const rel = CircularTable.getRelations(placements.A, TOTAL_SEATS);
        return rel.opposite === placements.F;
    }},
    { id: 2, text: 'B is to the immediate right of A.', validate: (placements) => {
        if (placements.A === null || placements.B === null) return null;
        const rel = CircularTable.getRelations(placements.A, TOTAL_SEATS);
        return rel.right === placements.B;
    }},
    { id: 3, text: 'D is to the immediate left of E.', validate: (placements) => {
        if (placements.D === null || placements.E === null) return null;
        const rel = CircularTable.getRelations(placements.E, TOTAL_SEATS);
        return rel.left === placements.D;
    }},
];

export default function SeatingCircularSparkTool({ node, unitMeta, onConceptMastered }) {
    // placements: { A: seatIndex|null, B: seatIndex|null, ... }
    const [placements, setPlacements] = useState(
        Object.fromEntries(PEOPLE.map(p => [p, null]))
    );
    // Track which seats are occupied: seatIndex → personId
    const [seatOccupants, setSeatOccupants] = useState(
        Array.from({ length: TOTAL_SEATS }, () => null)
    );
    // Card states: { A: 'tray'|'draft'|'confirmed'|'shaking' }
    const [cardStates, setCardStates] = useState(
        Object.fromEntries(PEOPLE.map(p => [p, 'tray']))
    );
    const [completed, setCompleted] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [feedback, setFeedback] = useState(null); // {type: 'success'|'error', message}
    const feedbackTimeout = useRef(null);

    // Check if a specific placement is consistent with clues
    const checkPlacement = useCallback((person, seatIndex, currentPlacements) => {
        const testPlacements = { ...currentPlacements, [person]: seatIndex };

        for (const clue of CLUES) {
            const result = clue.validate(testPlacements);
            if (result === false) return { valid: false, clue };
        }

        // Also check: is this the correct seat for this person?
        if (SOLUTION[person] !== seatIndex) {
            return { valid: false, clue: null };
        }

        return { valid: true };
    }, []);

    // Check if all placements are correct → complete
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
        // Seat already occupied by a confirmed card?
        if (seatOccupants[seatIndex] && cardStates[seatOccupants[seatIndex]] === 'confirmed') return;

        // If seat has a draft occupant, return them to tray
        if (seatOccupants[seatIndex]) {
            const prev = seatOccupants[seatIndex];
            setPlacements(p => ({ ...p, [prev]: null }));
            setCardStates(s => ({ ...s, [prev]: 'tray' }));
        }

        // If card was on another seat, clear that seat
        const oldSeat = placements[cardId];
        const newOccupants = [...seatOccupants];
        if (oldSeat !== null) newOccupants[oldSeat] = null;

        const newPlacements = { ...placements, [cardId]: seatIndex };

        // Validate
        const { valid, clue } = checkPlacement(cardId, seatIndex, placements);

        if (!valid) {
            // SHAKE + snap back
            setCardStates(s => ({ ...s, [cardId]: 'shaking' }));
            showFeedbackMessage('error', clue
                ? `Violates: "${clue.text}"`
                : `${cardId} doesn't belong here. Try another seat.`
            );
            setTimeout(() => {
                setCardStates(s => ({ ...s, [cardId]: 'tray' }));
                setPlacements(p => ({ ...p, [cardId]: null }));
                // Restore old occupant state
                if (oldSeat !== null) {
                    const restored = [...seatOccupants];
                    restored[seatIndex] = null;
                    setSeatOccupants(restored);
                }
            }, 600);
            return;
        }

        // Valid placement → confirm
        newOccupants[seatIndex] = cardId;
        setSeatOccupants(newOccupants);
        setPlacements(newPlacements);
        setCardStates(s => ({ ...s, [cardId]: 'confirmed' }));
        showFeedbackMessage('success', `${cardId} locked in seat ${seatIndex + 1}!`);

        // Check completion
        if (checkCompletion(newPlacements)) {
            setTimeout(() => {
                setCompleted(true);
                setShowOverlay(true);
                onConceptMastered?.(true);
            }, 500);
        }
    }, [placements, seatOccupants, cardStates, checkPlacement, checkCompletion, onConceptMastered]);

    // Build seat data for CircularTable
    const seatData = Array.from({ length: TOTAL_SEATS }, (_, i) => ({
        id: i,
        occupant: seatOccupants[i],
        state: seatOccupants[i] ? cardStates[seatOccupants[i]] : 'empty',
    }));

    // Cards still in tray
    const trayCards = PEOPLE.filter(p => cardStates[p] === 'tray' || cardStates[p] === 'shaking');

    return (
        <div className="seating-spark-tool">
            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
                <Users size={16} style={{ color: unitMeta.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: unitMeta.color }}>
                    Structure Lab — Circular Seating
                </span>
            </div>
            <p className="text-xs text-surface-500 mb-4">
                Drag each person to their seat. Wrong placements snap back.
            </p>

            {/* Clues */}
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

            {/* Feedback toast */}
            {feedback && (
                <div className={`sl-feedback ${feedback.type === 'error' ? 'sl-feedback--error' : 'sl-feedback--success'}`}
                    style={feedback.type === 'success' ? { borderColor: `${unitMeta.color}50`, background: `${unitMeta.color}10` } : {}}>
                    {feedback.type === 'success' ? <CheckCircle size={14} style={{ color: unitMeta.color }} /> : <AlertCircle size={14} className="text-rose-400" />}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Table + Drop zones */}
            <div className="flex justify-center mb-5">
                <CircularTable
                    seats={TOTAL_SEATS}
                    seatData={seatData}
                    radius={110}
                    onDrop={handleDrop}
                    color={unitMeta.color}
                />
            </div>

            {/* Card Tray */}
            <div className="sl-tray">
                <span className="text-[9px] font-black text-surface-600 uppercase tracking-widest mb-2 block">
                    {trayCards.length > 0 ? 'Drag to seat ↑' : 'All seated ✓'}
                </span>
                <div className="sl-tray__cards">
                    {PEOPLE.map(p => (
                        <div key={p} style={{ display: cardStates[p] === 'confirmed' ? 'none' : 'block' }}>
                            <DraggableCard
                                id={p}
                                label={p}
                                state={cardStates[p]}
                                color={unitMeta.color}
                                disabled={cardStates[p] === 'confirmed'}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Completion Overlay */}
            {showOverlay && (
                <div className="sl-overlay">
                    <div className="sl-overlay__card">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: `${unitMeta.color}20` }}>
                            <Lightbulb size={28} style={{ color: unitMeta.color }} />
                        </div>
                        <h3 className="text-xl font-black text-heading mb-2">Logic Summary</h3>
                        <h4 className="text-sm font-black mb-3" style={{ color: unitMeta.color }}>The "Fixed Anchor" Strategy</h4>
                        <div className="text-sm text-surface-400 leading-relaxed space-y-2">
                            <p><strong className="text-heading">Step 1:</strong> Pick the most constrained person — someone mentioned in multiple clues. Here, <strong className="text-heading">A</strong> appears in Clue 1 and 2.</p>
                            <p><strong className="text-heading">Step 2:</strong> <strong className="text-heading">Fix A</strong> at any seat (it's circular — the first placement is always arbitrary).</p>
                            <p><strong className="text-heading">Step 3:</strong> Use constraints to lock others relative to A: B goes to A's right, F goes opposite.</p>
                            <p><strong className="text-heading">Step 4:</strong> Remaining people fill in from the leftover clues.</p>
                        </div>
                        <div className="mt-4 p-3 rounded-xl border border-surface-800 bg-surface-900/50">
                            <p className="text-xs text-surface-500">
                                💡 <strong className="text-surface-300">In exams:</strong> Always anchor first, then build outward. Never guess — derive each position from the previous one.
                            </p>
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
