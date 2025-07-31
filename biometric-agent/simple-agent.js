const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5001;
const LOG_FILE = path.join(__dirname, 'agent.log');

// Enhanced logging function
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    
    // Write to log file for debugging
    try {
        fs.appendFileSync(LOG_FILE, logMessage + '\n');
    } catch (err) {
        // Ignore file write errors to prevent crash
    }
}

// Robust error handling for service stability
process.on('uncaughtException', (error) => {
    log(`❌ Uncaught Exception: ${error.message}`, 'ERROR');
    log('🔄 Service continuing...', 'WARN');
});

process.on('unhandledRejection', (reason, promise) => {
    log(`❌ Unhandled Rejection: ${reason}`, 'ERROR');
    log('🔄 Service continuing...', 'WARN');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    log('🛑 SIGTERM received, shutting down gracefully', 'INFO');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('� SIGINT received, shutting down gracefully', 'INFO');
    process.exit(0);
});

// Keep process alive
process.on('exit', (code) => {
    log(`🛑 Process exiting with code: ${code}`, 'INFO');
});

// Middleware with enhanced CORS for gym admin system
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:5000', 
        'http://localhost:5500', 
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:3000',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use((req, res, next) => {
    log(`📨 ${req.method} ${req.url} from ${req.ip || req.connection.remoteAddress}`, 'INFO');
    next();
});

// Auto-recovery mechanism
setInterval(() => {
    log('💓 Heartbeat - Service running normally', 'DEBUG');
}, 300000); // Every 5 minutes

// Root endpoint for basic connectivity test
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        service: 'Fitverse Biometric Agent',
        version: '1.0.0',
        uptime: process.uptime(),
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        services: {
            biometric: true,
            fingerprint: true,
            faceRecognition: true
        }
    });
});

// Get logs endpoint for debugging
app.get('/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-100); // Last 100 lines
        res.json({
            success: true,
            logs: logs.filter(line => line.trim()),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.json({
            success: true,
            logs: ['Log file not available'],
            timestamp: new Date().toISOString()
        });
    }
});

// Biometric enrollment endpoint for gym admin
app.post('/enroll', (req, res) => {
    const { memberId, memberName, gymId } = req.body;
    
    log(`📝 Enrollment request for member: ${memberId} (${memberName}) at gym: ${gymId}`, 'INFO');
    
    if (!memberId) {
        return res.status(400).json({
            success: false,
            error: 'Member ID is required'
        });
    }

    // Simulate biometric enrollment
    setTimeout(() => {
        res.json({
            success: true,
            memberId: memberId,
            memberName: memberName || 'Unknown',
            gymId: gymId,
            enrollmentId: `ENR_${Date.now()}`,
            biometricTemplate: `BIO_${memberId}_${Date.now()}`,
            message: 'Biometric enrollment completed successfully',
            timestamp: new Date().toISOString()
        });
        
        log(`✅ Enrollment completed for member: ${memberId}`, 'INFO');
    }, 1000);
});

// Member verification endpoint
app.post('/verify', (req, res) => {
    const { biometricData, gymId } = req.body;
    
    log(`🔍 Verification request at gym: ${gymId}`, 'INFO');
    
    // Simulate biometric verification
    setTimeout(() => {
        // Mock successful verification
        const mockMemberId = `MEM_${Math.floor(Math.random() * 1000)}`;
        
        res.json({
            success: true,
            verified: true,
            memberId: mockMemberId,
            memberName: 'John Doe',
            gymId: gymId,
            confidence: 0.95,
            verificationId: `VER_${Date.now()}`,
            message: 'Member verified successfully',
            timestamp: new Date().toISOString()
        });
        
        log(`✅ Verification successful for member: ${mockMemberId}`, 'INFO');
    }, 800);
});

// Attendance marking endpoint
app.post('/attendance', (req, res) => {
    const { memberId, gymId, action } = req.body;
    
    log(`📋 Attendance ${action} for member: ${memberId} at gym: ${gymId}`, 'INFO');
    
    if (!memberId || !gymId || !action) {
        return res.status(400).json({
            success: false,
            error: 'Member ID, Gym ID, and action are required'
        });
    }

    res.json({
        success: true,
        memberId: memberId,
        gymId: gymId,
        action: action,
        attendanceId: `ATT_${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: `Attendance ${action} recorded successfully`
    });
    
    log(`✅ Attendance ${action} recorded for member: ${memberId}`, 'INFO');
});

// Test endpoint for gym admin integration
app.post('/test', (req, res) => {
    log('🧪 Test endpoint called from gym admin system', 'INFO');
    
    res.json({
        success: true,
        message: 'Biometric agent is responding correctly',
        data: req.body,
        timestamp: new Date().toISOString(),
        agent: 'Fitverse Biometric Agent v1.0.0'
    });
});

// Device install endpoint
app.post('/api/devices/install', (req, res) => {
    const { deviceInfo } = req.body;
    
    // Simulate installation
    setTimeout(() => {
        res.json({
            success: true,
            message: `Device ${deviceInfo.vendor} ${deviceInfo.model} installed successfully`,
            timestamp: new Date().toISOString()
        });
    }, 2000);
});

// Device test endpoint
app.post('/api/devices/test', (req, res) => {
    const { deviceId } = req.body;
    
    // Simulate device test
    res.json({
        success: true,
        deviceId,
        status: 'working',
        message: 'Device test completed successfully',
        timestamp: new Date().toISOString()
    });
});

// Get installed devices
app.get('/api/devices/installed', (req, res) => {
    const installedDevices = [
        {
            id: 'fp001',
            name: 'SecuGen Hamster Pro 20',
            status: 'ready',
            lastSeen: new Date().toISOString()
        },
        {
            id: 'cam001',
            name: 'USB2.0 HD UVC WebCam',
            status: 'ready',
            lastSeen: new Date().toISOString()
        }
    ];

    res.json({
        success: true,
        devices: installedDevices,
        timestamp: new Date().toISOString()
    });
});

// Fingerprint enrollment endpoint
app.post('/api/fingerprint/enroll', (req, res) => {
    const { personId, personType } = req.body;
    
    // Simulate fingerprint enrollment
    setTimeout(() => {
        res.json({
            success: true,
            personId,
            personType,
            templateId: 'fp_' + Date.now(),
            message: 'Fingerprint enrolled successfully',
            timestamp: new Date().toISOString()
        });
    }, 3000);
});

// Face enrollment endpoint
app.post('/api/face/enroll', (req, res) => {
    const { personId, personType } = req.body;
    
    // Simulate face enrollment
    setTimeout(() => {
        res.json({
            success: true,
            personId,
            personType,
            templateId: 'face_' + Date.now(),
            message: 'Face enrolled successfully',
            timestamp: new Date().toISOString()
        });
    }, 3000);
});

// Fingerprint verification endpoint
app.post('/api/fingerprint/verify', (req, res) => {
    const { personId, deviceId } = req.body;
    
    // Simulate fingerprint verification with random success/failure for testing
    setTimeout(() => {
        const isMatch = Math.random() > 0.3; // 70% success rate for testing
        res.json({
            success: true,
            verified: isMatch,
            personId: isMatch ? personId : null,
            confidence: isMatch ? 0.95 : 0.42,
            message: isMatch ? 'Fingerprint verified successfully' : 'Fingerprint not recognized',
            timestamp: new Date().toISOString()
        });
    }, 2000);
});

// Face verification endpoint
app.post('/api/face/verify', (req, res) => {
    const { personId, deviceId } = req.body;
    
    // Simulate face verification with random success/failure for testing
    setTimeout(() => {
        const isMatch = Math.random() > 0.25; // 75% success rate for testing
        res.json({
            success: true,
            verified: isMatch,
            personId: isMatch ? personId : null,
            confidence: isMatch ? 0.92 : 0.38,
            message: isMatch ? 'Face verified successfully' : 'Face not recognized',
            timestamp: new Date().toISOString()
        });
    }, 2500);
});

// Attendance endpoints
app.get('/api/attendance/fingerprint/:personId', (req, res) => {
    const { personId } = req.params;
    
    res.json({
        success: true,
        personId,
        attendanceRecords: [
            {
                timestamp: new Date().toISOString(),
                type: 'check-in',
                method: 'fingerprint',
                confidence: 0.96
            }
        ],
        totalRecords: 1
    });
});

app.get('/api/attendance/face/:personId', (req, res) => {
    const { personId } = req.params;
    
    res.json({
        success: true,
        personId,
        attendanceRecords: [
            {
                timestamp: new Date().toISOString(),
                type: 'check-in',
                method: 'face',
                confidence: 0.93
            }
        ],
        totalRecords: 1
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    log(`❌ Error handling request ${req.method} ${req.url}: ${err.message}`, 'ERROR');
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'The biometric agent encountered an error but is still running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    log(`⚠️ 404 - Route not found: ${req.method} ${req.url}`, 'WARN');
    
    res.status(404).json({
        success: false,
        error: 'Route not found',
        available_endpoints: [
            'GET /',
            'GET /health',
            'GET /logs',
            'POST /enroll',
            'POST /verify',
            'POST /attendance',
            'POST /test',
            'Legacy API endpoints still supported'
        ],
        timestamp: new Date().toISOString()
    });
});

// Start server with enhanced error handling and retry mechanism
function startServer(retries = 3) {
    const server = app.listen(PORT, '0.0.0.0', () => {
        log(`🚀 Fitverse Biometric Agent started successfully on port ${PORT}`, 'INFO');
        log(`🌐 Service URL: http://localhost:${PORT}`, 'INFO');
        log('✅ Ready to serve gym admin system requests', 'INFO');
        log(`� Started at: ${new Date().toISOString()}`, 'INFO');
        log('🔧 Mode: Service/Production', 'INFO');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && retries > 0) {
            log(`⚠️ Port ${PORT} is busy, retrying in 5 seconds... (${retries} retries left)`, 'WARN');
            setTimeout(() => startServer(retries - 1), 5000);
        } else if (err.code === 'EADDRINUSE') {
            log(`❌ Port ${PORT} is in use. Checking if another agent is running...`, 'ERROR');
            
            // Try to connect to existing agent
            const http = require('http');
            const req = http.get(`http://localhost:${PORT}/health`, (res) => {
                log('✅ Existing agent found and responding. Exiting gracefully.', 'INFO');
                process.exit(0);
            });
            
            req.on('error', () => {
                log('❌ Port in use but no valid agent responding. Service may need restart.', 'ERROR');
                process.exit(1);
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                log('❌ Timeout checking existing agent. Exiting.', 'ERROR');
                process.exit(1);
            });
        } else {
            log(`❌ Server error: ${err.message}`, 'ERROR');
            process.exit(1);
        }
    });

    // Graceful shutdown handlers
    server.on('close', () => {
        log('🛑 Server closed', 'INFO');
    });

    // Enhanced graceful shutdown for service management
    process.on('SIGINT', () => {
        log('🛑 Received SIGINT. Gracefully shutting down...', 'INFO');
        server.close(() => {
            log('✅ Server closed successfully', 'INFO');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        log('🛑 Received SIGTERM. Gracefully shutting down...', 'INFO');
        server.close(() => {
            log('✅ Server closed successfully', 'INFO');
            process.exit(0);
        });
    });

    return server;
}

// Initialize server
log('🔧 Initializing Fitverse Biometric Agent...', 'INFO');
startServer();

// Health monitoring for auto-recovery
setInterval(() => {
    try {
        // Simple internal health check
        const http = require('http');
        const req = http.get(`http://localhost:${PORT}/health`, (res) => {
            if (res.statusCode !== 200) {
                log('⚠️ Health check failed, service may need restart', 'WARN');
            }
        });
        
        req.on('error', (err) => {
            log(`❌ Health check error: ${err.message}`, 'ERROR');
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
        });
    } catch (err) {
        log(`❌ Auto-recovery check failed: ${err.message}`, 'ERROR');
    }
}, 60000); // Check every minute
