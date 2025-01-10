const nodemailer = require('nodemailer');
require('dotenv').config();

// const transporter = nodemailer.createTransport({
//     service: "Gmail", 
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.APP_PASSWORD,
//     } 
//   });

  
  const sendMail = (mailOptions, user) =>{

    // We need to create transporter based on logged in user.
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

    mailOptions = {
      ...mailOptions,
      from : user.email,
    }
    return transporter.sendMail(mailOptions).then(result =>{
        return result
    }).catch(error =>{
        console.log(error);
    })
  }

  module.exports = sendMail;