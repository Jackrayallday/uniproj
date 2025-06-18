//import statements
const express = require('express'); // Express framework for building web applications
const fs = require('fs'); // File system module for reading/writing files
const path = require('path'); // Handles file paths
const bcrypt = require('bcrypt'); // Password hashing
const session = require('express-session'); // Middleware for session
const rateLimit = require('express-rate-limit'); // Rate limiter for brute force protection

// Initialize express app
const app = express();
app.use(express.static('public'));
const PORT = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: 'uniproj-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 15 * 60 * 1000 // 15 minutes
    }
  })
);

//  Rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later."
  }
});

// Route: basic homepage
app.get('/', (req, res) => {
  res.send('Welcome to UniProj! This is your course manager backend.');
});

// Apply rate limiter to login only
app.post('/login', loginLimiter, (req, res) => {
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
      req.session.email = user.email;
      req.session.role = user.role;

      console.log(`Login successful. Role: ${user.role}`);
      return res.json({ success: true, role: user.role, message: "Login successful" });
    } else {
      console.log("Password incorrect");
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  });
});

// Route: check session status
app.get('/status', (req, res) => {
  if (req.session.email) {
    res.json({
      loggedIn: true,
      email: req.session.email,
      role: req.session.role,
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Route: logout handler
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: "Logged out" });
  });
});

// Middleware: require login
function requireLogin(req, res, next) {
  if (!req.session.email) {
    return res.status(401).json({ success: false, message: "You must be logged in" });
  }
  next();
}

// Middleware: require specific role
function requireRole(role) {
  return function (req, res, next) {
    if (req.session.role !== role) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
}

// Example protected routes by role
app.get('/admin-dashboard', requireLogin, requireRole('admin'), (req, res) => {
  res.send("Welcome to the Admin Dashboard!");
});

app.get('/instructor-dashboard', requireLogin, requireRole('instructor'), (req, res) => {
  res.send("Welcome to the Instructor Dashboard!");
});

app.get('/student-dashboard', requireLogin, requireRole('student'), (req, res) => {
  res.send("Welcome to the Student Dashboard!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
