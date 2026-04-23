/**
 * Purpose: Loads the student dashboard, manages skill tags, and renders the
 * approved portfolio view.
 */

(function initializeDashboard() {
  const {
    attachLogout,
    fetchAPI,
    getToken,
    requireAuth,
    setSession
  } = window.AppAPI;

  requireAuth();
  attachLogout();

  const studentName = document.getElementById('student-name');
  const totalProjects = document.getElementById('total-projects');
  const approvedProjects = document.getElementById('approved-projects');
  const skillForm = document.getElementById('skill-form');
  const skillInput = document.getElementById('skill-input');
  const skillsContainer = document.getElementById('skills-container');
  const portfolioList = document.getElementById('portfolio-list');
  const messageBox = document.getElementById('dashboard-message');

  let currentUser = null;

  const showMessage = (message, type = '') => {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`.trim();
  };

  const renderSkills = () => {
    skillsContainer.innerHTML = '';

    if (!currentUser.skills.length) {
      skillsContainer.innerHTML = '<p class="empty-state">No skills added yet.</p>';
      return;
    }

    currentUser.skills.forEach((skill) => {
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.innerHTML = `<span>${skill}</span><button type="button" data-skill="${skill}">×</button>`;
      skillsContainer.appendChild(tag);
    });

    skillsContainer.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', async () => {
        const nextSkills = currentUser.skills.filter((skill) => skill !== button.dataset.skill);
        await saveSkills(nextSkills);
      });
    });
  };

  const renderPortfolio = (projects) => {
    portfolioList.innerHTML = '';

    if (!projects.length) {
      portfolioList.innerHTML =
        '<p class="empty-state">Approved projects will appear here after review.</p>';
      return;
    }

    projects.forEach((project) => {
      const article = document.createElement('article');
      article.className = 'portfolio-card';
      article.innerHTML = `
        <h4>${project.title}</h4>
        <p>${project.description}</p>
        <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer">Open GitHub</a>
      `;
      portfolioList.appendChild(article);
    });
  };

  const saveSkills = async (skills) => {
    try {
      const response = await fetchAPI('/api/auth/skills', 'PUT', { skills });
      currentUser = response.data;
      setSession(getToken(), currentUser);
      renderSkills();
      showMessage('Skills updated successfully.', 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  skillForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const newSkill = skillInput.value.trim();

    if (!newSkill) {
      return;
    }

    const nextSkills = [...new Set([...(currentUser.skills || []), newSkill])];
    await saveSkills(nextSkills);
    skillInput.value = '';
  });

  const loadDashboard = async () => {
    try {
      const [userResponse, projectsResponse, portfolioResponse] = await Promise.all([
        fetchAPI('/api/auth/me'),
        fetchAPI('/api/projects'),
        fetchAPI('/api/projects/portfolio')
      ]);

      currentUser = userResponse.data;
      setSession(getToken(), currentUser);

      studentName.textContent = currentUser.name;
      totalProjects.textContent = projectsResponse.data.length;
      approvedProjects.textContent = portfolioResponse.data.length;

      renderSkills();
      renderPortfolio(portfolioResponse.data);
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  loadDashboard();
})();
