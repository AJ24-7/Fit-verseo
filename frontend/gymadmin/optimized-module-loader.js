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
            dashboardTab: [], // Dashboard functionality is in main gymadmin.js
            memberDisplayTab: [], // Member functions are in main gymadmin.js
            attendanceTab: {
                files: ['modules/attendance.js', 'modules/attendance-stats.js'],
                init: () => {
                    console.log('✅ Attendance tab modules loaded');
                }
            },
            equipmentTab: {
                files: ['modules/equipment.js'],
                init: () => {
                    console.log('✅ Equipment tab modules loaded');
                }
            },
            paymentTab: {
                files: ['modules/payment.js', 'modules/cash-validation.js'],
                init: () => {
                    // Add a small delay to ensure the script is fully loaded and parsed
                    setTimeout(() => {
                        console.log('🔧 Initializing PaymentManager...');
                        
                        // Check if PaymentManager class is available and properly defined
                        if (typeof window.PaymentManager === 'function' && !window.paymentManager) {
                            try {
                                console.log('🔧 Creating new PaymentManager instance...');
                                window.paymentManager = new PaymentManager();
                                window.paymentManager.initializeAdminPasskey();
                                console.log('✅ PaymentManager initialized and passkey system activated.');
                            } catch (error) {
                                console.error('❌ Error initializing PaymentManager:', error);
                                console.log('🔧 Attempting fallback initialization...');
                                
                                // Fallback: Check if PaymentManager has initialization methods
                                if (window.PaymentManager && typeof window.PaymentManager.prototype === 'object') {
                                    try {
                                        // Try creating instance again with different approach
                                        window.paymentManager = Object.create(PaymentManager.prototype);
                                        PaymentManager.call(window.paymentManager);
                                        window.paymentManager.initializeAdminPasskey();
                                        console.log('✅ PaymentManager initialized using fallback method.');
                                    } catch (fallbackError) {
                                        console.error('❌ Fallback initialization also failed:', fallbackError);
                                    }
                                }
                            }
                        } else if (!window.PaymentManager) {
                            console.warn('⚠️ PaymentManager class not found after loading payment.js');
                        } else if (window.paymentManager) {
                            console.log('✅ PaymentManager already initialized');
                        }
                    }, 100); // 100ms delay to ensure script parsing is complete
                }
            },
            settingsTab: {
                files: ['modules/settings.js'],
                init: () => {
                    console.log('✅ Settings tab modules loaded');
                }
            },
            supportReviewsTab: {
                files: ['modules/support-reviews.js', 'modules/enhanced-support-integration.js'],
                init: () => {
                    console.log('✅ Support & Reviews tab modules loaded');
                }
            },
            trainerTab: {
                files: ['modules/trainer-management.js'],
                init: () => {
                    console.log('✅ Trainer tab modules loaded');
                }
            },
            offersTab: {
                files: ['modules/offers-manager.js'],
                init: () => {
                    console.log('✅ Offers tab modules loaded');
                }
            }
        };
        
        this.init();
    }

    init() {
        // Listen for tab switches to load modules (triggered by UltraFastSidebar)
        document.addEventListener('tabSwitched', (e) => {
            this.loadTabModules(e.detail.tabId);
        });
        
        console.log('🔧 OptimizedModuleLoader initialized - ready to load modules on demand');
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
        
        // Trigger any deferred initializations
        this.triggerDeferredInitializations();
    }

    async loadTabModules(tabId) {
        console.log(`📦 loadTabModules called for: ${tabId}`);
        const moduleConfig = this.tabModules[tabId];
        if (!moduleConfig) {
            console.log(`📝 No modules configured for tab: ${tabId}`);
            return;
        }
        console.log(`📦 Module config found for ${tabId}:`, moduleConfig);

        const modulesToLoad = Array.isArray(moduleConfig) ? moduleConfig : moduleConfig.files;

        if (modulesToLoad && modulesToLoad.length > 0) {
            console.log(`📦 Loading modules for tab: ${tabId}`);
            for (const modulePath of modulesToLoad) {
                try {
                    await this.loadModule(modulePath);
                } catch (error) {
                    console.warn(`⚠️ Failed to load module ${modulePath} for tab ${tabId}:`, error);
                    // Continue loading other modules even if one fails
                }
            }
        } else {
            console.log(`📝 No module files specified for tab: ${tabId}`);
        }

        if (moduleConfig.init && typeof moduleConfig.init === 'function') {
            try {
                // Check if already initialized to prevent duplicates
                if (!moduleConfig.initialized) {
                    moduleConfig.init();
                    moduleConfig.initialized = true;
                }
            } catch (error) {
                console.error(`❌ Error during tab-specific initialization for ${tabId}:`, error);
            }
        }
    }

    /**
     * Trigger any deferred initializations
     */
    triggerDeferredInitializations() {
        console.log('🔧 Triggering deferred initializations...');
        
        // Dispatch a custom event for any remaining initialization
        const event = new CustomEvent('coreModulesLoaded');
        document.dispatchEvent(event);
        
        // Ensure all DOMContentLoaded handlers run
        setTimeout(() => {
            console.log('🔧 Running final initialization checks...');
        }, 100);
    }

    /**
     * Load a single module with deduplication
     */
    async loadModule(modulePath) {
        if (this.loadedModules.has(modulePath)) {
            console.log(`📝 Module already loaded: ${modulePath}`);
            return Promise.resolve();
        }

        if (this.loadingPromises.has(modulePath)) {
            return this.loadingPromises.get(modulePath);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            // Use the path directly since we're already in the gymadmin directory
            script.src = modulePath;
            script.async = true;
            
            script.onload = () => {
                this.loadedModules.add(modulePath);
                this.loadingPromises.delete(modulePath);
                console.log(`✅ Module loaded successfully: ${modulePath}`);
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