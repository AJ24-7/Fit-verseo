const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 5001;
const LOG_FILE = path.join(__dirname, 'fitverse-agent.log');

// Simple logging function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    try {
        fs.appendFileSync(LOG_FILE, logMessage + '\n');
    } catch (err) {
        // Ignore file write errors
    }
}

// CORS headers
function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Parse JSON body
function parseJSON(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = body ? JSON.parse(body) : {};
            callback(null, data);
        } catch (err) {
            callback(err, null);
        }
    });
}

// Send JSON response
function sendJSON(res, statusCode, data) {
    setCORSHeaders(res);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    log(`${method} ${path} from ${req.connection.remoteAddress}`);

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        setCORSHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    // Route: Root
    if (path === '/' && method === 'GET') {
        sendJSON(res, 200, {
            status: 'running',
            service: 'Fitverse Biometric Agent',
            version: '2.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
        return;
    }

    // Route: Health check
    if (path === '/health' && method === 'GET') {
        sendJSON(res, 200, {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
        return;
    }

    // Route: Device status
    if (path === '/device/status' && method === 'GET') {
        sendJSON(res, 200, {
            status: 'ready',
            device: 'virtual',
            connected: true,
            message: 'Biometric device ready',
            timestamp: new Date().toISOString()
        });
        return;
    }

    // Route: Enrollment
    if (path === '/enroll' && method === 'POST') {
        parseJSON(req, (err, data) => {
            if (err) {
                log(`ERROR: JSON parse error - ${err.message}`);
                sendJSON(res, 400, { success: false, error: 'Invalid JSON' });
                return;
            }

            const { memberId, memberName, gymId } = data;
            
            if (!memberId) {
                sendJSON(res, 400, { success: false, error: 'Member ID required' });
                return;
            }

            log(`Enrollment: ${memberId} (${memberName}) at gym ${gymId}`);
            
            // Simulate enrollment delay
            setTimeout(() => {
                sendJSON(res, 200, {
                    success: true,
                    memberId: memberId,
                    memberName: memberName || 'Unknown',
                    gymId: gymId,
                    enrollmentId: `ENR_${Date.now()}`,
                    message: 'Enrollment completed',
                    timestamp: new Date().toISOString()
                });
            }, 1000);
        });
        return;
    }

    // Route: Verification
    if (path === '/verify' && method === 'POST') {
        parseJSON(req, (err, data) => {
            if (err) {
                log(`ERROR: JSON parse error - ${err.message}`);
                sendJSON(res, 400, { success: false, error: 'Invalid JSON' });
                return;
            }

            const { gymId } = data;
            log(`Verification at gym ${gymId}`);
            
            // Simulate verification
            setTimeout(() => {
                const verified = Math.random() > 0.2; // 80% success rate
                const memberId = verified ? `MEM_${Math.floor(Math.random() * 1000)}` : null;
                
                sendJSON(res, 200, {
                    success: true,
                    verified: verified,
                    memberId: memberId,
                    memberName: verified ? 'John Doe' : null,
                    gymId: gymId,
                    confidence: verified ? 0.95 : 0.3,
                    message: verified ? 'Verified successfully' : 'Not recognized',
                    timestamp: new Date().toISOString()
                });
            }, 800);
        });
        return;
    }

    // Route: Attendance
    if (path === '/attendance' && method === 'POST') {
        parseJSON(req, (err, data) => {
            if (err) {
                log(`ERROR: JSON parse error - ${err.message}`);
                sendJSON(res, 400, { success: false, error: 'Invalid JSON' });
                return;
            }

            const { memberId, gymId, action } = data;
            
            if (!memberId || !gymId || !action) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Member ID, Gym ID, and action required' 
                });
                return;
            }

            log(`Attendance ${action}: ${memberId} at gym ${gymId}`);
            
            sendJSON(res, 200, {
                success: true,
                memberId: memberId,
                gymId: gymId,
                action: action,
                attendanceId: `ATT_${Date.now()}`,
                timestamp: new Date().toISOString(),
                message: `Attendance ${action} recorded`
            });
        });
        return;
    }

    // Route: Test
    if (path === '/test' && method === 'POST') {
        parseJSON(req, (err, data) => {
            log('Test endpoint called');
            sendJSON(res, 200, {
                success: true,
                message: 'Agent responding correctly',
                data: data || {},
                timestamp: new Date().toISOString()
            });
        });
        return;
    }

    // Route: Logs
    if (path === '/logs' && method === 'GET') {
        try {
            const logs = fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-50);
            sendJSON(res, 200, {
                success: true,
                logs: logs.filter(line => line.trim()),
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            sendJSON(res, 200, {
                success: true,
                logs: ['No logs available'],
                timestamp: new Date().toISOString()
            });
        }
        return;
    }

    // 404 Not Found
    sendJSON(res, 404, {
        success: false,
        error: 'Route not found',
        available: [
            'GET /',
            'GET /health',
            'GET /device/status',
            'POST /enroll',
            'POST /verify',
            'POST /attendance',
            'POST /test',
            'GET /logs'
        ]
    });
});

// Error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        log(`ERROR: Port ${PORT} is already in use`);
        console.log('Checking if another agent is running...');
        
        // Test existing agent
        const testReq = http.get(`http://localhost:${PORT}/health`, (res) => {
            console.log('Another agent is already running and responding');
            process.exit(0);
        });
        
        testReq.on('error', () => {
            console.log('Port is busy but no valid agent found');
            process.exit(1);
        });
        
        testReq.setTimeout(3000, () => {
            testReq.destroy();
            process.exit(1);
        });
    } else {
        log(`ERROR: Server error - ${err.message}`);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    log('Shutting down gracefully...');
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    log('Shutting down gracefully...');
    server.close(() => {
        process.exit(0);
    });
});

// Keep alive
setInterval(() => {
    log('Heartbeat - Agent running normally');
}, 300000); // Every 5 minutes

// Start server
server.listen(PORT, '0.0.0.0', () => {
    log(`Fitverse Biometric Agent v2.0 started on port ${PORT}`);
    log('Agent ready for gym admin system');
    console.log(`✅ Fitverse Biometric Agent running on http://localhost:${PORT}`);
    console.log(`✅ Version: 2.0.0 - Standalone Edition`);
    console.log(`✅ No external dependencies required`);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    log(`UNCAUGHT EXCEPTION: ${err.message}`);
    console.log('Agent continuing...');
});

process.on('unhandledRejection', (reason) => {
    log(`UNHANDLED REJECTION: ${reason}`);
    console.log('Agent continuing...');
});
