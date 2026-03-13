/**
 * Utility string methods for AI JSON generation parsing.
 * 
 * LLMs frequently produce JSON containing invalid escape sequences
 * when writing LaTeX (e.g., "\alpha" contains the invalid JSON escape "\a").
 * This robust parser attempts to heal such formatting errors.
 */

export const parseAIJson = (val) => {
    if (!val) return null;

    // 1. Remove markdown code blocks (e.g., ```json ... ```)
    let cleanVal = val.replace(/^```[a-z]*\s*/gim, '').replace(/```\s*$/gim, '').trim();

    // 2. Try standard parse
    try {
        return JSON.parse(cleanVal);
    } catch (err) {
        // 3. Fallback A: Fix invalid escape sequences (anything that isn't \", \\, \/, \b, \f, \n, \r, \t, or \u)
        let fixedVal = cleanVal.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
        try {
            return JSON.parse(fixedVal);
        } catch (err2) {
            // 4. Fallback B: Brute force. Replace ALL single backslashes with double backslashes,
            // but protect valid double backslashes and escaped quotes first.
            let bruteVal = cleanVal.replace(/\\\\/g, '@@DOUBLE@@')
                .replace(/\\"/g, '@@QUOTE@@')
                .replace(/\\/g, '\\\\')
                .replace(/@@DOUBLE@@/g, '\\\\')
                .replace(/@@QUOTE@@/g, '\\"');
            try {
                return JSON.parse(bruteVal);
            } catch (err3) {
                // If all parsing fails, throw
                throw new Error('Invalid JSON format. Please ensure the AI output is valid JSON.');
            }
        }
    }
};
