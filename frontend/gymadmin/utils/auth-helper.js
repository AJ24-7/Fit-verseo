/**
 * Auth Helper Utility
 * Provides standardized authentication methods for all modules
 */

class AuthHelper {
    static async getToken() {
        if (window.unifiedAuthManager) {
            return await window.unifiedAuthManager.getToken();
        }
        // Fallback for backward compatibility
        return localStorage.getItem('gymAdminToken') || 
               localStorage.getItem('gymAuthToken') || 
               localStorage.getItem('token');
    }

    static async waitForToken() {
        if (window.unifiedAuthManager) {
            return await window.unifiedAuthManager.waitForToken();
        }
        // Fallback implementation
        let token = this.getToken();
        let retries = 50;
        while (!token && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
            token = this.getToken();
            retries--;
        }
        return token;
    }

    static async getCurrentGymAdminId() {
        if (window.unifiedAuthManager) {
            return await window.unifiedAuthManager.getCurrentGymAdminId();
        }
        // Fallback - try to extract from token or make API call
        try {
            const token = await this.getToken();
            if (!token) return null;

            const response = await fetch('/api/admin/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.admin?.gymId || data.gymId;
            }
        } catch (error) {
            console.error('Failed to get gym admin ID:', error);
        }
        return null;
    }

    static getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
        };
    }

    static async getAuthHeadersAsync() {
        const token = await this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Make globally available
window.AuthHelper = AuthHelper;