// === Enhanced Support & Reviews Management System ===
// Comprehensive system for notifications, reviews, grievances, and communications
// Designed with modern UI/UX patterns similar to the payment tab

class SupportReviewsManager {
    constructor() {
        this.currentTab = 'notifications';
        this.notifications = [];
        this.reviews = [];
        this.grievances = [];
        this.communications = [];
        this.currentGymId = null;
        this.gymProfile = null;
        this.BASE_URL = 'http://localhost:5000';
        this.stats = {
            notifications: { total: 0, unread: 0, system: 0, priority: 0 },
            reviews: { total: 0, average: 0, pending: 0, recent: 0 },
            grievances: { total: 0, open: 0, resolved: 0, urgent: 0 },
            communications: { total: 0, unread: 0, active: 0, responseTime: 0 }
        };
        this.init();
    }

    init() {
        console.log('🚀 Initializing Enhanced Support & Reviews Manager');
        this.bindEvents();
        this.fetchGymId();
    }

    async fetchGymId() {
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!token) {
                console.error('No gym admin token found');
                return;
            }

            const response = await fetch(`${this.BASE_URL}/api/gyms/profile/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.gymProfile = data;
                this.currentGymId = data._id;
                console.log('✅ Gym profile fetched:', this.gymProfile);
                this.loadInitialData();
            }
        } catch (error) {
            console.error('Error fetching gym profile:', error);
        }
    }

    bindEvents() {
        // Tab navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.support-tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Header action buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('#sendNotificationBtn') || e.target.closest('#sendNotificationBtn')) {
                this.openSendNotificationModal();
            }
            if (e.target.matches('#raiseGrievanceBtn') || e.target.closest('#raiseGrievanceBtn')) {
                this.openRaiseGrievanceModal();
            }
            if (e.target.matches('#startCommunicationBtn') || e.target.closest('#startCommunicationBtn')) {
                this.openStartCommunicationModal();
            }
        });

        // Modal controls
        document.addEventListener('click', (e) => {
            if (e.target.matches('.support-modal-close') || e.target.matches('.support-modal')) {
                if (e.target.matches('.support-modal') && e.target === e.currentTarget) {
                    this.closeModal();
                }
                if (e.target.matches('.support-modal-close')) {
                    this.closeModal();
                }
            }
        });

        // Review reply buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.review-action[data-action="reply"]') || e.target.closest('.review-action[data-action="reply"]')) {
                const reviewId = e.target.closest('.review-item').dataset.reviewId;
                this.openReplyModal(reviewId);
            }
        });

        // Notification actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.notification-action')) {
                const action = e.target.dataset.action;
                const notificationId = e.target.closest('.notification-item').dataset.notificationId;
                this.handleNotificationAction(action, notificationId);
            }
        });

        // Grievance actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.grievance-item')) {
                const grievanceId = e.target.dataset.grievanceId;
                this.openGrievanceDetails(grievanceId);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#sendNotificationForm')) {
                e.preventDefault();
                this.handleSendNotification(e.target);
            }
            if (e.target.matches('#raiseGrievanceForm')) {
                e.preventDefault();
                this.handleRaiseGrievance(e.target);
            }
            if (e.target.matches('#replyForm')) {
                e.preventDefault();
                this.handleReplySubmission(e.target);
            }
            if (e.target.matches('#notificationReplyForm')) {
                e.preventDefault();
                this.handleNotificationReplySubmission(e.target);
            }
            if (e.target.matches('#urgentResponseForm')) {
                e.preventDefault();
                this.handleUrgentResponseSubmission(e.target);
            }
        });

        // Search and filters
        document.addEventListener('input', (e) => {
            if (e.target.matches('.support-search')) {
                this.handleSearch(e.target.value, this.currentTab);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('.support-filter')) {
                this.handleFilter(e.target.value, this.currentTab);
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.support-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.support-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(`${tabName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentTab = tabName;
        this.loadTabData(tabName);
    }

    async loadInitialData() {
        console.log('📊 Loading initial data for Support & Reviews');
        await Promise.all([
            this.loadNotifications(),
            this.loadReviews(),
            this.loadGrievances(),
            this.loadCommunications()
        ]);
        this.updateStats();
        this.loadTabData('notifications');
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'notifications':
                this.renderNotifications();
                break;
            case 'reviews':
                this.renderReviews();
                break;
            case 'grievances':
                this.renderGrievances();
                break;
            case 'communications':
                this.renderCommunications();
                break;
        }
    }

    async loadNotifications() {
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            const response = await fetch(`${this.BASE_URL}/api/gym/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.notifications = data.notifications || [];
                this.updateNotificationStats();
                console.log('✅ Notifications loaded:', this.notifications.length);
            } else {
                console.error('Failed to load notifications:', response.status);
                this.notifications = this.getMockNotifications();
                this.updateNotificationStats();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.notifications = this.getMockNotifications();
            this.updateNotificationStats();
        }
    }

    async loadReviews() {
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!this.currentGymId) {
                console.error('No gym ID available for loading reviews');
                this.reviews = this.getMockReviews();
                this.updateReviewStats();
                return;
            }

            const response = await fetch(`${this.BASE_URL}/api/reviews/gym/${this.currentGymId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.reviews = data.reviews || data; // Handle both response formats
                this.updateReviewStats();
                console.log('✅ Reviews loaded:', this.reviews.length);
            } else {
                console.error('Failed to load reviews:', response.status, response.statusText);
                const errorData = await response.text();
                console.error('Error response:', errorData);
                this.reviews = this.getMockReviews();
                this.updateReviewStats();
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.reviews = this.getMockReviews();
            this.updateReviewStats();
        }
    }

    async loadGrievances() {
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            const response = await fetch(`${this.BASE_URL}/api/support/grievances/gym/${this.currentGymId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.grievances = await response.json();
                this.updateGrievanceStats();
                console.log('✅ Grievances loaded:', this.grievances.length);
            } else {
                console.error('Failed to load grievances:', response.status);
                this.grievances = this.getMockGrievances();
                this.updateGrievanceStats();
            }
        } catch (error) {
            console.error('Error loading grievances:', error);
            this.grievances = this.getMockGrievances();
            this.updateGrievanceStats();
        }
    }

    async loadCommunications() {
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            const response = await fetch(`${this.BASE_URL}/api/support/gym/${this.currentGymId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.communications = await response.json();
                this.updateCommunicationStats();
                console.log('✅ Communications loaded:', this.communications.length);
            } else {
                console.error('Failed to load communications:', response.status);
                this.communications = this.getMockCommunications();
                this.updateCommunicationStats();
            }
        } catch (error) {
            console.error('Error loading communications:', error);
            this.communications = this.getMockCommunications();
            this.updateCommunicationStats();
        }
    }

    updateStats() {
        // Update tab counters only (stats cards removed as requested)
        const notificationCounter = document.querySelector('[data-tab="notifications"] .tab-counter');
        const reviewCounter = document.querySelector('[data-tab="reviews"] .tab-counter');
        const grievanceCounter = document.querySelector('[data-tab="grievances"] .tab-counter');
        const communicationCounter = document.querySelector('[data-tab="communications"] .tab-counter');

        if (notificationCounter) notificationCounter.textContent = this.stats.notifications.unread;
        if (reviewCounter) reviewCounter.textContent = this.stats.reviews.pending;
        if (grievanceCounter) grievanceCounter.textContent = this.stats.grievances.open;
        if (communicationCounter) communicationCounter.textContent = this.stats.communications.unread;
    }

    updateNotificationStats() {
        this.stats.notifications.total = this.notifications.length;
        this.stats.notifications.unread = this.notifications.filter(n => !n.read).length;
        this.stats.notifications.system = this.notifications.filter(n => n.type === 'system').length;
        this.stats.notifications.priority = this.notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length;
    }

    updateReviewStats() {
        this.stats.reviews.total = this.reviews.length;
        this.stats.reviews.average = this.reviews.length > 0 
            ? this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length 
            : 0;
        this.stats.reviews.pending = this.reviews.filter(r => !r.adminReply).length;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        this.stats.reviews.recent = this.reviews.filter(r => new Date(r.createdAt) > weekAgo).length;
    }

    updateGrievanceStats() {
        this.stats.grievances.total = this.grievances.length;
        this.stats.grievances.open = this.grievances.filter(g => g.status === 'open' || g.status === 'in-progress').length;
        this.stats.grievances.resolved = this.grievances.filter(g => g.status === 'resolved').length;
        this.stats.grievances.urgent = this.grievances.filter(g => g.priority === 'urgent').length;
    }

    updateCommunicationStats() {
        this.stats.communications.total = this.communications.length;
        this.stats.communications.unread = this.communications.filter(c => c.unreadCount > 0).length;
        this.stats.communications.active = this.communications.filter(c => c.status === 'active').length;
        this.stats.communications.responseTime = 2; // Mock average response time
    }

    renderNotifications() {
        const container = document.querySelector('#notificationsSection .notifications-list');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = this.getEmptyState('notifications', 'No notifications yet', 'You\'ll see all gym notifications here');
            return;
        }

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" data-notification-id="${notification._id || notification.id}">
                <div class="notification-header">
                    <div class="notification-title-section">
                        <div class="notification-icon">
                            <i class="fas ${this.getNotificationIcon(notification.type, notification.priority)}"></i>
                        </div>
                        <div class="notification-title-content">
                            <h4 class="notification-title">
                                ${notification.title}
                                ${notification.metadata?.ticketId ? `<span class="ticket-id">#${notification.metadata.ticketId}</span>` : ''}
                            </h4>
                        </div>
                    </div>
                    <div class="notification-meta">
                        ${notification.type !== 'grievance-reply' ? `<span class="notification-badge ${notification.type} ${notification.priority}">${notification.type}</span>` : ''}
                        <span class="notification-priority priority-${notification.priority}">${notification.priority}</span>
                        <span class="notification-time">${this.formatDate(notification.createdAt)}</span>
                    </div>
                </div>
                ${notification.metadata?.adminMessage ? `
                    <p class="notification-message admin-main-message">${notification.metadata.adminMessage}</p>
                ` : `
                    <p class="notification-message">${notification.message}</p>
                `}
                <div class="notification-actions">
                    ${!notification.read ? `<button class="notification-action primary" data-action="mark-read">
                        <i class="fas fa-check"></i> Mark as Read
                    </button>` : ''}
                    ${this.canReplyToNotification(notification) ? `<button class="notification-action reply" data-action="reply">
                        <i class="fas fa-reply"></i> Reply
                    </button>` : ''}
                    ${notification.priority === 'high' || notification.priority === 'urgent' ? `<button class="notification-action urgent" data-action="respond">
                        <i class="fas fa-exclamation-triangle"></i> Respond
                    </button>` : ''}
                    <button class="notification-action view" data-action="view-details">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderReviews() {
        const container = document.querySelector('#reviewsSection .reviews-list');
        if (!container) return;

        if (this.reviews.length === 0) {
            container.innerHTML = this.getEmptyState('reviews', 'No reviews yet', 'Member reviews will appear here');
            return;
        }

        container.innerHTML = this.reviews.map(review => `
            <div class="review-item" data-review-id="${review._id || review.id}">
                <div class="review-header">
                    <div class="review-user">
                        <img src="${review.user?.profilePic || '/default-avatar.png'}" alt="Member" class="review-avatar">
                        <div class="review-user-info">
                            <h4>${review.user?.name || review.reviewerName || 'Anonymous Member'}</h4>
                            <p>${this.formatDate(review.createdAt)}</p>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${this.renderStars(review.rating)}
                    </div>
                </div>
                <div class="review-content">${review.comment}</div>
                ${review.adminReply ? `
                    <div class="admin-reply" style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 12px; border-left: 3px solid #1976d2;">
                        <strong>Your Reply:</strong>
                        <p style="margin: 4px 0 0 0;">${review.adminReply}</p>
                    </div>
                ` : ''}
                <div class="review-actions">
                    ${!review.adminReply ? `<button class="review-action primary" data-action="reply"><i class="fas fa-reply"></i> Reply</button>` : ''}
                    <button class="review-action" data-action="feature"><i class="fas fa-star"></i> Feature</button>
                    <button class="review-action" data-action="report"><i class="fas fa-flag"></i> Report</button>
                </div>
            </div>
        `).join('');
    }

    renderGrievances() {
        const container = document.querySelector('#grievancesSection .grievances-list');
        if (!container) return;

        if (this.grievances.length === 0) {
            container.innerHTML = this.getEmptyState('grievances', 'No grievances', 'Member grievances will be listed here');
            return;
        }

        container.innerHTML = this.grievances.map(grievance => `
            <div class="grievance-item" data-grievance-id="${grievance._id || grievance.id}">
                <div class="grievance-header">
                    <h4 class="grievance-title">${grievance.title}</h4>
                    <div class="grievance-meta">
                        <span class="grievance-priority ${grievance.priority}">${grievance.priority}</span>
                        <span class="grievance-status ${grievance.status}">${grievance.status}</span>
                    </div>
                </div>
                <p class="grievance-description">${grievance.description}</p>
                <div class="grievance-footer">
                    <span>By ${grievance.member?.name || 'Anonymous'}</span>
                    <span>${this.formatDate(grievance.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    renderCommunications() {
        const container = document.querySelector('#communicationsSection .communications-layout');
        if (!container) return;

        if (this.communications.length === 0) {
            container.innerHTML = `
                <div class="conversations-sidebar">
                    <div class="conversations-list">
                        ${this.getEmptyState('communications', 'No conversations', 'Start communicating with members')}
                    </div>
                </div>
                <div class="chat-main">
                    <div class="chat-container">
                        <div class="chat-placeholder">
                            <i class="fas fa-comments"></i>
                            <h3>Select a conversation</h3>
                            <p>Choose a conversation from the sidebar to view messages</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="conversations-sidebar">
                <div class="conversations-list">
                    ${this.communications.map(comm => `
                        <div class="conversation-item ${comm.unreadCount > 0 ? 'unread' : ''}" data-conversation-id="${comm._id}">
                            <div class="conversation-header">
                                <span class="conversation-name">${comm.member?.name || 'Unknown Member'}</span>
                                <span class="conversation-time">${this.formatTime(comm.lastMessage?.createdAt)}</span>
                            </div>
                            <div class="conversation-preview">${comm.lastMessage?.content || 'No messages yet'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="chat-main">
                <div class="chat-container">
                    <div class="chat-placeholder">
                        <i class="fas fa-comments"></i>
                        <h3>Select a conversation</h3>
                        <p>Choose a conversation from the sidebar to view messages</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Modal Functions
    openSendNotificationModal() {
        const modal = document.getElementById('sendNotificationModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    openRaiseGrievanceModal() {
        const modal = document.getElementById('raiseGrievanceModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    openStartCommunicationModal() {
        const modal = document.getElementById('startCommunicationModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    openReplyModal(reviewId) {
        const modal = document.getElementById('replyModal');
        const review = this.reviews.find(r => (r._id || r.id) === reviewId);
        
        if (review && modal) {
            // Populate review details in modal
            const reviewDetails = modal.querySelector('.review-details');
            if (reviewDetails) {
                reviewDetails.innerHTML = `
                    <div class="review-header">
                        <div class="review-user">
                            <img src="${review.user?.profilePic || '/default-avatar.png'}" alt="Member" class="review-avatar">
                            <div class="review-user-info">
                                <h4>${review.user?.name || review.reviewerName || 'Anonymous Member'}</h4>
                                <div class="review-rating">${this.renderStars(review.rating)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="review-content">${review.comment}</div>
                `;
            }
            
            const replyForm = modal.querySelector('#replyForm');
            if (replyForm) {
                replyForm.dataset.reviewId = reviewId;
            }
            modal.classList.add('active');
        }
    }

    openGrievanceDetails(grievanceId) {
        const modal = document.getElementById('grievanceDetailsModal');
        const grievance = this.grievances.find(g => (g._id || g.id) === grievanceId);
        
        if (grievance && modal) {
            const modalHeader = modal.querySelector('.support-modal-header h3');
            const modalBody = modal.querySelector('.support-modal-body');
            
            if (modalHeader) {
                modalHeader.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${grievance.title}`;
            }
            
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="grievance-details">
                        <div class="detail-row">
                            <label>Status:</label>
                            <span class="grievance-status ${grievance.status}">${grievance.status}</span>
                        </div>
                        <div class="detail-row">
                            <label>Priority:</label>
                            <span class="grievance-priority ${grievance.priority}">${grievance.priority}</span>
                        </div>
                        <div class="detail-row">
                            <label>Submitted by:</label>
                            <span>${grievance.member?.name || 'Anonymous'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Date:</label>
                            <span>${this.formatDate(grievance.createdAt)}</span>
                        </div>
                        <div class="detail-section">
                            <label>Description:</label>
                            <p>${grievance.description}</p>
                        </div>
                        ${grievance.evidence ? `
                            <div class="detail-section">
                                <label>Evidence:</label>
                                <div class="evidence-files">
                                    ${grievance.evidence.map(file => `<a href="${file.url}" target="_blank">${file.name}</a>`).join(', ')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="grievance-actions" style="margin-top: 24px;">
                        <button class="btn-primary" onclick="supportManager.updateGrievanceStatus('${grievanceId}', 'in-progress')">
                            <i class="fas fa-play"></i> Start Processing
                        </button>
                        <button class="btn-primary" onclick="supportManager.updateGrievanceStatus('${grievanceId}', 'resolved')">
                            <i class="fas fa-check"></i> Mark Resolved
                        </button>
                        <button class="btn-secondary" onclick="supportManager.respondToGrievance('${grievanceId}')">
                            <i class="fas fa-reply"></i> Respond
                        </button>
                    </div>
                `;
            }
            modal.classList.add('active');
        }
    }

    closeModal() {
        document.querySelectorAll('.support-modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Form Handlers
    async handleSendNotification(form) {
        const formData = new FormData(form);
        const notificationData = {
            title: formData.get('title'),
            message: formData.get('message'),
            type: formData.get('type'),
            priority: formData.get('priority'),
            targetType: formData.get('targetType'),
            recipients: formData.get('recipients')?.split(',').map(r => r.trim()) || []
        };

        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            
            // Check if this is for main admin
            if (notificationData.targetType === 'admin' || notificationData.targetType === 'main-admin') {
                const gymProfile = window.currentGymProfile || this.gymProfile || {};
                
                // Send to main admin notification system
                const response = await fetch(`${this.BASE_URL}/api/admin/notifications/send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: notificationData.title,
                        message: notificationData.message,
                        type: notificationData.type || 'gym-admin-message',
                        priority: notificationData.priority || 'medium',
                        icon: this.getNotificationIcon(notificationData.type, notificationData.priority),
                        color: this.getNotificationColor(notificationData.type, notificationData.priority),
                        metadata: {
                            source: 'gym-admin',
                            timestamp: new Date().toISOString(),
                            originalType: notificationData.type
                        },
                        gym: {
                            gymId: gymProfile._id || gymProfile.gymId || this.currentGymId,
                            gymName: gymProfile.gymName || 'Unknown Gym',
                            address: gymProfile.address || '',
                            email: gymProfile.email || '',
                            phone: gymProfile.phone || ''
                        }
                    })
                });

                if (response.ok) {
                    this.showSuccessMessage('Notification sent to main admin successfully!');
                    console.log('✅ Notification sent to main admin');
                } else {
                    throw new Error('Failed to send notification to main admin');
                }
            } else {
                // Send to gym members/trainers (existing logic)
                console.log('Sending notification to gym users:', notificationData);
                this.showSuccessMessage('Notification sent successfully!');
            }
            
            this.closeModal();
            form.reset();
            
            // Refresh notifications
            await this.loadNotifications();
            this.renderNotifications();
            this.updateStats();
            
        } catch (error) {
            console.error('Error sending notification:', error);
            this.showErrorMessage('Failed to send notification. Please try again.');
        }
    }

    async handleRaiseGrievance(form) {
        const formData = new FormData(form);
        const grievanceData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            affectedMembers: formData.get('affectedMembers')?.split(',').map(m => m.trim()) || []
        };

        try {
            // API call would go here
            console.log('Raising grievance:', grievanceData);
            
            // Mock success
            this.showSuccessMessage('Grievance raised successfully!');
            this.closeModal();
            form.reset();
            
            // Refresh grievances
            await this.loadGrievances();
            this.renderGrievances();
            this.updateStats();
            
        } catch (error) {
            console.error('Error raising grievance:', error);
            this.showErrorMessage('Failed to raise grievance. Please try again.');
        }
    }

    async handleReplySubmission(form) {
        const formData = new FormData(form);
        const reviewId = form.dataset.reviewId;
        const replyData = {
            message: formData.get('message'),
            isPublic: formData.get('isPublic') === 'on'
        };

        try {
            // API call would go here
            console.log('Replying to review:', reviewId, replyData);
            
            // Mock success - update the review with reply
            const review = this.reviews.find(r => (r._id || r.id) === reviewId);
            if (review) {
                review.adminReply = replyData.message;
            }
            
            this.showSuccessMessage('Reply sent successfully!');
            this.closeModal();
            form.reset();
            
            // Refresh reviews
            this.renderReviews();
            this.updateStats();
            
        } catch (error) {
            console.error('Error sending reply:', error);
            this.showErrorMessage('Failed to send reply. Please try again.');
        }
    }

    async handleNotificationAction(action, notificationId) {
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            const notification = this.notifications.find(n => (n._id || n.id) === notificationId);
            if (!notification) return;

            switch (action) {
                case 'mark-read':
                    const response = await fetch(`${this.BASE_URL}/api/gym/notifications/${notificationId}/read`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        notification.read = true;
                        console.log('✅ Notification marked as read');
                        this.showSuccessMessage('Notification marked as read');
                    } else {
                        this.showErrorMessage('Failed to mark notification as read');
                    }
                    break;
                    
                case 'reply':
                    this.openNotificationReplyModal(notificationId);
                    return; // Don't re-render yet
                    
                case 'respond':
                    this.openNotificationResponseModal(notificationId);
                    return; // Don't re-render yet
                    
                case 'view-details':
                    this.openNotificationDetailsModal(notificationId);
                    return; // Don't re-render yet
            }

            this.renderNotifications();
            this.updateStats();
            
        } catch (error) {
            console.error(`Error ${action} notification:`, error);
            this.showErrorMessage(`Failed to ${action} notification`);
        }
    }

    async handleReplySubmission(form) {
        const formData = new FormData(form);
        const reviewId = form.dataset.reviewId;
        const replyData = {
            message: formData.get('message'),
            isPublic: formData.get('isPublic') === 'on'
        };

        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            const response = await fetch(`${this.BASE_URL}/api/reviews/${reviewId}/reply`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(replyData)
            });

            if (response.ok) {
                // Update the review with reply
                const review = this.reviews.find(r => (r._id || r.id) === reviewId);
                if (review) {
                    review.adminReply = replyData.message;
                }
                
                this.showSuccessMessage('Reply sent successfully!');
                this.closeModal();
                form.reset();
                
                // Refresh reviews
                this.renderReviews();
                this.updateStats();
                console.log('✅ Review reply submitted successfully');
            } else {
                throw new Error('Failed to submit reply');
            }
            
        } catch (error) {
            console.error('Error sending reply:', error);
            this.showErrorMessage('Failed to send reply. Please try again.');
        }
    }

    async updateGrievanceStatus(grievanceId, newStatus) {
        try {
            const grievance = this.grievances.find(g => (g._id || g.id) === grievanceId);
            if (grievance) {
                grievance.status = newStatus;
                // API call would go here for grievance status update
                console.log('Updated grievance status:', grievanceId, newStatus);
                
                this.showSuccessMessage(`Grievance ${newStatus} successfully!`);
                this.closeModal();
                this.renderGrievances();
                this.updateStats();
            }
        } catch (error) {
            console.error('Error updating grievance status:', error);
        }
    }

    // Search and Filter
    handleSearch(query, tabName) {
        // Implement search functionality based on current tab
        console.log(`Searching ${tabName} for:`, query);
    }

    handleFilter(filterValue, tabName) {
        // Implement filter functionality based on current tab
        console.log(`Filtering ${tabName} by:`, filterValue);
    }

    async handleNotificationReplySubmission(form) {
        const formData = new FormData(form);
        const notificationId = form.dataset.notificationId;
        const replyData = {
            message: formData.get('replyMessage'),
            priority: formData.get('replyPriority'),
            status: formData.get('replyStatus'),
            notifyMember: formData.get('notifyMember') === 'on'
        };

        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            const notification = this.notifications.find(n => (n._id || n.id) === notificationId);
            
            if (notification?.metadata?.ticketId) {
                // Send reply to the ticket system
                const response = await fetch(`${this.BASE_URL}/api/support/tickets/${notification.metadata.ticketId}/reply`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: replyData.message,
                        priority: replyData.priority,
                        status: replyData.status,
                        source: 'gym-admin',
                        notifyMember: replyData.notifyMember
                    })
                });

                if (response.ok) {
                    this.showSuccessMessage('Reply sent successfully!');
                    // Mark notification as read
                    notification.read = true;
                    console.log('✅ Notification reply submitted successfully');
                } else {
                    throw new Error('Failed to submit reply');
                }
            } else {
                // Send reply to main admin notification system using dedicated endpoint
                const gymProfile = window.currentGymProfile || this.gymProfile || {};
                
                const adminReplyResponse = await fetch(`${this.BASE_URL}/api/admin/notifications/reply`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        originalNotificationId: notificationId,
                        replyMessage: replyData.message,
                        priority: replyData.priority || 'medium',
                        status: replyData.status || 'replied',
                        gym: {
                            gymId: gymProfile._id || gymProfile.gymId || this.currentGymId,
                            gymName: gymProfile.gymName || 'Unknown Gym',
                            address: gymProfile.address || '',
                            email: gymProfile.email || '',
                            phone: gymProfile.phone || ''
                        }
                    })
                });

                if (adminReplyResponse.ok) {
                    const result = await adminReplyResponse.json();
                    this.showSuccessMessage('Reply sent to main admin successfully!');
                    notification.read = true;
                    console.log('✅ Reply sent to main admin notification system:', result);
                } else {
                    const error = await adminReplyResponse.json();
                    throw new Error(error.message || 'Failed to send reply to main admin');
                }
            }
            
            this.closeModal();
            form.reset();
            this.renderNotifications();
            this.updateStats();
            
        } catch (error) {
            console.error('Error sending notification reply:', error);
            this.showErrorMessage('Failed to send reply. Please try again.');
        }
    }

    openNotificationDetailsModal(notificationId) {
        const notification = this.notifications.find(n => (n._id || n.id) === notificationId);
        if (!notification) return;

        const modal = document.getElementById('notificationDetailsModal') || this.createNotificationDetailsModal();
        const modalHeader = modal.querySelector('.support-modal-header h3');
        const modalBody = modal.querySelector('.support-modal-body');
        
        if (modalHeader) {
            modalHeader.innerHTML = `<i class="fas ${this.getNotificationIcon(notification.type, notification.priority)}"></i> ${notification.title}`;
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="notification-details">
                    <div class="detail-grid">
                        <div class="detail-row">
                            <label>Type:</label>
                            <span class="notification-badge ${notification.type}">${notification.type}</span>
                        </div>
                        <div class="detail-row">
                            <label>Priority:</label>
                            <span class="notification-priority priority-${notification.priority}">${notification.priority}</span>
                        </div>
                        <div class="detail-row">
                            <label>Status:</label>
                            <span class="notification-status ${notification.read ? 'read' : 'unread'}">${notification.read ? 'Read' : 'Unread'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Created:</label>
                            <span>${this.formatDate(notification.createdAt)}</span>
                        </div>
                        ${notification.metadata?.ticketId ? `
                            <div class="detail-row">
                                <label>Ticket ID:</label>
                                <span>${notification.metadata.ticketId}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="detail-section">
                        <label>Message:</label>
                        <p class="notification-full-message">${notification.message}</p>
                    </div>
                    ${notification.metadata?.adminMessage ? `
                        <div class="detail-section">
                            <label>Admin Message:</label>
                            <p class="admin-message-full">${notification.metadata.adminMessage}</p>
                        </div>
                    ` : ''}
                    ${notification.metadata?.ticketSubject ? `
                        <div class="detail-section">
                            <label>Related Ticket Subject:</label>
                            <p>${notification.metadata.ticketSubject}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        modal.classList.add('active');
    }

    openNotificationResponseModal(notificationId) {
        const notification = this.notifications.find(n => (n._id || n.id) === notificationId);
        if (!notification) return;

        const modal = document.getElementById('notificationResponseModal') || this.createNotificationResponseModal();
        const modalHeader = modal.querySelector('.support-modal-header h3');
        const modalBody = modal.querySelector('.support-modal-body');
        
        if (modalHeader) {
            modalHeader.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Urgent Response Required`;
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="urgent-notification-response">
                    <div class="urgent-alert">
                        <i class="fas fa-fire"></i>
                        <span>This notification requires immediate attention</span>
                    </div>
                    <div class="notification-summary">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                    </div>
                    <form id="urgentResponseForm" data-notification-id="${notificationId}">
                        <div class="form-group">
                            <label for="urgentAction">Immediate Action:</label>
                            <select id="urgentAction" name="urgentAction" required>
                                <option value="">Select action...</option>
                                <option value="escalate">Escalate to Management</option>
                                <option value="investigate">Start Investigation</option>
                                <option value="contact-member">Contact Member Directly</option>
                                <option value="system-check">Perform System Check</option>
                                <option value="emergency-response">Emergency Response</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="urgentNotes">Action Notes:</label>
                            <textarea id="urgentNotes" name="urgentNotes" required rows="3" 
                                placeholder="Describe the actions you are taking..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="followUpTime">Follow-up Required:</label>
                            <select id="followUpTime" name="followUpTime">
                                <option value="15-minutes">15 minutes</option>
                                <option value="1-hour">1 hour</option>
                                <option value="4-hours">4 hours</option>
                                <option value="24-hours">24 hours</option>
                            </select>
                        </div>
                        <div class="support-modal-footer">
                            <button type="button" class="btn-secondary" onclick="supportManager.closeModal()">Cancel</button>
                            <button type="submit" class="btn-primary urgent">
                                <i class="fas fa-bolt"></i> Take Action
                            </button>
                        </div>
                    </form>
                </div>
            `;
        }
        
        modal.classList.add('active');
    }

    createNotificationDetailsModal() {
        const modal = document.createElement('div');
        modal.id = 'notificationDetailsModal';
        modal.className = 'support-modal';
        modal.innerHTML = `
            <div class="support-modal-content">
                <div class="support-modal-header">
                    <h3><i class="fas fa-bell"></i> Notification Details</h3>
                    <button class="support-modal-close">&times;</button>
                </div>
                <div class="support-modal-body">
                    <!-- Content will be populated dynamically -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    createNotificationResponseModal() {
        const modal = document.createElement('div');
        modal.id = 'notificationResponseModal';
        modal.className = 'support-modal';
        modal.innerHTML = `
            <div class="support-modal-content">
                <div class="support-modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Urgent Response</h3>
                    <button class="support-modal-close">&times;</button>
                </div>
                <div class="support-modal-body">
                    <!-- Content will be populated dynamically -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    async handleUrgentResponseSubmission(form) {
        const formData = new FormData(form);
        const notificationId = form.dataset.notificationId;
        const responseData = {
            action: formData.get('urgentAction'),
            notes: formData.get('urgentNotes'),
            followUpTime: formData.get('followUpTime')
        };

        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            const notification = this.notifications.find(n => (n._id || n.id) === notificationId);
            
            // Log the urgent response (in production, this would be sent to backend)
            console.log('Urgent response taken:', {
                notificationId,
                action: responseData.action,
                notes: responseData.notes,
                followUpTime: responseData.followUpTime,
                timestamp: new Date().toISOString()
            });
            
            // Mark notification as read and add response metadata
            if (notification) {
                notification.read = true;
                notification.urgentResponse = {
                    action: responseData.action,
                    notes: responseData.notes,
                    followUpTime: responseData.followUpTime,
                    timestamp: new Date().toISOString()
                };
            }
            
            this.showSuccessMessage(`Urgent action "${responseData.action}" has been logged successfully!`);
            this.closeModal();
            form.reset();
            this.renderNotifications();
            this.updateStats();
            
        } catch (error) {
            console.error('Error handling urgent response:', error);
            this.showErrorMessage('Failed to log urgent response. Please try again.');
        }
    }

    // Utility Functions
    getNotificationIcon(type, priority) {
        const iconMap = {
            'system-alert': priority === 'urgent' ? 'fa-exclamation-triangle' : 'fa-cog',
            'grievance-reply': 'fa-reply',
            'support-reply': 'fa-headset',
            'general': 'fa-bell',
            'emergency': 'fa-fire',
            'maintenance': 'fa-tools',
            'update': 'fa-sync-alt',
            'billing': 'fa-credit-card',
            'security': 'fa-shield-alt',
            'gym-admin-message': 'fa-comment',
            'gym-admin-reply': 'fa-reply'
        };
        return iconMap[type] || 'fa-bell';
    }

    getNotificationColor(type, priority) {
        const colorMap = {
            'urgent': '#ef4444',
            'high': '#f59e0b',
            'medium': '#1976d2',
            'low': '#10b981',
            'system-alert': priority === 'urgent' ? '#ef4444' : '#f59e0b',
            'grievance-reply': '#8b5cf6',
            'support-reply': '#06b6d4',
            'emergency': '#dc2626',
            'maintenance': '#f59e0b',
            'security': '#ef4444',
            'gym-admin-message': '#1976d2',
            'gym-admin-reply': '#1976d2'
        };
        return colorMap[type] || colorMap[priority] || '#1976d2';
    }

    canReplyToNotification(notification) {
        const replyableTypes = ['grievance-reply', 'support-reply', 'system-alert', 'emergency', 'general'];
        const isReplyable = replyableTypes.includes(notification.type) || notification.metadata?.ticketId;
        console.log(`🔍 Checking if notification can be replied to:`, {
            type: notification.type,
            hasTicketId: !!notification.metadata?.ticketId,
            isReplyable
        });
        return isReplyable;
    }

    openNotificationReplyModal(notificationId) {
        const notification = this.notifications.find(n => (n._id || n.id) === notificationId);
        if (!notification) return;

        const modal = document.getElementById('notificationReplyModal') || this.createNotificationReplyModal();
        const modalHeader = modal.querySelector('.support-modal-header h3');
        const modalBody = modal.querySelector('.support-modal-body');
        
        if (modalHeader) {
            modalHeader.innerHTML = `<i class="fas fa-reply"></i> Reply to: ${notification.title}`;
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="notification-reply-details">
                    <div class="original-notification">
                        <h4>Original Notification:</h4>
                        <div class="notification-content">
                            <p><strong>Type:</strong> ${notification.type}</p>
                            <p><strong>Priority:</strong> ${notification.priority}</p>
                            <p><strong>Message:</strong> ${notification.message}</p>
                            ${notification.metadata?.ticketId ? `<p><strong>Ticket ID:</strong> ${notification.metadata.ticketId}</p>` : ''}
                        </div>
                    </div>
                    <form id="notificationReplyForm" data-notification-id="${notificationId}">
                        <div class="form-group">
                            <label for="replyMessage">Your Reply:</label>
                            <textarea id="replyMessage" name="replyMessage" required rows="4" 
                                placeholder="Type your reply message here..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="notifyMember" checked>
                                <span class="checkmark"></span>
                                Notify the member about this reply
                            </label>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="replyPriority">Reply Priority:</label>
                                <select id="replyPriority" name="replyPriority">
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="replyStatus">Update Status:</label>
                                <select id="replyStatus" name="replyStatus">
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>
                        <div class="support-modal-footer">
                            <button type="button" class="btn-secondary" onclick="supportManager.closeModal()">Cancel</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-paper-plane"></i> Send Reply
                            </button>
                        </div>
                    </form>
                </div>
            `;
        }
        
        modal.classList.add('active');
    }

    createNotificationReplyModal() {
        const modal = document.createElement('div');
        modal.id = 'notificationReplyModal';
        modal.className = 'support-modal';
        modal.innerHTML = `
            <div class="support-modal-content large">
                <div class="support-modal-header">
                    <h3><i class="fas fa-reply"></i> Reply to Notification</h3>
                    <button class="support-modal-close">&times;</button>
                </div>
                <div class="support-modal-body">
                    <!-- Content will be populated dynamically -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
        }
        return stars;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) return 'Now';
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
        return date.toLocaleDateString();
    }

    getEmptyState(type, title, description) {
        const icons = {
            notifications: 'bell-slash',
            reviews: 'star',
            grievances: 'exclamation-triangle',
            communications: 'comments'
        };
        
        return `
            <div class="empty-state">
                <i class="fas fa-${icons[type]}"></i>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    }

    showSuccessMessage(message) {
        // Implementation for success notifications
        console.log('✅ Success:', message);
        // You could integrate with existing notification system
    }

    showErrorMessage(message) {
        // Implementation for error notifications
        console.log('❌ Error:', message);
        // You could integrate with existing notification system
    }

    // Mock Data Functions (for development/testing)
    getMockNotifications() {
        return [
            {
                _id: '1',
                title: 'Emergency: Equipment Malfunction',
                message: 'Critical safety issue reported with treadmill #3. Immediate inspection required.',
                type: 'emergency',
                priority: 'urgent',
                read: false,
                createdAt: new Date().toISOString(),
                metadata: {
                    ticketId: 'TKT-001',
                    source: 'member-report',
                    equipmentId: 'TREAD-003'
                }
            },
            {
                _id: '2',
                title: 'Support Ticket Reply Required',
                message: 'Member John Doe has replied to ticket about membership billing issue.',
                type: 'support-reply',
                priority: 'high',
                read: false,
                createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
                metadata: {
                    ticketId: 'TKT-002',
                    adminMessage: 'We have processed your refund request for the duplicate charge of $59.99. The refund should appear in your account within 3-5 business days.',
                    ticketSubject: 'Billing Issue - Duplicate Charge',
                    source: 'member-reply'
                }
            },
            {
                _id: '3',
                title: 'Grievance Resolution Update',
                message: 'Member Sarah Wilson has responded to your resolution for locker room complaint.',
                type: 'grievance-reply',
                priority: 'medium',
                read: false,
                createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                metadata: {
                    ticketId: 'GRV-001',
                    adminMessage: 'Thank you for your patience. We have thoroughly cleaned the locker room and implemented a new daily cleaning schedule. We have also installed additional hand sanitizer stations.',
                    ticketSubject: 'Locker Room Cleanliness Issue',
                    source: 'grievance-follow-up'
                }
            },
            {
                _id: '4',
                title: 'New Member Support Request',
                message: 'Sarah Wilson has submitted a new support ticket regarding locker room access.',
                type: 'general',
                priority: 'medium',
                read: false,
                createdAt: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
                metadata: {
                    ticketId: 'SUP-001',
                    adminMessage: 'Your digital locker has been assigned (#247). Please use your membership card to access it. If you need assistance, our staff will help you during your next visit.',
                    ticketSubject: 'Locker Room Access Issue',
                    source: 'new-ticket'
                }
            },
            {
                _id: '5',
                title: 'System Maintenance Completed',
                message: 'Scheduled maintenance for the gym access system has been completed successfully.',
                type: 'system-alert',
                priority: 'low',
                read: true,
                createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                metadata: {
                    source: 'system',
                    maintenanceType: 'access-system'
                }
            },
            {
                _id: '6',
                title: 'New Member Registration',
                message: 'New premium member Alex Johnson has completed registration and requires welcome orientation.',
                type: 'general',
                priority: 'medium',
                read: false,
                createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
                metadata: {
                    memberId: 'MEM-2025-001',
                    membershipType: 'premium',
                    source: 'registration',
                    adminMessage: 'Welcome to our gym! Your orientation session is scheduled for tomorrow at 10 AM. Please bring your ID and membership card.'
                }
            }
        ];
    }

    getMockReviews() {
        return [
            {
                _id: '1',
                rating: 5,
                comment: 'Excellent gym with great equipment and friendly staff! The new cardio machines are fantastic.',
                user: { name: 'John Doe' },
                reviewerName: 'John Doe',
                adminReply: null,
                isActive: true,
                createdAt: new Date().toISOString()
            },
            {
                _id: '2',
                rating: 4,
                comment: 'Good facilities but could use more parking space. Otherwise, great experience!',
                user: { name: 'Jane Smith' },
                reviewerName: 'Jane Smith',
                adminReply: 'Thank you for the feedback! We are working on expanding our parking area.',
                isActive: true,
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                _id: '3',
                rating: 3,
                comment: 'Average gym. Equipment is okay but some machines need maintenance.',
                user: { name: 'Mike Johnson' },
                reviewerName: 'Mike Johnson',
                adminReply: null,
                isActive: true,
                createdAt: new Date(Date.now() - 172800000).toISOString()
            }
        ];
    }

    getMockGrievances() {
        return [
            {
                _id: '1',
                title: 'Equipment Not Working',
                description: 'The treadmill on the second floor has been broken for a week',
                priority: 'high',
                status: 'open',
                member: { name: 'Mike Johnson' },
                createdAt: new Date().toISOString()
            },
            {
                _id: '2',
                title: 'Billing Issue',
                description: 'Charged twice for the same month membership',
                priority: 'urgent',
                status: 'in-progress',
                member: { name: 'Sarah Wilson' },
                createdAt: new Date(Date.now() - 172800000).toISOString()
            }
        ];
    }

    getMockCommunications() {
        return [
            {
                _id: '1',
                member: { name: 'Alex Brown' },
                lastMessage: { content: 'Hello, I have a question about my membership', createdAt: new Date().toISOString() },
                unreadCount: 2,
                status: 'active'
            },
            {
                _id: '2',
                member: { name: 'Emma Davis' },
                lastMessage: { content: 'Thank you for the quick response!', createdAt: new Date(Date.now() - 86400000).toISOString() },
                unreadCount: 0,
                status: 'active'
            }
        ];
    }
}

// Initialize the Support & Reviews Manager
let supportManager;
document.addEventListener('DOMContentLoaded', () => {
    supportManager = new SupportReviewsManager();
});

// Export for global access
window.supportManager = supportManager;
