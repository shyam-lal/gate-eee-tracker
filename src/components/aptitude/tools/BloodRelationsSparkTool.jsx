import { useState, useCallback, useRef } from 'react';
import FamilyTreeTable from './FamilyTreeTable';
import DraggableCard from './DraggableCard';
import { Users, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * BloodRelationsSparkTool — Node 25: Blood Relations
 *
 * 6 family members. User drags them to the correct node in the Family Tree.
 */

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

const CLUES = [
    { id: 1, text: 'R is the Grandfather of U.', validate: (p) => {
        if (p.R !== null && p.R !== 0) return false;
        if (p.U !== null && p.U !== 5) return false;
        return null; // Don't return true unless both placed, wait, just return true if both correct
    }},
    { id: 2, text: 'P is the brother of Q. Q is U\'s father.', validate: (p) => {
        if (p.P !== null && p.P !== 4) return false;
        if (p.Q !== null && p.Q !== 2) return false;
        return null;
    }},
    { id: 3, text: 'T is the Grandmother of U.', validate: (p) => {
        if (p.T !== null && p.T !== 1) return false;
        return null;
    }},
    { id: 4, text: 'S is the wife of Q.', validate: (p) => {
        if (p.S !== null && p.S !== 3) return false;
        if (p.Q !== null && p.Q !== 2) return false;
        return null;
    }},
];

// Improve validation logic: returns true if all parts of clue are met
const checkClueProgress = (clue, placements) => {
    switch (clue.id) {
        case 1: return (placements.R === 0 && placements.U === 5) ? true : clue.validate(placements) === false ? false : null;
        case 2: return (placements.P === 4 && placements.Q === 2) ? true : clue.validate(placements) === false ? false : null;
        case 3: return (placements.T === 1) ? true : clue.validate(placements) === false ? false : null;
        case 4: return (placements.S === 3 && placements.Q === 2) ? true : clue.validate(placements) === false ? false : null;
        default: return null;
    }
};

export default function BloodRelationsSparkTool({ node, unitMeta, onConceptMastered }) {
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
        showFeedbackMessage('success', `${cardId} is correct!`);

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
        label: LAYOUT[i].label
    }));

    const trayCards = PEOPLE.filter(p => cardStates[p] === 'tray' || cardStates[p] === 'shaking');

    return (
        <div className="seating-spark-tool">
            <div className="flex items-center gap-2 mb-1">
                <Users size={16} style={{ color: unitMeta.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: unitMeta.color }}>
                    Structure Lab — Blood Relations
                </span>
            </div>
            <p className="text-xs text-surface-500 mb-4">
                Drag family members to the correct position in the Family Tree.
            </p>

            <div className="sl-clues mb-5">
                {CLUES.map(clue => {
                    const result = checkClueProgress(clue, placements);
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
                            <p><strong className="text-heading">Step 1:</strong> Identify the oldest/youngest members. R and T are Grandparents (Gen 1). U is the Son (Gen 3).</p>
                            <p><strong className="text-heading">Step 2:</strong> Connect the middle generation using siblings and marriages. P is Q's brother, S is Q's wife. They form Gen 2.</p>
                            <p><strong className="text-heading">Step 3:</strong> Draw the connecting lines. Q and S are U's parents. R and T are Q and P's parents.</p>
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
