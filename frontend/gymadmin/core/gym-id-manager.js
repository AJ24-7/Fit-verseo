/**
 * GymIdManager - Centralized utility for gym ID retrieval and management
 * Consolidates 20+ duplicate implementations across modules
 */

class GymIdManager {
    constructor() {
        this.cache = new Map();
        this.debugMode = false;
    }

    /**
     * Get current gym ID with multiple fallback strategies
     * Consolidates all variations found in modules
     * @returns {string|null} Gym ID or null if not found
     */
    getCurrentGymId() {
        try {
            // Strategy 1: Check global window.getGymId function
            if (window.getGymId && typeof window.getGymId === 'function') {
                const gymId = window.getGymId();
                if (gymId) {
                    this.debugLog('Found gymId via window.getGymId:', gymId);
                    return gymId;
                }
            }

            // Strategy 2: Primary localStorage keys
            const primaryKeys = ['gymId', 'currentGymId', 'adminGymId'];
            for (const key of primaryKeys) {
                const gymId = localStorage.getItem(key);
                if (gymId) {
                    this.debugLog(`Found gymId via localStorage.${key}:`, gymId);
                    return gymId;
                }
            }

            // Strategy 3: sessionStorage fallback
            const sessionKeys = ['currentGymId', 'gymId'];
            for (const key of sessionKeys) {
                const gymId = sessionStorage.getItem(key);
                if (gymId) {
                    this.debugLog(`Found gymId via sessionStorage.${key}:`, gymId);
                    return gymId;
                }
            }

            // Strategy 4: AuthHelper integration
            if (window.AuthHelper && typeof window.AuthHelper.getCurrentGymId === 'function') {
                const gymId = window.AuthHelper.getCurrentGymId();
                if (gymId) {
                    this.debugLog('Found gymId via AuthHelper:', gymId);
                    return gymId;
                }
            }

            this.debugLog('No gymId found in any location');
            return null;
        } catch (error) {
            console.error('Error getting gym ID:', error);
            return null;
        }
    }

    /**
     * Get current gym admin ID
     * Consolidates admin ID retrieval patterns
     * @returns {string|null} Gym admin ID or null if not found
     */
    getCurrentGymAdminId() {
        try {
            // Strategy 1: Direct admin ID keys
            const adminKeys = ['gymAdminId', 'currentGymAdminId', 'adminId'];
            for (const key of adminKeys) {
                const adminId = localStorage.getItem(key);
                if (adminId) {
                    this.debugLog(`Found adminId via localStorage.${key}:`, adminId);
                    return adminId;
                }
            }

            // Strategy 2: Fallback to gym ID
            const gymId = this.getCurrentGymId();
            if (gymId) {
                this.debugLog('Using gymId as adminId fallback:', gymId);
                return gymId;
            }

            // Strategy 3: AuthHelper integration
            if (window.AuthHelper && typeof window.AuthHelper.getCurrentAdminId === 'function') {
                const adminId = window.AuthHelper.getCurrentAdminId();
                if (adminId) {
                    this.debugLog('Found adminId via AuthHelper:', adminId);
                    return adminId;
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting gym admin ID:', error);
            return null;
        }
    }

    /**
     * Validate that gym ID exists and is properly formatted
     * @param {string} gymId - Gym ID to validate
     * @returns {boolean} True if valid
     */
    isValidGymId(gymId) {
        if (!gymId || typeof gymId !== 'string') {
            return false;
        }

        // Basic validation: non-empty, reasonable length
        return gymId.trim().length > 0 && gymId.length <= 100;
    }

    /**
     * Set gym ID in all storage locations for consistency
     * @param {string} gymId - Gym ID to set
     */
    setCurrentGymId(gymId) {
        if (!this.isValidGymId(gymId)) {
            throw new Error('Invalid gym ID provided');
        }

        try {
            // Set in all common locations
            localStorage.setItem('gymId', gymId);
            localStorage.setItem('currentGymId', gymId);
            sessionStorage.setItem('currentGymId', gymId);

            // Clear cache to force refresh
            this.cache.clear();

            this.debugLog('Set gymId in all storage locations:', gymId);
        } catch (error) {
            console.error('Error setting gym ID:', error);
            throw error;
        }
    }

    /**
     * Get gym ID with caching to reduce localStorage access
     * @param {boolean} useCache - Whether to use cached value
     * @returns {string|null} Cached or fresh gym ID
     */
    getCachedGymId(useCache = true) {
        const cacheKey = 'current_gym_id';
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const gymId = this.getCurrentGymId();
        if (gymId) {
            this.cache.set(cacheKey, gymId);
        }

        return gymId;
    }

    /**
     * Clear all gym ID data from storage and cache
     */
    clearGymId() {
        try {
            // Clear from localStorage
            const localKeys = ['gymId', 'currentGymId', 'adminGymId', 'gymAdminId'];
            localKeys.forEach(key => localStorage.removeItem(key));

            // Clear from sessionStorage
            const sessionKeys = ['currentGymId', 'gymId'];
            sessionKeys.forEach(key => sessionStorage.removeItem(key));

            // Clear cache
            this.cache.clear();

            this.debugLog('Cleared all gym ID data');
        } catch (error) {
            console.error('Error clearing gym ID:', error);
        }
    }

    /**
     * Get gym-specific storage key
     * Utility for modules that need gym-specific localStorage keys
     * @param {string} baseKey - Base key name
     * @param {string} gymId - Optional gym ID (uses current if not provided)
     * @returns {string} Gym-specific key
     */
    getGymSpecificKey(baseKey, gymId = null) {
        const currentGymId = gymId || this.getCurrentGymId();
        if (!currentGymId) {
            throw new Error('No gym ID available for storage key generation');
        }
        return `${baseKey}_${currentGymId}`;
    }

    /**
     * Enable debug logging
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Debug logging helper
     * @private
     */
    debugLog(...args) {
        if (this.debugMode) {
            console.log('[GymIdManager]', ...args);
        }
    }

    /**
     * Get diagnostic information about current gym ID state
     * @returns {Object} Diagnostic data
     */
    getDiagnostics() {
        return {
            currentGymId: this.getCurrentGymId(),
            currentAdminId: this.getCurrentGymAdminId(),
            localStorage: {
                gymId: localStorage.getItem('gymId'),
                currentGymId: localStorage.getItem('currentGymId'),
                adminGymId: localStorage.getItem('adminGymId'),
                gymAdminId: localStorage.getItem('gymAdminId')
            },
            sessionStorage: {
                currentGymId: sessionStorage.getItem('currentGymId'),
                gymId: sessionStorage.getItem('gymId')
            },
            window: {
                hasGetGymId: typeof window.getGymId === 'function',
                hasAuthHelper: typeof window.AuthHelper === 'object'
            },
            cache: Object.fromEntries(this.cache)
        };
    }
}

// Create global instance
window.GymIdManager = window.GymIdManager || new GymIdManager();