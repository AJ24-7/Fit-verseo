/**
 * Enhanced Biometric Agent Test Suite
 * Comprehensive testing for agent functionality and hardware integration
 */

const http = require('http');
const axios = require('axios').default;
const fs = require('fs');
const path = require('path');

class BiometricAgentTester {
    constructor() {
        this.baseUrl = 'http://localhost:5001';
        this.testResults = [];
        this.logFile = path.join(__dirname, 'test-results.log');
        this.startTime = Date.now();
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        console.log(logMessage);
        
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (err) {
            // Ignore logging errors
        }
    }

    async runTest(testName, testFunction) {
        this.log(`🧪 Running test: ${testName}`, 'TEST');
        const startTime = Date.now();
        
        try {
            await testFunction();
            const duration = Date.now() - startTime;
            this.testResults.push({ name: testName, status: 'PASS', duration });
            this.log(`✅ Test passed: ${testName} (${duration}ms)`, 'PASS');
            return true;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.testResults.push({ name: testName, status: 'FAIL', duration, error: error.message });
            this.log(`❌ Test failed: ${testName} - ${error.message} (${duration}ms)`, 'FAIL');
            return false;
        }
    }

    async testAgentAvailability() {
        const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        if (!response.data.status || response.data.status !== 'healthy') {
            throw new Error('Agent reports unhealthy status');
        }
        
        this.log(`Agent uptime: ${response.data.uptime} seconds`);
        this.log(`Memory usage: ${response.data.memory.rss}`);
    }

    async testBasicEndpoints() {
        const endpoints = [
            { path: '/', method: 'GET' },
            { path: '/health', method: 'GET' },
            { path: '/api/devices', method: 'GET' }
        ];
        
        for (const endpoint of endpoints) {
            const response = await axios({
                method: endpoint.method,
                url: `${this.baseUrl}${endpoint.path}`,
                timeout: 5000
            });
            
            if (response.status !== 200) {
                throw new Error(`Endpoint ${endpoint.path} returned status ${response.status}`);
            }
            
            this.log(`✓ ${endpoint.method} ${endpoint.path} - OK`);
        }
    }

    async testDeviceDetection() {
        const response = await axios.get(`${this.baseUrl}/api/devices`, { timeout: 5000 });
        
        if (!response.data.success) {
            throw new Error('Device detection API failed');
        }
        
        const devices = response.data.devices;
        this.log(`Detected ${devices.length} devices`);
        
        if (devices.length === 0) {
            this.log('⚠️ No devices detected - virtual devices should be available', 'WARN');
        }
        
        // Check for at least virtual devices
        const hasFingerprint = devices.some(d => d.type === 'fingerprint');
        const hasCamera = devices.some(d => d.type === 'camera');
        
        if (!hasFingerprint) {
            throw new Error('No fingerprint devices detected (not even virtual)');
        }
        
        if (!hasCamera) {
            throw new Error('No camera devices detected (not even virtual)');
        }
        
        this.log(`✓ Found fingerprint devices: ${devices.filter(d => d.type === 'fingerprint').length}`);
        this.log(`✓ Found camera devices: ${devices.filter(d => d.type === 'camera').length}`);
    }

    async testDeviceRescan() {
        const response = await axios.post(`${this.baseUrl}/api/devices/scan`, {}, { timeout: 10000 });
        
        if (!response.data.success) {
            throw new Error('Device rescan failed');
        }
        
        this.log(`Rescan completed, found ${response.data.devices.length} devices`);
    }

    async testFingerprintEnrollment() {
        const testData = {
            personId: 'TEST_MEMBER_001',
            personType: 'member',
            gymId: 'TEST_GYM_001'
        };
        
        const response = await axios.post(`${this.baseUrl}/api/fingerprint/enroll`, testData, {
            timeout: 10000
        });
        
        if (!response.data.success) {
            throw new Error('Fingerprint enrollment failed');
        }
        
        if (!response.data.templateId) {
            throw new Error('No template ID returned from enrollment');
        }
        
        if (!response.data.quality || response.data.quality < 50) {
            throw new Error(`Poor quality enrollment: ${response.data.quality}%`);
        }
        
        this.log(`✓ Enrollment quality: ${response.data.quality}%`);
        this.log(`✓ Template ID: ${response.data.templateId}`);
        
        return response.data;
    }

    async testFingerprintVerification() {
        const testData = {
            personId: 'TEST_MEMBER_001',
            gymId: 'TEST_GYM_001'
        };
        
        const response = await axios.post(`${this.baseUrl}/api/fingerprint/verify`, testData, {
            timeout: 10000
        });
        
        if (!response.data.success) {
            throw new Error('Fingerprint verification request failed');
        }
        
        if (typeof response.data.verified !== 'boolean') {
            throw new Error('Invalid verification response format');
        }
        
        if (typeof response.data.confidence !== 'number') {
            throw new Error('No confidence score returned');
        }
        
        this.log(`✓ Verification result: ${response.data.verified}`);
        this.log(`✓ Confidence: ${(response.data.confidence * 100).toFixed(1)}%`);
        
        return response.data;
    }

    async testFaceEnrollment() {
        const testData = {
            personId: 'TEST_MEMBER_002',
            personType: 'member',
            gymId: 'TEST_GYM_001'
        };
        
        const response = await axios.post(`${this.baseUrl}/api/face/enroll`, testData, {
            timeout: 15000
        });
        
        if (!response.data.success) {
            throw new Error('Face enrollment failed');
        }
        
        if (!response.data.templateId) {
            throw new Error('No template ID returned from face enrollment');
        }
        
        if (!response.data.quality || response.data.quality < 50) {
            throw new Error(`Poor quality face enrollment: ${response.data.quality}%`);
        }
        
        this.log(`✓ Face enrollment quality: ${response.data.quality}%`);
        this.log(`✓ Liveness score: ${response.data.livenessScore}%`);
        this.log(`✓ Template ID: ${response.data.templateId}`);
        
        return response.data;
    }

    async testFaceVerification() {
        const testData = {
            personId: 'TEST_MEMBER_002',
            gymId: 'TEST_GYM_001'
        };
        
        const response = await axios.post(`${this.baseUrl}/api/face/verify`, testData, {
            timeout: 15000
        });
        
        if (!response.data.success) {
            throw new Error('Face verification request failed');
        }
        
        if (typeof response.data.verified !== 'boolean') {
            throw new Error('Invalid face verification response format');
        }
        
        if (typeof response.data.confidence !== 'number') {
            throw new Error('No confidence score returned for face verification');
        }
        
        this.log(`✓ Face verification result: ${response.data.verified}`);
        this.log(`✓ Confidence: ${(response.data.confidence * 100).toFixed(1)}%`);
        this.log(`✓ Liveness score: ${(response.data.livenessScore * 100).toFixed(1)}%`);
        
        return response.data;
    }

    async testLegacyEndpoints() {
        // Test legacy enrollment
        const enrollData = {
            memberId: 'LEGACY_TEST_001',
            memberName: 'Legacy Test Member',
            gymId: 'TEST_GYM_001'
        };
        
        const enrollResponse = await axios.post(`${this.baseUrl}/enroll`, enrollData, {
            timeout: 15000
        });
        
        if (!enrollResponse.data.success) {
            throw new Error('Legacy enrollment failed');
        }
        
        this.log(`✓ Legacy enrollment successful for member: ${enrollResponse.data.memberId}`);
        
        // Test legacy verification
        const verifyData = {
            biometricData: 'dummy_biometric_data',
            gymId: 'TEST_GYM_001'
        };
        
        const verifyResponse = await axios.post(`${this.baseUrl}/verify`, verifyData, {
            timeout: 10000
        });
        
        if (!verifyResponse.data.success) {
            throw new Error('Legacy verification failed');
        }
        
        this.log(`✓ Legacy verification result: ${verifyResponse.data.verified}`);
        
        // Test attendance endpoint
        const attendanceData = {
            memberId: 'LEGACY_TEST_001',
            gymId: 'TEST_GYM_001',
            action: 'check-in'
        };
        
        const attendanceResponse = await axios.post(`${this.baseUrl}/attendance`, attendanceData, {
            timeout: 5000
        });
        
        if (!attendanceResponse.data.success) {
            throw new Error('Attendance recording failed');
        }
        
        this.log(`✓ Attendance recorded: ${attendanceResponse.data.action}`);
    }

    async testErrorHandling() {
        // Test invalid endpoints
        try {
            await axios.get(`${this.baseUrl}/invalid-endpoint`, { timeout: 5000 });
            throw new Error('Should have returned 404 for invalid endpoint');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                this.log('✓ 404 handling works correctly');
            } else {
                throw new Error('Unexpected error response for invalid endpoint');
            }
        }
        
        // Test invalid request data
        try {
            await axios.post(`${this.baseUrl}/api/fingerprint/enroll`, {}, { timeout: 5000 });
            throw new Error('Should have returned 400 for missing personId');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                this.log('✓ Input validation works correctly');
            } else {
                throw new Error('Unexpected error response for invalid data');
            }
        }
    }

    async testConcurrentRequests() {
        const promises = [];
        const concurrentCount = 5;
        
        for (let i = 0; i < concurrentCount; i++) {
            promises.push(
                axios.get(`${this.baseUrl}/health`, { timeout: 5000 })
            );
        }
        
        const results = await Promise.all(promises);
        
        for (const result of results) {
            if (result.status !== 200) {
                throw new Error(`Concurrent request failed with status ${result.status}`);
            }
        }
        
        this.log(`✓ Handled ${concurrentCount} concurrent requests successfully`);
    }

    async testPerformance() {
        const iterations = 10;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
            times.push(Date.now() - start);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        if (avgTime > 1000) {
            throw new Error(`Average response time too high: ${avgTime}ms`);
        }
        
        this.log(`✓ Performance test: avg=${avgTime.toFixed(1)}ms, min=${minTime}ms, max=${maxTime}ms`);
    }

    async testMemoryUsage() {
        const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
        const memoryInfo = response.data.memory;
        
        // Parse memory values (remove 'MB' and convert to number)
        const rssMemory = parseInt(memoryInfo.rss.replace('MB', ''));
        const heapUsed = parseInt(memoryInfo.heapUsed.replace('MB', ''));
        
        if (rssMemory > 200) {
            this.log(`⚠️ High memory usage: RSS=${rssMemory}MB`, 'WARN');
        }
        
        if (heapUsed > 100) {
            this.log(`⚠️ High heap usage: ${heapUsed}MB`, 'WARN');
        }
        
        this.log(`✓ Memory usage: RSS=${rssMemory}MB, Heap=${heapUsed}MB`);
    }

    async runAllTests() {
        console.log('🚀 Starting Enhanced Biometric Agent Test Suite');
        console.log('═══════════════════════════════════════════════');
        
        this.log('Starting comprehensive test suite', 'INFO');
        
        const tests = [
            { name: 'Agent Availability', func: () => this.testAgentAvailability() },
            { name: 'Basic Endpoints', func: () => this.testBasicEndpoints() },
            { name: 'Device Detection', func: () => this.testDeviceDetection() },
            { name: 'Device Rescan', func: () => this.testDeviceRescan() },
            { name: 'Fingerprint Enrollment', func: () => this.testFingerprintEnrollment() },
            { name: 'Fingerprint Verification', func: () => this.testFingerprintVerification() },
            { name: 'Face Enrollment', func: () => this.testFaceEnrollment() },
            { name: 'Face Verification', func: () => this.testFaceVerification() },
            { name: 'Legacy Endpoints', func: () => this.testLegacyEndpoints() },
            { name: 'Error Handling', func: () => this.testErrorHandling() },
            { name: 'Concurrent Requests', func: () => this.testConcurrentRequests() },
            { name: 'Performance', func: () => this.testPerformance() },
            { name: 'Memory Usage', func: () => this.testMemoryUsage() }
        ];
        
        let passed = 0;
        let failed = 0;
        
        for (const test of tests) {
            const result = await this.runTest(test.name, test.func);
            if (result) {
                passed++;
            } else {
                failed++;
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const totalTime = Date.now() - this.startTime;
        
        console.log('\n═══════════════════════════════════════════════');
        console.log('                 TEST SUMMARY');
        console.log('═══════════════════════════════════════════════');
        console.log(`Total Tests: ${tests.length}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
        console.log(`Total Time: ${(totalTime / 1000).toFixed(1)} seconds`);
        
        if (failed > 0) {
            console.log('\nFailed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`  ❌ ${r.name}: ${r.error}`));
        }
        
        console.log('\n📋 Detailed Results:');
        this.testResults.forEach(r => {
            const status = r.status === 'PASS' ? '✅' : '❌';
            console.log(`  ${status} ${r.name} (${r.duration}ms)`);
        });
        
        console.log(`\n📄 Full log saved to: ${this.logFile}`);
        
        return { passed, failed, total: tests.length, results: this.testResults };
    }
}

// Main execution
async function main() {
    const tester = new BiometricAgentTester();
    
    try {
        const results = await tester.runAllTests();
        
        if (results.failed === 0) {
            console.log('\n🎉 All tests passed! The biometric agent is working correctly.');
            process.exit(0);
        } else {
            console.log(`\n⚠️ ${results.failed} test(s) failed. Please check the issues above.`);
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Test suite failed to complete:', error.message);
        console.log('💡 Make sure the biometric agent is running on http://localhost:5001');
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = BiometricAgentTester;
