// === LazyLoadManager - Progressive Module and Data Loading ===
// Implements intelligent lazy loading for improved performance and user experience

class LazyLoadManager {
    constructor() {
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.observers = new Map();
        this.deferredInitializations = new Map();
        this.performanceMetrics = {
            modulesLoaded: 0,
            loadTimes: new Map(),
            deferredCount: 0
        };
        
        // Initialize intersection observers for viewport-based loading
        this.initializeIntersectionObservers();
        
        // Initialize idle callback for background loading
        this.initializeIdleLoading();
        
        console.log('🚀 LazyLoadManager initialized');
    }

    /**
     * Lazy load a module when it's actually needed
     * @param {string} moduleName - Name of the module to load
     * @param {Function} initFunction - Function to initialize the module
     * @param {Object} options - Loading options
     */
    async loadModule(moduleName, initFunction, options = {}) {
        const config = {
            priority: options.priority || 'normal', // 'high', 'normal', 'low'
            defer: options.defer || false,
            dependencies: options.dependencies || [],
            timeout: options.timeout || 10000,
            ...options
        };

        // Return cached module if already loaded
        if (this.loadedModules.has(moduleName)) {
            console.log(`✅ Module ${moduleName} already loaded`);
            return true;
        }

        // Return existing loading promise if in progress
        if (this.loadingPromises.has(moduleName)) {
            console.log(`⏳ Module ${moduleName} loading in progress`);
            return this.loadingPromises.get(moduleName);
        }

        const startTime = performance.now();
        console.log(`🔄 Loading module: ${moduleName} (priority: ${config.priority})`);

        // Create loading promise
        const loadingPromise = this._executeModuleLoad(moduleName, initFunction, config, startTime);
        this.loadingPromises.set(moduleName, loadingPromise);

        try {
            const result = await loadingPromise;
            this.loadedModules.add(moduleName);
            this.performanceMetrics.modulesLoaded++;
            
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.loadTimes.set(moduleName, loadTime);
            
            console.log(`✅ Module ${moduleName} loaded in ${loadTime.toFixed(2)}ms`);
            return result;
        } finally {
            this.loadingPromises.delete(moduleName);
        }
    }

    /**
     * Execute the actual module loading with dependency resolution
     */
    async _executeModuleLoad(moduleName, initFunction, config, startTime) {
        try {
            // Load dependencies first
            if (config.dependencies.length > 0) {
                console.log(`📦 Loading dependencies for ${moduleName}:`, config.dependencies);
                await Promise.all(
                    config.dependencies.map(dep => this.loadModule(dep, null, { priority: 'high' }))
                );
            }

            // Add timeout protection
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Module ${moduleName} load timeout`)), config.timeout);
            });

            // Execute initialization function
            const initPromise = typeof initFunction === 'function' ? 
                Promise.resolve(initFunction()) : 
                Promise.resolve(true);

            await Promise.race([initPromise, timeoutPromise]);

            return true;
        } catch (error) {
            console.error(`❌ Failed to load module ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Defer initialization until idle time or explicit trigger
     */
    deferUntilIdle(name, initFunction, options = {}) {
        this.deferredInitializations.set(name, {
            initFunction,
            options,
            timestamp: Date.now()
        });
        
        this.performanceMetrics.deferredCount++;
        console.log(`⏸️ Deferred initialization: ${name}`);
        
        // Schedule for idle execution
        this._scheduleIdleExecution(name);
    }

    /**
     * Load data progressively based on viewport visibility
     */
    loadOnVisible(element, loadFunction, options = {}) {
        const config = {
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.1,
            once: options.once !== false, // Load once by default
            ...options
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log(`👁️ Element visible, loading data...`);
                    loadFunction(entry.target);
                    
                    if (config.once) {
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, {
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        observer.observe(element);
        this.observers.set(element, observer);

        return observer;
    }

    /**
     * Progressive data loading with pagination
     */
    async loadDataProgressively(loadFunction, options = {}) {
        const config = {
            batchSize: options.batchSize || 20,
            maxBatches: options.maxBatches || 10,
            delay: options.delay || 100,
            onProgress: options.onProgress || (() => {}),
            ...options
        };

        const results = [];
        let batch = 0;

        while (batch < config.maxBatches) {
            try {
                console.log(`📊 Loading data batch ${batch + 1}/${config.maxBatches}`);
                
                const batchData = await loadFunction({
                    batch,
                    offset: batch * config.batchSize,
                    limit: config.batchSize
                });

                if (!batchData || batchData.length === 0) {
                    console.log('📭 No more data to load');
                    break;
                }

                results.push(...batchData);
                config.onProgress({
                    batch: batch + 1,
                    totalLoaded: results.length,
                    lastBatchSize: batchData.length
                });

                batch++;

                // Add delay between batches to prevent overwhelming the UI
                if (batch < config.maxBatches && config.delay > 0) {
                    await this._delay(config.delay);
                }

            } catch (error) {
                console.error(`❌ Error loading batch ${batch + 1}:`, error);
                break;
            }
        }

        console.log(`✅ Progressive loading completed: ${results.length} items loaded`);
        return results;
    }

    /**
     * Preload modules/data based on user behavior patterns
     */
    smartPreload(triggers = {}) {
        const config = {
            mouseHover: triggers.mouseHover || null,
            userIdle: triggers.userIdle || 2000, // ms
            networkIdle: triggers.networkIdle || true,
            ...triggers
        };

        // Preload on mouse hover
        if (config.mouseHover) {
            config.mouseHover.elements.forEach(element => {
                element.addEventListener('mouseenter', () => {
                    console.log('🖱️ Mouse hover detected, preloading...');
                    config.mouseHover.loadFunction();
                }, { once: true });
            });
        }

        // Preload during user idle time
        if (config.userIdle) {
            let idleTimer;
            const resetIdleTimer = () => {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(() => {
                    console.log('😴 User idle detected, preloading...');
                    if (config.idleFunction) config.idleFunction();
                }, config.userIdle);
            };

            ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetIdleTimer, { passive: true });
            });

            resetIdleTimer();
        }
    }

    /**
     * Initialize intersection observers for viewport-based loading
     */
    initializeIntersectionObservers() {
        // Observer for tab content that should load when visible
        this.tabObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const tabId = entry.target.id;
                    this._triggerTabLazyLoad(tabId);
                }
            });
        }, {
            rootMargin: '10px',
            threshold: 0.1
        });

        // Observer for heavy content sections
        this.contentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this._loadHeavyContent(entry.target);
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1
        });
    }

    /**
     * Initialize idle callback for background loading
     */
    initializeIdleLoading() {
        if ('requestIdleCallback' in window) {
            const processIdleTasks = (deadline) => {
                while (deadline.timeRemaining() > 0 && this.deferredInitializations.size > 0) {
                    const [name, deferred] = this.deferredInitializations.entries().next().value;
                    
                    try {
                        console.log(`⚡ Executing deferred task: ${name}`);
                        deferred.initFunction();
                        this.deferredInitializations.delete(name);
                    } catch (error) {
                        console.error(`❌ Error executing deferred task ${name}:`, error);
                        this.deferredInitializations.delete(name);
                    }
                }

                // Schedule next idle callback if there are more tasks
                if (this.deferredInitializations.size > 0) {
                    requestIdleCallback(processIdleTasks);
                }
            };

            requestIdleCallback(processIdleTasks);
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => this._processIdleTasksFallback(), 1000);
        }
    }

    /**
     * Schedule idle execution for deferred tasks
     */
    _scheduleIdleExecution(name) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                if (this.deferredInitializations.has(name)) {
                    const deferred = this.deferredInitializations.get(name);
                    try {
                        deferred.initFunction();
                        this.deferredInitializations.delete(name);
                        console.log(`⚡ Executed deferred task: ${name}`);
                    } catch (error) {
                        console.error(`❌ Error in deferred task ${name}:`, error);
                    }
                }
            });
        }
    }

    /**
     * Trigger lazy loading for specific tabs
     */
    _triggerTabLazyLoad(tabId) {
        const tabLoadMap = {
            'equipmentTab': () => this.loadModule('equipment', () => window.equipmentManager?.init()),
            'supportTab': () => this.loadModule('support', () => window.supportReviewsManager?.init()),
            'trialBookingsTab': () => this.loadModule('trialBookings', () => window.trialBookingsManager?.init())
        };

        const loadFunction = tabLoadMap[tabId];
        if (loadFunction) {
            loadFunction();
        }
    }

    /**
     * Load heavy content when it becomes visible
     */
    _loadHeavyContent(element) {
        const contentType = element.dataset.lazyContent;
        
        switch (contentType) {
            case 'charts':
                this._loadCharts(element);
                break;
            case 'tables':
                this._loadTables(element);
                break;
            case 'images':
                this._loadImages(element);
                break;
        }
    }

    /**
     * Load charts progressively
     */
    _loadCharts(container) {
        const charts = container.querySelectorAll('[data-chart]');
        charts.forEach((chart, index) => {
            setTimeout(() => {
                this._renderChart(chart);
            }, index * 200); // Stagger chart loading
        });
    }

    /**
     * Load table data progressively
     */
    _loadTables(container) {
        const tables = container.querySelectorAll('table[data-lazy-table]');
        tables.forEach(table => {
            this._loadTableData(table);
        });
    }

    /**
     * Load images with lazy loading
     */
    _loadImages(container) {
        const images = container.querySelectorAll('img[data-lazy-src]');
        images.forEach(img => {
            img.src = img.dataset.lazySrc;
            img.removeAttribute('data-lazy-src');
        });
    }

    /**
     * Utility methods
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    _processIdleTasksFallback() {
        if (this.deferredInitializations.size > 0) {
            const [name, deferred] = this.deferredInitializations.entries().next().value;
            try {
                deferred.initFunction();
                this.deferredInitializations.delete(name);
            } catch (error) {
                console.error(`❌ Error in fallback deferred task ${name}:`, error);
                this.deferredInitializations.delete(name);
            }
            
            setTimeout(() => this._processIdleTasksFallback(), 100);
        }
    }

    /**
     * Performance monitoring
     */
    getPerformanceMetrics() {
        const avgLoadTime = Array.from(this.performanceMetrics.loadTimes.values())
            .reduce((sum, time) => sum + time, 0) / this.performanceMetrics.loadTimes.size || 0;

        return {
            modulesLoaded: this.performanceMetrics.modulesLoaded,
            averageLoadTime: avgLoadTime.toFixed(2),
            deferredTasks: this.performanceMetrics.deferredCount,
            pendingDeferred: this.deferredInitializations.size,
            activeObservers: this.observers.size
        };
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        if (this.tabObserver) this.tabObserver.disconnect();
        if (this.contentObserver) this.contentObserver.disconnect();
        
        // Clear deferred tasks
        this.deferredInitializations.clear();
        
        console.log('🧹 LazyLoadManager cleaned up');
    }
}

// Create global instance
window.LazyLoadManager = window.LazyLoadManager || new LazyLoadManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoadManager;
}