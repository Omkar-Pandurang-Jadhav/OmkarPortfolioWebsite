/* ============================================================
   Omkar Jadhav – Portfolio  |  main.js
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Constants                                                            */
  /* ------------------------------------------------------------------ */
  // NOTE: This is a client-side-only portfolio site with no backend.
  // The admin password stored here is intentionally simple and is meant
  // only to hide admin UI from casual visitors – not as a security boundary.
  // For a production deployment, replace this with server-side authentication.
  const ADMIN_PASSWORD      = 'omkar2025';   // Change this to your own secret
  const LS_ADMIN_KEY        = 'portfolio_admin';
  const LS_PHOTO_KEY        = 'portfolio_photo';
  const LS_PROJECTS_KEY     = 'portfolio_projects';
  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const REVEAL_THRESHOLD    = 0.12;             // fraction of element visible before animating in

  /* ------------------------------------------------------------------ */
  /* DOM References                                                       */
  /* ------------------------------------------------------------------ */
  const profileImg        = document.getElementById('profile-img');
  const uploadLabel       = document.getElementById('upload-label');
  const photoUploadInput  = document.getElementById('photo-upload');

  const adminToggle       = document.getElementById('admin-toggle');
  const adminLockIcon     = document.getElementById('admin-lock-icon');

  const adminModal        = document.getElementById('admin-modal');
  const adminModalClose   = document.getElementById('admin-modal-close');
  const adminPasswordInput= document.getElementById('admin-password-input');
  const adminLoginBtn     = document.getElementById('admin-login-btn');
  const adminErrorMsg     = document.getElementById('admin-error-msg');

  const adminAddBtnWrapper = document.getElementById('admin-add-btn-wrapper');
  const openAddProjectModal = document.getElementById('open-add-project-modal');

  const addProjectModal      = document.getElementById('add-project-modal');
  const addProjectModalClose = document.getElementById('add-project-modal-close');
  const projTitle            = document.getElementById('proj-title');
  const projSubtitle         = document.getElementById('proj-subtitle');
  const projBullets          = document.getElementById('proj-bullets');
  const projTag              = document.getElementById('proj-tag');
  const projGithub           = document.getElementById('proj-github');
  const projExtraUrl         = document.getElementById('proj-extra-url');
  const projExtraLabel       = document.getElementById('proj-extra-label');
  const saveProjectBtn       = document.getElementById('save-project-btn');
  const addProjectError      = document.getElementById('add-project-error');

  const projectsGrid         = document.getElementById('projects-grid');

  const hamburger            = document.getElementById('hamburger');
  const navLinks             = document.querySelector('.nav-links');

  /* ------------------------------------------------------------------ */
  /* Admin Badge (fixed bottom-right indicator)                          */
  /* ------------------------------------------------------------------ */
  const adminBadge = document.createElement('div');
  adminBadge.className = 'admin-mode-badge';
  adminBadge.textContent = '🔑 ADMIN MODE';
  document.body.appendChild(adminBadge);

  /* ------------------------------------------------------------------ */
  /* Utility helpers                                                      */
  /* ------------------------------------------------------------------ */
  function isAdminActive () {
    return sessionStorage.getItem(LS_ADMIN_KEY) === 'true';
  }

  function openModal (modal) {
    modal.style.display = 'flex';
    // trap focus on first input
    const first = modal.querySelector('input, textarea, button');
    if (first) setTimeout(() => first.focus(), 50);
  }

  function closeModal (modal) {
    modal.style.display = 'none';
  }

  /* ------------------------------------------------------------------ */
  /* Profile image – restore from LocalStorage on load                   */
  /* ------------------------------------------------------------------ */
  (function restorePhoto () {
    const saved = localStorage.getItem(LS_PHOTO_KEY);
    if (saved) profileImg.src = saved;
  })();

  /* ------------------------------------------------------------------ */
  /* Admin mode UI                                                        */
  /* ------------------------------------------------------------------ */
  function applyAdminUI () {
    const active = isAdminActive();
    uploadLabel.style.display       = active ? 'flex' : 'none';
    adminAddBtnWrapper.style.display = active ? 'block' : 'none';
    adminBadge.style.display         = active ? 'block' : 'none';

    // Show remove buttons on project cards
    document.querySelectorAll('.remove-project-btn').forEach(btn => {
      btn.style.display = active ? 'inline-block' : 'none';
    });

    // Lock icon colour
    adminLockIcon.className = active
      ? 'fa-solid fa-lock-open unlocked'
      : 'fa-solid fa-lock';
  }

  /* ------------------------------------------------------------------ */
  /* Admin toggle click → open login modal or logout                     */
  /* ------------------------------------------------------------------ */
  adminToggle.addEventListener('click', function () {
    if (isAdminActive()) {
      // Logout
      sessionStorage.removeItem(LS_ADMIN_KEY);
      applyAdminUI();
    } else {
      adminPasswordInput.value = '';
      adminErrorMsg.style.display = 'none';
      openModal(adminModal);
    }
  });

  /* ------------------------------------------------------------------ */
  /* Admin login                                                          */
  /* ------------------------------------------------------------------ */
  function attemptLogin () {
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
      sessionStorage.setItem(LS_ADMIN_KEY, 'true');
      closeModal(adminModal);
      applyAdminUI();
    } else {
      adminErrorMsg.style.display = 'block';
      adminPasswordInput.select();
    }
  }

  adminLoginBtn.addEventListener('click', attemptLogin);

  adminPasswordInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') attemptLogin();
  });

  adminModalClose.addEventListener('click', () => closeModal(adminModal));
  adminModal.addEventListener('click', function (e) {
    if (e.target === adminModal) closeModal(adminModal);
  });

  /* ------------------------------------------------------------------ */
  /* Photo upload                                                         */
  /* ------------------------------------------------------------------ */
  photoUploadInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate size (max 5 MB)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert('Image too large. Please choose an image under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      profileImg.src = dataUrl;
      try {
        localStorage.setItem(LS_PHOTO_KEY, dataUrl);
      } catch (_) {
        // localStorage full – still show in-session
        console.warn('localStorage quota exceeded; photo will not persist.');
      }
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  });

  /* ------------------------------------------------------------------ */
  /* Projects – load from localStorage                                   */
  /* ------------------------------------------------------------------ */
  function loadCustomProjects () {
    let projects = [];
    try {
      projects = JSON.parse(localStorage.getItem(LS_PROJECTS_KEY)) || [];
    } catch (_) {}

    projects.forEach(p => {
      const card = buildProjectCard(p);
      projectsGrid.appendChild(card);
    });
  }

  function saveCustomProjects (projects) {
    try {
      localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
    } catch (_) {
      console.warn('localStorage quota exceeded; project not saved.');
    }
  }

  function getCustomProjects () {
    try {
      return JSON.parse(localStorage.getItem(LS_PROJECTS_KEY)) || [];
    } catch (_) {
      return [];
    }
  }

  /* ------------------------------------------------------------------ */
  /* Build a project card element                                         */
  /* ------------------------------------------------------------------ */
  function buildProjectCard (p) {
    const card = document.createElement('div');
    card.className = 'project-card reveal';
    card.dataset.id = p.id;

    // Header
    const header = document.createElement('div');
    header.className = 'project-header';
    const h3 = document.createElement('h3');
    h3.textContent = p.title;
    const tag = document.createElement('span');
    tag.className = 'project-tag';
    tag.textContent = p.tag || 'Project';
    header.appendChild(h3);
    header.appendChild(tag);

    // Subtitle
    const sub = document.createElement('p');
    sub.className = 'project-sub';
    sub.textContent = p.subtitle || '';

    // Bullets
    const ul = document.createElement('ul');
    ul.className = 'project-bullets';
    const bullets = (p.bullets || '').split('\n').filter(b => b.trim());
    bullets.forEach(b => {
      const li = document.createElement('li');
      li.textContent = b.trim();
      ul.appendChild(li);
    });

    // Links
    const links = document.createElement('div');
    links.className = 'project-links';
    if (p.github) {
      const a = document.createElement('a');
      a.href = p.github;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-badge';
      a.innerHTML = '<i class="fa-brands fa-github"></i> GitHub';
      links.appendChild(a);
    }
    if (p.extraUrl && p.extraLabel) {
      const a = document.createElement('a');
      a.href = p.extraUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-badge link-badge-alt';
      a.innerHTML = `<i class="fa-solid fa-link"></i> ${escapeHtml(p.extraLabel)}`;
      links.appendChild(a);
    }

    // Remove button (admin only)
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-project-btn';
    removeBtn.style.display = 'none';
    removeBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Remove';
    removeBtn.addEventListener('click', () => removeProject(p.id));

    card.appendChild(header);
    if (p.subtitle) card.appendChild(sub);
    card.appendChild(ul);
    card.appendChild(links);
    card.appendChild(removeBtn);

    return card;
  }

  /* ------------------------------------------------------------------ */
  /* Add project modal                                                    */
  /* ------------------------------------------------------------------ */
  openAddProjectModal.addEventListener('click', () => {
    // Reset form
    [projTitle, projSubtitle, projBullets, projTag, projGithub, projExtraUrl, projExtraLabel].forEach(el => el.value = '');
    addProjectError.style.display = 'none';
    openModal(addProjectModal);
  });

  addProjectModalClose.addEventListener('click', () => closeModal(addProjectModal));
  addProjectModal.addEventListener('click', function (e) {
    if (e.target === addProjectModal) closeModal(addProjectModal);
  });

  saveProjectBtn.addEventListener('click', function () {
    const title = projTitle.value.trim();
    if (!title) {
      addProjectError.style.display = 'block';
      projTitle.focus();
      return;
    }

    // Validate URLs
    const github   = projGithub.value.trim();
    const extraUrl = projExtraUrl.value.trim();

    if (github && !isValidUrl(github)) {
      addProjectError.textContent = 'Please enter a valid GitHub URL.';
      addProjectError.style.display = 'block';
      return;
    }
    if (extraUrl && !isValidUrl(extraUrl)) {
      addProjectError.textContent = 'Please enter a valid extra link URL.';
      addProjectError.style.display = 'block';
      return;
    }

    addProjectError.textContent = 'Please enter a project title.';
    addProjectError.style.display = 'none';

    const project = {
      id:         'proj-' + Date.now(),
      title,
      subtitle:   projSubtitle.value.trim(),
      bullets:    projBullets.value,
      tag:        projTag.value.trim() || 'Project',
      github,
      extraUrl,
      extraLabel: projExtraLabel.value.trim(),
    };

    // Save
    const projects = getCustomProjects();
    projects.push(project);
    saveCustomProjects(projects);

    // Add to DOM
    const card = buildProjectCard(project);
    projectsGrid.appendChild(card);

    // Show remove button if admin active
    if (isAdminActive()) {
      card.querySelector('.remove-project-btn').style.display = 'inline-block';
    }

    // Trigger reveal animation
    setTimeout(() => card.classList.add('visible'), 50);

    closeModal(addProjectModal);
  });

  /* ------------------------------------------------------------------ */
  /* Remove project                                                       */
  /* ------------------------------------------------------------------ */
  function removeProject (id) {
    if (!confirm('Remove this project?')) return;

    const projects = getCustomProjects().filter(p => p.id !== id);
    saveCustomProjects(projects);

    const card = projectsGrid.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();
  }

  /* ------------------------------------------------------------------ */
  /* Hamburger / mobile nav                                               */
  /* ------------------------------------------------------------------ */
  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });

  // Close mobile nav when a link is clicked
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') navLinks.classList.remove('open');
  });

  /* ------------------------------------------------------------------ */
  /* Active nav link on scroll                                            */
  /* ------------------------------------------------------------------ */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  function updateActiveNav () {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 80;
      if (window.scrollY >= top) current = sec.id;
    });
    navAnchors.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  /* ------------------------------------------------------------------ */
  /* Scroll-reveal                                                        */
  /* ------------------------------------------------------------------ */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: REVEAL_THRESHOLD }
  );

  function observeRevealElements () {
    document.querySelectorAll('.skill-card, .project-card, .contact-card, .about-card').forEach(el => {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }

  observeRevealElements();

  /* ------------------------------------------------------------------ */
  /* Escape HTML helper (used in innerHTML for user input)               */
  /* ------------------------------------------------------------------ */
  function escapeHtml (str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
  }

  /* ------------------------------------------------------------------ */
  /* URL validation helper                                               */
  /* ------------------------------------------------------------------ */
  function isValidUrl (str) {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                 */
  /* ------------------------------------------------------------------ */
  loadCustomProjects();
  applyAdminUI();

})();
