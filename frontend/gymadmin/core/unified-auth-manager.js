/**
 * Unified Authentication Manager
 * Consolidates all authentication logic to eliminate duplicates across modules
 * Provides consistent token management, admin ID retrieval, and API authorization
 */

class UnifiedAuthManager {
    constructor() {
        this.tokenKey = 'gymAdminToken';
        this.fallbackTokenKeys = ['gymAuthToken', 'adminToken'];
        this.maxRetries = 50; // 5 seconds
        this.retryDelay = 100; // 100ms
        this.currentGymAdminId = null;
        this.currentToken = null;
        
        // Cache for frequent operations
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        
        console.log('🔐 Unified Authentication Manager initialized');
    }

    /**
     * Get current authentication token with fallback logic
     */
    getToken() {
        // Return cached token if available and fresh
        if (this.currentToken && this.isTokenValid(this.currentToken)) {
            return this.currentToken;
        }

        // Check URL parameters first (for redirects)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            localStorage.setItem(this.tokenKey, urlToken);
            // Clean the URL to avoid token exposure
            window.history.replaceState({}, document.title, window.location.pathname);
            this.currentToken = urlToken;
            return urlToken;
        }

        // Check primary token location
        let token = localStorage.getItem(this.tokenKey);
        if (token) {
            this.currentToken = token;
            return token;
        }

        // Check fallback locations
        for (const fallbackKey of this.fallbackTokenKeys) {
            token = localStorage.getItem(fallbackKey);
            if (token) {
                // Migrate to primary key
                localStorage.setItem(this.tokenKey, token);
                localStorage.removeItem(fallbackKey);
                this.currentToken = token;
                return token;
            }
        }

        // Check sessionStorage as last resort
        token = sessionStorage.getItem(this.tokenKey);
        if (token) {
            // Move to localStorage for persistence
            localStorage.setItem(this.tokenKey, token);
            sessionStorage.removeItem(this.tokenKey);
            this.currentToken = token;
            return token;
        }

        return null;
    }

    /**
     * Wait for authentication token with smart retry logic
     */
    async waitForToken(maxTries = this.maxRetries, delayMs = this.retryDelay) {
        let tries = 0;
        
        while (tries < maxTries) {
            const result = this.getToken();
            if (result) {
                console.log(`✅ Token found after ${tries} tries from unified auth manager`);
                return result;
            }
            
            tries++;
            if (tries < maxTries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        
        console.error('❌ No token found after waiting. Redirecting to login.');
        this.redirectToLogin();
        throw new Error('Authentication token not found');
    }

    /**
     * Basic token validation
     */
    isTokenValid(token) {
        if (!token || typeof token !== 'string') return false;
        
        try {
            // Basic JWT structure check
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            // Decode payload to check expiration
            const payload = JSON.parse(atob(parts[1]));
            const now = Date.now() / 1000;
            
            return payload.exp ? payload.exp > now : true;
        } catch (error) {
            console.warn('Token validation failed:', error);
            return false; // Assume invalid if can't parse
        }
    }

    /**
     * Get current gym admin ID with caching
     */
    async getCurrentGymAdminId() {
        // Return cached ID if available
        if (this.currentGymAdminId) {
            return this.currentGymAdminId;
        }

        // Check cache
        const cacheKey = 'currentGymAdminId';
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.currentGymAdminId = cached;
            return cached;
        }

        try {
            const token = await this.waitForToken();
            const response = await this.fetchWithAuth('/api/admin/profile');
            
            if (response.ok) {
                const data = await response.json();
                const gymId = data.admin?.gymId || data.gymId;
                
                if (gymId) {
                    this.currentGymAdminId = gymId;
                    this.setCache(cacheKey, gymId);
                    return gymId;
                }
            }
        } catch (error) {
            console.error('Failed to get gym admin ID:', error);
        }

        return null;
    }

    /**
     * Create authenticated fetch request
     */
    async fetchWithAuth(url, options = {}) {
        const token = await this.waitForToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        // Use AsyncFetchManager if available for performance
        const fetchFunction = window.asyncFetchManager?.fetch || window.cachedFetch || fetch;
        
        try {
            const response = await fetchFunction(url, finalOptions);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                console.warn('Authentication failed, clearing token and redirecting to login');
                this.clearAuth();
                this.redirectToLogin();
                throw new Error('Authentication failed');
            }
            
            return response;
        } catch (error) {
            console.error('Authenticated fetch failed:', error);
            throw error;
        }
    }

    /**
     * Get authorization headers
     */
    async getAuthHeaders() {
        const token = await this.waitForToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        try {
            const token = this.getToken();
            return token && this.isTokenValid(token);
        } catch (error) {
            return false;
        }
    }

    /**
     * Redirect to login page with proper path resolution
     */
    redirectToLogin() {
        // Clear any existing auth data
        this.clearAuth();
        
        // Use relative path instead of hardcoded localhost
        const loginPath = '/public/admin-login.html';
        
        // Use replace to prevent back button issues
        window.location.replace(loginPath);
    }

    /**
     * Clear all authentication data
     */
    clearAuth() {
        // Clear primary token
        localStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.tokenKey);
        
        // Clear fallback tokens
        this.fallbackTokenKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Clear cached data
        this.currentToken = null;
        this.currentGymAdminId = null;
        this.cache.clear();
        
        console.log('🔐 Authentication data cleared');
    }

    /**
     * Cache management
     */
    setCache(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        const isExpired = Date.now() - item.timestamp > this.cacheTimeout;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    /**
     * Legacy compatibility methods
     */
    
    // For backward compatibility with existing code
    async waitForTokenLegacy(tokenKey, maxTries, delayMs) {
        return this.waitForToken(maxTries, delayMs);
    }

    // Get gym admin token (legacy method name)
    getGymAdminToken() {
        return this.getToken();
    }

    // Get auth token with fallback (legacy method)
    getAuthToken() {
        return this.getToken();
    }

    /**
     * Batch authentication operations
     */
    async validateAndRefreshAuth() {
        try {
            const token = this.getToken();
            if (!token || !this.isTokenValid(token)) {
                console.log('🔄 Token invalid or missing, attempting refresh...');
                await this.waitForToken();
            }
            
            // Verify with server
            const response = await this.fetchWithAuth('/api/admin/verify-token');
            if (!response.ok) {
                throw new Error('Token verification failed');
            }
            
            console.log('✅ Authentication validated and refreshed');
            return true;
        } catch (error) {
            console.error('❌ Authentication validation failed:', error);
            return false;
        }
    }

    /**
     * Debug and monitoring methods
     */
    getDebugInfo() {
        return {
            hasToken: !!this.currentToken,
            tokenValid: this.currentToken ? this.isTokenValid(this.currentToken) : false,
            cacheSize: this.cache.size,
            gymAdminId: this.currentGymAdminId,
            fallbackKeys: this.fallbackTokenKeys
        };
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Track auth operations
        const originalFetchWithAuth = this.fetchWithAuth.bind(this);
        this.fetchWithAuth = async (url, options = {}) => {
            const start = performance.now();
            try {
                const result = await originalFetchWithAuth(url, options);
                const duration = performance.now() - start;
                console.debug(`🔐 Auth fetch to ${url}: ${duration.toFixed(2)}ms`);
                return result;
            } catch (error) {
                const duration = performance.now() - start;
                console.debug(`❌ Auth fetch failed to ${url}: ${duration.toFixed(2)}ms`);
                throw error;
            }
        };
    }
}

// Create global instance
window.unifiedAuthManager = new UnifiedAuthManager();

// Setup performance monitoring if in development
if (window.location.hostname === 'localhost') {
    window.unifiedAuthManager.setupPerformanceMonitoring();
}

// Backward compatibility aliases
window.authManager = window.unifiedAuthManager;

// Legacy function aliases for smooth migration
window.waitForToken = (tokenKey, maxTries, delayMs) => {
    return window.unifiedAuthManager.waitForToken(maxTries, delayMs);
};

window.getCurrentGymAdminId = () => {
    return window.unifiedAuthManager.getCurrentGymAdminId();
};

window.getAuthToken = () => {
    return window.unifiedAuthManager.getToken();
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedAuthManager;
}

console.log('🔐 Unified Authentication Manager loaded with performance optimizations');