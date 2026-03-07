-- Migration v4: Flashcard and Spaced Repetition System (SRS)

-- DECKS table
CREATE TABLE IF NOT EXISTS decks (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CARDS table
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER REFERENCES decks(id) ON DELETE CASCADE,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    
    -- Future AI linking: allow linking a card to a specific topic
    -- This way, we can auto-generate cards for "Control Systems" -> "Nyquist Plot"
    source_topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL, 
    created_by_ai BOOLEAN DEFAULT FALSE,

    -- SM-2 Spaced Repetition Algorithm Data
    repetition INTEGER DEFAULT 0,
    interval_days INTEGER DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    next_review_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
