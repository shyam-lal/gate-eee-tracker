const pool = require('../config/db');

/**
 * Reserve and deduct credits for flashcard generation.
 * This ensures the user has enough balance and logs the transaction atomically.
 *
 * @param {number} userId - The user's ID
 * @param {number} requestedCardCount - Number of flashcards requested
 * @returns {Promise<Object>} An object containing the transaction details and remaining balance
 * @throws {Error} INSUFFICIENT_CREDITS or INPUT_CONSTRAINT error
 */
async function reserveAndDeductCredits(userId, requestedCardCount) {
    // 2. INPUT CONSTRAINT
    if (typeof requestedCardCount !== 'number' || requestedCardCount < 1 || requestedCardCount > 20) {
        throw new Error('INPUT_CONSTRAINT: requestedCardCount must be between 1 and 20.');
    }

    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. CHECK BALANCE
        // We use FOR UPDATE to lock the row and prevent race conditions when checking/updating credits
        const userRes = await client.query(
            `SELECT credits FROM users WHERE id = $1 FOR UPDATE`,
            [userId]
        );

        if (userRes.rowCount === 0) {
            throw new Error('User not found');
        }

        const currentCredits = userRes.rows[0].credits;

        if (currentCredits < requestedCardCount) {
            throw new Error('INSUFFICIENT_CREDITS');
        }

        const newCredits = currentCredits - requestedCardCount;

        // 3. PROVISIONAL DEDUCTION
        await client.query(
            `UPDATE users SET credits = $1 WHERE id = $2`,
            [newCredits, userId]
        );

        const txRes = await client.query(
            `INSERT INTO credit_transactions (user_id, amount, transaction_type)
             VALUES ($1, $2, 'FLASHCARD_GENERATION')
             RETURNING *`,
            [userId, -requestedCardCount]
        );

        await client.query('COMMIT');

        return {
            transaction: txRes.rows[0],
            remainingCredits: newCredits
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Safely reverses a previous credit deduction and updates the audit log.
 * Useful if the downstream LLM API fails or crashes after credits were deducted.
 *
 * @param {number} userId - The user's ID
 * @param {number} refundedCardCount - Number of credits to refund
 * @returns {Promise<Object>} The refund transaction details
 */
async function rollbackCredits(userId, refundedCardCount) {
    if (typeof refundedCardCount !== 'number' || refundedCardCount < 1) {
        throw new Error('INPUT_CONSTRAINT: refundedCardCount must be a positive number.');
    }

    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        // Lock user row
        const userRes = await client.query(
            `SELECT credits FROM users WHERE id = $1 FOR UPDATE`,
            [userId]
        );

        if (userRes.rowCount === 0) {
            throw new Error('User not found');
        }

        const currentCredits = userRes.rows[0].credits;
        const newCredits = currentCredits + refundedCardCount;

        await client.query(
            `UPDATE users SET credits = $1 WHERE id = $2`,
            [newCredits, userId]
        );

        const txRes = await client.query(
            `INSERT INTO credit_transactions (user_id, amount, transaction_type)
             VALUES ($1, $2, 'REFUND')
             RETURNING *`,
            [userId, refundedCardCount]
        );

        await client.query('COMMIT');

        return {
            transaction: txRes.rows[0],
            remainingCredits: newCredits
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Add credits from a Razorpay/UPI purchase
 *
 * @param {number} userId - The user's ID
 * @param {number} purchasedCredits - Number of credits bought
 * @returns {Promise<Object>} The purchase transaction details
 */
async function addCreditsFromPurchase(userId, purchasedCredits) {
    if (typeof purchasedCredits !== 'number' || purchasedCredits < 1) {
        throw new Error('INPUT_CONSTRAINT: purchasedCredits must be a positive number.');
    }

    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        // Lock user row
        const userRes = await client.query(
            `SELECT credits FROM users WHERE id = $1 FOR UPDATE`,
            [userId]
        );

        if (userRes.rowCount === 0) {
            throw new Error('User not found');
        }

        const currentCredits = userRes.rows[0].credits || 0;
        const newCredits = currentCredits + purchasedCredits;

        await client.query(
            `UPDATE users SET credits = $1 WHERE id = $2`,
            [newCredits, userId]
        );

        const txRes = await client.query(
            `INSERT INTO credit_transactions (user_id, amount, transaction_type)
             VALUES ($1, $2, 'PURCHASE')
             RETURNING *`,
            [userId, purchasedCredits]
        );

        await client.query('COMMIT');

        return {
            transaction: txRes.rows[0],
            remainingCredits: newCredits
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    reserveAndDeductCredits,
    rollbackCredits,
    addCreditsFromPurchase
};
