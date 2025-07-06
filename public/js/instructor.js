document.addEventListener('DOMContentLoaded', () => {
  fetchCourses();
});

let selectedCourse = null;

function fetchCourses() {
  fetch('/courses')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const courseList = document.getElementById('courseList');
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
          li.textContent = a.assignment;
          li.onclick = () => {
            // Later: navigate to grade entry page
            window.location.href = `/grade-entry.html?course=${encodeURIComponent(courseName)}&assignment=${encodeURIComponent(a.assignment)}`;
          };
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
