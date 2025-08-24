// Admin Authentication Guard
// This script should be included in admin.html to ensure proper authentication

class AdminAuthGuard {
    constructor() {
        this.baseURL = 'http://localhost:5000/api/admin';
        this.checkAuthentication();
    }

    async checkAuthentication() {
        // First check if any admin exists in the system
        try {
            const adminExistsResponse = await fetch(`${this.baseURL}/check-admin-exists`);
            const adminExistsResult = await adminExistsResponse.json();
            
            if (!adminExistsResult.adminExists) {
                this.redirectToSetup('No admin account exists. Please complete the initial setup.');
                return;
            }
        } catch (error) {
            console.log('Could not check admin existence, proceeding with normal auth check');
        }

        const token = localStorage.getItem('adminToken');
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        
        if (!token) {
            this.redirectToLogin('No authentication token found');
            return;
        }

        // Check token expiration
        if (loginTimestamp) {
            const sessionAge = Date.now() - new Date(loginTimestamp).getTime();
            const sessionTimeout = parseInt(localStorage.getItem('sessionTimeout')) || 1800000; // 30 minutes
            
            if (sessionAge > sessionTimeout) {
                this.clearSession();
                this.redirectToLogin('Session expired');
                return;
            }
        }

        // Verify token with server
        try {
            const response = await fetch(`${this.baseURL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                // Token is invalid or expired
                this.clearSession();
                this.redirectToLogin('Authentication expired');
                return;
            }

            if (response.ok) {
                const result = await response.json();
                
                // Store admin info for use in the dashboard
                localStorage.setItem('currentAdmin', JSON.stringify(result.admin));
                
                // Start session monitoring
                this.startSessionMonitoring();
                
                // Show the main content
                this.showMainContent();
                
                console.log('Authentication verified successfully');
            } else {
                throw new Error('Authentication verification failed');
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.redirectToLogin('Authentication verification failed');
        }
    }

    startSessionMonitoring() {
        // Auto-refresh token every 25 minutes
        setInterval(async () => {
            await this.refreshToken();
        }, 25 * 60 * 1000);

        // Monitor for inactivity
        let lastActivity = Date.now();
        const inactivityTimeout = 30 * 60 * 1000; // 30 minutes

        const resetActivity = () => {
            lastActivity = Date.now();
        };

        // Track user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetActivity, { passive: true });
        });

        // Check for inactivity every minute
        setInterval(() => {
            if (Date.now() - lastActivity > inactivityTimeout) {
                this.logout('Session expired due to inactivity');
            }
        }, 60000);
    }

    async refreshToken() {
        const refreshToken = localStorage.getItem('adminRefreshToken');
        const deviceFingerprint = this.getDeviceFingerprint();

        if (!refreshToken) {
            this.logout('No refresh token available');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken,
                    deviceFingerprint
                })
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('adminToken', result.token);
                localStorage.setItem('loginTimestamp', new Date().toISOString());
                console.log('Token refreshed successfully');
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout('Session expired');
        }
    }

    getDeviceFingerprint() {
        // Same fingerprint generation as in login
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        return btoa(fingerprint).substring(0, 32);
    }

    showMainContent() {
        // Hide loading screen if present
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Show main admin interface
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.style.display = 'block';
        }

        // Update admin info in UI
        this.updateAdminInfo();
    }

    updateAdminInfo() {
        const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || '{}');
        
        // Update admin name in header
        const adminNameElements = document.querySelectorAll('.admin-name, .admin-user span');
        adminNameElements.forEach(element => {
            if (currentAdmin.name) {
                element.textContent = currentAdmin.name;
            }
        });

        // Update admin email if shown anywhere
        const adminEmailElements = document.querySelectorAll('.admin-email');
        adminEmailElements.forEach(element => {
            if (currentAdmin.email) {
                element.textContent = currentAdmin.email;
            }
        });

        // Show role-based features
        if (currentAdmin.role === 'super_admin') {
            this.showSuperAdminFeatures();
        }
    }

    showSuperAdminFeatures() {
        // Show features only available to super admins
        const superAdminElements = document.querySelectorAll('.super-admin-only');
        superAdminElements.forEach(element => {
            element.style.display = 'block';
        });
    }

    clearSession() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('currentAdmin');
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('sessionTimeout');
    }

    async logout(reason = 'Logged out') {
        const refreshToken = localStorage.getItem('adminRefreshToken');
        
        // Notify server of logout
        if (refreshToken) {
            try {
                await fetch(`${this.baseURL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({ refreshToken })
                });
            } catch (error) {
                console.error('Logout notification failed:', error);
            }
        }

        this.clearSession();
        this.redirectToLogin(reason);
    }

    redirectToLogin(reason = '') {
        console.log('Redirecting to login:', reason);
        
        // Show a brief message if needed
        if (reason && reason !== 'No authentication token found') {
            alert(reason + '. Please login again.');
        }
        
        // Redirect to professional login page
        window.location.href = '/frontend/admin/admin-login.html';
    }

    redirectToSetup(reason = '') {
        console.log('Redirecting to setup:', reason);
        
        // Show a brief message
        if (reason) {
            alert(reason);
        }
        
        // Redirect to admin setup page
        window.location.href = 'admin-setup.html';
    }
}

// Initialize authentication guard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add loading screen if not present
    if (!document.getElementById('loading-screen')) {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top: 3px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <h3>Verifying Authentication...</h3>
                    <p style="margin-top: 10px; opacity: 0.8;">Please wait while we secure your session</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingScreen);
    }

    // Hide main content initially
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    // Initialize auth guard
    new AdminAuthGuard();
});

// Global logout function that can be called from anywhere
window.adminLogout = function() {
    const authGuard = new AdminAuthGuard();
    authGuard.logout('User requested logout');
};

// Handle browser back/forward button
window.addEventListener('popstate', () => {
    // Re-check authentication when navigating
    new AdminAuthGuard();
});
