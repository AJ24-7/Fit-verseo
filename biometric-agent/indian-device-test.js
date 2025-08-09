#!/usr/bin/env node

/**
 * Indian Fingerprint Device Test Suite
 * Specifically tests common Indian fingerprint scanners
 */

const http = require('http');

class IndianFingerprintTest {
    constructor() {
        this.agentUrl = 'http://localhost:5001';
        this.serverUrl = 'http://localhost:5000';
        this.indianDevices = [
            'Mantra MFS100',
            'Mantra MFS110', 
            'Bio-Max NB-2020-U',
            'MX Biometric MX100',
            'Time Dynamo FM220U',
            'Startek FM220U Plus',
            'Evolute Columbo',
            'Precision PB510'
        ];
        this.testMembers = [
            { id: 'member_india_001', name: 'Rahul Sharma', phone: '9876543210' },
            { id: 'member_india_002', name: 'Priya Patel', phone: '9876543211' },
            { id: 'member_india_003', name: 'Amit Singh', phone: '9876543212' }
        ];
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

    async runIndianDeviceTest() {
        console.log('🇮🇳 Indian Fingerprint Device Test Suite');
        console.log('='.repeat(50));

        // Check system health
        await this.checkSystemHealth();
        
        // Detect devices
        const devices = await this.detectIndianDevices();
        
        // Test enrollment with detected devices
        if (devices.length > 0) {
            await this.testEnrollmentFlow(devices);
            await this.testAttendanceFlow(devices);
        } else {
            console.log('⚠️ No Indian fingerprint devices detected');
            console.log('📝 Connect one of these supported devices:');
            this.indianDevices.forEach(device => {
                console.log(`   - ${device}`);
            });
        }

        console.log('\n✅ Indian device testing completed!');
    }

    async checkSystemHealth() {
        console.log('\n🩺 System Health Check...');
        
        const health = await this.makeRequest(`${this.agentUrl}/health`);
        if (health.success) {
            console.log(`✅ Biometric Agent: Running (${health.data.hardware.total} devices)`);
        } else {
            console.log('❌ Biometric Agent: Not responding');
        }
    }

    async detectIndianDevices() {
        console.log('\n🔍 Detecting Indian Fingerprint Devices...');
        
        const result = await this.makeRequest(`${this.agentUrl}/api/devices`);
        if (result.success) {
            const devices = result.data.devices || [];
            const fingerprintDevices = devices.filter(d => d.type === 'fingerprint');
            
            console.log(`📊 Total Devices: ${devices.length}`);
            console.log(`🖐️ Fingerprint Scanners: ${fingerprintDevices.length}`);
            
            fingerprintDevices.forEach(device => {
                const isIndian = this.isIndianDevice(device.name);
                const flag = isIndian ? '🇮🇳' : '🌍';
                console.log(`   ${flag} ${device.name} (${device.id}) - ${device.status}`);
            });
            
            return fingerprintDevices;
        } else {
            console.log('❌ Failed to detect devices');
            return [];
        }
    }

    isIndianDevice(deviceName) {
        const name = deviceName.toLowerCase();
        return this.indianDevices.some(device => 
            name.includes(device.toLowerCase().split(' ')[0])
        );
    }

    async testEnrollmentFlow(devices) {
        console.log('\n👥 Testing Member Enrollment...');
        
        for (const member of this.testMembers) {
            console.log(`\n   👤 Enrolling ${member.name}...`);
            
            // Test with first available fingerprint device
            const device = devices[0];
            
            const enrollResult = await this.makeRequest(
                `${this.agentUrl}/api/fingerprint/enroll`,
                'POST',
                {
                    personId: member.id,
                    personType: 'member',
                    gymId: 'gym_india_001',
                    deviceId: device.id
                }
            );
            
            if (enrollResult.success) {
                console.log(`   ✅ Enrolled - Quality: ${enrollResult.data.quality}%`);
                console.log(`   📋 Template: ${enrollResult.data.templateId}`);
            } else {
                console.log(`   ❌ Enrollment failed: ${enrollResult.data?.error || 'Unknown error'}`);
            }
        }
    }

    async testAttendanceFlow(devices) {
        console.log('\n🕐 Testing Attendance Verification...');
        
        for (const member of this.testMembers) {
            console.log(`\n   🔍 Verifying ${member.name}...`);
            
            const device = devices[0];
            
            const verifyResult = await this.makeRequest(
                `${this.agentUrl}/api/fingerprint/verify`,
                'POST',
                {
                    personId: member.id,
                    gymId: 'gym_india_001',
                    deviceId: device.id
                }
            );
            
            if (verifyResult.success) {
                const status = verifyResult.data.verified ? '✅ VERIFIED' : '❌ REJECTED';
                const confidence = (verifyResult.data.confidence * 100).toFixed(1);
                console.log(`   ${status} - Confidence: ${confidence}%`);
                
                if (verifyResult.data.verified) {
                    console.log(`   📝 Attendance marked for ${member.name}`);
                }
            } else {
                console.log(`   ❌ Verification failed: ${verifyResult.data?.error || 'Unknown error'}`);
            }
        }
    }
}

// Device-specific connection guides
const deviceGuides = {
    'Mantra': {
        models: ['MFS100', 'MFS110', 'MFS500'],
        driverUrl: 'https://www.mantratec.com/downloads',
        installation: [
            '1. Download Mantra RD Service',
            '2. Install the RD Service application',
            '3. Connect device via USB',
            '4. Device will auto-register'
        ],
        notes: 'Most popular in India for Aadhaar authentication'
    },
    'Bio-Max': {
        models: ['NB-2020-U', 'NB-1010-U'],
        driverUrl: 'https://www.nexbio.com/downloads',
        installation: [
            '1. Install Bio-Max device drivers',
            '2. Connect via USB',
            '3. Configure in Device Manager if needed'
        ],
        notes: 'Good quality sensors, reliable performance'
    },
    'Time Dynamo': {
        models: ['FM220U', 'FM100'],
        driverUrl: 'https://www.timedynamo.com/support',
        installation: [
            '1. Download Time Dynamo drivers',
            '2. Run as administrator',
            '3. Connect device',
            '4. Test in Device Manager'
        ],
        notes: 'Popular for attendance systems'
    }
};

console.log('\n📚 DEVICE CONNECTION GUIDES');
console.log('='.repeat(30));

Object.entries(deviceGuides).forEach(([brand, guide]) => {
    console.log(`\n🔧 ${brand}`);
    console.log(`Models: ${guide.models.join(', ')}`);
    console.log(`Download: ${guide.driverUrl}`);
    console.log('Installation:');
    guide.installation.forEach(step => console.log(`   ${step}`));
    console.log(`💡 Note: ${guide.notes}`);
});

// Run the test
if (require.main === module) {
    const tester = new IndianFingerprintTest();
    tester.runIndianDeviceTest().catch(console.error);
}

module.exports = IndianFingerprintTest;
