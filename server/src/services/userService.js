const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const createUser = async (username, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [username, email, hashedPassword]
    );
    return result.rows[0];
};

const findUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

const validatePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

module.exports = {
    createUser,
    findUserByEmail,
    validatePassword,
};
