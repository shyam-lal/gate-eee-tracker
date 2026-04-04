import { useRef } from 'react';

/**
 * FamilyTreeTable — Reusable freeform layout for family trees or graphs.
 *
 * Props:
 *   seats          — number of positions
 *   seatData       — [{id, label, occupant, state}] for each seat
 *   layout         — array of {x, y} percentage coordinates for each seat
 *   connections    — array of [index1, index2] to draw lines between seats
 *   onDrop         — (seatIndex, cardId) => void
 *   color          — accent color
 */
export default function FamilyTreeTable({
    seats = 5,
    seatData = [],
    layout = [],
    connections = [],
    onDrop,
    color = '#10b981',
}) {
    const tableRef = useRef(null);
    const size = 320; // fixed square for simplicity, can make responsive if needed

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, seatIndex) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId && onDrop) onDrop(seatIndex, cardId);
    };

    // Calculate absolute px coordinates from percentages
    const getPos = (pct, total) => (pct / 100) * total;

    return (
        <div className="family-tree-container" style={{ width: size, height: size, position: 'relative', margin: '0 auto' }} ref={tableRef}>
            {/* SVG Lines */}
            <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                {connections.map(([fromIdx, toIdx], i) => {
                    const fromLayout = layout[fromIdx];
                    const toLayout = layout[toIdx];
                    if (!fromLayout || !toLayout) return null;
                    
                    const x1 = getPos(fromLayout.x, size);
                    const y1 = getPos(fromLayout.y, size);
                    const x2 = getPos(toLayout.x, size);
                    const y2 = getPos(toLayout.y, size);

                    return (
                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={`${color}30`} strokeWidth={2} strokeDasharray="4 4" />
                    );
                })}
            </svg>

            {/* Drop zones */}
            {Array.from({ length: seats }).map((_, i) => {
                const pos = layout[i] || { x: 50, y: 50 };
                const seat = seatData[i] || { id: i, occupant: null, state: 'empty' };
                const isOccupied = seat.occupant !== null;
                const isConfirmed = seat.state === 'confirmed';

                return (
                    <div key={i}
                        className={`circular-seat ${isOccupied ? 'circular-seat--occupied' : ''} ${isConfirmed ? 'circular-seat--confirmed' : ''}`}
                        style={{
                            position: 'absolute',
                            left: getPos(pos.x, size) - 28,
                            top: getPos(pos.y, size) - 28,
                            width: 56,
                            height: 56,
                            borderColor: isConfirmed ? color : isOccupied ? `${color}60` : 'rgba(51,65,85,0.5)',
                            background: isConfirmed ? `${color}15` : isOccupied ? 'rgba(30,41,59,0.8)' : 'rgba(15,23,42,0.6)',
                        }}
                        onDragOver={!isConfirmed ? handleDragOver : undefined}
                        onDrop={!isConfirmed ? (e) => handleDrop(e, i) : undefined}
                    >
                        {seat.label && (
                            <span className="absolute -top-6 text-[9px] font-black uppercase tracking-widest opacity-60 pointer-events-none whitespace-nowrap" style={{ color }}>
                                {seat.label}
                            </span>
                        )}
                        <span className="circular-seat__number" style={{ color: isConfirmed ? color : 'rgba(148,163,184,0.4)' }}>
                            {i + 1}
                        </span>
                        {isOccupied && (
                            <span className="circular-seat__occupant" style={{ color: isConfirmed ? color : '#e2e8f0' }}>
                                {seat.occupant}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Helper to define common family relationships based on connections.
 * This can be customized by the specific SparkTool.
 */
FamilyTreeTable.validateRelation = (placements, personA, personB, condition) => {
    // This allows the specific Spark tool to write robust validation 
    // by comparing seat indexes.
    return true; 
};
