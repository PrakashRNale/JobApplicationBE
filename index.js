const express = require("express");
const ejs = require('ejs');
const path = require('path');

const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const { applyJob } = require("./src/controller/jobApplication.js");

app.post("/api/apply", applyJob);

const port = 80;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port} and accessible via private IP.`);
});