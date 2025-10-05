/**
 * Gym Details Offers Integration
 * Displays active offers and coupons on the gym details page
 */

class GymDetailsOffers {
  constructor(gymId) {
    this.gymId = gymId;
    this.offers = [];
    this.coupons = [];
    this.init();
  }

  async init() {
    console.log('🎯 Initializing Gym Details Offers...');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.loadOffers());
    } else {
      this.loadOffers();
    }
  }

  async loadOffers() {
    try {
      // Load active offers for this gym
      const response = await fetch(`${BASE_URL}/api/admin/offers/valid/${this.gymId}`);
      if (response.ok) {
        this.offers = await response.json();
        this.displayOffers();
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  }

  displayOffers() {
    if (!this.offers || this.offers.length === 0) {
      return; // No offers to display
    }

    // Create offers section in the gym details page
    this.createOffersSection();
    this.renderOffers();
  }

  createOffersSection() {
    // Find the best place to insert offers (after hero section, before tabs)
    const heroSection = document.querySelector('.gym-hero');
    const tabsSection = document.querySelector('.gym-nav-tabs');
    
    if (!heroSection || !tabsSection) {
      console.warn('Could not find proper location to insert offers section');
      return;
    }

    // Create offers section HTML
    const offersSection = document.createElement('section');
    offersSection.className = 'gym-offers-section';
    offersSection.innerHTML = `
      <div class="offers-container">
        <div class="offers-header">
          <h2><i class="fas fa-fire"></i> Special Offers</h2>
          <p>Limited time deals just for you!</p>
        </div>
        <div class="offers-grid" id="offersGrid">
          <!-- Offers will be rendered here -->
        </div>
      </div>
    `;

    // Insert before tabs section
    heroSection.parentNode.insertBefore(offersSection, tabsSection);

    // Add CSS styles
    this.addOfferStyles();
  }

  renderOffers() {
    const offersGrid = document.getElementById('offersGrid');
    if (!offersGrid) return;

    offersGrid.innerHTML = '';

    // Filter and sort offers (show only 3-4 most relevant)
    const displayOffers = this.offers
      .filter(offer => offer.displayOnWebsite !== false)
      .sort((a, b) => {
        // Prioritize highlighted offers
        if (a.highlightOffer && !b.highlightOffer) return -1;
        if (!a.highlightOffer && b.highlightOffer) return 1;
        // Then by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 4); // Show max 4 offers

    displayOffers.forEach(offer => {
      const offerCard = this.createOfferCard(offer);
      offersGrid.appendChild(offerCard);
    });
  }

  createOfferCard(offer) {
    const card = document.createElement('div');
    card.className = `offer-card ${offer.templateId || 'default'}`;
    
    const discountText = offer.type === 'percentage' 
      ? `${offer.value}% OFF` 
      : `₹${offer.value} OFF`;

    const timeRemaining = this.getTimeRemaining(offer.endDate);
    const isUrgent = timeRemaining.days <= 7;

    card.innerHTML = `
      <div class="offer-header">
        ${offer.highlightOffer ? '<div class="offer-badge">HOT DEAL</div>' : ''}
        <div class="offer-discount">
          <span class="discount-value">${discountText}</span>
          <span class="discount-label">Discount</span>
        </div>
      </div>
      
      <div class="offer-content">
        <h3 class="offer-title">${offer.title}</h3>
        <p class="offer-description">${offer.description}</p>
        
        ${offer.features && offer.features.length > 0 ? `
          <div class="offer-features">
            <ul>
              ${offer.features.slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="offer-validity">
          <i class="fas fa-clock"></i>
          <span class="validity-text ${isUrgent ? 'urgent' : ''}">
            ${timeRemaining.text}
          </span>
        </div>
      </div>
      
      <div class="offer-actions">
        ${offer.couponCode ? `
          <div class="coupon-code-section">
            <span class="coupon-label">Coupon Code:</span>
            <div class="coupon-code-container">
              <code class="coupon-code" id="coupon-${offer._id}">${offer.couponCode}</code>
              <button class="copy-coupon-btn" onclick="gymDetailsOffers.copyCouponCode('${offer.couponCode}', 'coupon-${offer._id}')">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
        ` : ''}
        
        <button class="claim-offer-btn" onclick="gymDetailsOffers.claimOffer('${offer._id}')">
          <i class="fas fa-gift"></i> Claim Offer
        </button>
      </div>
    `;

    return card;
  }

  getTimeRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const timeDiff = end - now;

    if (timeDiff <= 0) {
      return { days: 0, text: 'Offer Expired', expired: true };
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return { 
        days, 
        text: `${days} day${days > 1 ? 's' : ''} remaining`,
        expired: false 
      };
    } else if (hours > 0) {
      return { 
        days: 0, 
        text: `${hours} hour${hours > 1 ? 's' : ''} remaining`,
        expired: false 
      };
    } else {
      return { 
        days: 0, 
        text: 'Ending soon!',
        expired: false 
      };
    }
  }

  async copyCouponCode(code, elementId) {
    try {
      await navigator.clipboard.writeText(code);
      
      // Visual feedback
      const element = document.getElementById(elementId);
      const button = element.parentElement.querySelector('.copy-coupon-btn');
      
      if (button) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.background = '#4caf50';
        
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.style.background = '';
        }, 2000);
      }

      this.showNotification(`Coupon code "${code}" copied to clipboard!`, 'success');
    } catch (error) {
      console.error('Failed to copy coupon code:', error);
      this.showNotification('Failed to copy coupon code', 'error');
    }
  }

  async claimOffer(offerId) {
    const offer = this.offers.find(o => o._id === offerId);
    if (!offer) return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      this.showNotification('Please log in to claim this offer', 'info');
      // Redirect to login or show login modal
      return;
    }

    try {
      // If offer has a coupon code, validate it
      if (offer.couponCode) {
        const response = await fetch(`${BASE_URL}/api/admin/coupons/validate/${offer.couponCode}?gymId=${this.gymId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.valid) {
            this.showOfferClaimModal(offer, result.discountDetails);
          } else {
            this.showNotification(result.message || 'Offer is not valid', 'error');
          }
        } else {
          this.showNotification('Failed to validate offer', 'error');
        }
      } else {
        // Show general offer claim modal
        this.showOfferClaimModal(offer);
      }
    } catch (error) {
      console.error('Error claiming offer:', error);
      this.showNotification('Failed to claim offer. Please try again.', 'error');
    }
  }

  showOfferClaimModal(offer, discountDetails = null) {
    // Create modal for offer claiming
    const modal = document.createElement('div');
    modal.className = 'offer-claim-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-gift"></i> Claim Your Offer</h3>
          <button class="modal-close" onclick="this.closest('.offer-claim-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="offer-summary">
            <h4>${offer.title}</h4>
            <p>${offer.description}</p>
            
            ${discountDetails ? `
              <div class="discount-preview">
                <div class="discount-item">
                  <span>Discount:</span>
                  <span class="discount-value">${offer.type === 'percentage' ? offer.value + '%' : '₹' + offer.value}</span>
                </div>
                ${offer.minAmount > 0 ? `
                  <div class="discount-item">
                    <span>Minimum Purchase:</span>
                    <span>₹${offer.minAmount}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="claim-instructions">
            <h4>How to use this offer:</h4>
            <ol>
              <li>Visit the gym or contact them directly</li>
              <li>Show this offer or mention the coupon code: <strong>${offer.couponCode || 'N/A'}</strong></li>
              <li>Complete your membership purchase</li>
              <li>Enjoy your discount!</li>
            </ol>
          </div>
          
          <div class="gym-contact-info">
            <h4>Contact Information:</h4>
            <p><i class="fas fa-phone"></i> <span id="gymPhone">Loading...</span></p>
            <p><i class="fas fa-envelope"></i> <span id="gymEmail">Loading...</span></p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" onclick="this.closest('.offer-claim-modal').remove()">
            Got it!
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Load gym contact info
    this.loadGymContactInfo();
  }

  async loadGymContactInfo() {
    try {
      const response = await fetch(`${BASE_URL}/api/gyms/${this.gymId}`);
      if (response.ok) {
        const gym = await response.json();
        
        const phoneElement = document.getElementById('gymPhone');
        const emailElement = document.getElementById('gymEmail');
        
        if (phoneElement) phoneElement.textContent = gym.phone || 'Not available';
        if (emailElement) emailElement.textContent = gym.email || 'Not available';
      }
    } catch (error) {
      console.error('Error loading gym contact info:', error);
    }
  }

  addOfferStyles() {
    if (document.getElementById('gym-offers-styles')) return; // Already added

    const styles = document.createElement('style');
    styles.id = 'gym-offers-styles';
    styles.textContent = `
      .gym-offers-section {
        background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
        border-radius: 20px;
        padding: 3rem 2rem;
        margin: 2rem 0;
        position: relative;
        overflow: hidden;
        color: white;
      }

      .gym-offers-section::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="offers-pattern" patternUnits="userSpaceOnUse" width="10" height="10"><circle cx="5" cy="5" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23offers-pattern)"/></svg>');
        opacity: 0.3;
        animation: float 20s infinite ease-in-out;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }

      .offers-container {
        position: relative;
        z-index: 2;
      }

      .offers-header {
        text-align: center;
        margin-bottom: 2.5rem;
        color: white;
      }

      .offers-header h2 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .offers-header h2 i {
        color: var(--accent-color);
        text-shadow: 0 0 20px rgba(233, 196, 106, 0.5);
      }

      .offers-header p {
        font-size: 1.2rem;
        opacity: 0.9;
        margin: 0;
      }

      .offers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .offer-card {
        background: white;
        border-radius: 20px;
        padding: 0;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: all 0.3s ease;
        position: relative;
        border: 1px solid rgba(233, 196, 106, 0.2);
      }

      .offer-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        border-color: var(--accent-color);
      }

      .offer-header {
        background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
        padding: 1.5rem;
        color: white;
        position: relative;
      }

      .offer-card.winter .offer-header {
        background: linear-gradient(135deg, #74b9ff, #0984e3);
      }

      .offer-card.christmas .offer-header {
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
      }

      .offer-card.newyear .offer-header {
        background: linear-gradient(135deg, var(--accent-color), #ffd166);
      }

      .offer-card.joining .offer-header {
        background: linear-gradient(135deg, #55efc4, var(--primary-color));
      }

      .offer-badge {
        position: absolute;
        top: -8px;
        right: 20px;
        background: var(--accent-color);
        color: var(--secondary-color);
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 700;
        animation: pulse 2s infinite;
        box-shadow: 0 4px 15px rgba(233, 196, 106, 0.4);
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .offer-discount {
        text-align: center;
      }

      .discount-value {
        display: block;
        font-size: 2.2rem;
        font-weight: 700;
        line-height: 1;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .discount-label {
        font-size: 0.9rem;
        opacity: 0.9;
        margin-top: 0.3rem;
      }

      .offer-content {
        padding: 1.5rem;
        color: var(--secondary-color);
      }

      .offer-title {
        font-size: 1.4rem;
        font-weight: 600;
        margin-bottom: 0.8rem;
        color: var(--secondary-color);
      }

      .offer-description {
        color: #666;
        line-height: 1.6;
        margin-bottom: 1rem;
        font-size: 0.95rem;
      }

      .offer-features ul {
        list-style: none;
        padding: 0;
        margin: 0 0 1rem 0;
      }

      .offer-features li {
        padding: 0.3rem 0;
        color: #555;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
      }

      .offer-features li::before {
        content: "✓";
        color: var(--primary-color);
        font-weight: bold;
        font-size: 1rem;
      }

      .offer-validity {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.2rem;
        padding: 0.8rem;
        background: #f8f9fa;
        border-radius: 12px;
        border-left: 4px solid var(--primary-color);
      }

      .offer-validity i {
        color: var(--primary-color);
      }

      .validity-text {
        font-weight: 500;
        font-size: 0.9rem;
      }

      .validity-text.urgent {
        color: #e74c3c;
        font-weight: 600;
      }

      .offer-actions {
        padding: 0 1.5rem 1.5rem;
      }

      .coupon-code-section {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 12px;
        border: 1px solid #e9ecef;
      }

      .coupon-label {
        font-size: 0.85rem;
        color: var(--secondary-color);
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      .coupon-code-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .coupon-code {
        background: white;
        border: 2px dashed var(--primary-color);
        padding: 0.7rem 1rem;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-weight: 600;
        color: var(--primary-color);
        flex: 1;
        font-size: 0.9rem;
        letter-spacing: 1px;
      }

      .copy-coupon-btn {
        background: var(--primary-color);
        border: none;
        color: white;
        padding: 0.7rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
      }

      .copy-coupon-btn:hover {
        background: var(--secondary-color);
        transform: translateY(-2px);
      }

      .claim-offer-btn {
        width: 100%;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        border: none;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        position: relative;
        overflow: hidden;
      }

      .claim-offer-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }

      .claim-offer-btn:hover::before {
        left: 100%;
      }

      .claim-offer-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(42, 157, 143, 0.3);
      }

      /* Modal Styles */
      .offer-claim-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .offer-claim-modal .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(38, 70, 83, 0.8);
        backdrop-filter: blur(4px);
      }

      .offer-claim-modal .modal-content {
        background: white;
        border-radius: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        border: 2px solid var(--accent-color);
      }

      .offer-claim-modal .modal-header {
        padding: 1.5rem 1.5rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e9ecef;
        margin-bottom: 1rem;
      }

      .offer-claim-modal .modal-header h3 {
        color: var(--secondary-color);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .offer-claim-modal .modal-header h3 i {
        color: var(--accent-color);
      }

      .offer-claim-modal .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .offer-claim-modal .modal-close:hover {
        background: #f8f9fa;
        color: var(--secondary-color);
      }

      .offer-claim-modal .modal-body {
        padding: 0 1.5rem 1.5rem;
      }

      .offer-claim-modal .modal-footer {
        padding: 0 1.5rem 1.5rem;
        text-align: center;
      }

      .offer-summary h4 {
        color: var(--secondary-color);
        margin-bottom: 0.5rem;
        font-size: 1.3rem;
      }

      .offer-summary p {
        color: #666;
        line-height: 1.6;
        margin-bottom: 1rem;
      }

      .discount-preview {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 1rem;
        border-radius: 12px;
        margin: 1rem 0;
        border-left: 4px solid var(--accent-color);
      }

      .discount-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
      }

      .discount-item:last-child {
        margin-bottom: 0;
        font-weight: 600;
        color: var(--secondary-color);
      }

      .discount-item .discount-value {
        color: var(--primary-color);
        font-weight: 600;
      }

      .claim-instructions h4 {
        color: var(--secondary-color);
        margin-bottom: 1rem;
        font-size: 1.1rem;
      }

      .claim-instructions ol {
        padding-left: 1.2rem;
        color: #555;
      }

      .claim-instructions li {
        margin-bottom: 0.5rem;
        line-height: 1.6;
        font-size: 0.95rem;
      }

      .claim-instructions strong {
        color: var(--primary-color);
        font-weight: 600;
      }

      .gym-contact-info h4 {
        color: var(--secondary-color);
        margin-bottom: 0.8rem;
        font-size: 1.1rem;
      }

      .gym-contact-info p {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        color: #555;
        font-size: 0.95rem;
      }

      .gym-contact-info i {
        color: var(--primary-color);
        width: 16px;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        border: none;
        color: white;
        padding: 0.8rem 2rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(42, 157, 143, 0.3);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .gym-offers-section {
          padding: 2rem 1rem;
          margin: 1.5rem 0;
          border-radius: 15px;
        }

        .offers-header h2 {
          font-size: 2rem;
        }

        .offers-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .discount-value {
          font-size: 1.8rem;
        }

        .offer-card {
          border-radius: 15px;
        }

        .offer-header {
          padding: 1.2rem;
        }

        .offer-content {
          padding: 1.2rem;
        }

        .offer-actions {
          padding: 0 1.2rem 1.2rem;
        }

        .offer-claim-modal .modal-content {
          width: 95%;
          border-radius: 15px;
        }
      }

      @media (max-width: 480px) {
        .offers-header h2 {
          font-size: 1.7rem;
          flex-direction: column;
          gap: 0.3rem;
        }

        .discount-value {
          font-size: 1.6rem;
        }

        .coupon-code-container {
          flex-direction: column;
          gap: 0.5rem;
        }

        .copy-coupon-btn {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `gym-offers-notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 100001;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 400px;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; margin-left: auto; cursor: pointer; font-size: 18px;">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

// Initialize when DOM is loaded
let gymDetailsOffers;

document.addEventListener('DOMContentLoaded', () => {
  // Extract gym ID from URL or page data
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id') || urlParams.get('gymId');
  
  if (gymId) {
    gymDetailsOffers = new GymDetailsOffers(gymId);
    window.gymDetailsOffers = gymDetailsOffers; // Make globally available
  }
});

// Export for use in other modules
window.GymDetailsOffers = GymDetailsOffers;