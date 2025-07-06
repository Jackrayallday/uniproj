document.addEventListener('DOMContentLoaded', () => {
  const courseParam = new URLSearchParams(window.location.search).get('course');
  const instructor = sessionStorage.getItem('email');
  const courseName = decodeURIComponent(courseParam);
  document.getElementById('course-name').textContent = courseName;

  fetch(`/assignments?course=${encodeURIComponent(courseName)}&instructor=${instructor}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('assignment-list');
      if (data.assignments.length === 0) {
        list.innerHTML = "<li>No assignments yet.</li>";
      } else {
        data.assignments.forEach(a => {
          const li = document.createElement('li');
          const link = document.createElement('a');
          link.href = `/grade-entry.html?course=${encodeURIComponent(courseName)}&assignment=${encodeURIComponent(a.title)}`;
          link.textContent = a.title;
          li.appendChild(link);
          list.appendChild(li);
        });
      }
    });

  document.getElementById('add-assignment-btn').addEventListener('click', () => {
    const title = document.getElementById('new-assignment').value.trim();
    if (!title) return;

    fetch('/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course: courseName, instructor, title })
    })
    .then(res => res.json())
    .then(result => {
      document.getElementById('status').textContent = result.message;
      location.reload(); // refresh to show the new assignment
    });
  });
});
