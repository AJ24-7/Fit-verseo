/**
 * Essential Functions Manager
 * Provides fallback implementations for critical functions
 * Prevents undefined function errors during module loading
 */

class EssentialFunctionsManager {
    constructor() {
        this.setupFallbacks();
        console.log('🛡️ Essential functions manager initialized');
    }

    setupFallbacks() {
        // Essential fallback functions to prevent errors
        window.fetchAndRenderActivities = window.fetchAndRenderActivities || function() {
            console.log('📊 Activities functionality will be loaded when needed');
        };

        window.fetchPendingTrainers = window.fetchPendingTrainers || function() {
            console.log('👥 Trainer functionality will be loaded when needed');
            return Promise.resolve([]);
        };

        window.fetchMembersData = window.fetchMembersData || function() {
            console.log('👤 Members data functionality will be loaded when needed');
        };

        window.fetchGymPhotos = window.fetchGymPhotos || function() {
            console.log('📷 Gym photos functionality will be loaded when needed');
        };

        window.showNotification = window.showNotification || function(message, type = 'info') {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
            // Fallback notification display
            this.showFallbackNotification(message, type);
        };

        window.handleBiometricEnrollmentRedirect = window.handleBiometricEnrollmentRedirect || function() {
            console.log('🔒 Biometric enrollment will be available when settings module loads');
        };

        window.handleBiometricDeviceSetupRedirect = window.handleBiometricDeviceSetupRedirect || function() {
            console.log('📱 Device setup will be available when settings module loads');
        };

        window.showDeviceConfigurationModal = window.showDeviceConfigurationModal || function() {
            console.log('⚙️ Device configuration will be available when settings module loads');
        };

        // Settings and customization functions
        window.getGymId = window.getGymId || function() {
            const profile = window.currentGymProfile;
            return profile?._id || profile?.id || localStorage.getItem('currentGymId') || null;
        };

        window.getGymSpecificSetting = window.getGymSpecificSetting || function(key) {
            return localStorage.getItem(key);
        };

        window.applyTabVisibility = window.applyTabVisibility || function(tabName, visible) {
            console.log(`📋 Tab visibility for ${tabName}: ${visible}`);
        };

        window.toggleEquipmentTabVisibility = window.toggleEquipmentTabVisibility || function(visible) {
            console.log(`🏋️ Equipment tab visibility: ${visible}`);
        };

        window.togglePaymentTabVisibility = window.togglePaymentTabVisibility || function(visible) {
            console.log(`💳 Payment tab visibility: ${visible}`);
        };

        // API helper functions
        window.safeApiCall = window.safeApiCall || async function(url, options = {}) {
            try {
                const response = await fetch(url, options);
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    throw new Error('Invalid JSON response');
                }
            } catch (error) {
                console.error('API call failed:', error);
                throw error;
            }
        };

        // Authentication helpers
        window.getAuthToken = window.getAuthToken || function() {
            return localStorage.getItem('gymAdminToken') || sessionStorage.getItem('gymAdminToken');
        };

        window.getAuthHeaders = window.getAuthHeaders || function() {
            const token = window.getAuthToken();
            return {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            };
        };
    }

    showFallbackNotification(message, type) {
        // Create a simple notification element
        const notification = document.createElement('div');
        notification.className = `fallback-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Override functions when real modules load
    updateFunction(name, implementation) {
        if (typeof implementation === 'function') {
            window[name] = implementation;
            console.log(`✅ Updated function: ${name}`);
        }
    }
}

// Add required CSS for fallback notifications
if (!document.getElementById('fallback-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'fallback-notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize immediately
window.essentialFunctionsManager = new EssentialFunctionsManager();