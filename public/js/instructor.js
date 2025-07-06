document.addEventListener('DOMContentLoaded', () => {
  fetchCourses();
  document.getElementById('logoutBtn').addEventListener('click', () => {
    fetch('/logout', {
      method: 'POST',
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Logged out successfully!');
        window.location.href = '/';
      } else {
        alert('Logout failed: ' + data.message);
      }
    })
    .catch(err => {
      console.error('Logout error:', err);
    });
  });
});

let selectedCourse = null;

function fetchCourses() {
  fetch('/courses')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const courseList = document.getElementById('courseList');
        courseList.innerHTML = ''; // Clear previous list
        data.courses.forEach(course => {
          const li = document.createElement('li');
          li.textContent = course.course;
          li.onclick = () => selectCourse(course.course);
          courseList.appendChild(li);
        });
      }
    })
    .catch(err => console.error('Error fetching courses:', err));
}

function selectCourse(courseName) {
  selectedCourse = courseName;
  document.getElementById('selectedCourse').textContent = courseName;
  document.getElementById('assignmentsSection').style.display = 'block';
  fetch(`/assignments?course=${encodeURIComponent(courseName)}`)
    .then(res => res.json())
    .then(data => {
      const assignmentList = document.getElementById('assignmentList');
      assignmentList.innerHTML = '';
      if (data.success) {
        data.assignments.forEach(a => {
          const li = document.createElement('li');

          const link = document.createElement('span');
          link.textContent = a.assignment;
          link.style.cursor = 'pointer';
          link.style.textDecoration = 'underline';
          link.onclick = () => {
            window.location.href = `/grade-entry.html?course=${encodeURIComponent(courseName)}&assignment=${encodeURIComponent(a.assignment)}`;
          };

          const removeBtn = document.createElement('button');
          removeBtn.textContent = 'Remove';
          removeBtn.style.marginLeft = '10px';
          removeBtn.onclick = () => removeAssignment(courseName, a.assignment);

          li.appendChild(link);
          li.appendChild(removeBtn);
          assignmentList.appendChild(li);
        });
      }
    })
    .catch(err => console.error('Error fetching assignments:', err));
}

function createAssignment() {
  const name = document.getElementById('newAssignmentName').value.trim();
  if (!name) return alert("Assignment name is required.");

  fetch('/assignments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: selectedCourse, assignment: name })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('newAssignmentName').value = '';
        selectCourse(selectedCourse); // Refresh list
      } else {
        alert(data.message);
      }
    })
    .catch(err => console.error('Error creating assignment:', err));
}

function removeAssignment(course, assignment) {
  if (!confirm(`Are you sure you want to remove assignment: ${assignment}?`)) return;

  console.log('Removing assignment:', { course, assignment });
  fetch('/assignments/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: course.trim(), assignment: assignment.trim() })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        selectCourse(course); // Refresh list
      } else {
        alert(data.message);
      }
    })
    .catch(err => console.error('Error removing assignment:', err));
}
