/**
 * Unified API Configuration for Gym Admin Dashboard
 * Centralizes all API endpoints and configurations to prevent inconsistencies
 */

class APIConfig {
    constructor() {
        // Determine API base URL based on environment
        this.API_BASE = this.determineAPIBase();
        
        // Define all API endpoints in a centralized location
        this.ENDPOINTS = {
            // Authentication endpoints
            AUTH: {
                LOGIN: '/api/gyms/login',
                VERIFY_2FA: '/api/gyms/verify-2fa',
                LOGOUT: '/api/gyms/logout',
                FORGOT_PASSWORD: '/api/gyms/forgot-password',
                RESET_PASSWORD: '/api/gyms/reset-password',
                VERIFY_TOKEN: '/api/gyms/verify-token'
            },
            
            // Gym management endpoints
            GYM: {
                PROFILE: '/api/gyms/profile/me',
                UPDATE_PROFILE: '/api/gyms/profile',
                UPLOAD_LOGO: '/api/gyms/upload-logo',
                CHANGE_PASSWORD: '/api/gyms/change-password',
                SETTINGS: '/api/gyms/settings'
            },
            
            // Member management endpoints
            MEMBERS: {
                LIST: '/api/members',
                CREATE: '/api/members',
                UPDATE: '/api/members',
                DELETE: '/api/members',
                SEARCH: '/api/members/search',
                EXPORT: '/api/members/export',
                STATS: '/api/members/stats'
            },
            
            // Payment management endpoints
            PAYMENTS: {
                RECENT: '/api/payments/recent',
                STATS: '/api/payments/stats',
                CHART_DATA: '/api/payments/chart-data',
                PROCESS: '/api/payments/process',
                VERIFY: '/api/payments/verify',
                CASH_VALIDATION: '/api/cash-validation'
            },
            
            // Trainer management endpoints
            TRAINERS: {
                LIST: '/api/trainers',
                PENDING: '/api/trainers?status=pending',
                APPROVED: '/api/trainers?status=approved',
                REJECTED: '/api/trainers?status=rejected',
                APPROVE: '/api/trainers/:id/approve',
                REJECT: '/api/trainers/:id/reject',
                UPDATE: '/api/trainers/:id'
            },
            
            // Equipment management endpoints
            EQUIPMENT: {
                LIST: '/api/equipment',
                CREATE: '/api/equipment',
                UPDATE: '/api/equipment/:id',
                DELETE: '/api/equipment/:id',
                STATS: '/api/equipment/stats'
            },
            
            // Attendance endpoints
            ATTENDANCE: {
                TODAY: '/api/attendance/today',
                HISTORY: '/api/attendance/history',
                STATS: '/api/attendance/stats',
                MARK: '/api/attendance/mark',
                BIOMETRIC: '/api/biometric/verify'
            },
            
            // Trial bookings endpoints
            TRIAL_BOOKINGS: {
                LIST: '/api/trial-bookings',
                APPROVE: '/api/trial-bookings/:id/approve',
                REJECT: '/api/trial-bookings/:id/reject',
                STATS: '/api/trial-bookings/stats'
            },
            
            // Security and settings endpoints
            SECURITY: {
                SETTINGS: '/api/security/settings',
                LOGIN_ATTEMPTS: '/api/security/login-attempts',
                UPDATE_2FA: '/api/security/2fa'
            },
            
            // QR Code endpoints
            QR_CODES: {
                GENERATE: '/api/qr-codes/generate',
                LIST: '/api/qr-codes',
                DELETE: '/api/qr-codes/:id',
                STATS: '/api/qr-codes/stats'
            },
            
            // Communication endpoints
            COMMUNICATION: {
                MESSAGES: '/api/gym/communication/messages',
                SEND: '/api/gym/communication/send',
                TEMPLATES: '/api/gym/communication/templates'
            },
            
            // Support endpoints
            SUPPORT: {
                TICKETS: '/api/support/tickets',
                CREATE_TICKET: '/api/support/create',
                UPDATE_TICKET: '/api/support/:id'
            }
        };
        
        // Default request configuration
        this.DEFAULT_CONFIG = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout
        };
        
        console.log('🔧 API Configuration initialized with base:', this.API_BASE);
    }
    
    /**
     * Determine the appropriate API base URL
     */
    determineAPIBase() {
        // Check if we're in a specific environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Development environment
            return window.location.protocol + '//' + window.location.hostname + ':5000';
        } else {
            // Production environment - same origin
            return window.location.origin;
        }
    }
    
    /**
     * Get full API URL for an endpoint
     */
    getURL(endpointPath, params = {}) {
        let url = this.API_BASE + endpointPath;
        
        // Replace path parameters (e.g., :id with actual values)
        Object.keys(params).forEach(key => {
            url = url.replace(`:${key}`, params[key]);
        });
        
        return url;
    }
    
    /**
     * Get authentication headers with current token
     */
    getAuthHeaders() {
        const token = this.getAuthToken();
        const headers = { ...this.DEFAULT_CONFIG.headers };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    /**
     * Get current authentication token with fallback logic
     */
    getAuthToken() {
        // Try multiple possible token locations for compatibility
        const possibleKeys = ['gymAdminToken', 'gymAuthToken', 'adminToken', 'token'];
        
        for (const key of possibleKeys) {
            const token = localStorage.getItem(key);
            if (token && token !== 'undefined' && token !== 'null') {
                return token;
            }
        }
        
        // Check URL parameters as fallback
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            // Store it in localStorage for future use
            localStorage.setItem('gymAdminToken', urlToken);
            return urlToken;
        }
        
        return null;
    }
    
    /**
     * Make an authenticated API request with error handling
     */
    async makeRequest(endpoint, options = {}) {
        const url = typeof endpoint === 'string' ? endpoint : this.getURL(endpoint.path, endpoint.params);
        
        const config = {
            ...this.DEFAULT_CONFIG,
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...(options.headers || {})
            }
        };
        
        // Add timeout abort controller
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), config.timeout);
        config.signal = abortController.signal;
        
        try {
            console.log(`📤 API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            // Handle different response types
            if (!response.ok) {
                const errorData = await this.handleErrorResponse(response);
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Parse response based on content type
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log(`📥 API Response: ${config.method || 'GET'} ${url}`, data);
                return data;
            } else {
                return await response.text();
            }
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle different types of errors
            if (error.name === 'AbortError') {
                console.error(`⏱️ API Timeout: ${url}`);
                throw new Error('Request timeout - please check your connection');
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.error(`🌐 Network Error: ${url}`, error);
                throw new Error('Network error - please check your connection');
            } else {
                console.error(`❌ API Error: ${url}`, error);
                throw error;
            }
        }
    }
    
    /**
     * Handle error responses consistently
     */
    async handleErrorResponse(response) {
        try {
            const errorData = await response.json();
            
            // Handle authentication errors
            if (response.status === 401) {
                console.warn('🔐 Authentication failed, clearing tokens');
                this.clearAuthTokens();
                
                // Only redirect to login if we're not already there
                if (!window.location.href.includes('admin-login.html')) {
                    setTimeout(() => {
                        window.location.href = '/frontend/public/admin-login.html';
                    }, 1000);
                }
            }
            
            return errorData;
        } catch (e) {
            return { message: `HTTP ${response.status}: ${response.statusText}` };
        }
    }
    
    /**
     * Clear all authentication tokens
     */
    clearAuthTokens() {
        const possibleKeys = ['gymAdminToken', 'gymAuthToken', 'adminToken', 'token'];
        possibleKeys.forEach(key => localStorage.removeItem(key));
    }
    
    /**
     * Convenience methods for common HTTP operations
     */
    get(endpoint, params = {}) {
        return this.makeRequest(endpoint, { method: 'GET', ...params });
    }
    
    post(endpoint, data, options = {}) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }
    
    put(endpoint, data, options = {}) {
        return this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }
    
    patch(endpoint, data, options = {}) {
        return this.makeRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }
    
    delete(endpoint, options = {}) {
        return this.makeRequest(endpoint, { method: 'DELETE', ...options });
    }
    
    /**
     * Upload file with proper form data handling
     */
    uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add any additional data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });
        
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData, let browser set it
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });
    }
}

// Create global instance
window.apiConfig = new APIConfig();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfig;
}

console.log('🚀 API Configuration loaded successfully');