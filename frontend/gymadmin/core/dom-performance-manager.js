/**
 * DOM Performance Manager
 * Optimizes DOM manipulation patterns with batching, virtual scrolling,
 * and DocumentFragment usage to eliminate main thread blocking
 */

class DOMPerformanceManager {
    constructor() {
        this.updateQueue = new Map();
        this.isProcessing = false;
        this.batchTimeout = null;
        
        // Performance tracking
        this.metrics = {
            batchedUpdates: 0,
            elementsOptimized: 0,
            renderingTime: 0,
            fragmentsUsed: 0
        };

        // Virtual scroll instances
        this.virtualScrollers = new Map();
    }

    /**
     * Batch DOM updates to prevent layout thrashing
     */
    batchUpdate(elementId, updateFn) {
        // Queue the update
        this.updateQueue.set(elementId, updateFn);

        // Clear existing timeout and schedule new batch
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        this.batchTimeout = setTimeout(() => {
            this.processBatchedUpdates();
        }, 16); // Next frame
    }

    /**
     * Process all queued DOM updates in a single frame
     */
    async processBatchedUpdates() {
        if (this.isProcessing || this.updateQueue.size === 0) return;

        this.isProcessing = true;
        const startTime = performance.now();

        try {
            // Use requestAnimationFrame for optimal timing
            await new Promise(resolve => requestAnimationFrame(resolve));

            // Batch read operations first (avoid layout thrashing)
            const measurements = new Map();
            for (const [elementId] of this.updateQueue) {
                const element = document.getElementById(elementId);
                if (element) {
                    measurements.set(elementId, {
                        offsetWidth: element.offsetWidth,
                        offsetHeight: element.offsetHeight,
                        scrollTop: element.scrollTop
                    });
                }
            }

            // Then batch write operations
            for (const [elementId, updateFn] of this.updateQueue) {
                const element = document.getElementById(elementId);
                if (element) {
                    try {
                        await updateFn(element, measurements.get(elementId));
                        this.metrics.elementsOptimized++;
                    } catch (error) {
                        console.error(`DOM update failed for ${elementId}:`, error);
                    }
                }
            }

            this.metrics.batchedUpdates++;
            this.updateQueue.clear();

        } finally {
            this.isProcessing = false;
            this.metrics.renderingTime += performance.now() - startTime;
        }
    }

    /**
     * Optimized innerHTML replacement using DocumentFragment
     */
    setInnerHTML(element, htmlContent) {
        const startTime = performance.now();

        // Create DocumentFragment for efficient DOM construction
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Move all nodes to fragment
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }

        // Single DOM update
        element.innerHTML = '';
        element.appendChild(fragment);

        this.metrics.fragmentsUsed++;
        this.metrics.renderingTime += performance.now() - startTime;
    }

    /**
     * Optimized list rendering with virtual scrolling
     */
    createVirtualList(containerId, items, renderItem, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const config = {
            itemHeight: options.itemHeight || 50,
            bufferSize: options.bufferSize || 10,
            maxRenderedItems: options.maxRenderedItems || 100,
            ...options
        };

        const virtualScroller = new VirtualScrollManager(container, items, renderItem, config);
        this.virtualScrollers.set(containerId, virtualScroller);

        return virtualScroller;
    }

    /**
     * Debounced event handler creation
     */
    createDebouncedHandler(handler, delay = 150) {
        let timeoutId = null;
        let lastArgs = null;

        return function(...args) {
            lastArgs = args;
            
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                handler.apply(this, lastArgs);
                timeoutId = null;
                lastArgs = null;
            }, delay);
        };
    }

    /**
     * Throttled event handler creation
     */
    createThrottledHandler(handler, delay = 100) {
        let isThrottled = false;
        let lastArgs = null;

        return function(...args) {
            if (isThrottled) {
                lastArgs = args;
                return;
            }

            handler.apply(this, args);
            isThrottled = true;

            setTimeout(() => {
                isThrottled = false;
                if (lastArgs) {
                    handler.apply(this, lastArgs);
                    lastArgs = null;
                }
            }, delay);
        };
    }

    /**
     * Efficient table row updates
     */
    updateTableRows(tableId, rowsData, rowRenderer) {
        this.batchUpdate(tableId, async (table) => {
            const tbody = table.querySelector('tbody');
            if (!tbody) return;

            // Use DocumentFragment for batch updates
            const fragment = document.createDocumentFragment();
            
            rowsData.forEach(rowData => {
                const row = document.createElement('tr');
                row.innerHTML = rowRenderer(rowData);
                fragment.appendChild(row);
            });

            // Single DOM operation
            tbody.innerHTML = '';
            tbody.appendChild(fragment);
        });
    }

    /**
     * Lazy image loading with intersection observer
     */
    setupLazyImages(selector = 'img[data-lazy]') {
        if (!window.IntersectionObserver) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.lazy;
                    img.removeAttribute('data-lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll(selector).forEach(img => {
            imageObserver.observe(img);
        });

        return imageObserver;
    }

    /**
     * Efficient event delegation
     */
    setupEventDelegation(containerId, eventType, selector, handler) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const delegatedHandler = (event) => {
            const target = event.target.closest(selector);
            if (target && container.contains(target)) {
                handler.call(target, event);
            }
        };

        container.addEventListener(eventType, delegatedHandler);
        return () => container.removeEventListener(eventType, delegatedHandler);
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        const avgRenderTime = this.metrics.batchedUpdates > 0 
            ? (this.metrics.renderingTime / this.metrics.batchedUpdates).toFixed(2)
            : '0';

        return {
            ...this.metrics,
            averageRenderTime: `${avgRenderTime}ms`,
            activeVirtualScrollers: this.virtualScrollers.size,
            queuedUpdates: this.updateQueue.size
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        this.updateQueue.clear();
        
        for (const scroller of this.virtualScrollers.values()) {
            scroller.destroy();
        }
        this.virtualScrollers.clear();
    }
}

/**
 * Virtual Scroll Manager for large lists
 */
class VirtualScrollManager {
    constructor(container, items, renderItem, config) {
        this.container = container;
        this.items = items;
        this.renderItem = renderItem;
        this.config = config;
        
        this.scrollTop = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        
        this.viewport = null;
        this.content = null;
        
        this.initialize();
    }

    initialize() {
        // Setup virtual scroll structure
        this.container.innerHTML = `
            <div class="virtual-scroll-viewport" style="
                height: 100%; 
                overflow-y: auto;
                position: relative;
            ">
                <div class="virtual-scroll-content" style="
                    position: relative;
                    height: ${this.items.length * this.config.itemHeight}px;
                ">
                </div>
            </div>
        `;

        this.viewport = this.container.querySelector('.virtual-scroll-viewport');
        this.content = this.container.querySelector('.virtual-scroll-content');

        // Setup scroll handler
        this.viewport.addEventListener('scroll', this.handleScroll.bind(this));

        // Initial render
        this.updateVisibleItems();
    }

    handleScroll() {
        const scrollTop = this.viewport.scrollTop;
        if (Math.abs(scrollTop - this.scrollTop) < this.config.itemHeight) {
            return; // Small scroll, no need to update
        }

        this.scrollTop = scrollTop;
        this.updateVisibleItems();
    }

    updateVisibleItems() {
        const viewportHeight = this.viewport.clientHeight;
        const startIndex = Math.floor(this.scrollTop / this.config.itemHeight);
        const visibleCount = Math.ceil(viewportHeight / this.config.itemHeight);
        
        this.startIndex = Math.max(0, startIndex - this.config.bufferSize);
        this.endIndex = Math.min(
            this.items.length,
            startIndex + visibleCount + this.config.bufferSize
        );

        this.renderVisibleItems();
    }

    renderVisibleItems() {
        const fragment = document.createDocumentFragment();

        for (let i = this.startIndex; i < this.endIndex; i++) {
            const item = this.items[i];
            const element = document.createElement('div');
            element.className = 'virtual-scroll-item';
            element.style.cssText = `
                position: absolute;
                top: ${i * this.config.itemHeight}px;
                width: 100%;
                height: ${this.config.itemHeight}px;
            `;
            element.innerHTML = this.renderItem(item, i);
            fragment.appendChild(element);
        }

        // Update content
        this.content.innerHTML = '';
        this.content.appendChild(fragment);
    }

    updateData(newItems) {
        this.items = newItems;
        this.content.style.height = `${this.items.length * this.config.itemHeight}px`;
        this.updateVisibleItems();
    }

    destroy() {
        if (this.viewport) {
            this.viewport.removeEventListener('scroll', this.handleScroll);
        }
    }
}

// Global instance
window.domPerformanceManager = new DOMPerformanceManager();

// Helper functions for easier usage
window.batchDOMUpdate = (elementId, updateFn) => {
    window.domPerformanceManager.batchUpdate(elementId, updateFn);
};

window.optimizedSetHTML = (element, html) => {
    window.domPerformanceManager.setInnerHTML(element, html);
};

window.createVirtualList = (containerId, items, renderItem, options) => {
    return window.domPerformanceManager.createVirtualList(containerId, items, renderItem, options);
};

window.debouncedHandler = (handler, delay) => {
    return window.domPerformanceManager.createDebouncedHandler(handler, delay);
};

window.throttledHandler = (handler, delay) => {
    return window.domPerformanceManager.createThrottledHandler(handler, delay);
};

console.log('🎨 DOMPerformanceManager initialized - DOM updates will be batched and optimized');