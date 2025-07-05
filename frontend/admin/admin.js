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
    const trainerMgmtTabs = document.querySelectorAll('.trainer-mgmt-tab-btn');
    let allTrainers = [];
    let currentTrainerTab = 'All';

    // Fetch trainers from API
    async function fetchTrainers() {
        try {
            if (trainerMgmtGrid) trainerMgmtGrid.innerHTML = `<div class="loading-animation"><div class="spinner"></div><p>Loading trainers...</p></div>`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/trainers/all`, {
                headers: {
                    'Authorization': `Bearer ${token || ''}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch trainers');
            allTrainers = await response.json();
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
            const status = tab.toLowerCase();
            trainers = allTrainers.filter(tr => (tr.status || '').toLowerCase() === status);
        }
        if (!trainers.length) {
            trainerMgmtGrid.innerHTML = `<p class="no-trainers">No trainers found for this category.</p>`;
            return;
        }
        trainers.forEach(trainer => {
            trainerMgmtGrid.innerHTML += generateTrainerCard(trainer);
        });
        addTrainerActionListeners();
    }

    // Generate HTML for a trainer card
    function generateTrainerCard(trainer) {
        const statusClass = `trainer-mgmt-${(trainer.status || 'pending').toLowerCase()}`;
        const imgSrc = trainer.image ? `${BASE_URL}${trainer.image}` : 'https://via.placeholder.com/100';
        const gyms = Array.isArray(trainer.gym) ? trainer.gym : (trainer.gym ? [trainer.gym] : []);
        return `
        <div class="trainer-mgmt-card" data-id="${trainer._id}">
            <div class="trainer-mgmt-status-badge ${statusClass}">${capitalize(trainer.status)}</div>
            <div class="trainer-mgmt-profile-header">
                <img src="${imgSrc}" alt="Trainer" class="trainer-mgmt-profile-img">
            </div>
            <div class="trainer-mgmt-profile-body">
                <h3 class="trainer-mgmt-name">${trainer.firstName || ''} ${trainer.lastName || ''}</h3>
                <p class="trainer-mgmt-email">${trainer.email || ''}</p>
                <div class="trainer-mgmt-details">
                    <div class="detail-item">
                        <div class="detail-value">${trainer.experience || 0}</div>
                        <div class="detail-label">Years</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${trainer.rate || '-'}</div>
                        <div class="detail-label">Rating</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${trainer.clients || '-'}</div>
                        <div class="detail-label">Clients</div>
                    </div>
                </div>
                <div class="trainer-mgmt-gyms-list">
                    <p class="trainer-mgmt-gyms-title">${trainer.status === 'rejected' ? 'Previously Worked At:' : 'Currently Working At:'}</p>
                    <div class="trainer-mgmt-gyms-container">
                        ${gyms.map(g => `<span class="trainer-mgmt-gym-badge">${g}</span>`).join('')}
                    </div>
                </div>
                <div class="trainer-mgmt-action-buttons">
                    ${trainer.status !== 'approved' ? `<button class="trainer-mgmt-action-btn trainer-mgmt-approve-btn" data-action="approve"> <i class="fas fa-check"></i> Approve </button>` : ''}
                    ${trainer.status !== 'rejected' ? `<button class="trainer-mgmt-action-btn trainer-mgmt-reject-btn" data-action="reject"> <i class="fas fa-times"></i> Reject </button>` : ''}
                    <button class="trainer-mgmt-action-btn trainer-mgmt-delete-btn" data-action="delete"> <i class="fas fa-trash"></i> Delete </button>
                </div>
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
        trainerMgmtGrid.querySelectorAll('.trainer-mgmt-action-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const card = this.closest('.trainer-mgmt-card');
                const trainerId = card.getAttribute('data-id');
                const action = this.getAttribute('data-action');
                if (!trainerId || !action) return;
                try {
                    let endpoint, method, body = null;
                    if (action === 'approve') {
                        endpoint = `${BASE_URL}/api/trainers/${trainerId}/approve`;
                        method = 'PATCH';
                    } else if (action === 'reject') {
                        endpoint = `${BASE_URL}/api/trainers/${trainerId}/reject`;
                        method = 'PATCH';
                    } else if (action === 'delete') {
                        if (!confirm('Are you sure you want to delete this trainer?')) return;
                        endpoint = `${BASE_URL}/api/trainers/${trainerId}`;
                        method = 'DELETE';
                    }
                    const token = localStorage.getItem('token');
                    const res = await fetch(endpoint, {
                        method,
                        headers: {
                            'Authorization': `Bearer ${token || ''}`,
                            'Content-Type': 'application/json'
                        },
                        body: body ? JSON.stringify(body) : undefined
                    });
                    if (!res.ok) throw new Error('Action failed');
                    showNotification(`Trainer ${action}d successfully!`, 'success');
                    await fetchTrainers();
                } catch (err) {
                    console.error(`[TrainerMgmt] Action failed:`, err);
                    showNotification('An error occurred. Please try again.', 'error');
                }
            });
        });
    }

    // Tab switching for trainer management
    if (trainerMgmtTabs && trainerMgmtTabs.length) {
        trainerMgmtTabs.forEach((tabBtn, idx) => {
            tabBtn.addEventListener('click', function() {
                trainerMgmtTabs.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                const tabNames = ['All', 'Pending', 'Approved', 'Rejected', 'Revoked'];
                currentTrainerTab = tabNames[idx];
                renderTrainerCards(currentTrainerTab);
            });
        });
    }

    // Initial load
    if (trainerMgmtGrid) fetchTrainers();
    // ========== End Trainer Management Dynamic ==========

});
