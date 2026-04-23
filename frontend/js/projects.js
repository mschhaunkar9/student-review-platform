/**
 * Purpose: Handles project creation, editing, listing, and deletion across the
 * project-related frontend pages.
 */

(function initializeProjects() {
  const {
    attachLogout,
    fetchAPI,
    requireAuth
  } = window.AppAPI;

  requireAuth();
  attachLogout();

  const projectForm = document.getElementById('project-form');
  const projectMessage = document.getElementById('project-message');
  const projectsTableBody = document.getElementById('projects-table-body');
  const projectsMessage = document.getElementById('projects-message');

  const statusClassMap = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected'
  };

  const showMessage = (element, message, type = '') => {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = `message ${type}`.trim();
  };

  const getEditId = () => new URLSearchParams(window.location.search).get('edit');

  const loadProjectForEdit = async (projectId) => {
    try {
      const response = await fetchAPI('/api/projects');
      const project = response.data.find((item) => item._id === projectId);

      if (!project) {
        showMessage(projectMessage, 'Project not found for editing.', 'error');
        return;
      }

      document.getElementById('project-id').value = project._id;
      document.getElementById('title').value = project.title;
      document.getElementById('description').value = project.description;
      document.getElementById('githubUrl').value = project.githubUrl;
      showMessage(projectMessage, 'Editing existing project. Saving will reset status to pending.');
    } catch (error) {
      showMessage(projectMessage, error.message, 'error');
    }
  };

  const setupProjectForm = () => {
    if (!projectForm) {
      return;
    }

    const editId = getEditId();
    if (editId) {
      loadProjectForEdit(editId);
    }

    projectForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(projectForm);
      const projectId = document.getElementById('project-id').value;
      const endpoint = projectId ? `/api/projects/${projectId}` : '/api/projects';
      const method = projectId ? 'PUT' : 'POST';

      const fileInput = document.getElementById('certificationFile');
      if (!fileInput.files.length) {
        formData.delete('certificationFile');
      }

      try {
        await fetchAPI(endpoint, method, formData);
        showMessage(
          projectMessage,
          projectId ? 'Project updated successfully.' : 'Project added successfully.',
          'success'
        );
        projectForm.reset();
        document.getElementById('project-id').value = '';
        window.setTimeout(() => {
          window.location.href = '/projects.html';
        }, 700);
      } catch (error) {
        showMessage(projectMessage, error.message, 'error');
      }
    });
  };

  const renderProjectsTable = async () => {
    if (!projectsTableBody) {
      return;
    }

    try {
      const response = await fetchAPI('/api/projects');
      const projects = response.data;

      if (!projects.length) {
        projectsTableBody.innerHTML =
          '<tr><td colspan="6" class="empty-state">No projects submitted yet.</td></tr>';
        return;
      }

      projectsTableBody.innerHTML = projects
        .map(
          (project) => `
            <tr>
              <td>
                <strong>${project.title}</strong>
                <div>${project.description}</div>
              </td>
              <td>
                <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer">Repository</a>
              </td>
              <td>
                ${
                  project.certificationFile
                    ? `<a href="/${project.certificationFile}" target="_blank" rel="noopener noreferrer">View File</a>`
                    : 'Not uploaded'
                }
              </td>
              <td>
                <span class="status-badge ${statusClassMap[project.status]}">${project.status}</span>
              </td>
              <td>${project.feedback || 'Awaiting review'}</td>
              <td>
                <div class="action-group">
                  <a class="icon-button" href="/add-project.html?edit=${project._id}">Edit</a>
                  <button class="icon-button danger" data-delete-id="${project._id}" type="button">Delete</button>
                </div>
              </td>
            </tr>
          `
        )
        .join('');

      projectsTableBody.querySelectorAll('[data-delete-id]').forEach((button) => {
        button.addEventListener('click', async () => {
          try {
            await fetchAPI(`/api/projects/${button.dataset.deleteId}`, 'DELETE');
            showMessage(projectsMessage, 'Project deleted successfully.', 'success');
            renderProjectsTable();
          } catch (error) {
            showMessage(projectsMessage, error.message, 'error');
          }
        });
      });
    } catch (error) {
      showMessage(projectsMessage, error.message, 'error');
    }
  };

  setupProjectForm();
  renderProjectsTable();
})();
