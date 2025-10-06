/**
 * Optimized Module Loader for Gym Admin Dashboard
 * Eliminates duplicates, conflicts, and provides clean module loading
 */

class OptimizedModuleLoader {
    constructor() {
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.moduleOrder = [
            // Core infrastructure (must load first)
            'core/unified-auth-manager.js',
            'core/error-manager.js', 
            'core/api-config.js',
            'utils/safe-api.js',
            
            // Performance managers
            'core/async-fetch-manager.js',
            'core/dom-performance-manager.js',
            'core/skeleton-loading-manager.js',
            
            // Tab system (critical for navigation)
            'core/tab-isolation-manager.js',
            'performance-sidebar.js',
            
            // Notification and utilities
            'core/unified-notification-system.js',
            'utils/qr-code-generator.js',
            'modules/seven-day-allowance.js',
            
            // Feature modules loader
            'core/lazy-modules.js'
        ];
        
        this.tabModules = {
            memberDisplayTab: [], // Member functions are in main gymadmin.js
            attendanceTab: ['modules/attendance.js', 'modules/attendance-stats.js'],
            equipmentTab: ['modules/equipment.js'],
            paymentTab: ['modules/payment.js', 'modules/cash-validation.js'],
            settingsTab: ['modules/settings.js', 'modules/gym-profile.js'],
            supportReviewsTab: ['modules/support-reviews.js'],
            trainerTab: ['modules/trainer-management.js'],
            offersTab: ['modules/offers-manager.js']
        };
        
        console.log('🚀 Optimized Module Loader initialized');
    }

    /**
     * Load core modules in proper order
     */
    async loadCoreModules() {
        console.log('📦 Loading core modules...');
        
        for (const modulePath of this.moduleOrder) {
            try {
                await this.loadModule(modulePath);
                // Add small delay to prevent race conditions
                await new Promise(resolve => setTimeout(resolve, 10));
            } catch (error) {
                console.warn(`⚠️ Failed to load core module ${modulePath}:`, error);
                // Continue loading other modules even if one fails
            }
        }
        
        console.log('✅ Core modules loaded');
    }

    /**
     * Load a single module with deduplication
     */
    async loadModule(modulePath) {
        if (this.loadedModules.has(modulePath)) {
            return Promise.resolve();
        }

        if (this.loadingPromises.has(modulePath)) {
            return this.loadingPromises.get(modulePath);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = modulePath;
            script.defer = true;
            
            script.onload = () => {
                this.loadedModules.add(modulePath);
                this.loadingPromises.delete(modulePath);
                console.log(`✅ Loaded: ${modulePath}`);
                resolve();
            };
            
            script.onerror = () => {
                this.loadingPromises.delete(modulePath);
                console.error(`❌ Failed to load: ${modulePath}`);
                reject(new Error(`Failed to load ${modulePath}`));
            };
            
            document.head.appendChild(script);
        });

        this.loadingPromises.set(modulePath, loadPromise);
        return loadPromise;
    }

    /**
     * Load tab-specific modules
     */
    async loadTabModules(tabId) {
        const modules = this.tabModules[tabId];
        if (!modules) {
            console.log(`No modules defined for tab: ${tabId}`);
            return;
        }

        console.log(`📋 Loading modules for ${tabId}:`, modules);
        
        const loadPromises = modules.map(module => this.loadModule(module));
        await Promise.allSettled(loadPromises);
        
        console.log(`✅ Tab modules loaded for ${tabId}`);
    }

    /**
     * Get loading status
     */
    getStatus() {
        return {
            loaded: Array.from(this.loadedModules),
            loading: Array.from(this.loadingPromises.keys()),
            total: this.moduleOrder.length
        };
    }

    /**
     * Initialize the module loader
     */
    async initialize() {
        console.log('🔧 Initializing optimized module system...');
        
        // Expose global functions for compatibility
        window.__loadTabScripts = this.loadTabModules.bind(this);
        window.moduleLoader = this;
        
        // Load core modules
        await this.loadCoreModules();
        
        // Set up tab change listeners for dynamic loading
        this.setupTabListeners();
        
        console.log('✅ Module system initialized');
    }

    /**
     * Set up listeners for tab changes
     */
    setupTabListeners() {
        // Listen for tab switches via sidebar
        document.addEventListener('tabSwitched', (event) => {
            const tabId = event.detail?.tabId;
            if (tabId) {
                this.loadTabModules(tabId);
            }
        });

        // Listen for manual tab clicks
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-tab]');
            if (target) {
                const tabId = target.getAttribute('data-tab');
                this.loadTabModules(tabId);
            }
        });
    }
}

// Initialize the optimized module loader
document.addEventListener('DOMContentLoaded', () => {
    if (!window.optimizedModuleLoader) {
        window.optimizedModuleLoader = new OptimizedModuleLoader();
        window.optimizedModuleLoader.initialize();
    }
});