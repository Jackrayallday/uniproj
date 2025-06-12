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

    // For now, just log values — replace this later with fetch() to backend
    console.log("Login submitted:", { email, password });

    // TODO: Send credentials to backend via fetch()
  });
});
