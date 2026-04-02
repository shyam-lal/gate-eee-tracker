-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_months INTEGER NOT NULL DEFAULT 1,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, pending
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Seed Plans
INSERT INTO subscription_plans (name, price, duration_months, features, is_active)
VALUES 
    ('Free', 0.00, 1200, '["Basic tracking", "Limited mock tests", "Community access"]', TRUE),
    ('Pro', 999.00, 6, '["Advanced tracking", "Unlimited mock tests", "Detailed analytics", "Priority support"]', TRUE),
    ('Premium', 1999.00, 12, '["All Pro features", "One-on-one mentoring", "Physical study materials"]', TRUE)
ON CONFLICT DO NOTHING;
