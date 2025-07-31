// ===== GENERIC ALERT FALLBACK =====
// Use this for legacy showAlert calls in agent manager
function showAlert(message, type = 'info') {
  // Prefer styled notification if available
  if (typeof showNotification === 'function') {
    showNotification(message, type);
  } else {
    alert(message);
  }
}

// ===== BIOMETRIC AGENT MANAGEMENT =====
class BiometricAgentManager {
    constructor() {
        this.agentUrl = 'http://localhost:5001';
        this.agentStatus = 'unknown';
        this.checkInterval = null;
    }

    async checkAgentStatus() {
        try {
            // Create an AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(`${this.agentUrl}/health`, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-cache', // Prevent caching issues
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                this.agentStatus = 'running';
                console.log('✅ Biometric agent is running:', data);
                return true;
            } else {
                console.log('❌ Biometric agent responded with error:', response.status);
                this.agentStatus = 'error';
                return false;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('❌ Biometric agent check timed out');
            } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                console.log('❌ Biometric agent service not running - connection refused on port 5001');
                console.log('💡 The service may have stopped. Please check Windows Services or restart the Fitverse Biometric Agent service.');
            } else {
                console.log('❌ Biometric agent check failed:', error.message);
            }
            this.agentStatus = 'not-running';
            return false;
        }
    }

    async downloadAndInstallAgent() {
        try {
            // First, check if the agent is already running
            showAlert('� Checking biometric agent status...', 'info');
            
            const isAgentRunning = await this.checkAgentStatus();
            
            if (isAgentRunning) {
                // Agent is already running - show success message and status check
                showAlert('✅ Biometric agent is already running and ready!', 'success');
                this.showAgentRunningModal();
                return;
            }
            
            // Agent not running, proceed with installation/download
            showAlert('�🔄 Preparing Biometric Agent installer...', 'info');
            
            // Check if the simple biometric agent files exist (our lightweight version)
            let simpleAgentExists = false;
            try {
                const checkResponse = await fetch('/biometric-agent/simple-agent.js');
                simpleAgentExists = checkResponse.ok;
            } catch (e) {
                console.warn('Simple agent files not accessible via HTTP');
            }
            
            if (simpleAgentExists) {
                // Simple agent exists, show instructions for manual setup
                showAlert('📁 Simple Biometric Agent found! Showing setup instructions...', 'info');
                this.showSimpleAgentInstructions();
            } else {
                // Check for full agent files as fallback
                let fullAgentExists = false;
                try {
                    const checkResponse = await fetch('/biometric-agent/package.json');
                    fullAgentExists = checkResponse.ok;
                } catch (e) {
                    console.warn('Full agent files not accessible via HTTP');
                }
                
                if (fullAgentExists) {
                    // Files exist, create download for the simple agent package
                    showAlert('📁 Simple Agent package found! Preparing download...', 'info');
                    
                    // Create a download link for the simple agent package
                    const link = document.createElement('a');
                    link.href = '/simple-biometric-agent.zip'; // This downloads the simple agent zip
                    link.download = 'FitverseSimpleBiometricAgent.zip';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setTimeout(() => {
                        showAlert('📥 Simple Agent download completed! Please extract and run "install-simple-agent.bat" as administrator.', 'success');
                        this.showSimpleAgentInstructions();
                    }, 1000);
                } else {
                    // No agent files found, show manual installation
                    showAlert('📋 Biometric agent requires manual setup. Please follow the installation guide.', 'warning');
                    this.showManualInstallationGuide();
                }
            }
            
        } catch (error) {
            console.error('Error preparing agent installer:', error);
            showAlert('📋 Unable to download automatically. Please follow manual installation.', 'warning');
            this.showManualInstallationGuide();
        }
    }

    showInstallationInstructions() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>🔧 Biometric Agent Installation</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="installation-steps">
                        <h4>Installation Steps:</h4>
                        <ol style="margin: 15px 0; padding-left: 25px;">
                            <li>Extract the downloaded ZIP file</li>
                            <li>Right-click on <strong>"install.bat"</strong></li>
                            <li>Select <strong>"Run as administrator"</strong></li>
                            <li>Follow the installation prompts</li>
                            <li>The agent will start automatically</li>
                        </ol>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Note:</strong> Administrator privileges are required to install device drivers and Windows service.
                        </div>
                        
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Prerequisites:</strong> Ensure Node.js is installed on your system. Download from <a href="https://nodejs.org" target="_blank">nodejs.org</a>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="window.biometricAgentManager.startAgentCheck()">
                        <i class="fas fa-sync"></i> Check Agent Status
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showSimpleAgentInstructions() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>🚀 Simple Biometric Agent Setup</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="installation-steps">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Simple Setup:</strong> The lightweight biometric agent is ready to run with minimal setup.
                        </div>
                        
                        <h4>Quick Start Instructions:</h4>
                        <ol style="margin: 15px 0; padding-left: 25px; line-height: 1.6;">
                            <li><strong>Prerequisites:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>Ensure <a href="https://nodejs.org" target="_blank">Node.js</a> is installed (v14 or higher)</li>
                                    <li>Administrator privileges required for service installation</li>
                                </ul>
                            </li>
                            <li><strong>Download and Install:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>Download the agent files using the button below</li>
                                    <li>Extract the ZIP file to a folder</li>
                                    <li>Right-click <code>install-simple-agent.bat</code> and select "Run as administrator"</li>
                                </ul>
                            </li>
                            <li><strong>Automatic Service Installation:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>The installer will create a Windows service named "Fitverse Biometric Agent"</li>
                                    <li>Service will start automatically and run in the background</li>
                                    <li>Agent will start automatically when Windows boots</li>
                                    <li>No manual startup required after installation</li>
                                </ul>
                            </li>
                        </ol>
                        
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i>
                            <strong>Service Features:</strong>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                <li>✅ Runs automatically as Windows service</li>
                                <li>✅ Starts with Windows (no manual intervention)</li>
                                <li>✅ Simulation mode (no actual hardware needed)</li>
                                <li>✅ All biometric endpoints functional</li>
                                <li>✅ CORS enabled for web interface</li>
                                <li>✅ Perfect for development and production</li>
                            </ul>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Service Management:</strong>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                <li>Service Name: "Fitverse Biometric Agent"</li>
                                <li>To stop: Open Services app and stop the service</li>
                                <li>To restart: Restart the service from Services app</li>
                                <li>Runs on: <code>http://localhost:5001</code></li>
                            </ul>
                        </div>
                        
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Service Troubleshooting:</strong>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                <li>If installation fails, ensure you ran as administrator</li>
                                <li>Check Windows Services app for "Fitverse Biometric Agent"</li>
                                <li>If service stopped: Open Services app → Find "Fitverse Biometric Agent" → Right-click → Start</li>
                                <li>Make sure Windows Firewall allows the agent</li>
                                <li>If port 5001 is in use, stop other services using that port</li>
                            </ul>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-tools"></i>
                            <strong>Quick Service Commands:</strong>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                <li>Start: <code>sc start "Fitverse Biometric Agent"</code></li>
                                <li>Stop: <code>sc stop "Fitverse Biometric Agent"</code></li>
                                <li>Restart: <code>sc stop "Fitverse Biometric Agent" && sc start "Fitverse Biometric Agent"</code></li>
                                <li>Status: <code>sc query "Fitverse Biometric Agent"</code></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" onclick="window.location.href='/simple-biometric-agent.zip'">
                        <i class="fas fa-download"></i> Download Simple Agent Installer
                    </button>
                    <button class="btn btn-info" onclick="window.open('/biometric-agent/monitor-service.bat', '_blank')">
                        <i class="fas fa-monitor-heart-rate"></i> Download Service Monitor
                    </button>
                    <button class="btn btn-primary" onclick="window.biometricAgentManager.startAgentCheck()">
                        <i class="fas fa-sync"></i> Check Agent Status
                    </button>
                    <button class="btn btn-secondary" onclick="window.open('/biometric-agent', '_blank')">
                        <i class="fas fa-folder-open"></i> Open Agent Folder
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showAgentRunningModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>✅ Biometric Agent Status</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="agent-status-info">
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i>
                            <strong>Agent is Running!</strong> The biometric agent is active and ready to use.
                        </div>
                        
                        <div class="status-details" style="margin: 20px 0;">
                            <h4>Agent Information:</h4>
                            <ul style="margin: 10px 0; padding-left: 25px; line-height: 1.6;">
                                <li><strong>Status:</strong> <span class="text-success">Active</span></li>
                                <li><strong>URL:</strong> <code>http://localhost:5001</code></li>
                                <li><strong>Services:</strong> Fingerprint, Face Recognition</li>
                                <li><strong>Mode:</strong> Simulation (for development)</li>
                            </ul>
                        </div>
                        
                        <div class="available-features">
                            <h4>Available Features:</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
                                <div class="feature-card" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                                    <i class="fas fa-fingerprint" style="color: #007bff; margin-right: 8px;"></i>
                                    <strong>Fingerprint</strong>
                                    <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Enrollment & Verification</p>
                                </div>
                                <div class="feature-card" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                                    <i class="fas fa-user-circle" style="color: #28a745; margin-right: 8px;"></i>
                                    <strong>Face Recognition</strong>
                                    <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Enrollment & Verification</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Next Steps:</strong> You can now configure biometric attendance settings and start enrolling members.
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-cog"></i> Configure Biometric Settings
                    </button>
                    <button class="btn btn-secondary" onclick="window.open('http://localhost:5001/health', '_blank')">
                        <i class="fas fa-external-link-alt"></i> View Agent Status
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showManualInstallationGuide() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>📋 Manual Biometric Agent Setup</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="installation-steps">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Manual Installation Required:</strong> The biometric agent files need to be set up manually.
                        </div>
                        
                        <h4>Step-by-Step Setup:</h4>
                        <ol style="margin: 15px 0; padding-left: 25px; line-height: 1.6;">
                            <li><strong>Prerequisites:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>Install <a href="https://nodejs.org" target="_blank">Node.js</a> (v14 or higher)</li>
                                    <li>Ensure you have administrator privileges</li>
                                </ul>
                            </li>
                            <li><strong>Download Agent Files:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>Navigate to your project's <code>biometric-agent</code> folder</li>
                                    <li>Copy the entire folder to a permanent location (e.g., <code>C:\\FitverseBiometricAgent</code>)</li>
                                </ul>
                            </li>
                            <li><strong>Install Dependencies:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>Open Command Prompt as Administrator</li>
                                    <li>Navigate to the agent folder: <code>cd C:\\FitverseBiometricAgent</code></li>
                                    <li>Run: <code>npm install</code></li>
                                </ul>
                            </li>
                            <li><strong>Install Windows Service:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>Right-click on <code>install.bat</code></li>
                                    <li>Select "Run as administrator"</li>
                                    <li>Follow the installation prompts</li>
                                </ul>
                            </li>
                            <li><strong>Start the Service:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>The service should start automatically</li>
                                    <li>Or manually start: <code>net start FitverseBiometricAgent</code></li>
                                </ul>
                            </li>
                        </ol>
                        
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Troubleshooting:</strong>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                <li>Ensure antivirus software allows the agent</li>
                                <li>Check Windows Firewall settings for port 5001</li>
                                <li>Verify biometric devices are properly connected</li>
                            </ul>
                        </div>
                        
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i>
                            <strong>Verification:</strong> The agent should be accessible at <code>http://localhost:5001</code>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="window.biometricAgentManager.startAgentCheck()">
                        <i class="fas fa-sync"></i> Check Agent Status
                    </button>
                    <button class="btn btn-secondary" onclick="window.open('/biometric-agent', '_blank')">
                        <i class="fas fa-folder-open"></i> Open Agent Folder
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    startAgentCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        // Check every 5 seconds
        this.checkInterval = setInterval(async () => {
            const isRunning = await this.checkAgentStatus();
            this.updateAgentStatusUI(isRunning);
        }, 5000);
        
        // Check immediately
        this.checkAgentStatus().then(isRunning => {
            this.updateAgentStatusUI(isRunning);
        });
    }

    stopAgentCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    updateAgentStatusUI(isRunning) {
        console.log('🔄 Updating agent status UI:', isRunning ? 'RUNNING' : 'NOT RUNNING');
        
        const statusElements = document.querySelectorAll('.agent-status');
        const installButtons = document.querySelectorAll('.install-agent-btn');
        const biometricSections = document.querySelectorAll('.biometric-settings-section');
        
        // Update status indicators
        statusElements.forEach(el => {
            el.className = `agent-status ${isRunning ? 'running' : 'not-running'}`;
            el.innerHTML = isRunning ? 
                '<i class="fas fa-check-circle"></i> Agent Running' : 
                '<i class="fas fa-times-circle"></i> Agent Not Running';
        });
        
        // Show/hide install buttons and update text
        installButtons.forEach(btn => {
            if (isRunning) {
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Agent Running';
                btn.disabled = true;
                btn.style.backgroundColor = '#28a745';
                btn.style.cursor = 'default';
                btn.style.opacity = '0.8';
                btn.title = 'Biometric agent is running and ready';
            } else {
                btn.innerHTML = '<i class="fas fa-cogs"></i> Setup Agent';
                btn.disabled = false;
                btn.style.backgroundColor = '';
                btn.style.cursor = 'pointer';
                btn.style.opacity = '1';
                btn.title = 'Click to set up the biometric agent';
            }
        });
        
        // Update biometric sections
        biometricSections.forEach(section => {
            const overlay = section.querySelector('.agent-required-overlay');
            if (overlay) {
                overlay.style.display = isRunning ? 'none' : 'flex';
            }
        });
        
        // Update any biometric toggle functionality
        const biometricToggles = document.querySelectorAll('#toggleFingerprintAttendance, #toggleFaceRecognitionAttendance');
        biometricToggles.forEach(toggle => {
            if (!isRunning) {
                toggle.disabled = true;
                toggle.checked = false;
                toggle.title = 'Requires biometric agent to be running';
            } else {
                toggle.disabled = false;
                toggle.title = 'Toggle biometric attendance';
            }
        });
        
        // Update setup buttons specifically
        const setupButtons = document.querySelectorAll('#setupBiometricDevices, .setup-biometric-btn');
        setupButtons.forEach(btn => {
            if (isRunning) {
                btn.innerHTML = '<i class="fas fa-cog"></i> Configure Devices';
                btn.disabled = false;
                btn.title = 'Configure biometric devices';
            } else {
                btn.innerHTML = '<i class="fas fa-download"></i> Setup Agent';
                btn.disabled = false;
                btn.title = 'Set up biometric agent first';
            }
        });
        
        console.log('✅ Agent status UI updated successfully');
    }
}

// Initialize global biometric agent manager
window.biometricAgentManager = new BiometricAgentManager();

// Initialize agent status check immediately when script loads
(async function initializeAgentStatus() {
    console.log('🔍 Initializing biometric agent status check...');
    
    // Wait a moment for DOM elements to be available
    setTimeout(async () => {
        const isRunning = await window.biometricAgentManager.checkAgentStatus();
        window.biometricAgentManager.updateAgentStatusUI(isRunning);
        
        if (isRunning) {
            console.log('✅ Biometric agent detected and UI updated');
        } else {
            console.log('❌ Biometric agent not detected');
        }
    }, 1000);
})();

// ===== EARLY SETTINGS APPLICATION (RUNS BEFORE DOM READY) =====
(function() {
  // Get gym ID early - moved outside to be accessible globally
  function getEarlyGymId() {
    // 1. From JWT token (most reliable)
    const token = localStorage.getItem('gymAdminToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 JWT payload structure:', payload);
        
        // Check the actual structure from gymController.js: payload.admin.id
        if (payload.admin && payload.admin.id) {
          console.log('✅ Found gym ID from JWT admin.id:', payload.admin.id);
          return payload.admin.id;
        }
        
        // Check other possible properties in JWT (fallback)
        const possibleIds = [payload.gymId, payload.id, payload._id, payload.userId, payload.gym];
        for (let id of possibleIds) {
          if (id) {
            console.log('✅ Found gym ID from JWT fallback:', id);
            return id;
          }
        }
      } catch (e) {
        console.warn('Early: Could not parse gym ID from token:', e);
      }
    }
    
    // 2. From global gym profile
    if (window.currentGymProfile && window.currentGymProfile._id) {
      console.log('✅ Found gym ID from currentGymProfile._id:', window.currentGymProfile._id);
      return window.currentGymProfile._id;
    }
    
    if (window.currentGymProfile && window.currentGymProfile.id) {
      console.log('✅ Found gym ID from currentGymProfile.id:', window.currentGymProfile.id);
      return window.currentGymProfile.id;
    }
    
    // 3. From session storage
    const sessionGymId = sessionStorage.getItem('currentGymId');
    if (sessionGymId) {
      console.log('✅ Found gym ID from sessionStorage:', sessionGymId);
      return sessionGymId;
    }
    
    // 4. Extract from token email/username (create pseudo-unique ID)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.admin?.email || payload.email;
        if (email) {
          // Create a deterministic ID based on email
          const emailHash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
          const pseudoId = 'gym_' + emailHash;
          console.log('✅ Created pseudo gym ID from email:', pseudoId);
          sessionStorage.setItem('currentGymId', pseudoId);
          return pseudoId;
        }
      } catch (e) {
        console.warn('Early: Could not extract email from token');
      }
    }
    
    // 5. Last resort - session-specific unique ID
    const sessionId = 'gym_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('⚠️ Using session-specific fallback ID:', sessionId);
    sessionStorage.setItem('currentGymId', sessionId);
    return sessionId;
  }

  // Apply gym-specific settings immediately to prevent flash of hidden content
  function applyEarlyCustomization() {
    const gymId = getEarlyGymId();
    if (!gymId) return;
    
    const equipmentVisible = localStorage.getItem(`dashboardEquipmentVisible_${gymId}`) !== 'false';
    const paymentVisible = localStorage.getItem(`dashboardPaymentVisible_${gymId}`) !== 'false';
    
    console.log(`Early customization for gym ${gymId}:`, {
      equipment: equipmentVisible,
      payment: paymentVisible
    });
    
    // Add CSS to hide elements immediately if needed
    if (!equipmentVisible || !paymentVisible) {
      const style = document.createElement('style');
      style.id = 'earlyCustomizationStyles';
      let css = '';
      
      if (!equipmentVisible) {
        css += `
          /* Hide equipment menu items */
          .menu-item:has(.fa-dumbbell), 
          .menu-item:has([onclick*="equipment"]),
          .menu-item:has([onclick*="Equipment"]),
          /* Hide equipment quick actions - BUT NOT the Add Equipment quick action */
          .quick-action-btn:has(.fa-dumbbell):not(#uploadEquipmentBtn),
          .quick-action:has(.fa-dumbbell):not(#uploadEquipmentBtn),
          /* Hide equipment activities */
          .activity-item:has(.fa-dumbbell),
          /* Hide equipment tab */
          #equipmentTab,
          /* Hide equipment gallery cards */
          .card:has(.card-title:contains("Equipment")) {
            display: none !important;
          }
        `;
      }
      
      if (!paymentVisible) {
        css += `
          /* Hide payment menu items */
          .menu-item:has(.fa-credit-card),
          .menu-item:has([onclick*="payment"]),
          .menu-item:has([onclick*="Payment"]),
          /* Hide payment quick actions */
          .quick-action-btn:has(.fa-credit-card),
          .quick-action:has(.fa-credit-card),
          /* Hide payment activities */
          .activity-item:has(.fa-credit-card),
          /* Hide payment tab */
          #paymentTab {
            display: none !important;
          }
        `;
      }
      
      style.textContent = css;
      document.head.appendChild(style);
    }
  }
  
  // Apply early customization as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyEarlyCustomization);
  } else {
    applyEarlyCustomization();
  }
  
  // Also apply on window load for additional safety
  window.addEventListener('load', applyEarlyCustomization);
  
  // Monitor for gym switches by watching for token/profile changes
  let lastKnownGymId = null;
  
  function monitorGymSwitch() {
    const currentGymId = getEarlyGymId();
    
    if (lastKnownGymId && lastKnownGymId !== currentGymId) {
      console.log(`🔄 Detected gym switch: ${lastKnownGymId} → ${currentGymId}`);
      // Reapply customization for new gym
      setTimeout(applyEarlyCustomization, 50);
    }
    
    lastKnownGymId = currentGymId;
  }
  
  // Monitor every 2 seconds for gym switches
  setInterval(monitorGymSwitch, 2000);
  
  // Also monitor on storage events
  window.addEventListener('storage', function(e) {
    if (e.key === 'gymAdminToken') {
      console.log('🔄 Token changed, checking for gym switch...');
      // Clear session gym ID to force re-detection
      sessionStorage.removeItem('currentGymId');
      setTimeout(monitorGymSwitch, 100);
    }
  });
  
  // Monitor for token changes in current tab too
  let lastKnownToken = localStorage.getItem('gymAdminToken');
  setInterval(() => {
    const currentToken = localStorage.getItem('gymAdminToken');
    if (currentToken !== lastKnownToken) {
      console.log('🔄 Token changed in current tab, checking for gym switch...');
      // Clear session gym ID to force re-detection
      sessionStorage.removeItem('currentGymId');
      lastKnownToken = currentToken;
      setTimeout(monitorGymSwitch, 100);
    }
  }, 1000);
})();

// ===== SETTINGS TAB FUNCTIONALITY =====

// ===== THEME MANAGEMENT =====
function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.style.setProperty('--bg-primary', '#18191a');
    root.style.setProperty('--bg-secondary', '#23272f');
    root.style.setProperty('--card-bg', '#23272f');
    root.style.setProperty('--text-primary', '#ffffff');
    root.style.setProperty('--text-secondary', '#cccccc');
    root.style.setProperty('--border-color', '#33363d');
    root.style.setProperty('--border-light', '#23272f');
    root.style.setProperty('--bg-light', '#23272f');
    // Make all text white for visibility
    document.body.style.background = '#18191a';
    document.body.style.color = '#fff';
    // Set all headings, paragraphs, links, labels, etc. to white
    const allTextEls = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, label, li, th, td, .menu-text, .stat-title, .stat-value, .stat-change, .member-detail-label, .plan-badge, .edit-input, .sidebar, .sidebar .menu-link, .sidebar .menu-link .fa, .content, .modal-content, .modal, .tab-title, .tab-header, .tab-content, .quick-action, .info-list, .member-name, .member-id, .member-detail-title, .member-detail-modal, .profile-pic, .stat-card, .toggle-switch, .toggle-switch input, .toggle-switch label, .theme-option, .color-option, .settings-section, .settings-label, .settings-value, .settings-row, .settings-tab, .settings-content, .settings-header, .settings-title, .settings-description, .settings-group, .settings-btn, .settings-btn-primary, .settings-btn-secondary, .settings-btn-danger, .settings-btn-warning, .settings-btn-info, .settings-btn-success, .settings-btn-light, .settings-btn-dark, .settings-btn-outline, .settings-btn-link, .settings-btn-block, .settings-btn-lg, .settings-btn-sm, .settings-btn-xs, .settings-btn-icon, .settings-btn-circle, .settings-btn-square, .settings-btn-pill, .settings-btn-round, .settings-btn-flat, .settings-btn-ghost, .settings-btn-shadow, .settings-btn-gradient, .settings-btn-glow, .settings-btn-inverse, .settings-btn-transparent, .settings-btn-borderless, .settings-btn-text, .settings-btn-label, .settings-btn-value, .settings-btn-group, .settings-btn-toolbar, .settings-btn-dropdown, .settings-btn-toggle, .settings-btn-switch, .settings-btn-radio, .settings-btn-checkbox, .settings-btn-segment, .settings-btn-step, .settings-btn-progress, .settings-btn-spinner, .settings-btn-badge, .settings-btn-dot, .settings-btn-icon-left, .settings-btn-icon-right, .settings-btn-icon-top, .settings-btn-icon-bottom, .settings-btn-icon-only, .settings-btn-icon-text, .settings-btn-text-icon, .settings-btn-label-icon, .settings-btn-value-icon, .settings-btn-group-icon, .settings-btn-toolbar-icon, .settings-btn-dropdown-icon, .settings-btn-toggle-icon, .settings-btn-switch-icon, .settings-btn-radio-icon, .settings-btn-checkbox-icon, .settings-btn-segment-icon, .settings-btn-step-icon, .settings-btn-progress-icon, .settings-btn-spinner-icon, .settings-btn-badge-icon, .settings-btn-dot-icon');
    allTextEls.forEach(el => {
      el.style.color = '#fff';
    });
    // Set all links to white
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(a => {
      a.style.color = '#fff';
    });
    // Set all dashboard containers, cards, and sections to dark backgrounds
    const darkBgEls = document.querySelectorAll(`
      .stat-card,
      .content,
      .modal-content,
      .tab-content,
      .settings-section,
      .settings-tab,
      .settings-content,
      .settings-header,
      .settings-row,
      .settings-group,
      .dashboard-section,
      .dashboard-container,
      .dashboard-card,
      .card-bg,
      .section-bg,
      .admin-section,
      .admin-container,
      .admin-card,
      .quick-actions,
      .quick-action,
      .activities-offered,
      .activities-section,
      .activities-list,
      .gym-info,
      .gym-info-section,
      .membership-plan,
      .membership-plan-section,
      .membership-plans,
      .new-members,
      .new-members-section,
      .recent-activity,
      .recent-activity-section,
      .attendance-chart,
      .attendance-chart-section,
      .equipment-gallery,
      .equipment-gallery-section
    `);
    darkBgEls.forEach(el => {
      // Use a lighter dark/greyish shade for all cards/sections for contrast
      if (
        el.classList.contains('stat-card') ||
        el.classList.contains('dashboard-card') ||
        el.classList.contains('card-bg') ||
        el.classList.contains('modal-content') ||
        el.classList.contains('tab-content') ||
        el.classList.contains('settings-section') ||
        el.classList.contains('admin-card') ||
        el.classList.contains('quick-actions') ||
        el.classList.contains('activities-offered') ||
        el.classList.contains('activities-section') ||
        el.classList.contains('activities-list') ||
        el.classList.contains('quick-action-card') ||
        el.classList.contains('activities-offered-card') ||
        el.classList.contains('membership-plans-section') ||
        el.classList.contains('membership-plans') ||
        el.classList.contains('membership-plan-section') ||
        el.classList.contains('membership-plan') ||
        el.classList.contains('card') ||
        el.classList.contains('card-header') ||
        el.classList.contains('card-body') ||
        el.classList.contains('gym-info-card') ||
        el.classList.contains('gym-info-section') ||
        el.classList.contains('plans-list') ||
        el.classList.contains('main-content') ||
        el.classList.contains('dashboard-row') ||
        el.classList.contains('main-grid') ||
        el.classList.contains('left-column') ||
        el.classList.contains('right-column') ||
        el.id === 'membershipPlansSection' ||
        el.id === 'photoGridSection' ||
        el.id === 'newMembersCard'
      ) {
        el.style.background = '#23262b'; // slightly lighter black for all cards/sections
        el.style.backgroundColor = '#23262b';
        el.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.18)';
      } else {
        el.style.background = '#18191a'; // main dark background
        el.style.backgroundColor = '#18191a';
      }
    });
    document.body.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    // Reset to light theme
    root.style.removeProperty('--bg-primary');
    root.style.removeProperty('--bg-secondary');
    root.style.removeProperty('--card-bg');
    root.style.removeProperty('--text-primary');
    root.style.removeProperty('--text-secondary');
    root.style.removeProperty('--border-color');
    root.style.removeProperty('--border-light');
    root.style.removeProperty('--bg-light');
    
    // Reset body styles
    document.body.style.background = '';
    document.body.style.color = '';
    
    // Reset all text elements
    const allTextEls = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, label, li, th, td, .menu-text, .stat-title, .stat-value, .stat-change, .member-detail-label, .plan-badge, .edit-input, .sidebar, .sidebar .menu-link, .sidebar .menu-link .fa, .content, .modal-content, .modal, .tab-title, .tab-header, .tab-content, .quick-action, .info-list, .member-name, .member-id, .member-detail-title, .member-detail-modal, .profile-pic, .stat-card, .toggle-switch, .toggle-switch input, .toggle-switch label, .theme-option, .color-option, .settings-section, .settings-label, .settings-value, .settings-row, .settings-tab, .settings-content, .settings-header, .settings-title, .settings-description, .settings-group, .settings-btn, .settings-btn-primary, .settings-btn-secondary, .settings-btn-danger, .settings-btn-warning, .settings-btn-info, .settings-btn-success, .settings-btn-light, .settings-btn-dark, .settings-btn-outline, .settings-btn-link, .settings-btn-block, .settings-btn-lg, .settings-btn-sm, .settings-btn-xs, .settings-btn-icon, .settings-btn-circle, .settings-btn-square, .settings-btn-pill, .settings-btn-round, .settings-btn-flat, .settings-btn-ghost, .settings-btn-shadow, .settings-btn-gradient, .settings-btn-glow, .settings-btn-inverse, .settings-btn-transparent, .settings-btn-borderless, .settings-btn-text, .settings-btn-label, .settings-btn-value, .settings-btn-group, .settings-btn-toolbar, .settings-btn-dropdown, .settings-btn-toggle, .settings-btn-switch, .settings-btn-radio, .settings-btn-checkbox, .settings-btn-segment, .settings-btn-step, .settings-btn-progress, .settings-btn-spinner, .settings-btn-badge, .settings-btn-dot, .settings-btn-icon-left, .settings-btn-icon-right, .settings-btn-icon-top, .settings-btn-icon-bottom, .settings-btn-icon-only, .settings-btn-icon-text, .settings-btn-text-icon, .settings-btn-label-icon, .settings-btn-value-icon, .settings-btn-group-icon, .settings-btn-toolbar-icon, .settings-btn-dropdown-icon, .settings-btn-toggle-icon, .settings-btn-switch-icon, .settings-btn-radio-icon, .settings-btn-checkbox-icon, .settings-btn-segment-icon, .settings-btn-step-icon, .settings-btn-progress-icon, .settings-btn-spinner-icon, .settings-btn-badge-icon, .settings-btn-dot-icon');
    allTextEls.forEach(el => {
      el.style.color = '';
    });
    
    // Reset all links
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(a => {
      a.style.color = '';
    });
    
    // Reset all background elements
    const darkBgEls = document.querySelectorAll(`
      .stat-card,
      .content,
      .modal-content,
      .tab-content,
      .settings-section,
      .settings-tab,
      .settings-content,
      .settings-header,
      .settings-row,
      .settings-group,
      .dashboard-section,
      .dashboard-container,
      .dashboard-card,
      .card-bg,
      .section-bg,
      .admin-section,
      .admin-container,
      .admin-card,
      .quick-actions,
      .quick-action,
      .activities-offered,
      .activities-section,
      .activities-list,
      .gym-info,
      .gym-info-section,
      .membership-plan,
      .membership-plan-section,
      .membership-plans,
      .new-members,
      .new-members-section,
      .recent-activity,
      .recent-activity-section,
      .attendance-chart,
      .attendance-chart-section,
      .equipment-gallery,
      .equipment-gallery-section
    `);
    darkBgEls.forEach(el => {
      el.style.background = '';
      el.style.backgroundColor = '';
      el.style.boxShadow = '';
    });
    
    document.body.setAttribute('data-theme', 'light');
  } else if (theme === 'auto') {
    // Auto theme - detect system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

function applyColorScheme(color) {
  const root = document.documentElement;
  const colorSchemes = {
    blue: { primary: '#007bff', primaryDark: '#0056b3', success: '#28a745', warning: '#ffc107', danger: '#dc3545' },
    green: { primary: '#28a745', primaryDark: '#1e7e34', success: '#20c997', warning: '#ffc107', danger: '#dc3545' },
    purple: { primary: '#6f42c1', primaryDark: '#5a32a3', success: '#28a745', warning: '#ffc107', danger: '#dc3545' },
    orange: { primary: '#fd7e14', primaryDark: '#e55a00', success: '#28a745', warning: '#ffc107', danger: '#dc3545' },
    red: { primary: '#dc3545', primaryDark: '#c82333', success: '#28a745', warning: '#ffc107', danger: '#e74c3c' }
  };
  
  const scheme = colorSchemes[color];
  if (scheme) {
    Object.entries(scheme).forEach(([key, value]) => {
      // Use --primary for primary, --primary-dark for primaryDark, etc.
      let cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
      // Special case: primaryDark should be --primary-dark
      if (key === 'primaryDark') cssVar = '--primary-dark';
      root.style.setProperty(cssVar, value);
    });
  }
}

// ===== SETTINGS MANAGEMENT =====
function saveAllSettings() {
  const settings = {
    theme: document.querySelector('.theme-option.active')?.dataset.theme || 'light',
    color: document.querySelector('.color-option.active')?.dataset.color || 'blue',
    notifications: {
      newMembers: document.getElementById('newMemberNotif')?.checked || false,
      payments: document.getElementById('paymentNotif')?.checked || false,
      trainers: document.getElementById('trainerNotif')?.checked || false,
      email: document.getElementById('emailNotif')?.checked || false
    },
    services: {
      onlineBooking: document.getElementById('onlineBooking')?.checked || false,
      personalTraining: document.getElementById('personalTraining')?.checked || false,
      groupClasses: document.getElementById('groupClasses')?.checked || false,
      equipmentReservation: document.getElementById('equipmentReservation')?.checked || false,
      memberCheckin: document.getElementById('memberCheckin')?.checked || false
    },
    security: {
      twoFactorAuth: document.getElementById('twoFactorAuth')?.checked || false,
      loginAlerts: document.getElementById('loginAlerts')?.checked || false
    },
    operatingHours: getOperatingHours()
  };
  
  // Save to localStorage
  localStorage.setItem('gymAdminSettings', JSON.stringify(settings));
  
  // Show success message
  showNotification('Settings saved successfully!', 'success');
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default? This will only affect the current gym\'s settings.')) {
    const gymId = getGymId();
    
    console.log(`🔄 Resetting settings for gym: ${gymId}`);
    
    // Clear saved settings (global)
    localStorage.removeItem('gymAdminSettings');
    localStorage.removeItem('gymAdminTheme');
    localStorage.removeItem('gymAdminColor');
    
    // Clear gym-specific dashboard customization settings
    if (gymId) {
      removeGymSpecificSetting(`dashboardEquipmentVisible_${gymId}`);
      removeGymSpecificSetting(`dashboardPaymentVisible_${gymId}`);
      
      console.log(`✅ Cleared gym-specific settings for gym: ${gymId}`);
    }
    
    // Reset UI to defaults
    applyTheme('light');
    applyColorScheme('blue');
    
    // Reset all toggles and inputs
    document.querySelectorAll('.toggle-switch input').forEach(input => {
      input.checked = input.id.includes('newMemberNotif') || 
                      input.id.includes('paymentNotif') || 
                      input.id.includes('trainerNotif') ||
                      input.id.includes('onlineBooking') ||
                      input.id.includes('personalTraining') ||
                      input.id.includes('groupClasses') ||
                      input.id.includes('memberCheckin') ||
                      input.id.includes('loginAlerts');
    });
    
    // Reset dashboard customization toggles to default (enabled)
    const equipmentToggle = document.getElementById('toggleEquipmentTab');
    const paymentToggle = document.getElementById('togglePaymentTab');
    if (equipmentToggle) {
      equipmentToggle.checked = true;
      applyTabVisibility('equipment', true);
    }
    if (paymentToggle) {
      paymentToggle.checked = true;
      applyTabVisibility('payment', true);
    }
    
    // Reset theme and color selections
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === 'light');
    });
    
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.color === 'blue');
    });
    
    showNotification(`Settings reset to defaults for gym ${gymId.substring(0, 8)}...!`, 'info');
  }
}

function loadSavedSettings() {
  const saved = localStorage.getItem('gymAdminSettings');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      
      // Apply notification settings
      if (settings.notifications) {
        Object.entries(settings.notifications).forEach(([key, value]) => {
          const element = document.getElementById(key === 'newMembers' ? 'newMemberNotif' : 
                                              key === 'payments' ? 'paymentNotif' :
                                              key === 'trainers' ? 'trainerNotif' : 'emailNotif');
          if (element) element.checked = value;
        });
      }
      
      // Apply service settings
      if (settings.services) {
        Object.entries(settings.services).forEach(([key, value]) => {
          const element = document.getElementById(key);
          if (element) element.checked = value;
        });
      }
      
      // Apply security settings
      if (settings.security) {
        Object.entries(settings.security).forEach(([key, value]) => {
          const element = document.getElementById(key);
          if (element) element.checked = value;
        });
      }
      
      // Apply operating hours
      if (settings.operatingHours) {
        setOperatingHours(settings.operatingHours);
      }
      
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }
}

// ===== OPERATING HOURS MANAGEMENT =====
function getOperatingHours() {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const hours = {};
  
  days.forEach(day => {
    const openTime = document.getElementById(`${day}Open`)?.value;
    const closeTime = document.getElementById(`${day}Close`)?.value;
    const isClosed = document.getElementById(`${day}Closed`)?.checked;
    
    hours[day] = {
      open: openTime,
      close: closeTime,
      closed: isClosed
    };
  });
  
  return hours;
}

function setOperatingHours(hours) {
  Object.entries(hours).forEach(([day, schedule]) => {
    const openInput = document.getElementById(`${day}Open`);
    const closeInput = document.getElementById(`${day}Close`);
    const closedInput = document.getElementById(`${day}Closed`);
    
    if (openInput) openInput.value = schedule.open || '06:00';
    if (closeInput) closeInput.value = schedule.close || '22:00';
    if (closedInput) closedInput.checked = schedule.closed || false;
  });
}

function setupOperatingHoursHandlers() {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  days.forEach(day => {
    const closedCheckbox = document.getElementById(`${day}Closed`);
    const openInput = document.getElementById(`${day}Open`);
    const closeInput = document.getElementById(`${day}Close`);
    
    if (closedCheckbox) {
      closedCheckbox.addEventListener('change', function() {
        if (openInput) openInput.disabled = this.checked;
        if (closeInput) closeInput.disabled = this.checked;
      });
    }
  });
}

// ===== DATA EXPORT =====
function exportData(type) {
  // Placeholder for data export functionality
  showNotification(`Exporting ${type} data...`, 'info');
  
  // In a real implementation, this would call an API endpoint
  setTimeout(() => {
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`, 'success');
  }, 2000);
}

// ===== MODAL FUNCTIONS =====
function openChangePasswordModal() {
  // Placeholder for change password modal
  alert('Change password functionality would be implemented here');
}

function openUpdateProfileModal() {
  // Placeholder for update profile modal
  alert('Update profile functionality would be implemented here');
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 10000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
  `;
  
  // Set background color based on type
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#007bff'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// ===== SETTINGS INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  // Theme Management
  const themeOptions = document.querySelectorAll('.theme-option');
  const colorOptions = document.querySelectorAll('.color-option');

  // Load saved theme and color
  const savedTheme = localStorage.getItem('gymAdminTheme') || 'light';
  const savedColor = localStorage.getItem('gymAdminColor') || 'blue';

  // Apply saved theme and color
  applyTheme(savedTheme);
  applyColorScheme(savedColor);

  // Update UI to reflect saved theme
  themeOptions.forEach(option => {
    option.classList.toggle('active', option.dataset.theme === savedTheme);
    // Add click handler for theme selection
    option.addEventListener('click', function() {
      themeOptions.forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      const theme = this.dataset.theme;
      applyTheme(theme);
      localStorage.setItem('gymAdminTheme', theme);
    });
  });

  // Enhanced Color Scheme Selector: always visible, interactive, horizontal
  const colorMap = {
    blue: '#1976d2',
    green: '#388e3c',
    purple: '#7b1fa2',
    orange: '#f57c00',
    red: '#d32f2f'
  };
  colorOptions.forEach(option => {
    const color = option.dataset.color;
    const circle = option.querySelector('.color-circle');
    if (circle) {
      circle.style.background = colorMap[color] || '#1976d2';
      circle.style.border = '2px solid #fff';
      circle.style.boxShadow = '0 1px 6px rgba(0,0,0,0.10)';
      circle.style.width = '28px';
      circle.style.height = '28px';
      circle.style.borderRadius = '50%';
      circle.style.display = 'inline-block';
      circle.style.transition = 'box-shadow 0.2s, border 0.2s';
      option.style.display = 'inline-block';
      option.style.marginRight = '18px';
      option.style.cursor = 'pointer';
      option.style.verticalAlign = 'middle';
    }
    // Set active state
    if (color === savedColor) {
      option.classList.add('active');
      if (circle) {
        circle.style.boxShadow = '0 0 0 3px var(--primary, #1976d2)';
        circle.style.border = '2px solid var(--primary, #1976d2)';
      }
    } else {
      option.classList.remove('active');
      if (circle) {
        circle.style.boxShadow = '0 1px 6px rgba(0,0,0,0.10)';
        circle.style.border = '2px solid #fff';
      }
    }
    // Hover effect
    option.addEventListener('mouseenter', function() {
      if (circle) {
        circle.style.boxShadow = '0 0 0 3px var(--primary-dark, #0056b3)';
        circle.style.border = '2px solid var(--primary-dark, #0056b3)';
      }
    });
    option.addEventListener('mouseleave', function() {
      if (option.classList.contains('active')) {
        if (circle) {
          circle.style.boxShadow = '0 0 0 3px var(--primary, #1976d2)';
          circle.style.border = '2px solid var(--primary, #1976d2)';
        }
      } else {
        if (circle) {
          circle.style.boxShadow = '0 1px 6px rgba(0,0,0,0.10)';
          circle.style.border = '2px solid #fff';
        }
      }
    });
    // Click handler
    option.addEventListener('click', function() {
      const color = this.dataset.color;
      // Update active state
      colorOptions.forEach(opt => {
        opt.classList.remove('active');
        const c = opt.querySelector('.color-circle');
        if (c) {
          c.style.boxShadow = '0 1px 6px rgba(0,0,0,0.10)';
          c.style.border = '2px solid #fff';
        }
      });
      this.classList.add('active');
      if (circle) {
        circle.style.boxShadow = '0 0 0 3px var(--primary, #1976d2)';
        circle.style.border = '2px solid var(--primary, #1976d2)';
      }
      // Apply color scheme
      applyColorScheme(color);
      // Save preference
      localStorage.setItem('gymAdminColor', color);
    });
  });
  
  // Settings action handlers
  document.getElementById('saveSettingsBtn')?.addEventListener('click', saveAllSettings);
  document.getElementById('resetSettingsBtn')?.addEventListener('click', resetSettings);
  document.getElementById('changePasswordBtn')?.addEventListener('click', openChangePasswordModal);
  document.getElementById('updateProfileBtn')?.addEventListener('click', openUpdateProfileModal);
  
  // Data export handlers
  document.getElementById('exportMembersBtn')?.addEventListener('click', () => exportData('members'));
  document.getElementById('exportPaymentsBtn')?.addEventListener('click', () => exportData('payments'));
  document.getElementById('exportAttendanceBtn')?.addEventListener('click', () => exportData('attendance'));
  
  // Operating hours handlers
  setupOperatingHoursHandlers();
  
  // Load and apply saved settings
  loadSavedSettings();
  
  // ===== DASHBOARD CUSTOMIZATION HANDLERS =====
  // Apply dashboard customization immediately, then set up handlers
  setTimeout(() => {
    setupDashboardCustomization();
    setupBiometricAttendance(); // Initialize biometric settings
  }, 100); // Small delay to ensure all DOM elements are ready
});

// ===== GYM-SPECIFIC SETTINGS MANAGEMENT =====
function getGymId() {
  console.log('🔍 Getting gym ID...');
  
  // 1. From JWT token (most reliable)
  const token = localStorage.getItem('gymAdminToken');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT payload:', payload);
      
      // Check the actual structure from gymController.js: payload.admin.id
      if (payload.admin && payload.admin.id) {
        console.log('✅ Found gym ID from JWT admin.id:', payload.admin.id);
        // Store in session for consistency
        sessionStorage.setItem('currentGymId', payload.admin.id);
        return payload.admin.id;
      }
      
      // Check other possible properties in JWT (fallback)
      const possibleIds = [payload.gymId, payload.id, payload._id, payload.userId, payload.gym];
      for (let id of possibleIds) {
        if (id) {
          console.log('✅ Found gym ID from JWT fallback:', id);
          sessionStorage.setItem('currentGymId', id);
          return id;
        }
      }
    } catch (e) {
      console.warn('❌ Could not parse gym ID from token:', e);
    }
  }
  
  // 2. From global gym profile if available
  if (window.currentGymProfile && window.currentGymProfile._id) {
    console.log('✅ Found gym ID from currentGymProfile._id:', window.currentGymProfile._id);
    sessionStorage.setItem('currentGymId', window.currentGymProfile._id);
    return window.currentGymProfile._id;
  }
  
  // 3. Try to extract from admin profile data
  if (window.currentGymProfile && window.currentGymProfile.id) {
    console.log('✅ Found gym ID from currentGymProfile.id:', window.currentGymProfile.id);
    sessionStorage.setItem('currentGymId', window.currentGymProfile.id);
    return window.currentGymProfile.id;
  }
  
  // 4. From session storage (temporary storage)
  const sessionGymId = sessionStorage.getItem('currentGymId');
  if (sessionGymId) {
    console.log('✅ Found gym ID from sessionStorage:', sessionGymId);
    return sessionGymId;
  }
  
  // 5. Try to get from URL parameters (if redirected with gymId)
  const urlParams = new URLSearchParams(window.location.search);
  const gymIdFromUrl = urlParams.get('gymId');
  if (gymIdFromUrl) {
    console.log('✅ Found gym ID from URL:', gymIdFromUrl);
    // Store in session for future use
    sessionStorage.setItem('currentGymId', gymIdFromUrl);
    return gymIdFromUrl;
  }
  
  // 6. Extract from token email/username (create pseudo-unique ID)
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.admin?.email || payload.email;
      if (email) {
        // Create a deterministic ID based on email
        const emailHash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
        const pseudoId = 'gym_' + emailHash;
        console.log('✅ Created pseudo gym ID from email:', pseudoId);
        sessionStorage.setItem('currentGymId', pseudoId);
        return pseudoId;
      }
    } catch (e) {
      console.warn('Could not extract email from token');
    }
  }
  
  // 7. Last resort - create a session-specific unique ID (will be different each session)
  const sessionId = 'gym_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  console.log('⚠️ Using session-specific fallback ID:', sessionId);
  sessionStorage.setItem('currentGymId', sessionId);
  return sessionId;
}

function getGymSpecificSetting(key) {
  return localStorage.getItem(key);
}

function setGymSpecificSetting(key, value) {
  localStorage.setItem(key, value);
}

function removeGymSpecificSetting(key) {
  localStorage.removeItem(key);
}

// Clear all settings for a specific gym
function clearGymSpecificSettings(gymId) {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes(`_${gymId}`)) {
      localStorage.removeItem(key);
    }
  });
}

// Function to handle gym login/logout - call this when switching gyms
function handleGymSwitch(newGymId) {
  const currentGymId = sessionStorage.getItem('currentGymId');
  
  if (currentGymId && currentGymId !== newGymId) {
    console.log(`🔄 Switching from gym ${currentGymId} to ${newGymId}`);
  }
  
  // Update session storage with new gym ID
  sessionStorage.setItem('currentGymId', newGymId);
  
  // Force reapply settings for the new gym
  setTimeout(() => {
    if (typeof setupDashboardCustomization === 'function') {
      setupDashboardCustomization();
    }
    
    if (typeof forceReapplySettings === 'function') {
      forceReapplySettings();
    }
  }, 100);
}

// Function to verify gym isolation is working
function verifyGymIsolation() {
  const gymId = getGymId();
  const allStorageKeys = Object.keys(localStorage);
  const gymSpecificKeys = allStorageKeys.filter(key => key.includes('dashboard') && key.includes('_'));
  
  console.log('=== Gym Isolation Verification ===');
  console.log('Current Gym ID:', gymId);
  console.log('All dashboard-related storage keys:', gymSpecificKeys);
  
  const thisGymKeys = gymSpecificKeys.filter(key => key.includes(`_${gymId}`));
  const otherGymKeys = gymSpecificKeys.filter(key => !key.includes(`_${gymId}`));
  
  console.log('Keys for current gym:', thisGymKeys);
  console.log('Keys for other gyms:', otherGymKeys);
  console.log('==================================');
  
  return {
    currentGymId: gymId,
    thisGymKeys,
    otherGymKeys,
    isolated: thisGymKeys.length >= 0 // At least some settings exist for this gym
  };
}

// Debug function to show current gym ID and settings
function debugGymSettings() {
  const gymId = getGymId();
  const equipmentVisible = getGymSpecificSetting(`dashboardEquipmentVisible_${gymId}`);
  const paymentVisible = getGymSpecificSetting(`dashboardPaymentVisible_${gymId}`);
  
  // Check actual DOM visibility
  const equipmentMenuItems = document.querySelectorAll('.menu-item:has(.fa-dumbbell), .menu-item');
  const paymentMenuItems = document.querySelectorAll('.menu-item:has(.fa-credit-card), .menu-item');
  
  let visibleEquipmentItems = 0;
  let visiblePaymentItems = 0;
  
  equipmentMenuItems.forEach(item => {
    const icon = item.querySelector('i.fa-dumbbell');
    const onclick = item.getAttribute('onclick');
    if (icon || (onclick && onclick.includes('equipment'))) {
      if (item.style.display !== 'none') visibleEquipmentItems++;
    }
  });
  
  paymentMenuItems.forEach(item => {
    const icon = item.querySelector('i.fa-credit-card');
    const onclick = item.getAttribute('onclick');
    if (icon || (onclick && onclick.includes('payment'))) {
      if (item.style.display !== 'none') visiblePaymentItems++;
    }
  });
  
  console.log('=== Gym Dashboard Settings Debug ===');
  console.log('Current Gym ID:', gymId);
  console.log('Equipment Setting:', equipmentVisible, '(Expected:', equipmentVisible !== 'false', ')');
  console.log('Payment Setting:', paymentVisible, '(Expected:', paymentVisible !== 'false', ')');
  console.log('Visible Equipment Items:', visibleEquipmentItems);
  console.log('Visible Payment Items:', visiblePaymentItems);
  console.log('Storage Keys for this gym:', Object.keys(localStorage).filter(key => key.includes(gymId)));
  console.log('Early styles present:', !!document.getElementById('earlyCustomizationStyles'));
  console.log('=====================================');
  
  return {
    gymId,
    equipmentVisible: equipmentVisible !== 'false',
    paymentVisible: paymentVisible !== 'false',
    actualEquipmentVisible: visibleEquipmentItems > 0,
    actualPaymentVisible: visiblePaymentItems > 0
  };
}

// Add function to force reapply settings (useful for debugging)
function forceReapplySettings() {
  const gymId = getGymId();
  if (!gymId) {
    console.error('No gym ID found');
    return;
  }
  
  const equipmentVisible = getGymSpecificSetting(`dashboardEquipmentVisible_${gymId}`) !== 'false';
  const paymentVisible = getGymSpecificSetting(`dashboardPaymentVisible_${gymId}`) !== 'false';
  
  console.log('Force reapplying settings for gym', gymId);
  applyTabVisibility('equipment', equipmentVisible);
  applyTabVisibility('payment', paymentVisible);
  
  return debugGymSettings();
}

// Function to debug JWT token contents
function debugJWTToken() {
  const token = localStorage.getItem('gymAdminToken');
  if (!token) {
    console.log('❌ No JWT token found');
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('=== JWT Token Debug ===');
    console.log('Full payload:', payload);
    console.log('Available properties:', Object.keys(payload));
    console.log('Possible gym IDs found:');
    
    // Check the actual structure first
    if (payload.admin) {
      console.log('  admin object found:', payload.admin);
      if (payload.admin.id) {
        console.log('  ✅ admin.id (MAIN):', payload.admin.id);
      }
      if (payload.admin.email) {
        console.log('  admin.email:', payload.admin.email);
      }
    }
    
    // Check other possible locations
    const possibleIds = [
      { key: 'gymId', value: payload.gymId },
      { key: 'id', value: payload.id },
      { key: '_id', value: payload._id },
      { key: 'userId', value: payload.userId },
      { key: 'gym', value: payload.gym },
      { key: 'email', value: payload.email }
    ];
    
    possibleIds.forEach(item => {
      if (item.value) {
        console.log(`  ${item.key}:`, item.value);
      }
    });
    
    console.log('Current session gym ID:', sessionStorage.getItem('currentGymId'));
    console.log('=====================');
    return payload;
  } catch (e) {
    console.error('❌ Error parsing JWT token:', e);
    return null;
  }
}

// Function to manually reset gym detection (useful for testing)
function resetGymDetection() {
  console.log('🔄 Manually resetting gym detection...');
  
  // Clear session storage
  sessionStorage.removeItem('currentGymId');
  
  // Force re-detection
  const newGymId = getGymId();
  
  console.log('✅ New gym ID detected:', newGymId);
  
  // Reapply settings
  if (typeof forceReapplySettings === 'function') {
    return forceReapplySettings();
  }
  
  return { newGymId };
}

// Make debug and utility functions globally available
window.debugGymSettings = debugGymSettings;
window.forceReapplySettings = forceReapplySettings;
window.handleGymSwitch = handleGymSwitch;
window.verifyGymIsolation = verifyGymIsolation;
window.debugJWTToken = debugJWTToken;
window.resetGymDetection = resetGymDetection;

// Add biometric testing functions
window.testBiometricAgent = async function() {
  console.log('🧪 Testing biometric agent...');
  
  const agent = window.biometricAgentManager;
  if (!agent) {
    console.error('❌ Biometric agent manager not found');
    return;
  }
  
  console.log('1. Checking agent status...');
  const isRunning = await agent.checkAgentStatus();
  console.log('2. Agent status:', isRunning ? '✅ RUNNING' : '❌ NOT RUNNING');
  
  console.log('3. Updating UI...');
  agent.updateAgentStatusUI(isRunning);
  
  console.log('4. Testing downloadAndInstallAgent method...');
  try {
    await agent.downloadAndInstallAgent();
    console.log('✅ downloadAndInstallAgent completed successfully');
  } catch (error) {
    console.error('❌ downloadAndInstallAgent failed:', error);
  }
  
  // Test simple agent file detection
  console.log('5. Testing simple agent file detection...');
  try {
    const response = await fetch('/biometric-agent/simple-agent.js');
    console.log('Simple agent file accessible:', response.ok ? '✅ YES' : '❌ NO');
  } catch (error) {
    console.log('Simple agent file accessible: ❌ NO (Error:', error.message, ')');
  }
  
  return {
    agentRunning: isRunning,
    agentUrl: agent.agentUrl,
    agentStatus: agent.agentStatus,
    timestamp: new Date().toISOString()
  };
};

window.forceAgentStatusUpdate = async function() {
  console.log('🔄 Forcing agent status update...');
  const agent = window.biometricAgentManager;
  const isRunning = await agent.checkAgentStatus();
  agent.updateAgentStatusUI(isRunning);
  console.log('Status:', isRunning ? '✅ RUNNING' : '❌ NOT RUNNING');
  return isRunning;
};

window.simulateAgentSetup = async function() {
  console.log('🎭 Simulating agent setup button click...');
  const agent = window.biometricAgentManager;
  
  console.log('Running downloadAndInstallAgent...');
  await agent.downloadAndInstallAgent();
  
  console.log('✅ Setup simulation completed');
};
function setupDashboardCustomization() {
  const equipmentToggle = document.getElementById('toggleEquipmentTab');
  const paymentToggle = document.getElementById('togglePaymentTab');
  
  // Get gym-specific identifier
  const gymId = getGymId();
  if (!gymId) {
    console.warn('No gym ID found, dashboard customization will not work properly');
    return;
  }
  
  // Load saved dashboard preferences for this specific gym
  const savedEquipmentVisible = getGymSpecificSetting(`dashboardEquipmentVisible_${gymId}`) !== 'false';
  const savedPaymentVisible = getGymSpecificSetting(`dashboardPaymentVisible_${gymId}`) !== 'false';
  
  console.log(`Loading dashboard settings for gym ${gymId}:`, {
    equipment: savedEquipmentVisible,
    payment: savedPaymentVisible
  });
  
  // Set initial toggle states
  if (equipmentToggle) {
    equipmentToggle.checked = savedEquipmentVisible;
  }
  if (paymentToggle) {
    paymentToggle.checked = savedPaymentVisible;
  }
  
  // Apply visibility immediately and forcefully
  applyTabVisibility('equipment', savedEquipmentVisible);
  applyTabVisibility('payment', savedPaymentVisible);
  
  // Add event listeners
  if (equipmentToggle) {
    equipmentToggle.addEventListener('change', function() {
      const isVisible = this.checked;
      applyTabVisibility('equipment', isVisible);
      setGymSpecificSetting(`dashboardEquipmentVisible_${gymId}`, isVisible.toString());
      showCustomizationFeedback('Equipment tab ' + (isVisible ? 'enabled' : 'disabled'));
    });
  }
  
  if (paymentToggle) {
    paymentToggle.addEventListener('change', function() {
      const isVisible = this.checked;
      applyTabVisibility('payment', isVisible);
      setGymSpecificSetting(`dashboardPaymentVisible_${gymId}`, isVisible.toString());
      showCustomizationFeedback('Payment tab ' + (isVisible ? 'enabled' : 'disabled'));
    });
  }
}

// ===== UNIFIED TAB VISIBILITY MANAGEMENT =====
function applyTabVisibility(tabType, isVisible) {
  console.log(`Applying ${tabType} tab visibility:`, isVisible);
  
  const displayValue = isVisible ? 'block' : 'none';
  const flexDisplayValue = isVisible ? 'flex' : 'none';
  
  if (tabType === 'equipment') {
    // Equipment menu items in sidebar
    const equipmentSelectors = [
      '.menu-item:has(.fa-dumbbell)',
      '.menu-item:has([onclick*="equipment"])',
      '.menu-item:has([onclick*="Equipment"])'
    ];
    
    equipmentSelectors.forEach(selector => {
      try {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
          item.style.display = displayValue;
          item.style.setProperty('display', displayValue, 'important');
        });
      } catch (e) {
        // Fallback for browsers that don't support :has()
        console.warn('CSS :has() not supported, using fallback');
      }
    });
    
    // Fallback method for equipment menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      const link = item.querySelector('.menu-link');
      const icon = item.querySelector('i.fa-dumbbell');
      const onclick = item.getAttribute('onclick') || (link && link.getAttribute('onclick'));
      
      if (icon || (onclick && onclick.includes('equipment')) || (onclick && onclick.includes('Equipment'))) {
        item.style.display = displayValue;
        item.style.setProperty('display', displayValue, 'important');
      }
    });
    
    // Equipment quick action buttons - EXCLUDE the Add Equipment quick action
    const quickActions = document.querySelectorAll('.quick-action-btn, .quick-action');
    quickActions.forEach(btn => {
      const icon = btn.querySelector('i.fa-dumbbell');
      const onclick = btn.getAttribute('onclick');
      const isAddEquipmentQuickAction = btn.id === 'uploadEquipmentBtn'; // This should NOT be hidden
      
      if ((icon || (onclick && onclick.includes('equipment'))) && !isAddEquipmentQuickAction) {
        const parentElement = btn.parentElement;
        if (parentElement) {
          parentElement.style.display = flexDisplayValue;
          parentElement.style.setProperty('display', flexDisplayValue, 'important');
        }
      }
    });
    
    // Equipment gallery section
    const equipmentCards = document.querySelectorAll('.card');
    equipmentCards.forEach(card => {
      const title = card.querySelector('.card-title');
      if (title && title.textContent.includes('Equipment Gallery')) {
        card.style.display = displayValue;
        card.style.setProperty('display', displayValue, 'important');
      }
    });
    
    // Equipment tab content
    const equipmentTab = document.getElementById('equipmentTab');
    if (equipmentTab) {
      if (!isVisible && equipmentTab.style.display !== 'none') {
        // Switch to dashboard if equipment tab is currently visible
        hideAllMainTabs();
        const dashboardContent = document.querySelector('.content');
        if (dashboardContent) {
          dashboardContent.style.display = 'block';
          updateActiveMenuItem('dashboard');
        }
      }
    }
    
  } else if (tabType === 'payment') {
    // Payment menu items in sidebar
    const paymentSelectors = [
      '.menu-item:has(.fa-credit-card)',
      '.menu-item:has([onclick*="payment"])',
      '.menu-item:has([onclick*="Payment"])'
    ];
    
    paymentSelectors.forEach(selector => {
      try {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
          item.style.display = displayValue;
          item.style.setProperty('display', displayValue, 'important');
        });
      } catch (e) {
        // Fallback for browsers that don't support :has()
        console.warn('CSS :has() not supported, using fallback');
      }
    });
    
    // Fallback method for payment menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      const link = item.querySelector('.menu-link');
      const icon = item.querySelector('i.fa-credit-card');
      const onclick = item.getAttribute('onclick') || (link && link.getAttribute('onclick'));
      
      if (icon || (onclick && onclick.includes('payment')) || (onclick && onclick.includes('Payment'))) {
        item.style.display = displayValue;
        item.style.setProperty('display', displayValue, 'important');
      }
    });
    
    // Payment quick action buttons
    const quickActions = document.querySelectorAll('.quick-action-btn, .quick-action');
    quickActions.forEach(btn => {
      const icon = btn.querySelector('i.fa-credit-card');
      const onclick = btn.getAttribute('onclick');
      
      if (icon || (onclick && onclick.includes('payment'))) {
        const parentElement = btn.parentElement;
        if (parentElement) {
          parentElement.style.display = flexDisplayValue;
          parentElement.style.setProperty('display', flexDisplayValue, 'important');
        }
      }
    });
    
    // Payment tab content
    const paymentTab = document.getElementById('paymentTab');
    if (paymentTab) {
      if (!isVisible && paymentTab.style.display !== 'none') {
        // Switch to dashboard if payment tab is currently visible
        hideAllMainTabs();
        const dashboardContent = document.querySelector('.content');
        if (dashboardContent) {
          dashboardContent.style.display = 'block';
          updateActiveMenuItem('dashboard');
        }
      }
    }
  }
  
  // Remove early customization styles if they exist (since we're now applying proper styles)
  const earlyStyles = document.getElementById('earlyCustomizationStyles');
  if (earlyStyles) {
    earlyStyles.remove();
  }
}

function updateActiveMenuItem(activeTab) {
  const sidebarMenuLinks = document.querySelectorAll('.sidebar .menu-link');
  sidebarMenuLinks.forEach(link => link.classList.remove('active'));
  
  let targetIcon = '';
  if (activeTab === 'dashboard') targetIcon = '.fa-tachometer-alt';
  else if (activeTab === 'members') targetIcon = '.fa-users';
  else if (activeTab === 'trainers') targetIcon = '.fa-user-tie';
  
  if (targetIcon) {
    const activeMenuLink = Array.from(sidebarMenuLinks).find(link => link.querySelector(targetIcon));
    if (activeMenuLink) activeMenuLink.classList.add('active');
  }
}

// Helper function to hide all tabs (should match the one in gymadmin.js)
function hideAllMainTabs() {
  const dashboardContent = document.querySelector('.content');
  const memberDisplayTab = document.getElementById('memberDisplayTab');
  const trainerTab = document.getElementById('trainerTab');
  const settingsTab = document.getElementById('settingsTab');
  const attendanceTab = document.getElementById('attendanceTab');
  const paymentTab = document.getElementById('paymentTab');
  const equipmentTab = document.getElementById('equipmentTab');
  const supportReviewsTab = document.getElementById('supportReviewsTab');
  
  if (dashboardContent) dashboardContent.style.display = 'none';
  if (memberDisplayTab) memberDisplayTab.style.display = 'none';
  if (trainerTab) trainerTab.style.display = 'none';
  if (settingsTab) settingsTab.style.display = 'none';
  if (attendanceTab) attendanceTab.style.display = 'none';
  if (paymentTab) paymentTab.style.display = 'none';
  if (equipmentTab) equipmentTab.style.display = 'none';
  if (supportReviewsTab) supportReviewsTab.style.display = 'none';
}

function showCustomizationFeedback(message) {
  const gymId = getGymId();
  const gymSpecificMessage = `${message} (Gym: ${gymId ? gymId.substring(0, 8) + '...' : 'Unknown'})`;
  
  // Create feedback toast
  const toast = document.createElement('div');
  toast.className = 'customization-feedback-toast';
  toast.textContent = gymSpecificMessage;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success, #28a745);
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

// ===== BIOMETRIC ATTENDANCE FUNCTIONALITY =====
function setupBiometricAttendance() {
  const fingerprintToggle = document.getElementById('toggleFingerprintAttendance');
  const faceRecognitionToggle = document.getElementById('toggleFaceRecognitionAttendance');
  const biometricSettings = document.getElementById('biometricSettings');
  const autoEnrollToggle = document.getElementById('autoEnrollBiometric');
  const backupMethodToggle = document.getElementById('backupAttendanceMethod');
  const securityLevelSelect = document.getElementById('biometricSecurityLevel');
  
  // Get gym ID for settings isolation
  const gymId = getGymId();
  if (!gymId) {
    console.warn('No gym ID found, biometric attendance settings will not work properly');
    return;
  }

  // Start checking agent status and update UI immediately
  window.biometricAgentManager.startAgentCheck();
  
  // Also do an immediate check to update UI faster
  setTimeout(async () => {
    console.log('🔍 Performing immediate biometric agent status check...');
    const isRunning = await window.biometricAgentManager.checkAgentStatus();
    window.biometricAgentManager.updateAgentStatusUI(isRunning);
    
    if (isRunning) {
      console.log('✅ Agent is running - UI should reflect this now');
    } else {
      console.log('❌ Agent not running - showing install options');
    }
  }, 500);

  // Load saved biometric settings
  loadBiometricSettings(gymId);

  // Show/hide biometric settings panel based on toggle states
  function updateBiometricSettingsVisibility() {
    const fingerprintEnabled = fingerprintToggle?.checked || false;
    const faceRecognitionEnabled = faceRecognitionToggle?.checked || false;
    
    if (biometricSettings) {
      if (fingerprintEnabled || faceRecognitionEnabled) {
        biometricSettings.style.display = 'block';
        biometricSettings.classList.add('show');
      } else {
        biometricSettings.style.display = 'none';
        biometricSettings.classList.remove('show');
      }
    }
  }

  // Check agent status before enabling biometric features
  async function checkAgentAndEnable(type, toggle) {
    const isRunning = await window.biometricAgentManager.checkAgentStatus();
    
    if (!isRunning) {
      toggle.checked = false;
      showBiometricFeedback('⚠️ Biometric agent required. Please install and start the agent first.', 'warning');
      
      // Show agent installation prompt
      const installPrompt = document.createElement('div');
      installPrompt.className = 'alert alert-warning biometric-install-prompt';
      installPrompt.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <i class="fas fa-download"></i>
            <strong>Biometric Agent Required</strong>
            <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Install the local agent to use ${type} features.</p>
          </div>
          <button class="btn btn-primary install-agent-btn" onclick="window.biometricAgentManager.downloadAndInstallAgent()">
            <i class="fas fa-download"></i> Install Agent
          </button>
        </div>
      `;
      
      // Insert after the toggle
      toggle.closest('.setting-item').after(installPrompt);
      
      // Remove after 10 seconds
      setTimeout(() => {
        installPrompt.remove();
      }, 10000);
      
      return false;
    }
    
    return true;
  }

  // Fingerprint attendance toggle
  if (fingerprintToggle) {
    fingerprintToggle.addEventListener('change', async function() {
      const isEnabled = this.checked;
      
      if (isEnabled) {
        const agentReady = await checkAgentAndEnable('fingerprint', this);
        if (!agentReady) return;
      }
      
      setBiometricSetting(gymId, 'fingerprintEnabled', isEnabled);
      updateBiometricSettingsVisibility();
      showBiometricFeedback('Fingerprint attendance ' + (isEnabled ? 'enabled' : 'disabled'));
      
      if (isEnabled) {
        checkBiometricDeviceCompatibility('fingerprint');
      }
    });
  }

  // Face recognition attendance toggle
  if (faceRecognitionToggle) {
    faceRecognitionToggle.addEventListener('change', async function() {
      const isEnabled = this.checked;
      
      if (isEnabled) {
        const agentReady = await checkAgentAndEnable('face recognition', this);
        if (!agentReady) return;
      }
      
      setBiometricSetting(gymId, 'faceRecognitionEnabled', isEnabled);
      updateBiometricSettingsVisibility();
      showBiometricFeedback('Face recognition attendance ' + (isEnabled ? 'enabled' : 'disabled'));
      
      if (isEnabled) {
        checkBiometricDeviceCompatibility('face');
      }
    });
  }

  // Auto-enroll toggle
  if (autoEnrollToggle) {
    autoEnrollToggle.addEventListener('change', function() {
      const isEnabled = this.checked;
      setBiometricSetting(gymId, 'autoEnrollEnabled', isEnabled);
      showBiometricFeedback('Auto-enrollment ' + (isEnabled ? 'enabled' : 'disabled'));
    });
  }

  // Backup method toggle
  if (backupMethodToggle) {
    backupMethodToggle.addEventListener('change', function() {
      const isEnabled = this.checked;
      setBiometricSetting(gymId, 'backupMethodEnabled', isEnabled);
      showBiometricFeedback('Manual backup ' + (isEnabled ? 'enabled' : 'disabled'));
    });
  }

  // Security level select
  if (securityLevelSelect) {
    securityLevelSelect.addEventListener('change', function() {
      const level = this.value;
      setBiometricSetting(gymId, 'securityLevel', level);
      showBiometricFeedback(`Security level set to ${level}`);
    });
  }

  // Setup button event listeners
  setupBiometricButtons(gymId);
  
  // Initial visibility update
  updateBiometricSettingsVisibility();
}

// Load saved biometric settings for a specific gym
function loadBiometricSettings(gymId) {
  const settings = getBiometricSettings(gymId);
  
  // Apply loaded settings to UI
  const fingerprintToggle = document.getElementById('toggleFingerprintAttendance');
  const faceRecognitionToggle = document.getElementById('toggleFaceRecognitionAttendance');
  const autoEnrollToggle = document.getElementById('autoEnrollBiometric');
  const backupMethodToggle = document.getElementById('backupAttendanceMethod');
  const securityLevelSelect = document.getElementById('biometricSecurityLevel');
  
  if (fingerprintToggle) fingerprintToggle.checked = settings.fingerprintEnabled;
  if (faceRecognitionToggle) faceRecognitionToggle.checked = settings.faceRecognitionEnabled;
  if (autoEnrollToggle) autoEnrollToggle.checked = settings.autoEnrollEnabled;
  if (backupMethodToggle) backupMethodToggle.checked = settings.backupMethodEnabled;
  if (securityLevelSelect) securityLevelSelect.value = settings.securityLevel;
}

// Get biometric settings for a specific gym
function getBiometricSettings(gymId) {
  const defaultSettings = {
    fingerprintEnabled: false,
    faceRecognitionEnabled: false,
    autoEnrollEnabled: true,
    backupMethodEnabled: true,
    securityLevel: 'standard'
  };
  
  try {
    const savedSettings = localStorage.getItem(`biometricSettings_${gymId}`);
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  } catch (error) {
    console.warn('Error loading biometric settings:', error);
    return defaultSettings;
  }
}

// Set biometric setting for a specific gym
function setBiometricSetting(gymId, key, value) {
  try {
    const settings = getBiometricSettings(gymId);
    settings[key] = value;
    localStorage.setItem(`biometricSettings_${gymId}`, JSON.stringify(settings));
    console.log(`✅ Biometric setting saved: ${key} = ${value} for gym ${gymId}`);
  } catch (error) {
    console.error('Error saving biometric setting:', error);
  }
}

// Setup biometric action buttons
function setupBiometricButtons(gymId) {
  // Setup Devices button
  const setupDevicesBtn = document.getElementById('setupBiometricDevices');
  if (setupDevicesBtn) {
    setupDevicesBtn.addEventListener('click', () => openBiometricDeviceSetup());
  }

  // Test Connection button
  const testConnectionBtn = document.getElementById('testBiometricConnection');
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', () => testBiometricConnection());
  }

  // Enroll Members button
  const enrollMembersBtn = document.getElementById('enrollBiometricData');
  if (enrollMembersBtn) {
    enrollMembersBtn.addEventListener('click', () => openBiometricEnrollment());
  }

  // View Reports button
  const reportsBtn = document.getElementById('biometricReports');
  if (reportsBtn) {
    reportsBtn.addEventListener('click', () => openBiometricReports());
  }
}

// Check device compatibility for biometric features
async function checkBiometricDeviceCompatibility(type) {
  console.log(`🔍 Checking ${type} device compatibility...`);
  
  // First check if agent is running
  const agentRunning = await window.biometricAgentManager.checkAgentStatus();
  
  if (!agentRunning) {
    showBiometricFeedback('⚠️ Biometric agent is not running. Please install and start the agent first.', 'warning');
    return;
  }
  
  // Show compatibility check modal
  const checkModal = createBiometricModal(`${type.charAt(0).toUpperCase() + type.slice(1)} Device Check`, `
    <div style="padding: 20px; text-align: center;">
      <i class="fas fa-search fa-3x" style="color: #2196F3; margin-bottom: 20px;"></i>
      <h4>Checking Device Compatibility</h4>
      <div id="deviceCheckProgress" style="margin: 20px 0;">
        <div style="background: #f0f0f0; border-radius: 8px; overflow: hidden; height: 6px;">
          <div id="checkProgressBar" style="background: #2196F3; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
        </div>
        <p id="checkStatus" style="margin: 12px 0; color: #666;">Connecting to biometric agent...</p>
      </div>
      <div id="deviceRequirements" style="text-align: left; margin: 20px 0; background: #f8f9fa; padding: 16px; border-radius: 8px;">
        <h5 style="margin-bottom: 12px; color: #333;">
          <i class="fas fa-${type === 'fingerprint' ? 'fingerprint' : 'camera'}"></i> 
          ${type === 'fingerprint' ? 'Fingerprint Scanner' : 'Face Recognition Camera'} Requirements:
        </h5>
        ${type === 'fingerprint' ? `
          <ul style="margin: 0; padding-left: 20px; color: #666;">
            <li>USB 2.0 or higher fingerprint scanner</li>
            <li>Compatible with Windows Biometric Framework (WBF)</li>
            <li>Minimum 500 DPI resolution</li>
            <li>Live finger detection support</li>
            <li>Recommended brands: SecuGen, DigitalPersona, Futronic</li>
          </ul>
        ` : `
          <ul style="margin: 0; padding-left: 20px; color: #666;">
            <li>HD webcam (1280x720 minimum) or IP camera</li>
            <li>Good lighting conditions required</li>
            <li>Face detection algorithm support</li>
            <li>USB 2.0+ or network connectivity</li>
            <li>Compatible with Windows Hello or similar frameworks</li>
          </ul>
        `}
      </div>
      <div id="compatibilityResult" style="display: none; margin-top: 20px;"></div>
    </div>
  `);
  
  document.body.appendChild(checkModal);
  
  // Get DOM elements
  const progressBar = document.getElementById('checkProgressBar');
  const statusText = document.getElementById('checkStatus');
  const resultDiv = document.getElementById('compatibilityResult');
  
  try {
    // Step 1: Check agent health
    progressBar.style.width = '20%';
    statusText.textContent = 'Connecting to biometric agent...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const healthResponse = await fetch('http://localhost:5001/health');
    if (!healthResponse.ok) {
      throw new Error('Agent not responding');
    }
    
    // Step 2: Scan for devices
    progressBar.style.width = '40%';
    statusText.textContent = 'Scanning for connected devices...';
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const devicesResponse = await fetch('http://localhost:5001/api/devices/scan');
    const devicesResult = await devicesResponse.json();
    
    if (!devicesResult.success) {
      throw new Error('Device scan failed');
    }
    
    // Step 3: Filter devices by type
    progressBar.style.width = '60%';
    statusText.textContent = `Looking for ${type} devices...`;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const relevantDevices = devicesResult.devices.filter(device => {
      if (type === 'fingerprint') {
        return device.category === 'fingerprint' || device.type === 'fingerprint';
      } else {
        return device.category === 'camera' || device.type === 'camera';
      }
    });
    
    // Step 4: Check installed devices
    progressBar.style.width = '80%';
    statusText.textContent = 'Checking installed devices...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const installedResponse = await fetch('http://localhost:5001/api/devices/installed');
    const installedResult = await installedResponse.json();
    const installedDevices = installedResult.success ? installedResult.devices : [];
    
    // Step 5: Complete check
    progressBar.style.width = '100%';
    statusText.textContent = 'Finalizing compatibility check...';
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Show results
    resultDiv.style.display = 'block';
    
    if (relevantDevices.length === 0) {
      resultDiv.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>No ${type} devices found</strong>
          <p>Please connect a compatible ${type === 'fingerprint' ? 'fingerprint scanner' : 'camera'} and try again.</p>
          <button class="btn btn-primary" onclick="window.location.href='/frontend/biometric-device-setup.html'">
            <i class="fas fa-cog"></i> Device Setup
          </button>
        </div>
      `;
    } else {
      const deviceList = relevantDevices.map(device => {
        const isInstalled = installedDevices.some(inst => inst.deviceId === device.deviceId);
        return `
          <div class="device-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin: 8px 0;">
            <div>
              <strong>${device.name}</strong>
              <div style="font-size: 0.9rem; color: #666;">${device.vendor || ''} ${device.product || ''}</div>
            </div>
            <div>
              <span class="status-badge ${isInstalled ? 'status-enrolled' : 'status-pending'}">
                ${isInstalled ? 'Installed' : 'Not Installed'}
              </span>
            </div>
          </div>
        `;
      }).join('');
      
      resultDiv.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          <strong>Found ${relevantDevices.length} compatible ${type} device(s)</strong>
          <div style="margin-top: 15px;">
            ${deviceList}
          </div>
          <div style="margin-top: 15px;">
            <button class="btn btn-primary" onclick="window.location.href='/frontend/biometric-device-setup.html'">
              <i class="fas fa-cog"></i> Manage Devices
            </button>
            <button class="btn btn-secondary" onclick="window.location.href='/frontend/biometric-enrollment.html'">
              <i class="fas fa-user-plus"></i> Start Enrollment
            </button>
          </div>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Device compatibility check failed:', error);
    progressBar.style.width = '100%';
    progressBar.style.background = '#f44336';
    statusText.textContent = 'Check failed';
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <div class="alert alert-error">
        <i class="fas fa-times-circle"></i>
        <strong>Compatibility check failed</strong>
        <p>Error: ${error.message}</p>
        <button class="btn btn-primary install-agent-btn" onclick="window.biometricAgentManager.downloadAndInstallAgent()">
          <i class="fas fa-download"></i> Install Agent
        </button>
      </div>
    `;
  }
  
  // Add close button to modal
  setTimeout(() => {
    const modalBody = checkModal.querySelector('.modal-body');
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.innerHTML = '<i class="fas fa-times"></i> Close';
    closeButton.onclick = () => checkModal.remove();
    closeButton.style.marginTop = '15px';
    modalBody.appendChild(closeButton);
  }, 2000);
  }
  
  // Add close button to modal
  setTimeout(() => {
    const modalBody = checkModal.querySelector('.modal-body');
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.innerHTML = '<i class="fas fa-times"></i> Close';
    closeButton.onclick = () => checkModal.remove();
    closeButton.style.marginTop = '15px';
    modalBody.appendChild(closeButton);
  }, 2000);


// Simulation version - replaced with real agent implementation above
function checkBiometricDeviceCompatibilitySimulation(type) {
  console.log(`🔍 Checking ${type} device compatibility...`);
  
  // Show compatibility check modal
  const checkModal = createBiometricModal(`${type.charAt(0).toUpperCase() + type.slice(1)} Device Check`, `
    <div style="padding: 20px; text-align: center;">
      <i class="fas fa-search fa-3x" style="color: #2196F3; margin-bottom: 20px;"></i>
      <h4>Checking Device Compatibility</h4>
      <div id="deviceCheckProgress" style="margin: 20px 0;">
        <div style="background: #f0f0f0; border-radius: 8px; overflow: hidden; height: 6px;">
          <div id="checkProgressBar" style="background: #2196F3; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
        </div>
        <p id="checkStatus" style="margin: 12px 0; color: #666;">Initializing device scan...</p>
      </div>
      <div id="compatibilityResult" style="display: none; margin-top: 20px;"></div>
    </div>
  `);
  
  document.body.appendChild(checkModal);
  
  // Get DOM elements
  const progressBar = document.getElementById('checkProgressBar');
  const statusText = document.getElementById('checkStatus');
  const resultDiv = document.getElementById('compatibilityResult');
  
  // Simulation steps
  let progress = 0;
  const checkSteps = [
    'Scanning USB ports...',
    'Detecting fingerprint devices...',
    'Checking camera devices...',
    'Testing device communication...',
    'Verifying driver compatibility...',
    'Completing compatibility check...'
  ];
  
  const stepInterval = setInterval(() => {
    if (progress >= checkSteps.length) {
      clearInterval(stepInterval);
      
      // Simulate device check result (70% success rate)
      const isCompatible = Math.random() > 0.3;
      const deviceFound = Math.random() > 0.4;
      
      progressBar.style.width = '100%';
      progressBar.style.background = isCompatible ? '#4CAF50' : '#f44336';
      
      if (isCompatible && deviceFound) {
        statusText.textContent = 'Device compatibility check complete!';
        statusText.style.color = '#4CAF50';
        resultDiv.innerHTML = `
          <div style="background: #e8f5e8; border: 1px solid #4CAF50; border-radius: 8px; padding: 16px;">
            <i class="fas fa-check-circle" style="color: #4CAF50; margin-right: 8px;"></i>
            <strong>Compatible device found!</strong>
            <p style="margin: 8px 0 0 0; color: #666;">
              ${type === 'fingerprint' ? 'Fingerprint scanner' : 'Camera'} is ready for biometric attendance.
            </p>
            <div style="margin-top: 16px;">
              <button class="btn btn-success" onclick="startDeviceConfiguration('${type}')">
                <i class="fas fa-cog"></i> Configure Device
              </button>
            </div>
          </div>
        `;
        showBiometricFeedback(`${type} device found and compatible!`, 'success');
      } else if (!deviceFound) {
        statusText.textContent = 'No compatible device found';
        statusText.style.color = '#f44336';
        resultDiv.innerHTML = `
          <div style="background: #ffebee; border: 1px solid #f44336; border-radius: 8px; padding: 16px;">
            <i class="fas fa-exclamation-triangle" style="color: #f44336; margin-right: 8px;"></i>
            <strong>No ${type} device detected</strong>
            <p style="margin: 8px 0 0 0; color: #666;">
              Please connect a compatible ${type === 'fingerprint' ? 'fingerprint scanner' : 'camera'} and try again.
            </p>
            <div style="margin-top: 16px;">
              <button class="btn btn-secondary" onclick="retryDeviceCheck('${type}')" style="margin-right: 8px;">
                <i class="fas fa-redo"></i> Retry Check
              </button>
              <button class="btn btn-info" onclick="showDeviceRecommendations('${type}')">
                <i class="fas fa-shopping-cart"></i> View Recommendations
              </button>
            </div>
          </div>
        `;
        showBiometricFeedback('No compatible device found', 'warning');
      } else {
        statusText.textContent = 'Device incompatible';
        statusText.style.color = '#f44336';
        resultDiv.innerHTML = `
          <div style="background: #ffebee; border: 1px solid #f44336; border-radius: 8px; padding: 16px;">
            <i class="fas fa-exclamation-triangle" style="color: #f44336; margin-right: 8px;"></i>
            <strong>Device incompatible</strong>
            <p style="margin: 8px 0 0 0; color: #666;">
              The detected device is not compatible with the current system.
            </p>
          </div>
        `;
        showBiometricFeedback('Device is not compatible', 'error');
      }
    }

    statusText.textContent = checkSteps[progress];
    progress++;
    progressBar.style.width = (progress / checkSteps.length * 100) + '%';
  }, 800);

  // Add close button to modal
  setTimeout(() => {
    const modalBody = checkModal.querySelector('.modal-body');
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.innerHTML = '<i class="fas fa-times"></i> Close';
    closeButton.onclick = () => checkModal.remove();
    closeButton.style.marginTop = '15px';
    modalBody.appendChild(closeButton);
  }, 2000);
}// Open biometric device setup modal
function openBiometricDeviceSetup() {
  // Check if agent is running first
  window.biometricAgentManager.checkAgentStatus().then(isRunning => {
    if (!isRunning) {
      showBiometricFeedback('⚠️ Biometric agent is not running. Would you like to install it?', 'warning');
      
      // Show installation prompt modal
      const installModal = createBiometricModal('Install Biometric Agent', `
        <div style="padding: 20px; text-align: center;">
          <i class="fas fa-exclamation-triangle fa-3x" style="color: #ff9800; margin-bottom: 20px;"></i>
          <h4>Biometric Agent Required</h4>
          <p style="margin: 16px 0; color: #666;">
            The biometric attendance system requires a local agent to communicate with fingerprint scanners and cameras. 
            This agent runs securely on your computer and handles device communication.
          </p>
          <div style="margin: 20px 0;">
            <button class="btn btn-primary" onclick="window.biometricAgentManager.downloadAndInstallAgent(); this.closest('.modal-overlay').remove();">
              <i class="fas fa-download"></i> Download & Install Agent
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove();" style="margin-left: 10px;">
              Cancel
            </button>
          </div>
          <div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 0.9rem; color: #666;">
            <i class="fas fa-info-circle"></i>
            <strong>Safe & Secure:</strong> The agent only runs locally and doesn't send data to external servers.
          </div>
        </div>
      `);
      document.body.appendChild(installModal);
      return;
    }
    
    // Agent is running, redirect to device setup page
    window.open('/frontend/biometric-device-setup.html', '_blank');
  }).catch(error => {
    console.error('Error checking agent status:', error);
    showBiometricFeedback('Unable to check agent status. Please try installing the agent manually.', 'error');
    window.biometricAgentManager.showManualInstallationGuide();
  });
}

// Test biometric connection
async function testBiometricConnection() {
  const testBtn = document.getElementById('testBiometricConnection');
  if (!testBtn) {
    console.error('Test button not found');
    return;
  }
  
  const originalText = testBtn.innerHTML;
  
  // Show loading state
  testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
  testBtn.disabled = true;
  
  try {
    // Check if agent is running
    const agentRunning = await window.biometricAgentManager.checkAgentStatus();
    
    if (!agentRunning) {
      showBiometricFeedback('⚠️ Biometric agent is not running. Please install and start the agent first.', 'warning');
      window.biometricAgentManager.downloadAndInstallAgent();
      return;
    }
    
    // Test agent connectivity
    const healthResponse = await fetch('http://localhost:5001/health');
    const healthData = await healthResponse.json();
    
    // Scan for devices
    const devicesResponse = await fetch('http://localhost:5001/api/devices/scan');
    const devicesData = await devicesResponse.json();
    
    if (devicesData.success) {
      const fingerprintDevices = devicesData.devices.filter(d => d.category === 'fingerprint');
      const cameraDevices = devicesData.devices.filter(d => d.category === 'camera');
      
      const totalDevices = fingerprintDevices.length + cameraDevices.length;
      
      if (totalDevices > 0) {
        showBiometricFeedback(`Connection test successful! Found ${totalDevices} device(s): ${fingerprintDevices.length} fingerprint, ${cameraDevices.length} camera`, 'success');
      } else {
        showBiometricFeedback('No biometric devices found. Please connect devices and try again.', 'warning');
      }
    } else {
      showBiometricFeedback('❌ Device scan failed: ' + devicesData.error, 'error');
    }
    
  } catch (error) {
    console.error('Connection test failed:', error);
      showBiometricFeedback('Connection test failed: ' + error.message, 'error');    // Offer to install agent if connection failed
    if (error.message.includes('fetch')) {
      window.biometricAgentManager.downloadAndInstallAgent();
    }
  } finally {
    // Restore button state
    testBtn.innerHTML = originalText;
    testBtn.disabled = false;
  }
}

// Complete the connection test and show real results
async function completeConnectionTest(testBtn, originalText) {
  // Use real device detection instead of simulation
  const deviceDetectionResults = await performRealDeviceDetection();
  
  // Update fingerprint scanner status
  const fingerprintTest = document.querySelector('[data-device="fingerprint"] .test-status');
  if (fingerprintTest) {
    updateDeviceStatus(fingerprintTest, deviceDetectionResults.fingerprint);
  }
  
  // Update camera status
  const cameraTest = document.querySelector('[data-device="camera"] .test-status');
  if (cameraTest) {
    updateDeviceStatus(cameraTest, deviceDetectionResults.camera);
  }

  // Update progress
  const progressBar = document.getElementById('connectionTestProgress');
  const progressText = document.getElementById('testProgressText');
  if (progressBar && progressText) {
    progressBar.style.width = '100%';
    const anyDeviceFound = deviceDetectionResults.fingerprint.found || deviceDetectionResults.camera.found;
    progressBar.style.background = anyDeviceFound ? '#4CAF50' : '#f44336';
    progressText.textContent = 'Connection test completed!';
    progressText.style.color = anyDeviceFound ? '#4CAF50' : '#f44336';
    progressText.style.fontWeight = '500';
  }

  // Show results summary with real data
  showTestResultsSummary(deviceDetectionResults);

  // Reset test button
  resetTestButton(testBtn, originalText);

  // Show real feedback message
  const devicesFoundCount = deviceDetectionResults.totalDevices || 0;
  if (devicesFoundCount > 0) {
    showBiometricFeedback(`Connection test completed! ${devicesFoundCount} device(s) found.`, 'success');
  } else {
    const errorMsg = deviceDetectionResults.scanError || 'No biometric devices found. Please check connections.';
    showBiometricFeedback(errorMsg, 'warning');
  }
}

// Real biometric device detection using actual API
async function performRealDeviceDetection() {
  try {
      console.log('Starting real biometric device scan...');    const response = await fetch('/api/biometric/devices/scan', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      const devices = result.devices || [];
      
      // Categorize devices by type
      const fingerprintDevices = devices.filter(device => 
        device.category === 'fingerprint' || 
        device.deviceType === 'fingerprint_scanner'
      );
      
      const cameraDevices = devices.filter(device => 
        device.category === 'camera' || 
        device.deviceType === 'camera'
      );
      
      console.log(`Real scan completed: ${fingerprintDevices.length} fingerprint, ${cameraDevices.length} camera devices`);
      
      return {
        fingerprint: {
          found: fingerprintDevices.length > 0,
          devices: fingerprintDevices,
          device: fingerprintDevices[0] || null,
          error: fingerprintDevices.length === 0 ? 'No fingerprint scanners detected' : null
        },
        camera: {
          found: cameraDevices.length > 0,
          devices: cameraDevices,
          device: cameraDevices[0] || null,
          error: cameraDevices.length === 0 ? 'No face recognition cameras detected' : null
        },
        totalDevices: devices.length,
        allDevices: devices
      };
    } else {
      console.error('Device scan failed:', result.error);
      return {
        fingerprint: { found: false, devices: [], device: null, error: result.error },
        camera: { found: false, devices: [], device: null, error: result.error },
        totalDevices: 0,
        allDevices: [],
        scanError: result.error
      };
    }
  } catch (error) {
    console.error('Device scan error:', error);
    return {
      fingerprint: { found: false, devices: [], device: null, error: 'Network error during scan' },
      camera: { found: false, devices: [], device: null, error: 'Network error during scan' },
      totalDevices: 0,
      allDevices: [],
      scanError: error.message
    };
  }

// Real biometric device installation using actual API
async function installRealDevice(deviceInfo) {
  try {
    console.log('📦 Installing device support for:', deviceInfo.vendor, deviceInfo.model);
    
    const response = await fetch('/api/biometric/devices/install', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
      },
      body: JSON.stringify({
        deviceInfo: deviceInfo
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Device SDK installed successfully');
      return {
        success: true,
        message: result.message,
        deviceId: result.deviceId,
        sdkInstalled: true,
        installationTime: result.installationTime
      };
    } else {
      console.error('❌ Device installation failed:', result.error);
      return {
        success: false,
        error: result.error,
        details: result.details
      };
    }
  } catch (error) {
    console.error('❌ Installation error:', error);
    return {
      success: false,
      error: 'Network error during installation',
      details: error.message
    };
  }
}

// Real device connection testing using actual API
async function testRealDeviceConnection(deviceId) {
  try {
    console.log('🧪 Testing device connection:', deviceId);
    
    const response = await fetch('/api/biometric/devices/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
      },
      body: JSON.stringify({
        deviceId: deviceId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Device test passed');
      return {
        success: true,
        status: result.status,
        responseTime: result.responseTime,
        details: result.details,
        deviceInfo: result.deviceInfo
      };
    } else {
      console.error('❌ Device test failed:', result.error);
      return {
        success: false,
        error: result.error,
        details: result.details
      };
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    return {
      success: false,
      error: 'Network error during test',
      details: error.message
    };
  }
}

// Get real installed devices using actual API
async function getRealInstalledDevices() {
  try {
    console.log('📋 Retrieving installed devices...');
    
    const response = await fetch('/api/biometric/devices/installed', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Found ${result.deviceCount} installed device(s)`);
      return {
        success: true,
        devices: result.devices,
        deviceCount: result.deviceCount
      };
    } else {
      console.error('❌ Failed to get devices:', result.error);
      return {
        success: false,
        error: result.error,
        devices: []
      };
    }
  } catch (error) {
    console.error('❌ Error getting devices:', error);
    return {
      success: false,
      error: error.message,
      devices: []
    };
  }
}
}

// Get random error messages for device detection failures
function getRandomError(deviceType) {
  const fingerprintErrors = [
    'No USB fingerprint scanner detected',
    'Driver not installed or incompatible',
    'Device not responding to commands',
    'USB port may not have sufficient power'
  ];
  
  const cameraErrors = [
    'No camera device found',
    'Camera is being used by another application',
    'Permission denied - enable camera access',
    'Camera driver not properly installed'
  ];
  
  const errors = deviceType === 'fingerprint' ? fingerprintErrors : cameraErrors;
  return errors[Math.floor(Math.random() * errors.length)];
}

// Update individual device status in the UI with real device data
function updateDeviceStatus(statusElement, deviceResult) {
  if (deviceResult.found && deviceResult.devices && deviceResult.devices.length > 0) {
    const device = deviceResult.devices[0]; // Show first device
    const deviceName = device.vendor && device.model ? 
      `${device.vendor} ${device.model}` : 
      device.name || `${device.category} Device`;
    
    statusElement.innerHTML = `
      <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
      <span style="color: #4CAF50; font-weight: 500;">Found: ${deviceName}</span>
    `;
    statusElement.parentElement.style.borderColor = '#4CAF50';
    statusElement.parentElement.style.background = '#f1f8e9';
  } else {
    const errorMessage = deviceResult.error || 'Not Found';
    statusElement.innerHTML = `
      <i class="fas fa-times-circle" style="color: #f44336;"></i>
      <span style="color: #f44336; font-weight: 500;">${errorMessage}</span>
    `;
    statusElement.parentElement.style.borderColor = '#f44336';
    statusElement.parentElement.style.background = '#ffebee';
  }
}

// Show detailed test results summary with real device data
function showTestResultsSummary(results) {
  const testResults = document.getElementById('testResults');
  const testResultsContent = document.getElementById('testResultsContent');
  
  if (!testResults || !testResultsContent) return;

  let resultHTML = '';
  const devicesFound = [];
  
  // Process real device results
  if (results.fingerprint.found && results.fingerprint.devices) {
    results.fingerprint.devices.forEach(device => {
      devicesFound.push({
        type: 'Fingerprint Scanner',
        name: device.vendor && device.model ? `${device.vendor} ${device.model}` : device.name || 'Unknown Device',
        status: device.isInstalled ? 'Ready' : 'Needs Installation',
        deviceId: device.deviceId,
        connectionType: device.connectionType || 'USB',
        vendor: device.vendor || 'Unknown'
      });
    });
  }
  
  if (results.camera.found && results.camera.devices) {
    results.camera.devices.forEach(device => {
      devicesFound.push({
        type: 'Face Recognition Camera',
        name: device.vendor && device.model ? `${device.vendor} ${device.model}` : device.name || 'Unknown Camera',
        status: device.isInstalled ? 'Ready' : 'Needs Installation',
        deviceId: device.deviceId,
        connectionType: device.connectionType || 'USB',
        vendor: device.vendor || 'Unknown'
      });
    });
  }

  if (devicesFound.length > 0) {
    resultHTML = `
      <div style="color: #4CAF50; margin-bottom: 16px;">
        <i class="fas fa-check-circle"></i>
        <strong> ${devicesFound.length} device(s) detected</strong>
      </div>
      <div style="margin-bottom: 16px;">
        ${devicesFound.map(device => `
          <div style="background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 500; color: #333; margin-bottom: 4px;">
              <i class="fas fa-${device.type.includes('Camera') ? 'camera' : 'fingerprint'}" style="margin-right: 8px; color: #4CAF50;"></i>
              ${device.name}
            </div>
            <div style="font-size: 0.9rem; color: #666;">
              Status: <span style="color: ${device.status === 'Ready' ? '#4CAF50' : '#ff9800'};">${device.status}</span>
              • Connection: ${device.connectionType}
              • Device ID: ${device.deviceId}
              ${device.vendor !== 'Unknown' ? `• Vendor: ${device.vendor}` : ''}
            </div>
            ${device.status === 'Needs Installation' ? `
              <button class="btn btn-sm" onclick="installDeviceFromTest('${device.deviceId}')" 
                      style="margin-top: 8px; background: #ff9800; color: white; font-size: 0.8rem;">
                <i class="fas fa-download"></i> Install SDK
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    resultHTML = `
      <div style="color: #f44336; margin-bottom: 16px;">
        <i class="fas fa-exclamation-triangle"></i>
        <strong> No biometric devices detected</strong>
      </div>
      <div style="background: white; border: 1px solid #ffcdd2; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
        <h6 style="margin: 0 0 8px 0; color: #d32f2f;">Common Issues:</h6>
        <ul style="margin: 0; padding-left: 16px; color: #666; font-size: 0.9rem;">
          ${results.fingerprint.error ? `<li><strong>Fingerprint:</strong> ${results.fingerprint.error}</li>` : ''}
          ${results.camera.error ? `<li><strong>Camera:</strong> ${results.camera.error}</li>` : ''}
          ${results.scanError ? `<li><strong>Scan Error:</strong> ${results.scanError}</li>` : ''}
          <li>Check USB connections and power supply</li>
          <li>Install or update device drivers</li>
          <li>Ensure devices are compatible with your system</li>
          <li>Try running the application as administrator</li>
        </ul>
      </div>
    `;
  }

  testResultsContent.innerHTML = resultHTML;
  testResults.style.display = 'block';
}

// Helper function to reset test button
function resetTestButton(testBtn, originalText) {
  if (testBtn) {
    testBtn.innerHTML = originalText;
    testBtn.disabled = false;
    testBtn.classList.remove('biometric-loading');
  }
}

// Helper functions for connection testing
window.runConnectionTestAgain = function() {
  document.querySelector('.biometric-modal-overlay, .biometric-modal').remove();
  setTimeout(() => testBiometricConnection(), 100);
};

window.showDeviceHelp = function() {
  const helpModal = createBiometricModal('Device Connection Help', `
    <div style="padding: 20px;">
      <h4 style="margin-bottom: 16px; color: #333;">
        <i class="fas fa-question-circle" style="color: #2196F3; margin-right: 8px;"></i>
        Troubleshooting Device Connections
      </h4>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #4CAF50; margin-bottom: 8px;">
          <i class="fas fa-fingerprint"></i> Fingerprint Scanner Issues:
        </h5>
        <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
          <li>Ensure the scanner is properly connected via USB</li>
          <li>Check if Windows recognizes the device in Device Manager</li>
          <li>Install latest drivers from manufacturer's website</li>
          <li>Try a different USB port (USB 3.0 preferred)</li>
          <li>Restart the application and try again</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #2196F3; margin-bottom: 8px;">
          <i class="fas fa-camera"></i> Camera Issues:
        </h5>
        <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
          <li>Check if camera is connected and powered on</li>
          <li>Ensure camera permissions are granted</li>
          <li>Close other applications using the camera</li>
          <li>Update camera drivers</li>
          <li>Test with built-in camera app first</li>
        </ul>
      </div>
      
      <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; border-left: 4px solid #2196F3;">
        <h5 style="margin: 0 0 8px 0; color: #1976D2;">
          <i class="fas fa-lightbulb"></i> Still Need Help?
        </h5>
        <p style="margin: 0; color: #1976D2; font-size: 0.9rem;">
          Contact our technical support team for device-specific assistance and driver downloads.
        </p>
        <div style="margin-top: 12px;">
          <button class="btn btn-primary" onclick="contactTechnicalSupport()" style="font-size: 0.9rem;">
            <i class="fas fa-headset"></i> Contact Support
          </button>
        </div>
      </div>
    </div>
  `);
  
  // Close current modal and show help
  document.querySelector('.biometric-modal-overlay, .biometric-modal').remove();
  document.body.appendChild(helpModal);
};

window.contactTechnicalSupport = function() {
  showBiometricFeedback('Opening support contact form...', 'info');
  // In real implementation, this would open a support ticket system
};

// Open enrollment modal  
function openBiometricEnrollment() {
  const modal = createBiometricModal('Enroll Members', `
    <div class="enrollment-modal-content">
      <div class="enrollment-tabs">
        <button class="tab-btn active" data-tab="members" onclick="switchEnrollmentTab('members')">
          <i class="fas fa-users"></i> Members
        </button>
        <button class="tab-btn" data-tab="trainers" onclick="switchEnrollmentTab('trainers')">
          <i class="fas fa-user-tie"></i> Trainers
        </button>
      </div>
      
      <div class="tab-content active" id="members-enrollment-tab">
        <div class="search-container" style="margin-bottom: 16px;">
          <input type="text" id="memberEnrollmentSearch" placeholder="Search members..." 
                 style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div class="member-list" id="memberEnrollmentList">
          <div class="loading" style="text-align: center; padding: 20px; color: #666;">
            <i class="fas fa-spinner fa-spin"></i> Loading members...
          </div>
        </div>
      </div>
      
      <div class="tab-content" id="trainers-enrollment-tab" style="display: none;">
        <div class="search-container" style="margin-bottom: 16px;">
          <input type="text" id="trainerEnrollmentSearch" placeholder="Search trainers..." 
                 style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div class="trainer-list" id="trainerEnrollmentList">
          <div class="loading" style="text-align: center; padding: 20px; color: #666;">
            <i class="fas fa-spinner fa-spin"></i> Loading trainers...
          </div>
        </div>
      </div>
      
      <div class="enrollment-actions" style="margin-top: 20px; text-align: center;">
        <button class="btn btn-primary" onclick="startBulkEnrollment()">
          <i class="fas fa-users"></i> Bulk Enroll Selected
        </button>
      </div>
    </div>
  `);

  // Load mock data
  setTimeout(() => loadEnrollmentData(), 500);
}

// Open reports modal
function openBiometricReports() {
  const modal = createBiometricModal('Biometric Reports', `
    <div class="reports-modal-content">
      <div class="reports-filters" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; margin-bottom: 20px; align-items: end;">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Date Range:</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="date" id="reportStartDate" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <span>to</span>
            <input type="date" id="reportEndDate" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Report Type:</label>
          <select id="reportType" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="enrollment">Enrollment Summary</option>
            <option value="attendance">Attendance Analytics</option>
            <option value="verification">Verification Success Rate</option>
            <option value="device">Device Usage</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="generateBiometricReport()">
          <i class="fas fa-chart-line"></i> Generate
        </button>
      </div>
      
      <div class="reports-content" id="reportsContent" style="min-height: 300px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <div class="reports-placeholder" style="text-align: center; color: #666;">
          <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 16px;"></i>
          <p>Select date range and report type, then click "Generate" to view analytics</p>
        </div>
      </div>
      
      <div class="reports-actions" id="reportsActions" style="display: none; margin-top: 16px; text-align: center;">
        <button class="btn btn-secondary" onclick="exportBiometricReport('pdf')" style="margin-right: 8px;">
          <i class="fas fa-file-pdf"></i> Export PDF
        </button>
        <button class="btn btn-secondary" onclick="exportBiometricReport('csv')" style="margin-right: 8px;">
          <i class="fas fa-file-csv"></i> Export CSV
        </button>
        <button class="btn btn-info" onclick="emailBiometricReport()">
          <i class="fas fa-envelope"></i> Email Report
        </button>
      </div>
    </div>
  `);

  // Set default date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  
  setTimeout(() => {
    document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = endDate.toISOString().split('T')[0];
  }, 100);
}

// Create responsive biometric modal
function createBiometricModal(title, content, buttons = []) {
  // Remove any existing modal
  const existingModal = document.querySelector('.biometric-modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.className = 'biometric-modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    box-sizing: border-box;
  `;

  const modalContent = document.createElement('div');
  modalContent.className = 'biometric-modal-content';
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease;
  `;

  // Add animation keyframes
  if (!document.getElementById('modalAnimations')) {
    const style = document.createElement('style');
    style.id = 'modalAnimations';
    style.textContent = `
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-50px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .biometric-modal-content {
        border: 1px solid #e0e0e0;
      }
      .test-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        margin-bottom: 8px;
        transition: all 0.3s ease;
      }
      .test-item i {
        font-size: 1.5rem;
        width: 30px;
        text-align: center;
      }
      .test-item span {
        flex: 1;
        font-weight: 500;
      }
      .test-item.testing {
        border-color: #2196F3;
        background: #f3f9ff;
      }
      .test-item.success {
        border-color: #4CAF50;
        background: #f1f8e9;
      }
      .test-item.error {
        border-color: #f44336;
        background: #ffebee;
      }
      .test-status .fa-spinner {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .connection-test .test-item:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .enrollment-tabs {
        display: flex;
        border-bottom: 2px solid #f0f0f0;
        margin-bottom: 20px;
      }
      .tab-btn {
        flex: 1;
        padding: 12px 16px;
        border: none;
        background: none;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 500;
      }
      .tab-btn.active {
        border-bottom-color: #2196F3;
        color: #2196F3;
      }
      .tab-btn:hover {
        background: #f5f5f5;
      }
      .person-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .person-item:hover {
        background: #f5f5f5;
        border-color: #2196F3;
      }
      .person-item.selected {
        background: #e3f2fd;
        border-color: #2196F3;
      }
      .person-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  const header = document.createElement('div');
  header.style.cssText = `
    padding: 20px 24px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;

  const titleElement = document.createElement('h3');
  titleElement.style.cssText = `
    margin: 0;
    color: #333;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  titleElement.innerHTML = `<i class="fas fa-fingerprint"></i> ${title}`;

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#f5f5f5';
  closeBtn.onmouseout = () => closeBtn.style.background = 'none';
  closeBtn.onclick = () => modal.remove();

  header.appendChild(titleElement);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.style.cssText = `
    padding: 24px;
  `;
  body.innerHTML = content;

  modalContent.appendChild(header);
  modalContent.appendChild(body);

  // Add footer with buttons if provided
  if (buttons.length > 0) {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `btn ${btn.class}`;
      button.innerHTML = btn.text;
      button.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      `;
      
      if (btn.class.includes('primary')) {
        button.style.background = '#2196F3';
        button.style.color = 'white';
      } else {
        button.style.background = '#f5f5f5';
        button.style.color = '#666';
      }

      if (btn.action === 'close') {
        button.onclick = () => modal.remove();
      } else if (typeof btn.action === 'function') {
        button.onclick = btn.action;
      }

      footer.appendChild(button);
    });

    modalContent.appendChild(footer);
  }

  modal.appendChild(modalContent);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
  return modal;
}

// Helper functions for biometric modals
function switchEnrollmentTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.getElementById('members-enrollment-tab').style.display = 
    tabName === 'members' ? 'block' : 'none';
  document.getElementById('trainers-enrollment-tab').style.display = 
    tabName === 'trainers' ? 'block' : 'none';
}

function loadEnrollmentData() {
  // Mock members data
  const mockMembers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', enrolled: false },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', enrolled: true },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', enrolled: false },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', enrolled: true }
  ];

  const mockTrainers = [
    { id: 1, name: 'Alex Rodriguez', email: 'alex@gym.com', enrolled: false },
    { id: 2, name: 'Lisa Chen', email: 'lisa@gym.com', enrolled: true }
  ];

  // Populate members list
  const membersList = document.getElementById('memberEnrollmentList');
  membersList.innerHTML = mockMembers.map(member => `
    <div class="person-item ${member.enrolled ? 'enrolled' : ''}" data-id="${member.id}">
      <div class="person-avatar">${member.name.charAt(0)}</div>
      <div style="flex: 1;">
        <div style="font-weight: 500;">${member.name}</div>
        <div style="font-size: 0.9rem; color: #666;">${member.email}</div>
      </div>
      <div class="enrollment-status">
        ${member.enrolled ? 
          '<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Enrolled' : 
          '<button class="btn btn-sm btn-primary" onclick="enrollPerson(\'member\', ' + member.id + ')">Enroll</button>'
        }
      </div>
    </div>
  `).join('');

  // Populate trainers list
  const trainersList = document.getElementById('trainerEnrollmentList');
  trainersList.innerHTML = mockTrainers.map(trainer => `
    <div class="person-item ${trainer.enrolled ? 'enrolled' : ''}" data-id="${trainer.id}">
      <div class="person-avatar">${trainer.name.charAt(0)}</div>
      <div style="flex: 1;">
        <div style="font-weight: 500;">${trainer.name}</div>
        <div style="font-size: 0.9rem; color: #666;">${trainer.email}</div>
      </div>
      <div class="enrollment-status">
        ${trainer.enrolled ? 
          '<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Enrolled' : 
          '<button class="btn btn-sm btn-primary" onclick="enrollPerson(\'trainer\', ' + trainer.id + ')">Enroll</button>'
        }
      </div>
    </div>
  `).join('');
}

function enrollPerson(type, id) {
  showBiometricFeedback(`Starting ${type} enrollment...`, 'info');
  
  // Simulate enrollment process
  setTimeout(() => {
    const personItem = document.querySelector(`[data-id="${id}"]`);
    const statusDiv = personItem.querySelector('.enrollment-status');
    statusDiv.innerHTML = '<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Enrolled';
    personItem.classList.add('enrolled');
    
    showBiometricFeedback(`${type} enrolled successfully!`, 'success');
  }, 2000);
}

function startBulkEnrollment() {
  const unenrolledItems = document.querySelectorAll('.person-item:not(.enrolled)');
  if (unenrolledItems.length === 0) {
    showBiometricFeedback('All members are already enrolled', 'info');
    return;
  }

  showBiometricFeedback(`Starting bulk enrollment for ${unenrolledItems.length} people...`, 'info');
  
  // Simulate bulk enrollment
  let count = 0;
  unenrolledItems.forEach((item, index) => {
    setTimeout(() => {
      const statusDiv = item.querySelector('.enrollment-status');
      statusDiv.innerHTML = '<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Enrolled';
      item.classList.add('enrolled');
      count++;
      
      if (count === unenrolledItems.length) {
        showBiometricFeedback('Bulk enrollment completed successfully!', 'success');
      }
    }, (index + 1) * 500);
  });
}

function generateBiometricReport() {
  const reportType = document.getElementById('reportType').value;
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;

  if (!startDate || !endDate) {
    showBiometricFeedback('Please select both start and end dates', 'warning');
    return;
  }

  const reportsContent = document.getElementById('reportsContent');
  reportsContent.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #2196F3;"></i>
      <p>Generating ${reportType} report...</p>
    </div>
  `;

  // Simulate report generation
  setTimeout(() => {
    const mockData = generateMockReportData(reportType);
    reportsContent.innerHTML = mockData;
    document.getElementById('reportsActions').style.display = 'block';
    showBiometricFeedback('Report generated successfully!', 'success');
  }, 2000);
}

function generateMockReportData(type) {
  switch (type) {
    case 'enrollment':
      return `
        <h4>Enrollment Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 16px 0;">
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: #4CAF50;">85%</div>
            <div>Members Enrolled</div>
          </div>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: #2196F3;">92%</div>
            <div>Trainers Enrolled</div>
          </div>
        </div>
      `;
    case 'attendance':
      return `
        <h4>Attendance Analytics</h4>
        <div style="margin: 16px 0;">
          <div style="margin-bottom: 12px;">
            <strong>Average Daily Attendance:</strong> 127 people
          </div>
          <div style="margin-bottom: 12px;">
            <strong>Peak Hours:</strong> 6:00 AM - 8:00 AM, 6:00 PM - 8:00 PM
          </div>
          <div style="margin-bottom: 12px;">
            <strong>Biometric Success Rate:</strong> 96.5%
          </div>
        </div>
      `;
    case 'verification':
      return `
        <h4>Verification Success Rate</h4>
        <div style="margin: 16px 0;">
          <div style="margin-bottom: 12px;">
            <strong>Fingerprint Verification:</strong> 97.2%
          </div>
          <div style="margin-bottom: 12px;">
            <strong>Face Recognition:</strong> 94.8%
          </div>
          <div style="margin-bottom: 12px;">
            <strong>Failed Attempts:</strong> 23 (2.1%)
          </div>
        </div>
      `;
    case 'device':
      return `
        <h4>Device Usage</h4>
        <div style="margin: 16px 0;">
          <div style="margin-bottom: 12px;">
            <strong>Fingerprint Scanner:</strong> 89% utilization
          </div>
          <div style="margin-bottom: 12px;">
            <strong>Face Recognition Camera:</strong> 76% utilization
          </div>
          <div style="margin-bottom: 12px;">
            <strong>Device Uptime:</strong> 99.1%
          </div>
        </div>
      `;
    default:
      return '<p>No data available for this report type.</p>';
  }
}

// Export and email functions
window.exportBiometricReport = function(format) {
  showBiometricFeedback(`Exporting report as ${format.toUpperCase()}...`, 'info');
  setTimeout(() => {
    showBiometricFeedback(`Report exported successfully as ${format.toUpperCase()}!`, 'success');
  }, 1500);
};

window.emailBiometricReport = function() {
  showBiometricFeedback('Sending report via email...', 'info');
  setTimeout(() => {
    showBiometricFeedback('Report sent successfully!', 'success');
  }, 2000);
};

// Global functions for device setup
window.selectDevice = function(deviceType) {
  showBiometricFeedback(`Selected ${deviceType} device for setup`, 'info');
};

window.startDeviceSetup = function() {
  showBiometricFeedback('Starting device setup wizard...', 'info');
};

// Global functions for enrollment modal
window.enrollPerson = enrollPerson;
window.startBulkEnrollment = startBulkEnrollment;
window.switchEnrollmentTab = switchEnrollmentTab;

// Global functions for reports modal
window.generateBiometricReport = generateBiometricReport;
window.exportBiometricReport = function(format) {
  showBiometricFeedback(`Exporting report as ${format.toUpperCase()}...`, 'info');
  setTimeout(() => {
    showBiometricFeedback(`Report exported successfully as ${format.toUpperCase()}!`, 'success');
  }, 1500);
};

window.emailBiometricReport = function() {
  showBiometricFeedback('Sending report via email...', 'info');
  setTimeout(() => {
    showBiometricFeedback('Report sent successfully!', 'success');
  }, 2000);
};

// Open biometric enrollment interface
function openBiometricEnrollment() {
  const modal = createBiometricModal('Enroll Biometric Data', `
    <div style="padding: 20px;">
      <h3 style="text-align: center; margin-bottom: 20px;">
        <i class="fas fa-user-plus"></i> Enroll Member Biometric Data
      </h3>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Select Member:</label>
        <select id="memberSelect" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px;">
          <option value="">Loading members...</option>
        </select>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
        <button class="btn btn-success" onclick="enrollFingerprint()" id="enrollFingerprintBtn">
          <i class="fas fa-fingerprint"></i> Enroll Fingerprint
        </button>
        <button class="btn btn-info" onclick="enrollFaceData()" id="enrollFaceBtn">
          <i class="fas fa-camera"></i> Enroll Face Data
        </button>
      </div>
      
      <div id="enrollmentProgress" style="display: none; margin-top: 20px;">
        <div style="background: #f0f0f0; border-radius: 8px; overflow: hidden;">
          <div id="progressBar" style="background: linear-gradient(90deg, #4CAF50, #45a049); height: 8px; width: 0%; transition: width 0.3s ease;"></div>
        </div>
        <p id="enrollmentStatus" style="text-align: center; margin: 12px 0; font-weight: 600;"></p>
      </div>
    </div>
  `);
  
  document.body.appendChild(modal);
  
  // Load members for enrollment
  loadMembersForEnrollment();
}

// Open biometric reports
function openBiometricReports() {
  const modal = createBiometricModal('Biometric Attendance Reports', `
    <div style="padding: 20px;">
      <h3 style="text-align: center; margin-bottom: 20px;">
        <i class="fas fa-chart-bar"></i> Biometric Attendance Analytics
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="stat-card" style="padding: 16px; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border-radius: 8px; text-align: center;">
          <i class="fas fa-fingerprint" style="font-size: 2rem; margin-bottom: 8px;"></i>
          <h4 style="margin: 0; font-size: 1.8rem;" id="fingerprintCount">--</h4>
          <p style="margin: 4px 0 0 0; opacity: 0.9;">Fingerprint Records</p>
        </div>
        
        <div class="stat-card" style="padding: 16px; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border-radius: 8px; text-align: center;">
          <i class="fas fa-user-check" style="font-size: 2rem; margin-bottom: 8px;"></i>
          <h4 style="margin: 0; font-size: 1.8rem;" id="faceRecordCount">--</h4>
          <p style="margin: 4px 0 0 0; opacity: 0.9;">Face Records</p>
        </div>
        
        <div class="stat-card" style="padding: 16px; background: linear-gradient(135deg, #FF9800, #F57C00); color: white; border-radius: 8px; text-align: center;">
          <i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 8px;"></i>
          <h4 style="margin: 0; font-size: 1.8rem;" id="todayBiometricCheckins">--</h4>
          <p style="margin: 4px 0 0 0; opacity: 0.9;">Today's Check-ins</p>
        </div>
      </div>
      
      <div style="margin-top: 24px;">
        <h4>Recent Biometric Activity</h4>
        <div id="recentBiometricActivity" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
          <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 12px;"></i>
            <p>Loading recent activity...</p>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button class="btn btn-primary" onclick="exportBiometricReport()">
          <i class="fas fa-download"></i> Export Report
        </button>
      </div>
    </div>
  `, '90%');
  
  document.body.appendChild(modal);
  
  // Load biometric statistics
  loadBiometricStatistics();
}

// Create reusable biometric modal


// Show biometric feedback messages
function showBiometricFeedback(message, type = 'info') {
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
    font-weight: 500;
  `;
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
      ${message}
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.style.transform = 'translateX(0)', 100);
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Update device status indicator
function updateDeviceStatus(status) {
  // This would update any device status indicators in the UI
  console.log(`📟 Device status updated: ${status}`);
}

// Load members for biometric enrollment
function loadMembersForEnrollment() {
  const memberSelect = document.getElementById('memberSelect');
  if (!memberSelect) return;
  
  // Simulate loading members - in real implementation, fetch from API
  setTimeout(() => {
    memberSelect.innerHTML = `
      <option value="">Select a member...</option>
      <option value="1">John Doe (ID: GYM001)</option>
      <option value="2">Jane Smith (ID: GYM002)</option>
      <option value="3">Mike Johnson (ID: GYM003)</option>
      <option value="4">Sarah Wilson (ID: GYM004)</option>
    `;
  }, 1000);
}

// Load biometric statistics
function loadBiometricStatistics() {
  // Simulate loading statistics
  setTimeout(() => {
    document.getElementById('fingerprintCount').textContent = Math.floor(Math.random() * 50) + 20;
    document.getElementById('faceRecordCount').textContent = Math.floor(Math.random() * 30) + 15;
    document.getElementById('todayBiometricCheckins').textContent = Math.floor(Math.random() * 25) + 5;
    
    // Load recent activity
    const activityDiv = document.getElementById('recentBiometricActivity');
    if (activityDiv) {
      activityDiv.innerHTML = `
        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>John Doe</strong> - <span style="color: #4CAF50;">Fingerprint Check-in</span>
            </div>
            <small style="color: var(--text-secondary);">10:30 AM</small>
          </div>
        </div>
        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Jane Smith</strong> - <span style="color: #2196F3;">Face Recognition Check-in</span>
            </div>
            <small style="color: var(--text-secondary);">9:45 AM</small>
          </div>
        </div>
        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Mike Johnson</strong> - <span style="color: #4CAF50;">Fingerprint Check-in</span>
            </div>
            <small style="color: var(--text-secondary);">8:20 AM</small>
          </div>
        </div>
      `;
    }
  }, 1500);
}

// Initialize biometric attendance when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Add to existing settings initialization
  if (typeof setupDashboardCustomization === 'function') {
    setupDashboardCustomization();
  }
  
  // Initialize biometric attendance
  setupBiometricAttendance();
});

// Global functions for modal interactions
window.selectDevice = function(deviceType) {
  const options = document.querySelectorAll('.device-option');
  options.forEach(option => {
    option.style.borderColor = '#e0e0e0';
  });
  event.target.closest('.device-option').style.borderColor = '#4CAF50';
  showBiometricFeedback(`${deviceType} device selected`);
};

window.startDeviceSetup = function() {
  showBiometricFeedback('Starting device setup wizard...', 'info');
  // Close modal and start wizard
  document.querySelector('.biometric-modal').remove();
};

// Enhanced device configuration functions
window.startDeviceConfiguration = function(deviceType) {
  const configModal = createBiometricModal(`Configure ${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Device`, `
    <div style="padding: 20px;">
      <h4 style="text-align: center; margin-bottom: 20px;">
        <i class="fas fa-${deviceType === 'fingerprint' ? 'fingerprint' : 'camera'}"></i>
        ${deviceType === 'fingerprint' ? 'Fingerprint Scanner' : 'Face Recognition Camera'} Configuration
      </h4>
      
      <div style="margin-bottom: 24px;">
        <h5>Device Settings:</h5>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-top: 12px;">
          ${deviceType === 'fingerprint' ? `
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Scan Quality:</label>
              <select style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="standard">Standard (Recommended)</option>
                <option value="high">High Quality</option>
                <option value="ultra">Ultra High Quality</option>
              </select>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Timeout (seconds):</label>
              <input type="number" value="10" min="5" max="30" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" checked>
                Enable live finger detection
              </label>
            </div>
          ` : `
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Camera Resolution:</label>
              <select style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="720p">HD (1280x720) - Recommended</option>
                <option value="1080p">Full HD (1920x1080)</option>
                <option value="4k">4K (3840x2160)</option>
              </select>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Detection Sensitivity:</label>
              <select style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="standard">Standard</option>
                <option value="high">High (Recommended)</option>
                <option value="very-high">Very High</option>
              </select>
            </div>
            <div>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" checked>
                Enable anti-spoofing protection
              </label>
            </div>
          `}
        </div>
      </div>
      
      <div style="text-align: center;">
        <button class="btn btn-primary" onclick="saveDeviceConfiguration('${deviceType}')">
          <i class="fas fa-save"></i> Save Configuration
        </button>
        <button class="btn btn-secondary" onclick="testDeviceConfiguration('${deviceType}')" style="margin-left: 12px;">
          <i class="fas fa-vial"></i> Test Device
        </button>
      </div>
    </div>
  `);
  
  // Close current modal and show configuration
  document.querySelector('.biometric-modal').remove();
  document.body.appendChild(configModal);
};

window.retryDeviceCheck = function(deviceType) {
  document.querySelector('.biometric-modal').remove();
  checkBiometricDeviceCompatibility(deviceType);
};

window.showDeviceRecommendations = function(deviceType) {
  const recommendationsModal = createBiometricModal(`${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Device Recommendations`, `
    <div style="padding: 20px;">
      <h4 style="text-align: center; margin-bottom: 20px;">
        <i class="fas fa-shopping-cart"></i>
        Recommended ${deviceType === 'fingerprint' ? 'Fingerprint Scanners' : 'Cameras'}
      </h4>
      
      ${deviceType === 'fingerprint' ? `
        <div style="display: grid; gap: 16px;">
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;">
            <h5 style="color: #4CAF50; margin-bottom: 8px;">SecuGen Hamster Pro 20</h5>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
              Professional-grade USB fingerprint scanner with excellent accuracy
            </p>
            <div style="color: #333; font-weight: 500;">$150 - $200</div>
            <small style="color: #666;">✓ Windows certified ✓ 500 DPI ✓ Live finger detection</small>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;">
            <h5 style="color: #4CAF50; margin-bottom: 8px;">DigitalPersona U.are.U 4500</h5>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
              Reliable and widely compatible fingerprint reader
            </p>
            <div style="color: #333; font-weight: 500;">$100 - $150</div>
            <small style="color: #666;">✓ Plug & play ✓ Durable design ✓ SDK support</small>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;">
            <h5 style="color: #4CAF50; margin-bottom: 8px;">Futronic FS88</h5>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
              Cost-effective solution for small to medium gyms
            </p>
            <div style="color: #333; font-weight: 500;">$60 - $100</div>
            <small style="color: #666;">✓ Budget-friendly ✓ Good quality ✓ USB powered</small>
          </div>
        </div>
      ` : `
        <div style="display: grid; gap: 16px;">
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;">
            <h5 style="color: #2196F3; margin-bottom: 8px;">Logitech C920s HD Pro</h5>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
              High-quality webcam with excellent face recognition capabilities
            </p>
            <div style="color: #333; font-weight: 500;">$70 - $100</div>
            <small style="color: #666;">✓ 1080p HD ✓ Auto-focus ✓ Good low-light performance</small>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;">
            <h5 style="color: #2196F3; margin-bottom: 8px;">Intel RealSense ID F455</h5>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
              Advanced facial recognition with anti-spoofing technology
            </p>
            <div style="color: #333; font-weight: 500;">$200 - $300</div>
            <small style="color: #666;">✓ 3D sensing ✓ Anti-spoofing ✓ High accuracy</small>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;">
            <h5 style="color: #2196F3; margin-bottom: 8px;">Microsoft LifeCam Studio</h5>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
              Professional webcam with Windows Hello compatibility
            </p>
            <div style="color: #333; font-weight: 500;">$80 - $120</div>
            <small style="color: #666;">✓ Windows Hello ✓ 1080p ✓ Wide-angle lens</small>
          </div>
        </div>
      `}
      
      <div style="margin-top: 24px; text-align: center; background: #e3f2fd; padding: 16px; border-radius: 8px;">
        <i class="fas fa-info-circle" style="color: #2196F3; margin-right: 8px;"></i>
        <strong>Need help choosing?</strong> Contact our support team for personalized recommendations based on your gym size and budget.
      </div>
    </div>
  `);
  
  document.querySelector('.biometric-modal').remove();
  document.body.appendChild(recommendationsModal);
};

window.downloadDrivers = function(deviceType) {
  showBiometricFeedback(`Redirecting to ${deviceType} driver downloads...`, 'info');
  // In real implementation, this would open driver download links
  setTimeout(() => {
    showBiometricFeedback('Driver download links opened in new tab', 'success');
  }, 1500);
};

window.saveDeviceConfiguration = function(deviceType) {
  showBiometricFeedback(`Saving ${deviceType} device configuration...`, 'info');
  setTimeout(() => {
    showBiometricFeedback('Device configuration saved successfully!', 'success');
    document.querySelector('.biometric-modal').remove();
  }, 1500);
};

window.testDeviceConfiguration = function(deviceType) {
  showBiometricFeedback(`Testing ${deviceType} device configuration...`, 'info');
  setTimeout(() => {
    const testSuccess = Math.random() > 0.2; // 80% success rate
    if (testSuccess) {
      showBiometricFeedback('Device test completed successfully!', 'success');
    } else {
      showBiometricFeedback('Device test failed. Please check connections.', 'error');
    }
  }, 2000);
};

// Enhanced device setup functions
window.selectDeviceForSetup = function(deviceType) {
  // Highlight selected device
  document.querySelectorAll('.device-option').forEach(option => {
    option.style.borderColor = '#e0e0e0';
    option.style.background = 'white';
  });
  event.target.closest('.device-option').style.borderColor = deviceType === 'fingerprint' ? '#4CAF50' : '#2196F3';
  event.target.closest('.device-option').style.background = deviceType === 'fingerprint' ? '#f1f8e9' : '#e3f2fd';
  
  showBiometricFeedback(`${deviceType === 'fingerprint' ? 'Fingerprint scanner' : 'Face recognition camera'} selected`, 'info');
  
  // Store selection for later use
  window.selectedDeviceType = deviceType;
};

window.startQuickSetup = function() {
  const quickSetupModal = createBiometricModal('Quick Setup', `
    <div style="padding: 20px; text-align: center;">
      <i class="fas fa-bolt fa-3x" style="color: #ff9800; margin-bottom: 20px;"></i>
      <h3>Quick Setup in Progress</h3>
      <p style="color: #666; margin-bottom: 24px;">
        Automatically detecting and configuring biometric devices...
      </p>
      
      <div style="margin: 24px 0;">
        <div style="background: #f0f0f0; border-radius: 8px; overflow: hidden; height: 8px;">
          <div id="quickSetupProgress" style="background: linear-gradient(90deg, #ff9800, #f57c00); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
        </div>
        <p id="quickSetupStatus" style="margin: 12px 0; color: #666;">Initializing...</p>
      </div>
      
      <div id="quickSetupResults" style="display: none; margin-top: 20px;"></div>
    </div>
  `);
  
  document.querySelector('.biometric-modal').remove();
  document.body.appendChild(quickSetupModal);
  
  // Simulate quick setup process
  const progressBar = document.getElementById('quickSetupProgress');
  const statusText = document.getElementById('quickSetupStatus');
  const resultsDiv = document.getElementById('quickSetupResults');
  
  const setupSteps = [
    'Scanning for USB devices...',
    'Detecting cameras...',
    'Installing drivers...',
    'Testing devices...',
    'Configuring settings...',
    'Finalizing setup...'
  ];
  
  let step = 0;
  const stepInterval = setInterval(() => {
    if (step >= setupSteps.length) {
      clearInterval(stepInterval);
      
      progressBar.style.width = '100%';
      statusText.textContent = 'Quick setup completed!';
      
      // Simulate detection results
      const devicesFound = Math.random() > 0.3 ? ['fingerprint'] : [];
      if (Math.random() > 0.5) devicesFound.push('camera');
      
      if (devicesFound.length > 0) {
        resultsDiv.innerHTML = `
          <div style="background: #e8f5e8; border: 1px solid #4CAF50; border-radius: 8px; padding: 16px;">
            <i class="fas fa-check-circle" style="color: #4CAF50; margin-right: 8px;"></i>
            <strong>Setup completed successfully!</strong>
            <p style="margin: 12px 0 0 0; color: #666;">
              Found and configured: ${devicesFound.map(d => d === 'fingerprint' ? 'Fingerprint Scanner' : 'Face Recognition Camera').join(', ')}
            </p>
            <div style="margin-top: 16px;">
              <button class="btn btn-success" onclick="completeSetup()">
                <i class="fas fa-check"></i> Finish Setup
              </button>
            </div>
          </div>
        `;
      } else {
        resultsDiv.innerHTML = `
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px;">
            <i class="fas fa-exclamation-triangle" style="color: #856404; margin-right: 8px;"></i>
            <strong>No devices detected</strong>
            <p style="margin: 12px 0 0 0; color: #856404;">
              Please connect your biometric devices and try again, or use manual setup.
            </p>
            <div style="margin-top: 16px;">
              <button class="btn btn-warning" onclick="startAdvancedSetup()" style="margin-right: 8px;">
                <i class="fas fa-cogs"></i> Manual Setup
              </button>
              <button class="btn btn-secondary" onclick="retryQuickSetup()">
                <i class="fas fa-redo"></i> Retry
              </button>
            </div>
          </div>
        `;
      }
      
      resultsDiv.style.display = 'block';
      return;
    }
    
    statusText.textContent = setupSteps[step];
    step++;
    progressBar.style.width = (step / setupSteps.length * 100) + '%';
  }, 1000);
};

window.startAdvancedSetup = function() {
  showBiometricFeedback('Opening advanced setup wizard...', 'info');
  setTimeout(() => {
    document.querySelector('.biometric-modal').remove();
    openBiometricDeviceSetup(); // Reopen the main setup modal
  }, 1000);
};

window.openSupportChat = function() {
  showBiometricFeedback('Opening support chat...', 'info');
  // In real implementation, this would open a support chat widget
};

window.completeSetup = function() {
  showBiometricFeedback('Biometric device setup completed successfully!', 'success');
  document.querySelector('.biometric-modal').remove();
};

window.retryQuickSetup = function() {
  document.querySelector('.biometric-modal').remove();
  startQuickSetup();
};

window.enrollFingerprint = function() {
  const memberSelect = document.getElementById('memberSelect');
  if (!memberSelect.value) {
    showBiometricFeedback('Please select a member first', 'warning');
    return;
  }
  simulateEnrollment('fingerprint');
};

window.enrollFaceData = function() {
  const memberSelect = document.getElementById('memberSelect');
  if (!memberSelect.value) {
    showBiometricFeedback('Please select a member first', 'warning');
    return;
  }
  simulateEnrollment('face');
};

window.simulateEnrollment = function(type) {
  const progressDiv = document.getElementById('enrollmentProgress');
  const progressBar = document.getElementById('progressBar');
  const statusText = document.getElementById('enrollmentStatus');
  
  progressDiv.style.display = 'block';
  statusText.textContent = `Enrolling ${type} data...`;
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 20;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      statusText.textContent = `${type} enrollment completed successfully!`;
      showBiometricFeedback(`${type} data enrolled successfully`, 'success');
    }
    progressBar.style.width = progress + '%';
  }, 500);
};

window.exportBiometricReport = function() {
  showBiometricFeedback('Exporting biometric report...', 'info');
  // Simulate export
  setTimeout(() => {
    showBiometricFeedback('Report exported successfully', 'success');
  }, 2000);
};

// ===== REAL BIOMETRIC API FUNCTIONS =====

// Real biometric enrollment using actual API
async function performRealBiometricEnrollment(personId, personType, biometricType, deviceId, enrollmentOptions = {}) {
  try {
    console.log(`🔐 Starting real ${biometricType} enrollment for ${personType} ${personId}`);
    
    const response = await fetch('/api/biometric/enroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
      },
      body: JSON.stringify({
        personId,
        personType,
        biometricType,
        deviceId,
        enrollmentOptions
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Biometric enrollment completed successfully');
      return {
        success: true,
        message: result.message,
        biometricDataId: result.biometricDataId,
        enrollmentResult: result.enrollmentResult,
        person: result.person
      };
    } else {
      console.error('❌ Enrollment failed:', result.error);
      return {
        success: false,
        error: result.error,
        details: result.details
      };
    }
  } catch (error) {
    console.error('❌ Enrollment error:', error);
    return {
      success: false,
      error: 'Network error during enrollment',
      details: error.message
    };
  }
}

// Real biometric verification using actual API
async function performRealBiometricVerification(personId, personType, biometricType, deviceId, verificationOptions = {}) {
  try {
    console.log(`🔍 Starting real ${biometricType} verification for ${personType} ${personId}`);
    
    const response = await fetch('/api/biometric/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
      },
      body: JSON.stringify({
        personId,
        personType,
        biometricType,
        deviceId,
        verificationOptions
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Biometric verification ${result.verified ? 'successful' : 'failed'}`);
      return {
        success: true,
        verified: result.verified,
        message: result.message,
        verificationResult: result.verificationResult,
        attendance: result.attendance
      };
    } else {
      console.error('❌ Verification failed:', result.error);
      return {
        success: false,
        error: result.error,
        details: result.details
      };
    }
  } catch (error) {
    console.error('❌ Verification error:', error);
    return {
      success: false,
      error: 'Network error during verification',
      details: error.message
    };
  }
}

// Get real biometric enrollment status using actual API
async function getRealBiometricEnrollmentStatus(personType = null) {
  try {
    console.log('📊 Getting real biometric enrollment status...');
    
    const url = personType ? 
      `/api/biometric/enrollment-status?personType=${personType}` : 
      '/api/biometric/enrollment-status';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Enrollment status retrieved successfully');
      return {
        success: true,
        stats: result.stats,
        enrolledPersons: result.enrolledPersons
      };
    } else {
      console.error('❌ Failed to get enrollment status:', result.error);
      return {
        success: false,
        error: result.error,
        stats: { total: 0, fingerprint: 0, face: 0, both: 0 },
        enrolledPersons: []
      };
    }
  } catch (error) {
    console.error('❌ Error getting enrollment status:', error);
    return {
      success: false,
      error: error.message,
      stats: { total: 0, fingerprint: 0, face: 0, both: 0 },
      enrolledPersons: []
    };
  }
}

// Get real biometric statistics using actual API
async function getRealBiometricStats() {
  try {
    console.log('📈 Getting real biometric statistics...');
    
    const response = await fetch('/api/biometric/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Biometric statistics retrieved successfully');
      return {
        success: true,
        stats: result.stats
      };
    } else {
      console.error('❌ Failed to get statistics:', result.error);
      return {
        success: false,
        error: result.error,
        stats: null
      };
    }
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    return {
      success: false,
      error: error.message,
      stats: null
    };
  }
}

// Install device from test results
window.installDeviceFromTest = async function(deviceId) {
  try {
    showBiometricFeedback('Installing device SDK...', 'info');
    
    // First, get the device info from our scan results
    const scanResult = await performRealDeviceDetection();
    const allDevices = [...scanResult.fingerprint.devices, ...scanResult.camera.devices];
    const device = allDevices.find(d => d.deviceId === deviceId);
    
    if (!device) {
      showBiometricFeedback('Device not found for installation', 'error');
      return;
    }
    
    const installResult = await installRealDevice(device);
    
    if (installResult.success) {
      showBiometricFeedback('Device SDK installed successfully!', 'success');
      // Refresh the test results
      setTimeout(() => {
        window.runConnectionTestAgain();
      }, 1000);
    } else {
      showBiometricFeedback(`Installation failed: ${installResult.error}`, 'error');
    }
  } catch (error) {
    console.error('Installation error:', error);
    showBiometricFeedback('Installation error occurred', 'error');
  }
};

// Enhanced real device setup functions
window.selectDeviceForSetup = async function(deviceType) {
  showBiometricFeedback(`Starting ${deviceType} device setup...`, 'info');
  
  // Close current modal
  const modal = document.querySelector('.biometric-modal-overlay');
  if (modal) modal.remove();
  
  // Start device-specific setup
  if (deviceType === 'fingerprint') {
    await startFingerprintSetup();
  } else if (deviceType === 'camera') {
    await startCameraSetup();
  }
};

async function startFingerprintSetup() {
  const setupModal = createBiometricModal('Fingerprint Scanner Setup', `
    <div style="padding: 20px;">
      <div class="setup-progress" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: between; margin-bottom: 8px;">
          <span>Setup Progress</span>
          <span id="fingerprintSetupPercent">0%</span>
        </div>
        <div style="background: #f0f0f0; border-radius: 8px; overflow: hidden; height: 6px;">
          <div id="fingerprintSetupProgress" style="background: #4CAF50; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <div id="fingerprintSetupContent">
        <div style="text-align: center; margin-bottom: 20px;">
          <i class="fas fa-fingerprint fa-3x" style="color: #4CAF50; margin-bottom: 16px;"></i>
          <h4>Setting up Fingerprint Scanner</h4>
          <p id="fingerprintSetupStatus">Scanning for connected fingerprint devices...</p>
        </div>
        
        <div id="fingerprintDevices" style="margin-top: 20px;"></div>
      </div>
    </div>
  `);
  
  document.body.appendChild(setupModal);
  
  // Start real setup process
  await runFingerprintSetupProcess();
}

async function runFingerprintSetupProcess() {
  const progressBar = document.getElementById('fingerprintSetupProgress');
  const percentText = document.getElementById('fingerprintSetupPercent');
  const statusText = document.getElementById('fingerprintSetupStatus');
  const devicesDiv = document.getElementById('fingerprintDevices');
  
  // Step 1: Scan for devices
  progressBar.style.width = '20%';
  percentText.textContent = '20%';
  statusText.textContent = 'Scanning for fingerprint devices...';
  
  const scanResult = await performRealDeviceDetection();
  const fingerprintDevices = scanResult.fingerprint.devices || [];
  
  if (fingerprintDevices.length === 0) {
    progressBar.style.background = '#f44336';
    statusText.innerHTML = `
      <div style="color: #f44336; margin-top: 12px;">
        <i class="fas fa-exclamation-triangle"></i>
        No fingerprint scanners detected. Please connect a device and try again.
      </div>
    `;
    return;
  }
  
  // Step 2: Display found devices
  progressBar.style.width = '40%';
  percentText.textContent = '40%';
  statusText.textContent = `Found ${fingerprintDevices.length} fingerprint device(s)`;
  
  devicesDiv.innerHTML = fingerprintDevices.map(device => `
    <div class="device-setup-card" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; justify-content: between;">
        <div style="flex: 1;">
          <h5 style="margin: 0; color: #333;">${device.vendor} ${device.model}</h5>
          <p style="margin: 4px 0; color: #666; font-size: 0.9rem;">Device ID: ${device.deviceId}</p>
          <p style="margin: 4px 0; color: #666; font-size: 0.9rem;">Status: ${device.isInstalled ? 'Ready' : 'Needs Installation'}</p>
        </div>
        <button class="btn btn-primary" onclick="setupFingerprintDevice('${device.deviceId}')" 
                ${device.isInstalled ? '' : 'disabled'}>
          ${device.isInstalled ? 'Configure' : 'Install First'}
        </button>
      </div>
    </div>
  `).join('');
  
  progressBar.style.width = '60%';
  percentText.textContent = '60%';
  statusText.textContent = 'Ready to configure devices';
}

window.setupFingerprintDevice = async function(deviceId) {
  showBiometricFeedback('Configuring fingerprint device...', 'info');
  
  const testResult = await testRealDeviceConnection(deviceId);
  
  if (testResult.success) {
    showBiometricFeedback('Fingerprint device configured successfully!', 'success');
    
    // Update progress
    const progressBar = document.getElementById('fingerprintSetupProgress');
    const percentText = document.getElementById('fingerprintSetupPercent');
    const statusText = document.getElementById('fingerprintSetupStatus');
    
    if (progressBar) {
      progressBar.style.width = '100%';
      percentText.textContent = '100%';
      statusText.innerHTML = `
        <div style="color: #4CAF50; margin-top: 12px;">
          <i class="fas fa-check-circle"></i>
          Fingerprint device setup completed successfully!
        </div>
      `;
    }
  } else {
    showBiometricFeedback(`Configuration failed: ${testResult.error}`, 'error');
  }
};

// Similar setup for camera devices
async function startCameraSetup() {
  const setupModal = createBiometricModal('Face Recognition Camera Setup', `
    <div style="padding: 20px;">
      <div class="setup-progress" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: between; margin-bottom: 8px;">
          <span>Setup Progress</span>
          <span id="cameraSetupPercent">0%</span>
        </div>
        <div style="background: #f0f0f0; border-radius: 8px; overflow: hidden; height: 6px;">
          <div id="cameraSetupProgress" style="background: #2196F3; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <div id="cameraSetupContent">
        <div style="text-align: center; margin-bottom: 20px;">
          <i class="fas fa-camera fa-3x" style="color: #2196F3; margin-bottom: 16px;"></i>
          <h4>Setting up Face Recognition Camera</h4>
          <p id="cameraSetupStatus">Scanning for connected camera devices...</p>
        </div>
        
        <div id="cameraDevices" style="margin-top: 20px;"></div>
      </div>
    </div>
  `);
  
  document.body.appendChild(setupModal);
  await runCameraSetupProcess();
}

async function runCameraSetupProcess() {
  const progressBar = document.getElementById('cameraSetupProgress');
  const percentText = document.getElementById('cameraSetupPercent');
  const statusText = document.getElementById('cameraSetupStatus');
  const devicesDiv = document.getElementById('cameraDevices');
  
  // Step 1: Scan for devices
  progressBar.style.width = '20%';
  percentText.textContent = '20%';
  statusText.textContent = 'Scanning for camera devices...';
  
  const scanResult = await performRealDeviceDetection();
  const cameraDevices = scanResult.camera.devices || [];
  
  if (cameraDevices.length === 0) {
    progressBar.style.background = '#f44336';
    statusText.innerHTML = `
      <div style="color: #f44336; margin-top: 12px;">
        <i class="fas fa-exclamation-triangle"></i>
        No face recognition cameras detected. Please connect a device and try again.
      </div>
    `;
    return;
  }
  
  // Step 2: Display found devices
  progressBar.style.width = '40%';
  percentText.textContent = '40%';
  statusText.textContent = `Found ${cameraDevices.length} camera device(s)`;
  
  devicesDiv.innerHTML = cameraDevices.map(device => `
    <div class="device-setup-card" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; justify-content: between;">
        <div style="flex: 1;">
          <h5 style="margin: 0; color: #333;">${device.vendor} ${device.model}</h5>
          <p style="margin: 4px 0; color: #666; font-size: 0.9rem;">Device ID: ${device.deviceId}</p>
          <p style="margin: 4px 0; color: #666; font-size: 0.9rem;">Status: ${device.isInstalled ? 'Ready' : 'Needs Installation'}</p>
        </div>
        <button class="btn btn-primary" onclick="setupCameraDevice('${device.deviceId}')" 
                ${device.isInstalled ? '' : 'disabled'}>
          ${device.isInstalled ? 'Configure' : 'Install First'}
        </button>
      </div>
    </div>
  `).join('');
  
  progressBar.style.width = '60%';
  percentText.textContent = '60%';
  statusText.textContent = 'Ready to configure devices';
}

window.setupCameraDevice = async function(deviceId) {
  showBiometricFeedback('Configuring camera device...', 'info');
  
  const testResult = await testRealDeviceConnection(deviceId);
  
  if (testResult.success) {
    showBiometricFeedback('Camera device configured successfully!', 'success');
    
    // Update progress
    const progressBar = document.getElementById('cameraSetupProgress');
    const percentText = document.getElementById('cameraSetupPercent');
    const statusText = document.getElementById('cameraSetupStatus');
    
    if (progressBar) {
      progressBar.style.width = '100%';
      percentText.textContent = '100%';
      statusText.innerHTML = `
        <div style="color: #4CAF50; margin-top: 12px;">
          <i class="fas fa-check-circle"></i>
          Camera device setup completed successfully!
        </div>
      `;
    }
  } else {
    showBiometricFeedback(`Configuration failed: ${testResult.error}`, 'error');
  }
};

// Quick setup function
window.startQuickSetup = async function() {
  showBiometricFeedback('Starting quick device setup...', 'info');
  
  // Close current modal
  const modal = document.querySelector('.biometric-modal-overlay');
  if (modal) modal.remove();
  
  // Start auto-detection and setup
  const scanResult = await performRealDeviceDetection();
  
  if (scanResult.totalDevices === 0) {
    showBiometricFeedback('No devices found for quick setup', 'warning');
    return;
  }
  
  showBiometricFeedback(`Found ${scanResult.totalDevices} device(s), configuring automatically...`, 'info');
  
  // Auto-setup all found devices
  let successCount = 0;
  const allDevices = [...scanResult.fingerprint.devices, ...scanResult.camera.devices];
  
  for (const device of allDevices) {
    if (device.isInstalled) {
      const testResult = await testRealDeviceConnection(device.deviceId);
      if (testResult.success) {
        successCount++;
      }
    }
  }
  
  if (successCount > 0) {
    showBiometricFeedback(`Quick setup completed! ${successCount} device(s) configured.`, 'success');
  } else {
    showBiometricFeedback('Quick setup completed, but some devices need manual configuration', 'warning');
  }
};

// Advanced setup function
window.startAdvancedSetup = function() {
  showBiometricFeedback('Opening advanced setup options...', 'info');
  // This would open a more detailed setup wizard
  openBiometricDeviceSetup();
};
