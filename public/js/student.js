document.addEventListener('DOMContentLoaded', () => {
  const gradesList = document.getElementById('grades-list');

  document.getElementById('logoutBtn').addEventListener('click', () => {
    fetch('/logout', {
      method: 'POST',
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Logged out successfully!');
        window.location.href = '/'; // Redirect to home or login page
      } else {
        alert('Logout failed: ' + data.message);
      }
    })
    .catch(err => {
      console.error('Logout error:', err);
    });
  });

  fetch('/grades/view')
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        gradesList.textContent = 'Failed to load grades.';
        return;
      }

      if (data.grades.length === 0) {
        gradesList.textContent = 'No grades available.';
        return;
      }

      // Group grades by course
      const grouped = {};
      data.grades.forEach(({ course, assignment, grade }) => {
        if (!grouped[course]) {
          grouped[course] = [];
        }
        grouped[course].push({ assignment, grade });
      });

      // Create structured list
      for (const [courseName, assignments] of Object.entries(grouped)) {
        const courseHeader = document.createElement('h3');
        courseHeader.textContent = `Course: ${courseName}`;
        gradesList.appendChild(courseHeader);

        const ul = document.createElement('ul');
        assignments.forEach(({ assignment, grade }) => {
          const li = document.createElement('li');
          li.textContent = `${assignment}: ${grade}`;
          ul.appendChild(li);
        });
        gradesList.appendChild(ul);
      }
    })
    .catch(err => {
      console.error('Error fetching grades:', err);
      gradesList.textContent = 'Error loading grades.';
    });
});
