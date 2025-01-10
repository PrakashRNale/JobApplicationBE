
const User = require('../models/user'); // Import the User model

exports.storeUser = async (googleProfile) => {
    try {
        // Extract relevant information from Google profile
        const { id, name, email, picture, family_name, given_name, verified_email } = googleProfile;

        // Check if user exists
        console.log(googleProfile);
        let user = await User.findOne({ where: { googleId: id } });

        if(user){
            console.log('user already exists '+user);
            return user;
        }
        // Create user if not found
        user = await User.create({
            googleId: id,
            name: name,
            email: email,
            family_name : family_name,
            given_name : given_name,
            verified_email : verified_email,
            picture: picture,
        });
        console.log('New user created:', user);
    
        return user;
    } catch (error) {
        console.error('Error storing user in database:', error);
        throw error;
    }
}

exports.getUser = async (req, res, next) =>{
    try {
        const userId = req.user.id;
        const userInfo = await User.findAll({ where : { googleId : userId}}); // Fetch all users
        res.json(userInfo[0]);
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).send('Failed to fetch user info.');
    }
}
