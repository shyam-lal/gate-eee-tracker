const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

const uploadFile = async (fileBuffer, originalName, mimetype) => {
    // Generate a unique filename to prevent overwrites
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(originalName);
    const key = `flashcards/${uniqueSuffix}${ext}`; // Store in 'flashcards' folder

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
    });

    try {
        await s3Client.send(command);

        // Construct the public URL for Cloudflare R2
        // R2 requires a public custom domain or r2.dev subdomain enabled
        // Example R2_PUBLIC_DOMAIN: "https://pub-xxxxxxxxxxxxxx.r2.dev" or "https://cdn.yourdomain.com"
        // Ensure NO trailing slash in the env variable.

        const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

        return publicUrl;
    } catch (error) {
        console.error("Error uploading to Cloudflare R2:", error);
        throw new Error('Failed to upload file to storage.');
    }
};

module.exports = {
    uploadFile
};
