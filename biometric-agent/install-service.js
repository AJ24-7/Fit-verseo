const { Service } = require('node-windows');
const path = require('path');

// Create a new service object with enhanced configuration
const svc = new Service({
    name: 'Fitverse Biometric Agent',
    description: 'Production-ready biometric device agent for Fitverse gym management system - Auto restarts on failure',
    script: path.join(__dirname, 'simple-agent.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=512', // Reduced memory for lightweight operation
        '--expose-gc'
    ],
    workingDirectory: __dirname,
    allowServiceLogon: true,
    // Enhanced environment variables
    env: {
        NODE_ENV: 'production',
        PORT: '5001',
        SERVICE_MODE: 'true'
    },
    // Service will auto-restart on failure
    restart: {
        delay: 5000,    // 5 seconds
        count: 3        // Max 3 restarts per failure
    }
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', () => {
    console.log('✅ Fitverse Biometric Agent service installed successfully');
    console.log('🚀 Starting service...');
    svc.start();
});

svc.on('start', () => {
    console.log('✅ Fitverse Biometric Agent service started');
    console.log('🌐 Agent running on http://localhost:5001');
});

svc.on('stop', () => {
    console.log('🛑 Fitverse Biometric Agent service stopped');
});

svc.on('uninstall', () => {
    console.log('🗑️ Fitverse Biometric Agent service uninstalled');
});

svc.on('alreadyinstalled', () => {
    console.log('⚠️ Fitverse Biometric Agent service is already installed');
    console.log('🚀 Starting existing service...');
    svc.start();
});

svc.on('invalidinstallation', () => {
    console.log('❌ Invalid installation');
});

svc.on('error', (err) => {
    console.error('❌ Service error:', err);
    if (err.message.includes('Access is denied')) {
        console.error('💡 This usually means you need to run as administrator');
        console.error('💡 Right-click Command Prompt and select "Run as administrator"');
    } else if (err.message.includes('already exists')) {
        console.log('ℹ️ Service already exists, attempting to start...');
        svc.start();
    } else {
        console.error('💡 Try running the startup version: install-startup-agent.bat');
    }
});

// Check command line arguments
const command = process.argv[2];

switch (command) {
    case 'install':
        console.log('📦 Installing Fitverse Biometric Agent as Windows service...');
        svc.install();
        break;
    
    case 'uninstall':
        console.log('🗑️ Uninstalling Fitverse Biometric Agent service...');
        svc.uninstall();
        break;
    
    case 'start':
        console.log('🚀 Starting Fitverse Biometric Agent service...');
        svc.start();
        break;
    
    case 'stop':
        console.log('🛑 Stopping Fitverse Biometric Agent service...');
        svc.stop();
        break;
    
    case 'restart':
        console.log('🔄 Restarting Fitverse Biometric Agent service...');
        svc.restart();
        break;
    
    default:
        console.log('Fitverse Biometric Agent Service Manager');
        console.log('');
        console.log('Usage:');
        console.log('  node install-service.js install   - Install as Windows service');
        console.log('  node install-service.js uninstall - Remove Windows service');
        console.log('  node install-service.js start     - Start the service');
        console.log('  node install-service.js stop      - Stop the service');
        console.log('  node install-service.js restart   - Restart the service');
        break;
}
