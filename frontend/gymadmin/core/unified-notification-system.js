/**
 * Unified Notification System
 * Consolidates all notification functionality into a single, performance-optimized module
 * Integrates with performance managers for optimal resource usage
 */

class UnifiedNotificationSystem {
    constructor() {
        this.settings = this.loadSettings();
        this.notifications = [];
        this.unreadCount = 0;
        this.templates = new Map();
        
        // Performance optimizations
        this.notificationSignatures = new Map();
        this.suppressionCache = new Map();
        this.pollerManager = null;
        
        // Configuration
        this.config = {
            endpoints: {
                system: '/api/notifications/send',
                email: '/api/notifications/send-email',
                whatsapp: '/api/notifications/send-whatsapp',
                members: '/api/members',
                trainers: '/api/trainers'
            },
            limits: {
                title: 100,
                message: 500,
                recipients: 1000
            },
            defaults: {
                channels: {
                    system: true,
                    email: false,
                    whatsapp: false
                },
                sendTo: 'all-members',
                deliveryTime: 'now'
            }
        };

        this.initializeSystem();
    }

    /**
     * Initialize the unified notification system
     */
    async initializeSystem() {
        console.log('🔔 Initializing Unified Notification System');
        
        try {
            // Create UI components
            this.createNotificationUI();
            
            // Setup event listeners with performance optimization
            this.bindEventListeners();
            
            // Initialize templates
            this.initializeTemplates();
            
            // Setup smart polling if manager is available
            this.setupSmartPolling();
            
            // Load existing notifications
            await this.loadExistingNotifications();
            
            // Setup debug functions
            this.setupDebugFunctions();
            
            console.log('✅ Unified Notification System initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize notification system:', error);
        }
    }

    /**
     * Create notification UI components
     */
    createNotificationUI() {
        // Create notification bell if not exists
        if (!document.getElementById('notificationBell')) {
            const header = document.querySelector('.header') || document.querySelector('.top-bar') || document.body;
            
            const bellContainer = document.createElement('div');
            bellContainer.id = 'notificationBell';
            bellContainer.className = 'notification-bell-container';
            bellContainer.innerHTML = `
                <div class="notification-bell" onclick="window.unifiedNotificationSystem.togglePanel()">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" id="notificationBadge">0</span>
                </div>
                <div class="notification-panel" id="notificationPanel">
                    <div class="notification-header">
                        <h3>Notifications</h3>
                        <button onclick="window.unifiedNotificationSystem.markAllAsRead()" class="mark-all-read">
                            Mark All Read
                        </button>
                    </div>
                    <div class="notification-list" id="notificationList">
                        <div class="no-notifications">No notifications yet</div>
                    </div>
                    <div class="notification-footer">
                        <button onclick="window.unifiedNotificationSystem.openComposer()" class="compose-notification">
                            <i class="fas fa-plus"></i> Send Notification
                        </button>
                    </div>
                </div>
            `;
            
            header.appendChild(bellContainer);
        }

        // Create notification composer modal
        this.createComposerModal();
        
        // Add notification styles
        this.addNotificationStyles();
    }

    /**
     * Create notification composer modal
     */
    createComposerModal() {
        if (document.getElementById('notificationComposerModal')) return;

        const modal = document.createElement('div');
        modal.id = 'notificationComposerModal';
        modal.className = 'modal notification-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-paper-plane"></i> Send Notification</h2>
                    <button class="modal-close" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="notification-composer">
                        <!-- Template Selection -->
                        <div class="form-group">
                            <label>Quick Templates</label>
                            <select id="notificationTemplate" onchange="window.unifiedNotificationSystem.applyTemplate(this.value)">
                                <option value="">Select a template...</option>
                                <option value="membership-expiry">Membership Expiry Reminder</option>
                                <option value="payment-reminder">Payment Reminder</option>
                                <option value="new-class">New Class Alert</option>
                                <option value="holiday-notice">Holiday Notice</option>
                                <option value="maintenance">Maintenance Notice</option>
                                <option value="achievement">Congratulations</option>
                            </select>
                        </div>

                        <!-- Title -->
                        <div class="form-group">
                            <label>Title <span class="required">*</span></label>
                            <input type="text" id="unifiedNotificationTitle" maxlength="100" required>
                            <small class="char-count"><span id="titleCharCount">0</span>/100</small>
                        </div>

                        <!-- Message -->
                        <div class="form-group">
                            <label>Message <span class="required">*</span></label>
                            <textarea id="notificationMessage" rows="5" maxlength="500" required></textarea>
                            <small class="char-count"><span id="messageCharCount">0</span>/500</small>
                        </div>

                        <!-- Recipients -->
                        <div class="form-group">
                            <label>Send To</label>
                            <select id="notificationRecipients">
                                <option value="all-members">All Members</option>
                                <option value="active-members">Active Members Only</option>
                                <option value="expired-members">Expired Members Only</option>
                                <option value="trainers">All Trainers</option>
                                <option value="custom">Custom Recipients</option>
                            </select>
                        </div>

                        <!-- Custom Recipients (hidden by default) -->
                        <div class="form-group" id="customRecipientsGroup" style="display: none;">
                            <label>Custom Recipients (comma-separated emails)</label>
                            <textarea id="customRecipients" rows="3" placeholder="email1@example.com, email2@example.com"></textarea>
                        </div>

                        <!-- Delivery Channels -->
                        <div class="form-group">
                            <label>Delivery Channels</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" id="systemNotification" checked> System Notification</label>
                                <label><input type="checkbox" id="emailNotification"> Email</label>
                                <label><input type="checkbox" id="whatsappNotification"> WhatsApp</label>
                            </div>
                        </div>

                        <!-- Delivery Time -->
                        <div class="form-group">
                            <label>Delivery Time</label>
                            <select id="deliveryTime">
                                <option value="now">Send Now</option>
                                <option value="schedule">Schedule for Later</option>
                            </select>
                        </div>

                        <!-- Scheduled Time (hidden by default) -->
                        <div class="form-group" id="scheduleGroup" style="display: none;">
                            <label>Schedule Date & Time</label>
                            <input type="datetime-local" id="scheduledTime">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.unifiedNotificationSystem.sendNotification()">
                        <i class="fas fa-paper-plane"></i> Send Notification
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Initialize notification templates
     */
    initializeTemplates() {
        this.templates.set('membership-expiry', {
            title: 'Membership Expiry Reminder',
            message: 'Dear {name},\n\nYour membership is expiring soon. Please renew to continue enjoying our services.\n\nExpiry Date: {expiryDate}\n\nBest regards,\nFit-Verse Team'
        });

        this.templates.set('payment-reminder', {
            title: 'Payment Reminder',
            message: 'Dear {name},\n\nThis is a friendly reminder about your pending payment.\n\nAmount: ₹{amount}\nDue Date: {dueDate}\n\nPlease complete your payment to avoid service interruption.\n\nBest regards,\nFit-Verse Team'
        });

        this.templates.set('new-class', {
            title: 'New Class Alert',
            message: 'Exciting News! 🎉\n\nWe\'re introducing a new class: {className}\n\nSchedule: {schedule}\nInstructor: {instructor}\n\nLimited spots available. Book now!\n\nBest regards,\nFit-Verse Team'
        });

        this.templates.set('holiday-notice', {
            title: 'Holiday Notice',
            message: 'Dear Members,\n\nPlease note that our gym will be closed on {holidayDate} due to {reason}.\n\nWe will resume normal operations on {resumeDate}.\n\nThank you for your understanding.\n\nBest regards,\nFit-Verse Team'
        });

        this.templates.set('maintenance', {
            title: 'Maintenance Notice',
            message: 'Dear Members,\n\nWe will be conducting maintenance work on {maintenanceDate} from {startTime} to {endTime}.\n\nAffected areas: {areas}\n\nWe apologize for any inconvenience.\n\nBest regards,\nFit-Verse Team'
        });

        this.templates.set('achievement', {
            title: 'Congratulations!',
            message: 'Dear {name},\n\nCongratulations on your amazing achievement! 🏆\n\n{achievementDescription}\n\nKeep up the great work!\n\nBest regards,\nFit-Verse Team'
        });
    }

    /**
     * Setup smart polling using SmartPollingManager
     */
    setupSmartPolling() {
        if (window.smartPollingManager) {
            this.pollerManager = window.smartPollingManager.createPoller('notifications', 
                () => this.pollForNotifications(), {
                interval: 30000, // 30 seconds
                pauseWhenHidden: true,
                priority: 'normal'
            });
            console.log('📡 Smart polling enabled for notifications');
        } else {
            // Fallback to regular polling
            this.pollingInterval = setInterval(() => this.pollForNotifications(), 30000);
            console.log('📡 Regular polling enabled for notifications');
        }
    }

    /**
     * Poll for new notifications
     */
    async pollForNotifications() {
        try {
            const fetchFunction = window.cachedFetch || fetch;
            const response = await fetchFunction('/api/notifications/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.processNewNotifications(data.notifications || []);
            }
        } catch (error) {
            console.warn('Failed to poll notifications:', error);
        }
    }

    /**
     * Process new notifications with deduplication
     */
    processNewNotifications(newNotifications) {
        let addedCount = 0;

        newNotifications.forEach(notification => {
            const signature = this.generateNotificationSignature(notification);
            
            if (!this.notificationSignatures.has(signature)) {
                this.notifications.unshift(notification);
                this.notificationSignatures.set(signature, true);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.unreadCount += addedCount;
            this.updateNotificationUI();
            this.playNotificationSound();
            this.showToast(`${addedCount} new notification(s) received!`, 'info');
        }
    }

    /**
     * Generate unique signature for notification deduplication
     */
    generateNotificationSignature(notification) {
        return `${notification.type}-${notification.message}-${notification.timestamp}`;
    }

    /**
     * Update notification UI
     */
    updateNotificationUI() {
        const badge = document.getElementById('notificationBadge');
        const list = document.getElementById('notificationList');
        
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }

        if (list) {
            if (this.notifications.length === 0) {
                list.innerHTML = '<div class="no-notifications">No notifications yet</div>';
            } else {
                list.innerHTML = this.notifications.map(notification => `
                    <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                        <div class="notification-icon">
                            <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-title">${notification.title}</div>
                            <div class="notification-message">${notification.message}</div>
                            <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                        </div>
                        <div class="notification-actions">
                            <button onclick="window.unifiedNotificationSystem.markAsRead('${notification.id}')" class="mark-read-btn">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const icons = {
            'payment': 'fa-credit-card',
            'membership': 'fa-id-card',
            'attendance': 'fa-clock',
            'system': 'fa-cog',
            'alert': 'fa-exclamation-triangle',
            'success': 'fa-check-circle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    /**
     * Format timestamp for display
     */
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    /**
     * Toggle notification panel
     */
    togglePanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('show');
        }
    }

    /**
     * Open notification composer
     */
    openComposer() {
        const modal = document.getElementById('notificationComposerModal');
        if (modal) {
            modal.style.display = 'block';
            
            // Setup character counters
            this.setupCharacterCounters();
            
            // Setup form interactions
            this.setupFormInteractions();
        }
    }

    /**
     * Apply notification template
     */
    applyTemplate(templateKey) {
        if (!templateKey) return;
        
        const template = this.templates.get(templateKey);
        if (template) {
            document.getElementById('unifiedNotificationTitle').value = template.title;
            document.getElementById('notificationMessage').value = template.message;
            
            // Update character counters
            this.updateCharacterCount('unifiedNotificationTitle', 'titleCharCount');
            this.updateCharacterCount('notificationMessage', 'messageCharCount');
        }
    }

    /**
     * Setup character counters
     */
    setupCharacterCounters() {
        const titleInput = document.getElementById('unifiedNotificationTitle');
        const messageInput = document.getElementById('notificationMessage');
        
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.updateCharacterCount('unifiedNotificationTitle', 'titleCharCount');
            });
        }
        
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                this.updateCharacterCount('notificationMessage', 'messageCharCount');
            });
        }
    }

    /**
     * Update character count display
     */
    updateCharacterCount(inputId, counterId) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);
        
        if (input && counter) {
            counter.textContent = input.value.length;
        }
    }

    /**
     * Setup form interactions
     */
    setupFormInteractions() {
        // Recipients change handler
        const recipientsSelect = document.getElementById('notificationRecipients');
        const customGroup = document.getElementById('customRecipientsGroup');
        
        if (recipientsSelect) {
            recipientsSelect.addEventListener('change', () => {
                if (customGroup) {
                    customGroup.style.display = recipientsSelect.value === 'custom' ? 'block' : 'none';
                }
            });
        }
        
        // Delivery time change handler
        const deliveryTimeSelect = document.getElementById('deliveryTime');
        const scheduleGroup = document.getElementById('scheduleGroup');
        
        if (deliveryTimeSelect) {
            deliveryTimeSelect.addEventListener('change', () => {
                if (scheduleGroup) {
                    scheduleGroup.style.display = deliveryTimeSelect.value === 'schedule' ? 'block' : 'none';
                }
            });
        }
    }

    /**
     * Send notification
     */
    async sendNotification() {
        const title = document.getElementById('unifiedNotificationTitle').value.trim();
        const message = document.getElementById('notificationMessage').value.trim();
        const recipients = document.getElementById('notificationRecipients').value;
        
        if (!title || !message) {
            this.showToast('Please fill in title and message', 'error');
            return;
        }
        
        try {
            const notificationData = {
                title,
                message,
                recipients,
                channels: {
                    system: document.getElementById('systemNotification').checked,
                    email: document.getElementById('emailNotification').checked,
                    whatsapp: document.getElementById('whatsappNotification').checked
                },
                deliveryTime: document.getElementById('deliveryTime').value,
                scheduledTime: document.getElementById('scheduledTime')?.value
            };
            
            if (recipients === 'custom') {
                notificationData.customRecipients = document.getElementById('customRecipients').value;
            }
            
            const response = await fetch(this.config.endpoints.system, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });
            
            if (response.ok) {
                this.showToast('Notification sent successfully!', 'success');
                document.getElementById('notificationComposerModal').style.display = 'none';
                this.resetComposerForm();
            } else {
                throw new Error('Failed to send notification');
            }
            
        } catch (error) {
            console.error('Failed to send notification:', error);
            this.showToast('Failed to send notification', 'error');
        }
    }

    /**
     * Reset composer form
     */
    resetComposerForm() {
        document.getElementById('notificationTemplate').value = '';
        document.getElementById('unifiedNotificationTitle').value = '';
        document.getElementById('notificationMessage').value = '';
        document.getElementById('notificationRecipients').value = 'all-members';
        document.getElementById('deliveryTime').value = 'now';
        
        // Reset checkboxes
        document.getElementById('systemNotification').checked = true;
        document.getElementById('emailNotification').checked = false;
        document.getElementById('whatsappNotification').checked = false;
        
        // Hide conditional groups
        document.getElementById('customRecipientsGroup').style.display = 'none';
        document.getElementById('scheduleGroup').style.display = 'none';
        
        // Reset character counters
        document.getElementById('titleCharCount').textContent = '0';
        document.getElementById('messageCharCount').textContent = '0';
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Use existing toast system or create simple one
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRvIBAABXQVZFZm10IBAAAAABAA...');
            audio.play().catch(() => {
                // Ignore audio play errors
            });
        } catch (error) {
            // Ignore audio errors
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.read) {
                notification.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateNotificationUI();
                
                // Update on server
                await fetch(`/api/notifications/${notificationId}/read`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
                    }
                });
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.updateNotificationUI();
            
            // Update on server
            await fetch('/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
                }
            });
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }

    /**
     * Load existing notifications
     */
    async loadExistingNotifications() {
        try {
            const fetchFunction = window.cachedFetch || fetch;
            const response = await fetchFunction('/api/notifications/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.notifications = data.notifications || [];
                this.unreadCount = this.notifications.filter(n => !n.read).length;
                this.updateNotificationUI();
            }
        } catch (error) {
            console.error('Failed to load existing notifications:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                url: '/api/notifications/all'
            });
        }
    }

    /**
     * Load settings
     */
    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('notificationSettings')) || this.config.defaults;
        } catch {
            return this.config.defaults;
        }
    }

    /**
     * Save settings
     */
    saveSettings(settings) {
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
        this.settings = settings;
    }

    /**
     * Add notification styles
     */
    addNotificationStyles() {
        if (document.getElementById('unifiedNotificationStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'unifiedNotificationStyles';
        style.textContent = `
            .notification-bell-container {
                position: relative;
                display: inline-block;
                margin-left: 20px;
            }
            
            .notification-bell {
                position: relative;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .notification-bell:hover {
                background: #f8f9fa;
                border-color: #007bff;
            }
            
            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #dc3545;
                color: white;
                border-radius: 50%;
                min-width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
            }
            
            .notification-panel {
                position: absolute;
                top: 100%;
                right: 0;
                width: 400px;
                max-height: 500px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }
            
            .notification-panel.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .notification-header {
                padding: 15px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-list {
                max-height: 350px;
                overflow-y: auto;
            }
            
            .notification-item {
                padding: 15px;
                border-bottom: 1px solid #f1f3f4;
                display: flex;
                align-items: flex-start;
                transition: background-color 0.2s ease;
            }
            
            .notification-item:hover {
                background: #f8f9fa;
            }
            
            .notification-item.unread {
                background: #f0f8ff;
            }
            
            .notification-icon {
                margin-right: 12px;
                color: #007bff;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-title {
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .notification-message {
                color: #666;
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .notification-time {
                color: #999;
                font-size: 12px;
            }
            
            .notification-footer {
                padding: 15px;
                border-top: 1px solid #eee;
                text-align: center;
            }
            
            .compose-notification {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            
            .compose-notification:hover {
                background: #0056b3;
            }
            
            .notification-modal .modal-content {
                max-width: 600px;
                margin: 2% auto;
            }
            
            .notification-composer .form-group {
                margin-bottom: 20px;
            }
            
            .notification-composer label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
            }
            
            .notification-composer .required {
                color: #dc3545;
            }
            
            .notification-composer input,
            .notification-composer textarea,
            .notification-composer select {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .notification-composer .char-count {
                color: #666;
                font-size: 12px;
                margin-top: 5px;
                display: block;
            }
            
            .notification-composer .checkbox-group {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
            }
            
            .notification-composer .checkbox-group label {
                display: flex;
                align-items: center;
                font-weight: normal;
                margin-bottom: 0;
                cursor: pointer;
            }
            
            .notification-composer .checkbox-group input[type="checkbox"] {
                width: auto;
                margin-right: 8px;
            }
            
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            }
            
            .toast.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .toast-success {
                background: #28a745;
            }
            
            .toast-error {
                background: #dc3545;
            }
            
            .toast-info {
                background: #17a2b8;
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Setup debug functions
     */
    setupDebugFunctions() {
        window.notificationDebug = {
            getSystem: () => this,
            addTestNotification: () => {
                this.processNewNotifications([{
                    id: Date.now(),
                    type: 'test',
                    title: 'Test Notification',
                    message: 'This is a test notification',
                    timestamp: new Date().toISOString(),
                    read: false
                }]);
            },
            getMetrics: () => ({
                totalNotifications: this.notifications.length,
                unreadCount: this.unreadCount,
                templatesCount: this.templates.size,
                pollingActive: !!this.pollerManager
            })
        };
    }

    /**
     * Bind event listeners
     */
    bindEventListeners() {
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const bell = document.querySelector('.notification-bell-container');
            const panel = document.getElementById('notificationPanel');
            
            if (bell && panel && !bell.contains(e.target)) {
                panel.classList.remove('show');
            }
        });
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        if (this.pollerManager) {
            this.pollerManager.stop();
        }
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Remove UI elements
        const bell = document.getElementById('notificationBell');
        const modal = document.getElementById('notificationComposerModal');
        const styles = document.getElementById('unifiedNotificationStyles');
        
        [bell, modal, styles].forEach(element => {
            if (element) element.remove();
        });
    }
}

// Global instance
window.unifiedNotificationSystem = new UnifiedNotificationSystem();

// Backward compatibility
window.NotificationSystem = UnifiedNotificationSystem;
window.NotificationManager = window.unifiedNotificationSystem;

console.log('🔔 Unified Notification System loaded with performance optimizations');