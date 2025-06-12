// app.js
const express = require('express');
const app = express();
app.use(express.static('public'));
const PORT = 3000;

// Middleware: makes it possible to read form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route: basic homepage
app.get('/', (req, res) => {
  res.send('Welcome to UniProj! This is your course manager backend.');
});

// Route: login handler
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log("Received login:", email, password);

  res.json({ success: true, message: "Login route reached." });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
