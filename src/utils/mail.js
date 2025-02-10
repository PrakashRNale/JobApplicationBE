const nodemailer = require('nodemailer');
require('dotenv').config();

// Function to send an email
const sendMail = async (mailOptions, user) => {
    console.log('**************** Inside Send mail ****************');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: user.email, // User's Gmail address
            clientId: process.env.CLIENT_ID, // Your Google OAuth Client ID
            clientSecret: process.env.CLIENT_SECRET, // Your Google OAuth Client Secret
            accessToken: user.accessToken, // User's access token
        },
    });

    console.log('**************** User TOken is ****************');
    console.log(user.accessToken);
    console.log('**************** User email is ****************');
    console.log(user.email);

    // Prepare mail options with user's email as sender
    const mailConfig = {
        ...mailOptions,
        from: user.email,
    };



    try {
        const result = await transporter.sendMail(mailConfig);
        return result;
    } catch (error) {
        console.error('Error sending email:', error.message); // Log the error message only, not the sensitive details
        throw new Error('Unable to send email.'); // Throw generic error to avoid leaking sensitive info
    }
};

module.exports = sendMail;
