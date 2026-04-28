-- Migration v23: Sync difficulty_level from difficulty string and fix estimated_hours defaults
-- This fixes the gap where difficulty_level was never populated from bulk_exams.json imports,
-- and resets the hardcoded 12h default so the smart fallback engine can compute real estimates.

-- Step 1: Sync difficulty_level from the difficulty string column for ALL topics
UPDATE exam_topics
SET difficulty_level = CASE difficulty
    WHEN 'easy' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'hard' THEN 4
    ELSE 3
END
WHERE difficulty IS NOT NULL;

-- Step 2: Reset estimated_hours to NULL for ALL topics.
-- The smart fallback engine (computeEstimatedHours) will dynamically calculate
-- proper estimates based on difficulty_level and subject weightage.
-- This is safe because:
--   - Old seed_exams.js hardcoded 12h for everything (wrong)
--   - bulk_exams.json data can be re-imported cleanly later with correct values
--   - The fallback engine produces reasonable estimates: easy=6h, medium=10h, hard=18h
UPDATE exam_topics
SET estimated_hours = NULL;
