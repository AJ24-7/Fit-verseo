// === NAVIGATION BAR: Toggle & Active Link Highlight ===
document.addEventListener('DOMContentLoaded', function () {
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
})
function logout() {
  localStorage.removeItem('token'); // only remove token if that's what you're using
  window.location.href = 'index.html';
}

// === HERO SECTION GSAP Animation ===
document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector("#hero-text")) {
    gsap.to("#hero-text", { opacity: 1, duration: 1 });
  }
  if (document.querySelector("#hero-subtext")) {
    gsap.to("#hero-subtext", { opacity: 1, duration: 1 });
  }
  if (document.querySelector(".btn")) {
    gsap.to(".btn", { scale: 1.2, duration: 1 });
  }
});
//gym search logic //
const userLocation = { lat: 28.357353, lng: 77.295289 };

function getDistance(loc1, loc2) {
  const R = 6371;
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function searchGyms() {
  // Show loading state
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Searching for gyms...</p>";
  // Hide gym counter until results arrive
  const gymCounter = document.getElementById("gymSearchCounter");
  if (gymCounter) gymCounter.style.display = "none";
  
  // Get search parameters from the form
  const city = document.getElementById("city").value.trim();
  const pincode = document.getElementById("pincode").value.trim();
  const maxPrice = document.getElementById("priceRange").value;
  
  // Get selected activities
  const activities = Array.from(document.querySelectorAll(".activity.active"))
    .map(div => div.dataset.activity);

  console.log("Search params:", { city, pincode, maxPrice, activities });

  // Build query parameters
  const params = new URLSearchParams();
  if (city) params.append('city', city);
  if (pincode) params.append('pincode', pincode);
  if (maxPrice) params.append('maxPrice', maxPrice);
  activities.forEach(activity => params.append('activities', activity));

  // Make the API call with query parameters
  fetch(`http://localhost:5000/api/gyms/search?${params.toString()}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(gyms => {
      console.log("Filtered gyms from backend:", gyms);
      
      // Calculate distances for sorting
      const gymsWithDistance = gyms.map(gym => {
        const distance = gym.location?.lat && gym.location?.lng && typeof userLocation !== "undefined"
          ? getDistance(userLocation, {
              lat: parseFloat(gym.location.lat),
              lng: parseFloat(gym.location.lng),
            })
          : 0;
          
        // Process activities for display
        let combinedActivities = [];
        if (gym.activities && Array.isArray(gym.activities)) {
          combinedActivities.push(...gym.activities);
        }
        if (gym.otherActivities) {
          if (Array.isArray(gym.otherActivities)) {
            combinedActivities.push(...gym.otherActivities);
          } else if (typeof gym.otherActivities === 'string') {
            combinedActivities.push(gym.otherActivities);
          }
        }
        const uniqueGymActivities = [...new Set(combinedActivities.map(a => String(a).toLowerCase()))]
          .filter(a => a && a.trim() !== '');
          
        return {
          ...gym,
          distance,
          processedActivities: uniqueGymActivities
        };
      });
      
      // Sort by distance
      const sortedGyms = gymsWithDistance.sort((a, b) => a.distance - b.distance);
      
      console.log("Processed gyms:", sortedGyms);
      showResults(sortedGyms);
      // Show gym counter with number of unique gyms
      const gymCounter = document.getElementById("gymSearchCounter");
      if (gymCounter) {
        gymCounter.textContent = `${sortedGyms.length} gym${sortedGyms.length !== 1 ? 's' : ''} found`;
        gymCounter.style.display = "inline-block";
      }
    })
    .catch(err => {
      console.error("Error searching gyms:", err);
      resultsDiv.innerHTML = "<p>Failed to load gyms. Please try again later.</p>";
      // Hide counter on error
      const gymCounter = document.getElementById("gymSearchCounter");
      if (gymCounter) gymCounter.style.display = "none";
    });
}

let visibleCount = 3;
let allGyms = [];

function showResults(gyms) {
  allGyms = gyms; // Store all gyms for later use
  visibleCount = 3; // Reset to 3 every search
  renderGymCards();
}

function renderGymCards() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  const gymsToShow = allGyms.slice(0, visibleCount);

  if (gymsToShow.length === 0) {
    resultsDiv.innerHTML = "<p>No matching gyms found.</p>";
    return;
  }

  gymsToShow.forEach(gym => {
    const card = document.createElement("div");
    card.className = "gym-card";

    // Create activity icons HTML using processed (de-duplicated) activities
    const activitiesToDisplay = gym.processedActivities || []; // Use processedActivities, fallback to empty array
    const activitiesHTML = activitiesToDisplay.length > 0
      ? `<div class="activity-icons">${activitiesToDisplay.map(activity => 
          `<span class="activity-icon"><i class="${getActivityIcon(activity)}"></i> ${activity}</span>`
        ).join('')}</div>`
      : "<p>No activities listed</p>";

    let fullLogoPath = 'https://via.placeholder.com/100x100.png?text=No+Logo'; // Default placeholder
    if (gym.logoUrl) {
        let logoPath = gym.logoUrl;
        if (!logoPath.startsWith('http')) { // If it's not a full external URL
            if (!logoPath.startsWith('/')) {
                logoPath = '/' + logoPath; // e.g., images/default.png -> /images/default.png
            }
            // Ensure the path is relative to /uploads if it's not already.
            // This handles cases like "image.png" or "/image.png" becoming "/uploads/image.png"
            // And "/uploads/image.png" remaining "/uploads/image.png"
            if (!logoPath.startsWith('/uploads/')) {
                 // If logoPath is like "/somefolder/image.png", it becomes "/uploads/somefolder/image.png"
                 // If logoPath is like "image.png", it becomes "/uploads/image.png"
                logoPath = '/uploads' + (logoPath.startsWith('/') ? logoPath : '/' + logoPath);
            }
            fullLogoPath = `http://localhost:5000${logoPath}?${new Date().getTime()}`;
        } else {
            fullLogoPath = `${logoPath}?${new Date().getTime()}`;
        }
    }

    card.innerHTML = `
      <img src="${fullLogoPath}" alt="${gym.gymName} Logo" class="gym-card-logo">
      <div class="gym-card-details">
        <h3>${gym.gymName}</h3>
        <p>City: ${gym.location?.city || "N/A"} | Pincode: ${gym.location?.pincode || "N/A"}</p>
        <p>Distance: ${gym.distance ? gym.distance.toFixed(2) : "N/A"} km</p>
        <p>Price: ₹${gym.membershipPlans?.basic?.price || "N/A"}</p>
        ${activitiesHTML}
        <a href="gymdetails.html?gymId=${gym._id}">
          <button class="view-full-btn">View Full Profile</button>
        </a>
      </div>
    `;

    resultsDiv.appendChild(card);
  });

  // Add Show More button if needed
  if (visibleCount < allGyms.length) {
    const showMoreBtn = document.createElement("button");
    showMoreBtn.textContent = "Show More";
    showMoreBtn.className = "show-more-btn";
    showMoreBtn.onclick = () => {
      visibleCount += 3;
      renderGymCards();
    };
    resultsDiv.appendChild(showMoreBtn);
  }
}

// Helper function to get Font Awesome icon classes for activities
function getActivityIcon(activityName) {
  const name = String(activityName).toLowerCase(); // Ensure activityName is a string
  if (name.includes('yoga')) return 'fas fa-spa';
  if (name.includes('zumba')) return 'fas fa-users';
  if (name.includes('cardio')) return 'fas fa-heartbeat';
  if (name.includes('weight') || name.includes('strength') || name.includes('lifting')) return 'fas fa-dumbbell';
  if (name.includes('crossfit')) return 'fas fa-fire';
  if (name.includes('spinning') || name.includes('cycle')) return 'fas fa-biking';
  if (name.includes('pilates')) return 'fas fa-om';
  if (name.includes('boxing')) return 'fas fa-fist-raised'; // May require Font Awesome Pro
  if (name.includes('kickboxing')) return 'fas fa-user-ninja'; // Placeholder
  if (name.includes('swimming') || name.includes('swim')) return 'fas fa-swimmer';
  if (name.includes('dance')) return 'fas fa-music'; // Placeholder
  if (name.includes('aerobics')) return 'fas fa-running';
  if (name.includes('martial arts')) return 'fas fa-user-shield'; // Placeholder
  return 'fas fa-star'; // Default icon
}

// === SLIDER ===
let index = 0;

function moveSlide(step) {
  const slider = document.querySelector('.slider');
  const totalImages = slider.children.length;

  index += step;

  if (index >= totalImages) index = 0;
  if (index < 0) index = totalImages - 1;

  slider.style.transform = `translateX(${-index * 100}%)`;
}

setInterval(() => moveSlide(1), 4000);

// === SLIDER TEXT ANIMATION ON SCROLL ===
document.addEventListener("DOMContentLoaded", function () {
  const textElement = document.querySelector(".slider-text");

  function handleScroll() {
    const position = textElement.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (position < windowHeight - 100) {
      textElement.style.animation = "slideInFromLeft 1s ease-in-out forwards";
    }
  }

  window.addEventListener("scroll", handleScroll);
  handleScroll();
});
// === MULTI-ACTIVITY FILTER ===
function setupActivityFilter() {
  document.querySelectorAll('.activity').forEach(activityDiv => {
    activityDiv.addEventListener('click', function () {
      this.classList.toggle('active');
      performSearch(); // Update the gym list based on selected activities
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupActivityFilter();
});
// === MISC EVENTS ===
document.getElementById("priceRange").addEventListener("input", function () {
  document.getElementById("priceValue").textContent = `₹${this.value}`;
});


document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  const userNav = document.getElementById("user-profile-nav");
  const loginNav = document.getElementById("login-signup-nav");

  // Default states
  if (userNav) userNav.style.display = "none";
  if (loginNav) loginNav.style.display = "none";

  if (!token) {
    // 🔐 Not logged in: show login/signup
    if (loginNav) loginNav.style.display = "block";
    return;
  }

  // ✅ Try to fetch user profile if token exists
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

      // 👤 Show profile dropdown, hide login
      if (userNav) userNav.style.display = "block";
      if (loginNav) loginNav.style.display = "none";
    })
    .catch(error => {
      console.error("Error fetching user:", error.message);
      // 🔐 Failed to authenticate, show login
      if (loginNav) loginNav.style.display = "block";
    });
});
// Fallback for touch devices
document.addEventListener('DOMContentLoaded', function() {
  const settingsOptions = document.querySelectorAll('.settings-option');
  
  settingsOptions.forEach(option => {
    // For mouse users
    option.addEventListener('mouseenter', function() {
      this.querySelector('.settings-submenu').style.display = 'block';
    });
    
    option.addEventListener('mouseleave', function() {
      this.querySelector('.settings-submenu').style.display = 'none';
    });
    
    // For touch devices
    option.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) { // Mobile devices
        e.preventDefault();
        const submenu = this.querySelector('.settings-submenu');
        submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
      }
    });
  });
});
