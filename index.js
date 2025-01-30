const express = require("express");
const cors = require("cors");
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser"); 
const multer = require("multer");
require('dotenv').config();


//This code is added to atch unhandled promise rejections globally. SO THAT APP WILL NOT CRASH IN CASE OF ANY EXCEPTION OR ERROR
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit the process with a failure status to avoid running with an invalid state
});


//This code is added to catch unhandled promise rejections globally. SO THAT APP WILL NOT CRASH IN CASE OF ANY EXCEPTION OR ERROR
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit the process with a failure status to avoid running with an invalid state
});

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://ec2-35-154-131-168.ap-south-1.compute.amazonaws.com'], // Allow both dev and prod frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow these HTTP methods
  credentials: true, // Allow cookies to be sent
}));

// Add this additional middleware for OPTIONS preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin); // Dynamically set the origin
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Respond to preflight requests
  }
  next();
});

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

// Import database and user handling modules
const { authenticateUser } = require('./src/middlewares/authMiddleware.js'); 
const { storeUser, getUser, modifyUserDetails } = require("./src/controller/user.js");
const sequelize = require("./src/utils/db.js");
const { applyJob, allJobs } = require("./src/controller/jobApplication.js");
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport/index.js");
const upload = multer();


console.log("URL for redirectin is "+process.env.CALLBACK_URL)

// use this for local   'http://localhost:8000/auth/google/callback'     'http://ec2-3-111-32-46.ap-south-1.compute.amazonaws.com:5000/auth/google/callback'
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.LOCAL_CALLBACK_URL
);

const setCookies = (res, tokens) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure cookies in production
    sameSite: 'Lax',
    maxAge: tokens.expiry_date - Date.now(),
    path: '/',
  };
  res.cookie('userToken', tokens.id_token, cookieOptions);
  res.cookie('accessToken', tokens.access_token, cookieOptions);
  res.cookie('refreshToken', tokens.refresh_token, cookieOptions);
};

// Step 1: Generate Auth URL (Authorization Code Flow)
  app.get('/auth/google', (req, res) => {
    console.log('************************************ INSIDE AUTH GOOGLE *****************');
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid','email', 'profile', 'https://mail.google.com/'],
      // redirect_uri: ' http://ec2-35-154-131-168.ap-south-1.compute.amazonaws.com:5000/auth/google/callback',
                       
    });
    console.log('************************************ URL GENERATED IS*****************');
    console.log(url);
    res.redirect(url); // Redirect to Google OAuth
  });

 
  app.get('/auth/google/callback', async (req, res) => {
    try {
      const code = req.query.code;
      if (!code) throw new Error('Authorization code missing');
  
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
  
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
  
      const user = await storeUser(userInfo.data);
  
      // Set cookies with user data
      setCookies(res, tokens);
  
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    } catch (error) {
      console.error('Error during callback:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

// Step 3: Handle Implicit Flow (Frontend sends token)
app.post('/auth/google/token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID, // Make sure the token is for your app
    });

    // Extract payload
    const payload = ticket.getPayload();
    const userId = payload.sub; // `sub` is the unique user ID in Google

    // Include the `id` field in the payload for database operations
    const userPayload = {
      id: userId,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified_email: payload.email_verified,
    };

    // Call storeUser to save the user if not exists
    const user = await storeUser(userPayload);

    res.json({ message: 'User logged in successfully!', user: userPayload });
  } catch (error) {
    console.error('Error during token verification:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('userToken', { path: '/' });
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });

  res.json({ message: 'User logged out successfully' });
});

app.get('/user/info', authenticateUser, getUser);

app.post('/user/setUser', authenticateUser, modifyUserDetails)

app.post('/api/apply', upload.single("file"), authenticateUser, applyJob);

app.get('/api/getApplied', authenticateUser, allJobs);

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message); // Log the error message
  res.status(500).json({ error: 'Something went wrong. Please try again later. testing' });
});

// Database connection and server start
sequelize.authenticate().then(() => {
  console.log('Connected to the database.');
  app.listen(8000, () => console.log('Server running on port 8000'));
}).catch(err => {
  console.error('Database connection failed:', err);
});

