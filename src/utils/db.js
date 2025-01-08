const mysql = require('mysql2'); // Use 'pg' for PostgreSQL
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');

dotenv.config();

exports.dbConnect = () =>{
    const db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PWD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
      });
    return db;
}


const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PWD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        port: process.env.DB_PORT,
        logging: console.log, // Set to false to disable logging
    }
);

module.exports = sequelize;