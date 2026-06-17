-- Migration v27: Increase name lengths for subjects and topics
ALTER TABLE topics ALTER COLUMN name TYPE VARCHAR(255);
ALTER TABLE subjects ALTER COLUMN name TYPE VARCHAR(255);
