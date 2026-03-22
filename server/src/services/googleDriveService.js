const { google } = require('googleapis');
const stream = require('stream');

/**
 * Validates if the required Google Drive environment variables are present.
 */
const isDriveConfigured = () => {
    return !!(
        process.env.GOOGLE_DRIVE_CLIENT_ID && 
        process.env.GOOGLE_DRIVE_CLIENT_SECRET && 
        process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
        process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
    );
};

/**
 * Initializes the Google Drive API client using OAuth2 credentials.
 */
const getDriveService = () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
};

/**
 * Uploads a file buffer directly to Google Drive.
 * 
 * @param {Buffer} fileBuffer - The memory buffer of the uploaded file
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File mime type (e.g. 'application/pdf')
 * @returns {Promise<{ url: string, driveFileId: string }>} Resolves with the viewable link and drive ID
 */
const uploadToDrive = async (fileBuffer, fileName, mimeType) => {
    if (!isDriveConfigured()) {
        throw new Error('Google Drive credentials are not configured in the server environment.');
    }

    const drive = getDriveService();

    // Convert the memory buffer into a readable stream for the Google Drive API
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID]
    };

    const media = {
        mimeType: mimeType,
        body: bufferStream,
    };

    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            // Fetch the webViewLink immediately upon creation
            fields: 'id, webViewLink',
        });

        if (!file.data || !file.data.id) {
            throw new Error('Upload to Google Drive failed: No file ID returned.');
        }

        return {
            url: file.data.webViewLink,
            driveFileId: file.data.id
        };
    } catch (err) {
        console.error('Google Drive Upload Error:', err);
        throw new Error('Failed to upload file to Google Drive: ' + err.message);
    }
};

/**
 * Deletes a file from Google Drive using its ID.
 * 
 * @param {string} fileId - The Google Drive file ID
 */
const deleteFromDrive = async (fileId) => {
    if (!isDriveConfigured()) return;

    try {
        const drive = getDriveService();
        await drive.files.delete({
            fileId: fileId
        });
        console.log(`Deleted file ${fileId} from Google Drive.`);
    } catch (err) {
        console.error('Google Drive Deletion Error:', err);
    }
};

module.exports = {
    isDriveConfigured,
    uploadToDrive,
    deleteFromDrive
};
