// ===============================================
// GYM DETAILS PAGE JAVASCRIPT
// ===============================================

console.log('Gym details script loaded!');

// Global variables
let currentGym = null;
let currentPhotoIndex = 0;
let gymPhotos = [];

// BASE_URL is defined globally in the HTML file

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const gymContent = document.getElementById('gym-content');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    console.log('Current URL:', window.location.href);
    
    const gymId = getGymIdFromUrl();
    console.log('Gym ID from URL:', gymId);
    
    if (gymId) {
        console.log('About to load gym details for ID:', gymId);
        loadGymDetails(gymId);
    } else {
        console.error('No gym ID found in URL');
        showError('No gym ID provided');
        return;
    }
    
    console.log('Initializing event listeners...');
    initializeEventListeners();
    console.log('Initializing back to top...');
    initializeBackToTop();
    console.log('Initializing reviews...');
    initializeReviews();
    console.log('DOM initialization complete');
});

// Get gym ID from URL parameters
function getGymIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('gymId');
}

// Load gym details from backend
async function loadGymDetails(gymId) {
    try {
        console.log('Loading gym details for ID:', gymId);
        console.log('Fetching from URL:', `${BASE_URL}/api/gyms/${gymId}`);
        
        const response = await fetch(`${BASE_URL}/api/gyms/${gymId}`);
        
        console.log('Response status:', response.status);
        console.log('Response OK:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const gym = await response.json();
        console.log('Gym data received:', gym);
        currentGym = gym;
        
        populateGymDetails(gym);
        hideLoadingScreen();
        
    } catch (error) {
        console.error('Error loading gym details:', error);
        showError('Failed to load gym details. Please try again later.');
    }
}

// Populate gym details in the DOM
function populateGymDetails(gym) {
    console.log('Starting to populate gym details:', gym);
    
    // Basic gym info
    document.getElementById('gym-name').textContent = gym.gymName || 'Unknown Gym';
    document.getElementById('gym-address').textContent = 
        `${gym.location?.address || ''}, ${gym.location?.city || ''}, ${gym.location?.state || ''}`;
    document.getElementById('gym-hours').textContent = 
        `${gym.openingTime || 'N/A'} - ${gym.closingTime || 'N/A'}`;
    document.getElementById('gym-members').textContent = gym.membersCount || 0;
    
    // Gym logo (using gymadmin.js method)
    const gymLogo = document.getElementById('gym-logo');
    let logoUrl = 'https://via.placeholder.com/120x120.png?text=No+Logo';
    console.log('Processing gym logo:', gym.logoUrl);
    if (gym.logoUrl) {
        let url = gym.logoUrl;
        console.log('Raw logo URL:', url);
        // Convert relative path to full URL if needed (same as gymadmin.js)
        if (url && !url.startsWith('http')) {
            if (url.startsWith('/')) {
                logoUrl = `http://localhost:5000${url}`;
            } else {
                logoUrl = `http://localhost:5000/${url}`;
            }
        } else {
            logoUrl = url;
        }
        console.log('Final logo URL:', logoUrl);
    }
    gymLogo.src = logoUrl;
    // Force eager loading and prevent lazy loading
    gymLogo.setAttribute('loading', 'eager');
    gymLogo.setAttribute('decoding', 'sync');
    
    // Add error handling for logo
    gymLogo.onerror = function() {
        console.log('Logo failed to load, using placeholder');
        this.src = 'https://via.placeholder.com/120x120.png?text=No+Logo';
    };
    
    // Status
    const statusElement = document.getElementById('gym-status');
    if (gym.status === 'approved') {
        statusElement.innerHTML = '<span class="status-badge approved">✓ Verified</span>';
    } else {
        statusElement.innerHTML = '<span class="status-badge pending">Pending</span>';
    }
    
    // Gym description
    document.getElementById('gym-description-text').textContent = 
        gym.description || 'No description available.';
    
    // Populate tabs
    console.log('Populating tabs...');
    populatePhotos(gym.gymPhotos || []);
    populateEquipmentGallery(gym.equipment || []);
    populateMembershipPlans(gym.membershipPlans || []);
    populateActivities(gym.activities || []);
    populateEquipment(gym.equipment || []);
    populateLocation(gym);
    populateContactInfo(gym);
    populateRushHours(gym._id);
    
    // Load initial rating data for hero section
    console.log('About to load gym rating for hero section with gym ID:', gym._id);
    loadGymRatingForHero(gym._id);
    
    // Update page title
    document.title = `${gym.gymName} - Gym Details - Gym-Wale`;
    console.log('Gym details population complete');
}

// Populate photos tab
function populatePhotos(photos) {
    const photosGrid = document.getElementById('photos-grid');
    gymPhotos = photos;
    
    if (photos.length === 0) {
        photosGrid.innerHTML = '<p class="no-content">No photos available.</p>';
        return;
    }
    
    photosGrid.innerHTML = photos.map((photo, index) => {
        // Support both string and object with url - handle registration photo structure (same as gymadmin.js)
        let url = typeof photo === 'string' ? photo : (photo.url || photo.path || photo.imageUrl || '');
        const title = typeof photo === 'object' ? (photo.title || '') : '';
        const description = typeof photo === 'object' ? (photo.description || '') : '';
        const category = typeof photo === 'object' ? (photo.category || '') : '';
        
        let imageUrl = 'https://via.placeholder.com/300x200.png?text=No+Image';
        if (url) {
            console.log('Processing photo:', url);
            // Convert relative path to full URL if needed (same as gymadmin.js)
            if (url && !url.startsWith('http')) {
                if (url.startsWith('/')) {
                    imageUrl = `http://localhost:5000${url}`;
                } else {
                    imageUrl = `http://localhost:5000/${url}`;
                }
            } else {
                imageUrl = url;
            }
        }
        console.log('Final photo URL:', imageUrl);
        return `
            <div class="photo-card" onclick="openPhotoModal(${index})">
                <img src="${imageUrl}" alt="${title || 'Gym Photo'}" loading="eager" decoding="sync" onerror="this.src='https://via.placeholder.com/300x200.png?text=No+Image'">
                <div class="photo-info">
                    <span class="photo-category">${category}</span>
                    <h3>${title || 'Untitled'}</h3>
                    <p>${description || 'No description'}</p>
            </div>
        `;
    }).join('');
}

// Global equipment variables
let allEquipment = [];
let currentEquipmentFilter = 'all';

// Populate equipment gallery
function populateEquipmentGallery(equipment) {
    console.log('Populating equipment gallery with:', equipment);
    allEquipment = equipment || [];
    
    const equipmentGrid = document.getElementById('equipment-gallery-grid');
    
    if (!equipmentGrid) {
        console.error('Equipment gallery grid not found');
        return;
    }
    
    console.log('Equipment grid found, initializing filters...');
    
    // Initialize filter event listeners
    initializeEquipmentFilters();
    
    // Display equipment
    displayFilteredEquipment('all');
    
    console.log('Equipment gallery populated successfully');
}

// Initialize equipment filter buttons
function initializeEquipmentFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get category and filter equipment
            const category = this.getAttribute('data-category');
            currentEquipmentFilter = category;
            displayFilteredEquipment(category);
        });
    });
}

// Display filtered equipment
function displayFilteredEquipment(category) {
    const equipmentGrid = document.getElementById('equipment-gallery-grid');
    
    console.log('Displaying filtered equipment for category:', category);
    console.log('All equipment data:', allEquipment);
    
    if (allEquipment.length === 0) {
        console.log('No equipment found, showing no equipment message');
        equipmentGrid.innerHTML = `
            <div class="no-equipment-message">
                <i class="fas fa-dumbbell"></i>
                <h3>No Equipment Available</h3>
                <p>This gym hasn't added any equipment information yet.</p>
            </div>
        `;
        return;
    }
    
    // Filter equipment based on category
    let filteredEquipment = allEquipment;
    if (category !== 'all') {
        filteredEquipment = allEquipment.filter(equipment => 
            equipment.category && equipment.category.toLowerCase() === category.toLowerCase()
        );
        console.log('Filtered equipment for category', category, ':', filteredEquipment);
    }
    
    if (filteredEquipment.length === 0) {
        console.log('No equipment found for category:', category);
        equipmentGrid.innerHTML = `
            <div class="no-equipment-message">
                <i class="fas fa-search"></i>
                <h3>No Equipment Found</h3>
                <p>No equipment found in the "${category}" category.</p>
            </div>
        `;
        return;
    }
    
    console.log('Generating equipment cards for', filteredEquipment.length, 'items');
    
    // Generate equipment cards
    equipmentGrid.innerHTML = filteredEquipment.map((equipment, index) => {
        const mainPhoto = equipment.photos && equipment.photos.length > 0 ? equipment.photos[0] : '';
        let imageUrl = 'https://via.placeholder.com/300x200.png?text=No+Image';
        
        if (mainPhoto) {
            if (mainPhoto.startsWith('http')) {
                imageUrl = mainPhoto;
            } else {
                imageUrl = mainPhoto.startsWith('/') ? 
                    `http://localhost:5000${mainPhoto}` : 
                    `http://localhost:5000/${mainPhoto}`;
            }
        }
        
        const categoryIcon = getCategoryIcon(equipment.category);
        const statusClass = (equipment.status || 'available').toLowerCase().replace('-', '-');
        const statusText = equipment.status || 'available';
        
        return `
            <div class="equipment-card" onclick="openEquipmentModal('${equipment.id || equipment._id}')">
                <div class="equipment-image-container">
                    <img src="${imageUrl}" alt="${equipment.name}" 
                         onerror="this.src='https://via.placeholder.com/300x200.png?text=No+Image'">
                    <span class="equipment-quantity-badge">
                        <i class="fas fa-boxes"></i> ${equipment.quantity || 1}
                    </span>
                    <span class="equipment-status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </div>
                <div class="equipment-info">
                    <div class="equipment-header">
                        <h3 class="equipment-name">${equipment.name || 'Unnamed Equipment'}</h3>
                        <div class="equipment-brand-model">
                            ${equipment.brand ? `${equipment.brand}` : ''}
                            ${equipment.brand && equipment.model ? ' • ' : ''}
                            ${equipment.model ? `${equipment.model}` : ''}
                        </div>
                        <div class="equipment-category-tag">
                            <i class="${categoryIcon}"></i>
                            ${equipment.category || 'other'}
                        </div>
                    </div>
                    <p class="equipment-description">
                        ${equipment.description || 'No description available for this equipment.'}
                    </p>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Equipment cards generated successfully');
}

// Get category icon
function getCategoryIcon(category) {
    const iconMap = {
        'cardio': 'fas fa-heartbeat',
        'strength': 'fas fa-dumbbell',
        'functional': 'fas fa-running',
        'other': 'fas fa-cogs'
    };
    return iconMap[category?.toLowerCase()] || 'fas fa-cogs';
}

// Open equipment detail modal
function openEquipmentModal(equipmentId) {
    const equipment = allEquipment.find(eq => (eq.id || eq._id) === equipmentId);
    
    if (!equipment) {
        console.error('Equipment not found:', equipmentId);
        return;
    }
    
    console.log('Opening equipment modal for:', equipment);
    
    // Populate modal content
    document.getElementById('equipment-modal-name').textContent = equipment.name || 'Unnamed Equipment';
    document.getElementById('equipment-modal-brand').textContent = equipment.brand || 'Unknown Brand';
    document.getElementById('equipment-modal-model').textContent = equipment.model || 'Unknown Model';
    document.getElementById('equipment-modal-quantity').textContent = equipment.quantity || 1;
    document.getElementById('equipment-modal-location').textContent = equipment.location || 'Not specified';
    document.getElementById('equipment-modal-description').textContent = 
        equipment.description || 'No description available for this equipment.';
    
    // Set category
    const categoryElement = document.getElementById('equipment-modal-category');
    const categoryIcon = getCategoryIcon(equipment.category);
    categoryElement.innerHTML = `<i class="${categoryIcon}"></i><span>${equipment.category || 'other'}</span>`;
    
    // Set status
    const statusElement = document.getElementById('equipment-modal-status');
    const statusClass = (equipment.status || 'available').toLowerCase().replace('-', '-');
    statusElement.textContent = equipment.status || 'available';
    statusElement.className = `stat-value status-badge ${statusClass}`;
    
    // Handle main image and thumbnails
    const mainImageElement = document.getElementById('equipment-modal-image');
    const thumbnailsContainer = document.getElementById('equipment-thumbnails');
    
    if (equipment.photos && equipment.photos.length > 0) {
        // Set main image
        let mainImageUrl = equipment.photos[0];
        if (!mainImageUrl.startsWith('http')) {
            mainImageUrl = mainImageUrl.startsWith('/') ? 
                `http://localhost:5000${mainImageUrl}` : 
                `http://localhost:5000/${mainImageUrl}`;
        }
        mainImageElement.src = mainImageUrl;
        
        // Generate thumbnails if multiple photos
        if (equipment.photos.length > 1) {
            thumbnailsContainer.innerHTML = equipment.photos.map((photo, index) => {
                let photoUrl = photo;
                if (!photoUrl.startsWith('http')) {
                    photoUrl = photoUrl.startsWith('/') ? 
                        `http://localhost:5000${photoUrl}` : 
                        `http://localhost:5000/${photoUrl}`;
                }
                
                return `
                    <div class="equipment-thumbnail ${index === 0 ? 'active' : ''}" 
                         onclick="changeEquipmentImage('${photoUrl}', this)">
                        <img src="${photoUrl}" alt="Equipment Photo ${index + 1}"
                             onerror="this.src='https://via.placeholder.com/60x60.png?text=No+Image'">
                    </div>
                `;
            }).join('');
        } else {
            thumbnailsContainer.innerHTML = '';
        }
    } else {
        mainImageElement.src = 'https://via.placeholder.com/400x300.png?text=No+Image';
        thumbnailsContainer.innerHTML = '';
    }
    
    // Handle specifications
    const specificationsElement = document.getElementById('equipment-modal-specifications');
    const specificationsSection = document.getElementById('equipment-specifications-section');
    
    if (equipment.specifications && equipment.specifications.trim()) {
        specificationsSection.style.display = 'block';
        try {
            // Try to parse as JSON first
            const specs = JSON.parse(equipment.specifications);
            if (typeof specs === 'object') {
                specificationsElement.innerHTML = `
                    <ul>
                        ${Object.entries(specs).map(([key, value]) => 
                            `<li><span class="spec-label">${key}:</span> <span class="spec-value">${value}</span></li>`
                        ).join('')}
                    </ul>
                `;
            } else {
                specificationsElement.innerHTML = `<p>${specs}</p>`;
            }
        } catch (e) {
            // If not JSON, treat as plain text
            specificationsElement.innerHTML = `<p>${equipment.specifications}</p>`;
        }
    } else {
        specificationsSection.style.display = 'none';
    }
    
    // Show modal
    document.getElementById('equipment-detail-modal').style.display = 'block';
}

// Change equipment image in modal
function changeEquipmentImage(imageUrl, thumbnailElement) {
    document.getElementById('equipment-modal-image').src = imageUrl;
    
    // Update active thumbnail
    document.querySelectorAll('.equipment-thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnailElement.classList.add('active');
}

// Close equipment modal
function closeEquipmentModal() {
    document.getElementById('equipment-detail-modal').style.display = 'none';
}

// Populate membership plans tab
function populateMembershipPlans(plans) {
    const membershipGrid = document.getElementById('membership-grid');
    
    if (plans.length === 0) {
        membershipGrid.innerHTML = '<p class="no-content">No membership plans available.</p>';
        return;
    }
    
    membershipGrid.innerHTML = plans.map(plan => {
        const discountHtml = plan.discount > 0 ? 
            `<div class="membership-discount">
                ${plan.discount}% OFF for ${plan.discountMonths} months!
            </div>` : '';
        
        const finalPrice = plan.discount > 0 ? 
            plan.price - (plan.price * plan.discount / 100) : plan.price;
        
        const originalPriceHtml = plan.discount > 0 ? 
            `<span style="text-decoration: line-through; color: #999; font-size: 1rem;">₹${plan.price}</span> ` : '';
        
        return `
            <div class="membership-card">
                <div class="membership-header">
                    <div class="membership-icon" style="background: ${plan.color || '#38b000'};">
                        <i class="fas ${plan.icon || 'fa-leaf'}"></i>
                    </div>
                    <div class="membership-title">
                        <h3>${plan.name}</h3>
                        <div class="membership-price">
                            ${originalPriceHtml}₹${Math.round(finalPrice)}
                            <span>/month</span>
                        </div>
                    </div>
                </div>
                ${discountHtml}
                <ul class="membership-benefits">
                    ${plan.benefits.map(benefit => 
                        `<li><i class="fas fa-check"></i> ${benefit}</li>`
                    ).join('')}
                </ul>
                ${plan.note ? `<p class="membership-note">${plan.note}</p>` : ''}
                <button class="btn-primary buy-membership-btn" onclick="buyMembership('${plan.name}', ${finalPrice})">
                    <i class="fas fa-shopping-cart"></i> Buy Now
                </button>
            </div>
        `;
    }).join('');
}

// Populate activities tab
function populateActivities(activities) {
    const activitiesGrid = document.getElementById('activities-grid');
    
    if (activities.length === 0) {
        activitiesGrid.innerHTML = '<p class="no-content">No activities listed.</p>';
        return;
    }
    
    // Define the known activities with their icons (same as gymadmin.js)
    const knownActivities = [
        { name: 'Yoga', icon: 'fa-person-praying' },
        { name: 'Zumba', icon: 'fa-music' },
        { name: 'CrossFit', icon: 'fa-dumbbell' },
        { name: 'Weight Training', icon: 'fa-weight-hanging' },
        { name: 'Cardio', icon: 'fa-heartbeat' },
        { name: 'Pilates', icon: 'fa-child' },
        { name: 'HIIT', icon: 'fa-bolt' },
        { name: 'Aerobics', icon: 'fa-running' },
        { name: 'Martial Arts', icon: 'fa-hand-fist' },
        { name: 'Spin Class', icon: 'fa-bicycle' },
        { name: 'Swimming', icon: 'fa-person-swimming' },
        { name: 'Boxing', icon: 'fa-hand-rock' },
        { name: 'Personal Training', icon: 'fa-user-tie' },
        { name: 'Bootcamp', icon: 'fa-shoe-prints' },
        { name: 'Stretching', icon: 'fa-arrows-up-down' }
    ];
    
    console.log('Activities data:', activities);
    
    activitiesGrid.innerHTML = activities.map(activity => {
        console.log('Processing activity:', activity);
        
        let activityName = '';
        let activityDescription = '';
        let icon = 'fa-dumbbell';
        
        // Handle different activity formats
        if (typeof activity === 'string') {
            activityName = activity;
            activityDescription = 'Great activity for fitness enthusiasts.';
            // Find matching icon by name
            const match = knownActivities.find(a => a.name.toLowerCase() === activity.toLowerCase());
            if (match) {
                icon = match.icon;
                console.log(`Found icon for ${activity}: ${icon}`);
            }
        } else if (typeof activity === 'object' && activity !== null) {
            // Handle object format
            activityName = activity.name || activity.activityName || '';
            activityDescription = activity.description || 'Great activity for fitness enthusiasts.';
            
            // Use existing icon if available
            if (activity.icon) {
                icon = activity.icon;
                console.log(`Using existing icon for ${activityName}: ${icon}`);
            } else {
                // Find matching icon by name
                const match = knownActivities.find(a => a.name.toLowerCase() === activityName.toLowerCase());
                if (match) {
                    icon = match.icon;
                    console.log(`Found icon for ${activityName}: ${icon}`);
                }
            }
        }
        
        console.log(`Final activity: ${activityName}, icon: ${icon}`);
        
        return `
            <div class="activity-card">
                <div class="activity-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <h3>${activityName}</h3>
                <p>${activityDescription}</p>
            </div>
        `;
    }).join('');
    
    // Populate trial booking activity options
    const trialActivitySelect = document.getElementById('trial-activity');
    trialActivitySelect.innerHTML = '<option value="">Select activity (optional)</option>' +
        activities.map(activity => {
            const activityName = typeof activity === 'string' ? activity : (activity.name || activity.activityName || '');
            return `<option value="${activityName}">${activityName}</option>`;
        }).join('');
}

// Populate equipment section
function populateEquipment(equipment) {
    const equipmentList = document.getElementById('equipment-list');
    
    if (!equipment || equipment.length === 0) {
        equipmentList.innerHTML = '<p class="no-content">No equipment listed.</p>';
        return;
    }
    
    // Handle both array of strings (old format) and array of objects (new format)
    equipmentList.innerHTML = equipment.map(item => {
        let equipmentName = '';
        let equipmentInfo = '';
        
        if (typeof item === 'string') {
            // Old format: simple string
            equipmentName = item;
        } else if (typeof item === 'object' && item !== null) {
            // New format: equipment object
            equipmentName = item.name || 'Unknown Equipment';
            const brand = item.brand ? ` - ${item.brand}` : '';
            const quantity = item.quantity > 1 ? ` (${item.quantity}x)` : '';
            equipmentInfo = `${brand}${quantity}`;
        } else {
            equipmentName = 'Unknown Equipment';
        }
        
        const categoryIcon = getCategoryIcon(item.category);
        
        return `
            <div class="equipment-item">
                <i class="${categoryIcon}"></i>
                <div class="equipment-item-info">
                    <span class="equipment-name">${equipmentName}</span>
                    ${equipmentInfo ? `<span class="equipment-details">${equipmentInfo}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Populate location tab
function populateLocation(gym) {
    const fullAddress = `${gym.location?.address || ''}, ${gym.location?.city || ''}, ${gym.location?.state || ''} - ${gym.location?.pincode || ''}`;
    document.getElementById('full-address').textContent = fullAddress;
    
    // Initialize map (placeholder for now)
    const mapContainer = document.getElementById('gym-map');
    mapContainer.innerHTML = `
        <div style="background: linear-gradient(45deg, #f0f0f0, #e0e0e0); height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #666;">
            <i class="fas fa-map-marker-alt" style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary-color);"></i>
            <h3>Interactive Map</h3>
            <p>${gym.gymName}</p>
            <p>${fullAddress}</p>
            <button class="btn-secondary btn-small" onclick="openInMaps('${fullAddress}')">
                <i class="fas fa-external-link-alt"></i> Open in Maps
            </button>
        </div>
    `;
}

// Populate contact information
function populateContactInfo(gym) {
    // Header contact info
    document.getElementById('contact-phone').textContent = gym.phone || 'N/A';
    document.getElementById('contact-email').textContent = gym.email || 'N/A';
    document.getElementById('contact-person').textContent = gym.contactPerson || 'N/A';
    
    // Modal contact info
    document.getElementById('modal-phone').textContent = gym.phone || 'N/A';
    document.getElementById('modal-email').textContent = gym.email || 'N/A';
    document.getElementById('modal-contact-person').textContent = gym.contactPerson || 'N/A';
    
    // Update contact links
    const callBtn = document.getElementById('call-btn');
    const emailBtn = document.getElementById('email-btn');
    
    if (gym.phone) {
        callBtn.href = `tel:${gym.phone}`;
    }
    
    if (gym.email) {
        emailBtn.href = `mailto:${gym.email}`;
    }
}

// Populate rush hours analysis
async function populateRushHours(gymId) {
    try {
        console.log('Fetching rush hour data for gym:', gymId);
        
        // Fetch attendance data for the past 7 days
        const response = await fetch(`${BASE_URL}/api/attendance/rush-analysis/${gymId}`);
        
        if (!response.ok) {
            console.error('Failed to fetch rush hour data:', response.status);
            populateRushHoursDefault();
            return;
        }
        
        const result = await response.json();
        console.log('Rush hour analysis result:', result);
        
        if (result.success && result.data) {
            // Use the data directly from the backend
            populateRushHoursDisplay(result.data);
        } else {
            console.error('Invalid rush hour data received');
            populateRushHoursDefault();
        }
        
    } catch (error) {
        console.error('Error fetching rush hour data:', error);
        populateRushHoursDefault();
    }
}

    


// Populate rush hours display

// Calculate statistics for a time period
function calculatePeriodStats(hourlyStats, hours) {
    let totalAvg = 0;
    let lowCount = 0, mediumCount = 0, highCount = 0;
    
    hours.forEach(hour => {
        totalAvg += hourlyStats[hour].avgAttendance;
        switch (hourlyStats[hour].rushLevel) {
            case 'low': lowCount++; break;
            case 'medium': mediumCount++; break;
            case 'high': highCount++; break;
        }
    });
    
    const avgAttendance = totalAvg / hours.length;
    let overallRushLevel = 'low';
    
    if (highCount >= hours.length / 2) {
        overallRushLevel = 'high';
    } else if (mediumCount >= hours.length / 2) {
        overallRushLevel = 'medium';
    }
    
    return {
        avgAttendance,
        rushLevel: overallRushLevel,
        hours: hours.map(h => ({
            hour: h,
            attendance: hourlyStats[h].avgAttendance,
            rushLevel: hourlyStats[h].rushLevel
        }))
    };
}

// Find peak hour
function findPeakHour(hourlyStats) {
    let maxHour = 0;
    let maxAttendance = 0;
    
    Object.keys(hourlyStats).forEach(hour => {
        if (hourlyStats[hour].avgAttendance > maxAttendance) {
            maxAttendance = hourlyStats[hour].avgAttendance;
            maxHour = parseInt(hour);
        }
    });
    
    return { hour: maxHour, attendance: maxAttendance };
}

// Find least busy hour
function findLeastBusyHour(hourlyStats) {
    let minHour = 0;
    let minAttendance = Infinity;
    
    Object.keys(hourlyStats).forEach(hour => {
        const attendance = hourlyStats[hour].avgAttendance;
        if (attendance < minAttendance && attendance > 0) {
            minAttendance = attendance;
            minHour = parseInt(hour);
        }
    });
    
    return { hour: minHour, attendance: minAttendance };
}

// Populate rush hours display
function populateRushHoursDisplay(data) {
    console.log('Populating rush hours display with data:', data);
    
    // Hide loading and show content
    const loadingElement = document.getElementById('rush-hours-loading');
    const hoursChart = document.getElementById('hours-chart');
    const periodAnalysis = document.getElementById('period-analysis');
    const rushStatistics = document.getElementById('rush-statistics');
    const noDataElement = document.getElementById('rush-hours-no-data');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (noDataElement) noDataElement.style.display = 'none';
    
    // Generate hours chart with today's information
    if (hoursChart && data.hourlyData) {
        // Calculate maximum attendance for scaling
        const maxAttendance = Math.max(...Object.values(data.hourlyData).map(d => d.count));
        
        // Format today's date for display
        const todayDisplay = data.todayDate ? new Date(data.todayDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Today';
        
        // Weekly comparison badge
        let trendBadge = '';
        if (data.weeklyComparison) {
            const trend = data.weeklyComparison.trend;
            const trendIcon = trend === 'higher' ? '↗️' : trend === 'lower' ? '↘️' : '→';
            const trendColor = trend === 'higher' ? '#4CAF50' : trend === 'lower' ? '#FF5722' : '#2196F3';
            trendBadge = `
                <div class="trend-badge" style="color: ${trendColor}">
                    ${trendIcon} ${data.todayTotal} vs ${data.weeklyComparison.weeklyAverage} weekly avg
                </div>
            `;
        }
        
        let hoursHTML = `
            <div class="hours-chart-header">
                <div class="hours-chart-title">
                    <i class="fas fa-chart-bar"></i>
                    Today's Rush Hour Analysis
                </div>
                <div class="today-info">
                    <div class="today-date">${todayDisplay}</div>
                    ${trendBadge}
                    <div class="last-updated">Last updated: ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Just now'}</div>
                </div>
                <div class="chart-legend">
                    <div class="legend-item">
                        <div class="legend-dot low"></div>
                        <span>Low Activity</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot medium"></div>
                        <span>Moderate Activity</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot high"></div>
                        <span>High Activity</span>
                    </div>
                </div>
            </div>
            <div class="hours-grid">
                <div class="hours-labels">
        `;
        
        // Generate hour labels
        for (let hour = 6; hour <= 22; hour++) {
            hoursHTML += `<div class="hour-label">${formatHour(hour)}</div>`;
        }
        
        hoursHTML += `
                </div>
                <div class="hours-bars">
        `;
        
        // Generate hour bars with better styling
        for (let hour = 6; hour <= 22; hour++) {
            const hourData = data.hourlyData[hour] || { count: 0, rushLevel: 'low', percentage: 0 };
            const width = maxAttendance > 0 ? (hourData.count / maxAttendance) * 100 : 0;
            const barClass = hourData.count === 0 ? 'empty' : hourData.rushLevel;
            const isPeakHour = hour == data.peakHour;
            const isLeastBusy = hour == data.leastBusyHour;
            
            let specialClass = '';
            let specialIcon = '';
            if (isPeakHour && hourData.count > 0) {
                specialClass = 'peak-hour';
                specialIcon = '<i class="fas fa-crown peak-icon"></i>';
            } else if (isLeastBusy && hourData.count === Math.min(...Object.values(data.hourlyData).map(d => d.count))) {
                specialClass = 'least-busy';
                specialIcon = '<i class="fas fa-leaf quiet-icon"></i>';
            }
            
            hoursHTML += `
                <div class="hour-bar-container ${specialClass}">
                    <div class="hour-bar ${barClass}" style="width: ${Math.max(width, 5)}%">
                        <span class="bar-count">${hourData.count > 0 ? hourData.count : ''}</span>
                        ${specialIcon}
                    </div>
                    <div class="hour-tooltip">
                        <strong>${formatHour(hour)}</strong><br>
                        ${hourData.count} people<br>
                        <span class="${hourData.rushLevel}">${hourData.rushLevel.toUpperCase()} activity</span>
                        ${isPeakHour ? '<br>🏆 Peak Hour' : ''}
                        ${isLeastBusy && hourData.count === Math.min(...Object.values(data.hourlyData).map(d => d.count)) ? '<br>🌿 Quietest Time' : ''}
                    </div>
                </div>
            `;
        }
        
        hoursHTML += `
                </div>
            </div>
        `;
        
        hoursChart.innerHTML = hoursHTML;
        hoursChart.style.display = 'block';
    }
    
    // Generate period analysis
    if (periodAnalysis && data.periodStats) {
        const timeRecommendations = document.getElementById('time-recommendations');
        if (timeRecommendations) {
            let periodsHTML = '';
            
            const periodIcons = {
                morning: 'fas fa-sun',
                afternoon: 'fas fa-cloud-sun', 
                evening: 'fas fa-moon'
            };
            
            const periodColors = {
                low: 'best',
                medium: 'okay',
                high: 'avoid'
            };
            
            Object.keys(data.periodStats).forEach(periodKey => {
                const period = data.periodStats[periodKey];
                const colorClass = periodColors[period.rushLevel] || 'okay';
                
                periodsHTML += `
                    <div class="time-card ${colorClass}">
                        <i class="${periodIcons[periodKey]}"></i>
                        <h4>${period.name}</h4>
                        <p>${period.rushLevel.charAt(0).toUpperCase() + period.rushLevel.slice(1)} crowd</p>
                        <span class="period-stats">Avg: ${period.averageAttendance} people</span>
                        <span class="peak-hour">Peak: ${formatHour(period.peakHour)}</span>
                    </div>
                `;
            });
            
            timeRecommendations.innerHTML = periodsHTML;
        }
        periodAnalysis.style.display = 'block';
    }
    
    // Generate statistics
    if (rushStatistics && data.statistics) {
        const avgDailyElement = document.getElementById('avg-daily-attendance');
        const peakHourElement = document.getElementById('peak-hour-display');
        const leastBusyElement = document.getElementById('least-busy-hour-display');
        
        if (avgDailyElement) avgDailyElement.textContent = data.averageDailyAttendance || '0';
        if (peakHourElement) peakHourElement.textContent = formatHour(data.peakHour);
        if (leastBusyElement) leastBusyElement.textContent = formatHour(data.leastBusyHour);
        
        rushStatistics.style.display = 'block';
    }
}

// Populate default rush hours when data is not available
function populateRushHoursDefault() {
    console.log('Populating default rush hours display');
    
    // Hide loading and other elements  
    const loadingElement = document.getElementById('rush-hours-loading');
    const hoursChart = document.getElementById('hours-chart');
    const periodAnalysis = document.getElementById('period-analysis');
    const rushStatistics = document.getElementById('rush-statistics');
    const noDataElement = document.getElementById('rush-hours-no-data');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (hoursChart) hoursChart.style.display = 'none';
    if (periodAnalysis) periodAnalysis.style.display = 'none';
    if (rushStatistics) rushStatistics.style.display = 'none';
    if (noDataElement) noDataElement.style.display = 'block';
}

// Format hour for display
function formatHour(hour) {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
}

// Initialize event listeners
function initializeEventListeners() {
    // Tab navigation - tabs now use onclick handlers, so no need for separate event listeners
    
    // Modal event listeners
    setupModalEventListeners();
    
    // Trial booking form
    const trialForm = document.getElementById('trial-booking-form');
    trialForm.addEventListener('submit', handleTrialBooking);
    
    // Quick action buttons
    document.getElementById('trial-booking-btn').addEventListener('click', () => {
        openModal('trial-booking-modal');
    });
    
    document.getElementById('contact-btn').addEventListener('click', () => {
        openModal('contact-modal');
    });
    
    // Set minimum date for trial booking to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('trial-date').setAttribute('min', today);
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Photo navigation
    document.getElementById('prev-photo').addEventListener('click', () => {
        navigatePhoto(-1);
    });
    
    document.getElementById('next-photo').addEventListener('click', () => {
        navigatePhoto(1);
    });
    
    // Success/Error modal OK buttons
    document.getElementById('success-ok-btn').addEventListener('click', () => {
        closeModal('success-modal');
    });
    
    document.getElementById('error-ok-btn').addEventListener('click', () => {
        closeModal('error-modal');
    });
    
    // Equipment modal close button
    const equipmentModalClose = document.getElementById('close-equipment-modal');
    if (equipmentModalClose) {
        equipmentModalClose.addEventListener('click', () => {
            closeModal('equipment-detail-modal');
        });
    }
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all tabs and contents
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab button (find by onclick attribute)
    const selectedButton = Array.from(tabButtons).find(btn => 
        btn.getAttribute('onclick') === `switchTab('${tabName}')`
    );
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Add active class to selected tab content
    const selectedContent = document.getElementById(`${tabName}-tab`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Load reviews if reviews tab is selected
    if (tabName === 'reviews') {
        loadGymReviews();
    }
}

// Photo modal functions
function openPhotoModal(index) {
    currentPhotoIndex = index;
    updatePhotoModal();
    openModal('photo-modal');
}

function updatePhotoModal() {
    const photo = gymPhotos[currentPhotoIndex];
    let imageUrl = 'https://via.placeholder.com/800x600.png?text=No+Image';
    
    // Support both string and object with url - handle registration photo structure (same as gymadmin.js)
    let url = typeof photo === 'string' ? photo : (photo.url || photo.path || photo.imageUrl || '');
    if (url) {
        // Convert relative path to full URL if needed (same as gymadmin.js)
        if (url && !url.startsWith('http')) {
            if (url.startsWith('/')) {
                imageUrl = `http://localhost:5000${url}`;
            } else {
                imageUrl = `http://localhost:5000/${url}`;
            }
        } else {
            imageUrl = url;
        }
    }
    
    const modalPhoto = document.getElementById('modal-photo');
    modalPhoto.src = imageUrl;
    modalPhoto.setAttribute('loading', 'eager');
    modalPhoto.setAttribute('decoding', 'sync');
    modalPhoto.onerror = function() {
        this.src = 'https://via.placeholder.com/800x600.png?text=No+Image';
    };
    
    const title = typeof photo === 'object' ? (photo.title || '') : '';
    const description = typeof photo === 'object' ? (photo.description || '') : '';
    
    document.getElementById('photo-title').textContent = title || 'Untitled';
    document.getElementById('photo-description').textContent = description || 'No description';
}

function navigatePhoto(direction) {
    currentPhotoIndex += direction;
    
    if (currentPhotoIndex >= gymPhotos.length) {
        currentPhotoIndex = 0;
    } else if (currentPhotoIndex < 0) {
        currentPhotoIndex = gymPhotos.length - 1;
    }
    
    updatePhotoModal();
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Trial booking handler
async function handleTrialBooking(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const trialData = {
        gymId: getGymIdFromUrl(),
        gymName: currentGym.gymName,
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        date: formData.get('date'),
        time: formData.get('time'),
        activity: formData.get('activity') || 'General'
    };
    
    try {
        const response = await fetch(`${BASE_URL}/api/trial-bookings/book-trial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(trialData)
        });
        
        if (response.ok) {
            closeModal('trial-booking-modal');
            showSuccess('Trial booking submitted successfully! The gym will contact you soon.');
            e.target.reset();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to submit trial booking');
        }
    } catch (error) {
        console.error('Error submitting trial booking:', error);
        showError('Failed to submit trial booking. Please try again.');
    }
}

// Membership purchase handler
function buyMembership(planName, price) {
    // For now, just show an alert. In a real app, this would integrate with payment gateway
    showSuccess(`Membership purchase feature coming soon! You selected: ${planName} (₹${price}/month)`);
}


// === Modal Dialog Utility (from gymadmin.js, global) ===
function showDialog({ title = '', message = '', confirmText = 'OK', cancelText = '', iconHtml = '', onConfirm = null, onCancel = null }) {
  let dialog = document.getElementById('customDialogBox');
  if (dialog) dialog.remove();
  dialog = document.createElement('div');
  dialog.id = 'customDialogBox';
  dialog.style.position = 'fixed';
  dialog.style.top = '0';
  dialog.style.left = '0';
  dialog.style.width = '100vw';
  dialog.style.height = '100vh';
  dialog.style.background = 'rgba(0,0,0,0.35)';
  dialog.style.display = 'flex';
  dialog.style.alignItems = 'center';
  dialog.style.justifyContent = 'center';
  dialog.style.zIndex = '99999';
  dialog.style.backdropFilter = 'blur(2px)';
  const buttonsHtml = cancelText ? 
    `<div style="display:flex;gap:12px;justify-content:center;">
      <button id="dialogCancelBtn" style="background:#6c757d;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;font-weight:600;transition:background 0.2s ease;">${cancelText}</button>
      <button id="dialogConfirmBtn" style="background:#1976d2;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;font-weight:600;transition:background 0.2s ease;">${confirmText}</button>
    </div>` :
    `<button id="dialogConfirmBtn" style="background:#1976d2;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;font-weight:600;transition:background 0.2s ease;">${confirmText}</button>`;
  dialog.innerHTML = `
    <div style="background:#fff;max-width:450px;width:90vw;padding:30px 24px 20px 24px;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.2);text-align:center;position:relative;animation:dialogSlideIn 0.3s ease-out;">
      <div style="margin-bottom:16px;">${iconHtml || ''}</div>
      <div style="font-size:1.25em;font-weight:700;margin-bottom:12px;color:#333;">${title}</div>
      <div style="font-size:1em;color:#555;margin-bottom:24px;line-height:1.5;white-space:pre-line;">${message}</div>
      ${buttonsHtml}
    </div>
    <style>
      @keyframes dialogSlideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #dialogConfirmBtn:hover {
        background: #1565c0 !important;
      }
      #dialogCancelBtn:hover {
        background: #5a6268 !important;
      }
    </style>
  `;
  document.body.appendChild(dialog);
  document.body.style.overflow = 'hidden';
  dialog.querySelector('#dialogConfirmBtn').onclick = function() {
    dialog.remove();
    document.body.style.overflow = '';
    if (onConfirm) onConfirm();
  };
  const cancelBtn = dialog.querySelector('#dialogCancelBtn');
  if (cancelBtn) {
    cancelBtn.onclick = function() {
      dialog.remove();
      document.body.style.overflow = '';
      if (onCancel) onCancel();
    };
  }
  if (!cancelText) {
    dialog.onclick = function(e) {
      if (e.target === dialog) {
        dialog.remove();
        document.body.style.overflow = '';
        if (onConfirm) onConfirm();
      }
    };
  }
}

function hideLoadingScreen() {
    console.log('Hiding loading screen and showing gym content');
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        gymContent.style.display = 'block';
        
        // Ensure hero rating is visible
        const heroRating = document.getElementById('hero-rating');
        if (heroRating) {
            heroRating.style.display = 'flex';
            heroRating.style.visibility = 'visible';
            console.log('Hero rating element made visible');
        } else {
            console.error('Hero rating element not found during hideLoadingScreen');
        }
        
        gsap.from('.gym-hero', { opacity: 0, y: 50, duration: 0.8 });
        gsap.from('.gym-nav-tabs', { opacity: 0, y: 30, duration: 0.6, delay: 0.2 });
        gsap.from('.tab-content.active', { opacity: 0, y: 30, duration: 0.6, delay: 0.4 });
        console.log('Loading screen hidden and animations started');
    }, 500);
}

function showSuccess(message) {
    showDialog({
      title: 'Success!',
      message,
      iconHtml: '<i class="fas fa-check-circle" style="color:#22c55e;font-size:2.5em;"></i>',
      confirmText: 'OK'
    });
}

function showError(message) {
    hideLoadingScreen();
    showDialog({
      title: 'Error',
      message,
      iconHtml: '<i class="fas fa-exclamation-triangle" style="color:#e76f51;font-size:2.5em;"></i>',
      confirmText: 'OK'
    });
}

function openInMaps(address) {
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
}

// Back to top functionality
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Keyboard navigation for modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open modal
        const openModal = document.querySelector('.modal[style*="display: block"]');
        if (openModal) {
            closeModal(openModal.id);
        }
    }
    
    // Photo navigation with arrow keys
    if (document.getElementById('photo-modal').style.display === 'block') {
        if (e.key === 'ArrowLeft') {
            navigatePhoto(-1);
        } else if (e.key === 'ArrowRight') {
            navigatePhoto(1);
        }
    }
});

// ===============================================
// REVIEWS FUNCTIONALITY
// ===============================================

// Reviews functionality
let currentGymId = null;
let userToken = null;

// === USER PROFILE IMAGE FETCH FOR NAVBAR ===
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const userNav = document.getElementById("user-profile-nav");
    const loginNav = document.getElementById("login-signup-nav");

    // Default states
    if (userNav) userNav.style.display = "none";
    if (loginNav) loginNav.style.display = "none";

    if (!token) {
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
        updateProfileIconImage(user);
        if (userNav) userNav.style.display = "block";
        if (loginNav) loginNav.style.display = "none";
    })
    .catch(error => {
        console.error("Error fetching user:", error.message);
        if (loginNav) loginNav.style.display = "block";
    });
});
// Check if user is logged in and get user info
async function checkUserLogin() {
    userToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!userToken) {
        return { isLoggedIn: false };
    }
    
    try {
        // Fetch user profile to get current user info
        const response = await fetch(`${BASE_URL}/api/users/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            updateProfileIconImage(user); // <-- update profile icon
            return {
                isLoggedIn: true,
                user: user,
                name: user.name || user.username || 'User'
            };
        } else {
            // Token might be invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            return { isLoggedIn: false };
        }
    } catch (error) {
        console.error('Error checking user login:', error);
        return { isLoggedIn: false };
    }
}

// Star rating functionality
function initializeStarRating() {
    const stars = document.querySelectorAll('#star-rating i');
    const ratingValue = document.getElementById('rating-value');
    
    if (!stars.length || !ratingValue) return;
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            ratingValue.value = rating;
            
            // Update star display
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
        
        star.addEventListener('mouseover', () => {
            const rating = index + 1;
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.style.color = '#ffd700';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
    });
    
    // Reset on mouse leave
    const starRating = document.getElementById('star-rating');
    if (starRating) {
        starRating.addEventListener('mouseleave', () => {
            const currentRating = parseInt(ratingValue.value) || 0;
            stars.forEach((s, i) => {
                if (i < currentRating) {
                    s.style.color = '#ffd700';
                    s.classList.add('active');
                } else {
                    s.style.color = '#ddd';
                    s.classList.remove('active');
                }
            });
        });
    }
}

// Load gym reviews
async function loadGymReviews() {
    if (!currentGymId) {
        console.error('No currentGymId available for loading reviews');
        return;
    }
    
    console.log('Loading reviews for gym:', currentGymId);
    
    const reviewsList = document.getElementById('reviews-list');
    const loadingElement = document.getElementById('reviews-loading');
    const noReviewsElement = document.getElementById('no-reviews');
    
    if (!reviewsList) {
        console.error('reviews-list element not found');
        return;
    }
    
    // Show loading
    if (loadingElement) loadingElement.style.display = 'block';
    if (noReviewsElement) noReviewsElement.style.display = 'none';
    
    try {
        const response = await fetch(`${BASE_URL}/api/reviews/gym/${currentGymId}`);
        console.log('Reviews API response status:', response.status);
        
        const data = await response.json();
        console.log('Reviews API response data:', data);
        
        if (data.success) {
            displayReviews(data.reviews);
            updateRatingOverview(data.reviews);
        } else {
            console.error('Reviews API returned success:false:', data.message);
            showNoReviews();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        showNoReviews();
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Display reviews
function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviews-list');
    const noReviewsElement = document.getElementById('no-reviews');
    
    console.log('Displaying reviews:', reviews);
    
    if (!reviewsList) {
        console.error('reviews-list element not found');
        return;
    }
    
    if (!reviews || reviews.length === 0) {
        console.log('No reviews to display, showing no-reviews message');
        showNoReviews();
        return;
    }
    
    if (noReviewsElement) noReviewsElement.style.display = 'none';
    
    const reviewsHTML = reviews.map(review => {
        console.log('Processing review:', review);
        const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const stars = generateStars(review.rating);
        let adminReplyHTML = '';
        const hasReply = review.adminReply && review.adminReply.reply && review.adminReply.reply !== 'undefined' && review.adminReply.reply !== null && review.adminReply.reply.trim() !== '';
        if (hasReply) {
            const replyDate = new Date(review.adminReply.repliedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            
            // Get gym logo and name from current gym data
            let gymLogo = '/frontend/gymadmin/admin.png'; // Default fallback
            let gymName = 'Gym Admin'; // Default fallback
            
            if (currentGym) {
                // Handle different possible logo URL formats
                if (currentGym.logoUrl) {
                    if (currentGym.logoUrl.startsWith('http')) {
                        gymLogo = currentGym.logoUrl;
                    } else {
                        gymLogo = currentGym.logoUrl.startsWith('/') ? 
                            `${BASE_URL}${currentGym.logoUrl}` : 
                            `${BASE_URL}/${currentGym.logoUrl}`;
                    }
                }
                
                // Get gym name
                gymName = currentGym.gymName || currentGym.name || 'Gym Admin';
            }
            
            adminReplyHTML = `
                <div class="admin-reply" style="border-left: 3px solid #1976d2; padding-left: 16px; background: white; padding: 12px 16px; border-radius: 4px; margin-top: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <img src="${gymLogo}" alt="Gym Admin Logo" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #1976d2;" 
                             onerror="this.src='/frontend/gymadmin/admin.png';" />
                        <strong style="color: #1976d2; font-size: 13px;">${gymName}</strong>
                        <span style="font-size: 12px; color: #999;">${replyDate}</span>
                    </div>
                    <div class="admin-reply-text" style="margin: 0; color: #444; font-size: 13px; line-height: 1.4;">${review.adminReply.reply}</div>
                </div>
            `;
        }
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-name">${review.reviewerName || 'Anonymous'}</div>
                        <div class="review-date">${reviewDate}</div>
                    </div>
                    <div class="review-rating">
                        <div class="review-stars">${stars}</div>
                    </div>
                </div>
                <div class="review-comment">${review.comment || 'No comment provided'}</div>
                ${adminReplyHTML}
            </div>
        `;
    }).join('');
    
    // Remove loading element if exists
    const loadingElement = document.getElementById('reviews-loading');
    if (loadingElement) loadingElement.style.display = 'none';
    
    reviewsList.innerHTML = reviewsHTML;
    console.log('Reviews displayed successfully');
}

// Show no reviews message
function showNoReviews() {
    console.log('Showing no reviews message');
    const reviewsList = document.getElementById('reviews-list');
    const noReviewsElement = document.getElementById('no-reviews');
    
    if (reviewsList) {
        reviewsList.innerHTML = '';
    }
    
    if (noReviewsElement) {
        noReviewsElement.style.display = 'block';
        console.log('No reviews element shown');
    } else {
        console.error('No reviews element not found');
    }
}

// Generate star HTML
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Update rating overview
function updateRatingOverview(reviews) {
    if (!reviews || reviews.length === 0) {
        const mainRatingValue = document.getElementById('main-rating-value');
        const mainRatingDescription = document.getElementById('main-rating-description');
        
        if (mainRatingValue) mainRatingValue.textContent = '0.0';
        if (mainRatingDescription) mainRatingDescription.textContent = 'No reviews yet';
        updateHeroRating(0, 0);
        return;
    }
    
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;
    
    // Update main rating display
    const mainRatingValue = document.getElementById('main-rating-value');
    const mainRatingDescription = document.getElementById('main-rating-description');
    const mainStars = document.getElementById('main-rating-stars');
    
    if (mainRatingValue) mainRatingValue.textContent = averageRating.toFixed(1);
    if (mainRatingDescription) mainRatingDescription.textContent = `Based on ${totalReviews} review${totalReviews !== 1 ? 's' : ''}`;
    if (mainStars) mainStars.innerHTML = generateStars(Math.round(averageRating));
    
    // Update rating breakdown
    const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
    reviews.forEach(review => {
        ratingCounts[review.rating - 1]++;
    });
    
    ratingCounts.reverse().forEach((count, index) => {
        const starRating = 5 - index;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        const ratingBar = document.querySelector(`[data-rating="${starRating}"]`);
        if (ratingBar) {
            const barFill = ratingBar.querySelector('.bar-fill');
            const barCount = ratingBar.querySelector('.bar-count');
            
            if (barFill) barFill.style.width = percentage + '%';
            if (barCount) barCount.textContent = count;
        }
    });
    
    // Update hero section rating
    updateHeroRating(averageRating, totalReviews);
}

// Update hero section rating
function updateHeroRating(averageRating, totalReviews) {
    console.log('Updating hero rating:', averageRating, totalReviews);
    
    const heroRating = document.getElementById('hero-rating');
    const heroRatingValue = document.getElementById('hero-rating-value');
    const heroRatingCount = document.getElementById('hero-rating-count');
    const heroRatingStars = document.getElementById('hero-rating-stars');
    
    console.log('Hero rating elements found:', {
        heroRating: !!heroRating,
        heroRatingValue: !!heroRatingValue,
        heroRatingCount: !!heroRatingCount,
        heroRatingStars: !!heroRatingStars
    });
    
    if (heroRating) {
        // Always show the rating display
        heroRating.style.display = 'flex';
        heroRating.style.visibility = 'visible';
        
        if (totalReviews > 0) {
            if (heroRatingValue) heroRatingValue.textContent = averageRating.toFixed(1);
            if (heroRatingCount) heroRatingCount.textContent = `(${totalReviews} review${totalReviews !== 1 ? 's' : ''})`;
            if (heroRatingStars) heroRatingStars.innerHTML = generateStars(Math.round(averageRating));
        } else {
            if (heroRatingValue) heroRatingValue.textContent = '0.0';
            if (heroRatingCount) heroRatingCount.textContent = '(No reviews yet)';
            if (heroRatingStars) heroRatingStars.innerHTML = generateStars(0);
        }
        
        console.log('Hero rating updated successfully');
    } else {
        console.error('Hero rating element not found');
    }
}

// Modal functionality
function initializeReviewModal() {
    const modal = document.getElementById('write-review-modal');
    const writeReviewBtn = document.getElementById('write-review-btn');
    const closeModal = document.getElementById('close-review-modal');
    const reviewForm = document.getElementById('review-form');
    const loginNotice = document.getElementById('login-notice');
    const userInfo = document.getElementById('user-info');
    
    if (!modal || !writeReviewBtn) return;
    
    // Open modal
    writeReviewBtn.addEventListener('click', async () => {
        const userStatus = await checkUserLogin();
        
        if (userStatus.isLoggedIn) {
            if (loginNotice) loginNotice.style.display = 'none';
            if (userInfo) {
                userInfo.style.display = 'flex';
                const userNameSpan = document.getElementById('review-user-name');
                if (userNameSpan) userNameSpan.textContent = userStatus.name;
            }
            modal.style.display = 'block';
        } else {
            // Show login dialog
            showDialog({
                title: 'Login Required',
                message: 'You need to login to submit a review.\n\nWould you like to go to the login page now?',
                iconHtml: '<i class="fas fa-user-lock" style="color:#2196F3;font-size:2.5em;"></i>',
                confirmText: 'Go to Login',
                cancelText: 'Cancel',
                onConfirm: () => {
                    window.location.href = '/frontend/public/login.html';
                }
            });
        }
    });
    
    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            resetReviewForm();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            resetReviewForm();
        }
    });
    
    // Handle form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await submitReview();
        });
    }
}

// Reset review form
function resetReviewForm() {
    const reviewForm = document.getElementById('review-form');
    const ratingValue = document.getElementById('rating-value');
    const stars = document.querySelectorAll('#star-rating i');
    
    if (reviewForm) reviewForm.reset();
    if (ratingValue) ratingValue.value = '';
    
    stars.forEach(star => {
        star.classList.remove('active');
        star.style.color = '#ddd';
    });
}

// Submit review
async function submitReview() {
    const userStatus = await checkUserLogin();
    
    if (!userStatus.isLoggedIn) {
        showDialog({
            title: 'Login Required',
            message: 'Please login to submit a review.\n\nWould you like to go to the login page now?',
            iconHtml: '<i class="fas fa-user-lock" style="color:#2196F3;font-size:2.5em;"></i>',
            confirmText: 'Go to Login',
            cancelText: 'Cancel',
            onConfirm: () => {
                window.location.href = '/frontend/public/login.html';
            }
        });
        return;
    }
    
    const formData = new FormData(document.getElementById('review-form'));
    const reviewData = {
        gymId: currentGymId,
        reviewerName: userStatus.name,
        rating: parseInt(formData.get('rating')),
        comment: formData.get('comment')
    };
    
    console.log('Submitting review data:', reviewData);
    
    if (!reviewData.rating) {
        showDialog({
            title: 'Rating Required',
            message: 'Please select a rating before submitting your review.',
            iconHtml: '<i class="fas fa-star" style="color:#ffd700;font-size:2.5em;"></i>',
            confirmText: 'OK'
        });
        return;
    }
    
    const submitBtn = document.getElementById('submit-review-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(reviewData)
        });
        
        console.log('Review submission response status:', response.status);
        const data = await response.json();
        console.log('Review submission response data:', data);
        
        if (response.ok && data.success) {
            showDialog({
                title: 'Review Submitted!',
                message: 'Thank you for your review! It has been submitted successfully and will help other users make informed decisions.',
                iconHtml: '<i class="fas fa-check-circle" style="color:#22c55e;font-size:2.5em;"></i>',
                confirmText: 'OK',
                onConfirm: () => {
                    const modal = document.getElementById('write-review-modal');
                    if (modal) modal.style.display = 'none';
                    resetReviewForm();
                    loadGymReviews(); // Refresh reviews
                    loadGymRatingForHero(currentGymId); // Refresh hero rating
                }
            });
        } else {
            // Handle specific error cases
            let errorMessage = data.message || 'Unknown error occurred';
            
            if (response.status === 400 && errorMessage.includes('already reviewed')) {
                errorMessage = 'You have already submitted a review for this gym.\n\nWould you like to view your existing review in the reviews section?';
                showDialog({
                    title: 'Review Already Submitted',
                    message: errorMessage,
                    iconHtml: '<i class="fas fa-info-circle" style="color:#2196F3;font-size:2.5em;"></i>',
                    confirmText: 'View Reviews',
                    cancelText: 'Close',
                    onConfirm: () => {
                        const modal = document.getElementById('write-review-modal');
                        if (modal) modal.style.display = 'none';
                        resetReviewForm();
                        switchTab('reviews'); // Switch to reviews tab
                    }
                });
            } else {
                showDialog({
                    title: 'Submission Failed',
                    message: `Error submitting review: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`,
                    iconHtml: '<i class="fas fa-exclamation-triangle" style="color:#e76f51;font-size:2.5em;"></i>',
                    confirmText: 'OK'
                });
            }
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showDialog({
            title: 'Network Error',
            message: 'Unable to submit review due to a network error.\n\nPlease check your internet connection and try again.',
            iconHtml: '<i class="fas fa-wifi" style="color:#e76f51;font-size:2.5em;"></i>',
            confirmText: 'OK'
        });
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    }
}

// Initialize reviews functionality
function initializeReviews() {
    // Set the current gym ID
    currentGymId = getGymIdFromUrl();
    
    // Initialize components
    initializeStarRating();
    initializeReviewModal();
}

// Load gym rating for hero section
async function loadGymRatingForHero(gymId) {
    console.log('Loading gym rating for hero section, gymId:', gymId);
    try {
        const response = await fetch(`${BASE_URL}/api/reviews/gym/${gymId}/average`);
        console.log('Rating API response status:', response.status);
        
        const data = await response.json();
        console.log('Rating API response data:', data);
        
        if (data.success) {
            console.log('Updating hero rating with:', data.averageRating, data.totalReviews);
            updateHeroRating(data.averageRating || 0, data.totalReviews || 0);
        } else {
            console.log('Rating API returned success:false, using defaults');
            updateHeroRating(0, 0);
        }
    } catch (error) {
        console.error('Error loading gym rating:', error);
        updateHeroRating(0, 0);
    }
}

// Utility to get full profile image URL (same logic as script.js)
function getProfileImageUrl(profileImage) {
    if (!profileImage) return `${BASE_URL}/uploads/profile-pics/default.png`;
    if (profileImage.startsWith('http')) return profileImage;
    return `${BASE_URL}${profileImage}`;
}

// Example usage in gymdetails.js (replace wherever you set profile-icon-img)
function updateProfileIconImage(user) {
    const userIconImage = document.getElementById('profile-icon-img');
    if (userIconImage) {
        let profilePicUrl = getProfileImageUrl(user.profileImage);
        userIconImage.src = profilePicUrl;
    }
}
