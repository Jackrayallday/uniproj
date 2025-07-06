const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const gradesPath = path.join(__dirname, 'data', 'grades.json');
const aclPath = path.join(__dirname, 'data', 'acl.json');

// Assign grade (instructors only)
router.post('/assign', (req, res) => {
  const email = req.session.email;
  const role = req.session.role;

  if (!email || role !== 'instructor') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { course, assignment, student, grade } = req.body;

  fs.readFile(aclPath, 'utf8', (err, aclData) => {
    if (err) return res.status(500).json({ success: false, message: 'Error reading ACL' });

    const acl = JSON.parse(aclData);
    const permissions = acl[email] && acl[email]['courses'];

    if (!permissions || !permissions.includes('write')) {
      return res.status(403).json({ success: false, message: 'Not authorized to write grades for courses' });
    }

    fs.readFile(gradesPath, 'utf8', (err, gradeData) => {
      let grades = [];
      if (!err && gradeData.trim()) {
        grades = JSON.parse(gradeData);
      }

      const existingIndex = grades.findIndex(g =>
        g.course === course &&
        g.assignment === assignment &&
        g.student === student
      );

      const newGradeEntry = {
        course,
        assignment,
        student,
        grade: parseFloat(grade)
      };

      if (existingIndex !== -1) {
        grades[existingIndex] = newGradeEntry;
      } else {
        grades.push(newGradeEntry);
      }

      fs.writeFile(gradesPath, JSON.stringify(grades, null, 2), err => {
        if (err) {
          console.error('Error saving grade:', err);
          return res.status(500).json({ success: false, message: 'Failed to save grade' });
        }

        res.json({ success: true });
      });
    });
  });
});

// View grades (students only)
router.get('/view', (req, res) => {
  const email = req.session.email;
  const role = req.session.role;

  if (!email || role !== 'student') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  fs.readFile(gradesPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading grades file:', err);
      return res.status(500).json({ success: false, message: 'Error reading grades' });
    }

    const allGrades = JSON.parse(data);
    const studentGrades = allGrades.filter(g => g.student === email);
    res.json({ success: true, grades: studentGrades });
  });
});

module.exports = router;
