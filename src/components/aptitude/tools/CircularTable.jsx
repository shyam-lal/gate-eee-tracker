import { useRef, useCallback } from 'react';

/**
 * CircularTable — Reusable circular arrangement of drop-zones.
 *
 * Props:
 *   seats          — number of positions around the table (default 6)
 *   seatData       — [{id, label, occupant, state}] for each seat
 *   radius         — circle radius in px (default 120)
 *   onDrop         — (seatIndex, cardId) => void — called when a card is dropped
 *   color          — accent color
 *   renderSeat     — optional custom seat renderer: (seat, index, position) => JSX
 *
 * Each seat position is calculated clockwise from top (12 o'clock).
 * "Facing center" orientation: left/right are from the perspective of someone sitting at that seat facing the center.
 */
export default function CircularTable({
    seats = 6,
    seatData = [],
    radius = 120,
    onDrop,
    color = '#10b981',
    renderSeat,
}) {
    const tableRef = useRef(null);
    const size = radius * 2 + 100; // SVG viewBox size
    const cx = size / 2;
    const cy = size / 2;

    const getSeatPosition = useCallback((index) => {
        // Start from top (−π/2), go clockwise
        const angle = (2 * Math.PI * index) / seats - Math.PI / 2;
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
            angle: (360 * index) / seats, // degrees for rotation
        };
    }, [seats, radius, cx, cy]);

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
        <div className="circular-table-container" style={{ width: size, height: size, position: 'relative' }} ref={tableRef}>
            {/* Table SVG (circle + center) */}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                {/* Table circle */}
                <circle cx={cx} cy={cy} r={radius - 10}
                    fill="rgba(15,23,42,0.4)" stroke={`${color}25`} strokeWidth={2} strokeDasharray="6 4" />
                {/* Center dot */}
                <circle cx={cx} cy={cy} r={4} fill={`${color}40`} />
                {/* Facing Center text */}
                <text x={cx} y={cy + 16} textAnchor="middle" fill={`${color}50`} fontSize="9" fontWeight="bold" letterSpacing="0.05em" opacity="0.6">
                    FACING
                </text>
                <text x={cx} y={cy + 26} textAnchor="middle" fill={`${color}50`} fontSize="9" fontWeight="bold" letterSpacing="0.05em" opacity="0.6">
                    INWARDS
                </text>
                {/* Seat connectors */}
                {Array.from({ length: seats }).map((_, i) => {
                    const pos = getSeatPosition(i);
                    return (
                        <line key={i} x1={cx} y1={cy} x2={pos.x} y2={pos.y}
                            stroke={`${color}10`} strokeWidth={1} strokeDasharray="3 5" />
                    );
                })}
            </svg>

            {/* Drop zones */}
            {Array.from({ length: seats }).map((_, i) => {
                const pos = getSeatPosition(i);
                const seat = seatData[i] || { id: i, occupant: null, state: 'empty' };
                const isOccupied = seat.occupant !== null;
                const isConfirmed = seat.state === 'confirmed';

                if (renderSeat) {
                    return (
                        <div key={i} style={{
                            position: 'absolute',
                            left: pos.x - 28,
                            top: pos.y - 28,
                        }}
                            onDragOver={!isConfirmed ? handleDragOver : undefined}
                            onDrop={!isConfirmed ? (e) => handleDrop(e, i) : undefined}
                        >
                            {renderSeat(seat, i, pos)}
                        </div>
                    );
                }

                return (
                    <div key={i}
                        className={`circular-seat ${isOccupied ? 'circular-seat--occupied' : ''} ${isConfirmed ? 'circular-seat--confirmed' : ''}`}
                        style={{
                            position: 'absolute',
                            left: pos.x - 28,
                            top: pos.y - 28,
                            width: 56,
                            height: 56,
                            borderColor: isConfirmed ? color : isOccupied ? `${color}60` : 'rgba(51,65,85,0.5)',
                            background: isConfirmed ? `${color}15` : isOccupied ? 'rgba(30,41,59,0.8)' : 'rgba(15,23,42,0.6)',
                        }}
                        onDragOver={!isConfirmed ? handleDragOver : undefined}
                        onDrop={!isConfirmed ? (e) => handleDrop(e, i) : undefined}
                    >
                        {/* Seat number */}
                        <span className="circular-seat__number" style={{ color: isConfirmed ? color : 'rgba(148,163,184,0.4)' }}>
                            {i + 1}
                        </span>
                        {/* Occupant */}
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
 * Helper: Get seat relationships for circular arrangement.
 * Seats are numbered clockwise from top (bird's-eye view).
 *
 * "Facing center" flips left/right from bird's-eye:
 *   - RIGHT (facing center) = COUNTER-CLOCKWISE (bird's-eye) = (i - 1 + n) % n
 *   - LEFT  (facing center) = CLOCKWISE (bird's-eye)         = (i + 1) % n
 *   - OPPOSITE = (i + n/2) % n
 */
CircularTable.getRelations = (seatIndex, totalSeats) => ({
    right: (seatIndex - 1 + totalSeats) % totalSeats,
    left: (seatIndex + 1) % totalSeats,
    opposite: (seatIndex + totalSeats / 2) % totalSeats,
});

