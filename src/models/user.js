const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const User = sequelize.define('User', {
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name : {
    type: DataTypes.STRING,
    allowNull: false,
  },
  family_name : {
    type: DataTypes.STRING,
    allowNull: false,
  },
  given_name : {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  verified_email : {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  linkedinProfile : {
    type: DataTypes.STRING,
    allowNull: true,
  },
  leetcodeProfile : {
    type: DataTypes.STRING,
    allowNull: true,
  },
  githubProfile : {
    type: DataTypes.STRING,
    allowNull: true,
  },
  technologies : {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isCVUploaded : {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  }
});

module.exports = User;
