const express = require("express");
const cors = require("cors");
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser"); 
const multer = require("multer");
require('dotenv').config();

const app = express();

// app.use(cors({
//   origin: 'http://localhost:3000', // Frontend URL
//   methods: 'GET, PUT, POST, DELETE',
//   credentials: true,              // Allow cookies or credentials
// }));

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

 
// Step 2: Handle OAuth Callback (Authorization Code Flow)
app.get('/auth/google/callback', async (req, res) => {
  console.log('************************************ INSIDE AUTH GOOGLE CALLBACK *****************');
  const code = req.query.code; // Authorization code from Google
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided.' });
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code); // Exchange code for tokens
    oauth2Client.setCredentials(tokens);

    // Fetch user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const user = await storeUser(userInfo.data);
  const userToken = tokens.id_token;
    // Set tokens in secure, HTTP-only cookies

    res.cookie('userToken', userToken, {
      httpOnly: true,
      secure: false, // Use true in production for HTTPS
      sameSite: 'Lax', // Lax works for HTTP, 'None' for cross-origin requests
      maxAge: tokens.expiry_date - Date.now(),
      path: '/', // Ensure it can be accessed on all paths
    });

    res.cookie('accessToken', tokens.access_token, {
      httpOnly: true,
      secure: false, // Use true in production for HTTPS
      sameSite: 'Lax', // Lax works for HTTP, 'None' for cross-origin requests
      maxAge: tokens.expiry_date - Date.now(),
      path: '/', 
    });

    res.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      secure: false, // Use true in production for HTTPS
      sameSite: 'Lax', // Lax works for HTTP, 'None' for cross-origin requests
      maxAge: tokens.expiry_date - Date.now(),
      path: '/', 
    });
    console.log('+++++++++++++++COOKIES ARE CREATED+++++++++++++')

    // Send user info to the frontend
    // res.json({ message: 'User logged in successfully!', user: userInfo.data });
    // res.redirect(`http://localhost:3000/`);  // this is for local
    console.log("********* REDIRECTING BACK TO UI **************");
    // res.redirect(`http://ec2-35-154-131-168.ap-south-1.compute.amazonaws.com`);
    res.redirect(`http://localhost:3000/`);  // this is for local
  } catch (error) {
    console.error('Error during authorization code flow:', error);
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

// Database connection and server start
sequelize.authenticate().then(() => {
  console.log('Connected to the database.');
  app.listen(8000, () => console.log('Server running on port 8000'));
}).catch(err => {
  console.error('Database connection failed:', err);
});

