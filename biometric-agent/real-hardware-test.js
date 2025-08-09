#!/usr/bin/env node

/**
 * Real Hardware Biometric Test - Production Workflow Simulation
 * This script tests the complete enrollment and verification workflow
 * as it would happen in a real gym environment
 */

const http = require('http');

class RealHardwareTest {
    constructor() {
        this.agentUrl = 'http://localhost:5001';
        this.serverUrl = 'http://localhost:5000';
        this.testMembers = [
            { id: 'member_001', name: 'John Doe', type: 'member' },
            { id: 'member_002', name: 'Jane Smith', type: 'member' },
            { id: 'trainer_001', name: 'Mike Wilson', type: 'trainer' }
        ];
        this.gymId = 'gym_production_001';
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
                        resolve({
                            status: res.statusCode,
                            data: JSON.parse(body),
                            success: res.statusCode >= 200 && res.statusCode < 300
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: body,
                            success: false,
                            error: 'Invalid JSON'
                        });
                    }
                });
            });

            req.on('error', (err) => {
                resolve({ status: 0, success: false, error: err.message });
            });

            if (data) req.write(JSON.stringify(data));
            req.end();
        });
    }

    async runProductionWorkflow() {
        console.log('🏭 Real Hardware Biometric Test - Production Workflow');
        console.log('='.repeat(60));

        // Step 1: Verify system health
        await this.checkSystemHealth();
        
        // Step 2: Detect available devices
        const devices = await this.getAvailableDevices();
        
        // Step 3: Test enrollment workflow for each member
        for (const member of this.testMembers) {
            await this.testMemberEnrollment(member, devices);
        }
        
        // Step 4: Test verification/attendance workflow
        for (const member of this.testMembers) {
            await this.testAttendanceMarking(member, devices);
        }
        
        // Step 5: Performance testing
        await this.performanceTest();
        
        console.log('\n✅ Production workflow testing completed!');
    }

    async checkSystemHealth() {
        console.log('\n🩺 System Health Check...');
        
        const health = await this.makeRequest(`${this.agentUrl}/health`);
        if (health.success) {
            console.log(`✅ Biometric Agent: Healthy (${health.data.uptime.toFixed(1)}s uptime)`);
            console.log(`   Memory: ${health.data.memory.rss}, Devices: ${health.data.hardware.total}`);
        } else {
            console.log('❌ Biometric Agent: Not responding');
            return false;
        }

        const server = await this.makeRequest(`${this.serverUrl}/test-route`);
        if (server.success) {
            console.log('✅ Main Server: Responding');
        } else {
            console.log('❌ Main Server: Not responding');
            return false;
        }

        return true;
    }

    async getAvailableDevices() {
        console.log('\n🔍 Device Detection...');
        
        const result = await this.makeRequest(`${this.agentUrl}/api/devices`);
        if (result.success) {
            const devices = result.data.devices;
            const fingerprint = devices.filter(d => d.type === 'fingerprint');
            const cameras = devices.filter(d => d.type === 'camera');
            
            console.log(`📊 Devices Found: ${devices.length} total`);
            console.log(`   🖐️ Fingerprint scanners: ${fingerprint.length}`);
            console.log(`   📷 Cameras: ${cameras.length}`);
            
            devices.forEach(device => {
                console.log(`   - ${device.name} (${device.id}) - ${device.status}`);
            });
            
            return devices;
        } else {
            console.log('❌ Failed to get devices');
            return [];
        }
    }

    async testMemberEnrollment(member, devices) {
        console.log(`\n👤 Enrolling ${member.name} (${member.type})...`);
        
        // Test face enrollment if camera available
        const cameras = devices.filter(d => d.type === 'camera');
        if (cameras.length > 0) {
            const camera = cameras[0];
            console.log(`   📷 Face enrollment using ${camera.name}...`);
            
            const faceResult = await this.makeRequest(
                `${this.agentUrl}/api/face/enroll`,
                'POST',
                {
                    personId: member.id,
                    personType: member.type,
                    gymId: this.gymId,
                    deviceId: camera.id
                }
            );
            
            if (faceResult.success) {
                console.log(`   ✅ Face enrolled - Quality: ${faceResult.data.quality}%, Liveness: ${faceResult.data.livenessScore}%`);
                console.log(`   📋 Template ID: ${faceResult.data.templateId}`);
            } else {
                console.log(`   ❌ Face enrollment failed: ${faceResult.data?.error || 'Unknown error'}`);
            }
        }
        
        // Test fingerprint enrollment if scanner available
        const fingerprints = devices.filter(d => d.type === 'fingerprint');
        if (fingerprints.length > 0) {
            const scanner = fingerprints[0];
            console.log(`   🖐️ Fingerprint enrollment using ${scanner.name}...`);
            
            const fpResult = await this.makeRequest(
                `${this.agentUrl}/api/fingerprint/enroll`,
                'POST',
                {
                    personId: member.id,
                    personType: member.type,
                    gymId: this.gymId,
                    deviceId: scanner.id
                }
            );
            
            if (fpResult.success) {
                console.log(`   ✅ Fingerprint enrolled - Quality: ${fpResult.data.quality}%`);
                console.log(`   📋 Template ID: ${fpResult.data.templateId}`);
            } else {
                console.log(`   ❌ Fingerprint enrollment failed: ${fpResult.data?.error || 'Unknown error'}`);
            }
        } else {
            console.log('   ⏭️ No fingerprint scanner available - skipping fingerprint enrollment');
        }
    }

    async testAttendanceMarking(member, devices) {
        console.log(`\n🕐 Attendance verification for ${member.name}...`);
        
        // Test face verification
        const cameras = devices.filter(d => d.type === 'camera');
        if (cameras.length > 0) {
            const camera = cameras[0];
            console.log(`   📷 Face verification using ${camera.name}...`);
            
            const faceResult = await this.makeRequest(
                `${this.agentUrl}/api/face/verify`,
                'POST',
                {
                    personId: member.id,
                    gymId: this.gymId,
                    deviceId: camera.id
                }
            );
            
            if (faceResult.success) {
                const status = faceResult.data.verified ? 'VERIFIED ✅' : 'REJECTED ❌';
                console.log(`   ${status} - Confidence: ${(faceResult.data.confidence * 100).toFixed(1)}%`);
                if (faceResult.data.livenessScore) {
                    console.log(`   🧬 Liveness Score: ${(faceResult.data.livenessScore * 100).toFixed(1)}%`);
                }
            } else {
                console.log(`   ❌ Face verification failed: ${faceResult.data?.error || 'Unknown error'}`);
            }
        }
        
        // Test fingerprint verification
        const fingerprints = devices.filter(d => d.type === 'fingerprint');
        if (fingerprints.length > 0) {
            const scanner = fingerprints[0];
            console.log(`   🖐️ Fingerprint verification using ${scanner.name}...`);
            
            const fpResult = await this.makeRequest(
                `${this.agentUrl}/api/fingerprint/verify`,
                'POST',
                {
                    personId: member.id,
                    gymId: this.gymId,
                    deviceId: scanner.id
                }
            );
            
            if (fpResult.success) {
                const status = fpResult.data.verified ? 'VERIFIED ✅' : 'REJECTED ❌';
                console.log(`   ${status} - Confidence: ${(fpResult.data.confidence * 100).toFixed(1)}%`);
            } else {
                console.log(`   ❌ Fingerprint verification failed: ${fpResult.data?.error || 'Unknown error'}`);
            }
        }
    }

    async performanceTest() {
        console.log('\n⚡ Performance Testing...');
        
        const tests = [];
        console.log('   Running 10 health check requests...');
        
        for (let i = 0; i < 10; i++) {
            const start = Date.now();
            const result = await this.makeRequest(`${this.agentUrl}/health`);
            const duration = Date.now() - start;
            
            if (result.success) {
                tests.push(duration);
                process.stdout.write('.');
            } else {
                process.stdout.write('X');
            }
        }
        
        console.log('\n');
        
        if (tests.length > 0) {
            const avg = tests.reduce((a, b) => a + b, 0) / tests.length;
            const min = Math.min(...tests);
            const max = Math.max(...tests);
            
            console.log(`   📊 Results: ${tests.length}/10 successful`);
            console.log(`   ⏱️ Average: ${avg.toFixed(1)}ms`);
            console.log(`   ⚡ Fastest: ${min}ms`);
            console.log(`   🐌 Slowest: ${max}ms`);
            
            if (avg < 50) {
                console.log('   ✅ Performance: Excellent');
            } else if (avg < 100) {
                console.log('   ✅ Performance: Good');
            } else if (avg < 200) {
                console.log('   ⚠️ Performance: Acceptable');
            } else {
                console.log('   ❌ Performance: Poor - needs optimization');
            }
        } else {
            console.log('   ❌ All performance tests failed');
        }
    }
}

// Run the test
if (require.main === module) {
    const tester = new RealHardwareTest();
    tester.runProductionWorkflow().catch(console.error);
}

module.exports = RealHardwareTest;
