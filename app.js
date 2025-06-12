// app.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
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

  let users;
  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (err) {
    console.error("Error reading users.json:", err);
    return res.status(500).json({ success: false, message: "Server error: users file" });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.log("User not found");
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (!user.passwordHash) { 
    console.error("User record missing hashedPassword");
    return res.status(500).json({ success: false, message: "Server error: bad user data" });
  }

  bcrypt.compare(password, user.passwordHash, (err, result) => { 
    if (err) {
      console.error("Bcrypt error:", err);
      return res.status(500).json({ success: false, message: "Internal error" });
    }

    if (result) {
      console.log(`Login successful. Role: ${user.role}`);
      return res.json({ success: true, role: user.role, message: "Login successful" });
    } else {
      console.log("Password incorrect");
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
