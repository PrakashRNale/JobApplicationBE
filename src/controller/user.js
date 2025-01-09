
const User = require('../models/user'); // Import the User model

exports.storeUser = async (googleProfile) => {
    try {
        // Extract relevant information from Google profile
        const { id, name, email, picture } = googleProfile;

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
            picture: picture,
        });
        console.log('New user created:', user);
    
        return user;
    } catch (error) {
        console.error('Error storing user in database:', error);
        throw error;
    }
}
