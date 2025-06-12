document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorDisplay = document.getElementById('login-error');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Stop form from reloading page

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      errorDisplay.textContent = "Both fields are required.";
      return;
    }

fetch('http://localhost:3000/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log("Login successful. Message:", data.message);
  } else {
    errorDisplay.textContent = data.message || "Login failed.";
  }
})
.catch(err => {
  console.error("Fetch error:", err);
  errorDisplay.textContent = "Server error.";
});

  });
});
