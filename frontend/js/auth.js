/**
 * Purpose: Handles login/register tab switching and authentication form
 * submissions for the landing page.
 */

(function initializeAuthPage() {
  const {
    fetchAPI,
    getStoredUser,
    getToken,
    setSession,
    redirectByRole
  } = window.AppAPI;

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabButtons = document.querySelectorAll('.tab-button');
  const messageBox = document.getElementById('auth-message');

  const showMessage = (message, type = '') => {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`.trim();
  };

  const setActiveTab = (tab) => {
    tabButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });

    loginForm.classList.toggle('hidden', tab !== 'login');
    registerForm.classList.toggle('hidden', tab !== 'register');
    showMessage('');
  };

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTab(button.dataset.tab));
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetchAPI('/api/auth/login', 'POST', payload);
      setSession(response.data.token, response.data.user);
      showMessage('Login successful. Redirecting...', 'success');
      redirectByRole(response.data.token);
    } catch (error) {
      showMessage(error.message, 'error');
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetchAPI('/api/auth/register', 'POST', payload);
      setSession(response.data.token, response.data.user);
      showMessage('Registration successful. Redirecting...', 'success');
      redirectByRole(response.data.token);
    } catch (error) {
      showMessage(error.message, 'error');
    }
  });

  if (getStoredUser() && getToken()) {
    redirectByRole(getToken());
  }
})();
