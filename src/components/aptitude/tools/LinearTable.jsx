import { useRef } from 'react';

/**
 * LinearTable — Reusable row arrangement of drop-zones.
 *
 * Props:
 *   seats          — number of positions in the row (default 6)
 *   seatData       — [{id, label, occupant, state}] for each seat
 *   onDrop         — (seatIndex, cardId) => void — called when a card is dropped
 *   color          — accent color
 *   renderSeat     — optional custom seat renderer
 *
 * "Facing North" orientation (default for exams unless specified):
 * - Left is visually left (index decreases)
 * - Right is visually right (index increases)
 */
export default function LinearTable({
    seats = 6,
    seatData = [],
    onDrop,
    color = '#10b981',
    renderSeat,
}) {
    const tableRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, seatIndex) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId && onDrop) onDrop(seatIndex, cardId);
    };

    return (
        <div className="linear-table-container" ref={tableRef}>
            {/* The table visual bar */}
            <div className="linear-table-bar" style={{ borderColor: `${color}25` }}></div>

            {/* Drop zones arranged horizontally */}
            <div className="linear-seats-row">
                {Array.from({ length: seats }).map((_, i) => {
                    const seat = seatData[i] || { id: i, occupant: null, state: 'empty' };
                    const isOccupied = seat.occupant !== null;
                    const isConfirmed = seat.state === 'confirmed';

                    if (renderSeat) {
                        return (
                            <div key={i}
                                onDragOver={!isConfirmed ? handleDragOver : undefined}
                                onDrop={!isConfirmed ? (e) => handleDrop(e, i) : undefined}
                            >
                                {renderSeat(seat, i)}
                            </div>
                        );
                    }

                    return (
                        <div key={i} className="linear-seat-wrapper relative flex flex-col items-center">
                            {/* Direction labels for ends */}
                            {i === 0 && (
                                <span className="absolute -top-7 text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color }}>Left End</span>
                            )}
                            {i === seats - 1 && (
                                <span className="absolute -top-7 text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color }}>Right End</span>
                            )}
                            
                            <div
                                className={`circular-seat ${isOccupied ? 'circular-seat--occupied' : ''} ${isConfirmed ? 'circular-seat--confirmed' : ''}`}
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderColor: isConfirmed ? color : isOccupied ? `${color}60` : 'rgba(51,65,85,0.5)',
                                    background: isConfirmed ? `${color}15` : isOccupied ? 'rgba(30,41,59,0.8)' : 'rgba(15,23,42,0.6)',
                                }}
                                onDragOver={!isConfirmed ? handleDragOver : undefined}
                                onDrop={!isConfirmed ? (e) => handleDrop(e, i) : undefined}
                            >
                                <span className="circular-seat__number" style={{ color: isConfirmed ? color : 'rgba(148,163,184,0.4)' }}>
                                    {i + 1}
                                </span>
                                {isOccupied && (
                                    <span className="circular-seat__occupant" style={{ color: isConfirmed ? color : '#e2e8f0' }}>
                                        {seat.occupant}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Helper: Get seat relationships for a linear arrangement (facing North).
 * Left/Right are absolute to the index.
 */
LinearTable.getRelations = (seatIndex, totalSeats) => ({
    right: seatIndex + 1 < totalSeats ? seatIndex + 1 : null,
    left: seatIndex - 1 >= 0 ? seatIndex - 1 : null,
    // Provide a helper array of all seats to the right
    allRight: Array.from({ length: totalSeats - 1 - seatIndex }).map((_, i) => seatIndex + 1 + i),
    allLeft: Array.from({ length: seatIndex }).map((_, i) => i),
});
