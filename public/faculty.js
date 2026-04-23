/**
 * Purpose: Loads faculty-visible project submissions and provides approve and
 * reject actions with optional rejection feedback.
 */

(function facultyDashboard() {
  const tokenKey = 'student_portfolio_token';
  const loginPath = '/';
  const tableBody = document.getElementById('faculty-projects-body');
  const messageBox = document.getElementById('faculty-message');
  const logoutButton = document.getElementById('logout-button');

  const getToken = () => localStorage.getItem(tokenKey);

  const redirectToLogin = () => {
    window.location.href = loginPath;
  };

  const showMessage = (message, type) => {
    if (!messageBox) {
      return;
    }

    messageBox.textContent = message;
    messageBox.className = `message ${type || ''}`.trim();
  };

  const fetchFacultyAPI = async (endpoint, options = {}) => {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers || {})
      }
    });

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
      return null;
    }

    if (!response.ok) {
      throw new Error(result.message || 'Request failed');
    }

    return result;
  };

  const getStatusClass = (status) => {
    if (status === 'approved') {
      return 'status-approved';
    }

    if (status === 'rejected') {
      return 'status-rejected';
    }

    return 'status-pending';
  };

  const renderProjects = (projects) => {
    if (!tableBody) {
      return;
    }

    if (!projects.length) {
      tableBody.innerHTML =
        '<tr><td colspan="5" class="empty-state">No project submissions found.</td></tr>';
      return;
    }

    tableBody.innerHTML = projects
      .map(
        (project) => `
          <tr>
            <td>${project.studentId?.name || 'Unknown Student'}</td>
            <td>${project.studentId?.email || 'N/A'}</td>
            <td>${project.title}</td>
            <td>
              <span class="status-badge ${getStatusClass(project.status)}">${project.status}</span>
            </td>
            <td>
              <div class="action-group">
                <button class="primary-button" type="button" onclick="approveProject('${project._id}')">Approve</button>
                <button class="icon-button danger" type="button" onclick="rejectProject('${project._id}')">Reject</button>
              </div>
            </td>
          </tr>
        `
      )
      .join('');
  };

  const loadProjects = async () => {
    try {
      const token = getToken();

      if (!token) {
        redirectToLogin();
        return;
      }

      const result = await fetchFacultyAPI('/api/faculty/projects');

      if (!result) {
        return;
      }

      renderProjects(result.data);
      showMessage('');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  window.approveProject = async (id) => {
    try {
      const result = await fetchFacultyAPI(`/api/faculty/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' })
      });

      if (!result) {
        return;
      }

      showMessage('Project approved successfully.', 'success');
      await loadProjects();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  window.rejectProject = async (id) => {
    const feedback = window.prompt('Enter rejection feedback:') || '';

    try {
      const result = await fetchFacultyAPI(`/api/faculty/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected', feedback })
      });

      if (!result) {
        return;
      }

      showMessage('Project rejected successfully.', 'success');
      await loadProjects();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem(tokenKey);
      redirectToLogin();
    });
  }

  loadProjects();
})();
