const { OAuth2Client } = require('google-auth-library');
const { dummyCompaniesForUnauthorizedUser } = require('../utils/helper');
const oauth2Client = new OAuth2Client(process.env.CLIENT_ID); // Use your Google Client ID

exports.authenticateUser = async (req, res, next) => {
  const authHeader = req?.cookies?.userToken;

  if (!authHeader) {

    if (req.path === "/api/getApplied") {
      const responseData = dummyCompaniesForUnauthorizedUser();
      return res.status(200).json(responseData);
    }

    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  const token = authHeader; // Extract token from the header

  try {
    // Verify the token with Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID, // Ensure this matches your Google Client ID
    });


    if (!ticket) {

      if (req.path === "/api/getApplied") {
        const responseData = dummyCompaniesForUnauthorizedUser();
        return res.status(200).json(responseData);
      }

      return res.status(401).json({ error: "Unauthorized: Invalid ticket" });
    }

    const payload = ticket.getPayload(); // Extract user info
    req.user = {
      id: payload.sub,       // Google user ID
      email: payload.email,  // User's email
      name: payload.name,    // User's name,
      accessToken :  req?.cookies?.accessToken
    };

    // Optionally, check if the user exists in your database
    // const user = await User.findOne({ where: { googleId: payload.sub } });
    // if (!user) {
    //   return res.status(401).json({ error: 'Unauthorized: User not found' });
    // }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error during token verification:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
