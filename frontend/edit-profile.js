function logout() {
  localStorage.removeItem('token'); 
  window.location.href = 'index.html';
}
let isGoogleUser = false;
document.addEventListener("DOMContentLoaded", () => {
  let removeProfileImage = false;
  let currentStep = 1;
  const totalSteps = 3;
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
      input.type = input.type === "password" ? "text" : "password";
      toggle.innerHTML = input.type === "password"
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>';
    });
  });

  // Submit Form
  const editForm = document.getElementById("edit-profile-form");

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // Basic Info
    formData.append("firstName", document.getElementById("first-name").value);
    formData.append("lastName", document.getElementById("last-name").value);
    formData.append("username", document.getElementById("username").value);
    formData.append("birthdate", document.getElementById("birthdate").value);
    formData.append("phone", document.getElementById("phone").value);
    formData.append("email", document.getElementById("email").value);
    
     // Profile Image: append the file if selected
  const uploadPicInput = document.getElementById("upload-pic");
  if (uploadPicInput.files && uploadPicInput.files[0]) {
    formData.append("profileImage", uploadPicInput.files[0]);
  }
    if (removeProfileImage) {
  formData.append("removeProfileImage", "true");
}
    // Fitness Details
    formData.append("heightFeet", document.getElementById("height-feet").value);
    formData.append("heightInches", document.getElementById("height-inches").value);
    formData.append("weight", document.getElementById("weight").value);
    formData.append("fitnessLevel", document.getElementById("fitness-level").value);
    formData.append("primaryGoal", document.getElementById("primary-goal").value);

    const workoutPrefs = [];
    document.querySelectorAll('input[name="workout-pref"]:checked').forEach(checkbox => {
      workoutPrefs.push(checkbox.value);
    });
    workoutPrefs.forEach(pref => formData.append("workoutPreferences", pref));

    // Preferences
    formData.append("theme", document.getElementById("theme").value);
    formData.append("measurementSystem", document.getElementById("measurement-system").value);
    formData.append("notifications", document.getElementById("notifications").value);
    formData.append("twoFactorEnabled", document.getElementById("two-factor-toggle").checked);

  if (!isGoogleUser) {
  formData.append("confirmPassword", document.getElementById("confirm-password").value);
  const newPassword = document.getElementById("new-password").value;
  const confirmNewPassword = document.getElementById("confirm-new-password").value;
  if (newPassword || confirmNewPassword) {
      formData.append("newPassword", newPassword);
      formData.append("confirmNewPassword", confirmNewPassword);
  }
}
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("User not authenticated. Please log in again.");
        return;
      }
      for (let [key, value] of formData.entries()) {
  console.log(key, value);
}
      const response = await fetch("http://localhost:5000/api/users/update-profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
          // No 'Content-Type' here; it will be set automatically by FormData
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        document.getElementById("success-modal").style.display = "block";
      } else {
        alert(result.message || result.error || "Something went wrong while updating.");
      }

    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    }
  });

  // Close success modal
  document.getElementById("modal-close-btn").addEventListener("click", function() {
    window.location.href = "/frontend/public/userprofile.html";
});

  // Optional: Remove picture logic
 document.getElementById("remove-pic").addEventListener("click", () => {
  document.getElementById("profile-pic").src = "/uploads/profile-pics/default.png";
  document.getElementById("upload-pic").value = "";
  removeProfileImage = true;
});

  // Optional: Take photo feature placeholder
  document.getElementById("take-pic").addEventListener("click", () => {
    alert("Camera capture not implemented yet!");
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

      // Set profile images
      const userIconImage = document.getElementById("profile-icon-img");
      if (userIconImage) userIconImage.src = profilePicUrl;

      const profilePic = document.getElementById("profile-pic");
      if (profilePic) profilePic.src = profilePicUrl;

      const feetVal = (user.height && user.height.feet) ? user.height.feet : "";
      const inchesVal = (user.height && user.height.inches) ? user.height.inches : "";
      
      // Hide confirm password and change password fields for Google users
isGoogleUser =
  (user.authProvider && user.authProvider === "google") ||
  (user.profileImage && user.profileImage.startsWith("http"));
  if (isGoogleUser) {
  // Hide the entire input-group containing confirm password
  const confirmPasswordInput = document.getElementById("confirm-password");
  if (confirmPasswordInput) {
    const confirmPasswordGroup = confirmPasswordInput.closest(".input-group");
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = "none";
    confirmPasswordInput.disabled = true; // <-- Add this line
  }
  // Hide the entire change password section
  const changePasswordSection = document.querySelector(".password-section");
  if (changePasswordSection) changePasswordSection.style.display = "none";
}
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

      // Preferences
      document.getElementById("theme").value = user.theme || "light";
      document.getElementById("measurement-system").value = user.measurementSystem || "imperial";
      document.getElementById("notifications").value = user.notifications || "all";
      document.getElementById("two-factor-toggle").checked = !!user.twoFactorEnabled;

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

document.getElementById("toggle-change-password").addEventListener("click", function() {
    const fields = document.getElementById("change-password-fields");
    fields.style.display = fields.style.display === "none" ? "block" : "none";
});
 
});
