const express = require("express");
const cors = require("cors");
const { google } = require('googleapis');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: 'GET, PUT, POST, DELETE',
  credentials: true,              // Allow cookies or credentials
}));

app.use(bodyParser.json());
app.use(express.json());

// Import database and user handling modules
const { storeUser } = require("./src/controller/user.js");
const sequelize = require("./src/utils/db.js");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'http://localhost:8000/auth/google/callback'
);

// Step 1: Generate Auth URL (Authorization Code Flow)
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile'],
  });
  res.redirect(url); // Redirect to Google OAuth
});

// Step 2: Handle OAuth Callback (Authorization Code Flow)
app.get('/auth/google/callback', async (req, res) => {
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

    // Store or update the user in the database
    const user = await storeUser(userInfo.data);

    // Send user info to the frontend
    res.json({ message: 'User logged in successfully!', user: userInfo.data });
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


// Database connection and server start
sequelize.authenticate().then(() => {
  console.log('Connected to the database.');
  app.listen(8000, () => console.log('Server running on port 8000'));
}).catch(err => {
  console.error('Database connection failed:', err);
});
