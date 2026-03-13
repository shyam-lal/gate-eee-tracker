/**
 * Flashcard AI Prompt Service
 * Generates an LLM prompt asking for flashcards in JSON format.
 */

function generateFlashcardPrompt(topic, count) {
  return `You are an expert tutor preparing flashcards for the GATE (Graduate Aptitude Test in Engineering) exam.
Create exactly ${count} high-quality flashcards for the following topic: ${topic}.

Rules:
1. Focus on core concepts, important formulas, and definitions.
2. The "front" should contain the question or naming the formula/concept.
3. The "back" should contain the clear, concise answer or explanation.
4. Make sure to make no mistake in making the questions or answers.
5. If you are unable to make correct questions and answers, do not make up wrong questions or answers.
6. Do not place unnecessary backslashes or unsupported escape sequences in the string.
7. Do not place unnecessary double quotes in the string that will cause issues in the json.
8. VERY IMPORTANT FOR MATH/EQUATIONS: Always enclose mathematical equations or symbols in standard LaTeX delimiters.
   - For inline math, use \\\\( ... \\\\) (e.g., \\\\( x^2 \\\\)).
   - For block math, use \\\\[ ... \\\\] (e.g., \\\\[ F = ma \\\\]).
   - NEVER use single $ or double $$ delimiters.
9. Do NOT use markdown formatting (like bold **, italics _, or code blocks \`\`\`) inside the text strings. It must be plain text and LaTeX only so it renders safely in our rich-text fields.

Return ONLY valid JSON in this exact format:
{
  "flashcards": [
    {
      "front": "What is the formula for the resonant frequency of a series RLC circuit?",
      "back": "The resonant frequency is given by \\\\[ f_0 = \\\\frac{1}{2\\\\pi\\\\sqrt{LC}} \\\\] where L is inductance and C is capacitance."
    },
    {
      "front": "Define Time Constant (\\\\( \\\\tau \\\\)) for an RC circuit.",
      "back": "The time required for the capacitor voltage to reach approximately 63.2% of its final steady-state value. \\\\[ \\\\tau = R \\\\times C \\\\]"
    }
  ]
}`;
}

module.exports = { generateFlashcardPrompt };
