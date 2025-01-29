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

sequelize.sync({ force: true }) // Set `force: true` to drop tables and recreate them
.then(() => {
  console.log('Database & tables created!');
})
.catch((error) => {
  console.error('Error syncing database:', error);
});

// Configure Multer
const upload = multer({ dest: "uploads/" });

const getUserProfiles = async (userId) =>{
    let userInfo = await User.findAll({ where : { googleId : userId}});
    userInfo = userInfo[0];
    const userProfiles = {
        ...(userInfo.linkedinProfile ? { 'linkedinProfile': userInfo.linkedinProfile } : {}),
        ...(userInfo.githubProfile ? { 'githubProfile': userInfo.githubProfile } : {}),
        ...(userInfo.leetcodeProfile ? { 'leetcodeProfile': userInfo.leetcodeProfile } : {}),
    };

    let divContent = '';

    for(let key in userProfiles){
        divContent += `<div><span>My ${PROFILES[key]} Profile is : </span> <a target="_blank" href=${userProfiles[key]}>${PROFILES[key]}</a>  </div>`
    }

    const profiles = `<div>${divContent}</div>`;

    const technologies = userInfo.technologies || "";

     
    const userDatqa ={ 
        userName : userInfo.name,
        profiles,
        technologies
    };

    return userDatqa;
}

exports.applyJob = async(req, res, next) =>{
    // Path to the EJS template
    const bucketName = process.env.AWS_BUCKET_NAME; 
    const file = req.file;
    const S3Key = req.user.id;
    const templatePath = path.join(__dirname, '..', 'views', 'email-templates', `job-application.ejs`);
    
    let fileContent;

    if(file){
        fileContent = file.buffer;
        const mimeType = file.mimetype;
        uploadFileToS3(bucketName, S3Key, fileContent, mimeType).then(async res =>{
            const [updatedRowCount] = await User.update(
                {isCVUploaded : true},
                { where : { googleId : mailOptions.userId,}}
            )

            if(updatedRowCount > 1){
                console.log('user updated successfully');
            }
        }).catch(err =>{

        })
    }else{
        fileContent = await getS3File(process.env.AWS_BUCKET_NAME, S3Key) || "";
    }

    const { companyName,  hrEmail, subject, hrName, dateTime  } = req.body;

    // Render the template with provided data
    console.log('************************ RECEIVED FILE *******************************')
    
    const userData = await getUserProfiles(req.user.id);
    const fileName = `${userData.userName}_CV.pdf`;

    const html = await ejs.renderFile(templatePath, {hrName : hrName, ...userData});
    
    const delay = getDelay(dateTime);

    if (delay > 0) {
        console.log(`Scheduling task to execute in ${delay} milliseconds (UTC time)`);

        Company.create({
            userId : req.user.id,
            name : companyName,
            hrname : hrName,
            hremail : hrEmail,
            maildroptime : dateTime,
            subject : subject,
            isapplied : false
          })

        const mailOptions = {
            userId : req.user.id,
            to: hrEmail,
            subject: subject,
            html: html,
            attachments: [
                {
                    filename: fileName,
                    content: fileContent, // File content from S3
                },
            ],
        };

        // Schedule the task
        setTimeout(async () => {
            console.log('Executing scheduled task at:', new Date().toISOString());
            const [updatedRowCount] = await Company.update(
                {isapplied : true},
                { where : { userId : mailOptions.userId,}}
            )
            if (updatedRowCount > 0) {
                console.log('Company updated successfully.');

                Company.findAll().then((users) => {
                    console.log('All users:', users);
                  });
              } else {
                console.log('No Company found with the given condition.');
              }
            sendMail(mailOptions, req.user);
        }, delay);

        res.json({
            message : 'Email will be sent at mentioned time'
        })

    } else {
        return res.status(400).json({
            error: 'The target date and time have already passed!',
        });
    }
}

exports.allJobs = async(req, res, next) =>{
    const userId = req.user.id;
    const companies = await Company.findAll({ where : { userId : userId}}); // Fetch all users
    res.status(200).json(companies); // Send users as a JSON response
}

