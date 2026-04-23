/**
 * Purpose: Handles the separate faculty login page and faculty dashboard
 * project review actions using plain JavaScript and JWT authentication.
 */

(function initializeFacultySystem() {
  const TOKEN_KEY = 'token';

  const loginForm = document.getElementById('faculty-login-form');
  const loginMessage = document.getElementById('faculty-login-message');
  const projectsTable = document.getElementById('faculty-projects-table');
  const dashboardMessage = document.getElementById('faculty-dashboard-message');
  const logoutButton = document.getElementById('faculty-logout-button');

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const decodeToken = (token) => {
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  };

  const showMessage = (element, message, type = '') => {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = `message ${type}`.trim();
  };

  const redirectToFacultyLogin = () => {
    window.location.href = '/faculty';
  };

  const getStatusClass = (status) => {
    if (status === 'approved') {
      return 'faculty-status-approved';
    }

    if (status === 'rejected') {
      return 'faculty-status-rejected';
    }

    return 'faculty-status-pending';
  };

  const facultyFetch = async (endpoint, method = 'GET', body = null) => {
    const token = getToken();
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, options);
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      redirectToFacultyLogin();
      throw new Error(result.message || 'Access denied');
    }

    if (!response.ok) {
      throw new Error(result.message || 'Request failed');
    }

    return result;
  };

  const renderProjects = (projects) => {
    if (!projectsTable) {
      return;
    }

    if (!projects.length) {
      projectsTable.innerHTML =
        '<tr><td colspan="8" class="empty-state">No student projects found.</td></tr>';
      return;
    }

    projectsTable.innerHTML = projects
      .map(
        (project) => `
          <tr>
            <td>${project.studentId ? project.studentId.name : 'Unknown Student'}</td>
            <td>${project.studentId ? project.studentId.email : 'N/A'}</td>
            <td>${project.title}</td>
            <td>${project.description || 'No description provided'}</td>
            <td>
              ${
                project.githubUrl
                  ? `<a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer">Open Link</a>`
                  : 'No GitHub link'
              }
            </td>
            <td>
              ${
                project.certificationFile
                  ? `<a href="/${project.certificationFile}" target="_blank" rel="noopener noreferrer">View File</a>`
                  : 'No file uploaded'
              }
            </td>
            <td>
              <span class="faculty-status-badge ${getStatusClass(project.status)}">${project.status}</span>
            </td>
            <td>
              <div class="action-group">
                <button type="button" class="primary-button" data-approve-id="${project._id}">Approve</button>
                <button type="button" class="icon-button danger" data-reject-id="${project._id}">Reject</button>
              </div>
            </td>
          </tr>
        `
      )
      .join('');

    projectsTable.querySelectorAll('[data-approve-id]').forEach((button) => {
      button.addEventListener('click', () => approveProject(button.dataset.approveId));
    });

    projectsTable.querySelectorAll('[data-reject-id]').forEach((button) => {
      button.addEventListener('click', () => rejectProject(button.dataset.rejectId));
    });
  };

  const loadProjects = async () => {
    try {
      const result = await facultyFetch('/api/faculty/projects');
      renderProjects(result.data);
      showMessage(dashboardMessage, '');
    } catch (error) {
      showMessage(dashboardMessage, error.message, 'error');
    }
  };

  const approveProject = async (id) => {
    try {
      await facultyFetch(`/api/faculty/projects/${id}`, 'PUT', { status: 'approved' });
      showMessage(dashboardMessage, 'Project approved successfully.', 'success');
      await loadProjects();
    } catch (error) {
      showMessage(dashboardMessage, error.message, 'error');
    }
  };

  const rejectProject = async (id) => {
    const feedback = window.prompt('Enter rejection reason:');

    if (!feedback || !feedback.trim()) {
      return;
    }

    try {
      await facultyFetch(`/api/faculty/projects/${id}`, 'PUT', {
        status: 'rejected',
        feedback: feedback.trim()
      });
      showMessage(dashboardMessage, 'Project rejected successfully.', 'success');
      await loadProjects();
    } catch (error) {
      showMessage(dashboardMessage, error.message, 'error');
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(loginForm);
      const payload = {
        email: formData.get('email'),
        password: formData.get('password')
      };

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
          showMessage(loginMessage, result.message || 'Login failed', 'error');
          return;
        }

        const token = result.data.token;
        const decoded = decodeToken(token);

        if (!decoded || decoded.role !== 'faculty') {
          showMessage(loginMessage, 'Not a faculty account', 'error');
          return;
        }

        localStorage.setItem(TOKEN_KEY, token);
        window.location.href = '/faculty-dashboard.html';
      } catch (error) {
        showMessage(loginMessage, error.message, 'error');
      }
    });

    return;
  }

  if (projectsTable) {
    const token = getToken();

    if (!token) {
      redirectToFacultyLogin();
      return;
    }

    const decoded = decodeToken(token);

    if (!decoded || decoded.role !== 'faculty') {
      redirectToFacultyLogin();
      return;
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.clear();
        redirectToFacultyLogin();
      });
    }

    loadProjects();
  }
})();
