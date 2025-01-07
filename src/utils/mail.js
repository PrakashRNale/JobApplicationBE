const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    // host: 'smtp.gmail.com',
    // secure: false,//true
    // port: 587,
    service: "Gmail", 
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    } 
  });

  
  const sendMail = (mailOptions) =>{
    console.log('I am here');
    mailOptions = {
      ...mailOptions,
      from : process.env.EMAIL,
    }
    return transporter.sendMail(mailOptions).then(result =>{
        return result
    }).catch(error =>{
        console.log(error);
    })
  }

  module.exports = sendMail;