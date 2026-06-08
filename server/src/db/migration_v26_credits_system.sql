-- Migration v26: Credit System & Dropping Subscriptions

-- 1. Drop old subscription tables
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_plans;

-- 2. Add credits column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 30 CHECK (credits >= 0);

-- 3. Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('SIGNUP_BONUS', 'PURCHASE', 'FLASHCARD_GENERATION', 'REFUND')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable pgvector extension and create cached_flashcard_decks table
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS cached_flashcard_decks (
    id SERIAL PRIMARY KEY,
    normalized_topic TEXT NOT NULL,
    card_count INTEGER NOT NULL,
    flashcards_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cached_flashcard_decks ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_cached_flashcard_decks_topic ON cached_flashcard_decks(normalized_topic);
CREATE INDEX IF NOT EXISTS idx_cached_flashcard_decks_embedding ON cached_flashcard_decks USING hnsw (embedding vector_cosine_ops);
