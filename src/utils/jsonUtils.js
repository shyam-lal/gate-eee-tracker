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
        // 3. Fallback A: Fix typical LaTeX control-character collisions
        // LLMs often output \frac, \tau, \rho, \nu which get parsed as \f (form feed), \t (tab), \r (carriage return), \n (newline).
        // Since we are expecting LaTeX, we aggressively double-escape single backslashes in front of ANY letter, 
        // completely ignoring JSON's standard \f, \t, \r, \n escapes because they shouldn't exist as raw escapes in AI output anyway unless it's LaTeX.
        
        let fixedVal = cleanVal
            // First, protect things that are already double escaped
            .replace(/\\\\/g, '@@DOUBLE@@')
            // Protect escaped quotes
            .replace(/\\"/g, '@@QUOTE@@')
            // Now, any remaining single backslash followed by a letter (like \frac, \tau, \rho, \nu, \alpha, \beta, \hphantom) 
            // gets forced into a double backslash.
            .replace(/\\([a-zA-Z])/g, '\\\\$1')
            // Restore protections
            .replace(/@@DOUBLE@@/g, '\\\\')
            .replace(/@@QUOTE@@/g, '\\"');

        try {
            return JSON.parse(fixedVal);
        } catch (err2) {
            // 4. Fallback B: Brute force. Replace ALL remaining single backslashes with double backslashes
            let bruteVal = fixedVal.replace(/\\/g, '\\\\');
            // But we actually need to be careful with quotes:
            // Since we protected quotes earlier, let's just do a blanket clean:
            let superBrute = cleanVal.replace(/\\\\/g, '@@DOUBLE@@')
                .replace(/\\"/g, '@@QUOTE@@')
                .replace(/\\/g, '\\\\') // Duplicate EVERY single backslash
                .replace(/@@DOUBLE@@/g, '\\\\')
                .replace(/@@QUOTE@@/g, '\\"');
            
            try {
                return JSON.parse(superBrute);
            } catch (err3) {
                // If all parsing fails, throw
                throw new Error('Invalid JSON format. Please ensure the AI output is valid JSON.');
            }
        }
    }
};
