document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem('token');

  // ✅ Redirect if not logged in
  if (!token) {
    console.warn('No token found in localStorage. Redirecting to login...');
    window.location.href = '/frontend/public/login.html';
    return;
  }
  // === NAVIGATION BAR: Toggle & Active Link Highlight ===
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

  // ✅ Fetch user profile
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
      // Basic info
      document.getElementById("username").textContent = user.username || user.name || 'User';
      document.getElementById("useremail").textContent = user.email || 'N/A';
      document.getElementById("userphone").textContent = user.phone || 'N/A';

      // Profile picture
      const profilePicUrl = user.profileImage
        ? (user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`)
        : `http://localhost:5000/uploads/profile-pics/default.png`;
      document.getElementById("profileImage").src = profilePicUrl;
      const userIconImage = document.getElementById("profile-icon-img");
      if (userIconImage) userIconImage.src = profilePicUrl;

      // === ACTIVITY PREFERENCES ===
      const prefContainer = document.querySelector('.preference-tags');
      if (prefContainer) {
        prefContainer.innerHTML = '';
        if (user.workoutPreferences && user.workoutPreferences.length > 0) {
          user.workoutPreferences.forEach(pref => {
            // Choose icon based on preference
            let iconClass = "fas fa-dumbbell";
            if (/cardio/i.test(pref)) iconClass = "fas fa-running";
            else if (/yoga/i.test(pref)) iconClass = "fas fa-spa";
            else if (/crossfit/i.test(pref)) iconClass = "fas fa-fire";
            else if (/hiit/i.test(pref)) iconClass = "fas fa-biking";
            else if (/pilates/i.test(pref)) iconClass = "fas fa-weight-hanging";
            prefContainer.innerHTML += `<span class="tag active"><i class="${iconClass}"></i> ${pref}</span>`;
          });
        } else {
          prefContainer.innerHTML = '<span class="tag">No preferences set</span>';
        }
      }

      // === DIET PLAN ===
      if (user.dietPlan) {
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
        mealTypes.forEach(meal => {
          // Find the meal card for this meal
          const mealCard = Array.from(document.querySelectorAll('.meal-card')).find(card =>
            card.querySelector('.meal-header h4') &&
            card.querySelector('.meal-header h4').textContent.trim().toLowerCase() === meal
          );
         
        });
      }

     
    })
    .catch(err => {
      console.error('❌ Error fetching profile:', err);
      alert('Failed to load profile. Please try logging in again.');
      window.location.href = '/frontend/public/login.html';
    });

  // Fetch user diet plan from dietController
  fetch('http://localhost:5000/api/diet/my-plan', {
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
  .then(plan => {
    console.log("Fetched diet plan:", plan); // Debug
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    mealTypes.forEach(meal => {
      const mealCard = Array.from(document.querySelectorAll('.meal-card')).find(card =>
        card.querySelector('.meal-header h4') &&
        card.querySelector('.meal-header h4').textContent.trim().toLowerCase() === meal
      );
      if (mealCard && plan.selectedMeals && plan.selectedMeals[meal]) {
  const mealItems = mealCard.querySelector('.meal-items');
  const caloriesSpan = mealCard.querySelector('.calories');
  const items = plan.selectedMeals[meal];

  if (mealItems) {
    mealItems.innerHTML = items
      .map(item => `<li>${item.name} <span class="cal">${item.calories} kcal</span></li>`)
      .join('');
  }

  // Calculate and display total calories for this meal
  if (caloriesSpan) {
    const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
    caloriesSpan.textContent = `${totalCalories} cal`;
  }
}
    });
  })
  .catch(err => {
    console.warn('No diet plan found or error fetching diet plan:', err);
    // Optionally, show a message in the UI
  });
  // --- Workout Schedule Creator Logic ---

const daysOfWeek = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

let workoutSchedule = {}; // { Monday: [ {type, duration, time, tag}, ... ], ... }
let currentDay = "Monday";

// Initialize schedule with empty arrays
daysOfWeek.forEach(day => workoutSchedule[day] = []);

// UI Elements
const dayPills = document.querySelectorAll('.day-pill');
const workoutForm = document.querySelector('.workout-form');
const addBtn = document.querySelector('.btn-add');
const scheduleBuilder = document.querySelector('.schedule-builder');
const scheduledWorkoutsDiv = document.querySelector('.scheduled-workouts');
const saveBtn = document.querySelector('.btn-save-schedule');
const suggestBtn = document.querySelector('.btn-suggest');
const clearBtn = document.querySelector('.btn-clear');

// Helper: Render workouts for the current day
function renderWorkoutsForDay(day) {
  const workoutList = document.getElementById('workout-list');
  const header = document.getElementById('workout-day-header');
  if (header) header.innerHTML = `<i class="fas fa-list"></i> ${day}'s Workouts`;
  if (!workoutList) return;
  workoutList.innerHTML = '';
  if (!workoutSchedule[day] || workoutSchedule[day].length === 0) {
    workoutList.innerHTML = '<li class="empty">No workouts scheduled.</li>';
    return;
  }
  workoutSchedule[day].forEach((w, idx) => {
    workoutList.innerHTML += `
      <li>
        <strong>${w.type}</strong> - ${w.duration}, ${w.time}
        ${w.tag ? `<span class="tag">${w.tag}</span>` : ''}
        <button class="btn-remove" data-idx="${idx}" data-day="${day}"><i class="fas fa-trash"></i></button>
      </li>
    `;
  });
  // remove listeners
  workoutList.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = +this.getAttribute('data-idx');
      const day = this.getAttribute('data-day');
      workoutSchedule[day].splice(idx, 1);
      renderWorkoutsForDay(day);
    });
  });
}

// Switch day pills
dayPills.forEach(pill => {
  pill.addEventListener('click', function() {
    dayPills.forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    currentDay = this.getAttribute('data-day');
    // Update scheduled-workouts header and list
    scheduledWorkoutsDiv.querySelector('h4').innerHTML = `<i class="fas fa-list"></i> ${currentDay}'s Workouts`;
    renderWorkoutsForDay(currentDay);
  });
});

// Add workout to current day
if (addBtn) {
  addBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const type = document.getElementById('exercise-type').value;
    const duration = document.getElementById('exercise-duration').value;
    const time = document.getElementById('exercise-time').value;
    const tag = workoutForm.querySelector('input[type="text"]').value.trim();
    if (!type || type === "Select Exercise") {
      alert("Please select an exercise type.");
      return;
    }
    workoutSchedule[currentDay].push({ type, duration, time, tag });
    renderWorkoutsForDay(currentDay);
    // Optionally clear form
    workoutForm.reset();
  });
}

// Suggest workout (simple random suggestion)
if (suggestBtn) {
  suggestBtn.addEventListener('click', function() {
    const exercises = ["Back", "Biceps", "Chest", "Cardio", "Triceps", "Shoulders", "Legs", "Abs"];
    const type = exercises[Math.floor(Math.random() * exercises.length)];
    const duration = ["30 minutes", "45 minutes", "60 minutes", "90 minutes"][Math.floor(Math.random() * 4)];
    const time = ["Morning", "Evening"][Math.floor(Math.random() * 2)];
    workoutSchedule[currentDay].push({ type, duration, time, tag: "" });
    renderWorkoutsForDay(currentDay);
  });
}

// Clear all workouts for current day
if (clearBtn) {
  clearBtn.addEventListener('click', function() {
    if (confirm(`Clear all workouts for ${currentDay}?`)) {
      workoutSchedule[currentDay] = [];
      renderWorkoutsForDay(currentDay);
    }
  });
}

// Save schedule to backend
if (saveBtn) {
  saveBtn.addEventListener('click', async function() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/workout-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schedule: workoutSchedule })
      });
      const result = await response.json();
      if (response.ok) {
        // Replace builder with display
        displaySavedSchedule(result.schedule || workoutSchedule);
      } else {
        alert(result.message || "Failed to save schedule.");
      }
    } catch (err) {
      alert("Error saving schedule.");
    }
  });
}

// Helper to get current day as "Monday", "Tuesday", etc.
function getTodayName() {
  const idx = new Date().getDay(); // 0 (Sun) - 6 (Sat)
  // Your daysOfWeek starts with Monday, so map 0 (Sun) to 6, 1 (Mon) to 0, etc.
  return daysOfWeek[idx === 0 ? 6 : idx - 1];
}

// Display only today's schedule after saving
function displaySavedSchedule(schedule) {
  if (!scheduleBuilder) return;
  // Hide/minimize the scheduler UI
  scheduleBuilder.style.display = "none";
  if (saveBtn) saveBtn.style.display = "none";
  // Show only today's schedule
  const today = getTodayName();
  let displayDiv = document.getElementById('today-workout-display');
  if (!displayDiv) {
    displayDiv = document.createElement('div');
    displayDiv.id = 'today-workout-display';
    scheduleBuilder.parentNode.insertBefore(displayDiv, scheduleBuilder.nextSibling);
  }
  displayDiv.innerHTML = `
    <div class="saved-schedule">
      <h4 style="margin-bottom:1rem;"><i class="fas fa-calendar-alt"></i> ${today}'s Workout Schedule</h4>
      <ul>
        ${
          (schedule[today] && schedule[today].length)
            ? schedule[today].map(w =>
                `<li><strong>${w.type}</strong> - ${w.duration}, ${w.time} ${w.tag ? `<span class="tag">${w.tag}</span>` : ''}</li>`
              ).join('')
            : '<li class="empty">No workouts scheduled for today.</li>'
        }
      </ul>
      <button class="btn" id="edit-schedule-btn">Edit Schedule</button>
    </div>
  `;
  // Edit button to bring back the scheduler
  document.getElementById('edit-schedule-btn').onclick = function() {
    displayDiv.remove();
    scheduleBuilder.style.display = "";
    if (saveBtn) saveBtn.style.display = "";
  };
  
}

// --- Fetch and render workout schedule from server ---
async function fetchAndRenderWorkoutSchedule() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/users/workout-schedule', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) return;
    const result = await response.json();
    if (result.schedule) {
      workoutSchedule = result.schedule;
      // Show only today's schedule and hide the builder
      displaySavedSchedule(result.schedule);
    }
  } catch (err) {
    // Optionally handle error
  }
}

// Call this after DOMContentLoaded and after you define all the DOM elements and helper functions
fetchAndRenderWorkoutSchedule();

  // ✅ Add interactive elements
  const profileImage = document.getElementById("profileImage");
  if (profileImage) {
    profileImage.addEventListener("mouseenter", function() {
      this.style.boxShadow = "0 0 15px rgba(52, 152, 219, 0.5)";
    });
    profileImage.addEventListener("mouseleave", function() {
      this.style.boxShadow = "none";
    });
  }

 
});

// ✅ Helper functions
function getActivityIcon(activityType) {
  const icons = {
    cardio: "🏃",
    strength: "💪",
    yoga: "🧘",
    crossfit: "🔥",
    zumba: "💃",
    swimming: "🏊",
    cycling: "🚴",
    default: "🏋️"
  };
  
  return icons[activityType.toLowerCase()] || icons.default;
}

function formatActivityDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return "Today, " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday, " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString() + ", " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ✅ Logout Function
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/frontend/index.html";
}