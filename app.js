// import statements
const express = require('express'); // Express framework for building web applications
const fs = require('fs'); // File system module for reading/writing files
const path = require('path'); // Handles file paths
const bcrypt = require('bcrypt'); // Password hashing
const session = require('express-session'); // Middleware for session
const rateLimit = require('express-rate-limit'); // Rate limiter for brute force protection
const https = require('https'); // HTTPS server for development with self-signed certificate

// Load HTTPS certificate and key
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
};

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
      secure: true,
      httpOnly: true,
      maxAge: 15 * 60 * 1000 // 15 minutes
    }
  })
);

// Rate limiter
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
  // Regenerate session to prevent session fixation
  req.session.regenerate(err => {
    if (err) {
      console.error("Session regeneration failed:", err);
      return res.status(500).json({ success: false, message: "Login failed: session error" });
    }

    req.session.email = user.email;
    req.session.role = user.role;

    console.log(`Login successful. Role: ${user.role}`);
    return res.json({ success: true, role: user.role, message: "Login successful" });
  });
    }else {
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

// Middleware: require permission from ACL
function requirePermission(resource, action) {
  return function (req, res, next) {
    const userEmail = req.session.email;
    const aclPath = path.join(__dirname, 'data', 'acl.json');

    try {
      const acl = JSON.parse(fs.readFileSync(aclPath, 'utf8'));

      if (
        acl[userEmail] &&
        acl[userEmail][resource] &&
        acl[userEmail][resource].includes(action)
      ) {
        return next(); // Permission granted
      } else {
        return res.status(403).json({ success: false, message: "Access denied: insufficient ACL permission." });
      }
    } catch (err) {
      console.error("Error reading ACL:", err);
      return res.status(500).json({ success: false, message: "Server error: ACL check failed." });
    }
  };
}

// Example protected routes by role
app.get('/instructor-dashboard', requireLogin, requireRole('instructor'), (req, res) => {
  res.send("Welcome to the Instructor Dashboard!");
});

app.get('/student-dashboard', requireLogin, requireRole('student'), (req, res) => {
  res.send("Welcome to the Student Dashboard!");
});

// Route: securely serve dashboard HTML files from protected_pages
app.get('/student.html', requireLogin, requireRole('student'), (req, res) => {
  res.sendFile(path.join(__dirname, 'protected_pages', 'student.html'));
});

app.get('/instructor.html', requireLogin, requireRole('instructor'), (req, res) => {
  res.sendFile(path.join(__dirname, 'protected_pages', 'instructor.html'));
});

app.get('/admin.html', requireLogin, requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'protected_pages', 'admin.html'));
});

// Route: User Registration
app.post('/register', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const allowedRoles = ['student', 'instructor', 'admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role." });
  }

  const usersPath = path.join(__dirname, 'data', 'users.json');
  const aclPath = path.join(__dirname, 'data', 'acl.json');
  let users = [];

  try {
    users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (err) {
    console.error("Error reading users.json:", err);
    return res.status(500).json({ success: false, message: "Error reading user data." });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ success: false, message: "Email is already registered." });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error("Bcrypt error:", err);
      return res.status(500).json({ success: false, message: "Error processing password." });
    }

    const newUser = {
      email,
      passwordHash: hash,
      role
    };

    users.push(newUser);

    try {
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

      // ACL entry logic
      const acl = JSON.parse(fs.readFileSync(aclPath, 'utf8'));
      const defaultPermission = role === 'admin' || role === 'instructor'
        ? ['read', 'write']
        : ['read'];
      acl[email] = { courses: defaultPermission };
      fs.writeFileSync(aclPath, JSON.stringify(acl, null, 2));

      console.log("User registered:", email, role);
      return res.json({ success: true, message: "User registered successfully." });
    } catch (writeErr) {
      console.error("Error writing files:", writeErr);
      return res.status(500).json({ success: false, message: "Could not save user." });
    }
  });
});

// Admin: Course management
const coursesPath = path.join(__dirname, 'data', 'courses.json');

app.get('/courses', requireLogin, requirePermission('courses', 'read'), (req, res) => {
  const userRole = req.session.role;
  const userEmail = req.session.email;

  try {
    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

    let filteredCourses;

    if (userRole === 'admin') {
      filteredCourses = courses;
    } else if (userRole === 'instructor') {
      filteredCourses = courses.filter(c => c.instructor === userEmail);
    } else if (userRole === 'student') {
      filteredCourses = courses.filter(c => c.students.includes(userEmail));
    } else {
      return res.status(403).json({ success: false, message: "Invalid role." });
    }

    res.json({ success: true, courses: filteredCourses });

  } catch (err) {
    console.error("Error reading courses.json:", err);
    res.status(500).json({ success: false, message: "Failed to load courses." });
  }
});

app.post('/courses/add', requireLogin, requireRole('admin'), (req, res) => {
  const { course, instructor } = req.body;

  if (!course || !instructor) {
    return res.status(400).json({ success: false, message: "Course and instructor are required." });
  }

  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const instructorUser = users.find(u => u.email === instructor);

    if (!instructorUser) {
      return res.status(404).json({ success: false, message: "Instructor not found in user records." });
    }

    if (instructorUser.role !== 'instructor') {
      return res.status(400).json({ success: false, message: "User is not an instructor." });
    }

    let courses = [];
    if (fs.existsSync(coursesPath)) {
      courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    }

    if (courses.find(c => c.course === course)) {
      return res.status(409).json({ success: false, message: "Course already exists." });
    }

    courses.push({ course, instructor, students: [] });
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    res.json({ success: true, message: "Course added." });
  } catch (err) {
    console.error("Error writing to courses.json:", err);
    res.status(500).json({ success: false, message: "Failed to save course." });
  }
});

app.post('/courses/enroll', requireLogin, requireRole('admin'), (req, res) => {
  const { course, studentEmail } = req.body;

  if (!course || !studentEmail) {
    return res.status(400).json({ success: false, message: "Course and student email required." });
  }

  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const studentUser = users.find(u => u.email === studentEmail);

    if (!studentUser) {
      return res.status(404).json({ success: false, message: "Student not found in user records." });
    }

    if (studentUser.role !== 'student') {
      return res.status(400).json({ success: false, message: "User is not a student." });
    }

    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    const target = courses.find(c => c.course === course);

    if (!target) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    if (!target.students.includes(studentEmail)) {
      target.students.push(studentEmail);
    }

    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    res.json({ success: true, message: "Student enrolled." });
  } catch (err) {
    console.error("Enrollment error:", err);
    res.status(500).json({ success: false, message: "Failed to enroll student." });
  }
});

app.post('/courses/remove-student', requireLogin, requireRole('admin'), (req, res) => {
  const { course, studentEmail } = req.body;

  if (!course || !studentEmail) {
    return res.status(400).json({ success: false, message: "Course and student email are required." });
  }

  try {
    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    const target = courses.find(c => c.course === course);

    if (!target) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const originalLength = target.students.length;
    target.students = target.students.filter(email => email !== studentEmail);

    if (target.students.length === originalLength) {
      return res.status(404).json({ success: false, message: "Student not found in course." });
    }

    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    res.json({ success: true, message: "Student removed from course." });
  } catch (err) {
    console.error("Error removing student:", err);
    res.status(500).json({ success: false, message: "Failed to update course." });
  }
});

app.post('/acl/update', requireLogin, requireRole('admin'), (req, res) => {
  const { email, resource, action, operation } = req.body;

  if (!email || !resource || !action || !['add', 'remove'].includes(operation)) {
    return res.status(400).json({ success: false, message: "Missing or invalid fields." });
  }

  const aclPath = path.join(__dirname, 'data', 'acl.json');
  let acl;

  try {
    acl = JSON.parse(fs.readFileSync(aclPath, 'utf8'));
  } catch (err) {
    console.error("Error reading ACL:", err);
    return res.status(500).json({ success: false, message: "Server error: could not read ACL." });
  }

  // Initialize if missing
  if (!acl[email]) {
    acl[email] = {};
  }
  if (!acl[email][resource]) {
    acl[email][resource] = [];
  }

  if (operation === 'add') {
    if (!acl[email][resource].includes(action)) {
      acl[email][resource].push(action);
    }
  } else if (operation === 'remove') {
    acl[email][resource] = acl[email][resource].filter(a => a !== action);
    // Clean up empty resource arrays
    if (acl[email][resource].length === 0) {
      delete acl[email][resource];
    }
  }

  try {
    fs.writeFileSync(aclPath, JSON.stringify(acl, null, 2));
    return res.json({ success: true, message: `ACL ${operation} operation successful.` });
  } catch (writeErr) {
    console.error("Error writing ACL:", writeErr);
    return res.status(500).json({ success: false, message: "Could not update ACL." });
  }
});


// Start HTTPS server
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});
