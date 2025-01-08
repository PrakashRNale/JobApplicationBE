const express = require("express");
const ejs = require('ejs');
const path = require('path');

const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const { applyJob, allJobs } = require("./src/controller/jobApplication.js");
const { dbConnect } = require("./src/utils/db.js");
const sequelize = require("./src/utils/db.js");

app.post("/api/apply", applyJob);
app.get('/api/getApplied', allJobs)

const port = 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Connected to the database successfully. We can run server');
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port} and accessible via private IP.`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

