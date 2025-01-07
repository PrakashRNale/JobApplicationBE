
const AWS = require('aws-sdk');
// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_RETION
});

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
        console.error('Error fetching file from S3:', error);
        throw error;
    }
}

// Function to upload a file to S3
async function uploadFileToS3(bucketName, key, filePath) {
    const fileContent = fs.readFileSync(filePath); // Read the file locally

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
    };

    try {
        const data = await s3.upload(params).promise();
        console.log('File uploaded to S3:', data.Location);
        return data.Location; // URL of the uploaded file
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
    }
}

module.exports = getS3File;