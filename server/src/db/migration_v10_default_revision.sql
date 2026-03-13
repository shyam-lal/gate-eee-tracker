-- Create global revision tests for all existing users who do not have one
INSERT INTO tools (user_id, name, tool_type, selected_exam)
SELECT id, 'Global Revision Tests', 'revision', selected_exam
FROM users
WHERE id NOT IN (
    SELECT DISTINCT user_id 
    FROM tools 
    WHERE tool_type = 'revision'
);
