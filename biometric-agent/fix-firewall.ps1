# Fitverse Agent Service Diagnostics and Firewall Fix
# Run this as Administrator

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Fitverse Agent Service Diagnostics" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "ERROR: Not running as Administrator" -ForegroundColor Red
    Write-Host "INFO: Please run this script as Administrator" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "SUCCESS: Running as Administrator" -ForegroundColor Green
Write-Host ""

# Check service status
Write-Host "INFO: Checking Windows Service..." -ForegroundColor Yellow
try {
    $service = Get-Service -Name "Fitverse Biometric Agent" -ErrorAction Stop
    Write-Host "SUCCESS: Service exists: $($service.Status)" -ForegroundColor Green
    
    if ($service.Status -ne "Running") {
        Write-Host "WARNING: Service not running, attempting to start..." -ForegroundColor Yellow
        try {
            Start-Service -Name "Fitverse Biometric Agent"
            Start-Sleep -Seconds 3
            $service = Get-Service -Name "Fitverse Biometric Agent"
            Write-Host "SUCCESS: Service started: $($service.Status)" -ForegroundColor Green
        } catch {
            Write-Host "ERROR: Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "ERROR: Service not found or not accessible" -ForegroundColor Red
    Write-Host "INFO: Try running install-simple-agent.bat first" -ForegroundColor Yellow
}

Write-Host ""

# Check port 5001
Write-Host "INFO: Checking port 5001..." -ForegroundColor Yellow
$portCheck = netstat -an | Select-String ":5001"
if ($portCheck) {
    Write-Host "SUCCESS: Port 5001 is in use:" -ForegroundColor Green
    $portCheck | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "ERROR: Port 5001 is not in use" -ForegroundColor Red
}

Write-Host ""

# Check Windows Firewall
Write-Host "INFO: Checking Windows Firewall..." -ForegroundColor Yellow
try {
    $firewallRule = Get-NetFirewallRule -DisplayName "*Fitverse*" -ErrorAction SilentlyContinue
    if ($firewallRule) {
        Write-Host "SUCCESS: Firewall rule exists" -ForegroundColor Green
    } else {
        Write-Host "WARNING: No Fitverse firewall rule found" -ForegroundColor Yellow
        Write-Host "INFO: Creating Windows Firewall exception..." -ForegroundColor Cyan
        
        try {
            # Add firewall rules for the agent
            New-NetFirewallRule -DisplayName "Fitverse Biometric Agent - Inbound" -Direction Inbound -Protocol TCP -LocalPort 5001 -Action Allow -Profile Any
            New-NetFirewallRule -DisplayName "Fitverse Biometric Agent - Outbound" -Direction Outbound -Protocol TCP -LocalPort 5001 -Action Allow -Profile Any
            Write-Host "SUCCESS: Firewall rules created successfully" -ForegroundColor Green
        } catch {
            Write-Host "ERROR: Failed to create firewall rules: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "ERROR: Error checking firewall: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test HTTP connection
Write-Host "INFO: Testing HTTP connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -TimeoutSec 10 -UseBasicParsing
    Write-Host "SUCCESS: HTTP connection successful!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "ERROR: HTTP connection failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try simple TCP test
    Write-Host "INFO: Testing TCP connection..." -ForegroundColor Yellow
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", 5001)
        $tcpClient.Close()
        Write-Host "SUCCESS: TCP connection successful" -ForegroundColor Green
        Write-Host "INFO: Port is open but HTTP not responding - check agent logs" -ForegroundColor Yellow
    } catch {
        Write-Host "ERROR: TCP connection failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Diagnostics completed" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "INFO: If issues persist:" -ForegroundColor Yellow
Write-Host "1. Check Windows Event Viewer for service errors" -ForegroundColor White
Write-Host "2. Try running direct-test.bat to test without service" -ForegroundColor White
Write-Host "3. Check Windows Defender real-time protection" -ForegroundColor White
Write-Host "4. Try install-startup-agent.bat as fallback" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
