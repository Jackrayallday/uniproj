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

      const ul = document.createElement('ul');
      data.grades.forEach(grade => {
        const li = document.createElement('li');
        li.textContent = `${grade.course} - ${grade.assignment}: ${grade.grade}`;
        ul.appendChild(li);
      });
      gradesList.appendChild(ul);
    })
    .catch(err => {
      console.error('Error fetching grades:', err);
      gradesList.textContent = 'Error loading grades.';
    });
});
