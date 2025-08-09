// Simple test script for Enhanced Biometric Agent
const axios = require('axios');

const baseUrl = 'http://localhost:5001';

async function testAgent() {
    console.log('🧪 Testing Enhanced Biometric Agent...\n');
    
    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await axios.get(`${baseUrl}/health`);
        console.log('✅ Health check:', healthResponse.data.status);
        console.log(`   Uptime: ${healthResponse.data.uptime} seconds`);
        console.log(`   Devices: ${healthResponse.data.hardware.total}`);
        
        // Test devices endpoint
        console.log('\n2. Testing devices endpoint...');
        const devicesResponse = await axios.get(`${baseUrl}/api/devices`);
        console.log('✅ Devices found:', devicesResponse.data.devices.length);
        devicesResponse.data.devices.forEach(device => {
            console.log(`   - ${device.name} (${device.type})`);
        });
        
        // Test fingerprint enrollment
        console.log('\n3. Testing fingerprint enrollment...');
        const enrollData = {
            personId: 'TEST_MEMBER_001',
            personType: 'member',
            gymId: 'TEST_GYM_001'
        };
        
        const enrollResponse = await axios.post(`${baseUrl}/api/fingerprint/enroll`, enrollData);
        console.log('✅ Fingerprint enrollment successful');
        console.log(`   Template ID: ${enrollResponse.data.templateId}`);
        console.log(`   Quality: ${enrollResponse.data.quality}%`);
        
        // Test fingerprint verification
        console.log('\n4. Testing fingerprint verification...');
        const verifyData = {
            personId: 'TEST_MEMBER_001',
            gymId: 'TEST_GYM_001'
        };
        
        const verifyResponse = await axios.post(`${baseUrl}/api/fingerprint/verify`, verifyData);
        console.log('✅ Fingerprint verification completed');
        console.log(`   Verified: ${verifyResponse.data.verified}`);
        console.log(`   Confidence: ${(verifyResponse.data.confidence * 100).toFixed(1)}%`);
        
        // Test legacy endpoints
        console.log('\n5. Testing legacy enrollment...');
        const legacyEnrollData = {
            memberId: 'LEGACY_TEST_001',
            memberName: 'Legacy Test Member',
            gymId: 'TEST_GYM_001'
        };
        
        const legacyResponse = await axios.post(`${baseUrl}/enroll`, legacyEnrollData);
        console.log('✅ Legacy enrollment successful');
        console.log(`   Enrollment ID: ${legacyResponse.data.enrollmentId}`);
        
        console.log('\n🎉 All tests passed! Enhanced Biometric Agent is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
}

testAgent();
