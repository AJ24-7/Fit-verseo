console.log('[DEBUG] admin.js script started');
const BASE_URL = "http://localhost:5000";

document.addEventListener('DOMContentLoaded', function () {
  console.log('[DEBUG] DOMContentLoaded event fired');
    // ========== Tab Switching ==========
    function setupTabSwitching() {
        const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
        const tabContents = document.querySelectorAll('.tab-content');

        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                // Remove active class from all sidebar links
                sidebarLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Hide all tab contents
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.style.display = 'none';
                });

                // Show selected tab content
                const targetTabId = this.id.replace('-tab', '-content');
                console.log('[DEBUG] Clicked tab, targetTabId:', targetTabId); // Log the generated targetTabId
                const targetTab = document.getElementById(targetTabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                    targetTab.style.display = 'block';

                    // Load tab data if it's the gym management tab
                    if (targetTabId === 'gym-content') {
                        const activeGymTab = document.querySelector('.gym-tab.active');
                        if (activeGymTab) {
                            loadTabData(activeGymTab.getAttribute('data-tab'));
                        }
                    } else if (targetTabId === 'trial-booking-content') {
                        initTrialRequestsTab();
                    }
                }
            });
        });

        // Gym Management Tabs
        const gymTabs = document.querySelectorAll('.gym-tab');
        gymTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all gym tabs
                gymTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // Hide all gym tab contents
                const gymTabContents = document.querySelectorAll('.gym-tab-content');
                gymTabContents.forEach(content => content.classList.remove('active'));

                // Show selected gym tab content
                const tabId = this.getAttribute('data-tab');
                const targetTabContent = document.getElementById(tabId);
                if (targetTabContent) {
                    targetTabContent.classList.add('active');
                    loadTabData(tabId);
                }
            });
        });
    } // Added missing closing brace here

    // Initialize tab switching
    setupTabSwitching();

    // Initial content loading
    document.getElementById('dashboard-tab').classList.add('active');
    document.getElementById('dashboard-content').classList.add('active');
    document.getElementById('dashboard-content').style.display = 'block';

    // Load initial gym data
    const firstGymTab = document.querySelector('.gym-tab[data-tab="all-gyms"]');
    if (firstGymTab) {
        firstGymTab.classList.add('active');
        loadTabData('all-gyms');
    }


    // ========== Dashboard Cards Fetch ==========
    fetch(`${BASE_URL}/api/admin/dashboard`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-users').textContent = data.totalUsers;
            document.getElementById('active-members').textContent = data.activeMembers;

            const pendingTotal = data.pendingGyms + data.pendingTrainers;
            document.getElementById('pending-approvals').textContent = pendingTotal;
            document.getElementById('approvals-detail').textContent = `Gyms: ${data.pendingGyms}, Trainers: ${data.pendingTrainers}`;
            document.getElementById('total-revenue').textContent = `$${data.totalRevenue.toLocaleString()}`;

            // Trial Bookings
            document.getElementById('total-trial-bookings').textContent = data.totalTrialBookings || 0;
            const pendingTrialApprovals = data.pendingTrialApprovals || 0;
            document.getElementById('pending-trial-approvals-text').innerHTML = `<span class="text-warning">${pendingTrialApprovals}</span> Pending Approvals`;

            document.getElementById('users-change').innerHTML = `<span class="text-success">${data.changes.users}%</span> from last month`;
            document.getElementById('members-change').innerHTML = `<span class="text-success">${data.changes.members}%</span> from last month`;
            document.getElementById('revenue-change').innerHTML = `<span class="text-success">${data.changes.revenue}%</span> from last month`;
        });


    function showNotification(message, type = 'success') {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) return;

        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;
        notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Global dialog box system
    function showDialog({ title = 'Confirm', message = '', confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel }) {
        // Remove any existing dialog
        const existing = document.getElementById('global-dialog-box');
        if (existing) existing.remove();

        const dialog = document.createElement('div');
        dialog.id = 'global-dialog-box';
        dialog.style.position = 'fixed';
        dialog.style.top = '0';
        dialog.style.left = '0';
        dialog.style.width = '100vw';
        dialog.style.height = '100vh';
        dialog.style.background = 'rgba(0,0,0,0.35)';
        dialog.style.display = 'flex';
        dialog.style.alignItems = 'center';
        dialog.style.justifyContent = 'center';
        dialog.style.zIndex = '2000';

        dialog.innerHTML = `
            <div style="background:#fff; border-radius:10px; box-shadow:0 4px 24px rgba(0,0,0,0.18); padding:32px 28px; min-width:320px; max-width:90vw; text-align:center;">
                <h3 style="margin-bottom:16px; color:#d32f2f;">${title}</h3>
                <p style="margin-bottom:24px; color:#333;">${message}</p>
                <div style="display:flex; gap:16px; justify-content:center;">
                    <button id="dialog-confirm-btn" style="background:#d32f2f; color:#fff; border:none; border-radius:5px; padding:8px 22px; font-weight:600; cursor:pointer;">${confirmText}</button>
                    <button id="dialog-cancel-btn" style="background:#eee; color:#333; border:none; border-radius:5px; padding:8px 22px; font-weight:600; cursor:pointer;">${cancelText}</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        document.getElementById('dialog-confirm-btn').onclick = () => {
            dialog.remove();
            if (typeof onConfirm === 'function') onConfirm();
        };
        document.getElementById('dialog-cancel-btn').onclick = () => {
            dialog.remove();
            if (typeof onCancel === 'function') onCancel();
        };
    }

    async function loadTabData(tabId) {
        const tabContent = document.querySelector(`.gym-tab-content[id="${tabId}"]`);
        const tbody = tabContent ? tabContent.querySelector('tbody') : null;

        if (!tbody) {
            console.error(`No tbody found for tab: ${tabId}`);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            tbody.innerHTML = '<tr><td colspan="7">Please log in to access this data</td></tr>';
            return;
        }

        let response;
        try {
            const headers = {
                 'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            switch (tabId) {
                case 'all-gyms':
                    response = await fetch(`${BASE_URL}/api/gyms`, { headers });
                    break;
                case 'pending-gyms':
                    response = await fetch(`${BASE_URL}/api/gyms/status/pending`, { headers });
                    break;
                case 'approved-gyms':
                    response = await fetch(`${BASE_URL}/api/gyms/status/approved`, { headers });
                    break;
                case 'rejected-gyms':
                    response = await fetch(`${BASE_URL}/api/gyms/status/rejected`, { headers });
                    break;
                default:
                    tbody.innerHTML = '<tr><td colspan="7">No data found</td></tr>';
                    return;
            }

            if (!response.ok) {
                if (response.status === 401) {
                    // Token might be expired or invalid
                    localStorage.removeItem('token');
                    window.location.href = '/login.html'; // Redirect to login
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Clear existing rows
            tbody.innerHTML = '';

            // Populate rows based on tab
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7">No ${tabId.replace('-', ' ')} found</td></tr>`;
                return;
            }

            // Generate rows
            data.forEach(item => {
                let rowHtml;
                if (tabId === 'trial-bookings') {
                    rowHtml = generateTrialBookingRow(item);
                } else {
                    rowHtml = generateGymRow(tabId, item);
                }
                tbody.innerHTML += rowHtml;
            });

            // Add action button listeners
            addActionButtonListeners();
        } catch (error) {
            console.error(`Error loading ${tabId}:`, error);
            tbody.innerHTML = `<tr><td colspan="7">Error loading ${tabId.replace('-', ' ')}: ${error.message}</td></tr>`;
        }
    }

    function generateTrialBookingRow(booking) {
        const statusClass = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger'
        }[booking.status] || 'secondary';

        return `
            <tr>
                <td>${booking._id}</td>
                <td>${booking.name}</td>
                <td>${booking.gymName}</td>
                <td>${new Date(booking.trialDate).toLocaleDateString()}</td>
                <td>${booking.preferredTime}</td>
                <td><span class="status-badge ${statusClass}">${booking.status}</span></td>
                <td>
                    <button class="btn-action approve" data-id="${booking._id}"><i class="fas fa-check"></i></button>
                    <button class="btn-action reject" data-id="${booking._id}"><i class="fas fa-times"></i></button>
                    <button class="btn-action delete" data-id="${booking._id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    function generateGymRow(tabId, gym) {
        const commonColumns = `
            <td>${gym._id}</td>
            <td>${gym.gymName || 'N/A'}</td>
            <td>${gym.contactPerson || 'N/A'}</td>
            <td>${gym.location?.city || ''}, ${gym.location?.state || ''}</td>
        `;

        if (tabId === 'all-gyms') {
            return `
                <tr>
                    ${commonColumns}
                    <td>${gym.totalMembers || 0}</td>
                    <td><span class="status-badge ${gym.status}">${gym.status}</span></td>
                    <td>
                        <button class="btn-action view" data-id="${gym._id}"><i class="fas fa-eye"></i></button>
                        <button class="btn-action edit" data-id="${gym._id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete" data-id="${gym._id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        } else if (tabId === 'pending-gyms') {
            const formattedCreatedDate = gym.createdAt
                ? new Date(gym.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : '-';

            return `
                <tr>
                    ${commonColumns}
                    <td>${formattedCreatedDate}</td>
                    <td>
                        <button class="btn-action approve" data-id="${gym._id}"><i class="fas fa-check"></i> Approve</button>
                        <button class="btn-action reject" data-id="${gym._id}"><i class="fas fa-times"></i> Reject</button>
                        <button class="btn-action view" data-id="${gym._id}"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        } else if (tabId === 'approved-gyms') {
            const formattedApprovedDate = gym.approvedAt
                ? new Date(gym.approvedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : '-';

            return `
                <tr>
                    ${commonColumns}
                    <td>${gym.totalMembers || 0}</td>
                    <td>${formattedApprovedDate}</td>
                    <td>
                        <button class="btn-action view" data-id="${gym._id}"><i class="fas fa-eye"></i></button>
                        <button class="btn-action revoke" data-id="${gym._id}"><i class="fas fa-undo"></i> Revoke</button>
                    </td>
                </tr>
            `;
        } else if (tabId === 'rejected-gyms') {
            return `
                <tr>
                    ${commonColumns}
                    <td>${gym.rejectionReason || '-'}</td>
                    <td>${gym.rejectedAt ? new Date(gym.rejectedAt).toLocaleDateString() : '-'}</td>
                    <td>
                        <button class="btn-action view" data-id="${gym._id}"><i class="fas fa-eye"></i></button>
                        <button class="btn-action reconsider" data-id="${gym._id}"><i class="fas fa-redo"></i> Reconsider</button>
                    </td>
                </tr>
            `;
        }
    }

    function addActionButtonListeners() {

        // Gym Action Listeners
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', async function (event) {
                event.preventDefault();
                const gymId = this.getAttribute('data-id');

                try {
                    if (this.classList.contains('view')) {
                        window.location.href = `/admin/gym/${gymId}`;
                    } else if (this.classList.contains('edit')) {
                        window.location.href = `/admin/edit-gym/${gymId}`;
                    } else if (this.classList.contains('delete')) {
                        if (confirm('Are you sure you want to delete this gym?')) {
                            const response = await fetch(`${BASE_URL}/api/admin/gyms/${gymId}`, { 
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                                }
                            });

                            if (response.ok) {
                                showNotification('Gym deleted successfully!', 'success');
                                loadTabData('all-gyms');
                            } else {
                                const errorData = await response.json().catch(() => ({}));
                                showNotification(errorData.message || 'Failed to delete gym', 'error');
                            }
                        }
                    } else if (this.classList.contains('approve')) {
                        const response = await fetch(`${BASE_URL}/api/admin/gyms/${gymId}/approve`, { 
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                            }
                        });

                        if (response.ok) {
                            showNotification('Gym approved successfully!', 'success');
                            loadTabData('pending-gyms');
                            loadTabData('approved-gyms');
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            showNotification(errorData.message || 'Failed to approve gym', 'error');
                        }
                    } else if (this.classList.contains('reject')) {
                        const response = await fetch(`${BASE_URL}/api/admin/gyms/${gymId}/reject`, { 
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                            }
                        });

                        if (response.ok) {
                            showNotification('Gym rejected successfully!', 'success');
                            loadTabData('pending-gyms');
                            loadTabData('rejected-gyms');
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            showNotification(errorData.message || 'Failed to reject gym', 'error');
                        }
                    } else if (this.classList.contains('revoke')) {
                        const response = await fetch(`${BASE_URL}/api/admin/gyms/${gymId}/revoke`, { 
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                            }
                        });

                        if (response.ok) {
                            showNotification('Gym approval revoked successfully!', 'success');
                            loadTabData('approved-gyms');
                            loadTabData('pending-gyms');
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            showNotification(errorData.message || 'Failed to revoke gym approval', 'error');
                        }
                    } else if (this.classList.contains('reconsider')) {
                        const response = await fetch(`${BASE_URL}/api/admin/gyms/${gymId}/reconsider`, { 
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                            }
                        });

                        if (response.ok) {
                            showNotification('Gym status reconsidered successfully!', 'success');
                            loadTabData('rejected-gyms');
                            loadTabData('pending-gyms');
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            showNotification(errorData.message || 'Failed to reconsider gym status', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Action failed:', error);
                    showNotification('An unexpected error occurred', 'error');
                }
            });
        });
    }
// ========== TRIAL REQUESTS ==========
function initTrialRequestsTab() {
  console.log('[DEBUG] initTrialRequestsTab called');
  const requestsList = document.querySelector('.trial-requests-list');
  const statusFilter = document.getElementById('status-filter');
  const searchInput = document.getElementById('search-input');

  let trialRequests = [];
  let filteredRequests = [];

  async function fetchTrialRequests() {
    console.log('[DEBUG] fetchTrialRequests called');
    try {
      requestsList.innerHTML = `
        <div class="loading-animation">
          <div class="spinner"></div>
          <p>Loading trial requests...</p>
        </div>
      `;

      const fetchUrl = `${BASE_URL}/api/trial-bookings/bookings`;
      console.log(`[DEBUG] Fetching trial requests from: ${fetchUrl}`);
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const result = await response.json();
      console.log('[DEBUG] Raw fetch result:', result);
      trialRequests = result.bookings || [];
      console.log('[DEBUG] Parsed trialRequests:', trialRequests);
      filteredRequests = [...trialRequests];

      renderRequests();
    } catch (error) {
      console.error('[DEBUG] Error fetching trial requests:', error);
      requestsList.innerHTML = `<div class="error-message"><p>Failed to load trial requests. Please try again later.</p></div>`;
    }
  }

  function renderRequests() {
    console.log('[DEBUG] renderRequests called with filteredRequests:', filteredRequests);
    if (filteredRequests.length === 0) {
      requestsList.innerHTML = '<p class="no-requests">No trial requests found matching your criteria.</p>';
      return;
    }

    requestsList.innerHTML = filteredRequests.map(request => `
      <div class="trial-request-card" data-id="${request._id}">
        <div class="trial-request-header">
          <div class="client-info">
            <img src="https://via.placeholder.com/50" alt="${request.name}" class="client-avatar">
            <div class="client-details">
              <h3>${request.name}</h3>
              <p>${request.email}</p>
            </div>
          </div>
          <span class="status-badge status-${request.status}">${request.status}</span>
        </div>

        <div class="session-details">
          <div class="detail-item"><span class="detail-label">Requested Date</span><span class="detail-value">${formatDate(request.trialDate)}</span></div>
          <div class="detail-item"><span class="detail-label">Preferred Time</span><span class="detail-value">${request.preferredTime}</span></div>
          
          
        </div>

        ${request.status === 'Pending' ? `
          <div class="request-actions">
            <button class="action-btn approve-btn" data-action="approve" data-id="${request._id}">Approve</button>
            <button class="action-btn reject-btn" data-action="reject" data-id="${request._id}">Reject</button>
          </div>
        ` : request.status === 'Approved' ? `
          <div class="request-actions">
            <button class="action-btn revoke-btn" data-action="revoke" data-id="${request._id}">Revoke</button>
            <button class="action-btn delete-btn" data-action="delete" data-id="${request._id}">Delete</button>
          </div>
        ` : ''}

        ${request.notes ? `<div class="additional-notes"><p><strong>Notes:</strong> ${request.notes}</p></div>` : ''}
      </div>
    `).join('');
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function filterRequests() {
    const status = statusFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    filteredRequests = trialRequests.filter(request => {
      const matchesStatus = status === 'all' || (request.status && request.status.toLowerCase() === status.toLowerCase());
      const matchesSearch = (request.name && request.name.toLowerCase().includes(searchTerm)) || 
                            (request.email && request.email.toLowerCase().includes(searchTerm));
      return matchesStatus && matchesSearch;
    });
    renderRequests();
  }

  requestsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const requestId = btn.dataset.id;
    const action = btn.dataset.action;
    const requestCard = document.querySelector(`.trial-request-card[data-id="${requestId}"]`);
    if (!requestCard) return;

    try {
      requestCard.classList.add('processing');

      if (action === 'approve' || action === 'reject') {
        const isApproved = action === 'approve';
        const res = await fetch(`${BASE_URL}/api/trial-bookings/booking/${requestId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: isApproved ? 'Approved' : 'Rejected' })
        });
        if (!res.ok) throw new Error('Status update failed');
        const index = trialRequests.findIndex(r => r._id === requestId);
        if (index !== -1) {
          trialRequests[index].status = isApproved ? 'Approved' : 'Rejected';
        }
      } else if (action === 'revoke') {
        // Set status back to Pending
        const res = await fetch(`${BASE_URL}/api/trial-bookings/booking/${requestId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Pending' })
        });
        if (!res.ok) throw new Error('Status update failed');
        const index = trialRequests.findIndex(r => r._id === requestId);
        if (index !== -1) {
          trialRequests[index].status = 'Pending';
        }
      } else if (action === 'delete') {
        // Delete the booking
        const res = await fetch(`${BASE_URL}/api/trial-bookings/booking/${requestId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Delete failed');
        // Refresh data from backend
        await fetchTrialRequests();
        return; // Don't call filterRequests() again
      }
      filterRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to update request. Please try again.');
    }
  });

  statusFilter.addEventListener('change', filterRequests);
  searchInput.addEventListener('input', filterRequests);

  fetchTrialRequests();
}

    function fetchNotifications() {
        // Placeholder if you add notifications logic
    }

    // ========== Trainer Management Dynamic ========== //
    const trainerMgmtGrid = document.getElementById('trainerMgmtGrid');
    const trainerMgmtTabSections = document.querySelectorAll('.trainer-mgmt-tab-section');
    let allTrainers = [];
    let currentTrainerTab = 'All';

    // Fetch trainers from API
    async function fetchTrainers() {
        try {
            if (trainerMgmtGrid) trainerMgmtGrid.innerHTML = `<div class="loading-animation"><div class="spinner"></div><p>Loading trainers...</p></div>`;
            const token = localStorage.getItem('token');
            // Fetch all trainers for admin, grouped by status
            const response = await fetch(`${BASE_URL}/api/trainers/all`, {
                headers: {
                    'Authorization': `Bearer ${token || ''}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch trainers');
            const trainers = await response.json();
            // Normalize status to lower-case for filtering
            allTrainers = trainers.map(tr => ({ ...tr, status: (tr.status || '').toLowerCase() }));
            renderTrainerCards(currentTrainerTab);
        } catch (err) {
            console.error('[TrainerMgmt] Error fetching trainers:', err);
            if (trainerMgmtGrid) trainerMgmtGrid.innerHTML = `<div class="error-message"><p>Failed to load trainers. Please try again later.</p></div>`;
        }
    }

    // Render trainer cards by tab/status
    function renderTrainerCards(tab) {
        if (!trainerMgmtGrid) return;
        trainerMgmtGrid.innerHTML = '';
        let trainers = allTrainers;
        if (tab !== 'All') {
            trainers = allTrainers.filter(tr => (tr.status || '') === tab.toLowerCase());
        }
        if (!trainers.length) {
            trainerMgmtGrid.innerHTML = `<div style="padding:32px; color:#888; text-align:center; width:100%;">No trainers found for <b>${tab.charAt(0).toUpperCase() + tab.slice(1)}</b>.</div>`;
            return;
        }
        trainers.forEach(trainer => {
            trainerMgmtGrid.innerHTML += generateTrainerCard(trainer);
        });
        addTrainerActionListeners();
    }

    // Generate HTML for a trainer card
    function generateTrainerCard(trainer) {
        const statusClass = `trainer-mgmt-${(trainer.status || 'pending')}`;
        const imgSrc = trainer.image ? (trainer.image.startsWith('http') ? trainer.image : `${BASE_URL}${trainer.image}`) : 'https://via.placeholder.com/100';
        const gyms = Array.isArray(trainer.gym) ? trainer.gym : (trainer.gym ? [trainer.gym] : []);
        const certifications = Array.isArray(trainer.certifications) && trainer.certifications.length ? trainer.certifications : [];
        return `
        <div class="trainer-mgmt-card redesigned" data-id="${trainer._id}">
            <div class="trainer-mgmt-card-header">
                <div class="trainer-mgmt-avatar-section">
                    <img src="${imgSrc}" alt="Trainer" class="trainer-mgmt-profile-img">
                    <span class="trainer-mgmt-status-badge ${statusClass}" title="Status">
                        <i class="fas fa-circle"></i> ${capitalize(trainer.status)}
                    </span>
                </div>
                <div class="trainer-mgmt-main-info">
                    <h3 class="trainer-mgmt-name">${trainer.firstName || ''} ${trainer.lastName || ''}</h3>
                    <div class="trainer-mgmt-contact-row">
                        <span class="trainer-mgmt-contact" title="Email"><i class="fas fa-envelope"></i> ${trainer.email || '-'}</span>
                        <span class="trainer-mgmt-contact" title="Phone"><i class="fas fa-phone"></i> ${trainer.phone || '-'}</span>
                    </div>
                    <div class="trainer-mgmt-specialty-exp">
                        <span class="trainer-mgmt-specialty" title="Specialty"><i class="fas fa-dumbbell"></i> ${trainer.specialty || '-'}</span>
                        <span class="trainer-mgmt-experience" title="Experience"><i class="fas fa-briefcase"></i> ${trainer.experience || 0} yrs</span>
                        <span class="trainer-mgmt-availability" title="Availability"><i class="fas fa-clock"></i> ${trainer.availability || '-'}</span>
                    </div>
                </div>
            </div>
            <div class="trainer-mgmt-card-body">
                <div class="trainer-mgmt-gyms-list">
                    <span class="trainer-mgmt-gyms-title"><i class="fas fa-building"></i> ${trainer.status === 'rejected' ? 'Previously Worked At:' : 'Currently Working At:'}</span>
                    <div class="trainer-mgmt-gyms-container">
                        ${gyms.map(g => `<span class="trainer-mgmt-gym-badge"><i class='fas fa-map-marker-alt'></i> ${g}</span>`).join('')}
                    </div>
                </div>
                <div class="trainer-mgmt-cert-bio-row">
                    <button class="trainer-mgmt-action-btn trainer-mgmt-toggle-btn" data-action="toggle-details">
                        <i class="fas fa-info-circle"></i> ${trainer.bio || certifications.length ? 'Show Details' : 'No More Info'}
                    </button>
                    <div class="trainer-mgmt-more-details" style="display:none;">
                        ${trainer.bio ? `<div class="trainer-mgmt-bio"><i class='fas fa-user'></i> <strong>Bio:</strong> <span>${trainer.bio}</span></div>` : ''}
                        ${certifications.length ? `<div class="trainer-mgmt-certs"><i class='fas fa-certificate'></i> <strong>Certifications:</strong> <ul>${certifications.map(c => `<li>${c}</li>`).join('')}</ul></div>` : ''}
                    </div>
                </div>
            </div>
            <div class="trainer-mgmt-action-buttons">
                ${trainer.status !== 'approved' ? `<button class="trainer-mgmt-action-btn trainer-mgmt-approve-btn" data-action="approve" title="Approve"><i class="fas fa-check"></i></button>` : ''}
                ${trainer.status !== 'rejected' ? `<button class="trainer-mgmt-action-btn trainer-mgmt-reject-btn" data-action="reject" title="Reject"><i class="fas fa-times"></i></button>` : ''}
                <button class="trainer-mgmt-action-btn trainer-mgmt-delete-btn" data-action="delete" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        `;
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Add event listeners for approve/reject/delete
    function addTrainerActionListeners() {
        if (!trainerMgmtGrid) return;

        // Toggle details
        trainerMgmtGrid.querySelectorAll('.trainer-mgmt-toggle-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const moreDetails = btn.parentElement.querySelector('.trainer-mgmt-more-details');
                if (moreDetails) {
                    moreDetails.style.display = moreDetails.style.display === 'none' || !moreDetails.style.display ? 'block' : 'none';
                    btn.innerHTML = `<i class="fas fa-info-circle"></i> ${moreDetails.style.display === 'block' ? 'Hide Details' : 'Show Details'}`;
                }
            });
        });

        // Action buttons (approve/reject/delete)
        trainerMgmtGrid.querySelectorAll('.trainer-mgmt-action-btn').forEach(btn => {
            btn.addEventListener('click', async function (e) {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const card = btn.closest('.trainer-mgmt-card');
                const trainerId = card ? card.getAttribute('data-id') : null;
                if (!trainerId || !action) return;

                // Use /api/trainers/:id for all actions (approve, reject, delete)
                if (action === 'approve') {
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${BASE_URL}/api/trainers/${trainerId}/approve`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (!res.ok) throw new Error('Failed to approve trainer');
                        showNotification('Trainer approved!', 'success');
                        await fetchTrainers();
                        renderTrainerCards(currentTrainerTab);
                    } catch (err) {
                        showNotification('Error approving trainer', 'error');
                    }
                } else if (action === 'reject') {
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${BASE_URL}/api/trainers/${trainerId}/reject`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (!res.ok) throw new Error('Failed to reject trainer');
                        showNotification('Trainer rejected!', 'success');
                        await fetchTrainers();
                        renderTrainerCards(currentTrainerTab);
                    } catch (err) {
                        showNotification('Error rejecting trainer', 'error');
                    }
                } else if (action === 'delete') {
                    showDialog({
                        title: 'Delete Trainer',
                        message: 'Are you sure you want to delete this trainer? This action cannot be undone.',
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        onConfirm: async () => {
                            try {
                                const token = localStorage.getItem('token');
                                const res = await fetch(`${BASE_URL}/api/trainers/${trainerId}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                });
                                if (!res.ok) throw new Error('Failed to delete trainer');
                                showNotification('Trainer deleted!', 'success');
                                await fetchTrainers();
                                renderTrainerCards(currentTrainerTab);
                            } catch (err) {
                                showNotification('Error deleting trainer', 'error');
                            }
                        }
                    });
                }
            });
        });
    }

    // Tab switching for trainer management
    if (trainerMgmtTabSections && trainerMgmtTabSections.length) {
        trainerMgmtTabSections.forEach(tabSection => {
            tabSection.addEventListener('click', function () {
                if (tabSection.classList.contains('active')) return;
                document.querySelectorAll('.trainer-mgmt-tab-section.active').forEach(el => el.classList.remove('active'));
                tabSection.classList.add('active');
                currentTrainerTab = tabSection.getAttribute('data-tab');
                renderTrainerCards(currentTrainerTab);
            });
        });
    }

    // Initial load
    if (trainerMgmtGrid) fetchTrainers();
    // ========== End Trainer Management Dynamic ==========

});
 // Hamburger menu logic
    document.addEventListener('DOMContentLoaded', function () {
      const hamburger = document.getElementById('hamburgerMenu');
      const sidebar = document.getElementById('sidebarMenu');
      const mainContent = document.getElementById('mainContent');
      function closeSidebar() {
        sidebar.classList.remove('active');
      }
      function openSidebar() {
        sidebar.classList.add('active');
      }
      hamburger.addEventListener('click', function () {
        sidebar.classList.toggle('active');
      });
      hamburger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          sidebar.classList.toggle('active');
        }
      });
      // Close sidebar when clicking outside on mobile
      mainContent.addEventListener('click', function (e) {
        if (window.innerWidth <= 900 && sidebar.classList.contains('active')) {
          closeSidebar();
        }
      });
      // Optional: close sidebar on navigation
      document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function () {
          if (window.innerWidth <= 900) closeSidebar();
        });
      });
      // Hide hamburger on desktop
      function handleResize() {
        if (window.innerWidth > 900) {
          sidebar.classList.remove('active');
          hamburger.style.display = 'none';
        } else {
          hamburger.style.display = 'flex';
        }
      }
      window.addEventListener('resize', handleResize);
      handleResize();
    });
    // Responsive table labels for mobile
    document.addEventListener('DOMContentLoaded', function () {
      function setTableLabels() {
        document.querySelectorAll('.table-container table').forEach(table => {
          const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
          table.querySelectorAll('tbody tr').forEach(row => {
            Array.from(row.children).forEach((td, idx) => {
              td.setAttribute('data-label', headers[idx] || '');
            });
          });
        });
      }
      setTableLabels();
      // Re-apply on dynamic content load (if using AJAX)
      const observer = new MutationObserver(setTableLabels);
      document.querySelectorAll('.table-container tbody').forEach(tbody => {
        observer.observe(tbody, { childList: true });
      });
    });