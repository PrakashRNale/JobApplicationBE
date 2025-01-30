const sendMail = require("../utils/mail");
const ejs = require('ejs');
const path = require('path');
const { getS3File, uploadFileToS3 } = require("../utils/s3");
const { getDelay } = require("../utils/helper");
const sequelize = require("../utils/db");
const Company = require("../models/company");
const multer = require("multer");
const User = require("../models/user");
const PROFILES = require("../Constants/Enum");

// Sync Sequelize models, ensuring tables are created, but without dropping existing data
sequelize.sync({ force: true })
  .then(() => {
    console.log('Database & tables synced!');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });

// Configure Multer
const upload = multer({ dest: "uploads/" });

const getUserProfiles = async (userId) => {
  try {
    let userInfo = await User.findOne({ where : { googleId : userId }});
    if (!userInfo) {
        throw new Error('User not found');
    }

    const userProfiles = {
        ...(userInfo.linkedinProfile ? { 'linkedinProfile': userInfo.linkedinProfile } : {}),
        ...(userInfo.githubProfile ? { 'githubProfile': userInfo.githubProfile } : {}),
        ...(userInfo.leetcodeProfile ? { 'leetcodeProfile': userInfo.leetcodeProfile } : {}),
    };

    let listContent = '';

    for(let key in userProfiles){
      listContent += `<li><a target="_blank" href=${userProfiles[key]}>${PROFILES[key]}</a>  </li>`;
    }

    const profiles = `<ul>${listContent}</ul>`;

    const technologies = userInfo.technologies || "";

    return { 
        userName: userInfo.name,
        profiles,
        technologies,
        yearsOfExperience : userInfo.expYears || 0
    };
  } catch (error) {
    console.log('Error while retriving user details ', error);
    throw error;
  }
 
}

const handleFileUpload = async (req) => {
    try {

      const file = req.file;
      if (!file) return null;
  
      const S3Key = req.user?.id || '';
      const fileContent = file.buffer;
      const mimeType = file.mimetype;
      await uploadFileToS3(process.env.AWS_BUCKET_NAME, S3Key, fileContent, mimeType);
      const [updatedRowCount] = await User.update(
          {isCVUploaded : true},
          { where : { googleId : S3Key}} // her S3Key is nothing but user id
      )
  
      if(updatedRowCount > 1){
          console.log('user updated successfully');
      }
      return fileContent;
      
    } catch (error) {
      console.log('Something went wrong while uploading files to S3 ', error);
      throw error;
    }

};

const scheduleEmailSending = async ({ companyName, hrEmail, hrName, emailSubject, html, dateTime, fileContent, delay, user }) => {

    try {
      
      // Ensure the necessary data is passed to the function
      if (!companyName || !hrEmail || !emailSubject || !html || !fileContent) {
          throw new Error('Missing required fields for email scheduling');
      }

      await Company.create({
        userId: user.id,
        name: companyName,
        hrname: hrName, // Using user.name for the HR name, check if it's correct
        hremail: hrEmail,
        maildroptime: dateTime,
        subject : emailSubject,
        isapplied: false,
      });

      const mailOptions = {
        userId: user.id,
        to: hrEmail,
        subject: emailSubject,
        html: html,
        attachments: [{ filename: `${user.name}_CV.pdf`, content: fileContent }],
      };

      setTimeout(async () => {
        await Company.update({ isapplied: true }, { where: { userId: user.id } });
        sendMail(mailOptions, user);
      }, delay);

    } catch (error) {
        console.log('Something went worng while sending mail ',error);
        throw error;
    }
};

exports.applyJob = async (req, res, next) => {
    try {
      const { companyName, hrEmail, role, hrName, dateTime } = req.body;
      let fileContent;

      const S3Key = req.user?.id || '';

      if(req.file){
        fileContent = req.file.buffer;
        handleFileUpload(req);
      }else{
        fileContent = await getS3File(process.env.AWS_BUCKET_NAME, S3Key) || "";
      }

      const emailSubject = "Applying for "+role;

      const userData = await getUserProfiles(req.user.id);
      const html = await ejs.renderFile(path.join(__dirname, '..', 'views', 'email-templates', 'job-application.ejs'), { hrName, role, companyName, ...userData });

      const delay = getDelay(dateTime);
      if (delay <= 0) {
        return res.status(400).json({ error: 'The target date and time have already passed!' });
      }
      const user = req.user;
      await scheduleEmailSending({ companyName, hrEmail, hrName, emailSubject, html, dateTime, fileContent, delay, user });

      res.json({ message: 'Email will be sent at the mentioned time' });
    } catch (error) {
      console.error('Error applying for job:', error);
      res.status(500).json({ error: 'Job application failed' });
    }
};

exports.allJobs = async(req, res, next) =>{
    try {
      const userId = req.user.id;
      const companies = await Company.findAll({ where: { userId }});
      res.status(200).json(companies); // Send users as a JSON response
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};
