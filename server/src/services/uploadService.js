const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

// Initialize the S3 Client for Cloudflare R2
const s3Client = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    region: 'auto', // R2 requires 'auto' as the region
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

/**
 * Upload a file to Cloudflare R2.
 * 
 * @param {Buffer} fileBuffer - The file data
 * @param {string} originalName - Original filename (for extension)
 * @param {string} mimetype - MIME type
 * @param {string} folder - R2 folder/prefix (e.g. 'flashcards', 'materials', 'questions')
 * @returns {{ url: string, key: string }} Public URL and R2 object key
 */
const uploadFile = async (fileBuffer, originalName, mimetype, folder = 'uploads') => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(originalName);
    const key = `${folder}/${uniqueSuffix}${ext}`;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
    });

    try {
        await s3Client.send(command);
        const url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
        return { url, key };
    } catch (error) {
        console.error("Error uploading to Cloudflare R2:", error);
        throw new Error('Failed to upload file to storage.');
    }
};

/**
 * Delete a file from Cloudflare R2.
 * 
 * @param {string} key - The R2 object key (e.g. 'materials/1234-abc.pdf')
 */
const deleteFile = async (key) => {
    if (!key) return;
    
    const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
    });

    try {
        await s3Client.send(command);
        console.log(`R2: Deleted ${key}`);
    } catch (error) {
        console.error(`R2: Failed to delete ${key}:`, error);
        // Don't throw — deletion failure shouldn't block the DB operation
    }
};

module.exports = {
    uploadFile,
    deleteFile
};
