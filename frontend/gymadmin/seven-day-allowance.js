// 7-Day Allowance Management System
class SevenDayAllowanceManager {
  constructor() {
    this.currentMemberData = null;
    this.plansCache = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.fetchPlans();
  }

  async fetchPlans() {
    try {
      const token = localStorage.getItem('gymAdminToken');
      if (!token) {
        console.error('[7DayAllowance] No token available');
        return;
      }

      const response = await fetch('http://localhost:5000/api/gyms/membership-plans', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        this.plansCache = data;
      } else if (data.plans && Array.isArray(data.plans)) {
        this.plansCache = data.plans;
      } else {
        this.plansCache = [];
      }
    } catch (error) {
      console.error('[7DayAllowance] Error fetching plans:', error);
      this.plansCache = [];
    }
  }

  setupEventListeners() {
    // Listen for 7-day allowance button clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('seven-day-allowance-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const memberId = e.target.dataset.memberId;
        this.openAllowanceModal(memberId);
      }
    });

    // Modal close listeners
    const modal = document.getElementById('sevenDayAllowanceModal');
    const closeBtn = document.getElementById('closeSevenDayAllowanceModal');
    const cancelBtn = document.getElementById('cancelSevenDayAllowance');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (modal) {
      modal.addEventListener('mousedown', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Form submission
    const form = document.getElementById('sevenDayAllowanceForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAllowanceSubmit();
      });
    }

    // Plan and duration change listeners
    document.addEventListener('change', (e) => {
      if (e.target.id === 'allowancePlanSelected' || e.target.id === 'allowanceMonthlyPlan') {
        this.updatePaymentAmount();
      }
    });

    // Mark as paid button listeners
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('mark-paid-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const memberId = e.target.dataset.memberId;
        const source = e.target.dataset.source || 'unknown';
        this.showMarkAsPaidModal(memberId, source);
      }
    });

    // Mark as paid form submission
    const markPaidForm = document.getElementById('markAsPaidForm');
    if (markPaidForm) {
      markPaidForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleMarkAsPaid();
      });
    }

    // Mark as paid modal close
    const markPaidModal = document.getElementById('markAsPaidModal');
    const closeMarkPaidBtn = document.getElementById('closeMarkAsPaidModal');
    const cancelMarkPaidBtn = document.getElementById('cancelMarkAsPaid');
    
    if (closeMarkPaidBtn) {
      closeMarkPaidBtn.addEventListener('click', () => this.closeMarkAsPaidModal());
    }
    
    if (cancelMarkPaidBtn) {
      cancelMarkPaidBtn.addEventListener('click', () => this.closeMarkAsPaidModal());
    }
    
    if (markPaidModal) {
      markPaidModal.addEventListener('mousedown', (e) => {
        if (e.target === markPaidModal) this.closeMarkAsPaidModal();
      });
    }
  }

  async openAllowanceModal(memberId) {
    try {
      // Fetch member data
      const token = localStorage.getItem('gymAdminToken');
      if (!token) {
        this.showNotification('Authentication token not found', 'error');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/members/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch member data: ${response.status}`);
      }

      const memberData = await response.json();
      this.currentMemberData = memberData;

      // Show modal
      const modal = document.getElementById('sevenDayAllowanceModal');
      if (modal) {
        modal.style.display = 'flex';
        this.populateModal(memberData);
      }

    } catch (error) {
      console.error('[7DayAllowance] Error opening modal:', error);
      this.showNotification('Failed to load member data', 'error');
    }
  }

  populateModal(memberData) {
    // Reset form
    const form = document.getElementById('sevenDayAllowanceForm');
    if (form) form.reset();

    // Populate member info
    document.getElementById('allowanceMemberName').textContent = memberData.memberName || '';
    document.getElementById('allowanceMembershipId').textContent = memberData.membershipId || '';
    document.getElementById('allowanceCurrentPlan').textContent = `${memberData.planSelected || ''} - ${memberData.monthlyPlan || ''}`;
    
    const expiryDate = memberData.membershipValidUntil ? new Date(memberData.membershipValidUntil).toLocaleDateString() : 'N/A';
    const today = new Date();
    const expiry = new Date(memberData.membershipValidUntil);
    const isExpired = expiry < today;
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    let expiryText = expiryDate;
    if (isExpired) {
      expiryText += ` <span style="color:#e53935;font-weight:600;">(Expired)</span>`;
    } else if (daysLeft <= 3) {
      expiryText += ` <span style="color:#ff9800;font-weight:600;">(${daysLeft} day${daysLeft === 1 ? '' : 's'} left)</span>`;
    }
    
    document.getElementById('allowanceExpiryDate').innerHTML = expiryText;

    // Set hidden member ID
    document.getElementById('allowanceMemberId').value = memberData._id || '';

    // Populate plan dropdown
    const planSelect = document.getElementById('allowancePlanSelected');
    if (planSelect && this.plansCache.length > 0) {
      planSelect.innerHTML = '<option value="">Select Plan</option>' + 
        this.plansCache.map(plan => 
          `<option value="${plan.name}" ${plan.name === memberData.planSelected ? 'selected' : ''}>${plan.name} - ₹${plan.price}/month</option>`
        ).join('');
    }

    // Pre-fill current values
    document.getElementById('allowancePlanSelected').value = memberData.planSelected || '';
    document.getElementById('allowanceMonthlyPlan').value = memberData.monthlyPlan || '';
    document.getElementById('allowanceActivityPreference').value = memberData.activityPreference || '';

    // Update payment amount
    this.updatePaymentAmount();
  }

  updatePaymentAmount() {
    const planSelect = document.getElementById('allowancePlanSelected');
    const durationSelect = document.getElementById('allowanceMonthlyPlan');
    const amountInput = document.getElementById('allowancePaymentAmount');
    const discountInfo = document.getElementById('allowanceDiscountInfo');
    const discountText = document.getElementById('allowanceDiscountText');

    if (!planSelect || !durationSelect || !amountInput) return;

    const selectedPlan = planSelect.value;
    const selectedDuration = durationSelect.value;

    if (!selectedPlan || !selectedDuration) {
      amountInput.value = '';
      if (discountInfo) discountInfo.style.display = 'none';
      return;
    }

    // Extract months from duration
    const monthsMatch = selectedDuration.match(/(\d+)\s*Months?/i);
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 1;

    // Find plan in cache
    const plan = this.plansCache.find(p => p.name === selectedPlan);
    
    if (!plan) {
      console.warn('[7DayAllowance] Plan not found in cache:', selectedPlan);
      amountInput.value = '';
      if (discountInfo) discountInfo.style.display = 'none';
      return;
    }

    // Calculate amount
    const baseAmount = plan.price * months;
    let finalAmount = baseAmount;
    let discountAmount = 0;
    let discountPercentage = 0;
    
    // Check if discount applies
    let discountApplies = false;
    if (plan.discount > 0 && plan.discountMonths) {
      if (Array.isArray(plan.discountMonths)) {
        discountApplies = plan.discountMonths.includes(months);
      } else {
        discountApplies = months >= plan.discountMonths;
      }
    }
    
    if (discountApplies) {
      discountPercentage = plan.discount;
      discountAmount = Math.round(baseAmount * (plan.discount / 100));
      finalAmount = baseAmount - discountAmount;
    }

    // Update UI
    amountInput.value = finalAmount;
    
    // Update discount information
    if (discountInfo && discountText) {
      if (discountApplies && discountAmount > 0) {
        discountText.innerHTML = `${discountPercentage}% discount applied - You save ₹${discountAmount}`;
        discountInfo.style.display = 'block';
        discountInfo.style.backgroundColor = '#d4edda';
        discountInfo.style.color = '#155724';
        discountInfo.style.border = '1px solid #c3e6cb';
      } else {
        discountText.innerHTML = 'No discount applied';
        discountInfo.style.display = 'block';
        discountInfo.style.backgroundColor = '#f8f9fa';
        discountInfo.style.color = '#6c757d';
        discountInfo.style.border = '1px solid #dee2e6';
      }
    }
  }

  async handleAllowanceSubmit() {
    try {
      const form = document.getElementById('sevenDayAllowanceForm');
      const formData = new FormData(form);
      
      const token = localStorage.getItem('gymAdminToken');
      if (!token) {
        this.showNotification('Authentication token not found', 'error');
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;

      const response = await fetch('http://localhost:5000/api/members/seven-day-allowance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        this.showNotification('7-day allowance granted successfully!', 'success');
        this.closeModal();
        
        // Refresh the members table and stats
        if (typeof fetchAndDisplayMembers === 'function') {
          fetchAndDisplayMembers();
        }
        if (typeof updateMembersStatsCard === 'function') {
          updateMembersStatsCard();
        }
        if (typeof updatePaymentsStatsCard === 'function') {
          updatePaymentsStatsCard();
        }
      } else {
        throw new Error(result.message || 'Failed to grant allowance');
      }

    } catch (error) {
      console.error('[7DayAllowance] Error submitting allowance:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    } finally {
      // Reset button state
      const submitBtn = document.querySelector('#sevenDayAllowanceForm button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  closeModal() {
    const modal = document.getElementById('sevenDayAllowanceModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentMemberData = null;
  }

  async showMarkAsPaidModal(memberId, source = 'unknown') {
    try {
      // Fetch member data
      const token = localStorage.getItem('gymAdminToken');
      if (!token) {
        this.showNotification('Authentication token not found', 'error');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/members/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch member data: ${response.status}`);
      }

      const memberData = await response.json();

      // Show modal
      const modal = document.getElementById('markAsPaidModal');
      if (modal) {
        modal.style.display = 'flex';
        
        // Populate member info
        document.getElementById('paidMemberName').textContent = memberData.memberName || '';
        document.getElementById('paidMembershipId').textContent = memberData.membershipId || '';
        document.getElementById('paidPendingAmount').textContent = memberData.pendingPaymentAmount || '0';
        document.getElementById('paidMemberId').value = memberId;
        document.getElementById('paidSource').value = source;

        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('paidDate').value = today;
      }

    } catch (error) {
      console.error('[7DayAllowance] Error opening mark as paid modal:', error);
      this.showNotification('Failed to load member data', 'error');
    }
  }

  async handleMarkAsPaid() {
    try {
      const form = document.getElementById('markAsPaidForm');
      const formData = new FormData(form);
      
      const token = localStorage.getItem('gymAdminToken');
      if (!token) {
        this.showNotification('Authentication token not found', 'error');
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;

      const response = await fetch('http://localhost:5000/api/members/mark-payment-paid', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        this.showNotification('Payment marked as paid successfully!', 'success');
        this.closeMarkAsPaidModal();
        
        // Refresh the UI components
        if (typeof fetchAndDisplayMembers === 'function') {
          fetchAndDisplayMembers();
        }
        if (typeof updateMembersStatsCard === 'function') {
          updateMembersStatsCard();
        }
        if (typeof updatePaymentsStatsCard === 'function') {
          updatePaymentsStatsCard();
        }
        
        // Refresh notifications if available
        if (window.notificationSystem && typeof window.notificationSystem.loadNotifications === 'function') {
          window.notificationSystem.loadNotifications();
        }
        
        // Refresh payment tab if available
        if (window.paymentManager && typeof window.paymentManager.loadPaymentData === 'function') {
          window.paymentManager.loadPaymentData();
        }
      } else {
        throw new Error(result.message || 'Failed to mark payment as paid');
      }

    } catch (error) {
      console.error('[7DayAllowance] Error marking payment as paid:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    } finally {
      // Reset button state
      const submitBtn = document.querySelector('#markAsPaidForm button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Mark as Paid';
        submitBtn.disabled = false;
      }
    }
  }

  closeMarkAsPaidModal() {
    const modal = document.getElementById('markAsPaidModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  showNotification(message, type = 'info') {
    // Try to use the existing notification system
    if (window.notificationSystem && typeof window.notificationSystem.showNotification === 'function') {
      window.notificationSystem.showNotification(message, type);
      return;
    }

    // Fallback notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#007bff'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the 7-day allowance manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.sevenDayAllowanceManager = new SevenDayAllowanceManager();
});
