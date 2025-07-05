 document.addEventListener("DOMContentLoaded", function() {
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
      
      
      // Goal selection
      const goalCards = document.querySelectorAll(".goal-card");
      goalCards.forEach(card => {
        card.addEventListener("click", function() {
          goalCards.forEach(c => c.classList.remove("active"));
          this.classList.add("active");
        });
      });
      const goalKeyMap = {
  "weight-loss": "weightLoss",
  "muscle-gain": "muscleGain",
  "maintenance": "maintenance"
};
      // Gender change detection
      const genderSelect = document.getElementById("gender");
      const womensHealthSection = document.getElementById("womens-health");
      
      genderSelect.addEventListener("change", function() {
        if (this.value === "female") {
          womensHealthSection.style.display = "block";
        } else {
          womensHealthSection.style.display = "none";
        }
      });

      // Budget filter selection
      const budgetBtns = document.querySelectorAll(".budget-btn");
      budgetBtns.forEach(btn => {
        btn.addEventListener("click", function(e) {
          e.preventDefault();
          budgetBtns.forEach(b => b.classList.remove("active"));
          this.classList.add("active");
          updateMealPlan(this.dataset.budget);
        });
      });

      // Meal plans by budget
    const mealPlans = {
  weightLoss: {
    low: {
      breakfast: [
        { name: "Oats porridge", calories: 220, price: "₹30" },
        { name: "Boiled eggs (2)", calories: 140, price: "₹20" },
        {name: "poha with veggies", calories: 180, price: "₹15" },
        {name: "Moong dal chilla (2)", calories: 200, price: "₹25" }
      ],
      lunch: [
        { name: "Mixed veg salad", calories: 150, price: "₹40" },
        { name: "Dal with 1 roti", calories: 200, price: "₹30" },
        { name: "Indian green veggies with roti", calories: 250, price: "₹35" }
      ],
      dinner: [
        { name: "Mixed Dal with 2 rotis", calories: 350, price: "₹40" },
        { name: "Vegetable soup", calories: 150, price: "₹20" },
        { name: "Paneer bhurji with roti", calories: 300, price: "₹50" }

      ],
      snacks: [
        { name: "Roasted makhana", calories: 100, price: "₹25" },
        { name: "Roasted chana", calories: 150, price: "₹20" },
        { name: "Fruit salad", calories: 120, price: "₹30" }
      ]
    },
    medium: {
      breakfast: [
        { name: "Vegetable upma", calories: 300, price: "₹60" },
        { name: "Besan chilla (2)", calories: 250, price: "₹50" },
        { name: "Vegetable sandwich", calories: 280, price: "₹70" }
      ],
      lunch: [
        { name: "Brown rice + sabzi", calories: 350, price: "₹70" },
        { name: "Mixed vegetable curry with roti", calories: 400, price: "₹80" },
        { name: "Chickpea salad", calories: 300, price: "₹60" }
      ],
      dinner: [
        { name: "Paneer salad", calories: 280, price: "₹80" },
        { name: "boiled salad", calories: 200, price: "₹50" },
        { name: "Vegetable khichdi", calories: 350, price: "₹70" },
        { name: "Vegetable soup", calories: 150, price: "₹20" }

      ],
      snacks: [
        { name: "Dry fruits", calories: 150, price: "₹50" },
        { name: "Greek yogurt", calories: 200, price: "₹60" },
        { name: "Roasted seeds mix", calories: 180, price: "₹40" }
      ]
    },
    high: {
      breakfast: [
        { name: "Smoothie bowl", calories: 350, price: "₹90" },
        { name: "Vegetable poha", calories: 300, price: "₹70" },
        { name: "Avocado toast", calories: 400, price: "₹100" }
      ],
      lunch: [
        { name: "Grilled tofu bowl", calories: 400, price: "₹120" },
        { name: "Quinoa salad", calories: 450, price: "₹130" },
        { name: "Vegetable biryani", calories: 500, price: "₹150" }
      ],
      dinner: [
        { name: "Lentil soup + salad", calories: 300, price: "₹100" },
        { name: "Stuffed bell peppers", calories: 350, price: "₹120" },
        { name: "Vegetable stir-fry with tofu", calories: 400, price: "₹140" }
      ],
      snacks: [
        { name: "Protein bar", calories: 200, price: "₹80" },
        { name: "Hummus with veggies", calories: 250, price: "₹70" },
        { name: "Fruit smoothie", calories: 300, price: "₹90" }
      ]
    }
  },

  muscleGain: {
    low: {
      breakfast: [
        { name: "Peanut butter sandwich", calories: 400, price: "₹30" },
        { name: "Egg omelette (3 eggs)", calories: 300, price: "₹50" },
        { name: "Oats with milk", calories: 350, price: "₹40" }
      ],
      lunch: [
        { name: "Rice + rajma + curd", calories: 600, price: "₹50" },
        { name: "Dal + Rice", calories: 500, price: "₹40" },
        { name: "Paneer bhurji + roti", calories: 550, price: "₹60" }
      ],
      dinner: [
        { name: "Egg curry + roti", calories: 500, price: "₹70" },
        { name: "Chicken soup", calories: 400, price: "₹60" },
        { name: "Paneer tikka + roti", calories: 550, price: "₹80" }
      ],
      snacks: [
        { name: "Banana shake", calories: 300, price: "₹50" },
        { name: "Roasted peanuts", calories: 200, price: "₹30" },
        { name: "Roasted chana", calories: 250, price: "₹30" }
      ]
    },
    medium: {
      breakfast: [
        { name: "Paneer paratha + curd", calories: 550, price: "₹90" },
        { name: "Vegetable sandwich", calories: 400, price: "₹70" },
        { name: "Egg bhurji + toast", calories: 500, price: "₹80" }
      ],
      lunch: [
        { name: "Chicken biryani", calories: 700, price: "₹120" },
        { name: "Paneer tikka masala + naan", calories: 600, price: "₹100" },
        { name: "Fish curry + rice", calories: 650, price: "₹110" }
      ],
      dinner: [
        { name: "Grilled chicken + salad", calories: 600, price: "₹130" },
        { name: "Vegetable stir-fry + rice", calories: 500, price: "₹90" },
        { name: "Egg fried rice", calories: 550, price: "₹100" }

      ],
      snacks: [
        { name: "Protein shake", calories: 250, price: "₹100" },
        { name: "Mixed nuts", calories: 300, price: "₹80" },
        { name: "Greek yogurt with honey", calories: 200, price: "₹70" }
      ]
    },
    high: {
      breakfast: [
        { name: "Omelette (4 eggs) + toast", calories: 600, price: "₹100" },
        { name: "Protein pancakes", calories: 500, price: "₹120" },
        { name: "Smoothie with protein powder", calories: 450, price: "₹90" }
      ],
      lunch: [
        { name: "Mutton curry + rice", calories: 850, price: "₹180" },
        { name: "Chicken tikka + naan", calories: 700, price: "₹150" },
        { name: "Paneer butter masala + rice", calories: 750, price: "₹140" }
      ],
      dinner: [
        { name: "Chicken pasta + salad", calories: 700, price: "₹160" },
        { name: "Fish curry + quinoa", calories: 650, price: "₹150" },
        { name: "Egg curry + paratha", calories: 600, price: "₹130" }
      ],
      snacks: [
        { name: "Dry fruits laddoo", calories: 300, price: "₹80" },
        { name: "Protein bar", calories: 250, price: "₹90" },
        { name: "Hummus with pita bread", calories: 200, price: "₹70" }
      ]
    }
  },

  maintenance: {
    low: {  breakfast: [
      { name: "Poha", calories: 250, price: "₹40" },
      { name: "Idli with sambar (2)", calories: 300, price: "₹50" },
      { name: "Banana and milk", calories: 200, price: "₹30" }
    ],
    lunch: [
      { name: "Dal with chapati", calories: 350, price: "₹60" },
      { name: "Vegetable pulao", calories: 400, price: "₹70" },
      { name: "Curd", calories: 100, price: "₹20" }
    ],
    dinner: [
      { name: "Khichdi", calories: 350, price: "₹60" },
      { name: "Mixed vegetable curry with roti", calories: 300, price: "₹70" },
      { name: "Buttermilk", calories: 60, price: "₹15" }
    ],
    snacks: [
      { name: "Roasted chana", calories: 150, price: "₹20" },
      { name: "Fruit bowl", calories: 120, price: "₹40" }
    ] },
    medium: {  breakfast: [
      { name: "Masala dosa", calories: 400, price: "₹70" },
      { name: "Stuffed paratha with curd", calories: 500, price: "₹80" },
      { name: "Upma with coconut chutney", calories: 350, price: "₹60" }
    ],
    lunch: [
      { name: "Rajma chawal", calories: 500, price: "₹90" },
      { name: "Paneer bhurji with chapati", calories: 450, price: "₹100" },
      { name: "Green salad", calories: 80, price: "₹30" }
    ],
    dinner: [
      { name: "Vegetable biryani with raita", calories: 600, price: "₹110" },
      { name: "Chapati with soya curry", calories: 400, price: "₹90" },
      { name: "Kheer", calories: 250, price: "₹50" }
    ],
    snacks: [
      { name: "Dry fruits mix", calories: 250, price: "₹60" },
      { name: "Paneer tikka", calories: 300, price: "₹90" }
    ] },
    high: {  breakfast: [
      { name: "Chole bhature", calories: 600, price: "₹100" },
      { name: "Aloo puri", calories: 550, price: "₹90" },
      { name: "Paneer sandwich", calories: 500, price: "₹100" }
    ],
    lunch: [
      { name: "Butter chicken with naan", calories: 800, price: "₹180" },
      { name: "Mutton biryani", calories: 900, price: "₹200" },
      { name: "Gulab jamun (2)", calories: 300, price: "₹40" }
    ],
    dinner: [
      { name: "Fish curry with rice", calories: 700, price: "₹170" },
      { name: "Chicken tikka with salad", calories: 600, price: "₹160" },
      { name: "Fruit custard", calories: 300, price: "₹50" }
    ],
    snacks: [
      { name: "Protein shake", calories: 300, price: "₹120" },
      { name: "Stuffed dry fruits ladoo", calories: 200, price: "₹80" }
    ]  }
  }
};
    // === Meal Card Expand/Collapse ===
document.querySelectorAll('.meal-header').forEach(header => {
  header.addEventListener('click', function() {
    // Toggle active class on header
    this.classList.toggle('active');
    // Toggle expanded class on the next sibling (.meal-content)
    const content = this.nextElementSibling;
    if (content && content.classList.contains('meal-content')) {
      content.classList.toggle('expanded');
    }
  });
});

   function updateMealPlan(budget) {
  const selectedGoal = document.querySelector(".goal-card.active")?.dataset.goal;
  const mappedGoal = goalKeyMap[selectedGoal];
  if (!mappedGoal || !mealPlans[mappedGoal] || !mealPlans[mappedGoal][budget]) return;

  const plan = mealPlans[mappedGoal][budget];

  // Update breakfast
  const breakfastEl = document.getElementById("breakfast-meal");
  breakfastEl.innerHTML = '';
  plan.breakfast.forEach(item => {
  const priceClass = item.price.length <= 2 ? 'price-low' : 'price-high';
  breakfastEl.innerHTML += `
    <div class="food-item meal-selectable">
      <label>
        <input type="checkbox" class="meal-checkbox" data-meal-type="breakfast" data-name="${item.name}" data-calories="${item.calories}" data-price="${item.price}">
        ${item.name} <span class="price-indicator ${priceClass}">${item.price}</span>
      </label>
      <span>${item.calories} kcal</span>
    </div>`;
});


  // Update lunch
  const lunchEl = document.getElementById("lunch-meal");
  lunchEl.innerHTML = '';
  plan.lunch.forEach(item => {
    const priceClass = item.price.length <= 2 ? 'price-low' : 'price-high';
    lunchEl.innerHTML += `
      <div class="food-item meal-selectable">
        <label>
          <input type="checkbox" class="meal-checkbox" data-meal-type="lunch" data-name="${item.name}" data-calories="${item.calories}" data-price="${item.price}">
          ${item.name} <span class="price-indicator ${priceClass}">${item.price}</span>
        </label>
        <span>${item.calories} kcal</span>
      </div>`;
  });

  // Update dinner
  const dinnerEl = document.getElementById("dinner-meal");
  dinnerEl.innerHTML = '';
  plan.dinner.forEach(item => {
    const priceClass = item.price.length <= 2 ? 'price-low' : 'price-high';
    dinnerEl.innerHTML += `
      <div class="food-item meal-selectable">
        <label>
          <input type="checkbox" class="meal-checkbox" data-meal-type="dinner" data-name="${item.name}" data-calories="${item.calories}" data-price="${item.price}">
          ${item.name} <span class="price-indicator ${priceClass}">${item.price}</span>
        </label>
        <span>${item.calories} kcal</span>
      </div>`;
  });

  // Update snacks
  const snacksEl = document.getElementById("snacks-meal");
  snacksEl.innerHTML = '';
  plan.snacks.forEach(item => {
    const priceClass = item.price.length <= 2 ? 'price-low' : 'price-high';
    snacksEl.innerHTML += `
      <div class="food-item meal-selectable">
        <label>
          <input type="checkbox" class="meal-checkbox" data-meal-type="snacks" data-name="${item.name}" data-calories="${item.calories}" data-price="${item.price}">
          ${item.name} <span class="price-indicator ${priceClass}">${item.price}</span>
        </label>
        <span>${item.calories} kcal</span>
      </div>`;
  });
}





      // Diet calculator form
      const dietForm = document.getElementById("diet-calculator");
      const resultsSection = document.getElementById("results");
      
      dietForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        // Get form values
        const gender = document.getElementById("gender").value;
        const age = parseInt(document.getElementById("age").value);
        const height = parseInt(document.getElementById("height").value);
        const weight = parseInt(document.getElementById("weight").value);
        const activity = parseFloat(document.getElementById("activity").value);
        const goalIntensity = parseFloat(document.getElementById("goal-intensity").value);
        const selectedGoal = document.querySelector(".goal-card.active").dataset.goal;
        
        // Calculate BMI
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        document.getElementById("bmi").textContent = bmi.toFixed(1);
        
        // Set BMI category
        const bmiCategory = document.getElementById("bmi-category");
        if (bmi < 18.5) {
          bmiCategory.textContent = "Underweight";
        } else if (bmi >= 18.5 && bmi < 25) {
          bmiCategory.textContent = "Normal weight";
        } else if (bmi >= 25 && bmi < 30) {
          bmiCategory.textContent = "Overweight";
        } else {
          bmiCategory.textContent = "Obese";
        }
        
        // Calculate BMR (Basal Metabolic Rate)
        let bmr;
        if (gender === "male") {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        
        // Calculate TDEE (Total Daily Energy Expenditure)
        const tdee = bmr * activity;
        
        // Adjust calories based on goal
        let calories;
        if (selectedGoal === "weight-loss") {
          calories = tdee * goalIntensity;
        } else if (selectedGoal === "muscle-gain") {
          calories = tdee * 1.1; // 10% surplus for muscle gain
        } else {
          calories = tdee; // maintenance
        }
        
        // Calculate macros
        const protein = (selectedGoal === "muscle-gain" ? 2.2 : 1.8) * weight;
        const fats = (0.25 * calories) / 9; // 25% of calories from fat
        const carbs = (calories - (protein * 4) - (fats * 9)) / 4;
        
        // Update results
        document.getElementById("calories").textContent = Math.round(calories);
        document.getElementById("protein").textContent = Math.round(protein);
        document.getElementById("carbs").textContent = Math.round(carbs);
        document.getElementById("fats").textContent = Math.round(fats);
        
        // Show results and update meal plan
        resultsSection.style.display = "block";
       const defaultBudgetBtn = document.querySelector(".budget-btn.active") || document.querySelector(".budget-btn[data-budget='low']");
       updateMealPlan(defaultBudgetBtn.dataset.budget);

       document.addEventListener("change", function (e) {
  if (e.target.classList.contains("meal-checkbox")) {
    const item = e.target.closest(".meal-selectable");
    if (e.target.checked) {
      item.classList.add("selected");
    } else {
      item.classList.remove("selected");
    }
  }
});
   document.getElementById("save-selected-meals").addEventListener("click", async () => {
  const selected = document.querySelectorAll(".meal-checkbox:checked");

  const groupedMeals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  };

  selected.forEach(input => {
    const mealType = input.dataset.mealType;
    groupedMeals[mealType].push({
      name: input.dataset.name,
      calories: parseInt(input.dataset.calories),
      price: input.dataset.price
    });
  });

  const totalSelected = Object.values(groupedMeals).reduce((acc, arr) => acc + arr.length, 0);

  if (totalSelected === 0) {
    alert("⚠️ Please select at least one meal to save.");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ Please log in to save your meal plan.");
    window.location.href = "public/login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/diet/user-meals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ meals: groupedMeals }) // userId is auto-read from token
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Meal plan saved successfully!");
      // ✅ Hide the entire meal plan section after saving
      const mealPlanSection = document.querySelector(".meal-plan");
      if (mealPlanSection) {
        mealPlanSection.style.display = "none";
      }

      // ✅ Optionally uncheck all checkboxes (in case it's shown again later)
      selected.forEach(input => input.checked = false);

    } else {
      console.error(data);
      alert("❌ Error saving meal plan. Please try again.");
    }
  } catch (err) {
    console.error("❌ Network or server error:", err);
    alert("Something went wrong while saving your plan. Please try again.");
  }
});

        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: "smooth" });
      });
       

      // Logout function
      window.logout = function() {
        localStorage.removeItem("token");
        window.location.href = "index.html";
      };
    });
  
  document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    const userNav = document.getElementById("user-profile-nav");

    if (!token) {
      // Hide nav item if not logged in
      if (userNav) userNav.style.display = "none";
      return;
    }

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
        if (userIconImage) {
          userIconImage.src = profilePicUrl;
        }

        // ✅ Show user profile nav
        if (userNav) userNav.style.display = "block";
      })
      .catch(error => {
        console.error("Failed to load profile pic:", error.message);
        if (userNav) userNav.style.display = "none";
      });
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