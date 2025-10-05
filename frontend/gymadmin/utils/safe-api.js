/**
 * Safe API utility functions to handle JSON parsing errors
 */

/**
 * Safely parse JSON response, checking content-type first
 * @param {Response} response - Fetch response object
 * @returns {Promise<any>} - Parsed JSON data or throws meaningful error
 */
async function safeJsonParse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    } else {
        // Response is not JSON, probably an HTML error page
        const text = await response.text();
        console.error('API returned non-JSON response:', text.substring(0, 200) + '...');
        throw new Error('API returned non-JSON response (likely HTML error page)');
    }
}

/**
 * Safe fetch with automatic JSON parsing and error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON data or throws error
 */
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            // Try to get error message from response if it's JSON
            try {
                const errorData = await safeJsonParse(response);
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            } catch {
                // If we can't parse the error response, just use the status
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        return await safeJsonParse(response);
    } catch (error) {
        console.error('Safe fetch failed:', error);
        throw error;
    }
}

/**
 * Safe fetch with fallback value
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {any} fallbackValue - Value to return if API call fails
 * @returns {Promise<any>} - Parsed JSON data or fallback value
 */
async function safeFetchWithFallback(url, options = {}, fallbackValue = null) {
    try {
        return await safeFetch(url, options);
    } catch (error) {
        console.warn(`API call failed, using fallback value:`, error.message);
        return fallbackValue;
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    // Browser environment
    window.SafeAPI = { safeJsonParse, safeFetch, safeFetchWithFallback };
}