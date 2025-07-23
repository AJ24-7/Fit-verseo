// Payment Tab JavaScript
class PaymentManager {
  constructor() {
    this.paymentChart = null;
    this.currentFilter = 'all';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadPaymentData();
  }

  // Helper function to safely use notification system
  async waitForNotificationSystem(maxWait = 5000) {
    return new Promise((resolve) => {
      const checkInterval = 100;
      let waited = 0;
      
      const check = () => {
        if (window.notificationSystem && typeof window.notificationSystem.showNotification === 'function') {
          resolve(window.notificationSystem);
        } else if (waited < maxWait) {
          waited += checkInterval;
          setTimeout(check, checkInterval);
        } else {
          console.warn('Notification system not available after waiting');
          resolve(null);
        }
      };
      
      check();
    });
  }

  setupEventListeners() {
    // Add payment button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'addPaymentBtn') {
        this.showAddPaymentModal();
      }
    });

    // Modal close buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-close-btn') || 
          e.target.id === 'cancelPaymentBtn') {
        this.hideAddPaymentModal();
      }
    });

    // Payment category selection
    document.addEventListener('click', (e) => {
      if (e.target.closest('.payment-category-item')) {
        this.handleCategorySelection(e.target.closest('.payment-category-item'));
      }
    });

    // Payment form submission
    const paymentForm = document.getElementById('addPaymentForm');
    if (paymentForm) {
      paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePaymentFormSubmit();
      });
    }

    // Recurring payment checkbox
    const recurringCheckbox = document.getElementById('isRecurring');
    if (recurringCheckbox) {
      recurringCheckbox.addEventListener('change', (e) => {
        this.toggleRecurringDetails(e.target.checked);
      });
    }

    // Payment type change handler
    document.addEventListener('change', (e) => {
      if (e.target.id === 'paymentType') {
        this.handlePaymentTypeChange(e.target.value);
      }
    });

    // Filter buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        this.handleFilterChange(e.target.dataset.filter);
      }
    });

    // Payment action buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('payment-action-btn')) {
        const action = e.target.dataset.action;
        const paymentId = e.target.dataset.paymentId;
        this.handlePaymentAction(action, paymentId);
      }
    });

    // Chart controls
    const monthSelect = document.getElementById('paymentChartMonth');
    const yearSelect = document.getElementById('paymentChartYear');
    
    if (monthSelect) {
      monthSelect.addEventListener('change', () => this.updateChart());
    }
    if (yearSelect) {
      yearSelect.addEventListener('change', () => this.updateChart());
    }

    // Initialize payment reminders check
    this.initializePaymentReminders();
  }

  async loadPaymentData() {
    try {
      await Promise.all([
        this.loadPaymentStats(),
        this.loadRecentPayments(),
        this.loadRecurringPayments(),
        this.loadPaymentChart()
      ]);
    } catch (error) {
      console.error('Error loading payment data:', error);
      this.showError('Failed to load payment data');
    }
  }

  async loadPaymentStats() {
    try {
      const response = await fetch('http://localhost:5000/api/payments/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch payment stats');

      const data = await response.json();
      this.updatePaymentStats(data.data);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  }

  updatePaymentStats(stats) {
    // Update received amount
    const receivedCard = document.querySelector('.payment-stat-card.received');
    if (receivedCard) {
      receivedCard.querySelector('.payment-stat-value').textContent = `₹${this.formatAmount(stats.received)}`;
      const receivedChange = receivedCard.querySelector('.payment-stat-change');
      receivedChange.className = `payment-stat-change ${stats.receivedGrowth >= 0 ? 'positive' : 'negative'}`;
      receivedChange.innerHTML = `
        <i class="fas fa-arrow-${stats.receivedGrowth >= 0 ? 'up' : 'down'}"></i>
        ${Math.abs(stats.receivedGrowth).toFixed(1)}%
      `;
    }

    // Update paid amount
    const paidCard = document.querySelector('.payment-stat-card.paid');
    if (paidCard) {
      paidCard.querySelector('.payment-stat-value').textContent = `₹${this.formatAmount(stats.paid)}`;
      const paidChange = paidCard.querySelector('.payment-stat-change');
      paidChange.className = `payment-stat-change ${stats.paidGrowth >= 0 ? 'negative' : 'positive'}`;
      paidChange.innerHTML = `
        <i class="fas fa-arrow-${stats.paidGrowth >= 0 ? 'up' : 'down'}"></i>
        ${Math.abs(stats.paidGrowth).toFixed(1)}%
      `;
    }

    // Update due amount (new stat card)
    const dueCard = document.querySelector('.payment-stat-card.due');
    if (dueCard) {
      dueCard.querySelector('.payment-stat-value').textContent = `₹${this.formatAmount(stats.due || 0)}`;
      const dueChange = dueCard.querySelector('.payment-stat-change');
      if (dueChange && stats.dueGrowth !== undefined) {
        dueChange.className = `payment-stat-change ${stats.dueGrowth >= 0 ? 'negative' : 'positive'}`;
        dueChange.innerHTML = `
          <i class="fas fa-arrow-${stats.dueGrowth >= 0 ? 'up' : 'down'}"></i>
          ${Math.abs(stats.dueGrowth).toFixed(1)}%
        `;
      }
    }

    // Update pending amount (new stat card)
    const pendingCard = document.querySelector('.payment-stat-card.pending');
    if (pendingCard) {
      pendingCard.querySelector('.payment-stat-value').textContent = `₹${this.formatAmount(stats.pending || 0)}`;
      const pendingChange = pendingCard.querySelector('.payment-stat-change');
      if (pendingChange && stats.pendingGrowth !== undefined) {
        pendingChange.className = `payment-stat-change ${stats.pendingGrowth >= 0 ? 'negative' : 'positive'}`;
        pendingChange.innerHTML = `
          <i class="fas fa-arrow-${stats.pendingGrowth >= 0 ? 'up' : 'down'}"></i>
          ${Math.abs(stats.pendingGrowth).toFixed(1)}%
        `;
      }
    }

    // Update profit/loss
    const profitCard = document.querySelector('.payment-stat-card.profit');
    if (profitCard) {
      profitCard.querySelector('.payment-stat-value').textContent = `₹${this.formatAmount(stats.profit)}`;
      const profitChange = profitCard.querySelector('.payment-stat-change');
      profitChange.className = `payment-stat-change ${stats.profit >= 0 ? 'positive' : 'negative'}`;
      profitChange.innerHTML = `
        <i class="fas fa-arrow-${stats.profitGrowth >= 0 ? 'up' : 'down'}"></i>
        ${Math.abs(stats.profitGrowth).toFixed(1)}%
      `;
      
      // Update card color based on profit/loss
      if (stats.profit >= 0) {
        profitCard.style.borderLeftColor = '#22c55e';
      } else {
        profitCard.style.borderLeftColor = '#ef4444';
      }
    }
  }

  async loadPaymentChart() {
    try {
      const now = new Date();
      const month = document.getElementById('paymentChartMonth')?.value || now.getMonth();
      const year = document.getElementById('paymentChartYear')?.value || now.getFullYear();

      const response = await fetch(`http://localhost:5000/api/payments/chart-data?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch chart data');

      const data = await response.json();
      this.renderPaymentChart(data.data);
    } catch (error) {
      console.error('Error loading payment chart:', error);
    }
  }

  renderPaymentChart(chartData) {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;

    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    this.paymentChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Payment Trends'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value.toLocaleString();
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  async loadRecentPayments() {
    try {
      const response = await fetch('http://localhost:5000/api/payments/recent?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch recent payments');

      const data = await response.json();
      this.renderRecentPayments(data.data);
    } catch (error) {
      console.error('Error loading recent payments:', error);
    }
  }

  renderRecentPayments(payments) {
    const container = document.getElementById('recentPaymentsList');
    if (!container) return;

    if (payments.length === 0) {
      container.innerHTML = `
        <div class="payment-empty-state">
          <i class="fas fa-receipt"></i>
          <h3>No Recent Payments</h3>
          <p>No payment transactions found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = payments.map(payment => `
      <div class="recent-payment-item">
        <div class="recent-payment-icon ${payment.type}">
          <i class="fas fa-${payment.type === 'received' ? 'plus' : 'minus'}"></i>
        </div>
        <div class="recent-payment-info">
          <div class="recent-payment-title">${payment.description}</div>
          <div class="recent-payment-details">
            <span>${payment.category.replace('_', ' ').toUpperCase()}</span>
            <span>${payment.paymentMethod.toUpperCase()}</span>
            ${payment.memberName ? `<span>${payment.memberName}</span>` : ''}
          </div>
        </div>
        <div class="recent-payment-amount ${payment.type === 'received' ? 'positive' : 'negative'}">
          ${payment.type === 'received' ? '+' : '-'}₹${this.formatAmount(payment.amount)}
        </div>
        <div class="recent-payment-time">
          ${this.formatTime(payment.createdAt)}
        </div>
      </div>
    `).join('');
  }

  async loadRecurringPayments() {
    try {
      const response = await fetch(`http://localhost:5000/api/payments/recurring?status=${this.currentFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch recurring payments');

      const data = await response.json();
      this.renderRecurringPayments(data.data);
    } catch (error) {
      console.error('Error loading recurring payments:', error);
    }
  }

  renderRecurringPayments(payments) {
    const container = document.getElementById('recurringPaymentsList');
    if (!container) return;

    if (payments.length === 0) {
      container.innerHTML = `
        <div class="payment-empty-state">
          <i class="fas fa-calendar-alt"></i>
          <h3>No Recurring Payments</h3>
          <p>No recurring payment obligations found</p>
        </div>
      `;
      return;
    }

    // Add reminder badges to payments
    const paymentsWithReminders = this.renderPaymentWithReminders(payments);

    container.innerHTML = paymentsWithReminders.map(payment => {
      const isOverdue = payment.dueDate && new Date(payment.dueDate) < new Date() && payment.status === 'pending';
      const isPending = payment.status === 'pending';
      const isCompleted = payment.status === 'completed';

      // Badge logic: show timer for pending, show paid for completed
      let statusBadge = '';
      if (isPending) {
        statusBadge = `<span class="recurring-badge pending" style="background:#ffe066;color:#a67c00;padding:2px 10px;border-radius:12px;font-size:0.85em;margin-left:8px;display:inline-flex;align-items:center;"><i class="fas fa-clock" style="margin-right:4px;"></i> Pending</span>`;
      } else if (isCompleted) {
        statusBadge = `<span class="recurring-badge paid" style="background:#d4edda;color:#256029;padding:2px 10px;border-radius:12px;font-size:0.85em;margin-left:8px;display:inline-flex;align-items:center;"><i class="fas fa-check-circle" style="margin-right:4px;"></i> Paid</span>`;
      } else if (isOverdue) {
        statusBadge = `<span class="recurring-badge overdue" style="background:#ffd6d6;color:#b71c1c;padding:2px 10px;border-radius:12px;font-size:0.85em;margin-left:8px;display:inline-flex;align-items:center;"><i class="fas fa-exclamation-triangle" style="margin-right:4px;"></i> Overdue</span>`;
      }

      return `
        <div class="recurring-payment-item ${isOverdue ? 'overdue' : isPending ? 'pending' : 'completed'}">
          <div class="payment-item-info">
            <div class="payment-item-title">
              ${payment.description}
              ${statusBadge}
            </div>
            <div class="payment-item-details">
              <span>${this.getCategoryDisplayName(payment.category)}</span>
              <span>Due: ${payment.dueDate ? this.formatDate(payment.dueDate) : 'N/A'}</span>
              <span class="status-${payment.status}">${payment.status.toUpperCase()}</span>
            </div>
          </div>
          <div class="payment-item-amount">₹${this.formatAmount(payment.amount)}</div>
          <div class="payment-item-actions">
            ${payment.status === 'pending' ? `
              <button class="payment-action-btn mark-paid" data-action="mark-paid" data-payment-id="${payment._id}">
                Mark Paid
              </button>
            ` : ''}
            <button class="payment-action-btn edit" data-action="edit" data-payment-id="${payment._id}">
              Edit
            </button>
            <button class="payment-action-btn delete" data-action="delete" data-payment-id="${payment._id}">
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  showAddPaymentModal() {
    const modal = document.getElementById('addPaymentModal');
    if (modal) {
      modal.classList.add('active');
      this.populateYearSelect();
      this.resetCategorySelection();
      // Hide member name field initially until category is selected
      this.toggleMemberNameField('');
      // Add or update payment type info message as a horizontal bar above all fields
      setTimeout(() => {
        const form = document.getElementById('addPaymentForm');
        if (!form) return;
        let infoMsg = document.getElementById('paymentTypeInfoMsg');
        if (!infoMsg) {
          infoMsg = document.createElement('div');
          infoMsg.id = 'paymentTypeInfoMsg';
          infoMsg.style.margin = '0 0 18px 0';
          infoMsg.style.background = '#e0f7fa';
          infoMsg.style.borderLeft = '5px solid #06b6d4';
          infoMsg.style.color = '#036672';
          infoMsg.style.padding = '10px 18px 10px 14px';
          infoMsg.style.borderRadius = '6px';
          infoMsg.style.fontSize = '1rem';
          infoMsg.style.display = 'flex';
          infoMsg.style.alignItems = 'center';
          infoMsg.style.gap = '14px';
          infoMsg.style.boxShadow = '0 2px 8px rgba(6,182,212,0.07)';
          infoMsg.innerHTML = `
            <i class="fas fa-info-circle" style="font-size:1.3em;"></i>
            <span id="paymentTypeInfoText" style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;">
              <span><b>Received</b>: For payments received from members (e.g., membership, personal training, etc)</span>
              <span><b>Paid</b>: For payments made by the gym (e.g., rent, salaries, vendor payments, etc)</span>
              <span><b>Due</b>: For upcoming payments the gym needs to make (e.g., scheduled rent, bills, etc)</span>
              <span><b>Pending</b>: For payments expected from members but not yet received (e.g., expiring/expired memberships, pending fees, etc)</span>
            </span>
          `;
        }
        // Insert at the very top of the form, above all fields
        if (form.firstChild !== infoMsg) {
          form.insertBefore(infoMsg, form.firstChild);
        }
        // Enhance recurring payment checkbox
        this.enhanceRecurringCheckbox();
      }, 100); // Increased timeout to ensure DOM is ready
    }
  }

  handleCategorySelection(categoryItem) {
    // Remove previous selection
    document.querySelectorAll('.payment-category-item').forEach(item => {
      item.classList.remove('selected');
    });

    // Add selection to clicked item
    categoryItem.classList.add('selected');
    
    // Update hidden input
    const categoryValue = categoryItem.dataset.category;
    const hiddenInput = document.getElementById('paymentCategory');
    if (hiddenInput) {
      hiddenInput.value = categoryValue;
    }

    // Show/hide member name field based on category
    this.toggleMemberNameField(categoryValue);

    // Hide error message if any
    const errorDiv = document.getElementById('categoryError');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  // Show member field only for membership and personal_training categories
  toggleMemberNameField(category) {
    const memberNameGroup = document.querySelector('#memberName')?.closest('.payment-form-group');
    const memberNameInput = document.getElementById('memberName');
    const memberSelect = document.getElementById('memberSelect');
    const selectedMemberIdInput = document.getElementById('selectedMemberId');
    
    if (memberNameGroup && memberNameInput && memberSelect) {
      // Only show member field for membership and personal_training categories
      if (category === 'membership' || category === 'personal_training') {
        memberNameGroup.style.display = 'flex';
        const paymentType = document.getElementById('paymentType')?.value || 'received';
        
        if (paymentType === 'pending' || paymentType === 'due') {
          // For pending/due payments, show dropdown with expiring members
          memberNameInput.style.display = 'none';
          memberSelect.style.display = 'block';
          memberSelect.required = true;
          memberNameInput.required = false;
          this.loadExpiringMembersForDropdown();
        } else {
          // For received payments, show text input
          memberNameInput.style.display = 'block';
          memberSelect.style.display = 'none';
          memberNameInput.required = true;
          memberSelect.required = false;
        }
      } else {
        // Hide member field for all other categories
        memberNameGroup.style.display = 'none';
        memberNameInput.required = false;
        memberSelect.required = false;
        memberNameInput.value = '';
        memberSelect.value = '';
        if (selectedMemberIdInput) selectedMemberIdInput.value = '';
      }
    }
  }

  // Enhanced interactive recurring payment checkbox with tooltip and animations
  enhanceRecurringCheckbox() {
    setTimeout(() => {
      const recurringGroup = document.querySelector('#isRecurring')?.closest('.payment-form-group');
      const recurringCheckbox = document.getElementById('isRecurring');
      
      if (!recurringGroup || !recurringCheckbox) {
        console.warn('Recurring checkbox elements not found');
        return;
      }
      
      // Check if already enhanced to avoid duplicates
      if (recurringGroup.querySelector('.recurring-info-wrapper')) {
        console.log('Recurring checkbox already enhanced');
        return;
      }
      
      // Create wrapper for better organization
      const wrapper = document.createElement('div');
      wrapper.className = 'recurring-info-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '12px';
      wrapper.style.marginTop = '8px';
      
      // Create interactive info button
      const infoButton = document.createElement('button');
      infoButton.type = 'button';
      infoButton.className = 'recurring-info-btn';
      infoButton.style.cssText = `
        background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        border: none;
        border-radius: 20px;
        color: white;
        cursor: pointer;
        font-size: 0.85em;
        padding: 6px 14px;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
        font-weight: 500;
        transform: scale(1);
      `;
      infoButton.innerHTML = '<i class="fas fa-sync-alt"></i> What is recurring payment?';
      
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'recurring-tooltip';
      tooltip.style.cssText = `
        position: absolute;
        background: #1e293b;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.9em;
        max-width: 320px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        transform: translateY(-10px);
        pointer-events: none;
        line-height: 1.4;
      `;
      tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 6px; color: #06b6d4;">
          <i class="fas fa-info-circle"></i> Recurring Payments
        </div>
        <div>
          Recurring payments are automatically repeated at regular intervals (monthly, quarterly, yearly).
          <br><br>
          <strong>Examples:</strong>
          <ul style="margin: 8px 0; padding-left: 16px;">
            <li>Monthly gym rent</li>
            <li>Staff salaries</li>
            <li>Equipment maintenance</li>
            <li>Utility bills</li>
          </ul>
        </div>
      `;
      
      // Create status indicator
      const statusIndicator = document.createElement('span');
      statusIndicator.className = 'recurring-status';
      statusIndicator.style.cssText = `
        font-size: 0.85em;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 500;
        transition: all 0.3s ease;
        background: #f1f5f9;
        color: #64748b;
        border: 1px solid #e2e8f0;
      `;
      statusIndicator.textContent = 'One-time payment';
      
      // Add hover effects for info button
      infoButton.addEventListener('mouseenter', () => {
        infoButton.style.transform = 'scale(1.05)';
        infoButton.style.boxShadow = '0 4px 15px rgba(6, 182, 212, 0.4)';
        infoButton.style.background = 'linear-gradient(135deg, #0284c7, #0891b2)';
      });
      
      infoButton.addEventListener('mouseleave', () => {
        infoButton.style.transform = 'scale(1)';
        infoButton.style.boxShadow = '0 2px 8px rgba(6, 182, 212, 0.3)';
        infoButton.style.background = 'linear-gradient(135deg, #0ea5e9, #06b6d4)';
      });
      
      // Show/hide tooltip with better positioning
      infoButton.addEventListener('mouseenter', () => {
        try {
          const rect = infoButton.getBoundingClientRect();
          tooltip.style.left = `${rect.left}px`;
          tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
          tooltip.style.opacity = '1';
          tooltip.style.visibility = 'visible';
          tooltip.style.transform = 'translateY(0)';
        } catch (error) {
          console.warn('Error positioning tooltip:', error);
        }
      });
      
      infoButton.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.transform = 'translateY(-10px)';
      });
      
      // Add click effect
      infoButton.addEventListener('click', () => {
        infoButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
          infoButton.style.transform = 'scale(1.05)';
        }, 100);
      });
      
      // Listen to checkbox changes to update status
      recurringCheckbox.addEventListener('change', () => {
        if (recurringCheckbox.checked) {
          statusIndicator.style.background = 'linear-gradient(135deg, #dcfdf4, #a7f3d0)';
          statusIndicator.style.color = '#065f46';
          statusIndicator.style.border = '1px solid #10b981';
          statusIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Recurring payment';
        } else {
          statusIndicator.style.background = '#f1f5f9';
          statusIndicator.style.color = '#64748b';
          statusIndicator.style.border = '1px solid #e2e8f0';
          statusIndicator.innerHTML = 'One-time payment';
        }
      });
      
      // Assemble the enhanced UI
      wrapper.appendChild(infoButton);
      wrapper.appendChild(statusIndicator);
      recurringGroup.appendChild(wrapper);
      document.body.appendChild(tooltip);
      
      console.log('Recurring checkbox enhancement completed successfully');
    }, 200); // Increased timeout to ensure DOM is ready
  }

  hideAddPaymentModal() {
    const modal = document.getElementById('addPaymentModal');
    if (modal) {
      modal.classList.remove('active');
      this.resetPaymentForm();
    }
  }

  toggleRecurringDetails(show) {
    const recurringDetails = document.getElementById('recurringDetails');
    if (recurringDetails) {
      recurringDetails.classList.toggle('active', show);
    }
  }

  handlePaymentTypeChange(paymentType) {
    const dueDateGroup = document.querySelector('#paymentDueDate')?.closest('.payment-form-group');
    const dueDateInput = document.getElementById('paymentDueDate');
    const recurringGroup = document.querySelector('#isRecurring')?.closest('.payment-form-group');
    
    if (dueDateGroup && dueDateInput && recurringGroup) {
      if (paymentType === 'paid' || paymentType === 'due' || paymentType === 'pending') {
        // Show due date and recurring options for payments we need to make, are due, or pending
        dueDateGroup.style.display = 'flex';
        recurringGroup.style.display = 'flex';
        dueDateInput.required = true;
      } else {
        // Hide due date and recurring options for received payments
        dueDateGroup.style.display = 'none';
        recurringGroup.style.display = 'none';
        dueDateInput.required = false;
        dueDateInput.value = '';
        // Also hide recurring details if shown
        const recurringCheckbox = document.getElementById('isRecurring');
        if (recurringCheckbox) {
          recurringCheckbox.checked = false;
          this.toggleRecurringDetails(false);
        }
      }
    }
    
    // Update member field display based on payment type and category
    const categoryInput = document.getElementById('paymentCategory');
    if (categoryInput && categoryInput.value) {
      this.toggleMemberNameField(categoryInput.value);
    }
  }

  async handlePaymentFormSubmit() {
    // Validate category selection first
    if (!this.validateCategorySelection()) {
      this.showError('Please select a payment category');
      return;
    }

    const form = document.getElementById('addPaymentForm');
    const formData = new FormData(form);
    
    const paymentData = {
      type: formData.get('type'),
      category: this.mapCategoryToBackend(formData.get('category')), // Map to backend accepted values
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description'),
      memberName: formData.get('memberName'),
      memberId: formData.get('memberId') || document.getElementById('selectedMemberId')?.value || null,
      paymentMethod: formData.get('paymentMethod'),
      isRecurring: formData.get('isRecurring') === 'on',
      dueDate: formData.get('dueDate'),
      notes: formData.get('notes')
    };

    // Remove empty strings to prevent validation errors
    if (!paymentData.memberId || paymentData.memberId.trim() === '') {
      delete paymentData.memberId;
    }
    if (!paymentData.memberName || paymentData.memberName.trim() === '') {
      delete paymentData.memberName;
    }

    if (paymentData.isRecurring) {
      paymentData.recurringDetails = {
        frequency: formData.get('frequency'),
        nextDueDate: formData.get('nextDueDate') || formData.get('dueDate') // Use due date as next due date if not specified
      };
    }

    try {
      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) throw new Error('Failed to add payment');

      const result = await response.json();
      this.showSuccess('Payment added successfully');
      this.hideAddPaymentModal();
      this.loadPaymentData();
      
      // Handle notifications based on payment type and recurring status
      try {
        const notificationSystem = await this.waitForNotificationSystem(2000);
        if (notificationSystem) {
          if (paymentData.type === 'received') {
            // Payment received notification (green)
            notificationSystem.notifyPaymentReceived({
              amount: paymentData.amount,
              memberName: paymentData.memberName || 'Manual Entry',
              plan: paymentData.description || this.getCategoryDisplayName(formData.get('category'))
            });
          } else if ((paymentData.type === 'paid' || paymentData.type === 'due') && paymentData.dueDate) {
            // Payment due notification (yellow/warning) - use showNotification with warning type
            const dueDate = new Date(paymentData.dueDate).toLocaleDateString();
            const message = `Payment due: ${paymentData.description || this.getCategoryDisplayName(formData.get('category'))} - ₹${this.formatAmount(paymentData.amount)} due on ${dueDate}${paymentData.isRecurring ? ' (Recurring)' : ''}`;
            notificationSystem.showNotification('Payment Due', message, 'medium', 'warning');
          } else if (paymentData.type === 'pending' && paymentData.dueDate) {
            // Payment pending notification (orange/info) - use showNotification with info type
            const dueDate = new Date(paymentData.dueDate).toLocaleDateString();
            const message = `Payment pending: ${paymentData.description || this.getCategoryDisplayName(formData.get('category'))} - ₹${this.formatAmount(paymentData.amount)} pending for ${dueDate}${paymentData.isRecurring ? ' (Recurring)' : ''}`;
            notificationSystem.showNotification('Payment Pending', message, 'medium', 'info');
            
            // If this is a membership payment for a specific member, add member payment notification
            if (paymentData.category === 'membership' && paymentData.memberId) {
              const memberSelect = document.getElementById('memberSelect');
              const selectedOption = memberSelect?.selectedOptions[0];
              
              if (selectedOption) {
                const memberData = {
                  _id: paymentData.memberId,
                  memberName: selectedOption.dataset.memberName,
                  pendingPaymentAmount: paymentData.amount,
                  daysRemaining: parseInt(selectedOption.dataset.daysRemaining),
                  isExpired: selectedOption.dataset.isExpired === 'true',
                  membershipValidUntil: selectedOption.dataset.membershipValidUntil
                };
                
                // Send detailed notification
                if (memberData.isExpired) {
                  notificationSystem.notifyMemberPaymentOverdue(memberData, Math.abs(memberData.daysRemaining));
                } else {
                  notificationSystem.notifyMemberPaymentPending(memberData);
                }
                
                // Also show immediate alert about member status
                const statusMessage = memberData.isExpired 
                  ? `⚠️ Member ${memberData.memberName}'s membership EXPIRED ${Math.abs(memberData.daysRemaining)} days ago` 
                  : `⏰ Member ${memberData.memberName}'s membership expires in ${memberData.daysRemaining} days`;
                
                notificationSystem.showNotification('Membership Status Alert', statusMessage, 'high', 'warning');
              }
            }
          }
        } else {
          console.warn('Notification system not available');
        }
      } catch (notificationError) {
        console.warn('Error showing notification:', notificationError);
        // Don't let notification errors break the payment flow
      }
      
      // Schedule reminder if due date is set
      try {
        if (paymentData.dueDate && (paymentData.type === 'paid' || paymentData.type === 'due' || paymentData.type === 'pending')) {
          this.schedulePaymentReminder(result.data);
        }
      } catch (reminderError) {
        console.warn('Error scheduling payment reminder:', reminderError);
      }
      
    } catch (error) {
      console.error('Error adding payment:', error);
      this.showError('Failed to add payment');
    }
  }

  async handlePaymentAction(action, paymentId) {
    try {
      let response;
      
      switch (action) {
        case 'mark-paid':
          response = await fetch(`http://localhost:5000/api/payments/${paymentId}/mark-paid`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
            }
          });
          break;
        case 'delete':
          if (!confirm('Are you sure you want to delete this payment?')) return;
          response = await fetch(`http://localhost:5000/api/payments/${paymentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
            }
          });
          break;
        case 'edit':
          // TODO: Implement edit functionality
          this.showInfo('Edit functionality coming soon');
          return;
      }

      if (!response.ok) throw new Error(`Failed to ${action} payment`);

      const result = await response.json();
      this.showSuccess(result.message);
      this.loadPaymentData();
    } catch (error) {
      console.error(`Error ${action} payment:`, error);
      this.showError(`Failed to ${action} payment`);
    }
  }

  handleFilterChange(filter) {
    this.currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Reload recurring payments with new filter
    this.loadRecurringPayments();
  }

  async updateChart() {
    await this.loadPaymentChart();
  }

  populateYearSelect() {
    const yearSelect = document.getElementById('paymentChartYear');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      if (year === currentYear) option.selected = true;
      yearSelect.appendChild(option);
    }
  }

  resetPaymentForm() {
    const form = document.getElementById('addPaymentForm');
    if (form) {
      form.reset();
      this.toggleRecurringDetails(false);
      this.resetCategorySelection();
      // Reset field visibility based on default values
      this.handlePaymentTypeChange('received'); // Default to received
      this.toggleMemberNameField(''); // Reset member name field to hidden
    }
  }

  // Reset category selection
  resetCategorySelection() {
    // Remove all category selections
    document.querySelectorAll('.payment-category-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Clear hidden input
    const hiddenInput = document.getElementById('paymentCategory');
    if (hiddenInput) {
      hiddenInput.value = '';
    }
    
    // Hide error message if any
    const errorDiv = document.getElementById('categoryError');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  // Validate category selection
  validateCategorySelection() {
    const hiddenInput = document.getElementById('paymentCategory');
    return hiddenInput && hiddenInput.value && hiddenInput.value.trim() !== '';
  }

  formatAmount(amount) {
    return new Intl.NumberFormat('en-IN').format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return this.formatDate(dateString);
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showInfo(message) {
    this.showToast(message, 'info');
  }

  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `payment-toast payment-toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      transform: translateX(100%);
    `;

    // Set background color based on type
    switch (type) {
      case 'success':
        toast.style.backgroundColor = '#4caf50';
        break;
      case 'error':
        toast.style.backgroundColor = '#f44336';
        break;
      case 'info':
      default:
        toast.style.backgroundColor = '#2196f3';
        break;
    }

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    // Add to document
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 4000);
  }

  // Method to record membership payment automatically
  async recordMembershipPayment(memberData) {
    const paymentData = {
      type: 'received',
      category: 'membership',
      amount: parseFloat(memberData.paymentAmount),
      description: `Membership payment - ${memberData.planSelected} (${memberData.monthlyPlan})`,
      memberName: memberData.memberName,
      memberId: memberData._id,
      paymentMethod: memberData.paymentMode?.toLowerCase() || 'cash',
      isRecurring: false,
      notes: `Membership valid until ${memberData.membershipValidUntil}`
    };

    try {
      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) throw new Error('Failed to record membership payment');

      const result = await response.json();
      console.log('Membership payment recorded successfully:', result);
      
      // Refresh payment data if payment tab is active
      if (document.getElementById('paymentTab')?.style.display !== 'none') {
        this.loadPaymentData();
      }

      // Trigger notification for automatic membership payment recording
      if (window.notificationSystem && memberData.memberName) {
        window.notificationSystem.notifyPaymentReceived({
          amount: memberData.paymentAmount,
          memberName: memberData.memberName,
          plan: `${memberData.planSelected} (${memberData.monthlyPlan})`
        });
      }

      return result;
    } catch (error) {
      console.error('Error recording membership payment:', error);
      // Don't throw error to avoid blocking member creation
      return null;
    }
  }

  // Method to record membership renewal payment
  async recordRenewalPayment(memberData, renewalData) {
    const paymentData = {
      type: 'received',
      category: 'membership',
      amount: parseFloat(renewalData.paymentAmount),
      description: `Membership renewal - ${renewalData.planSelected} (${renewalData.monthlyPlan})`,
      memberName: memberData.memberName,
      memberId: memberData._id,
      paymentMethod: renewalData.paymentMode?.toLowerCase() || 'cash',
      isRecurring: false,
      notes: `Renewed until ${renewalData.membershipValidUntil}`
    };

    try {
      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) throw new Error('Failed to record renewal payment');

      const result = await response.json();
      console.log('Renewal payment recorded successfully:', result);
      
      // Refresh payment data if payment tab is active
      if (document.getElementById('paymentTab')?.style.display !== 'none') {
        this.loadPaymentData();
      }

      // Trigger notification for renewal payment recording
      if (window.notificationSystem && memberData.memberName) {
        window.notificationSystem.notifyPaymentReceived({
          amount: renewalData.paymentAmount,
          memberName: memberData.memberName,
          plan: `${renewalData.planSelected} (${renewalData.monthlyPlan}) - Renewal`
        });
      }

      return result;
    } catch (error) {
      console.error('Error recording renewal payment:', error);
      // Don't throw error to avoid blocking renewal
      return null;
    }
  }

  // Method to refresh payment data when called from other modules
  async refreshPaymentData() {
    if (document.getElementById('paymentTab')?.style.display !== 'none') {
      await this.loadPaymentData();
    }
  }

  // Payment Reminder System
  initializePaymentReminders() {
    // Check for payment reminders on initialization
    this.checkPaymentReminders();
    
    // Set up recurring check every hour
    setInterval(() => {
      this.checkPaymentReminders();
    }, 3600000); // 1 hour in milliseconds
  }

  async checkPaymentReminders() {
    try {
      const response = await fetch('http://localhost:5000/api/payments/reminders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch payment reminders');

      const data = await response.json();
      this.processPaymentReminders(data.data);
    } catch (error) {
      console.error('Error checking payment reminders:', error);
    }
  }

  processPaymentReminders(reminders) {
    reminders.forEach(reminder => {
      const daysUntilDue = this.calculateDaysUntilDue(reminder.dueDate);
      
      // Handle different payment types with different reminder schedules
      if (reminder.type === 'pending') {
        // For pending payments, remind more frequently
        if (daysUntilDue <= 14 && daysUntilDue >= 0) {
          // Pending payment due within 2 weeks
          this.showPaymentReminderNotification(reminder, 'pending-due-soon');
        } else if (daysUntilDue < 0) {
          // Pending payment is overdue
          this.showPaymentReminderNotification(reminder, 'overdue');
        }
      } else {
        // For due/paid payments, use standard reminder schedule
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          // Payment due within a week
          this.showPaymentReminderNotification(reminder, 'due-soon');
        } else if (daysUntilDue < 0) {
          // Payment is overdue
          this.showPaymentReminderNotification(reminder, 'overdue');
        }
      }
    });
  }

  showPaymentReminderNotification(payment, type) {
    if (!window.notificationSystem) return;

    const daysUntilDue = this.calculateDaysUntilDue(payment.dueDate);
    let message, urgency, notificationType = 'warning';

    // Adjust notification based on payment type
    const paymentTypeText = payment.type === 'pending' ? 'pending' : 
                           payment.type === 'due' ? 'due' : 'payment';

    if (type === 'overdue') {
      message = `Payment overdue: ${payment.description} (₹${this.formatAmount(payment.amount)}) - ${Math.abs(daysUntilDue)} days overdue`;
      urgency = 'high';
      notificationType = 'error';
    } else if (daysUntilDue === 0) {
      message = `Payment ${paymentTypeText} today: ${payment.description} (₹${this.formatAmount(payment.amount)})`;
      urgency = 'high';
      notificationType = payment.type === 'pending' ? 'info' : 'warning';
    } else if (daysUntilDue === 1) {
      message = `Payment ${paymentTypeText} tomorrow: ${payment.description} (₹${this.formatAmount(payment.amount)})`;
      urgency = 'medium';
      notificationType = payment.type === 'pending' ? 'info' : 'warning';
    } else if (daysUntilDue <= 7) {
      message = `Payment ${paymentTypeText} in ${daysUntilDue} days: ${payment.description} (₹${this.formatAmount(payment.amount)})`;
      urgency = 'low';
      notificationType = payment.type === 'pending' ? 'info' : 'warning';
    } else if (payment.type === 'pending' && daysUntilDue <= 14) {
      // Show longer reminder period for pending payments
      message = `Pending payment in ${daysUntilDue} days: ${payment.description} (₹${this.formatAmount(payment.amount)})`;
      urgency = 'low';
      notificationType = 'info';
    }

    // Add specific title based on payment type
    const title = payment.type === 'pending' ? 'Pending Payment Reminder' : 'Payment Reminder';
    
    window.notificationSystem.showNotification(title, message, urgency, notificationType);
  }

  schedulePaymentReminder(payment) {
    // This would typically be handled by the backend
    // But we can add client-side tracking for immediate reminders
    const dueDate = new Date(payment.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 7 && daysUntilDue > 0) {
      this.showPaymentReminderNotification(payment, 'upcoming');
    }
  }

  calculateDaysUntilDue(dueDateString) {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    return Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  }

  async loadExpiringMembersForDropdown() {
    try {
      console.log('Loading members with expiring/expired memberships for dropdown...');
      
      // Fetch members with memberships expiring within 3 days or already expired
      // If the backend doesn't support the days parameter, it will return all expiring members
      // and we'll filter them on the frontend
      const response = await fetch('http://localhost:5000/api/members/expiring?days=3', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch expiring members, status:', response.status);
        throw new Error('Failed to fetch expiring members');
      }

      const data = await response.json();
      const expiringMembers = data.data || data; // Handle different response formats
      console.log('Loaded expiring/expired members:', expiringMembers);
      this.populateExpiringMemberDropdown(expiringMembers);
    } catch (error) {
      console.error('Error loading expiring members:', error);
      this.showError('Failed to load expiring members');
    }
  }

  // Legacy function kept for backward compatibility
  async loadMembersForDropdown() {
    return this.loadExpiringMembersForDropdown();
  }

  populateExpiringMemberDropdown(members) {
    const memberSelect = document.getElementById('memberSelect');
    if (!memberSelect) {
      console.error('Member select element not found');
      return;
    }

    // Clear existing options
    memberSelect.innerHTML = '<option value="">Select Member with Expiring/Expired Membership</option>';

    if (!members || members.length === 0) {
      memberSelect.innerHTML += '<option value="" disabled>No members with expiring/expired memberships found</option>';
      console.log('No expiring/expired members to populate');
      return;
    }

    // Filter members to only include those expiring within 3 days or already expired
    const filteredMembers = members.filter(member => {
      const daysRemaining = member.daysRemaining || 0;
      return daysRemaining <= 3; // Include expired (negative), expiring today (0), and expiring within 3 days
    });

    if (filteredMembers.length === 0) {
      memberSelect.innerHTML += '<option value="" disabled>No members with urgent membership renewals found</option>';
      console.log('No urgent membership renewals found');
      return;
    }

    // Sort members: expired first (most urgent), then by days remaining
    filteredMembers.sort((a, b) => {
      const aDays = a.daysRemaining || 0;
      const bDays = b.daysRemaining || 0;
      
      // Expired members first (negative days)
      if (aDays < 0 && bDays >= 0) return -1;
      if (aDays >= 0 && bDays < 0) return 1;
      
      // Both expired: more days overdue first
      if (aDays < 0 && bDays < 0) return aDays - bDays;
      
      // Both expiring: fewer days remaining first
      return aDays - bDays;
    });

    filteredMembers.forEach(member => {
      const option = document.createElement('option');
      option.value = member._id;
      
      let statusText = '';
      let statusColor = '';
      
      if (member.daysRemaining < 0) {
        statusText = `⚠️ EXPIRED ${Math.abs(member.daysRemaining)} days ago`;
        statusColor = '#dc2626'; // Red for expired
        option.style.fontWeight = 'bold';
      } else if (member.daysRemaining === 0) {
        statusText = '🚨 EXPIRES TODAY';
        statusColor = '#ea580c'; // Orange-red for expiring today
        option.style.fontWeight = 'bold';
      } else if (member.daysRemaining === 1) {
        statusText = '⏰ EXPIRES TOMORROW';
        statusColor = '#d97706'; // Orange for expiring tomorrow
      } else {
        statusText = `⏰ Expires in ${member.daysRemaining} day${member.daysRemaining === 1 ? '' : 's'}`;
        statusColor = '#d97706'; // Orange for expiring soon
      }
      
      option.style.color = statusColor;
      option.textContent = `${member.memberName} (${member.membershipId || 'No ID'}) - ${statusText}`;
      
      // Store member data for later use
      option.dataset.memberName = member.memberName;
      option.dataset.email = member.email || '';
      option.dataset.phone = member.phone || '';
      option.dataset.daysRemaining = member.daysRemaining;
      option.dataset.isExpired = member.daysRemaining < 0;
      option.dataset.membershipValidUntil = member.membershipValidUntil;
      
      memberSelect.appendChild(option);
    });

    console.log(`Populated dropdown with ${filteredMembers.length} urgent membership renewals`);

    // Add event listener for member selection
    memberSelect.removeEventListener('change', this.handleMemberSelection.bind(this));
    memberSelect.addEventListener('change', this.handleMemberSelection.bind(this));
  }

  handleMemberSelection(event) {
    const selectedOption = event.target.selectedOptions[0];
    const selectedMemberIdInput = document.getElementById('selectedMemberId');
    const memberNameInput = document.getElementById('memberName');

    if (selectedOption && selectedOption.value) {
      // Set the member ID for the payment
      if (selectedMemberIdInput) {
        selectedMemberIdInput.value = selectedOption.value;
      }
      
      // Set the member name in the hidden text input for form submission
      if (memberNameInput) {
        memberNameInput.value = selectedOption.dataset.memberName;
      }
      
      // Show member status information
      const isExpired = selectedOption.dataset.isExpired === 'true';
      const daysRemaining = parseInt(selectedOption.dataset.daysRemaining);
      
      if (isExpired) {
        this.showInfo(`⚠️ Selected member's membership EXPIRED ${Math.abs(daysRemaining)} days ago`);
      } else if (daysRemaining === 0) {
        this.showInfo('🚨 Selected member\'s membership EXPIRES TODAY');
      } else {
        this.showInfo(`⏰ Selected member's membership expires in ${daysRemaining} days`);
      }
    } else {
      if (selectedMemberIdInput) selectedMemberIdInput.value = '';
      if (memberNameInput) memberNameInput.value = '';
    }
  }

  getCategoryDisplayName(category) {
    const categoryMap = {
      'rent': 'Rent',
      'utilities': 'Utilities',
      'staff_salary': 'Staff Salary',
      'equipment_purchase': 'Equipment Purchase',
      'equipment_maintenance': 'Equipment Maintenance',
      'supplies': 'Supplies',
      'marketing': 'Marketing',
      'insurance': 'Insurance',
      'taxes': 'Taxes',
      'vendor_payment': 'Vendor Payment',
      'license_fees': 'License Fees',
      'miscellaneous': 'Miscellaneous',
      'membership': 'Membership',
      'personal_training': 'Personal Training'
    };
    return categoryMap[category] || category.replace('_', ' ').toUpperCase();
  }

  // Map frontend category names to backend accepted values
  mapCategoryToBackend(category) {
    // Since we updated the backend schema to match frontend categories,
    // we no longer need to map them. Just return the category as-is.
    return category;
  }

  renderPaymentWithReminders(payments) {
    return payments.map(payment => {
      const daysUntilDue = payment.dueDate ? this.calculateDaysUntilDue(payment.dueDate) : null;
      let reminderBadge = '';

      if (daysUntilDue !== null) {
        // Determine badge style based on payment type
        const badgeStyle = payment.type === 'pending' ? 'pending' : 
                          daysUntilDue < 0 ? 'overdue' : 
                          daysUntilDue <= 3 ? 'due-soon' : 'upcoming';

        if (daysUntilDue < 0) {
          const dayText = payment.type === 'pending' ? 'pending overdue' : 'overdue';
          reminderBadge = `<span class="payment-reminder-badge ${badgeStyle}">
            <i class="fas fa-exclamation-triangle"></i> ${Math.abs(daysUntilDue)} days ${dayText}
          </span>`;
        } else if (daysUntilDue === 0) {
          const dayText = payment.type === 'pending' ? 'pending today' : 'due today';
          reminderBadge = `<span class="payment-reminder-badge ${badgeStyle}">
            <i class="fas fa-clock"></i> ${dayText}
          </span>`;
        } else if (daysUntilDue === 1) {
          const dayText = payment.type === 'pending' ? 'pending tomorrow' : 'due tomorrow';
          reminderBadge = `<span class="payment-reminder-badge ${badgeStyle}">
            <i class="fas fa-clock"></i> ${dayText}
          </span>`;
        } else if (daysUntilDue <= 7) {
          const dayText = payment.type === 'pending' ? 'pending' : 'due';
          reminderBadge = `<span class="payment-reminder-badge ${badgeStyle}">
            <i class="fas fa-calendar"></i> ${dayText} in ${daysUntilDue} days
          </span>`;
        } else if (payment.type === 'pending' && daysUntilDue <= 14) {
          // Show longer reminder period for pending payments
          reminderBadge = `<span class="payment-reminder-badge pending">
            <i class="fas fa-calendar-alt"></i> Pending in ${daysUntilDue} days
          </span>`;
        }
      }

      return {
        ...payment,
        reminderBadge
      };
    });
  }
}

// Initialize payment manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.paymentManager = new PaymentManager();

  // Add logic to close add payment modal when clicking outside modal content
  const modal = document.getElementById('addPaymentModal');
  const modalContent = modal ? modal.querySelector('.add-payment-modal-content') : null;
  if (modal && modalContent) {
    modal.addEventListener('mousedown', function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        if (window.paymentManager && typeof window.paymentManager.resetPaymentForm === 'function') {
          window.paymentManager.resetPaymentForm();
        }
      }
    });
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymentManager;
}
