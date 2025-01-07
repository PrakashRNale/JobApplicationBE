const sendMail = require("../utils/mail");
const ejs = require('ejs');
const path = require('path');
const getS3File = require("../utils/s3");
const { getDelay } = require("../utils/helper");

exports.applyJob = async(req, res, next) =>{
    // Path to the EJS template
    const templatePath = path.join(__dirname, '..', 'views', 'email-templates', `job-application.ejs`);
    const fileName = 'Prakash Nale_New.pdf'
    // console.log('Template Path is '+templatePath)
    const fileContent = await getS3File(process.env.AWS_BUCKET_NAME, fileName)

    // Render the template with provided data
    console.log('************************ RECEIVED FILE *******************************')
    const html = await ejs.renderFile(templatePath, {name : req.body.toName});
    // console.log('Mail Content is  '+html)

    const targetDateTime = req.body.dateTime;  // The target date and tim
   
    const delay = getDelay(targetDateTime);

    if (delay > 0) {
        console.log(`Scheduling task to execute in ${delay} milliseconds (UTC time)`);

        const mailOptions = {
            to: req.body.toEmail,
            subject: req.body.subject,
            html: html,
            attachments: [
                {
                    filename: fileName,
                    content: fileContent, // File content from S3
                },
            ],
        };

        // Schedule the task
        setTimeout(() => {
            console.log('Executing scheduled task at:', new Date().toISOString());
            sendMail(mailOptions);
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

