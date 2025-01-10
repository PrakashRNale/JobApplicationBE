const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId : {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name : {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hrname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hremail: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  subject : {
    type: DataTypes.STRING,
    allowNull: false,
  },
  maildroptime : {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isapplied : {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }

});

module.exports = Company;