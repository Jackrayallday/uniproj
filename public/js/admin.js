document.addEventListener('DOMContentLoaded', () => {
  const courseListDiv = document.getElementById('course-list');
  const addCourseForm = document.getElementById('add-course-form');
  const enrollForm = document.getElementById('enroll-form');
  const addStatus = document.getElementById('add-course-status');
  const enrollStatus = document.getElementById('enroll-status');

  // Load and display courses
  function loadCourses() {
    fetch('/courses')
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          courseListDiv.textContent = "Failed to load courses.";
          return;
        }

        const courses = data.courses;
        if (courses.length === 0) {
          courseListDiv.textContent = "No courses available.";
          return;
        }

        const list = document.createElement('ul');
        courses.forEach(course => {
          const item = document.createElement('li');
          item.innerHTML = `<strong>${course.course}</strong><br/>
            Instructor: ${course.instructor}<br/>
            Students: ${
              course.students.length > 0
                ? `<ul>` + course.students.map(email => `
                    <li>
                      ${email}
                      <button onclick="removeStudent('${course.course}', '${email}')">Remove</button>
                    </li>
                  `).join('') + `</ul>`
                : 'None'
            }`;
          list.appendChild(item);
        });
        courseListDiv.innerHTML = '';
        courseListDiv.appendChild(list);
      })
      .catch(err => {
        console.error("Error fetching courses:", err);
        courseListDiv.textContent = "Error loading courses.";
      });
  }

  // Remove student from course (moved inside to access loadCourses)
  window.removeStudent = function(course, studentEmail) {
    if (!confirm(`Are you sure you want to remove ${studentEmail} from ${course}?`)) return;

    fetch('/courses/remove-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course, studentEmail })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          alert(data.message || "Failed to remove student.");
          return;
        }
        alert(data.message);
        loadCourses();
      })
      .catch(err => {
        console.error("Error removing student:", err);
        alert("Error removing student.");
      });
  };

  // Handle add course form
  addCourseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const course = document.getElementById('course-name').value.trim();
    const instructor = document.getElementById('instructor-email').value.trim();

    if (!course || !instructor) {
      addStatus.textContent = "Both fields are required.";
      return;
    }

    fetch('/courses/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course, instructor })
    })
      .then(res => res.json())
      .then(data => {
        addStatus.textContent = data.message || "Unexpected response.";
        if (data.success) {
          loadCourses();
          addCourseForm.reset();
        }
      })
      .catch(err => {
        console.error("Error adding course:", err);
        addStatus.textContent = "Error adding course.";
      });
  });

  // Handle enroll form
  enrollForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const course = document.getElementById('enroll-course-name').value.trim();
    const studentEmail = document.getElementById('student-email').value.trim();

    if (!course || !studentEmail) {
      enrollStatus.textContent = "Both fields are required.";
      return;
    }

    fetch('/courses/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course, studentEmail })
    })
      .then(res => res.json())
      .then(data => {
        enrollStatus.textContent = data.message || "Unexpected response.";
        if (data.success) {
          loadCourses();
          enrollForm.reset();
        }
      })
      .catch(err => {
        console.error("Error enrolling student:", err);
        enrollStatus.textContent = "Error enrolling student.";
      });
  });

  // Initial load
  loadCourses();
});
