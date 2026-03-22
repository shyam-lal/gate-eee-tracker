import Book3D from './Book3D';

const BookshelfUnit = ({ subjectName, materials, onBookClick, onToggleBookmark, bookmarks }) => {
    // Split materials into rows of ~10 books each
    const BOOKS_PER_ROW = 10;
    const rows = [];
    for (let i = 0; i < materials.length; i += BOOKS_PER_ROW) {
        rows.push(materials.slice(i, i + BOOKS_PER_ROW));
    }

    return (
        <div className="bookshelf-unit">
            {/* Subject label plaque */}
            <div className="bookshelf-label">
                <span className="bookshelf-label__text">{subjectName}</span>
                <span className="bookshelf-label__count">{materials.length}</span>
            </div>

            {/* Framed shelf unit */}
            <div className="shelf-unit-frame">
                <div className="shelf-unit-frame__inner">
                    {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="shelf-row">
                            {/* Books standing on this shelf */}
                            <div className="shelf-row__books">
                                {row.map(mat => (
                                    <Book3D
                                        key={mat.id}
                                        material={mat}
                                        isBookmarked={bookmarks.has(mat.id)}
                                        onSelect={onBookClick}
                                        onToggleBookmark={onToggleBookmark}
                                    />
                                ))}
                            </div>
                            {/* Wooden shelf plank */}
                            <div className="shelf-row__plank">
                                <div className="shelf-plank">
                                    <div className="shelf-bracket shelf-bracket--left" />
                                    <div className="shelf-bracket shelf-bracket--right" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookshelfUnit;
