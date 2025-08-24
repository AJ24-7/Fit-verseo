function logout() {
  localStorage.removeItem('token'); // only remove token if that's what you're using
  window.location.href = 'index.html';
}
document.addEventListener('DOMContentLoaded', function () {
  // === LOADING SCREEN ===
  const loadingScreen = document.getElementById('loading-screen');
  
  // Show loading screen initially
  showLoadingScreen();

  // Hide loading screen after content is loaded
  setTimeout(() => {
    hideLoadingScreen();
  }, 1500); // Show loading for 1.5 seconds

  // Loading screen functions
  function showLoadingScreen() {
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
      loadingScreen.style.display = 'flex';
    }
  }

  function hideLoadingScreen() {
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  // === NAVIGATION BAR: Toggle & Active Link Highlight ===
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Mobile menu toggle
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      navLinks.classList.toggle('nav-active');
    });
  }

  // Dropdown open/close for mobile
  document.querySelectorAll('.dropdown > a').forEach(function (dropLink) {
    dropLink.addEventListener('click', function (e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        const parentDropdown = this.parentElement;
        parentDropdown.classList.toggle('open');
        document.querySelectorAll('.dropdown').forEach(function (dd) {
          if (dd !== parentDropdown) dd.classList.remove('open');
        });
      }
    });
  });

  // Settings submenu open/close for mobile
  document.querySelectorAll('.settings-option > a').forEach(function (settingsLink) {
    settingsLink.addEventListener('click', function (e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        const parentOption = this.parentElement;
        parentOption.classList.toggle('open');
        document.querySelectorAll('.settings-option').forEach(function (opt) {
          if (opt !== parentOption) opt.classList.remove('open');
        });
      }
    });
  });

  // Active link highlighting
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });

  // === USER AUTHENTICATION & PROFILE PICTURE ===
  const token = localStorage.getItem("token");
  const userNav = document.getElementById("user-profile-nav");
  const loginNav = document.getElementById("login-signup-nav");
  const logoutBtn = document.getElementById('logout-btn');

  if (userNav) userNav.style.display = "none";
  if (loginNav) loginNav.style.display = "none";

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }

  if (!token) {
    if (loginNav) loginNav.style.display = "block";
  } else {
    fetch('http://localhost:5000/api/users/profile', {
      method: 'GET',
      headers: {
        'Content-Type': "application/json",
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server responded with ${res.status}: ${errText}`);
        }
        return res.json();
      })
      .then(user => {
        const profilePicUrl = user.profileImage
         ? (user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`)
        : `http://localhost:5000/uploads/profile-pics/default.png`;

        const userIconImage = document.getElementById("profile-icon-img");
        if (userIconImage) userIconImage.src = profilePicUrl;

        if (userNav) userNav.style.display = "block";
        if (loginNav) loginNav.style.display = "none";
      })
      .catch(error => {
        console.error("Error fetching user:", error.message);
        if (loginNav) loginNav.style.display = "block";
      });
  }

  // === FAQ TOGGLE ===
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      item.classList.toggle('active');
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });
    });
  });

  // === CONTACT FORM ===
  const contactForm = document.getElementById('contactForm');
  const successMessage = document.getElementById('successMessage');

  if (contactForm && successMessage) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      setTimeout(() => {
        contactForm.reset();
        successMessage.style.display = 'block';

        setTimeout(() => {
          successMessage.style.display = 'none';
        }, 5000);
      }, 1000);
    });
  }

  // === SLIDE-UP ANIMATION ===
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.slide-up');
    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;

      if (elementPosition < screenPosition) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }
    });
  };

  document.querySelectorAll('.slide-up').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    el.style.transitionDelay = `${index * 0.1}s`;
  });

  window.addEventListener('load', animateOnScroll);
  window.addEventListener('scroll', animateOnScroll);

  // === SETTINGS SUBMENU SUPPORT (Desktop & Mobile) ===
  const settingsOptions = document.querySelectorAll('.settings-option');

  settingsOptions.forEach((option) => {
    option.addEventListener('mouseenter', function () {
      const submenu = this.querySelector('.settings-submenu');
      if (submenu) submenu.style.display = 'block';
    });

    option.addEventListener('mouseleave', function () {
      const submenu = this.querySelector('.settings-submenu');
      if (submenu) submenu.style.display = 'none';
    });

    option.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const submenu = this.querySelector('.settings-submenu');
        if (submenu) {
          submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        }
      }
    });
  });
});
