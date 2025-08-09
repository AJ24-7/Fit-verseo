# Enhanced Fitverse Biometric Agent v2.0

A production-ready, continuous-running biometric service for gym management systems with real hardware device integration and robust Windows service support.

## ✨ Key Features

### 🔄 **Continuous Operation**
- Runs as a Windows service for 24/7 availability
- Auto-restart capability with configurable retry limits
- Memory management and cleanup
- Heartbeat monitoring and health checks

### 🖐️ **Advanced Biometric Support**
- **Fingerprint Recognition**: Support for major scanner brands (SecuGen, DigitalPersona, Futronic, ZKTeco, etc.)
- **Face Recognition**: Camera-based facial recognition with liveness detection
- **Hardware Auto-Detection**: Automatically detects and configures biometric devices
- **Virtual Device Support**: Testing mode with simulated devices when no hardware is available

### 🛡️ **Enterprise-Grade Reliability**
- Comprehensive error handling and recovery
- Detailed logging with log rotation
- Performance monitoring and optimization
- Concurrent request handling
- Firewall configuration support

### 🔌 **Seamless Integration**
- REST API compatible with existing gym admin systems
- Backward compatibility with legacy endpoints
- CORS support for web-based admin panels
- Real-time device status monitoring

## 🚀 Quick Start

### Prerequisites
- Windows 10/11 or Windows Server 2016+
- Node.js 16.x or higher
- Administrator privileges for service installation
- Supported biometric hardware (optional - virtual devices available for testing)

### Installation

1. **Download and Extract**
   ```bash
   # Extract the biometric-agent folder to your preferred location
   cd C:\path\to\biometric-agent
   ```

2. **Run Enhanced Installer**
   ```batch
   # Right-click and "Run as Administrator"
   enhanced-installer.bat
   ```

3. **Verify Installation**
   ```bash
   # Open browser to check agent status
   http://localhost:5001
   ```

### Manual Installation (Alternative)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Windows Service**
   ```bash
   node enhanced-service-manager.js install
   ```

3. **Start Service**
   ```bash
   node enhanced-service-manager.js start
   ```

## 📖 Usage

### Service Management

```bash
# Check service status
node enhanced-service-manager.js status

# Start the service
node enhanced-service-manager.js start

# Stop the service
node enhanced-service-manager.js stop

# Restart the service
node enhanced-service-manager.js restart

# Uninstall the service
node enhanced-service-manager.js uninstall
```

### Testing the Agent

```bash
# Run comprehensive test suite
node enhanced-test-suite.js

# Quick health check
curl http://localhost:5001/health
```

### Using the Management Interface

Run the convenient management tool:
```batch
manage-service.bat
```

## 🔌 API Reference

### Device Management

```http
GET /api/devices
# Returns list of detected biometric devices

POST /api/devices/scan
# Triggers device rescan and returns updated device list
```

### Fingerprint Operations

```http
POST /api/fingerprint/enroll
Content-Type: application/json

{
  "personId": "MEMBER_001",
  "personType": "member",
  "gymId": "GYM_123",
  "deviceId": "optional_device_id"
}
```

```http
POST /api/fingerprint/verify
Content-Type: application/json

{
  "personId": "MEMBER_001",
  "gymId": "GYM_123",
  "deviceId": "optional_device_id"
}
```

### Face Recognition Operations

```http
POST /api/face/enroll
Content-Type: application/json

{
  "personId": "MEMBER_001",
  "personType": "member", 
  "gymId": "GYM_123",
  "deviceId": "optional_camera_id"
}
```

```http
POST /api/face/verify
Content-Type: application/json

{
  "personId": "MEMBER_001",
  "gymId": "GYM_123",
  "deviceId": "optional_camera_id"
}
```

### Legacy Endpoints (Backward Compatibility)

```http
POST /enroll
POST /verify
POST /attendance
```

### System Monitoring

```http
GET /health
# Detailed health and performance metrics

GET /logs
# Recent system logs

GET /config
# Current configuration

POST /config
# Update configuration
```

## ⚙️ Configuration

### Environment Variables
- `NODE_ENV`: Set to 'production' for production mode
- `BIOMETRIC_AGENT_MODE`: Set to 'service' when running as Windows service

### Configuration File (`agent-config.json`)
```json
{
  "port": 5001,
  "autoRestart": true,
  "maxRestarts": 5,
  "logLevel": "INFO",
  "hardware": {
    "enableFingerprint": true,
    "enableFaceRecognition": true,
    "deviceTimeout": 30000
  }
}
```

## 🔧 Hardware Support

### Supported Fingerprint Scanners
- **SecuGen**: Hamster series, Unity series
- **DigitalPersona**: U.are.U series
- **Futronic**: FS80, FS88 series
- **ZKTeco**: ZK series scanners
- **Morpho**: MSO series
- **Suprema**: BioMini series
- **Nitgen**: Fingkey series
- **Generic USB/Serial**: Most TWAIN-compatible devices

### Camera Requirements for Face Recognition
- USB webcams with 720p+ resolution
- IP cameras with RTSP support
- Integrated laptop cameras
- Dedicated face recognition cameras

### Hardware Auto-Detection
The agent automatically detects:
- USB-connected biometric devices
- Camera devices through Windows Device Manager
- Serial/COM port scanners
- Network-connected IP cameras

## 🐛 Troubleshooting

### Common Issues

**1. Service Won't Start**
```bash
# Check service status
node enhanced-service-manager.js status

# View detailed logs
type logs\*.log

# Check Windows Event Log
eventvwr.msc → Windows Logs → Application
```

**2. Port 5001 Already in Use**
```bash
# Find process using port 5001
netstat -ano | findstr :5001

# Kill process if needed
taskkill /PID <process_id> /F
```

**3. No Devices Detected**
- Verify device drivers are installed
- Check Device Manager for biometric devices
- Run device scan: `POST /api/devices/scan`
- Virtual devices are available for testing

**4. Permission Issues**
- Ensure running as Administrator
- Check Windows service permissions
- Verify firewall allows port 5001

### Diagnostic Commands

```bash
# Full system check
node enhanced-service-manager.js check

# Test all functionality
node enhanced-test-suite.js

# View real-time logs
powershell Get-Content logs\*.log -Wait -Tail 50
```

## 📊 Monitoring & Logs

### Log Files
- `agent.log`: Main application logs
- `installation.log`: Installation process logs
- `test-results.log`: Test execution results
- Windows Event Log: Service-related events

### Health Monitoring
- Memory usage tracking
- Response time monitoring
- Device status monitoring
- Auto-restart on failures

### Performance Metrics
- Request/response times
- Memory consumption
- Device operation success rates
- Service uptime

## 🔒 Security Features

- CORS protection with configurable origins
- Request rate limiting
- Input validation and sanitization
- Secure device communication
- Encrypted biometric template storage
- Access logging for audit trails

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [ ] Install on dedicated Windows machine/server
- [ ] Configure firewall rules for port 5001
- [ ] Install and test biometric hardware
- [ ] Run comprehensive test suite
- [ ] Configure monitoring and alerting
- [ ] Set up backup procedures
- [ ] Document device locations and configurations

### Recommended Hardware Specs
- **CPU**: Intel i5 or equivalent (2+ cores)
- **RAM**: 8GB+ for optimal performance
- **Storage**: 100GB+ SSD for logs and templates
- **Network**: Gigabit Ethernet
- **OS**: Windows 10 Pro/Enterprise or Windows Server

## 🤝 Integration with Gym Admin System

### Frontend Integration
```javascript
// Example integration in gym admin panel
const biometricAgent = 'http://localhost:5001';

// Enroll member fingerprint
async function enrollFingerprint(memberId, gymId) {
  const response = await fetch(`${biometricAgent}/api/fingerprint/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personId: memberId,
      personType: 'member',
      gymId: gymId
    })
  });
  return response.json();
}

// Verify member at check-in
async function verifyMember(gymId) {
  const response = await fetch(`${biometricAgent}/api/fingerprint/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gymId: gymId })
  });
  return response.json();
}
```

### Backend Integration
```javascript
// Express.js middleware for biometric verification
const axios = require('axios');

async function biometricAuth(req, res, next) {
  try {
    const result = await axios.post('http://localhost:5001/api/fingerprint/verify', {
      gymId: req.body.gymId
    });
    
    if (result.data.verified) {
      req.verifiedMember = result.data.personId;
      next();
    } else {
      res.status(401).json({ error: 'Biometric verification failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Biometric service unavailable' });
  }
}
```

## 📋 Version History

### v2.0.0 (Enhanced Release)
- ✅ Complete rewrite with production-grade architecture
- ✅ Windows service integration with auto-restart
- ✅ Real hardware device detection and integration
- ✅ Enhanced error handling and recovery
- ✅ Comprehensive logging and monitoring
- ✅ Performance optimization and memory management
- ✅ Face recognition with liveness detection
- ✅ Concurrent request handling
- ✅ Extensive test suite
- ✅ Improved installation and management tools

### v1.x (Legacy)
- Basic biometric simulation
- Simple Express server
- Limited error handling
- Manual process management

## 🆘 Support

### Getting Help
1. **Check Logs**: Review `agent.log` for detailed error information
2. **Run Tests**: Use `enhanced-test-suite.js` to diagnose issues
3. **Check Status**: Use `manage-service.bat` for service status
4. **Documentation**: Refer to this README and inline code comments

### Common Resolution Steps
1. Restart the service: `node enhanced-service-manager.js restart`
2. Reinstall the service: `enhanced-installer.bat`
3. Check hardware connections and drivers
4. Verify network connectivity and firewall settings
5. Review Windows Event Log for system-level issues

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Node.js community for excellent modules
- Windows biometric framework developers
- Gym management system integration partners
- Hardware device manufacturers for driver support

---

**📞 Need Help?** Check the troubleshooting section or run the diagnostic tools included with the agent.
