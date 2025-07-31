const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const serviceName = 'FitverseAgent';
const serviceDisplayName = 'Fitverse Biometric Agent';
const agentPath = path.join(__dirname, 'standalone-agent.js');

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function createServiceScript() {
    const serviceScript = `
@echo off
title ${serviceDisplayName}
cd /d "${__dirname}"
:RESTART
node "${agentPath}"
if %errorlevel% neq 0 (
    echo Service crashed, restarting in 5 seconds...
    timeout /t 5 /nobreak >nul
    goto RESTART
)
`.trim();

    const scriptPath = path.join(__dirname, 'service-runner.bat');
    fs.writeFileSync(scriptPath, serviceScript);
    return scriptPath;
}

function installService() {
    log('Creating Windows service...');
    
    const scriptPath = createServiceScript();
    
    // Create service using sc command
    const createCmd = `sc create "${serviceName}" binPath= "cmd /c \\"${scriptPath}\\"" start= auto displayName= "${serviceDisplayName}" type= own`;
    
    exec(createCmd, (error, stdout, stderr) => {
        if (error) {
            if (error.message.includes('already exists')) {
                log('Service already exists, updating...');
                updateService();
            } else {
                log(`Error creating service: ${error.message}`);
            }
            return;
        }
        
        log('Service created successfully');
        
        // Configure service recovery
        const recoveryCmd = `sc failure "${serviceName}" reset= 60 actions= restart/5000/restart/10000/restart/30000`;
        exec(recoveryCmd, () => {
            log('Service recovery configured');
            startService();
        });
    });
}

function updateService() {
    log('Updating existing service...');
    
    // Stop service first
    exec(`sc stop "${serviceName}"`, () => {
        setTimeout(() => {
            // Delete and recreate
            exec(`sc delete "${serviceName}"`, () => {
                setTimeout(() => {
                    installService();
                }, 2000);
            });
        }, 3000);
    });
}

function startService() {
    log('Starting service...');
    
    exec(`sc start "${serviceName}"`, (error, stdout, stderr) => {
        if (error) {
            log(`Error starting service: ${error.message}`);
            log('Trying direct start...');
            startDirect();
        } else {
            log('Service started successfully');
            testService();
        }
    });
}

function startDirect() {
    log('Starting agent directly...');
    
    const agentProcess = spawn('node', [agentPath], {
        detached: true,
        stdio: 'ignore'
    });
    
    agentProcess.unref();
    
    setTimeout(() => {
        testService();
    }, 3000);
}

function testService() {
    log('Testing service...');
    
    const http = require('http');
    const req = http.get('http://localhost:5001/health', (res) => {
        if (res.statusCode === 200) {
            log('✅ Service is running and responding!');
            log('🌐 Agent available at: http://localhost:5001');
        } else {
            log('⚠️ Service running but not responding correctly');
        }
    });
    
    req.on('error', (err) => {
        log('❌ Service test failed, trying again in 10 seconds...');
        setTimeout(testService, 10000);
    });
    
    req.setTimeout(5000, () => {
        req.destroy();
        log('❌ Service test timeout');
    });
}

function uninstallService() {
    log('Stopping and removing service...');
    
    exec(`sc stop "${serviceName}"`, () => {
        setTimeout(() => {
            exec(`sc delete "${serviceName}"`, (error) => {
                if (error) {
                    log(`Error removing service: ${error.message}`);
                } else {
                    log('Service removed successfully');
                }
            });
        }, 2000);
    });
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'install':
        installService();
        break;
    case 'uninstall':
        uninstallService();
        break;
    case 'start':
        startService();
        break;
    case 'test':
        testService();
        break;
    default:
        console.log('Usage: node service-manager.js [install|uninstall|start|test]');
        console.log('');
        console.log('Commands:');
        console.log('  install   - Install and start the service');
        console.log('  uninstall - Stop and remove the service');
        console.log('  start     - Start the service');
        console.log('  test      - Test if service is responding');
        break;
}
