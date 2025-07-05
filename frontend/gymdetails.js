document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('gymId'); // <-- Change 'gymId' to 'id'

  if (!gymId) {
    document.body.innerHTML = '<h1>No Gym ID Provided in URL</h1>';
    return;
  }

  fetch(`http://localhost:5000/api/gyms/${gymId}`)
  .then(res => {
    if (!res.ok) throw new Error("Failed to load gym data. Status: " + res.status);
    return res.json();
  })
  .then(gym => {
    if (!gym || gym.status.toLowerCase() !== 'approved') {
      document.body.innerHTML = '<h1>Gym not found or not approved</h1>';
      return;
    }

    const gymName = gym.name;

      // Update Gym Content
      updateHeader(gym);
      updateGymHero(gym);
      updatePhotoGallery(gym);

      // Render address/location
const locationInfo = document.querySelector('.location-info');
if (locationInfo && gym.location) {
  const addressP = locationInfo.querySelector('p');
  if (addressP) {
    addressP.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${gym.location.address}, ${gym.location.city}, ${gym.location.state} - ${gym.location.pincode}`;
  }
}

// Render activities
const activitiesEl = document.getElementById('activities-container');
if (activitiesEl && gym.activities && gym.activities.length) {
  activitiesEl.innerHTML = gym.activities.map(act => `<div class="activity-card">${act}</div>`).join('');
}
// Render equipment
const equipmentEl = document.getElementById('equipment-content');
if (equipmentEl && gym.equipment && gym.equipment.length) {
  equipmentEl.innerHTML = gym.equipment.map(eq => `<div class="equipment-item">${eq}</div>`).join('');
}
// Render membership plans
const plansEl = document.getElementById('plans-container');
if (plansEl && gym.membershipPlans) {
  plansEl.innerHTML = Object.entries(gym.membershipPlans)
    .filter(([key, val]) => typeof val === 'object')
    .map(([plan, details]) => `
      <div class="plan-card">
        <h3>${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</h3>
        <p>Price: ₹${details.price}</p>
        <ul>${details.features.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
    `).join('');
}

      const trialBookingForm = document.getElementById('trial-booking-form');
      if (trialBookingForm) {
        trialBookingForm.addEventListener('submit', function (event) {
          event.preventDefault();
        
          const formData = new FormData(this);
          const bookingData = {
            name: formData.get('name'),
            email: formData.get('email'),
            trialDate: formData.get('trialDate'),
            message: formData.get('message'),
            gymId: gymId,
            gymName: gym.gymName // <-- use gym.gymName
          };
        
          if (!bookingData.name || !bookingData.email || !bookingData.trialDate || !bookingData.gymId || !bookingData.gymName) {
            alert('Please fill all required fields.');
            return;
          }
        
          fetch('http://localhost:5000/api/trials/book-trial', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
          })
          .then(response => response.json())
          .then(data => {
            const bookingStatusElement = document.getElementById('booking-status');
            if (data.success) {
              alert('Your trial session request has been sent successfully!');
              trialBookingForm.reset();
              if (bookingStatusElement) {
                bookingStatusElement.innerHTML = `
                  <i class="fas fa-check-circle"></i>
                  Trial session request sent for ${gym.name}!
                `;
                bookingStatusElement.className = 'success';
              }
            } else {
              alert('There was an issue with your booking. Please try again. ' + (data.message || ''));
              if (bookingStatusElement) {
                bookingStatusElement.innerHTML = `
                  <i class="fas fa-times-circle"></i>
                  Booking failed. Please try again.
                `;
                bookingStatusElement.className = 'error';
              }
            }
          })
          .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
            const bookingStatusElement = document.getElementById('booking-status');
            if (bookingStatusElement) {
              bookingStatusElement.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                An error occurred during booking.
              `;
              bookingStatusElement.className = 'error';
            }
          });
        });
      } else {
        console.warn("Trial booking form with ID 'trial-booking-form' not found.");
      }
    })
    .catch(err => {
      console.error("Error loading gym data:", err);
      document.body.innerHTML = `<h1>Error loading gym data</h1><p>Details: ${err.message}. Please try again later.</p>`;
    });

  // Fetch and display average rating on load
  fetch(`http://localhost:5000/api/reviews/gym/${gymId}/average`)
    .then(res => res.json())
    .then(data => {
      updateGymHero({ ...gym, rating: data.averageRating });
    });

  function updateHeader(gymData) {
    const headerEl = document.querySelector('.header');
    if (headerEl) {
      let logoEl = headerEl.querySelector('.logo');
      if (!logoEl) {
        logoEl = document.createElement('div');
        logoEl.className = 'logo';
        headerEl.prepend(logoEl);
      }
      // Show gym logo if available
      if (gymData.logoUrl) {
        logoEl.innerHTML = `<img src="http://localhost:5000/${gymData.logoUrl}" alt="Gym Logo" style="height:40px; border-radius:50%;">`;
      } else {
        logoEl.textContent = 'FIT-verse';
      }

      let h1El = headerEl.querySelector('h1');
      if (!h1El) {
        h1El = document.createElement('h1');
        headerEl.appendChild(h1El);
      }
      h1El.textContent = gymData.gymName;
    }
  }

  function updateGymHero(gymData) {
    const gymNameElement = document.getElementById('gym-name');
    if (gymNameElement) {
      gymNameElement.textContent = gymData.gymName;
    }
    const logoImg = document.getElementById('gym-logo');
    if (logoImg && gymData.logoUrl) {
      logoImg.src = `http://localhost:5000/${gymData.logoUrl}`;
      logoImg.style.display = "block";
      logoImg.style.maxWidth = "120px";
      logoImg.style.maxHeight = "120px";
    }
    // Optionally update tagline or description
    const tagline = document.getElementById('gym-tagline');
    if (tagline && gymData.description) {
      tagline.textContent = gymData.description;
    }
    // Render interactive rating
    renderRating(gymData.rating || 0);
  }

  let selectedRating = 0;
  function renderRating(rating) {
    const ratingContainer = document.getElementById('gym-rating');
    if (!ratingContainer) return;
    ratingContainer.innerHTML = '';
    const maxStars = 5;
    for (let i = 1; i <= maxStars; i++) {
      const star = document.createElement('span');
      star.className = 'star' + (i <= Math.round(rating) ? ' filled' : '');
      star.innerHTML = '<i class="fa fa-star"></i>';
      star.dataset.value = i;
      star.style.fontSize = '2rem';
      star.style.cursor = 'pointer';
      star.onclick = function() {
        selectedRating = i;
        openReviewModal();
      };
      ratingContainer.appendChild(star);
    }
    // Show numeric rating
    const ratingValue = document.createElement('span');
    ratingValue.textContent = ` (${rating.toFixed(1)})`;
    ratingValue.style.fontSize = '1.2rem';
    ratingValue.style.marginLeft = '0.5rem';
    ratingContainer.appendChild(ratingValue);
  }

  // Review Modal Logic
  function openReviewModal() {
    document.getElementById('review-modal').classList.add('active');
    document.getElementById('review-success-msg').style.display = 'none';
    document.getElementById('review-form').reset();
  }
  function closeReviewModal() {
    document.getElementById('review-modal').classList.remove('active');
  }
  document.getElementById('close-review-modal').onclick = closeReviewModal;
  window.onclick = function(event) {
    if (event.target === document.getElementById('review-modal')) closeReviewModal();
  };
  document.getElementById('review-form').onsubmit = function(e) {
    e.preventDefault();
    const comment = document.getElementById('review-comment').value.trim();
    if (!selectedRating || !comment) {
      alert('Please provide a rating and comment.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to rate.');
      return;
    }
    fetch('http://localhost:5000/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        gymId: gymId,
        rating: selectedRating,
        comment: comment,
        reviewerName: ''
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.review) {
        document.getElementById('review-success-msg').textContent = 'Thank you for your review!';
        document.getElementById('review-success-msg').style.display = 'block';
        setTimeout(() => {
          closeReviewModal();
        }, 1200);
        // Refresh average rating
        fetch(`http://localhost:5000/api/reviews/gym/${gymId}/average`)
          .then(res => res.json())
          .then(avg => renderRating(avg.averageRating));
      } else {
        alert(data.message || 'Could not submit review.');
      }
    })
    .catch(() => alert('Error submitting review.'));
  };

 function updatePhotoGallery(gym) {
  const slider = document.getElementById('gym-slider');
  const sliderDots = document.getElementById('slider-dots');
  if (!slider) return;
  slider.innerHTML = '';
  sliderDots.innerHTML = '';

  const images = gym.gymImages && gym.gymImages.length ? gym.gymImages : ['default-gym.jpg'];
  images.forEach((img, idx) => {
    const imgUrl = img.startsWith('http') ? img : `http://localhost:5000/uploads/gym-images/${img}`;
    const imgElem = document.createElement('img');
    imgElem.src = imgUrl;
    imgElem.alt = `Gym Photo ${idx + 1}`;
    imgElem.className = 'slider-image';
    if (idx !== 0) imgElem.style.display = 'none';
    slider.appendChild(imgElem);

    // Add dot
    const dot = document.createElement('span');
    dot.className = 'slider-dot' + (idx === 0 ? ' active' : '');
    dot.dataset.index = idx;
    sliderDots.appendChild(dot);
  });

  // Slider logic (unchanged)
  let currentSlide = 0;
  const slides = slider.querySelectorAll('.slider-image');
  const dots = sliderDots.querySelectorAll('.slider-dot');
  function showSlide(n) {
    slides.forEach((img, i) => {
      img.style.display = i === n ? 'block' : 'none';
      dots[i].classList.toggle('active', i === n);
    });
    currentSlide = n;
  }
  document.getElementById('prev-slide').onclick = () => {
    showSlide((currentSlide - 1 + slides.length) % slides.length);
  };
  document.getElementById('next-slide').onclick = () => {
    showSlide((currentSlide + 1) % slides.length);
  };
  dots.forEach(dot => {
    dot.onclick = () => showSlide(Number(dot.dataset.index));
  });
}

});
