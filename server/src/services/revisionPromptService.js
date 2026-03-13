/**
 * Revision Prompt Service
 * Generates LLM prompts for GATE-style question generation.
 * In staging: returns the prompt text for manual querying.
 * In production: will call the LLM API directly.
 */

function generatePrompt(topics, count, examType = 'GATE') {
  return `You are an expert question paper setter for the ${examType} exam (Graduate Aptitude Test in Engineering).
Generate exactly ${count} questions on the following topics: ${topics}.

Mix question types appropriately:
- MCQ (Single Correct Answer): 4 options, 1 correct
- MSQ (Multiple Select Question): 4 options, 1 or more correct
- NAT (Numerical Answer Type): No options, answer is a number

Rules:
1. Questions should be at GATE difficulty level
2. Include a mix of conceptual, analytical, and numerical questions
3. Each question must have a clear, concise explanation
4. MCQ questions carry 1 or 2 marks with 1/3 negative marking for 1-mark and 2/3 for 2-mark
5. MSQ questions carry 2 marks with no negative marking
6. NAT questions carry 1 or 2 marks with no negative marking
7. For NAT, provide a tolerance range for decimal answers
8. Make sure to make no mistake in making the questions or answers.
9. If you are unable to make correct questions and answers, do not make up wrong questions or answers.
10. Do not place unnecessary backslashes in the string that will cause issues in the json.
11. Do not place unnecessary double quotes in the string that will cause issues in the json.

Return ONLY valid JSON in this exact format (no markdown, no code fences, just raw JSON):
{
  "questions": [
    {
      "type": "mcq",
      "question": "The transfer function of a system is G(s) = 10/(s^2 + 3s + 2). The DC gain of the system is:",
      "options": ["5", "10", "2", "1"],
      "correct": [0],
      "explanation": "DC gain = G(0) = 10/(0 + 0 + 2) = 5",
      "marks": 1,
      "negative": 0.33
    },
    {
      "type": "msq",
      "question": "Which of the following are properties of the ROC of a Z-transform?",
      "options": ["ROC is a ring or disk centered at the origin", "ROC does not contain any poles", "ROC is bounded by poles", "ROC always includes the unit circle"],
      "correct": [0, 1, 2],
      "explanation": "The ROC is a connected region that doesn't contain poles and is bounded by poles. It does not necessarily include the unit circle.",
      "marks": 2,
      "negative": 0
    },
    {
      "type": "nat",
      "question": "A series RLC circuit has R = 10Ω, L = 1H, and C = 0.01F. The resonant frequency in rad/s is ___.",
      "options": null,
      "correct": {"value": 10, "tolerance": 0.1},
      "explanation": "ω₀ = 1/√(LC) = 1/√(1 × 0.01) = 1/0.1 = 10 rad/s",
      "marks": 2,
      "negative": 0
    }
  ]
}`;
}

module.exports = { generatePrompt };
