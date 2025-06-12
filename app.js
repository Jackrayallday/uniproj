// app.js
const express = require('express');
const app = express();
const PORT = 3000;

// Middleware: makes it possible to read form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route: basic homepage
app.get('/', (req, res) => {
  res.send('Welcome to UniProj! This is your course manager backend.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
