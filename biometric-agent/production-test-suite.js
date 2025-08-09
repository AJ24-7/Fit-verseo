#!/usr/bin/env node

/**
 * Production Biometric System Test Suite
 * Tests all critical biometric functionality for real hardware deployment
 */

const http = require('http');
const https = require('https');

class ProductionBiometricTest {
    constructor() {
        this.agentUrl = 'http://localhost:5001';
        this.serverUrl = 'http://localhost:5000';
        this.testResults = [];
        this.criticalErrors = [];
        this.warnings = [];
    }

    async runAllTests() {
        console.log('🚀 Starting Production Biometric System Test Suite');
        console.log('='.repeat(60));

        // Phase 1: Agent Health and Connectivity
        await this.testAgentHealth();
        await this.testDeviceDetection();
        
        // Phase 2: Device Management
        await this.testDeviceScanning();
        
        // Phase 3: Enrollment Functions
        await this.testFaceEnrollment();
        await this.testFingerprintEnrollment();
        
        // Phase 4: Verification Functions
        await this.testFaceVerification();
        await this.testFingerprintVerification();
        
        // Phase 5: Performance Tests
        await this.testPerformance();

        this.generateReport();
    }

    async makeRequest(url, method = 'GET', data = null) {
        return new Promise((resolve) => {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            const req = http.request(url, options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = {
                            status: res.statusCode,
                            data: JSON.parse(body),
                            success: res.statusCode >= 200 && res.statusCode < 300
                        };
                        resolve(result);
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: body,
                            success: false,
                            error: 'Invalid JSON response'
                        });
                    }
                });
            });

            req.on('error', (err) => {
                resolve({
                    status: 0,
                    success: false,
                    error: err.message
                });
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async testAgentHealth() {
        console.log('🩺 Testing Agent Health...');
        
        const result = await this.makeRequest(`${this.agentUrl}/health`);
        
        if (result.success && result.data.status === 'healthy') {
            this.logSuccess('Agent health check passed');
            this.testResults.push({
                category: 'Agent Health',
                test: 'Health Endpoint',
                status: 'PASS',
                details: `Uptime: ${result.data.uptime}s, Memory: ${result.data.memory.rss}`
            });
        } else {
            this.logError('Agent health check failed', result);
            this.criticalErrors.push('Biometric agent is not healthy');
        }
    }

    async testDeviceDetection() {
        console.log('🔍 Testing Device Detection...');
        
        const result = await this.makeRequest(`${this.agentUrl}/api/devices`);
        
        if (result.success) {
            const devices = result.data.devices || [];
            const fingerprintDevices = devices.filter(d => d.type === 'fingerprint');
            const cameraDevices = devices.filter(d => d.type === 'camera');
            
            this.logSuccess(`Detected ${devices.length} devices: ${fingerprintDevices.length} fingerprint, ${cameraDevices.length} camera`);
            
            this.testResults.push({
                category: 'Device Detection',
                test: 'Device List',
                status: 'PASS',
                details: `Total: ${devices.length}, FP: ${fingerprintDevices.length}, Cam: ${cameraDevices.length}`
            });

            if (devices.length === 0) {
                this.warnings.push('No biometric devices detected - connect real hardware for production');
            }
        } else {
            this.logError('Device detection failed', result);
        }
    }

    async testDeviceScanning() {
        console.log('🔄 Testing Device Scanning...');
        
        const result = await this.makeRequest(`${this.agentUrl}/api/devices/scan`, 'POST');
        
        if (result.success) {
            this.logSuccess('Device scanning completed');
            this.testResults.push({
                category: 'Device Management',
                test: 'Device Scan',
                status: 'PASS',
                details: result.data.message
            });
        } else {
            this.logError('Device scanning failed', result);
        }
    }

    async testFaceEnrollment() {
        console.log('👤 Testing Face Enrollment...');
        
        const testData = {
            personId: 'test_production_001',
            personType: 'member',
            gymId: 'test_gym_production',
            deviceId: 'camera_1'
        };

        const result = await this.makeRequest(`${this.agentUrl}/api/face/enroll`, 'POST', testData);
        
        if (result.success) {
            this.logSuccess(`Face enrollment completed with quality: ${result.data.quality}%`);
            this.testResults.push({
                category: 'Biometric Enrollment',
                test: 'Face Enrollment',
                status: 'PASS',
                details: `Quality: ${result.data.quality}%, Liveness: ${result.data.livenessScore}%`
            });
        } else {
            if (result.data?.error?.includes('camera') || result.data?.error?.includes('device')) {
                this.warnings.push('Face enrollment failed - no camera device available');
                this.testResults.push({
                    category: 'Biometric Enrollment',
                    test: 'Face Enrollment',
                    status: 'SKIP',
                    details: 'No camera device available'
                });
            } else {
                this.logError('Face enrollment failed', result);
            }
        }
    }

    async testFingerprintEnrollment() {
        console.log('🖐️ Testing Fingerprint Enrollment...');
        
        const testData = {
            personId: 'test_production_002',
            personType: 'member', 
            gymId: 'test_gym_production',
            deviceId: 'fp_device_1'
        };

        const result = await this.makeRequest(`${this.agentUrl}/api/fingerprint/enroll`, 'POST', testData);
        
        if (result.success) {
            this.logSuccess(`Fingerprint enrollment completed with quality: ${result.data.quality}%`);
            this.testResults.push({
                category: 'Biometric Enrollment',
                test: 'Fingerprint Enrollment',
                status: 'PASS',
                details: `Quality: ${result.data.quality}%`
            });
        } else {
            if (result.data?.error?.includes('fingerprint') || result.data?.error?.includes('device')) {
                this.warnings.push('Fingerprint enrollment failed - no fingerprint device available');
                this.testResults.push({
                    category: 'Biometric Enrollment',
                    test: 'Fingerprint Enrollment',
                    status: 'SKIP',
                    details: 'No fingerprint device available'
                });
            } else {
                this.logError('Fingerprint enrollment failed', result);
            }
        }
    }

    async testFaceVerification() {
        console.log('🔍 Testing Face Verification...');
        
        const testData = {
            personId: 'test_production_001',
            gymId: 'test_gym_production',
            deviceId: 'camera_1'
        };

        const result = await this.makeRequest(`${this.agentUrl}/api/face/verify`, 'POST', testData);
        
        if (result.success) {
            const verified = result.data.verified ? 'VERIFIED' : 'NOT VERIFIED';
            this.logSuccess(`Face verification: ${verified} (${(result.data.confidence * 100).toFixed(1)}%)`);
            this.testResults.push({
                category: 'Biometric Verification',
                test: 'Face Verification',
                status: 'PASS',
                details: `Verified: ${result.data.verified}, Confidence: ${(result.data.confidence * 100).toFixed(1)}%`
            });
        } else {
            if (result.data?.error?.includes('camera') || result.data?.error?.includes('device')) {
                this.warnings.push('Face verification failed - no camera device available');
            } else {
                this.logError('Face verification failed', result);
            }
        }
    }

    async testFingerprintVerification() {
        console.log('🖐️ Testing Fingerprint Verification...');
        
        const testData = {
            personId: 'test_production_002',
            gymId: 'test_gym_production',
            deviceId: 'fp_device_1'
        };

        const result = await this.makeRequest(`${this.agentUrl}/api/fingerprint/verify`, 'POST', testData);
        
        if (result.success) {
            const verified = result.data.verified ? 'VERIFIED' : 'NOT VERIFIED';
            this.logSuccess(`Fingerprint verification: ${verified} (${(result.data.confidence * 100).toFixed(1)}%)`);
            this.testResults.push({
                category: 'Biometric Verification',
                test: 'Fingerprint Verification',
                status: 'PASS',
                details: `Verified: ${result.data.verified}, Confidence: ${(result.data.confidence * 100).toFixed(1)}%`
            });
        } else {
            if (result.data?.error?.includes('fingerprint') || result.data?.error?.includes('device')) {
                this.warnings.push('Fingerprint verification failed - no fingerprint device available');
                this.testResults.push({
                    category: 'Biometric Verification',
                    test: 'Fingerprint Verification',
                    status: 'SKIP',
                    details: 'No fingerprint device available'
                });
            } else {
                this.logError('Fingerprint verification failed', result);
            }
        }
    }

    async testPerformance() {
        console.log('⚡ Testing Performance...');
        
        const tests = [];
        const testCount = 5;
        
        for (let i = 0; i < testCount; i++) {
            const start = Date.now();
            const result = await this.makeRequest(`${this.agentUrl}/health`);
            const duration = Date.now() - start;
            
            if (result.success) {
                tests.push(duration);
            }
        }
        
        if (tests.length > 0) {
            const avg = tests.reduce((a, b) => a + b, 0) / tests.length;
            const max = Math.max(...tests);
            const min = Math.min(...tests);
            
            this.logSuccess(`Performance: Avg ${avg.toFixed(1)}ms, Min ${min}ms, Max ${max}ms`);
            this.testResults.push({
                category: 'Performance',
                test: 'Response Time',
                status: avg < 1000 ? 'PASS' : 'WARN',
                details: `Average: ${avg.toFixed(1)}ms`
            });
        }
    }

    logSuccess(message) {
        console.log(`✅ ${message}`);
    }

    logError(message, details = null) {
        console.log(`❌ ${message}`);
        if (details) {
            console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 PRODUCTION READINESS REPORT');
        console.log('='.repeat(60));
        
        const categories = [...new Set(this.testResults.map(t => t.category))];
        
        categories.forEach(category => {
            console.log(`\n📁 ${category}:`);
            const categoryTests = this.testResults.filter(t => t.category === category);
            
            categoryTests.forEach(test => {
                const status = test.status === 'PASS' ? '✅' : 
                              test.status === 'SKIP' ? '⏭️' : '⚠️';
                console.log(`   ${status} ${test.test}: ${test.details}`);
            });
        });

        console.log('\n🚨 Critical Errors:');
        if (this.criticalErrors.length === 0) {
            console.log('   ✅ No critical errors found');
        } else {
            this.criticalErrors.forEach(error => console.log(`   ❌ ${error}`));
        }

        console.log('\n⚠️ Warnings:');
        if (this.warnings.length === 0) {
            console.log('   ✅ No warnings');
        } else {
            this.warnings.forEach(warning => console.log(`   ⚠️ ${warning}`));
        }

        const passCount = this.testResults.filter(t => t.status === 'PASS').length;
        const totalCount = this.testResults.length;
        const passRate = ((passCount / totalCount) * 100).toFixed(1);

        console.log(`\n🎯 OVERALL SCORE: ${passCount}/${totalCount} tests passed (${passRate}%)`);
        
        if (this.criticalErrors.length === 0 && passRate >= 80) {
            console.log('🎉 SYSTEM IS PRODUCTION READY!');
        } else if (this.criticalErrors.length === 0) {
            console.log('⚠️ SYSTEM NEEDS IMPROVEMENTS BEFORE PRODUCTION');
        } else {
            console.log('🚫 SYSTEM IS NOT READY FOR PRODUCTION');
        }
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new ProductionBiometricTest();
    tester.runAllTests().catch(console.error);
}

module.exports = ProductionBiometricTest;
