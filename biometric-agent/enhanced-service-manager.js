/**
 * Enhanced Service Manager for Fitverse Biometric Agent
 * Provides robust Windows service installation and management
 */

const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

class BiometricServiceManager {
    constructor() {
        this.serviceName = 'FitverseBiometricAgent';
        this.serviceDescription = 'Fitverse Biometric Agent - Enhanced continuous biometric operations service';
        this.scriptPath = path.join(__dirname, 'enhanced-agent.js');
        this.logPath = path.join(__dirname, 'logs');
        this.maxRestarts = 5;
        this.restartDelay = 5000;
        
        this.ensureDirectories();
    }

    ensureDirectories() {
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, { recursive: true });
        }
    }

    createService() {
        return new Service({
            name: this.serviceName,
            description: this.serviceDescription,
            script: this.scriptPath,
            nodeOptions: [
                '--max-old-space-size=512',
                '--expose-gc'
            ],
            env: {
                NODE_ENV: 'production',
                BIOMETRIC_AGENT_MODE: 'service'
            },
            wait: 2,
            grow: 0.5,
            maxrestarts: this.maxRestarts,
            logpath: this.logPath,
            abortOnError: false,
            stopparentfirst: true
        });
    }

    async installService() {
        return new Promise((resolve, reject) => {
            console.log('🔧 Installing Enhanced Biometric Agent Service...');
            
            // Check if script exists
            if (!fs.existsSync(this.scriptPath)) {
                return reject(new Error(`Script not found: ${this.scriptPath}`));
            }

            const svc = this.createService();

            svc.on('install', () => {
                console.log('✅ Service installed successfully!');
                console.log(`📋 Service Name: ${this.serviceName}`);
                console.log(`📝 Description: ${this.serviceDescription}`);
                console.log(`📁 Script: ${this.scriptPath}`);
                console.log(`📊 Logs: ${this.logPath}`);
                
                // Start the service after installation
                setTimeout(() => {
                    svc.start();
                }, 2000);
                
                resolve();
            });

            svc.on('start', () => {
                console.log('🚀 Service started successfully!');
                console.log('🌐 Agent should be accessible at http://localhost:5001');
                console.log('💡 Check service logs for detailed information');
            });

            svc.on('error', (err) => {
                console.error('❌ Service installation error:', err.message);
                reject(err);
            });

            svc.install();
        });
    }

    async uninstallService() {
        return new Promise((resolve, reject) => {
            console.log('🗑️ Uninstalling Biometric Agent Service...');
            
            const svc = this.createService();

            svc.on('uninstall', () => {
                console.log('✅ Service uninstalled successfully!');
                resolve();
            });

            svc.on('error', (err) => {
                console.error('❌ Service uninstallation error:', err.message);
                reject(err);
            });

            svc.uninstall();
        });
    }

    async startService() {
        return new Promise((resolve, reject) => {
            console.log('▶️ Starting Biometric Agent Service...');
            
            exec(`sc start "${this.serviceName}"`, (error, stdout, stderr) => {
                if (error) {
                    if (error.message.includes('already been started')) {
                        console.log('⚠️ Service is already running');
                        return resolve();
                    }
                    console.error('❌ Failed to start service:', error.message);
                    return reject(error);
                }
                
                console.log('✅ Service started successfully!');
                console.log(stdout);
                resolve();
            });
        });
    }

    async stopService() {
        return new Promise((resolve, reject) => {
            console.log('⏹️ Stopping Biometric Agent Service...');
            
            exec(`sc stop "${this.serviceName}"`, (error, stdout, stderr) => {
                if (error) {
                    if (error.message.includes('has not been started')) {
                        console.log('⚠️ Service is not running');
                        return resolve();
                    }
                    console.error('❌ Failed to stop service:', error.message);
                    return reject(error);
                }
                
                console.log('✅ Service stopped successfully!');
                console.log(stdout);
                resolve();
            });
        });
    }

    async getServiceStatus() {
        return new Promise((resolve, reject) => {
            exec(`sc query "${this.serviceName}"`, (error, stdout, stderr) => {
                if (error) {
                    console.log('❌ Service not found or error occurred');
                    return resolve({ installed: false, running: false });
                }
                
                const isRunning = stdout.includes('RUNNING');
                const isStopped = stdout.includes('STOPPED');
                const isPaused = stdout.includes('PAUSED');
                
                resolve({
                    installed: true,
                    running: isRunning,
                    stopped: isStopped,
                    paused: isPaused,
                    output: stdout
                });
            });
        });
    }

    async restartService() {
        try {
            await this.stopService();
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            await this.startService();
            console.log('🔄 Service restarted successfully!');
        } catch (error) {
            console.error('❌ Failed to restart service:', error.message);
            throw error;
        }
    }

    async checkDependencies() {
        console.log('🔍 Checking dependencies...');
        
        const checks = {
            nodeJs: false,
            npm: false,
            scriptExists: false,
            adminRights: false
        };

        try {
            // Check Node.js
            await new Promise((resolve, reject) => {
                exec('node --version', (error, stdout) => {
                    if (!error) {
                        checks.nodeJs = true;
                        console.log(`✅ Node.js: ${stdout.trim()}`);
                    } else {
                        console.log('❌ Node.js not found');
                    }
                    resolve();
                });
            });

            // Check npm
            await new Promise((resolve, reject) => {
                exec('npm --version', (error, stdout) => {
                    if (!error) {
                        checks.npm = true;
                        console.log(`✅ npm: ${stdout.trim()}`);
                    } else {
                        console.log('❌ npm not found');
                    }
                    resolve();
                });
            });

            // Check script exists
            if (fs.existsSync(this.scriptPath)) {
                checks.scriptExists = true;
                console.log(`✅ Script exists: ${this.scriptPath}`);
            } else {
                console.log(`❌ Script not found: ${this.scriptPath}`);
            }

            // Check admin rights (simplified check)
            try {
                exec('net session', (error) => {
                    if (!error) {
                        checks.adminRights = true;
                        console.log('✅ Administrator privileges detected');
                    } else {
                        console.log('❌ Administrator privileges required');
                    }
                });
            } catch (err) {
                console.log('⚠️ Could not verify administrator privileges');
            }

        } catch (error) {
            console.error('❌ Dependency check error:', error.message);
        }

        return checks;
    }

    async showServiceInfo() {
        const status = await this.getServiceStatus();
        
        console.log('\n📊 Service Information:');
        console.log('═══════════════════════════════════════');
        console.log(`Name: ${this.serviceName}`);
        console.log(`Description: ${this.serviceDescription}`);
        console.log(`Script: ${this.scriptPath}`);
        console.log(`Logs: ${this.logPath}`);
        console.log(`Installed: ${status.installed ? '✅' : '❌'}`);
        console.log(`Running: ${status.running ? '✅' : '❌'}`);
        
        if (status.running) {
            console.log('🌐 Agent URL: http://localhost:5001');
            console.log('💡 Health Check: http://localhost:5001/health');
        }
        
        console.log('═══════════════════════════════════════\n');
        
        return status;
    }

    async performFullInstallation() {
        console.log('🚀 Starting Enhanced Biometric Agent Installation...\n');
        
        try {
            // Check dependencies
            const deps = await this.checkDependencies();
            
            if (!deps.nodeJs || !deps.npm) {
                throw new Error('Node.js and npm are required for installation');
            }
            
            if (!deps.scriptExists) {
                throw new Error(`Enhanced agent script not found: ${this.scriptPath}`);
            }
            
            // Install npm dependencies
            console.log('\n📦 Installing npm dependencies...');
            await new Promise((resolve, reject) => {
                exec('npm install', { cwd: __dirname }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('❌ npm install failed:', error.message);
                        return reject(error);
                    }
                    console.log('✅ Dependencies installed successfully');
                    resolve();
                });
            });
            
            // Check if service already exists
            const existingStatus = await this.getServiceStatus();
            if (existingStatus.installed) {
                console.log('\n⚠️ Service already exists. Uninstalling first...');
                await this.uninstallService();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Install service
            console.log('\n🔧 Installing Windows service...');
            await this.installService();
            
            // Wait a moment and check status
            await new Promise(resolve => setTimeout(resolve, 5000));
            await this.showServiceInfo();
            
            console.log('🎉 Enhanced Biometric Agent installation completed successfully!');
            console.log('\n📋 Next Steps:');
            console.log('1. The service is now running automatically');
            console.log('2. Visit http://localhost:5001 to test the agent');
            console.log('3. Check http://localhost:5001/health for health status');
            console.log('4. View logs in the logs directory for debugging');
            console.log('5. Use service manager commands to control the service');
            
        } catch (error) {
            console.error('\n❌ Installation failed:', error.message);
            console.log('\n💡 Troubleshooting tips:');
            console.log('1. Ensure you are running as Administrator');
            console.log('2. Check that Node.js and npm are properly installed');
            console.log('3. Verify no other service is using port 5001');
            console.log('4. Check Windows Event Log for service errors');
            throw error;
        }
    }
}

// Command line interface
async function main() {
    const manager = new BiometricServiceManager();
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    try {
        switch (command.toLowerCase()) {
            case 'install':
                await manager.performFullInstallation();
                break;
                
            case 'uninstall':
                await manager.uninstallService();
                break;
                
            case 'start':
                await manager.startService();
                break;
                
            case 'stop':
                await manager.stopService();
                break;
                
            case 'restart':
                await manager.restartService();
                break;
                
            case 'status':
                await manager.showServiceInfo();
                break;
                
            case 'check':
                await manager.checkDependencies();
                break;
                
            case 'help':
            default:
                console.log('🤖 Enhanced Biometric Agent Service Manager');
                console.log('════════════════════════════════════════════');
                console.log('Available commands:');
                console.log('  install  - Full installation of the service');
                console.log('  uninstall- Remove the service');
                console.log('  start    - Start the service');
                console.log('  stop     - Stop the service');
                console.log('  restart  - Restart the service');
                console.log('  status   - Show service status');
                console.log('  check    - Check system dependencies');
                console.log('  help     - Show this help message');
                console.log('');
                console.log('Examples:');
                console.log('  node enhanced-service-manager.js install');
                console.log('  node enhanced-service-manager.js status');
                console.log('  node enhanced-service-manager.js restart');
                break;
        }
    } catch (error) {
        console.error('\n❌ Command failed:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = BiometricServiceManager;
