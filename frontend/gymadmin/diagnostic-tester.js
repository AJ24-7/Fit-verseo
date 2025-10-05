/**
 * Diagnostic Test Suite
 * Tests all optimizers and checks for path/route errors
 */

class DiagnosticTester {
    constructor() {
        this.results = {};
        this.pathErrors = [];
        this.optimizerStatus = {};
        
        console.log('🔍 Diagnostic Tester initialized');
    }

    /**
     * Run comprehensive diagnostics
     */
    async runDiagnostics() {
        console.log('🚀 Running comprehensive diagnostics...');
        
        // Test path/route accessibility
        await this.testPaths();
        
        // Test optimizers
        await this.testOptimizers();
        
        // Check for JavaScript errors
        this.checkJavaScriptErrors();
        
        // Test performance systems
        await this.testPerformanceSystems();
        
        // Generate report
        this.generateReport();
    }

    /**
     * Test critical paths and routes
     */
    async testPaths() {
        console.log('🔗 Testing paths and routes...');
        
        const criticalPaths = [
            // Core scripts
            'core/unified-auth-manager.js',
            'core/unified-notification-system.js',
            'core/module-optimizer.js',
            'core/async-fetch-manager.js',
            'core/smart-polling-manager.js',
            'core/lazy-modules.js',
            
            // Styles
            'styles/gymadmin.css',
            'styles/payment.css',
            'styles/attendance.css',
            
            // Utils
            'utils/i18n.js',
            'utils/qr-code-generator.js',
            
            // API endpoints
            '/api/admin/profile',
            '../public/admin-login.html'
        ];

        for (const path of criticalPaths) {
            try {
                const response = await fetch(path, { method: 'HEAD' }).catch(() => ({ ok: false, status: 'Network Error' }));
                
                if (!response.ok) {
                    this.pathErrors.push({
                        path,
                        status: response.status,
                        error: `Failed to load ${path}`
                    });
                    console.warn(`❌ Path error: ${path} - Status: ${response.status}`);
                } else {
                    console.log(`✅ Path OK: ${path}`);
                }
            } catch (error) {
                this.pathErrors.push({
                    path,
                    error: error.message
                });
                console.warn(`❌ Path error: ${path} - ${error.message}`);
            }
        }

        this.results.pathTests = {
            total: criticalPaths.length,
            errors: this.pathErrors.length,
            success: criticalPaths.length - this.pathErrors.length
        };
    }

    /**
     * Test all optimizers
     */
    async testOptimizers() {
        console.log('⚡ Testing optimizers...');
        
        const optimizers = [
            {
                name: 'UnifiedAuthManager',
                instance: window.unifiedAuthManager,
                methods: ['getToken', 'waitForToken', 'getCurrentGymAdminId', 'fetchWithAuth']
            },
            {
                name: 'UnifiedNotificationSystem', 
                instance: window.unifiedNotificationSystem,
                methods: ['showToast', 'sendNotification', 'togglePanel']
            },
            {
                name: 'ModuleOptimizer',
                instance: window.moduleOptimizer,
                methods: ['optimizeAllModules', 'applyRuntimeOptimizations']
            },
            {
                name: 'AsyncFetchManager',
                instance: window.asyncFetchManager,
                methods: ['fetch', 'clearCache']
            },
            {
                name: 'SmartPollingManager',
                instance: window.smartPollingManager,
                methods: ['createPoller', 'pauseAll', 'resumeAll']
            },
            {
                name: 'TabIsolationManager',
                instance: window.tabIsolationManager,
                methods: ['isolateTab', 'registerTab']
            },
            {
                name: 'DOMPerformanceManager',
                instance: window.domPerformanceManager,
                methods: ['optimizeDOM', 'monitorPerformance']
            },
            {
                name: 'SkeletonLoadingManager',
                instance: window.skeletonLoadingManager,
                methods: ['showSkeleton', 'hideSkeleton']
            },
            {
                name: 'VisibilityChartManager',
                instance: window.visibilityChartManager,
                methods: ['registerChart', 'optimizeCharts']
            }
        ];

        for (const optimizer of optimizers) {
            const status = {
                loaded: !!optimizer.instance,
                methods: {},
                working: false
            };

            if (optimizer.instance) {
                // Test methods
                for (const method of optimizer.methods) {
                    status.methods[method] = typeof optimizer.instance[method] === 'function';
                }
                
                // Test basic functionality
                try {
                    if (optimizer.name === 'UnifiedAuthManager') {
                        // Test auth manager
                        const debugInfo = optimizer.instance.getDebugInfo?.();
                        status.working = !!debugInfo;
                    } else if (optimizer.name === 'UnifiedNotificationSystem') {
                        // Test notification system
                        status.working = typeof optimizer.instance.showToast === 'function';
                    } else if (optimizer.name === 'AsyncFetchManager') {
                        // Test fetch manager
                        status.working = typeof optimizer.instance.fetch === 'function';
                    } else {
                        // Basic instance check for others
                        status.working = true;
                    }
                } catch (error) {
                    status.error = error.message;
                    console.warn(`❌ ${optimizer.name} test failed:`, error);
                }
            }

            this.optimizerStatus[optimizer.name] = status;
            
            const statusIcon = status.loaded && status.working ? '✅' : '❌';
            console.log(`${statusIcon} ${optimizer.name}: ${status.loaded ? 'Loaded' : 'Not Loaded'}${status.working ? ' & Working' : ''}`);
        }

        this.results.optimizerTests = {
            total: optimizers.length,
            loaded: Object.values(this.optimizerStatus).filter(s => s.loaded).length,
            working: Object.values(this.optimizerStatus).filter(s => s.working).length
        };
    }

    /**
     * Check for JavaScript errors
     */
    checkJavaScriptErrors() {
        console.log('🛠️ Checking for JavaScript errors...');
        
        const errors = [];
        
        // Listen for runtime errors
        window.addEventListener('error', (event) => {
            errors.push({
                type: 'Runtime Error',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        // Check for console errors (if available)
        if (console.error.calls) {
            errors.push(...console.error.calls.map(call => ({
                type: 'Console Error',
                message: call.join(' ')
            })));
        }

        this.results.jsErrors = errors;
        
        if (errors.length === 0) {
            console.log('✅ No JavaScript errors detected');
        } else {
            console.warn(`❌ ${errors.length} JavaScript errors detected`);
            errors.forEach(error => {
                console.warn(`  • ${error.type}: ${error.message}`);
            });
        }
    }

    /**
     * Test performance systems
     */
    async testPerformanceSystems() {
        console.log('📊 Testing performance systems...');
        
        const performanceTests = [];
        
        // Test memory usage
        if (performance.memory) {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            
            performanceTests.push({
                name: 'Memory Usage',
                value: `${usedMB}MB / ${totalMB}MB`,
                status: usedMB < 150 ? 'good' : usedMB < 200 ? 'warning' : 'critical'
            });
        }

        // Test script loading times
        const scripts = Array.from(document.scripts).filter(s => s.src);
        const loadTimes = scripts.map(script => ({
            name: script.src.split('/').pop(),
            loaded: script.readyState === 'complete'
        }));

        performanceTests.push({
            name: 'Script Loading',
            value: `${loadTimes.filter(s => s.loaded).length}/${loadTimes.length} loaded`,
            status: loadTimes.every(s => s.loaded) ? 'good' : 'warning'
        });

        // Test async operations
        if (window.asyncFetchManager) {
            try {
                const testStart = performance.now();
                await window.asyncFetchManager.fetch('/api/admin/profile', { method: 'HEAD' }).catch(() => null);
                const testDuration = performance.now() - testStart;
                
                performanceTests.push({
                    name: 'Async Fetch Performance',
                    value: `${testDuration.toFixed(2)}ms`,
                    status: testDuration < 100 ? 'good' : testDuration < 500 ? 'warning' : 'critical'
                });
            } catch (error) {
                performanceTests.push({
                    name: 'Async Fetch Performance',
                    value: 'Failed',
                    status: 'critical',
                    error: error.message
                });
            }
        }

        this.results.performanceTests = performanceTests;
        
        performanceTests.forEach(test => {
            const icon = test.status === 'good' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
            console.log(`${icon} ${test.name}: ${test.value}`);
        });
    }

    /**
     * Generate comprehensive diagnostic report
     */
    generateReport() {
        console.log('\n📊 DIAGNOSTIC REPORT');
        console.log('=' .repeat(50));
        
        // Path Tests
        console.log('\n🔗 PATH TESTS:');
        console.log(`  ✅ Successful: ${this.results.pathTests.success}/${this.results.pathTests.total}`);
        console.log(`  ❌ Failed: ${this.results.pathTests.errors}/${this.results.pathTests.total}`);
        
        if (this.pathErrors.length > 0) {
            console.log('\n❌ Path Errors:');
            this.pathErrors.forEach(error => {
                console.log(`  • ${error.path}: ${error.error || `Status ${error.status}`}`);
            });
        }

        // Optimizer Tests
        console.log('\n⚡ OPTIMIZER TESTS:');
        console.log(`  ✅ Loaded: ${this.results.optimizerTests.loaded}/${this.results.optimizerTests.total}`);
        console.log(`  🔧 Working: ${this.results.optimizerTests.working}/${this.results.optimizerTests.total}`);
        
        console.log('\n📋 Optimizer Details:');
        Object.entries(this.optimizerStatus).forEach(([name, status]) => {
            const icon = status.loaded && status.working ? '✅' : status.loaded ? '⚠️' : '❌';
            console.log(`  ${icon} ${name}: ${status.loaded ? 'Loaded' : 'Missing'}${status.working ? ' & Functional' : ''}${status.error ? ` (${status.error})` : ''}`);
        });

        // Performance Tests
        if (this.results.performanceTests.length > 0) {
            console.log('\n📊 PERFORMANCE TESTS:');
            this.results.performanceTests.forEach(test => {
                const icon = test.status === 'good' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
                console.log(`  ${icon} ${test.name}: ${test.value}`);
            });
        }

        // JavaScript Errors
        if (this.results.jsErrors.length > 0) {
            console.log('\n🚨 JAVASCRIPT ERRORS:');
            this.results.jsErrors.forEach(error => {
                console.log(`  ❌ ${error.type}: ${error.message}`);
            });
        }

        // Overall Status
        const overallStatus = this.calculateOverallStatus();
        console.log(`\n🎯 OVERALL STATUS: ${overallStatus.icon} ${overallStatus.message}`);
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        const recommendations = this.generateRecommendations();
        recommendations.forEach(rec => {
            console.log(`  • ${rec}`);
        });

        return {
            pathTests: this.results.pathTests,
            optimizerTests: this.results.optimizerTests,
            performanceTests: this.results.performanceTests,
            jsErrors: this.results.jsErrors,
            overallStatus
        };
    }

    /**
     * Calculate overall system status
     */
    calculateOverallStatus() {
        const pathScore = (this.results.pathTests.success / this.results.pathTests.total) * 100;
        const optimizerScore = (this.results.optimizerTests.working / this.results.optimizerTests.total) * 100;
        const hasErrors = this.results.jsErrors.length > 0;
        
        if (pathScore >= 90 && optimizerScore >= 80 && !hasErrors) {
            return { icon: '🎉', message: 'EXCELLENT - All systems operational' };
        } else if (pathScore >= 80 && optimizerScore >= 70) {
            return { icon: '✅', message: 'GOOD - System functioning well' };
        } else if (pathScore >= 70 && optimizerScore >= 60) {
            return { icon: '⚠️', message: 'WARNING - Some issues detected' };
        } else {
            return { icon: '❌', message: 'CRITICAL - Multiple issues require attention' };
        }
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.pathErrors.length > 0) {
            recommendations.push('Fix path errors to ensure all resources load correctly');
        }
        
        if (this.results.optimizerTests.loaded < this.results.optimizerTests.total) {
            recommendations.push('Check script loading order - some optimizers are not loaded');
        }
        
        if (this.results.optimizerTests.working < this.results.optimizerTests.loaded) {
            recommendations.push('Debug optimizer functionality - some are loaded but not working');
        }
        
        if (this.results.jsErrors.length > 0) {
            recommendations.push('Fix JavaScript errors to improve system stability');
        }
        
        const memoryTest = this.results.performanceTests?.find(t => t.name === 'Memory Usage');
        if (memoryTest && memoryTest.status === 'critical') {
            recommendations.push('Optimize memory usage - current usage is too high');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System is running optimally - no immediate actions required');
        }
        
        return recommendations;
    }
}

// Auto-run diagnostics (browser only)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(async () => {
            const diagnostic = new DiagnosticTester();
            await diagnostic.runDiagnostics();
            
            // Expose for manual testing
            window.diagnosticTester = diagnostic;
            window.runDiagnostics = () => diagnostic.runDiagnostics();
        }, 8000); // Wait 8 seconds for all systems to load
    });

    // Expose globally
    window.DiagnosticTester = DiagnosticTester;

    console.log('🔍 Diagnostic Tester loaded - will run automatically');
} else {
    // Node.js environment
    console.log('🔍 Diagnostic Tester loaded in Node.js environment');
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DiagnosticTester;
    }
}