/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm Helper
 * 
 * calculates the new interval, ease factor, and repetition count
 * based on the user's score (0-5)
 * 
 * Scores (mapped to a 0-3 simple UI in our app, but translated back to 1-4/0-5 for standard SM-2 logic):
 * 0 = Complete Blackout
 * 1 = Incorrect, but remembered upon seeing answer
 * 2 = Incorrect, but felt familiar
 * 3 = Correct, but with immense effort (Hard)
 * 4 = Correct, after hesitation (Good)
 * 5 = Correct, perfect response (Easy)
 */

function calculateSM2(score, currentRepetition, currentInterval, currentEaseFactor) {
    let repetition = currentRepetition;
    let interval = currentInterval;
    let easeFactor = currentEaseFactor;

    // score: 0 = Again, 3 = Hard, 4 = Good, 5 = Easy

    if (score < 3) {
        // Again -> reset to learning
        repetition = 0;
        interval = 0; // Due today
    } else {
        if (repetition === 0) {
            // First time seeing it (New Card)
            if (score === 3) interval = 0;      // Hard -> learning
            else if (score === 4) interval = 1; // Good -> 1 day
            else if (score === 5) interval = 4; // Easy -> 4 days
        } else if (repetition === 1) {
            // Second review
            if (score === 3) interval = 1;      // Hard -> 1 day
            else if (score === 4) interval = 6; // Good -> 6 days
            else if (score === 5) interval = 8; // Easy -> 8 days
        } else {
            // 3rd time+ (Reviewing graduated card)
            if (score === 3) {
                interval = Math.round(interval * 1.2); // Anki Hard multiplier
            } else if (score === 4) {
                interval = Math.round(interval * easeFactor); // Anki Good multiplier
            } else if (score === 5) {
                interval = Math.round(interval * easeFactor * 1.3); // Anki Easy multiplier
            }
        }
        repetition += 1;
    }

    // Update ease factor (EF) - standard SM-2 formula
    easeFactor = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    return {
        repetition,
        interval,
        easeFactor: Number(easeFactor.toFixed(2)) // keep it clean for the DB float
    };
}

module.exports = { calculateSM2 };
