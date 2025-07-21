// === Support & Reviews Management System ===
// Comprehensive system for notifications, reviews, ratings, and support

class SupportReviewsManager {
    constructor() {
        this.currentTab = 'notifications';
        this.notifications = [];
        this.reviews = [];
        this.memberQueries = [];
        this.grievances = [];
        this.currentGymId = null;
        this.BASE_URL = 'http://localhost:5000';
        this.init();
    }

    init() {
        console.log('🚀 Initializing Support & Reviews Manager');
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
                this.currentGymId = data._id;
                console.log('✅ Gym ID fetched:', this.currentGymId);
                this.loadInitialData();
            }
        } catch (error) {
            console.error('Error fetching gym ID:', error);
        }
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.support-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Notification actions
        const markAllRead = document.getElementById('markAllNotificationsRead');
        if (markAllRead) {
            markAllRead.addEventListener('click', () => this.markAllNotificationsRead());
        }

        // Review actions
        const refreshReviews = document.getElementById('refreshReviews');
        if (refreshReviews) {
            refreshReviews.addEventListener('click', () => this.loadReviews());
        }

        const exportReviews = document.getElementById('exportReviews');
        if (exportReviews) {
            exportReviews.addEventListener('click', () => this.exportReviews());
        }

        // Filters
        const notificationFilters = ['notificationFilterType', 'notificationFilterStatus'];
        notificationFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterNotifications());
            }
        });

        const reviewFilters = ['reviewFilterRating', 'reviewFilterReply'];
        reviewFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterReviews());
            }
        });

        // Review reply modal
        this.bindReviewReplyModal();
    }

    bindReviewReplyModal() {
        const modal = document.getElementById('reviewReplyModal');
        const closeBtn = document.getElementById('closeReviewReplyModal');
        const cancelBtn = document.getElementById('cancelReviewReply');
        const submitBtn = document.getElementById('submitReviewReply');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeReviewReplyModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeReviewReplyModal());
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitReviewReply());
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeReviewReplyModal();
                }
            });
        }
    }

    switchTab(tab) {
        console.log('🔄 Switching to tab:', tab);
        
        // Update navigation buttons
        document.querySelectorAll('.support-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'white';
            btn.style.color = '#666';
            btn.style.border = '1px solid #ddd';
        });

        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = '#1976d2';
            activeBtn.style.color = 'white';
            activeBtn.style.border = 'none';
        }

        // Hide all sections
        document.querySelectorAll('.support-tab-content').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(`${tab}Section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        this.currentTab = tab;

        // Load data for the current tab
        switch (tab) {
            case 'notifications':
                this.loadNotifications();
                break;
            case 'reviews':
                this.loadReviews();
                break;
            case 'member-queries':
                this.loadMemberQueries();
                break;
            case 'grievances':
                this.loadGrievances();
                break;
        }
    }

    async loadInitialData() {
        console.log('📊 Loading initial data for Support & Reviews');
        this.loadNotifications();
        this.loadMemberQueries();
        this.loadGrievances();
    }

    async loadNotifications() {
        console.log('📥 Loading notifications...');
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!token) return;

            // Try to get notifications from the existing notification system first
            if (window.notificationSystem && window.notificationSystem.notifications) {
                this.notifications = window.notificationSystem.notifications;
                this.renderNotifications();
                this.updateNotificationStats();
                return;
            }

            // Fallback to API if notification system is not available
            const response = await fetch(`${this.BASE_URL}/api/notifications/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.notifications = data.notifications || [];
                this.renderNotifications();
                this.updateNotificationStats();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showNotificationError();
        }
    }

    renderNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-bell-slash" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>No notifications found</p>
                </div>
            `;
            return;
        }

        const notificationsHtml = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id || notification._id}" 
                 style="padding: 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.2s ease; ${!notification.read ? 'background: #f8f9fa; border-left: 4px solid #1976d2;' : ''}">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${this.getNotificationColor(notification.type)}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas ${this.getNotificationIcon(notification.type)}" style="color: white; font-size: 16px;"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                            <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #333;">${notification.title}</h4>
                            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                                ${this.getPriorityBadge(notification.priority)}
                                <span style="font-size: 12px; color: #999;">${this.formatTime(notification.timestamp)}</span>
                            </div>
                        </div>
                        <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.4;">${this.truncateText(notification.message, 120)}</p>
                        ${!notification.read ? '<div style="width: 8px; height: 8px; background: #1976d2; border-radius: 50%; position: absolute; top: 12px; right: 12px;"></div>' : ''}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = notificationsHtml;

        // Add click handlers
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = item.dataset.id;
                this.handleNotificationClick(notificationId);
            });
        });
    }

    async handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => (n.id || n._id) === notificationId);
        if (!notification) return;

        // Mark as read if unread
        if (!notification.read) {
            await this.markNotificationRead(notificationId);
        }

        // Show notification details
        this.showNotificationDetails(notification);
    }

    async markNotificationRead(notificationId) {
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!token) return;

            // Update in memory
            const notification = this.notifications.find(n => (n.id || n._id) === notificationId);
            if (notification) {
                notification.read = true;
            }

            // Update display
            this.renderNotifications();
            this.updateNotificationStats();

            // Update on server
            await fetch(`${this.BASE_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllNotificationsRead() {
        try {
            // Update all notifications to read
            this.notifications.forEach(notification => {
                notification.read = true;
            });

            this.renderNotifications();
            this.updateNotificationStats();

            // Update on server
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (token) {
                await fetch(`${this.BASE_URL}/api/notifications/mark-all-read`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            this.showSuccessMessage('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    updateNotificationStats() {
        const totalCount = this.notifications.length;
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const systemCount = this.notifications.filter(n => n.type === 'system').length;
        const highPriorityCount = this.notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length;

        document.getElementById('totalNotificationsCount').textContent = totalCount;
        document.getElementById('unreadNotificationsCount').textContent = unreadCount;
        document.getElementById('systemNotificationsCount').textContent = systemCount;
        document.getElementById('highPriorityNotificationsCount').textContent = highPriorityCount;
    }

    async loadReviews() {
        console.log('⭐ Loading reviews...');
        if (!this.currentGymId) {
            console.error('No gym ID available for loading reviews');
            return;
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/reviews/gym/${this.currentGymId}`);
            if (response.ok) {
                const data = await response.json();
                this.reviews = data.reviews || [];
                this.renderReviews();
                this.updateReviewStats();
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showReviewError();
        }
    }

    renderReviews() {
        const container = document.getElementById('reviewsList');
        if (!container) return;

        if (this.reviews.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-star" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>No reviews found</p>
                    <small>Reviews from your gym will appear here</small>
                </div>
            `;
            return;
        }

        // Fetch gym logo and name from gym profile if available
        const gymLogo = window.gymProfile?.logoUrl || '/frontend/gymadmin/admin.png';
        const gymName = window.gymProfile?.name || window.gymAdminName || 'Gym Admin';
        const reviewsHtml = this.reviews.map(review => {
            const hasReply = review.adminReply && review.adminReply.reply && review.adminReply.reply !== 'undefined' && review.adminReply.reply !== null && review.adminReply.reply.trim() !== '';
            return `
            <div class="review-item" style="padding: 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 16px; border-radius: 8px; ${hasReply ? 'background: #f8f9fa;' : 'background: white;'}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <strong style="color: #333; font-size: 14px;">${review.reviewerName || review.user?.name || 'Anonymous'}</strong>
                            <div style="color: #ffa726;">${this.generateStars(review.rating)}</div>
                            <span style="background: ${this.getRatingColor(review.rating)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${review.rating}/5</span>
                        </div>
                        <div style="font-size: 12px; color: #999;">
                            ${this.formatDate(review.createdAt)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        ${hasReply 
                            ? '<span style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;"><i class="fas fa-check"></i> Replied</span>'
                            : `<button class="reply-btn" data-review-id="${review._id}" style="padding: 6px 12px; background: #1976d2; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                                <i class="fas fa-reply"></i> Reply
                               </button>`
                        }
                    </div>
                </div>
                <div style="margin-bottom: ${hasReply ? '16px' : '0'};">
                    <p style="margin: 0; color: #666; line-height: 1.5; font-size: 14px;">${review.comment}</p>
                </div>
                ${hasReply ? `
                    <div style="border-left: 3px solid #1976d2; padding-left: 16px; background: white; padding: 12px 16px; border-radius: 4px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <img src="${gymLogo}" alt="Gym Admin Logo" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #1976d2;" />
                            <strong style="color: #1976d2; font-size: 13px;">${gymName}</strong>
                            <span style="font-size: 12px; color: #999;">${this.formatDate(review.adminReply.repliedAt)}</span>
                        </div>
                        <p style="margin: 0; color: #444; font-size: 13px; line-height: 1.4;">${review.adminReply.reply}</p>
                    </div>
                ` : ''}
            </div>
        `;
        }).join('');

        container.innerHTML = reviewsHtml;

        // Add click handlers for reply buttons
        container.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const reviewId = btn.dataset.reviewId;
                this.openReviewReplyModal(reviewId);
            });
        });
    }

    updateReviewStats() {
        if (this.reviews.length === 0) {
            document.getElementById('averageRatingDisplay').textContent = '0.0';
            document.getElementById('ratingStarsDisplay').textContent = '☆☆☆☆☆';
            document.getElementById('totalReviewsCount').textContent = '0';
            return;
        }

        // Calculate average rating
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / this.reviews.length;
        
        document.getElementById('averageRatingDisplay').textContent = averageRating.toFixed(1);
        document.getElementById('ratingStarsDisplay').textContent = this.generateStars(averageRating);
        document.getElementById('totalReviewsCount').textContent = this.reviews.length;

        // Generate rating breakdown
        const breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
        this.reviews.forEach(review => {
            breakdown[review.rating]++;
        });

        const breakdownHtml = Object.keys(breakdown).reverse().map(rating => {
            const count = breakdown[rating];
            const percentage = this.reviews.length > 0 ? (count / this.reviews.length) * 100 : 0;
            return `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="width: 20px; font-size: 12px;">${rating}★</span>
                    <div style="flex: 1; background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: ${this.getRatingColor(parseInt(rating))};"></div>
                    </div>
                    <span style="width: 30px; font-size: 12px; text-align: right;">${count}</span>
                </div>
            `;
        }).join('');

        document.getElementById('ratingBreakdown').innerHTML = breakdownHtml;
    }

    openReviewReplyModal(reviewId) {
        const review = this.reviews.find(r => r._id === reviewId);
        if (!review) return;

        const modal = document.getElementById('reviewReplyModal');
        const detailsDisplay = document.getElementById('reviewDetailsDisplay');
        const replyText = document.getElementById('adminReplyText');

        // Display review details
        detailsDisplay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <strong style="color: #333;">${review.reviewerName || review.user?.name || 'Anonymous'}</strong>
                    <div style="color: #ffa726; margin: 4px 0;">${this.generateStars(review.rating)} (${review.rating}/5)</div>
                </div>
                <small style="color: #666;">${this.formatDate(review.createdAt)}</small>
            </div>
            <p style="margin: 0; color: #555; line-height: 1.5;">${review.comment}</p>
        `;

        // Clear previous reply text
        replyText.value = '';

        // Store review ID for submission
        modal.dataset.reviewId = reviewId;

        // Show modal
        modal.style.display = 'flex';
    }

    closeReviewReplyModal() {
        const modal = document.getElementById('reviewReplyModal');
        modal.style.display = 'none';
        delete modal.dataset.reviewId;
    }

    async submitReviewReply() {
        const modal = document.getElementById('reviewReplyModal');
        const reviewId = modal.dataset.reviewId;
        const replyText = document.getElementById('adminReplyText').value.trim();

        if (!reviewId || !replyText) {
            this.showErrorMessage('Please enter a reply message');
            return;
        }

        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!token) {
                this.showErrorMessage('Authentication required');
                return;
            }

            const response = await fetch(`${this.BASE_URL}/api/reviews/${reviewId}/reply`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reply: replyText })
            });

            if (response.ok) {
                const data = await response.json();
                this.showSuccessMessage('Reply sent successfully');
                this.closeReviewReplyModal();
                this.loadReviews(); // Refresh reviews
            } else {
                const errorData = await response.json();
                this.showErrorMessage(errorData.message || 'Failed to send reply');
            }
        } catch (error) {
            console.error('Error submitting review reply:', error);
            this.showErrorMessage('Network error occurred');
        }
    }

    filterNotifications() {
        // Implementation for notification filtering
        const typeFilter = document.getElementById('notificationFilterType').value;
        const statusFilter = document.getElementById('notificationFilterStatus').value;
        
        // Apply filters and re-render
        // This would filter the notifications array and call renderNotifications()
        console.log('Filtering notifications:', { typeFilter, statusFilter });
    }

    filterReviews() {
        // Implementation for review filtering
        const ratingFilter = document.getElementById('reviewFilterRating').value;
        const replyFilter = document.getElementById('reviewFilterReply').value;
        
        // Apply filters and re-render
        // This would filter the reviews array and call renderReviews()
        console.log('Filtering reviews:', { ratingFilter, replyFilter });
    }

    async exportReviews() {
        try {
            const csvContent = this.generateReviewsCSV();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `gym_reviews_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccessMessage('Reviews exported successfully');
        } catch (error) {
            console.error('Error exporting reviews:', error);
            this.showErrorMessage('Failed to export reviews');
        }
    }

    generateReviewsCSV() {
        const headers = ['Date', 'Reviewer Name', 'Rating', 'Comment', 'Admin Reply', 'Reply Date'];
        const rows = this.reviews.map(review => [
            this.formatDate(review.createdAt),
            review.reviewerName || 'Anonymous',
            review.rating,
            `"${review.comment.replace(/"/g, '""')}"`,
            review.adminReply ? `"${review.adminReply.reply.replace(/"/g, '""')}"` : '',
            review.adminReply ? this.formatDate(review.adminReply.repliedAt) : ''
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    // === Member Queries Management ===
    async loadMemberQueries() {
        console.log('💬 Loading member queries...');
        if (!this.currentGymId) {
            console.error('No gym ID available for loading member queries');
            return;
        }

        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!token) return;

            const response = await fetch(`${this.BASE_URL}/api/support/gym/${this.currentGymId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.memberQueries = data.tickets || [];
                this.renderMemberQueries();
                this.updateMemberQueryStats();
            }
        } catch (error) {
            console.error('Error loading member queries:', error);
            this.showMemberQueryError();
        }
    }

    renderMemberQueries() {
        const container = document.getElementById('memberQueriesList');
        if (!container) return;

        if (this.memberQueries.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-question-circle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>No member queries found</p>
                    <small>Support tickets and queries from members will appear here</small>
                </div>
            `;
            return;
        }

        const queriesHtml = this.memberQueries.map(query => `
            <div class="query-item" style="padding: 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 16px; border-radius: 8px; background: white; border-left: 4px solid ${this.getQueryStatusColor(query.status)};">
                <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <h4 style="margin: 0; color: #333; font-size: 16px;">${query.subject}</h4>
                            <span style="background: ${this.getQueryStatusColor(query.status)}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                ${query.status}
                            </span>
                            ${this.getQueryPriorityBadge(query.priority)}
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-user" style="color: #666; font-size: 12px;"></i>
                                <span style="font-size: 13px; color: #666;">${query.user?.name || 'Anonymous'}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-ticket-alt" style="color: #666; font-size: 12px;"></i>
                                <span style="font-size: 13px; color: #666; font-family: monospace;">${query.ticketId}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-clock" style="color: #666; font-size: 12px;"></i>
                                <span style="font-size: 13px; color: #666;">${this.formatDate(query.createdAt)}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">
                            <i class="fas fa-tag" style="color: #666; font-size: 12px;"></i>
                            <span style="background: #f8f9fa; color: #495057; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${query.category}</span>
                        </div>
                        <p style="margin: 0; color: #666; line-height: 1.5; font-size: 14px;">${this.truncateText(query.message, 150)}</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-left: 16px;">
                        <button class="view-query-btn" data-query-id="${query._id}" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; min-width: 80px;">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${query.status === 'open' ? `
                            <button class="respond-query-btn" data-query-id="${query._id}" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; min-width: 80px;">
                                <i class="fas fa-reply"></i> Respond
                            </button>
                        ` : ''}
                        ${query.status !== 'closed' ? `
                            <button class="close-query-btn" data-query-id="${query._id}" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; min-width: 80px;">
                                <i class="fas fa-times"></i> Close
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${query.responses && query.responses.length > 0 ? `
                    <div style="border-top: 1px solid #f0f0f0; padding-top: 12px; margin-top: 12px;">
                        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
                            <i class="fas fa-comments"></i> ${query.responses.length} response(s)
                        </div>
                        <div style="max-height: 100px; overflow-y: auto;">
                            ${query.responses.slice(-2).map(response => `
                                <div style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; border-left: 3px solid ${response.isAdmin ? '#1976d2' : '#28a745'};">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                        <strong style="font-size: 12px; color: ${response.isAdmin ? '#1976d2' : '#28a745'};">
                                            ${response.isAdmin ? 'Admin' : 'Member'}
                                        </strong>
                                        <span style="font-size: 11px; color: #999;">${this.formatTime(response.timestamp)}</span>
                                    </div>
                                    <p style="margin: 0; font-size: 12px; color: #555;">${this.truncateText(response.message, 80)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');

        container.innerHTML = queriesHtml;

        // Add event listeners
        this.bindMemberQueryEvents();
    }

    bindMemberQueryEvents() {
        const container = document.getElementById('memberQueriesList');
        if (!container) return;

        // View query details
        container.querySelectorAll('.view-query-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const queryId = btn.dataset.queryId;
                this.viewQueryDetails(queryId);
            });
        });

        // Respond to query
        container.querySelectorAll('.respond-query-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const queryId = btn.dataset.queryId;
                this.openQueryResponseModal(queryId);
            });
        });

        // Close query
        container.querySelectorAll('.close-query-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const queryId = btn.dataset.queryId;
                this.closeQuery(queryId);
            });
        });
    }

    updateMemberQueryStats() {
        if (!this.memberQueries.length) {
            document.getElementById('totalQueriesCount').textContent = '0';
            document.getElementById('openQueriesCount').textContent = '0';
            document.getElementById('pendingQueriesCount').textContent = '0';
            document.getElementById('closedQueriesCount').textContent = '0';
            return;
        }

        const total = this.memberQueries.length;
        const open = this.memberQueries.filter(q => q.status === 'open').length;
        const pending = this.memberQueries.filter(q => q.status === 'in-progress').length;
        const closed = this.memberQueries.filter(q => q.status === 'closed').length;

        document.getElementById('totalQueriesCount').textContent = total;
        document.getElementById('openQueriesCount').textContent = open;
        document.getElementById('pendingQueriesCount').textContent = pending;
        document.getElementById('closedQueriesCount').textContent = closed;
    }

    async viewQueryDetails(queryId) {
        const query = this.memberQueries.find(q => q._id === queryId);
        if (!query) return;

        if (window.showDialog && typeof window.showDialog === 'function') {
            const responseHistory = query.responses ? query.responses.map(response => `
                <div style="margin-bottom: 12px; padding: 12px; background: ${response.isAdmin ? '#e3f2fd' : '#f3e5f5'}; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong style="color: ${response.isAdmin ? '#1976d2' : '#7b1fa2'};">
                            ${response.isAdmin ? 'Admin Response' : 'Member Message'}
                        </strong>
                        <small style="color: #666;">${this.formatDate(response.timestamp)}</small>
                    </div>
                    <p style="margin: 0; line-height: 1.4;">${response.message}</p>
                </div>
            `).join('') : '<p style="color: #666; font-style: italic;">No responses yet</p>';

            window.showDialog({
                title: `Query Details - ${query.ticketId}`,
                message: `
                    <div style="text-align: left;">
                        <div style="margin-bottom: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                            <h4 style="margin: 0 0 8px 0; color: #333;">${query.subject}</h4>
                            <div style="margin-bottom: 8px;">
                                <strong>Status:</strong> 
                                <span style="background: ${this.getQueryStatusColor(query.status)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                                    ${query.status.toUpperCase()}
                                </span>
                            </div>
                            <div style="margin-bottom: 8px;"><strong>Member:</strong> ${query.user?.name || 'Anonymous'}</div>
                            <div style="margin-bottom: 8px;"><strong>Category:</strong> ${query.category}</div>
                            <div style="margin-bottom: 8px;"><strong>Priority:</strong> ${query.priority}</div>
                            <div style="margin-bottom: 12px;"><strong>Created:</strong> ${this.formatDate(query.createdAt)}</div>
                            <div><strong>Message:</strong></div>
                            <p style="margin: 8px 0 0 0; padding: 12px; background: white; border-radius: 4px; border-left: 4px solid #1976d2;">${query.message}</p>
                        </div>
                        <div>
                            <h4 style="margin: 0 0 12px 0; color: #333;">Response History</h4>
                            <div style="max-height: 300px; overflow-y: auto;">
                                ${responseHistory}
                            </div>
                        </div>
                    </div>
                `,
                confirmText: 'Close',
                iconHtml: '<i class="fas fa-ticket-alt" style="color: #1976d2; font-size: 2rem;"></i>'
            });
        }
    }

    async openQueryResponseModal(queryId) {
        const query = this.memberQueries.find(q => q._id === queryId);
        if (!query) return;

        if (window.showDialog && typeof window.showDialog === 'function') {
            window.showDialog({
                title: `Respond to Query - ${query.ticketId}`,
                message: `
                    <div style="text-align: left; margin-bottom: 16px;">
                        <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 16px;">
                            <h4 style="margin: 0 0 8px 0;">${query.subject}</h4>
                            <p style="margin: 0; color: #666;">${query.message}</p>
                        </div>
                        <label for="queryResponse" style="display: block; margin-bottom: 8px; font-weight: 600;">Your Response:</label>
                        <textarea id="queryResponse" placeholder="Type your response here..." style="width: 100%; height: 120px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                        <div style="margin-top: 12px;">
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <input type="checkbox" id="closeAfterResponse"> 
                                <span>Close query after sending response</span>
                            </label>
                        </div>
                    </div>
                `,
                confirmText: 'Send Response',
                cancelText: 'Cancel',
                iconHtml: '<i class="fas fa-reply" style="color: #28a745; font-size: 2rem;"></i>',
                onConfirm: () => {
                    const response = document.getElementById('queryResponse').value.trim();
                    const closeAfter = document.getElementById('closeAfterResponse').checked;
                    if (response) {
                        this.submitQueryResponse(queryId, response, closeAfter);
                    }
                }
            });
        }
    }

    async submitQueryResponse(queryId, response, closeAfter = false) {
        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!token) {
                this.showErrorMessage('Authentication required');
                return;
            }

            const requestBody = {
                message: response,
                isAdmin: true,
                closeAfter: closeAfter
            };

            const apiResponse = await fetch(`${this.BASE_URL}/api/support/${queryId}/respond`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (apiResponse.ok) {
                this.showSuccessMessage('Response sent successfully');
                this.loadMemberQueries(); // Refresh the queries
            } else {
                const errorData = await apiResponse.json();
                this.showErrorMessage(errorData.message || 'Failed to send response');
            }
        } catch (error) {
            console.error('Error submitting query response:', error);
            this.showErrorMessage('Network error occurred');
        }
    }

    async closeQuery(queryId) {
        if (!confirm('Are you sure you want to close this query?')) return;

        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!token) {
                this.showErrorMessage('Authentication required');
                return;
            }

            const response = await fetch(`${this.BASE_URL}/api/support/${queryId}/close`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccessMessage('Query closed successfully');
                this.loadMemberQueries(); // Refresh the queries
            } else {
                const errorData = await response.json();
                this.showErrorMessage(errorData.message || 'Failed to close query');
            }
        } catch (error) {
            console.error('Error closing query:', error);
            this.showErrorMessage('Network error occurred');
        }
    }

    showMemberQueryError() {
        const container = document.getElementById('memberQueriesList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading member queries</p>
                    <button onclick="window.supportReviewsManager.loadMemberQueries()" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    // === Grievances Management ===
    async loadGrievances() {
        console.log('⚖️ Loading grievances...');
        if (!this.currentGymId) {
            console.error('No gym ID available for loading grievances');
            return;
        }

        try {
            const token = localStorage.getItem('gymAdminToken') || localStorage.getItem('gymAuthToken');
            if (!token) return;

            const response = await fetch(`${this.BASE_URL}/api/support/grievances/gym/${this.currentGymId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.grievances = data.grievances || [];
                this.renderGrievances();
                this.updateGrievanceStats();
            }
        } catch (error) {
            console.error('Error loading grievances:', error);
            this.showGrievanceError();
        }
    }

    renderGrievances() {
        const container = document.getElementById('grievancesList');
        if (!container) return;

        // For now, show a placeholder since this will be implemented later
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin: 20px 0;">
                <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; backdrop-filter: blur(10px);">
                    <i class="fas fa-gavel" style="font-size: 64px; margin-bottom: 20px; opacity: 0.9;"></i>
                    <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Grievance Management System</h3>
                    <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9; line-height: 1.5;">
                        Advanced grievance tracking and resolution system coming soon!
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 24px;">
                        <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px;">
                            <i class="fas fa-file-alt" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <div style="font-size: 14px; opacity: 0.9;">Grievance Submission</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px;">
                            <i class="fas fa-tasks" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <div style="font-size: 14px; opacity: 0.9;">Priority Management</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px;">
                            <i class="fas fa-user-tie" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <div style="font-size: 14px; opacity: 0.9;">Escalation Workflow</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px;">
                            <i class="fas fa-chart-line" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <div style="font-size: 14px; opacity: 0.9;">Analytics & Reports</div>
                        </div>
                    </div>
                    <div style="margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 16px;">📋 Implementation Roadmap</h4>
                        <div style="text-align: left; font-size: 14px; opacity: 0.9;">
                            <div style="margin-bottom: 8px;">✅ Support Ticket System (Current)</div>
                            <div style="margin-bottom: 8px;">🔄 Grievance Categories & Types</div>
                            <div style="margin-bottom: 8px;">🔄 Investigation Workflow</div>
                            <div style="margin-bottom: 8px;">🔄 Resolution Tracking</div>
                            <div style="margin-bottom: 8px;">🔄 Escalation Matrix</div>
                            <div style="margin-bottom: 8px;">🔄 Analytics Dashboard</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateGrievanceStats() {
        // Placeholder stats - will be implemented when grievance system is built
        document.getElementById('totalGrievancesCount').textContent = '0';
        document.getElementById('activeGrievancesCount').textContent = '0';
        document.getElementById('resolvedGrievancesCount').textContent = '0';
        document.getElementById('escalatedGrievancesCount').textContent = '0';
    }

    showGrievanceError() {
        const container = document.getElementById('grievancesList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading grievances</p>
                    <button onclick="window.supportReviewsManager.loadGrievances()" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    showNotificationDetails(notification) {
        if (window.showDialog && typeof window.showDialog === 'function') {
            window.showDialog({
                title: notification.title,
                message: notification.message,
                confirmText: 'OK',
                iconHtml: `<i class="fas ${this.getNotificationIcon(notification.type)}" style="color: ${this.getNotificationColor(notification.type)}; font-size: 2rem;"></i>`
            });
        } else {
            alert(`${notification.title}\n\n${notification.message}`);
        }
    }

    showNotificationError() {
        const container = document.getElementById('notificationsList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading notifications</p>
                    <button onclick="window.supportReviewsManager.loadNotifications()" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    showReviewError() {
        const container = document.getElementById('reviewsList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading reviews</p>
                    <button onclick="window.supportReviewsManager.loadReviews()" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    showSuccessMessage(message) {
        console.log('✅', message);
        // You can integrate with existing toast notification system here
        if (window.showDialog && typeof window.showDialog === 'function') {
            window.showDialog({
                title: 'Success',
                message: message,
                confirmText: 'OK',
                iconHtml: '<i class="fas fa-check-circle" style="color: #28a745; font-size: 2rem;"></i>'
            });
        }
    }

    showErrorMessage(message) {
        console.error('❌', message);
        // You can integrate with existing toast notification system here
        if (window.showDialog && typeof window.showDialog === 'function') {
            window.showDialog({
                title: 'Error',
                message: message,
                confirmText: 'OK',
                iconHtml: '<i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 2rem;"></i>'
            });
        }
    }

    // Utility functions
    getNotificationIcon(type) {
        const iconMap = {
            'system': 'fa-cog',
            'membership': 'fa-calendar-check',
            'payment': 'fa-credit-card',
            'admin': 'fa-user-shield',
            'membership-expiry': 'fa-clock',
            'new-member': 'fa-user-plus',
            'trainer': 'fa-user-tie',
            'grievance': 'fa-exclamation-triangle'
        };
        return iconMap[type] || 'fa-bell';
    }

    getNotificationColor(type) {
        const colorMap = {
            'system': '#17a2b8',
            'membership': '#28a745',
            'payment': '#28a745',
            'admin': '#6f42c1',
            'membership-expiry': '#ffc107',
            'new-member': '#007bff',
            'trainer': '#fd7e14',
            'grievance': '#dc3545'
        };
        return colorMap[type] || '#6c757d';
    }

    getQueryStatusColor(status) {
        const colorMap = {
            'open': '#28a745',
            'in-progress': '#ffc107',
            'pending': '#17a2b8',
            'closed': '#6c757d',
            'resolved': '#28a745'
        };
        return colorMap[status] || '#6c757d';
    }

    getQueryPriorityBadge(priority) {
        if (!priority) return '';
        
        const priorityConfig = {
            'low': { color: '#28a745', text: 'Low', icon: 'fa-arrow-down' },
            'normal': { color: '#17a2b8', text: 'Normal', icon: 'fa-minus' },
            'medium': { color: '#ffc107', text: 'Medium', icon: 'fa-arrow-up' },
            'high': { color: '#fd7e14', text: 'High', icon: 'fa-exclamation' },
            'urgent': { color: '#dc3545', text: 'Urgent', icon: 'fa-fire' }
        };

        const config = priorityConfig[priority] || priorityConfig['normal'];
        return `
            <span style="background: ${config.color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fas ${config.icon}"></i> ${config.text}
            </span>
        `;
    }

    getPriorityBadge(priority) {
        if (!priority) return '';
        
        const priorityConfig = {
            'low': { color: '#28a745', text: 'Low' },
            'normal': { color: '#17a2b8', text: 'Normal' },
            'medium': { color: '#ffc107', text: 'Medium' },
            'high': { color: '#fd7e14', text: 'High' },
            'urgent': { color: '#dc3545', text: 'Urgent' }
        };

        const config = priorityConfig[priority] || priorityConfig['normal'];
        return `<span style="background: ${config.color}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase;">${config.text}</span>`;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    getRatingColor(rating) {
        if (rating >= 4.5) return '#4caf50';
        if (rating >= 3.5) return '#8bc34a';
        if (rating >= 2.5) return '#ffc107';
        if (rating >= 1.5) return '#ff9800';
        return '#f44336';
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Initialize the Support & Reviews Manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other systems to load
    setTimeout(() => {
        if (!window.supportReviewsManager) {
            window.supportReviewsManager = new SupportReviewsManager();
            console.log('✅ Support & Reviews Manager initialized');
        }
    }, 1000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupportReviewsManager };
}
