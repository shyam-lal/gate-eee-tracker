/**
 * Utility for parsing AI-generated JSON that may contain LaTeX.
 * 
 * PROBLEM: LLMs produce JSON with LaTeX like \frac, \tau, \rho, \nu.
 * JSON.parse interprets \f as form-feed, \t as tab, \r as carriage-return,
 * \n as newline — silently corrupting the LaTeX into control characters.
 * Similarly, \[ and \( are invalid JSON escapes that cause parse errors.
 * 
 * SOLUTION: We heal the raw text BEFORE parsing by converting all
 * single-backslash sequences (except \\, \", \/) into double-backslash,
 * so \frac becomes \\frac (a literal backslash + "frac" in the parsed string).
 */

export const parseAIJson = (val) => {
    if (!val) return null;

    // 1. Remove markdown code blocks (e.g., ```json ... ```)
    let raw = val.replace(/^```[a-z]*\s*/gim, '').replace(/```\s*$/gim, '').trim();

    // 2. ALWAYS heal LaTeX/JSON collisions BEFORE parsing.
    let healed = healLatexEscapes(raw);

    // 3. Try parsing the healed version
    try {
        return JSON.parse(healed);
    } catch (err) {
        // 4. Fallback: try the raw version (maybe it was already properly escaped)
        try {
            return JSON.parse(raw);
        } catch (err2) {
            throw new Error('Invalid JSON format. Please ensure the AI output is valid JSON.');
        }
    }
};

/**
 * Heals LaTeX escape collisions inside JSON string values.
 * 
 * Walks through the raw JSON text character by character,
 * only modifying content inside quoted strings.
 * 
 * Inside strings, the ONLY valid JSON escapes we preserve are:
 *   \\  \"  \/  \uXXXX
 * 
 * Everything else (\f \t \r \n \b and any invalid escapes like \a \[ \( etc.)
 * gets double-escaped because in our context they are almost always
 * LaTeX commands, not actual control characters.
 */
function healLatexEscapes(raw) {
    let result = '';
    let inString = false;
    let i = 0;

    while (i < raw.length) {
        const ch = raw[i];

        if (!inString) {
            // Outside a string: just copy characters, watch for opening quote
            if (ch === '"') {
                inString = true;
            }
            result += ch;
            i++;
        } else {
            // Inside a string
            if (ch === '"') {
                // End of string (unescaped quote)
                inString = false;
                result += ch;
                i++;
            } else if (ch === '\\') {
                const next = raw[i + 1];
                if (next === undefined) {
                    // Trailing backslash at end of input
                    result += ch;
                    i++;
                } else if (next === '\\') {
                    // Already a double backslash (\\), keep as is
                    result += '\\\\';
                    i += 2;
                } else if (next === '"') {
                    // Escaped quote (\"), keep as is
                    result += '\\"';
                    i += 2;
                } else if (next === '/') {
                    // Escaped slash (\/), keep as is 
                    result += '\\/';
                    i += 2;
                } else if (next === 'u' && /^[0-9a-fA-F]{4}/.test(raw.slice(i + 2, i + 6))) {
                    // Unicode escape (\uXXXX), keep as is
                    result += raw.slice(i, i + 6);
                    i += 6;
                } else {
                    // EVERYTHING ELSE gets double-escaped.
                    // This catches:
                    //   \f (form-feed, but we want \frac)
                    //   \t (tab, but we want \tau, \theta)
                    //   \r (carriage return, but we want \rho)
                    //   \n (newline, but we want \nu)
                    //   \b (backspace, but we want \beta)
                    //   \a, \c, \d, \e, \g, \h, \i, ... (all LaTeX commands)
                    //   \[, \], \(, \) (LaTeX delimiters)
                    //   Any other non-standard escape
                    result += '\\\\' + next;
                    i += 2;
                }
            } else {
                result += ch;
                i++;
            }
        }
    }

    return result;
}

/**
 * Heals already-parsed/stored content where control characters 
 * replaced LaTeX commands during a faulty JSON.parse.
 * 
 * For example:
 *   \frac -> form-feed + "rac"  (char code 12)
 *   \tau  -> tab + "au"         (char code 9)
 *   \rho  -> carriage-return + "ho" (char code 13) 
 *   \nu   -> newline + "u"      (char code 10)
 *   \beta -> backspace + "eta"  (char code 8)
 * 
 * This function reverses those corruptions.
 */
export const healLatexContent = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    return text
        // Form feed (0x0C) -> was \f (e.g., \frac, \flat, \forall)
        .replace(/\x0C/g, '\\f')
        // Tab (0x09) -> was \t (e.g., \tau, \theta, \times, \text)
        .replace(/\x09/g, '\\t')
        // Carriage return (0x0D) -> was \r (e.g., \rho, \rightarrow, \rangle) 
        .replace(/\x0D/g, '\\r')
        // Newline (0x0A) inside card content -> was \n (e.g., \nu, \nabla, \neq)
        // NOTE: We only replace \n that is followed by common LaTeX suffixes
        // to avoid breaking intentional newlines in rich text
        .replace(/\n(u[^a-z]|u$|abla|eq|ot|ewline|i|cap|cup|otin|e\b)/g, '\\n$1')
        // Backspace (0x08) -> was \b (e.g., \beta, \bar, \binom, \boldsymbol)
        .replace(/\x08/g, '\\b');
};
