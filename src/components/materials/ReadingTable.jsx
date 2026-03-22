import { ExternalLink } from 'lucide-react';

const TYPE_LABELS = {
    notes: 'Notes',
    pdf: 'PDF',
    drive_link: 'Drive',
    video_link: 'Video',
    formula_sheet: 'Formula',
};

const BOOK_COLORS = {
    notes:         { bg: '#d4a853' },
    pdf:           { bg: '#e05a6a' },
    drive_link:    { bg: '#4ab8a8' },
    video_link:    { bg: '#9b6bdf' },
    formula_sheet: { bg: '#5cb85c' },
};

const ReadingTable = ({ bookmarkedMaterials, onBookClick, onRemoveBookmark }) => {
    if (!bookmarkedMaterials || bookmarkedMaterials.length === 0) {
        return (
            <div className="reading-table">
                <div className="reading-table__surface">
                    <div className="reading-table__label">📖 Reading Table</div>
                    <div className="reading-table__empty">
                        Right-click any book to save it here for later
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reading-table">
            <div className="reading-table__surface">
                <div className="reading-table__label">📖 Reading Table ({bookmarkedMaterials.length})</div>
                <div className="reading-table__books">
                    {bookmarkedMaterials.map(mat => {
                        const color = BOOK_COLORS[mat.content_type] || BOOK_COLORS.notes;
                        const typeLabel = TYPE_LABELS[mat.content_type] || 'Note';
                        return (
                            <div
                                key={mat.id}
                                className="table-book"
                                style={{ background: color.bg }}
                                onClick={() => onBookClick(mat)}
                            >
                                <button
                                    className="table-book__remove"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveBookmark(mat.id);
                                    }}
                                >
                                    ×
                                </button>
                                <div className="table-book__title">{mat.title}</div>
                                <div className="table-book__type">
                                    {typeLabel} • {mat.subject_name || 'General'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ReadingTable;
