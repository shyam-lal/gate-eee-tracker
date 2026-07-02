const admin = require('../src/config/firebase');
const pool = require('../src/config/db');

async function migrateUsers() {
    try {
        console.log('Fetching users from PostgreSQL database...');
        const result = await pool.query('SELECT id, email, username, password_hash FROM users');
        const users = result.rows;

        console.log(`Found ${users.length} users to migrate.`);

        const firebaseUsers = users.map(user => {
            // Check if password hash exists and is valid bcrypt format
            let passwordHash = undefined;
            if (user.password_hash && user.password_hash.startsWith('$2')) {
                passwordHash = Buffer.from(user.password_hash);
            }
            
            return {
                uid: user.id.toString(),
                email: user.email,
                displayName: user.username,
                passwordHash: passwordHash
            };
        });

        // Filter out users without valid bcrypt hashes (e.g. if any FIREBASE_MANAGED)
        const validUsers = firebaseUsers.filter(u => u.passwordHash);

        console.log(`Found ${validUsers.length} users with bcrypt password hashes. Importing to Firebase...`);

        if (validUsers.length > 0) {
            const importResult = await admin.auth().importUsers(validUsers, {
                hash: {
                    algorithm: 'BCRYPT'
                }
            });

            console.log(`Successfully imported ${importResult.successCount} users.`);
            console.log(`Failed to import ${importResult.failureCount} users.`);

            if (importResult.failureCount > 0) {
                importResult.errors.forEach((err) => {
                    console.log(err.error.message);
                });
            }
        } else {
             console.log("No valid users to migrate.");
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error migrating users:', error);
        process.exit(1);
    }
}

migrateUsers();
