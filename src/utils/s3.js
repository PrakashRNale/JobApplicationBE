const AWS = require('aws-sdk');

// AWS S3 configuration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION, // Fixed typo in the original code (AWS_RETION -> AWS_REGION)
});

const s3 = new AWS.S3();

// Function to fetch a file from S3
const getS3File = async (bucketName, key) => {
    const params = {
        Bucket: bucketName,
        Key: key,
    };

    try {
        const data = await s3.getObject(params).promise();
        return data.Body; // File content (Buffer)
    } catch (error) {
        console.error('Error fetching file from S3:', error.message); // Log error message, not sensitive data
        throw new Error('Unable to fetch file from S3.'); // Throw generic error to avoid leaking details
    }
};

// Function to upload a file to S3
const uploadFileToS3 = async (bucketName, key, fileBuffer, mimeType) => {
    const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer, // Pass the buffer directly
        ContentType: mimeType, // Optional: Set MIME type
    };

    try {
        const data = await s3.upload(params).promise();
        console.log('File uploaded to S3:', data.Location);
        return data.Location; // URL of the uploaded file
    } catch (error) {
        console.error('Error uploading file to S3:', error.message); // Log error message, not sensitive data
        throw new Error('Unable to upload file to S3.'); // Throw generic error to avoid leaking details
    }
};

module.exports = { 
    getS3File,
    uploadFileToS3
};
