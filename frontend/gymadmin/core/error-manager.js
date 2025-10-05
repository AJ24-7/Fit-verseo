/**
 * ErrorManager - Centralized error handling and notification utility
 * Consolidates showError/showErrorMessage patterns across modules
 */

class ErrorManager {
    constructor() {
        this.errorContainer = null;
        this.debugMode = false;
        this.errorHistory = [];
        this.maxHistorySize = 50;
    }

    /**
     * Initialize error manager with container setup
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        this.debugMode = options.debugMode || false;
        this.setupErrorContainer();
        this.setupGlobalErrorHandler();
    }

    /**
     * Setup error container for displaying messages
     * @private
     */
    setupErrorContainer() {
        // Look for existing error container
        this.errorContainer = document.getElementById('error-container') || 
                             document.querySelector('.error-container') ||
                             document.querySelector('.alert-container');

        // Create if doesn't exist
        if (!this.errorContainer) {
            this.errorContainer = document.createElement('div');
            this.errorContainer.id = 'error-container';
            this.errorContainer.className = 'error-container';
            this.errorContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(this.errorContainer);
        }
    }

    /**
     * Show error message with standardized styling
     * Consolidates all showError/showErrorMessage implementations
     * @param {string} message - Error message to display
     * @param {Object} options - Display options
     */
    showError(message, options = {}) {
        const {
            duration = 5000,
            type = 'error',
            persistent = false,
            context = null,
            validationCode = null
        } = options;

        try {
            // Log error for debugging
            this.logError(message, context);

            // Use toast notification if available (from AsyncFetchManager)
            if (window.showToast && typeof window.showToast === 'function') {
                window.showToast(message, type);
                return;
            }

            // Create error element
            const errorElement = this.createErrorElement(message, type, validationCode);
            
            // Add to container
            this.errorContainer.appendChild(errorElement);

            // Auto-remove if not persistent
            if (!persistent) {
                setTimeout(() => {
                    this.removeErrorElement(errorElement);
                }, duration);
            }

            // Add to history
            this.addToHistory(message, type, context);

        } catch (error) {
            console.error('Error showing error message:', error);
            // Fallback to alert
            alert(message);
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     * @param {Object} options - Display options
     */
    showSuccess(message, options = {}) {
        this.showError(message, { ...options, type: 'success' });
    }

    /**
     * Show warning message
     * @param {string} message - Warning message
     * @param {Object} options - Display options
     */
    showWarning(message, options = {}) {
        this.showError(message, { ...options, type: 'warning' });
    }

    /**
     * Show info message
     * @param {string} message - Info message
     * @param {Object} options - Display options
     */
    showInfo(message, options = {}) {
        this.showError(message, { ...options, type: 'info' });
    }

    /**
     * Create error element with styling
     * @private
     */
    createErrorElement(message, type, validationCode) {
        const element = document.createElement('div');
        element.className = `error-message error-${type}`;
        
        // Get appropriate icon and colors
        const { icon, backgroundColor, textColor } = this.getTypeStyles(type);
        
        element.style.cssText = `
            background: ${backgroundColor};
            color: ${textColor};
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-left: 4px solid ${this.getBorderColor(type)};
            font-size: 14px;
            line-height: 1.4;
            pointer-events: auto;
            cursor: pointer;
            transition: opacity 0.3s ease;
            animation: slideIn 0.3s ease;
        `;

        // Add validation code if provided
        const displayMessage = validationCode ? `[${validationCode}] ${message}` : message;
        
        element.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="flex-shrink: 0; font-size: 16px;">${icon}</span>
                <span style="flex: 1; word-break: break-word;">${this.escapeHtml(displayMessage)}</span>
                <button style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; margin-left: 8px; opacity: 0.7; font-size: 18px;" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Click to dismiss
        element.addEventListener('click', () => {
            this.removeErrorElement(element);
        });

        return element;
    }

    /**
     * Get styles for different message types
     * @private
     */
    getTypeStyles(type) {
        const styles = {
            error: {
                icon: '❌',
                backgroundColor: '#fee',
                textColor: '#c53030'
            },
            success: {
                icon: '✅',
                backgroundColor: '#f0fff4',
                textColor: '#22543d'
            },
            warning: {
                icon: '⚠️',
                backgroundColor: '#fffbeb',
                textColor: '#c05621'
            },
            info: {
                icon: 'ℹ️',
                backgroundColor: '#ebf8ff',
                textColor: '#3182ce'
            }
        };

        return styles[type] || styles.error;
    }

    /**
     * Get border color for message type
     * @private
     */
    getBorderColor(type) {
        const colors = {
            error: '#f56565',
            success: '#48bb78',
            warning: '#ed8936',
            info: '#4299e1'
        };
        return colors[type] || colors.error;
    }

    /**
     * Remove error element with animation
     * @private
     */
    removeErrorElement(element) {
        if (element && element.parentElement) {
            element.style.opacity = '0';
            element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (element.parentElement) {
                    element.parentElement.removeChild(element);
                }
            }, 300);
        }
    }

    /**
     * Log error for debugging and history
     * @private
     */
    logError(message, context) {
        if (this.debugMode) {
            console.error('[ErrorManager]', message, context);
        }
    }

    /**
     * Add error to history
     * @private
     */
    addToHistory(message, type, context) {
        this.errorHistory.unshift({
            message,
            type,
            context,
            timestamp: new Date().toISOString()
        });

        // Limit history size
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear all error messages
     */
    clearAllErrors() {
        if (this.errorContainer) {
            this.errorContainer.innerHTML = '';
        }
    }

    /**
     * Setup global error handler for uncaught errors
     * @private
     */
    setupGlobalErrorHandler() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            if (this.debugMode) {
                this.showError(`JavaScript Error: ${event.error.message}`, {
                    type: 'error',
                    context: { filename: event.filename, lineno: event.lineno }
                });
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (this.debugMode) {
                this.showError(`Unhandled Promise Rejection: ${event.reason}`, {
                    type: 'error',
                    context: { reason: event.reason }
                });
            }
        });
    }

    /**
     * Get error history
     * @returns {Array} Error history
     */
    getErrorHistory() {
        return [...this.errorHistory];
    }

    /**
     * Handle API errors with standard formatting
     * @param {Error|string} error - Error object or message
     * @param {string} operation - Operation that failed
     * @param {Object} options - Display options
     */
    handleApiError(error, operation = 'operation', options = {}) {
        let message;
        
        if (typeof error === 'string') {
            message = error;
        } else if (error && error.message) {
            message = error.message;
        } else {
            message = `Failed to ${operation}. Please try again.`;
        }

        // Add operation context
        const finalMessage = message.includes(operation) ? message : `Failed to ${operation}: ${message}`;
        
        this.showError(finalMessage, {
            ...options,
            context: { operation, originalError: error }
        });
    }

    /**
     * Handle authentication errors
     * @param {Error|string} error - Error object or message
     */
    handleAuthError(error) {
        const message = typeof error === 'string' ? error : 'Authentication required. Please login again.';
        this.showError(message, {
            type: 'warning',
            persistent: true,
            context: { type: 'auth_error' }
        });
    }

    /**
     * Handle validation errors
     * @param {string} validationCode - Validation code
     * @param {string} message - Error message
     */
    handleValidationError(validationCode, message) {
        this.showError(message, {
            type: 'error',
            validationCode,
            context: { type: 'validation_error', code: validationCode }
        });
    }

    /**
     * Enable/disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Add CSS for animations
     * @private
     */
    addAnimationStyles() {
        if (!document.getElementById('error-manager-styles')) {
            const style = document.createElement('style');
            style.id = 'error-manager-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Create global instance and initialize
window.ErrorManager = window.ErrorManager || new ErrorManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ErrorManager.initialize();
        window.ErrorManager.addAnimationStyles();
    });
} else {
    window.ErrorManager.initialize();
    window.ErrorManager.addAnimationStyles();
}