// Attendance Management System
class AttendanceManager {
    constructor() {
        this.currentDate = new Date();
        this.currentTab = 'members';
        this.attendanceData = {};
        this.membersData = [];
        this.trainersData = [];
        this.gymId = null; // Store gymId for current admin
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
        this.updateDateDisplay();
        this.loadAttendanceForDate();
    }

    // Token utility functions (copied from gymadmin.js)
    async waitForToken(tokenKey, maxTries, delayMs) {
        console.log(`🔍 Waiting for token '${tokenKey}' (max ${maxTries} tries, ${delayMs}ms intervals)`);
        
        let token = null;
        let tries = 0;
        
        // Function to check multiple storage locations
        function checkAllStorageLocations() {
            // First check URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const urlToken = urlParams.get('token');
            if (urlToken) {
                console.log('🔗 Token found in URL parameters');
                // Store it in localStorage for future use
                localStorage.setItem(tokenKey, urlToken);
                // Clean the URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return { location: 'URL parameters', token: urlToken };
            }
            
            // Check localStorage
            let found = localStorage.getItem(tokenKey);
            if (found) return { location: 'localStorage', token: found };
            
            // Check sessionStorage
            found = sessionStorage.getItem(tokenKey);
            if (found) return { location: 'sessionStorage', token: found };
            
            // Check alternative key names
            const altKeys = ['authToken', 'token', 'gymAuthToken', 'adminToken'];
            for (const altKey of altKeys) {
                found = localStorage.getItem(altKey);
                if (found) return { location: `localStorage[${altKey}]`, token: found };
                
                found = sessionStorage.getItem(altKey);
                if (found) return { location: `sessionStorage[${altKey}]`, token: found };
            }
            
            return null;
        }
        
        while (!token && tries < maxTries) {
            const result = checkAllStorageLocations();
            if (result) {
                token = result.token;
                console.log(`✅ Token found in ${result.location} after ${tries} attempts`);
                // If found in alternative location, also store it in the expected location
                if (result.location !== 'localStorage') {
                    localStorage.setItem(tokenKey, token);
                    console.log(`📝 Token copied to localStorage[${tokenKey}]`);
                }
                break;
            }
            
            await new Promise(res => setTimeout(res, delayMs));
            tries++;
            console.log(`🔄 Token check attempt ${tries}/${maxTries} - Token found: false`);
        }
        
        if (token) {
            console.log(`✅ Token '${tokenKey}' found after ${tries} attempts`);
        } else {
            console.log(`❌ Token '${tokenKey}' not found after ${tries} attempts`);
        }
        
        return token;
    }

    async getAuthToken() {
        const token = await this.waitForToken('gymAdminToken', 10, 100);
        if (!token) {
            console.error('No authentication token found');
            return null;
        }
        // Remove 'Bearer ' prefix if it exists in the stored token
        return token.replace(/^Bearer\s+/, '');
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.attendance-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Date navigation
        document.getElementById('prevDay')?.addEventListener('click', () => {
            this.navigateDate(-1);
        });

        document.getElementById('nextDay')?.addEventListener('click', () => {
            this.navigateDate(1);
        });

        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.goToToday();
        });

        document.getElementById('attendanceDate')?.addEventListener('change', (e) => {
            this.currentDate = new Date(e.target.value);
            this.loadAttendanceForDate();
        });

        // Search functionality
        document.getElementById('attendanceSearch')?.addEventListener('input', (e) => {
            this.filterAttendance(e.target.value);
        });

        // Filter functionality
        document.getElementById('attendanceFilter')?.addEventListener('change', (e) => {
            this.filterByStatus(e.target.value);
        });

        // Bulk actions
        document.getElementById('bulkPresentBtn')?.addEventListener('click', () => {
            this.bulkMarkAttendance('present');
        });

        document.getElementById('bulkAbsentBtn')?.addEventListener('click', () => {
            this.bulkMarkAttendance('absent');
        });

        // Export functionality
        document.getElementById('exportAttendanceBtn')?.addEventListener('click', () => {
            this.exportAttendance();
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.attendance-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update filter options
        this.updateFilterOptions();
        
        // Reload attendance data
        this.loadAttendanceForDate();
    }

    updateFilterOptions() {
        const filterSelect = document.getElementById('attendanceFilter');
        if (!filterSelect) return;

        const baseOptions = [
            { value: 'all', text: 'All' },
            { value: 'present', text: 'Present' },
            { value: 'absent', text: 'Absent' },
            { value: 'pending', text: 'Pending' }
        ];

        if (this.currentTab === 'members') {
            baseOptions.push({ value: 'expiring', text: 'Membership Expiring' });
        }

        filterSelect.innerHTML = baseOptions.map(option => 
            `<option value="${option.value}">${option.text}</option>`
        ).join('');
    }

    navigateDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.updateDateDisplay();
        this.loadAttendanceForDate();
    }

    goToToday() {
        this.currentDate = new Date();
        this.updateDateDisplay();
        this.loadAttendanceForDate();
    }

    updateDateDisplay() {
        const dateInput = document.getElementById('attendanceDate');
        if (dateInput) {
            dateInput.value = this.currentDate.toISOString().split('T')[0];
        }
    }

    async loadData() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                console.error('No token found');
                return;
            }

            // Load members data
            const membersResponse = await fetch('/api/members', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (membersResponse.ok) {
                this.membersData = await membersResponse.json();
            }

            // Fetch gymId from admin profile if not already set
            if (!this.gymId) {
                try {
                    const profileResponse = await fetch('/api/gyms/profile/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (profileResponse.ok) {
                        const profile = await profileResponse.json();
                        this.gymId = profile.gymId || profile._id || profile.gym?._id || null;
                    }
                } catch (e) {
                    this.gymId = null;
                }
            }

            // Load trainers data (status=approved, gym=<gymId>)
            let trainersUrl = '/api/trainers?status=approved';
            if (this.gymId) trainersUrl += `&gym=${this.gymId}`;

            const trainersResponse = await fetch(trainersUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (trainersResponse.ok) {
                this.trainersData = await trainersResponse.json();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Error loading data', 'error');
        }
    }

    async loadAttendanceForDate() {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        
        try {
            const token = await this.getAuthToken();
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch(`/api/attendance/${dateStr}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                this.attendanceData = await response.json();
            } else {
                this.attendanceData = {};
            }
            
            this.renderAttendance();
            this.updateStats();
        } catch (error) {
            console.error('Error loading attendance:', error);
            this.showToast('Error loading attendance data', 'error');
        }
    }

    renderAttendance() {
        const container = document.getElementById('attendanceGrid');
        if (!container) return;

        const data = this.currentTab === 'members' ? this.membersData : this.trainersData;
        const filteredData = this.filterExpiredMembers(data);

        if (filteredData.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = filteredData.map(person => this.createAttendanceCard(person)).join('');
    }

    filterExpiredMembers(data) {
        if (this.currentTab !== 'members') return data;

        const today = new Date();
        return data.filter(member => {
            if (!member.membershipValidUntil) return true;
            const expiryDate = new Date(member.membershipValidUntil);
            return expiryDate >= today;
        });
    }

    createAttendanceCard(person) {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const attendanceRecord = this.attendanceData[person._id] || {};
        const status = attendanceRecord.status || 'pending';
        const checkInTime = attendanceRecord.checkInTime || '';

        const isExpiringSoon = this.currentTab === 'members' && this.isMembershipExpiringSoon(person);
        // Use correct image field for trainers
        let avatarUrl;
        if (this.currentTab === 'trainers') {
            avatarUrl = person.image || 'https://via.placeholder.com/50?text=User';
        } else {
            avatarUrl = person.profileImage || 'https://via.placeholder.com/50?text=User';
        }

        return `
            <div class="attendance-card ${status}" data-id="${person._id}">
                <div class="member-info">
                    <img src="${avatarUrl}" alt="${person.name || person.firstName + ' ' + person.lastName}" class="member-avatar">
                    <div class="member-details">
                        <h4>${person.memberName || person.firstName + ' ' + person.lastName}</h4>
                        <p>${this.currentTab === 'members' ? `ID: ${person.membershipId || 'N/A'}` : `Specialty: ${person.specialty || 'General'}`}</p>
                    </div>
                </div>
                
                <div class="attendance-status">
                    <span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    ${checkInTime ? `<span class="check-in-time">Check-in: ${checkInTime}</span>` : ''}
                </div>

                <div class="attendance-actions">
                    <button class="attendance-btn mark-present ${status === 'present' ? 'disabled' : ''}" 
                            onclick="attendanceManager.markAttendance('${person._id}', 'present')"
                            ${status === 'present' ? 'disabled' : ''}>
                        <i class="fas fa-check"></i> Present
                    </button>
                    <button class="attendance-btn mark-absent ${status === 'absent' ? 'disabled' : ''}" 
                            onclick="attendanceManager.markAttendance('${person._id}', 'absent')"
                            ${status === 'absent' ? 'disabled' : ''}>
                        <i class="fas fa-times"></i> Absent
                    </button>
                </div>

                ${isExpiringSoon ? `
                    <div class="expiry-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Membership expires in ${this.getDaysUntilExpiry(person)} days
                    </div>
                ` : ''}
            </div>
        `;
    }

    isMembershipExpiringSoon(member) {
        if (!member.membershipValidUntil) return false;
        
        const today = new Date();
        const expiryDate = new Date(member.membershipValidUntil);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    }

    getDaysUntilExpiry(member) {
        if (!member.membershipValidUntil) return 0;
        
        const today = new Date();
        const expiryDate = new Date(member.membershipValidUntil);
        return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    }

    async markAttendance(personId, status) {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const currentTime = new Date().toLocaleTimeString();

        // Fix: personType must be capitalized to match backend enum
        const personType = this.currentTab === 'members' ? 'Member' : 'Trainer';

        // Get token using the same method as gymadmin.js
        const token = await this.getAuthToken();
        if (!token) {
            console.error('No token found');
            this.showToast('Authentication required', 'error');
            return;
        }

        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    personId,
                    personType,
                    date: dateStr,
                    status,
                    checkInTime: status === 'present' ? currentTime : null
                })
            });

            if (response.ok) {
                // Update local data
                if (!this.attendanceData[personId]) {
                    this.attendanceData[personId] = {};
                }
                this.attendanceData[personId].status = status;
                this.attendanceData[personId].checkInTime = status === 'present' ? currentTime : null;

                // Re-render the specific card
                this.renderAttendance();
                this.updateStats();
                
                this.showToast(`Attendance marked as ${status}`, 'success');
            } else {
                throw new Error('Failed to mark attendance');
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            this.showToast('Error marking attendance', 'error');
        }
    }

    filterAttendance(searchTerm) {
        const container = document.getElementById('attendanceGrid');
        if (!container) return;
        const data = this.currentTab === 'members' ? this.membersData : this.trainersData;
        const filteredData = this.filterExpiredMembers(data).filter(person => {
            const name = (person.memberName || (person.firstName + ' ' + person.lastName)).toLowerCase();
            const id = (person.membershipId || '').toLowerCase();
            return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
        });

        // Show searched member just below search bar
        if (searchTerm && filteredData.length > 0) {
            container.innerHTML = filteredData.map(person => this.createAttendanceCard(person)).join('');
        } else {
            this.renderAttendance();
        }
    }

    filterByStatus(statusFilter) {
        const cards = document.querySelectorAll('.attendance-card');
        cards.forEach(card => {
            const cardStatus = card.classList.contains('present') ? 'present' : 
                              card.classList.contains('absent') ? 'absent' : 'pending';
            
            if (statusFilter === 'all' || cardStatus === statusFilter) {
                card.style.display = 'block';
            } else if (statusFilter === 'expiring' && this.currentTab === 'members') {
                const hasExpiryWarning = card.querySelector('.expiry-warning');
                card.style.display = hasExpiryWarning ? 'block' : 'none';
            } else {
                card.style.display = 'none';
            }
        });
    }

    async bulkMarkAttendance(status) {
        const visibleCards = document.querySelectorAll('.attendance-card:not([style*="display: none"])');
        const promises = [];

        visibleCards.forEach(card => {
            const personId = card.dataset.id;
            const currentStatus = card.classList.contains('present') ? 'present' : 
                                 card.classList.contains('absent') ? 'absent' : 'pending';
            
            if (currentStatus !== status) {
                promises.push(this.markAttendance(personId, status));
            }
        });

        try {
            await Promise.all(promises);
            this.showToast(`Bulk attendance marked as ${status}`, 'success');
        } catch (error) {
            this.showToast('Error in bulk attendance marking', 'error');
        }
    }

    updateStats() {
        const data = this.currentTab === 'members' ? this.membersData : this.trainersData;
        const filteredData = this.filterExpiredMembers(data);
        
        let presentCount = 0;
        let absentCount = 0;
        let totalCount = filteredData.length;

        filteredData.forEach(person => {
            const attendanceRecord = this.attendanceData[person._id] || {};
            const status = attendanceRecord.status || 'pending';
            
            if (status === 'present') presentCount++;
            else if (status === 'absent') absentCount++;
        });

        // Update stats display
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('presentCount').textContent = presentCount;
        document.getElementById('absentCount').textContent = absentCount;
        document.getElementById('pendingCount').textContent = totalCount - presentCount - absentCount;

        // Update summary
        this.updateSummary(totalCount, presentCount, absentCount);
    }

    updateSummary(total, present, absent) {
        const summaryContainer = document.getElementById('attendanceSummary');
        if (!summaryContainer) return;

        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
        // Compact summary layout
        summaryContainer.innerHTML = `
            <div class="summary-header compact">
                <span><i class="fas fa-chart-bar"></i> Daily Summary</span>
                <button class="export-btn" id="exportAttendanceBtn" title="Export">
                    <i class="fas fa-download"></i>
                </button>
            </div>
            <div class="summary-grid compact">
                <div class="summary-item total-summary"><span class="summary-number">${total}</span> <span class="summary-label">${this.currentTab === 'members' ? 'Members' : 'Trainers'}</span></div>
                <div class="summary-item present-summary"><span class="summary-number">${present}</span> <span class="summary-label">Present</span></div>
                <div class="summary-item absent-summary"><span class="summary-number">${absent}</span> <span class="summary-label">Absent</span></div>
                <div class="summary-item"><span class="summary-number">${attendanceRate}%</span> <span class="summary-label">Rate</span></div>
            </div>
        `;
        document.getElementById('exportAttendanceBtn')?.addEventListener('click', () => {
            this.exportAttendance();
        });
    }

    exportAttendance() {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const data = this.currentTab === 'members' ? this.membersData : this.trainersData;
        const filteredData = this.filterExpiredMembers(data);

        const csvContent = this.generateCSV(filteredData, dateStr);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `attendance_${this.currentTab}_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        this.showToast('Attendance data exported successfully', 'success');
    }

    generateCSV(data, date) {
        const headers = this.currentTab === 'members' 
            ? ['Date', 'Member ID', 'Name', 'Phone', 'Status', 'Check-in Time', 'Membership Expiry']
            : ['Date', 'Trainer ID', 'Name', 'Phone', 'Specialty', 'Status', 'Check-in Time'];

        const rows = data.map(person => {
            const attendanceRecord = this.attendanceData[person._id] || {};
            const status = attendanceRecord.status || 'pending';
            const checkInTime = attendanceRecord.checkInTime || '';

            if (this.currentTab === 'members') {
                return [
                    date,
                    person.membershipId || 'N/A',
                    person.memberName || 'N/A',
                    person.memberPhone || 'N/A',
                    status,
                    checkInTime,
                    person.membershipValidUntil || 'N/A'
                ];
            } else {
                return [
                    date,
                    person._id,
                    person.firstName + ' ' + person.lastName,
                    person.phone || 'N/A',
                    person.specialty || 'N/A',
                    status,
                    checkInTime
                ];
            }
        });

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No ${this.currentTab} found</h3>
                <p>There are no ${this.currentTab} registered in the system.</p>
            </div>
        `;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Auto-remove expired members
    async removeExpiredMembers() {
        const today = new Date();
        const expiredMembers = this.membersData.filter(member => {
            if (!member.membershipValidUntil) return false;
            const expiryDate = new Date(member.membershipValidUntil);
            return expiryDate < today;
        });

        if (expiredMembers.length === 0) return;

        try {
            const response = await fetch('/api/members/remove-expired', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({ expiredMemberIds: expiredMembers.map(m => m._id) })
            });

            if (response.ok) {
                this.loadData(); // Reload data
                this.showToast(`${expiredMembers.length} expired members removed`, 'info');
            }
        } catch (error) {
            console.error('Error removing expired members:', error);
        }
    }
}

// Initialize attendance manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the attendance tab
    if (document.getElementById('attendanceTab')) {
        window.attendanceManager = new AttendanceManager();
        
        // Auto-remove expired members daily
        setInterval(() => {
            window.attendanceManager.removeExpiredMembers();
        }, 24 * 60 * 60 * 1000); // Run once per day
    }
});

// Export for global access
window.AttendanceManager = AttendanceManager;
