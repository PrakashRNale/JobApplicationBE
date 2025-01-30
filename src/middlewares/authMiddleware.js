const { OAuth2Client } = require('google-auth-library');
const { dummyCompaniesForUnauthorizedUser } = require('../utils/helper');
const oauth2Client = new OAuth2Client(process.env.CLIENT_ID); // Use your Google Client ID

const verifyTokenAndGetUser = async (token, req, res) => {
  try {
    // Token verification process
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    

    return payload; // If token is valid, return the payload
  } catch (error) {
    console.error('Token verification failed:', error);
    
    // If token verification fails and it's a path with a special condition
    if (req.path === "/api/getApplied") {
      const responseData = dummyCompaniesForUnauthorizedUser();
      return res.status(200).json(responseData); // Returning dummy data if path matches
    }

    // If it's a general error, throw it to be handled by the middleware
    throw new Error('Invalid Token');
  }
};

exports.authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req?.cookies?.userToken;  // Move this inside try block

    // Handle missing token with path-specific logic
    if (!authHeader) {
      if (req.path === "/api/getApplied") {
        console.log('Failed from line 40')
        const responseData = dummyCompaniesForUnauthorizedUser();
        return res.status(200).json(responseData);
      }

      return res.status(401).json({ error: 'Unauthorized: Token missing' });
    }

    // Proceed to token verification if header is available
    const payload = await verifyTokenAndGetUser(authHeader, req, res);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      accessToken: req.cookies.accessToken,
    };


    // We check if the user exists in your database
    // const user = await User.findOne({ where: { googleId: payload.sub } });
    // if (!user) {
    //   return res.status(401).json({ error: 'Unauthorized: User not found' });
    // }

    next(); // Proceed to next middleware
  } catch (error) {
    // General error handling (all errors, including token issues)
    console.error('Error during authentication:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
