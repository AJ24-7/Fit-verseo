function logout() {
  localStorage.removeItem('token'); 
  window.location.href = 'index.html';
}

let isGoogleUser = false;
let pendingFormData = null; // Store form data for confirmation

document.addEventListener("DOMContentLoaded", () => {
  let removeProfileImage = false;
  let currentStep = 1;
  const totalSteps = 2; // Changed from 3 to 2 steps (Basic Info + Fitness Details only)
  const token = localStorage.getItem('token');
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-btn");

  const formSections = document.querySelectorAll(".form-section");
  const steps = document.querySelectorAll(".step");

  function updateFormStep() {
    formSections.forEach((section, index) => {
      section.style.display = index + 1 === currentStep ? "block" : "none";
    });

    steps.forEach((step, index) => {
      step.classList.toggle("active", index + 1 === currentStep);
    });

    prevBtn.disabled = currentStep === 1;
    nextBtn.style.display = currentStep < totalSteps ? "inline-block" : "none";
    submitBtn.style.display = currentStep === totalSteps ? "inline-block" : "none";
  }

  nextBtn.addEventListener("click", () => {
    if (currentStep < totalSteps) {
      currentStep++;
      updateFormStep();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep--;
      updateFormStep();
    }
  });

  updateFormStep();
  
  // Profile Picture
const profilePic = document.getElementById("profile-pic");
const uploadPicInput = document.getElementById("upload-pic");
const uploadOverlay = document.querySelector(".upload-overlay");

// Make clicking the image or overlay open the file picker
[profilePic, uploadOverlay].forEach(el => {
  if (el) {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      uploadPicInput.click();
    });
  }
});

// Show preview when a file is selected
uploadPicInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      profilePic.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});
  // Password toggle
  document.querySelectorAll(".toggle-password").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const input = toggle.previousElementSibling;
      if (input && input.type) {
        input.type = input.type === "password" ? "text" : "password";
        toggle.innerHTML = input.type === "password"
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
      }
    });
  });

  // Initialize modal functionality
  initializeModals();
  initializeForgotPassword();

  // Submit Form - Modified to show confirmation modal
  const editForm = document.getElementById("edit-profile-form");

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Prepare form data
    pendingFormData = new FormData();

    // Basic Info
    pendingFormData.append("firstName", document.getElementById("first-name").value);
    pendingFormData.append("lastName", document.getElementById("last-name").value);
    pendingFormData.append("username", document.getElementById("username").value);
    pendingFormData.append("birthdate", document.getElementById("birthdate").value);
    pendingFormData.append("phone", document.getElementById("phone").value);
    pendingFormData.append("email", document.getElementById("email").value);
    
    // Profile Image: append the file if selected
    const uploadPicInput = document.getElementById("upload-pic");
    if (uploadPicInput.files && uploadPicInput.files[0]) {
      pendingFormData.append("profileImage", uploadPicInput.files[0]);
    }
    if (removeProfileImage) {
      pendingFormData.append("removeProfileImage", "true");
    }

    // Fitness Details
    pendingFormData.append("heightFeet", document.getElementById("height-feet").value);
    pendingFormData.append("heightInches", document.getElementById("height-inches").value);
    pendingFormData.append("weight", document.getElementById("weight").value);
    pendingFormData.append("fitnessLevel", document.getElementById("fitness-level").value);
    pendingFormData.append("primaryGoal", document.getElementById("primary-goal").value);

    const workoutPrefs = [];
    document.querySelectorAll('input[name="workout-pref"]:checked').forEach(checkbox => {
      workoutPrefs.push(checkbox.value);
    });
    workoutPrefs.forEach(pref => pendingFormData.append("workoutPreferences", pref));

    // Show confirmation modal for non-Google users
    if (!isGoogleUser) {
      showModal('confirm-password-modal');
      document.getElementById("confirm-password-input").focus();
    } else {
      // For Google users, save directly without password confirmation
      await saveProfile();
    }
  });

  // Save Profile Function
  async function saveProfile() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showErrorModal("You are not authenticated. Please log in again to save your profile changes.");
        return;
      }

      showLoadingModal("Saving profile...");

      const response = await fetch(`${BASE_URL}/api/users/update-profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
          // No 'Content-Type' here; it will be set automatically by FormData
        },
        body: pendingFormData
      });

      const result = await response.json();
      hideLoadingModal();

      if (response.ok) {
        showModal('success-modal');
      } else {
        showErrorModal(result.message || result.error || "Something went wrong while updating your profile.");
      }

    } catch (err) {
      hideLoadingModal();
      console.error("Error updating profile:", err);
      showErrorModal("Failed to update profile. Please check your connection and try again.");
    }
  }

  // Initialize Modal Functionality
  function initializeModals() {
    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        hideModal(modal.id);
        clearPasswordFields();
      });
    });

    // Cancel buttons
    document.getElementById('cancel-confirm-btn').addEventListener('click', function() {
      hideModal('confirm-password-modal');
      clearPasswordFields();
    });

    // Confirm save button
    document.getElementById('confirm-save-btn').addEventListener('click', async function() {
      const password = document.getElementById('confirm-password-input').value;
      
      if (!password) {
        showErrorModal('Please enter your password to confirm the changes.');
        return;
      }

      // Add password to form data
      pendingFormData.append("confirmPassword", password);
      
      // Hide modal and save profile
      hideModal('confirm-password-modal');
      clearPasswordFields();
      await saveProfile();
    });

    // Forgot password link
    document.getElementById('forgot-password-link').addEventListener('click', function(e) {
      e.preventDefault();
      hideModal('confirm-password-modal');
      showModal('forgot-password-modal');
      
      // Pre-fill email if available
      const emailField = document.getElementById('email');
      if (emailField && emailField.value) {
        document.getElementById('forgot-email').value = emailField.value;
      }
    });

    // Click outside to close modals
    window.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal')) {
        hideModal(e.target.id);
        clearPasswordFields();
      }
    });
  }

  // Clear password fields
  function clearPasswordFields() {
    document.getElementById('confirm-password-input').value = '';
    document.getElementById('forgot-email').value = '';
    document.getElementById('otp-input').value = '';
    document.getElementById('new-password-forgot').value = '';
    document.getElementById('confirm-new-password-forgot').value = '';
  }

  // Loading modal functions
  function showLoadingModal(text = "Processing...") {
    document.getElementById('loading-text').textContent = text;
    showModal('loading-modal');
  }

  function hideLoadingModal() {
    hideModal('loading-modal');
  }

  // Modal helper functions
  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      console.log('Modal opened:', modalId); // Debug log
    } else {
      console.error('Modal not found:', modalId); // Debug log
    }
  }

  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      console.log('Modal closed:', modalId); // Debug log
    } else {
      console.error('Modal not found:', modalId); // Debug log
    }
  }

  // Show error modal with message
  function showErrorModal(message) {
    document.getElementById('error-message').textContent = message;
    showModal('error-modal');
  }

  // Show info modal with message
  function showInfoModal(message) {
    document.getElementById('info-message').textContent = message;
    showModal('info-modal');
  }

  // Initialize Forgot Password Functionality
  function initializeForgotPassword() {
    // Send OTP button
    document.getElementById('send-otp-btn').addEventListener('click', async function() {
      const email = document.getElementById('forgot-email').value;
      
      if (!email) {
        showErrorModal('Please enter your email address to receive the OTP.');
        return;
      }

      try {
        showLoadingModal("Sending OTP...");
        
        const response = await fetch(`${BASE_URL}/api/users/request-password-reset-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        const result = await response.json();
        hideLoadingModal();

        if (response.ok) {
          // Switch to step 2
          document.getElementById('forgot-step-1').style.display = 'none';
          document.getElementById('forgot-step-2').style.display = 'block';
          document.getElementById('otp-input').focus();
          showInfoModal('OTP sent to your email address successfully!');
        } else {
          showErrorModal(result.message || 'Failed to send OTP. Please check your email address.');
        }
      } catch (error) {
        hideLoadingModal();
        console.error('Error sending OTP:', error);
        showErrorModal('Failed to send OTP. Please check your connection and try again.');
      }
    });

    // Reset password button
    document.getElementById('reset-password-btn').addEventListener('click', async function() {
      const email = document.getElementById('forgot-email').value;
      const otp = document.getElementById('otp-input').value;
      const newPassword = document.getElementById('new-password-forgot').value;
      const confirmPassword = document.getElementById('confirm-new-password-forgot').value;

      if (!otp || !newPassword || !confirmPassword) {
        showErrorModal('Please fill in all fields to reset your password.');
        return;
      }

      if (newPassword !== confirmPassword) {
        showErrorModal('New passwords do not match. Please ensure both password fields are identical.');
        return;
      }

      if (newPassword.length < 6) {
        showErrorModal('Password must be at least 6 characters long for security.');
        return;
      }

      try {
        showLoadingModal("Resetting password...");
        
        const response = await fetch(`${BASE_URL}/api/users/reset-password-with-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, otp, newPassword })
        });

        const result = await response.json();
        hideLoadingModal();

        if (response.ok) {
          showInfoModal('Password reset successfully! You can now use your new password.');
          hideModal('forgot-password-modal');
          
          // Reset forgot password form
          document.getElementById('forgot-step-1').style.display = 'block';
          document.getElementById('forgot-step-2').style.display = 'none';
          clearPasswordFields();
          
          // Pre-fill the new password in confirm modal
          document.getElementById('confirm-password-input').value = newPassword;
          showModal('confirm-password-modal');
        } else {
          showErrorModal(result.message || 'Failed to reset password. Please check your OTP and try again.');
        }
      } catch (error) {
        hideLoadingModal();
        console.error('Error resetting password:', error);
        showErrorModal('Failed to reset password. Please check your connection and try again.');
      }
    });

    // Back to email button
    document.getElementById('back-to-email-btn').addEventListener('click', function() {
      document.getElementById('forgot-step-1').style.display = 'block';
      document.getElementById('forgot-step-2').style.display = 'none';
    });

    // Resend OTP link
    document.getElementById('resend-otp-link').addEventListener('click', async function(e) {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;
      
      if (!email) {
        showErrorModal('Email address not found. Please go back and enter your email.');
        return;
      }

      try {
        showLoadingModal("Resending OTP...");
        
        const response = await fetch(`${BASE_URL}/api/users/request-password-reset-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        const result = await response.json();
        hideLoadingModal();

        if (response.ok) {
          showInfoModal('OTP resent to your email address successfully!');
        } else {
          showErrorModal(result.message || 'Failed to resend OTP. Please try again.');
        }
      } catch (error) {
        hideLoadingModal();
        console.error('Error resending OTP:', error);
        showErrorModal('Failed to resend OTP. Please check your connection and try again.');
      }
    });

    // Cancel forgot password
    document.getElementById('cancel-forgot-btn').addEventListener('click', function() {
      hideModal('forgot-password-modal');
      showModal('confirm-password-modal');
      
      // Reset forgot password form
      document.getElementById('forgot-step-1').style.display = 'block';
      document.getElementById('forgot-step-2').style.display = 'none';
      clearPasswordFields();
    });
  }

  // Close success modal
  document.getElementById("modal-close-btn").addEventListener("click", function() {
    window.location.href = "/frontend/public/userprofile.html";
  });

  // Close error modal
  document.getElementById("error-modal-close-btn").addEventListener("click", function() {
    hideModal('error-modal');
  });

  // Close info modal  
  document.getElementById("info-modal-close-btn").addEventListener("click", function() {
    hideModal('info-modal');
  });

  // Optional: Remove picture logic
 document.getElementById("remove-pic").addEventListener("click", () => {
  document.getElementById("profile-pic").src = "/uploads/profile-pics/default.png";
  document.getElementById("upload-pic").value = "";
  removeProfileImage = true;
});

  // Optional: Take photo feature placeholder
  document.getElementById("take-pic").addEventListener("click", () => {
    showInfoModal("Camera capture feature is coming soon! For now, please use the upload option to add your profile picture.");
  });
 
  // === Navigation Bar Logic ===
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Default to index.html if path is empty

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
   // === USER AUTHENTICATION & PROFILE PICTURE ===
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
   // Try to fetch user profile if token exists
  fetch(`${BASE_URL}/api/users/profile`, {
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
         ? (user.profileImage.startsWith('http') ? user.profileImage : `${BASE_URL}${user.profileImage}`)
        : `${BASE_URL}/uploads/profile-pics/default.png`;

      // Set profile images
      const userIconImage = document.getElementById("profile-icon-img");
      if (userIconImage) userIconImage.src = profilePicUrl;

      const profilePic = document.getElementById("profile-pic");
      if (profilePic) profilePic.src = profilePicUrl;

      const feetVal = (user.height && user.height.feet) ? user.height.feet : "";
      const inchesVal = (user.height && user.height.inches) ? user.height.inches : "";
      
      // Detect Google user for password requirements
      isGoogleUser =
        (user.authProvider && user.authProvider === "google") ||
        (user.profileImage && user.profileImage.startsWith("http"));
      
      console.log('Is Google User:', isGoogleUser); // Debug log
      // === Set form fields with user data ===
      document.getElementById("first-name").value = user.firstName || "";
      document.getElementById("last-name").value = user.lastName || "";
      document.getElementById("username").value = user.username || "";
      document.getElementById("birthdate").value = user.birthdate ? user.birthdate.split('T')[0] : "";
      document.getElementById("phone").value = user.phone || "";
      document.getElementById("email").value = user.email || "";

      // Fitness Details (if available)
      document.getElementById("height-feet").value = (user.height && user.height.feet) ? user.height.feet : "";
      document.getElementById("height-inches").value = (user.height && user.height.inches) ? user.height.inches : "";
      document.getElementById("weight").value = user.weight || "";
      document.getElementById("fitness-level").value = user.fitnessLevel || "";
      document.getElementById("primary-goal").value = user.primaryGoal || "";
      
      document.getElementById("height-feet").placeholder = feetVal ? `${feetVal} feet` : "Feet";
      document.getElementById("height-inches").placeholder = inchesVal ? `${inchesVal} inches` : "Inches";
     
      // Workout Preferences (checkboxes)
      if (Array.isArray(user.workoutPreferences)) {
        document.querySelectorAll('input[name="workout-pref"]').forEach(checkbox => {
          checkbox.checked = user.workoutPreferences.includes(checkbox.value);
        });
      }

     

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
  
  
 
});
