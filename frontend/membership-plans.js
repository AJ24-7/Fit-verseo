function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
document.addEventListener('DOMContentLoaded', function () {
  // === NAVIGATION BAR: Toggle & Active Link Highlight ===
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Mobile menu toggle (copied from personaltraining.js)
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      navLinks.classList.toggle('nav-active');
    });
  }
   // Dropdown open/close for mobile
  document.querySelectorAll('.dropdown > a').forEach(function(dropLink) {
    dropLink.addEventListener('click', function(e) {
      // Only activate on mobile
      if (window.innerWidth <= 900) {
        e.preventDefault();
        const parentDropdown = this.parentElement;
        parentDropdown.classList.toggle('open');
        // Close other open dropdowns
        document.querySelectorAll('.dropdown').forEach(function(dd) {
          if (dd !== parentDropdown) dd.classList.remove('open');
        });
      }
    });
  });
  // Settings submenu open/close for mobile
  document.querySelectorAll('.settings-option > a').forEach(function(settingsLink) {
    settingsLink.addEventListener('click', function(e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        const parentOption = this.parentElement;
        parentOption.classList.toggle('open');
        // Close other open settings
        document.querySelectorAll('.settings-option').forEach(function(opt) {
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
      logout();
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

  // === TOUCH DEVICE SUPPORT ===
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

  // === Load Gyms and Handle Filters ===
  function displayGyms(gymsData) {
    const container = document.getElementById('gymProfilesContainer');
    container.innerHTML = '';
    const gyms = Object.entries(gymsData).map(([id, gym]) => ({ id, ...gym }));

    gyms.forEach(gym => {
      const popularPlan = gym.plans.find(plan => plan.title === "Premium") || gym.plans[0];
      const gymCard = document.createElement('div');
      gymCard.className = 'gym-card';

      let sliderDots = '';
      gym.photos.forEach((_, index) => {
        sliderDots += `<div class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`;
      });

      gymCard.innerHTML = `
        <div class="gym-image-slider">
          <div class="gym-images">
            ${gym.photos.map(photo => `<img src="${photo}" alt="${gym.name}">`).join('')}
          </div>
          <div class="slider-nav">
            ${sliderDots}
          </div>
        </div>
        <div class="gym-info">
          <div class="gym-header">
            <h3 class="gym-name">${gym.name}</h3>
            <div class="gym-rating">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              ${gym.rating}
            </div>
          </div>
          <p class="gym-distance">${gym.city}</p>
          <div class="gym-features">
            ${gym.features.slice(0, 4).map(feature => `<span class="feature-tag">${feature.label}</span>`).join('')}
          </div>
          <div class="popular-plan">
            <div class="popular-badge">POPULAR</div>
            <div class="plan-name">${popularPlan.title}</div>
            <div class="plan-price">${popularPlan.price} <span class="plan-duration">${popularPlan.billing === "month" ? "per month" : "per day"}</span></div>
            <p>${popularPlan.features.join(", ")}</p>
          </div>
          <a href="gymdetails.html?id=${gym.id}" class="view-profile-btn">View Full Profile</a>
        </div>
      `;

      container.appendChild(gymCard);

      const slider = gymCard.querySelector('.gym-images');
      const dots = gymCard.querySelectorAll('.slider-dot');
      let currentIndex = 0;

      const slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % gym.photos.length;
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentIndex].classList.add('active');
      }, 3000);

      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          clearInterval(slideInterval);
          currentIndex = parseInt(dot.dataset.index);
          slider.style.transform = `translateX(-${currentIndex * 100}%)`;
          dots.forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
        });
      });
    });
  }

  document.getElementById('locationSelect').addEventListener('change', function () {
    const selectedCity = this.options[this.selectedIndex].text;
    if (selectedCity === "All Cities") {
      fetchAndDisplayGyms();
    } else {
      fetch('data/gymdetails.json')
        .then(response => response.json())
        .then(data => {
          const filteredGyms = Object.entries(data).reduce((acc, [id, gym]) => {
            if (gym.city === selectedCity) {
              acc[id] = gym;
            }
            return acc;
          }, {});
          displayGyms(filteredGyms);
        })
        .catch(error => console.error('Error loading gym data:', error));
    }
  });

  function fetchAndDisplayGyms() {
    fetch('data/gymdetails.json')
      .then(response => response.json())
      .then(data => {
        displayGyms(data);
      })
      .catch(error => console.error('Error loading gym data:', error));
  }

  fetchAndDisplayGyms();

  
});
