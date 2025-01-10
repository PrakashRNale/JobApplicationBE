const sendMail = require("../utils/mail");
const ejs = require('ejs');
const path = require('path');
const getS3File = require("../utils/s3");
const { getDelay } = require("../utils/helper");
const sequelize = require("../utils/db");
const Company = require("../models/company");

sequelize.sync({ force: true }) // Set `force: true` to drop tables and recreate them
.then(() => {
  console.log('Database & tables created!');
})
.catch((error) => {
  console.error('Error syncing database:', error);
});

exports.applyJob = async(req, res, next) =>{
    // Path to the EJS template

    const templatePath = path.join(__dirname, '..', 'views', 'email-templates', `job-application.ejs`);
    const fileName = 'Prakash Nale_New.pdf'
    // console.log('Template Path is '+templatePath)
    const fileContent = await getS3File(process.env.AWS_BUCKET_NAME, fileName)

    const { companyName,  hrEmail, subject, hrName, targetDateTime  } = req.body;

    // Render the template with provided data
    console.log('************************ RECEIVED FILE *******************************')
    const html = await ejs.renderFile(templatePath, {name : hrName});
    
    const delay = getDelay(targetDateTime);

    if (delay > 0) {
        console.log(`Scheduling task to execute in ${delay} milliseconds (UTC time)`);

        Company.create({
            userId : req.user.id,
            name : companyName,
            hrname : hrName,
            hremail : hrEmail,
            maildroptime : targetDateTime,
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
            // sendMail(mailOptions);
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
    const companies = await Company.findAll(); // Fetch all users
    res.status(200).json(companies); // Send users as a JSON response
}

