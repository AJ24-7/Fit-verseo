
window.onerror = function(message, source, lineno, colno, error) {
  console.error('[GLOBAL ERROR HANDLER] Error:', message, 'Source:', source, 'Line:', lineno, 'Col:', colno, 'Error Obj:', error);
  // Optionally, you could display a user-friendly message here or send the error to a logging service
  return true; // Prevents the browser's default error handling (e.g., stopping script execution)
};
  function logout() {
  localStorage.removeItem('token'); // only remove token if that's what you're using
  window.location.href = 'index.html';
}

// === NAVIGATION BAR: Toggle & Active Link Highlight ===
document.addEventListener('DOMContentLoaded', function () {
  const loadingScreen = document.getElementById('loading-screen');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Default to index.html if path is empty

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

  // Mobile menu toggle
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

  // === MAIN TRAINER LOADING LOGIC ===
  const loadingIndicator = document.querySelector('.loading-indicator');
  const errorMessage = document.querySelector('.error-message');
  const trainersContainer = document.querySelector('.trainers-container');
  const retryButton = document.querySelector('.retry-loading');
  const filterForm = document.querySelector('.filter-form');
  const registerBtn = document.getElementById('registerBtn');
  const trainerModal = document.getElementById('trainerModal');
  const registrationModal = document.getElementById('registrationModal');
  const registrationForm = document.getElementById('registrationForm');
  const formResponseMessage = document.getElementById('formResponseMessage'); // Get the message element
  
  let allTrainersData = [];

  
  // Load trainers from backend
  async function loadTrainers() {
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
    if (trainersContainer) trainersContainer.style.display = 'none';

    try {
      const response = await fetch("http://localhost:5000/api/trainers");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP error! Status: ${response.status}` 
        }));
        throw new Error(errorData.message);
      }
      
      allTrainersData = await response.json();
      
      if (!Array.isArray(allTrainersData)) {
        console.warn('Fetched trainers data is not an array:', allTrainersData);
        allTrainersData = [];
      }

      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (trainersContainer) trainersContainer.style.display = 'block';
      
      populateTrainers(allTrainersData);
      setupModalEvents();
    } catch (err) {
      console.error('Error loading trainers:', err);
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (errorMessage) {
        errorMessage.textContent = `Failed to load trainers: ${err.message}. Please try again.`;
        errorMessage.style.display = 'block';
      }
    }
  }

  // Retry button event
  if (retryButton) {
    retryButton.addEventListener('click', loadTrainers);
  }

  // Check trainer availability
  function checkAvailability(availabilityObj, filterTime) {
    if (typeof availabilityObj !== 'object' || availabilityObj === null) return false;
    const morningHours = ['6', '7', '8', '9', '10'];
    const eveningHours = ['16', '17', '18', '19', '20'];
    const normalizedFilterTime = filterTime.toLowerCase();

    if (normalizedFilterTime === 'any time') return true;

    for (const day in availabilityObj) {
      if (Object.prototype.hasOwnProperty.call(availabilityObj, day)) {
        for (const slot of availabilityObj[day]) {
          const hour = slot.split(':')[0].trim();
          if (
            (normalizedFilterTime === 'morning' && morningHours.includes(hour)) ||
            (normalizedFilterTime === 'evening' && eveningHours.includes(hour))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Filter form submission
  if (filterForm) {
    filterForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const location = document.getElementById('location').value;
      const specialty = document.getElementById('specialty').value;
      const availability = document.getElementById('availability').value.toLowerCase();

      try {
        const filtered = allTrainersData.filter((trainer) => {
          const locationMatch = location === 'All Cities' || 
            (trainer.location && trainer.location.toLowerCase() === location.toLowerCase());
          const specialtyMatch = specialty === 'All Specialties' || 
            (trainer.specialties && trainer.specialties.map(s => s.toLowerCase()).includes(specialty.toLowerCase()));
          const availabilityMatch = availability === 'any time' || 
            checkAvailability(trainer.availability, availability);
          return locationMatch && specialtyMatch && availabilityMatch;
        });
        populateTrainers(filtered);
      } catch (error) {
        console.error('Filter error:', error);
        if (errorMessage) {
          errorMessage.textContent = `Error applying filters: ${error.message}`;
          errorMessage.style.display = 'block';
        }
      }
    });
  }

  // Populate trainers in the UI
  function populateTrainers(trainersToDisplay) {
    if (!trainersContainer) return;
    trainersContainer.innerHTML = '';

    if (!trainersToDisplay || trainersToDisplay.length === 0) {
      trainersContainer.innerHTML = '<p class="text-center">No trainers found matching your criteria.</p>';
      return;
    }

    const trainersByGym = {};
    trainersToDisplay.forEach((trainer) => {
      const gymName = trainer.gym || 'Independent Trainers';
      if (!trainersByGym[gymName]) {
        trainersByGym[gymName] = [];
      }
      trainersByGym[gymName].push(trainer);
    });

    for (const gymName in trainersByGym) {
      if (Object.prototype.hasOwnProperty.call(trainersByGym, gymName)) {
        const gymSection = document.createElement('section');
        gymSection.className = 'gym-section';

        const heading = document.createElement('h2');
        heading.textContent = `${gymName} Trainers`;
        gymSection.appendChild(heading);

        const trainersGrid = document.createElement('div');
        trainersGrid.className = 'trainers-grid';

        trainersByGym[gymName].forEach((trainer) => {
          const trainerCard = document.createElement('div');
          trainerCard.className = 'trainer-card';
          const trainerId = trainer._id || trainer.id;
          trainerCard.setAttribute('data-trainer-id', trainerId);

          const imageUrl = trainer.image ? 
            (trainer.image.startsWith('http') ? trainer.image : `/uploads/${trainer.image}`) : 
            'images/default-trainer.png';

          trainerCard.innerHTML = `
            <div class="trainer-image">
              <img src="${imageUrl}" alt="Trainer ${trainer.name || 'N/A'}" 
                onerror="this.onerror=null;this.src='images/default-trainer.png';">
            </div>
            <div class="trainer-info">
              <h3>${trainer.name || 'Trainer Name'}</h3>
              <p class="trainer-specialty">${trainer.specialties ? trainer.specialties.join(', ') : 'N/A'}</p>
              <p class="trainer-bio">${trainer.shortBio || 'No bio available.'}</p>
              <div class="trainer-actions">
                <a href="#" class="btn btn-outline view-profile">View Profile</a>
                <a href="#" class="btn book-session" data-trainer-id="${trainerId}">Book Session</a>
              </div>
            </div>
          `;
          trainersGrid.appendChild(trainerCard);
        });
        gymSection.appendChild(trainersGrid);
        trainersContainer.appendChild(gymSection);
      }
    }
  }

  // Setup modal events
  function setupModalEvents() {
    const closeBtns = document.querySelectorAll('.close-modal');
    closeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (trainerModal) trainerModal.style.display = 'none';
        if (registrationModal) registrationModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      });
    });

    // Window click handler for modal dismissal
    window.addEventListener('click', (e) => {
      if (e.target === trainerModal && trainerModal) {
        trainerModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
      if (e.target === registrationModal && registrationModal) {
        registrationModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });

    // Event delegation for view profile buttons
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('view-profile')) {
        e.preventDefault();
        const trainerCard = e.target.closest('.trainer-card');
        if (!trainerCard) return;
        const trainerId = trainerCard.getAttribute('data-trainer-id');
        
        try {
          const response = await fetch(`/api/gyms/trainers/${trainerId}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              message: `Failed to fetch trainer details. Status: ${response.status}` 
            }));
            throw new Error(errorData.message);
          }
          const trainer = await response.json();
          displayTrainerProfile(trainer);
        } catch (error) {
          console.error('Error fetching trainer details:', error);
          if (errorMessage) {
            errorMessage.textContent = `Error loading trainer profile: ${error.message}`;
            errorMessage.style.display = 'block';
          }
        }
      }
    });
    
    // Register button opens the registration modal
    if (registerBtn && registrationModal) {
      console.log('Register button and modal found:', registerBtn, registrationModal);
      registerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('Register button clicked!');
        registrationModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
      });
    } else {
      console.error('Register button or modal NOT found. Button:', registerBtn, 'Modal:', registrationModal);
    }

    // Book session button functionality
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('book-session')) {
        e.preventDefault();
        const trainerId = e.target.dataset.trainerId;
        // TODO: Implement booking session functionality
        alert(`Book session with trainer ID: ${trainerId} - (Not Implemented)`);
      }
    });
  }

  // Display trainer profile in modal
  function displayTrainerProfile(trainer) {
    if (!trainerModal) return;

    const modal = trainerModal;
    const imageUrl = trainer.image ? 
      (trainer.image.startsWith('http') ? trainer.image : `/uploads/${trainer.image}`) : 
      'images/default-trainer.png';
    
    // Populate basic info
    const nameElement = modal.querySelector('.profile-header h2');
    if (nameElement) nameElement.textContent = trainer.name || 'Trainer Name';

    const profileImg = modal.querySelector('.profile-header img');
    if (profileImg) {
      profileImg.src = imageUrl;
      profileImg.alt = `Profile image of ${trainer.name || 'N/A'}`;
    }

    const profileSpecialty = modal.querySelector('.profile-header p');
    if (profileSpecialty) {
      profileSpecialty.textContent = trainer.specialties ? trainer.specialties.join(', ') : 'N/A';
    }
    
    const aboutSection = modal.querySelector('.about-section p');
    if (aboutSection) {
      aboutSection.textContent = trainer.bio || 'No bio available.';
    }

    // Populate specialties
    const specialtiesList = modal.querySelector('.specialties-list');
    if (specialtiesList) {
      specialtiesList.innerHTML = '';
      (trainer.specialties || ['No specialties listed']).forEach((specialty) => {
        const li = document.createElement('li');
        li.textContent = specialty;
        specialtiesList.appendChild(li);
      });
    }

    // Populate availability
    const availabilityList = modal.querySelector('.availability-list');
    if (availabilityList) {
      availabilityList.innerHTML = '';
      if (trainer.availability && typeof trainer.availability === 'object') {
        for (const day in trainer.availability) {
          if (Object.prototype.hasOwnProperty.call(trainer.availability, day)) {
            const li = document.createElement('li');
            li.textContent = `${day}: ${trainer.availability[day].join(', ')}`;
            availabilityList.appendChild(li);
          }
        }
      } else {
        availabilityList.innerHTML = '<li>No availability information</li>';
      }
    }

    // Populate testimonials
    const testimonialsSection = modal.querySelector('.testimonials-section');
    if (testimonialsSection) {
      testimonialsSection.innerHTML = '<h3>Client Testimonials</h3>';
      if (trainer.testimonials && trainer.testimonials.length > 0) {
        trainer.testimonials.forEach((testimonial) => {
          const div = document.createElement('div');
          div.className = 'testimonial';
          div.innerHTML = `
            <p>"${testimonial.text}"</p>
            <p><strong>- ${testimonial.client}</strong></p>
          `;
          testimonialsSection.appendChild(div);
        });
      } else {
        testimonialsSection.innerHTML += '<p>No testimonials available yet.</p>';
      }
    }

    trainerModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }


  // === REGISTRATION FORM SUBMISSION ===
  if (registrationForm) {
    registrationForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      event.stopImmediatePropagation(); // Good to have, especially with potential Live Server issues

      if (formResponseMessage) {
        formResponseMessage.style.display = 'none'; // Hide previous messages
        formResponseMessage.textContent = '';
        formResponseMessage.className = ''; // Reset classes
      }

      const submitButton = document.getElementById('submitRegistrationBtn');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
      }

      const formData = new FormData(registrationForm);
      // Log formData entries for debugging
      // for (var pair of formData.entries()) {
      //    console.log(pair[0]+ ': '+ pair[1]); 
      // }

      try {
        const response = await fetch('http://localhost:5000/api/trainers/register', { // ENSURE THIS IS THE CORRECT ENDPOINT
          method: 'POST',
          body: formData, // FormData handles multipart/form-data automatically
          // headers: { 'Content-Type': 'multipart/form-data' } // Not needed with FormData
        });

        const result = await response.json();

        if (response.ok) {
          if (formResponseMessage) {
            formResponseMessage.textContent = result.message || 'Registration successful! Awaiting admin approval.';
            formResponseMessage.className = 'message success'; // Add success class for styling
            formResponseMessage.style.display = 'block';
          }
          registrationForm.reset(); // Clear the form
          // Optionally, close the modal or redirect
          // if (registrationModal) registrationModal.style.display = 'none'; 
        } else {
          throw new Error(result.message || `Server responded with ${response.status}`);
        }
      } catch (error) {
        console.error('Registration failed:', error);
        if (formResponseMessage) {
          formResponseMessage.textContent = 'Registration failed: ' + error.message;
          formResponseMessage.className = 'message error'; // Add error class for styling
          formResponseMessage.style.display = 'block';
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Register Profile';
        }
      }
    });
  }

  // === DYNAMIC GYM LOADING FOR REGISTRATION FORM ===
  const citySelect = document.getElementById('city');
  const gymSelect = document.getElementById('gym');

  if (citySelect && gymSelect) {
    citySelect.addEventListener('change', async function () {
      const selectedCities = Array.from(citySelect.selectedOptions).map(opt => opt.value);
      
      try {
        const response = await fetch('http://localhost:5000/api/gyms/by-cities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cities: selectedCities })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch gyms by cities');
        }

        const gyms = await response.json();
        gymSelect.innerHTML = '<option value="">-- Select Gym --</option>';

        gyms.forEach((gym) => {
          const option = document.createElement('option');
          option.value = gym._id || gym.id;
          option.textContent = `${gym.name} (${gym.city})`;
          gymSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Error fetching gyms:', error);
        gymSelect.innerHTML = '<option value="">-- Error loading gyms --</option>';
      }
    });
  }

  // === USER AUTHENTICATION STATE MANAGEMENT ===
  const token = localStorage.getItem('token');
  const userNav = document.getElementById('user-profile-nav');
  const loginNav = document.getElementById('login-signup-nav');
document.addEventListener("DOMContentLoaded", function () {
  // === USER AUTHENTICATION & PROFILE PICTURE ===
  const token = localStorage.getItem("token");
  const userNav = document.getElementById("user-profile-nav");
  const loginNav = document.getElementById("login-signup-nav");
  const logoutBtn = document.getElementById('logout-btn');

  // Default states
  if (userNav) userNav.style.display = "none";
  if (loginNav) loginNav.style.display = "none";

 

  if (!token) {
    // Not logged in: show login/signup
    if (loginNav) loginNav.style.display = "block";
    return;
  }

});

  // Try to fetch user profile if token exists
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

      // Show profile dropdown, hide login
      if (userNav) userNav.style.display = "block";
      if (loginNav) loginNav.style.display = "none";
    })
    .catch(error => {
      console.error("Error fetching user:", error.message);
      // Failed to authenticate, show login
      if (loginNav) loginNav.style.display = "block";
    });

  // === TOUCH DEVICE SUPPORT ===
  const settingsOptions = document.querySelectorAll('.settings-option');
  
  settingsOptions.forEach((option) => {
    // For mouse users
    option.addEventListener('mouseenter', function () {
      const submenu = this.querySelector('.settings-submenu');
      if (submenu) submenu.style.display = 'block';
    });
    
    option.addEventListener('mouseleave', function () {
      const submenu = this.querySelector('.settings-submenu');
      if (submenu) submenu.style.display = 'none';
    });
    
    // For touch devices
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

  // Initial load of trainers
  loadTrainers();
});