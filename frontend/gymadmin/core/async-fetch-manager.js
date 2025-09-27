/**
 * Production-Ready Async Fetch Manager
 * Eliminates duplicate API calls, provides request deduplication,
 * and implements background refresh with promise memoization
 */

class AsyncFetchManager {
    constructor() {
        // Cache store for responses with timestamp tracking
        this.cache = new Map();
        
        // In-flight request promises to prevent duplicates
        this.inflightRequests = new Map();
        
        // Cache configuration
        this.cacheConfig = {
            // Default cache TTL in milliseconds
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            
            // Route-specific cache policies
            routes: {
                '/api/payments/recent': { ttl: 30000, stale: true }, // 30 seconds, serve stale
                '/api/payments/stats': { ttl: 60000, background: true }, // 1 minute, background refresh
                '/api/members': { ttl: 120000, stale: true }, // 2 minutes
                '/api/equipment': { ttl: 300000, background: true }, // 5 minutes
                '/api/gyms/profile/me': { ttl: 600000, background: true }, // 10 minutes
                '/api/payments/chart-data': { ttl: 60000, background: true }
            }
        };
        
        // Background refresh queue
        this.backgroundRefreshQueue = new Set();
        this.isRefreshing = false;
        
        // Request abort controller for cleanup
        this.abortController = new AbortController();
        
        // Performance metrics
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            backgroundRefreshes: 0,
            duplicatesAvoided: 0
        };
    }

    /**
     * Main fetch method with intelligent caching
     */
    async fetch(url, options = {}) {
        // Defensive check for context
        if (!this || !this.generateCacheKey) {
            console.warn('AsyncFetchManager: Invalid context, falling back to original fetch');
            return window._originalFetch ? window._originalFetch(url, options) : fetch(url, options);
        }
        
        let cacheKey;
        let config;
        
        try {
            cacheKey = this.generateCacheKey(url, options);
            const route = this.extractRoute(url);
            config = this.getCacheConfig(route);
            
            // Check for in-flight request
            if (this.inflightRequests.has(cacheKey)) {
                this.metrics.duplicatesAvoided++;
                return this.inflightRequests.get(cacheKey);
            }
            
            // Check cache first
            const cachedResponse = this.getCachedResponse(cacheKey, config);
            if (cachedResponse) {
                this.metrics.cacheHits++;
                
                // Schedule background refresh if needed
                if (config.background && this.shouldBackgroundRefresh(cacheKey, config)) {
                    this.scheduleBackgroundRefresh(url, options, cacheKey);
                }
                
                return cachedResponse;
            }
        } catch (contextError) {
            console.error('AsyncFetchManager context error:', contextError);
            return window._originalFetch ? window._originalFetch(url, options) : fetch(url, options);
        }
        
        this.metrics.cacheMisses++;
        
        // Create fetch promise with timeout and abort support
        const fetchPromise = this.createFetchPromise(url, options);
        
        // Store in-flight request if we have a valid cache key
        if (cacheKey) {
            this.inflightRequests.set(cacheKey, fetchPromise);
        }
        
        try {
            const response = await fetchPromise;
            const data = await response.clone().json();
            
            // Cache successful response if we have valid cache key and config
            if (cacheKey && config) {
                this.cacheResponse(cacheKey, data, config);
            }
            
            return response;
        } catch (error) {
            // Serve stale data on error if available
            if (cacheKey && config) {
                const staleData = this.getStaleData(cacheKey);
                if (staleData && config.stale) {
                    console.warn(`Serving stale data for ${url}:`, error.message);
                    return new Response(JSON.stringify(staleData), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            throw error;
        } finally {
            // Clean up in-flight request if we have a valid cache key
            if (cacheKey) {
                this.inflightRequests.delete(cacheKey);
            }
        }
    }

    /**
     * Create fetch promise with enhanced error handling and timeout
     */
    createFetchPromise(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const fetchOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        // Use original fetch to avoid circular calls
        return (window._originalFetch || fetch)(url, fetchOptions)
            .finally(() => clearTimeout(timeoutId));
    }

    /**
     * Generate cache key from URL and options
     */
    generateCacheKey(url, options) {
        try {
            const method = options.method || 'GET';
            const body = options.body || '';
            const urlObj = new URL(url, window.location.origin);
            const params = urlObj.search;
            
            // Include authorization header in cache key for proper JWT token handling
            const authHeader = (options.headers && options.headers['Authorization']) || '';
            const authPart = authHeader ? `:auth:${authHeader.substring(0, 20)}...` : '';
            
            return `${method}:${urlObj.pathname}${params}:${body.substring(0, 50)}${authPart}`;
        } catch (error) {
            console.warn('Error generating cache key:', error);
            // Fallback to simple key generation
            return `${options.method || 'GET'}:${url}:${Date.now()}`;
        }
    }

    /**
     * Extract route pattern from full URL
     */
    extractRoute(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            return urlObj.pathname.replace(/\/\d+/g, '/:id'); // Replace IDs with :id
        } catch {
            return url;
        }
    }

    /**
     * Get cache configuration for specific route
     */
    getCacheConfig(route) {
        const routeConfig = this.cacheConfig.routes[route];
        return {
            ttl: routeConfig?.ttl || this.cacheConfig.defaultTTL,
            stale: routeConfig?.stale || false,
            background: routeConfig?.background || false
        };
    }

    /**
     * Get cached response if valid
     */
    getCachedResponse(cacheKey, config) {
        const cached = this.cache.get(cacheKey);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age < config.ttl) {
            return new Response(JSON.stringify(cached.data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return null;
    }

    /**
     * Cache response data
     */
    cacheResponse(cacheKey, data, config) {
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: config.ttl
        });
        
        // Implement LRU eviction if cache gets too large
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Check if background refresh is needed
     */
    shouldBackgroundRefresh(cacheKey, config) {
        const cached = this.cache.get(cacheKey);
        if (!cached) return false;
        
        const age = Date.now() - cached.timestamp;
        const refreshThreshold = config.ttl * 0.8; // Refresh at 80% of TTL
        
        return age > refreshThreshold && !this.backgroundRefreshQueue.has(cacheKey);
    }

    /**
     * Schedule background refresh
     */
    scheduleBackgroundRefresh(url, options, cacheKey) {
        this.backgroundRefreshQueue.add(cacheKey);
        
        if (!this.isRefreshing) {
            this.processBackgroundRefresh(url, options, cacheKey);
        }
    }

    /**
     * Process background refresh
     */
    async processBackgroundRefresh(url, options, cacheKey) {
        this.isRefreshing = true;
        
        try {
            // Wait for next tick to avoid blocking main thread
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const response = await this.createFetchPromise(url, options);
            const data = await response.json();
            const config = this.getCacheConfig(this.extractRoute(url));
            
            // Update cache with fresh data
            this.cacheResponse(cacheKey, data, config);
            this.metrics.backgroundRefreshes++;
            
        } catch (error) {
            console.warn('Background refresh failed:', error.message);
        } finally {
            this.backgroundRefreshQueue.delete(cacheKey);
            this.isRefreshing = false;
        }
    }

    /**
     * Get stale data for fallback
     */
    getStaleData(cacheKey) {
        const cached = this.cache.get(cacheKey);
        return cached?.data || null;
    }

    /**
     * Clear cache for specific pattern
     */
    invalidateCache(pattern) {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
        const hitRate = totalRequests > 0 ? (this.metrics.cacheHits / totalRequests * 100).toFixed(2) : '0.00';
        
        return {
            ...this.metrics,
            hitRate: `${hitRate}%`,
            cacheSize: this.cache.size,
            inflightRequests: this.inflightRequests.size
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.abortController.abort();
        this.cache.clear();
        this.inflightRequests.clear();
        this.backgroundRefreshQueue.clear();
    }
}

// Global instance with error handling
try {
    window.asyncFetchManager = new AsyncFetchManager();
    
    // Enhanced fetch function with automatic caching
    window.cachedFetch = (url, options) => {
        try {
            return window.asyncFetchManager.fetch(url, options);
        } catch (error) {
            console.warn('CachedFetch error, falling back to original fetch:', error);
            return (window._originalFetch || fetch)(url, options);
        }
    };
    
    console.log('🚀 AsyncFetchManager initialized - API calls will be cached and deduplicated');
} catch (error) {
    console.error('Failed to initialize AsyncFetchManager:', error);
    
    // Fallback: create simple cached fetch
    window.cachedFetch = (url, options) => (window._originalFetch || fetch)(url, options);
}

// Monkey patch the global fetch for automatic caching
if (!window._originalFetch) {
    window._originalFetch = window.fetch;
    window.fetch = (url, options = {}) => {
        // Only cache GET requests to API endpoints, but avoid caching sensitive auth requests
        const shouldCache = (!options.method || options.method === 'GET') && 
                          url.includes('/api/') &&
                          !url.includes('/login') &&
                          !url.includes('/auth') &&
                          !url.includes('/verify');
        
        if (shouldCache && window.asyncFetchManager && typeof window.asyncFetchManager.fetch === 'function') {
            try {
                // Use proper method binding to preserve context
                return window.asyncFetchManager.fetch.call(window.asyncFetchManager, url, options);
            } catch (error) {
                console.warn('AsyncFetchManager error, falling back to original fetch:', error);
                return window._originalFetch(url, options);
            }
        }
        
        return window._originalFetch(url, options);
    };
}

console.log('🚀 AsyncFetchManager initialized - API calls will be cached and deduplicated');