document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const course = urlParams.get('course');
  const assignment = urlParams.get('assignment');

  document.getElementById('course-info').textContent = `Course: ${course}`;
  document.getElementById('assignment-info').textContent = `Assignment: ${assignment}`;

  const studentSelect = document.getElementById('student-select');
  const gradeInput = document.getElementById('grade-input');
  const form = document.getElementById('grade-form');
  const status = document.getElementById('status');
  document.getElementById('backBtn').addEventListener('click', () => {
  window.history.back(); // Goes to the last page visited
});
  // Fetch students enrolled in this course
  fetch(`/courses`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        status.textContent = 'Failed to load students.';
        return;
      }

      const courseData = data.courses.find(c => c.course.toLowerCase() === course.toLowerCase());
      console.log("Looking for course:", course);
      console.log("Available courses:", data.courses.map(c => c.course));

      if (!courseData) {
        status.textContent = 'Course not found or access denied.';
        return;
      }

      courseData.students.forEach(student => {
        const option = document.createElement('option');
        option.value = student;
        option.textContent = student;
        studentSelect.appendChild(option);
      });

      if (courseData.students.length === 0) {
        status.textContent = 'No students enrolled in this course.';
      }
    })
    .catch(err => {
      console.error('Error loading students:', err);
      status.textContent = 'Error loading students.';
    });

  // Handle form submission
  form.addEventListener('submit', e => {
    e.preventDefault();
    const student = studentSelect.value;
    const gradeValue = parseFloat(gradeInput.value);

    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      status.textContent = 'Please enter a valid grade between 0 and 100.';
      return;
    }

    fetch('/grades/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course,
        assignment,
        student,
        grade: gradeValue
      })
    })
    .then(res => res.json())
    .then(result => {
      status.textContent = result.message || 'Grade submitted.';
    })
    .catch(err => {
      console.error('Error submitting grade:', err);
      status.textContent = 'Failed to submit grade.';
    });
  });
});
