const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const User = sequelize.define('Company', {
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name : {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  }
});

module.exports = User;