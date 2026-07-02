const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

if (!initialized) {
    try {
        const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        initialized = true;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK. Please ensure firebase-service-account.json is present in the server/ directory.', error);
    }
}

module.exports = admin;
