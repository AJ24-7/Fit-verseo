/**
 * Tab Isolation Manager
 * Ensures each tab's initialization is completely isolated and only triggered
 * when tab becomes active, preventing cross-tab performance interference
 */

class TabIsolationManager {
    constructor() {
        this.tabModules = new Map();
        this.activeTab = null;
        this.initializedTabs = new Set();
        this.initializingTabs = new Set();
        
        // Performance tracking
        this.metrics = {
            tabsRegistered: 0,
            tabsInitialized: 0,
            initializationTime: {},
            resourcesLoaded: 0
        };

        this.setupTabEventListeners();
    }

    /**
     * Setup non-conflicting event listeners
     */
    setupTabEventListeners() {
        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const focusedTab = document.activeElement;
                if (focusedTab?.hasAttribute('data-tab')) {
                    e.preventDefault();
                    this.handleTabKeyNavigation(focusedTab, e.key);
                }
            }
        });

        // Handle browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            if (e.state?.tabId) {
                // Use the sidebar's public API to switch tabs
                if (window.ultraFastSidebar) {
                    window.ultraFastSidebar.switchToTabProgrammatically(e.state?.tabId);
                }
            }
        });
    }

    /**
     * Register a tab with its initialization logic
     */
    registerTab(tabId, config) {
        const tabConfig = {
            id: tabId,
            name: config.name || tabId,
            initFunction: config.init,
            cleanupFunction: config.cleanup,
            dependencies: config.dependencies || [],
            priority: config.priority || 'normal', // low, normal, high, critical
            contentSelector: config.contentSelector || `#${tabId}`,
            preloadData: config.preloadData || false,
            cacheResults: config.cacheResults !== false,
            maxIdleTime: config.maxIdleTime || 300000, // 5 minutes default
            ...config
        };

        this.tabModules.set(tabId, tabConfig);
        this.metrics.tabsRegistered++;

        console.log(`📑 Registered tab: ${tabId} (${tabConfig.priority} priority)`);

        // If this is the active tab, initialize immediately
        const activeTabElement = document.querySelector(`.menu-link[data-tab="${tabId}"].active`);
        if (activeTabElement) {
            this.switchToTab(tabId, false);
        }

        return tabId;
    }

    /**
     * Switch to specific tab with full isolation.
     * This is called by UltraFastSidebar.
     */
    async switchToTab(tabId, updateHistory = true) {
        if (this.activeTab === tabId && this.initializedTabs.has(tabId)) {
            return; // Already active and initialized
        }

        console.log(`🔄 Isolator: Preparing tab: ${tabId}`);
        const startTime = performance.now();

        try {
            // Deactivate current tab's background processes
            if (this.activeTab) {
                await this.deactivateTab(this.activeTab);
            }

            // UI updates are handled by UltraFastSidebar

            // Initialize tab if needed
            await this.initializeTab(tabId);

            // Activate tab's background processes
            await this.activateTab(tabId);

            // Update browser history
            if (updateHistory) {
                history.pushState({ tabId }, '', `#${tabId}`);
            }

            this.activeTab = tabId;
            
            const initTime = performance.now() - startTime;
            this.metrics.initializationTime[tabId] = initTime;

            console.log(`✅ Isolator: Tab ${tabId} ready in ${initTime.toFixed(2)}ms`);

        } catch (error) {
            console.error(`Failed to prepare tab ${tabId}:`, error);
            this.showTabError(tabId, error.message);
        }
    }

    /**
     * Initialize tab with dependency resolution and resource loading
     */
    async initializeTab(tabId) {
        const tabConfig = this.tabModules.get(tabId);
        if (!tabConfig || this.initializedTabs.has(tabId) || this.initializingTabs.has(tabId)) {
            return;
        }

        this.initializingTabs.add(tabId);
        console.log(`🚀 Initializing tab: ${tabId}`);

        try {
            // Show skeleton loading
            const contentElement = document.querySelector(tabConfig.contentSelector);
            if (contentElement && window.skeletonLoadingManager) {
                window.skeletonLoadingManager.showSkeleton(
                    contentElement.id || `${tabId}-content`, 
                    this.getSkeletonType(tabId)
                );
            }

            // Load dependencies first
            await this.loadTabDependencies(tabConfig.dependencies);

            // Preload data if configured
            if (tabConfig.preloadData) {
                await this.preloadTabData(tabId);
            }

            // Run initialization function
            if (tabConfig.initFunction) {
                await tabConfig.initFunction(tabConfig);
            }

            // Mark as initialized
            this.initializedTabs.add(tabId);
            this.metrics.tabsInitialized++;

            // Hide skeleton
            if (contentElement && window.skeletonLoadingManager) {
                await window.skeletonLoadingManager.hideSkeleton(
                    contentElement.id || `${tabId}-content`
                );
            }

            console.log(`✅ Tab ${tabId} initialized successfully`);

        } catch (error) {
            console.error(`Tab ${tabId} initialization failed:`, error);
            throw error;
        } finally {
            this.initializingTabs.delete(tabId);
        }
    }

    /**
     * Load tab dependencies (scripts, styles, data)
     */
    async loadTabDependencies(dependencies) {
        if (!dependencies || dependencies.length === 0) return;

        const loadPromises = dependencies.map(async (dep) => {
            if (typeof dep === 'string') {
                // Load script
                if (dep.endsWith('.js')) {
                    return this.loadScript(dep);
                }
                // Load stylesheet
                if (dep.endsWith('.css')) {
                    return this.loadStylesheet(dep);
                }
            } else if (dep.type === 'script') {
                return this.loadScript(dep.src);
            } else if (dep.type === 'style') {
                return this.loadStylesheet(dep.href);
            } else if (dep.type === 'data') {
                return this.loadData(dep.url);
            }
            
            return Promise.resolve();
        });

        await Promise.all(loadPromises);
        this.metrics.resourcesLoaded += dependencies.length;
    }

    /**
     * Load external script with caching
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            
            script.onload = () => {
                console.log(`📜 Loaded script: ${src}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`Failed to load script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Load external stylesheet with caching
     */
    loadStylesheet(href) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            link.onload = () => {
                console.log(`🎨 Loaded stylesheet: ${href}`);
                resolve();
            };
            
            link.onerror = () => {
                console.error(`Failed to load stylesheet: ${href}`);
                reject(new Error(`Failed to load stylesheet: ${href}`));
            };
            
            document.head.appendChild(link);
        });
    }

    /**
     * Preload tab-specific data
     */
    async preloadTabData(tabId) {
        
        // Check cache first
        if (window.asyncFetchManager && this.tabModules.get(tabId).cacheResults) {
            // Implementation depends on tab-specific API endpoints
            console.log(`💾 Preloading data for tab: ${tabId}`);
        }
    }

    /**
     * Activate tab's background processes (e.g., polling)
     */
    async activateTab(tabId) {
        const tabConfig = this.tabModules.get(tabId);
        if (!tabConfig) return;

        // Visibility is handled by UltraFastSidebar

        // Resume any paused processes specific to this tab
        if (tabConfig.onActivate) {
            await tabConfig.onActivate();
        }

        // Resume polling for this tab
        if (window.smartPollingManager) {
            const pollers = Array.from(window.smartPollingManager.activePollers.keys())
                .filter(id => id.includes(tabId));
            pollers.forEach(pollerId => {
                window.smartPollingManager.resumePoller(pollerId);
            });
        }
    }

    /**
     * Deactivate tab's background processes
     */
    async deactivateTab(tabId) {
        const tabConfig = this.tabModules.get(tabId);
        if (!tabConfig) return;

        // Visibility is handled by UltraFastSidebar

        // Run deactivation logic
        if (tabConfig.onDeactivate) {
            await tabConfig.onDeactivate();
        }

        // Pause polling for this tab
        if (window.smartPollingManager) {
            const pollers = Array.from(window.smartPollingManager.activePollers.keys())
                .filter(id => id.includes(tabId));
            pollers.forEach(pollerId => {
                window.smartPollingManager.pausePoller(pollerId);
            });
        }

        console.log(`💤 Tab ${tabId} background processes deactivated`);
    }

    /**
     * Update tab UI state - DEPRECATED
     * UI updates are now handled by UltraFastSidebar.
     */
    updateTabUI(tabId) {
        // This method is no longer needed as UltraFastSidebar handles all UI updates.
        console.warn('updateTabUI is deprecated and should not be called.');
    }

    /**
     * Get appropriate skeleton type for tab
     */
    getSkeletonType(tabId) {
        const skeletonMap = {
            'paymentTab': 'dashboard-stats',
            'attendanceTab': 'table',
            'equipmentTab': 'card-grid',
            'settingsTab': 'form',
            'supportTab': 'list',
            'gymProfileTab': 'form'
        };

        return skeletonMap[tabId] || 'table';
    }

    /**
     * Handle keyboard navigation between tabs
     */
    handleTabKeyNavigation(currentTab, direction) {
        const tabs = Array.from(document.querySelectorAll('[data-tab]'));
        const currentIndex = tabs.indexOf(currentTab);
        
        let nextIndex;
        if (direction === 'ArrowLeft') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
            nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }

        const nextTab = tabs[nextIndex];
        if (nextTab) {
            nextTab.focus();
            // Use the sidebar's public API to switch tabs
            if(window.ultraFastSidebar) {
                window.ultraFastSidebar.switchToTabProgrammatically(nextTab.getAttribute('data-tab'));
            }
        }
    }

    /**
     * Show tab error state
     */
    showTabError(tabId, message) {
        const contentElement = document.querySelector(`#${tabId}`);
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="tab-error-state" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                    <h3>Tab Loading Failed</h3>
                    <p style="color: #666;">${message}</p>
                    <button onclick="window.tabIsolationManager.retryTab('${tabId}')" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Retry failed tab initialization
     */
    retryTab(tabId) {
        this.initializedTabs.delete(tabId);
        if(window.ultraFastSidebar) {
            window.ultraFastSidebar.switchToTabProgrammatically(tabId);
        }
    }

    /**
     * Cleanup unused tabs to free memory
     */
    cleanupIdleTabs() {
        const now = Date.now();
        
        for (const [tabId, config] of this.tabModules) {
            if (tabId === this.activeTab) continue;
            
            const lastActive = this.metrics.initializationTime[tabId] || 0;
            if (now - lastActive > config.maxIdleTime) {
                this.cleanupTab(tabId);
            }
        }
    }

    /**
     * Cleanup specific tab resources
     */
    cleanupTab(tabId) {
        const tabConfig = this.tabModules.get(tabId);
        if (tabConfig && tabConfig.cleanupFunction) {
            tabConfig.cleanupFunction();
        }

        this.initializedTabs.delete(tabId);
        console.log(`🧹 Cleaned up idle tab: ${tabId}`);
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeTab: this.activeTab,
            initializedTabs: this.initializedTabs.size,
            initializingTabs: this.initializingTabs.size
        };
    }

    /**
     * Preload high-priority tabs
     */
    preloadCriticalTabs() {
        for (const [tabId, config] of this.tabModules) {
            if (config.priority === 'critical' && !this.initializedTabs.has(tabId)) {
                this.initializeTab(tabId).catch(error => {
                    console.warn(`Failed to preload critical tab ${tabId}:`, error);
                });
            }
        }
    }

    /**
     * Destroy and cleanup all resources
     */
    destroy() {
        for (const tabId of this.initializedTabs) {
            this.cleanupTab(tabId);
        }

        this.tabModules.clear();
        this.initializedTabs.clear();
        this.initializingTabs.clear();
    }
}

// Global instance
window.tabIsolationManager = new TabIsolationManager();

// Helper functions for easy tab registration
window.registerTab = (tabId, config) => {
    return window.tabIsolationManager.registerTab(tabId, config);
};

// This is now the primary way to programmatically switch tabs
window.switchTab = (tabId) => {
    if (window.ultraFastSidebar) {
        return window.ultraFastSidebar.switchToTabProgrammatically(tabId);
    }
};

// Auto-detect initial active tab on page load
document.addEventListener('DOMContentLoaded', () => {
    const hashTab = location.hash.slice(1);
    
    if (hashTab && document.querySelector(`[data-tab="${hashTab}"]`)) {
        if (window.ultraFastSidebar) {
            window.ultraFastSidebar.switchToTabProgrammatically(hashTab);
        }
    } else {
        // Fallback to the first tab or a default if no hash is present
        const firstTab = document.querySelector('.menu-link[data-tab]');
        if (firstTab && window.ultraFastSidebar) {
            window.ultraFastSidebar.switchToTabProgrammatically(firstTab.getAttribute('data-tab'));
        }
    }
});

console.log('🎯 TabIsolationManager initialized - Tab initialization will be isolated and lazy-loaded');