// Attendance Management System
class AttendanceManager {
    // Helper to format date as YYYY-MM-DD in local time
    formatDateLocal(date) {
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
    }
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

    // Use unified auth manager for token operations
    async getAuthToken() {
        if (window.unifiedAuthManager) {
            return await window.unifiedAuthManager.waitForToken();
        }
        // Fallback for backward compatibility
        return localStorage.getItem('gymAdminToken');
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
            dateInput.value = this.formatDateLocal(this.currentDate);
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
                const contentType = membersResponse.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        this.membersData = await membersResponse.json();
                        console.log(`✅ Successfully loaded ${this.membersData.length || 0} members`);
                    } catch (jsonError) {
                        console.warn('Failed to parse members JSON response:', jsonError);
                        this.membersData = [];
                    }
                } else {
                    console.warn('Members API returned non-JSON response');
                    this.membersData = [];
                }
            } else {
                console.warn(`Members API returned status ${membersResponse.status}: ${membersResponse.statusText}`);
                this.membersData = [];
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
                        const contentType = profileResponse.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            try {
                                const profile = await profileResponse.json();
                                this.gymId = profile.gymId || profile._id || profile.gym?._id || null;
                                console.log(`✅ Successfully loaded gym profile, gymId: ${this.gymId}`);
                            } catch (jsonError) {
                                console.warn('Failed to parse profile JSON response:', jsonError);
                                this.gymId = null;
                            }
                        } else {
                            console.warn('Profile API returned non-JSON response');
                            this.gymId = null;
                        }
                    } else {
                        console.warn(`Profile API returned status ${profileResponse.status}: ${profileResponse.statusText}`);
                        this.gymId = null;
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
                const contentType = trainersResponse.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        this.trainersData = await trainersResponse.json();
                        console.log(`✅ Successfully loaded ${this.trainersData.length || 0} trainers`);
                    } catch (jsonError) {
                        console.warn('Failed to parse trainers JSON response:', jsonError);
                        this.trainersData = [];
                    }
                } else {
                    console.warn('Trainers API returned non-JSON response');
                    this.trainersData = [];
                }
            } else {
                console.warn(`Trainers API returned status ${trainersResponse.status}: ${trainersResponse.statusText}`);
                this.trainersData = [];
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Ensure data arrays are initialized even on error
            this.membersData = this.membersData || [];
            this.trainersData = this.trainersData || [];
            this.showToast('Error loading data', 'error');
        }
    }

    async loadAttendanceForDate() {
        const dateStr = this.formatDateLocal(this.currentDate);
        console.log(`🔍 Loading attendance for date: ${dateStr}`);
        
        try {
            const token = await this.getAuthToken();
            if (!token) {
                console.error('No token found');
                return;
            }

            console.log(`🌐 Fetching attendance from: /api/attendance/${dateStr}`);
            const response = await fetch(`/api/attendance/${dateStr}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log(`📡 Response status: ${response.status} ${response.statusText}`);
            console.log(`📡 Response content-type: ${response.headers.get('content-type')}`);
            
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        this.attendanceData = await response.json();
                        console.log(`✅ Successfully loaded attendance data:`, this.attendanceData);
                    } catch (jsonError) {
                        console.warn('Failed to parse attendance JSON response:', jsonError);
                        this.attendanceData = {};
                    }
                } else {
                    console.warn('Attendance API returned non-JSON response');
                    this.attendanceData = {};
                }
            } else {
                console.warn(`Attendance API returned status ${response.status}: ${response.statusText}`);
                this.attendanceData = {};
            }
            
            this.renderAttendance();
            this.updateStats();
        } catch (error) {
            console.error('Error loading attendance:', error);
            this.attendanceData = {};
            this.renderAttendance();
            this.updateStats();
            this.showToast('Error loading attendance data', 'error');
        }
    }

    renderAttendance() {
        const container = document.getElementById('attendanceTableBody');
        if (!container) return;

        const data = this.currentTab === 'members' ? this.membersData : this.trainersData;
        const filteredData = this.filterExpiredMembers(data);

        if (filteredData.length === 0) {
            container.innerHTML = this.getEmptyStateRow();
            return;
        }

        container.innerHTML = filteredData.map(person => this.createAttendanceRow(person)).join('');
        
        // Add biometric status indicators after rows are rendered
        setTimeout(() => {
            this.addBiometricStatusToRows();
        }, 100);
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

    createAttendanceRow(person) {
        const dateStr = this.formatDateLocal(this.currentDate);
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

        const personName = person.memberName || person.firstName + ' ' + person.lastName;
        const personId = this.currentTab === 'members' ? 
            (person.membershipId || 'N/A') : 
            (person.specialty || 'General');

        return `
            <div class="attendance-row ${status}" data-id="${person._id}" data-person-id="${person._id}" data-person-type="${person.isTrainer ? 'trainer' : 'member'}">
                <div class="member-photo-container">
                    <img src="${avatarUrl}" alt="${personName}" class="member-photo">
                </div>
                
                <div class="member-name-container">
                    <h4 class="member-name">${personName}</h4>
                    ${isExpiringSoon ? `
                        <div class="expiry-warning-row">
                            <i class="fas fa-exclamation-triangle"></i>
                            Expires in ${this.getDaysUntilExpiry(person)} days
                        </div>
                    ` : ''}
                </div>
                
                <div class="member-id-container">
                    <span class="member-id">${personId}</span>
                </div>
                
                <div class="status-container">
                    <span class="status-badge-enhanced ${status}">
                        <i class="fas fa-${status === 'present' ? 'check-circle' : status === 'absent' ? 'times-circle' : 'clock'}"></i>
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>
                
                <div class="check-in-container">
                    ${checkInTime ? `<span class="check-in-time-enhanced">${checkInTime}</span>` : '<span class="check-in-time-enhanced">--:--</span>'}
                </div>
                
                <div class="row-actions">
                    <button class="action-btn-enhanced present ${status === 'present' ? 'disabled' : ''}" 
                            onclick="attendanceManager.markAttendance('${person._id}', 'present')"
                            ${status === 'present' ? 'disabled' : ''}>
                        <i class="fas fa-check"></i>
                        Present
                    </button>
                    <button class="action-btn-enhanced absent ${status === 'absent' ? 'disabled' : ''}" 
                            onclick="attendanceManager.markAttendance('${person._id}', 'absent')"
                            ${status === 'absent' ? 'disabled' : ''}>
                        <i class="fas fa-times"></i>
                        Absent
                    </button>
                    <button class="action-btn-enhanced history" 
                            onclick="attendanceManager.showAttendanceHistory('${person._id}', '${personName}', '${this.currentTab}')">
                        <i class="fas fa-history"></i>
                        History
                    </button>
                </div>
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

                // Don't clear the entire cache, just update today's data
                // if (this.attendanceHistory && this.attendanceHistory[personId]) {
                //     delete this.attendanceHistory[personId];
                // }

                // Immediately update attendance history with today's data
                if (!this.attendanceHistory) this.attendanceHistory = {};
                if (!this.attendanceHistory[personId]) this.attendanceHistory[personId] = {};
                
                // Store today's attendance in history cache
                this.attendanceHistory[personId][dateStr] = {
                    date: dateStr,
                    status: status,
                    checkInTime: status === 'present' ? currentTime : null,
                    checkOutTime: null
                };

                console.log(`✅ Stored today's attendance for ${personId} on ${dateStr}:`, this.attendanceHistory[personId][dateStr]);

                // Also refresh attendance history for the current month to get any other data
                await this.refreshAttendanceHistory(personId);

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
        const container = document.getElementById('attendanceTableBody');
        if (!container) return;
        const data = this.currentTab === 'members' ? this.membersData : this.trainersData;
        const filteredData = this.filterExpiredMembers(data).filter(person => {
            const name = (person.memberName || (person.firstName + ' ' + person.lastName)).toLowerCase();
            const id = (person.membershipId || '').toLowerCase();
            return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
        });

        // Show searched member results
        if (searchTerm && filteredData.length > 0) {
            container.innerHTML = filteredData.map(person => this.createAttendanceRow(person)).join('');
        } else {
            this.renderAttendance();
        }
    }

    filterByStatus(statusFilter) {
        const rows = document.querySelectorAll('.attendance-row');
        rows.forEach(row => {
            const rowStatus = row.classList.contains('present') ? 'present' : 
                             row.classList.contains('absent') ? 'absent' : 'pending';
            
            if (statusFilter === 'all' || rowStatus === statusFilter) {
                row.style.display = 'grid';
            } else if (statusFilter === 'expiring' && this.currentTab === 'members') {
                const hasExpiryWarning = row.querySelector('.expiry-warning-row');
                row.style.display = hasExpiryWarning ? 'grid' : 'none';
            } else {
                row.style.display = 'none';
            }
        });
    }

    async bulkMarkAttendance(status) {
        const visibleRows = document.querySelectorAll('.attendance-row:not([style*="display: none"])');
        const promises = [];

        visibleRows.forEach(row => {
            const personId = row.dataset.id;
            const currentStatus = row.classList.contains('present') ? 'present' : 
                                 row.classList.contains('absent') ? 'absent' : 'pending';
            
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
        const dateStr = this.formatDateLocal(this.currentDate);
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

    getEmptyStateRow() {
        return `
            <div class="attendance-row" style="justify-content: center; align-items: center; grid-column: 1 / -1; padding: 60px 20px;">
                <div style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3 style="margin: 0 0 8px 0; font-size: 1.2rem;">No ${this.currentTab} found</h3>
                    <p style="margin: 0; font-size: 0.9rem;">There are no ${this.currentTab} registered in the system.</p>
                </div>
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

    // Force refresh attendance history for a person
    async refreshAttendanceHistory(personId) {
        console.log(`🔄 Force refreshing attendance history for person ${personId}`);
        
        // Don't clear existing cache - we'll merge new data
        if (!this.attendanceHistory) this.attendanceHistory = {};
        if (!this.attendanceHistory[personId]) this.attendanceHistory[personId] = {};
        
        // Clear membership info cache
        if (this.membershipInfo && this.membershipInfo[personId]) {
            delete this.membershipInfo[personId];
        }
        
        // Fetch fresh data for current month
        const currentDate = new Date();
        await this.fetchAttendanceHistoryForMonth(personId, currentDate);
        
        console.log(`✅ Refreshed attendance history for ${personId}:`, this.attendanceHistory[personId]);
    }

    // Show attendance history modal
    async showAttendanceHistory(personId, personName, personType) {
        const modal = document.createElement('div');
        modal.className = 'attendance-history-modal';
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
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 800px;
            width: 90%;
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        modalContent.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; padding-bottom: 15px;">
                <h2 style="margin: 0; color: #1976d2;">
                    <i class="fas fa-calendar-alt"></i> ${personName} - Attendance History
                </h2>
                <div style="display: flex; gap: 10px;">
                    <button id="refreshHistory" style="background: #4caf50; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button id="closeHistoryModal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
            </div>
            <div id="membershipInfo" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; display: none;">
                <h4 style="margin: 0 0 10px 0; color: #1976d2;">Membership Information</h4>
                <div id="membershipDetails"></div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <button id="prevMonth" style="background: #1976d2; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 id="currentMonth" style="margin: 0; min-width: 200px; text-align: center; color: #333;"></h3>
                <button id="nextMonth" style="background: #1976d2; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div style="display: flex; gap: 20px; margin-bottom: 20px; justify-content: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; background: #4caf50; border-radius: 50%;"></div>
                    <span style="font-size: 14px;">Present</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; background: #f44336; border-radius: 50%;"></div>
                    <span style="font-size: 14px;">Absent</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; background: #ff9800; border-radius: 50%;"></div>
                    <span style="font-size: 14px;">Not Marked</span>
                </div>
            </div>
            <div id="attendanceCalendar" style="margin-bottom: 20px;"></div>
            <div id="attendanceStats" style="display: flex; gap: 20px; justify-content: center; padding: 15px; background: #f8f9fa; border-radius: 8px;"></div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        let currentDate = new Date();
        let attendanceHistory = {};
        let membershipInfo = null;
        let isWithinMembershipPeriod = true;

        // Get member/trainer data to find membership dates
        const personData = this.findPersonData(personId, personType);
        console.log('Person data found:', personData);
        
        if (personData && personType === 'members') {
            membershipInfo = {
                joinDate: personData.joinDate,
                membershipValidUntil: personData.membershipValidUntil
            };
            
            // Display membership information
            const membershipInfoDiv = modalContent.querySelector('#membershipInfo');
            const membershipDetailsDiv = modalContent.querySelector('#membershipDetails');
            
            if (membershipInfo.joinDate || membershipInfo.membershipValidUntil) {
                membershipInfoDiv.style.display = 'block';
                const joinDateStr = membershipInfo.joinDate ? new Date(membershipInfo.joinDate).toLocaleDateString() : 'N/A';
                const validUntilStr = membershipInfo.membershipValidUntil ? new Date(membershipInfo.membershipValidUntil).toLocaleDateString() : 'N/A';
                
                membershipDetailsDiv.innerHTML = `
                    <div style="display: flex; gap: 30px;">
                        <div><strong>Join Date:</strong> ${joinDateStr}</div>
                        <div><strong>Valid Until:</strong> ${validUntilStr}</div>
                    </div>
                `;
                
                // Set initial date to join date if available, otherwise current date
                if (membershipInfo.joinDate) {
                    const joinDate = new Date(membershipInfo.joinDate);
                    const today = new Date();
                    // Start from join date or current date, whichever is earlier
                    currentDate = joinDate < today ? new Date(joinDate) : new Date(today);
                } else {
                    currentDate = new Date();
                }
            }
        } else {
            // For trainers, start with current date
            currentDate = new Date();
        }

        // Close modal functionality
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        modalContent.querySelector('#closeHistoryModal').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Refresh history button
        modalContent.querySelector('#refreshHistory').addEventListener('click', async () => {
            console.log('🔄 Refreshing attendance history...');
            await this.refreshAttendanceHistory(personId);
            await updateCalendar();
        });

        // Month navigation with membership period validation
        const updateCalendar = async () => {
            // Fetch attendance data for the current month first
            await this.fetchAttendanceHistoryForMonth(personId, currentDate);
            
            // Use membership info from backend if available, otherwise use local data
            let currentMembershipInfo = membershipInfo;
            if (this.membershipInfo && this.membershipInfo[personId]) {
                currentMembershipInfo = this.membershipInfo[personId];
                console.log('Using membership info from backend:', currentMembershipInfo);
            }
            
            // Check if current month is within membership period
            if (personType === 'members' && currentMembershipInfo) {
                const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const joinDate = currentMembershipInfo.joinDate ? new Date(currentMembershipInfo.joinDate) : null;
                const validUntil = currentMembershipInfo.membershipValidUntil ? new Date(currentMembershipInfo.membershipValidUntil) : new Date();
                
                if (joinDate && currentMonth < new Date(joinDate.getFullYear(), joinDate.getMonth(), 1)) {
                    isWithinMembershipPeriod = false;
                } else if (validUntil && currentMonth > new Date(validUntil.getFullYear(), validUntil.getMonth(), 1)) {
                    isWithinMembershipPeriod = false;
                } else {
                    isWithinMembershipPeriod = true;
                }
            }

            const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            modalContent.querySelector('#currentMonth').textContent = monthName;

            // Update navigation buttons based on membership period
            const prevBtn = modalContent.querySelector('#prevMonth');
            const nextBtn = modalContent.querySelector('#nextMonth');
            
            if (personType === 'members' && currentMembershipInfo) {
                const joinDate = currentMembershipInfo.joinDate ? new Date(currentMembershipInfo.joinDate) : null;
                const validUntil = currentMembershipInfo.membershipValidUntil ? new Date(currentMembershipInfo.membershipValidUntil) : new Date();
                
                // Disable previous button if we're at or before join month
                if (joinDate) {
                    const joinMonth = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
                    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    prevBtn.disabled = currentMonth <= joinMonth;
                    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
                    prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
                }
                
                // Disable next button if we're at or after valid until month
                if (validUntil) {
                    const validUntilMonth = new Date(validUntil.getFullYear(), validUntil.getMonth(), 1);
                    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    nextBtn.disabled = currentMonth >= validUntilMonth;
                    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
                    nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
                }
            }

            // Show loading state
            modalContent.querySelector('#attendanceCalendar').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <div>Loading attendance data...</div>
                </div>
            `;
            modalContent.querySelector('#attendanceStats').innerHTML = '';

            // Render calendar and stats with updated membership info
            this.renderCalendar(modalContent.querySelector('#attendanceCalendar'), currentDate, personId, currentMembershipInfo);
            this.updateAttendanceStats(modalContent.querySelector('#attendanceStats'), currentDate, personId, currentMembershipInfo);
        };

        modalContent.querySelector('#prevMonth').addEventListener('click', () => {
            if (!modalContent.querySelector('#prevMonth').disabled) {
                currentDate.setMonth(currentDate.getMonth() - 1);
                updateCalendar();
            }
        });

        modalContent.querySelector('#nextMonth').addEventListener('click', () => {
            if (!modalContent.querySelector('#nextMonth').disabled) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                updateCalendar();
            }
        });

        // Initial load
        await updateCalendar();
    }

    // Helper function to find person data
    findPersonData(personId, personType) {
        const data = personType === 'members' ? this.membersData : this.trainersData;
        return data.find(person => person._id === personId);
    }

    // Fetch attendance history for a specific month
    async fetchAttendanceHistoryForMonth(personId, date) {
        try {
            const token = await this.getAuthToken();
            if (!token) return;

            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            console.log(`Fetching attendance history for ${personId} from ${startDate} to ${endDate}`);

            const response = await fetch(`/api/attendance/history/${personId}?startDate=${startDate}&endDate=${endDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const data = await response.json();
                        console.log('Attendance history response:', data);
                        
                        // Initialize attendance history for this person if not exists
                        if (!this.attendanceHistory) this.attendanceHistory = {};
                        if (!this.attendanceHistory[personId]) this.attendanceHistory[personId] = {};
                        
                        // Handle backend response format
                        if (data.history && Array.isArray(data.history)) {
                            console.log(`Found ${data.history.length} attendance records for ${personId}`);
                            data.history.forEach(record => {
                                const dateKey = record.date.split('T')[0];
                                this.attendanceHistory[personId][dateKey] = {
                                    date: dateKey,
                                    status: record.status,
                                    checkInTime: record.checkInTime,
                                    checkOutTime: record.checkOutTime
                                };
                                console.log(`Stored record for ${dateKey}: ${record.status}`);
                            });
                            
                            // Store membership info if available
                            if (data.membershipInfo) {
                                if (!this.membershipInfo) this.membershipInfo = {};
                                this.membershipInfo[personId] = data.membershipInfo;
                                console.log('Membership info stored:', this.membershipInfo[personId]);
                            }
                        } else {
                            // Fallback for old format
                            const history = Array.isArray(data) ? data : [];
                            history.forEach(record => {
                                const dateKey = record.date.split('T')[0];
                                this.attendanceHistory[personId][dateKey] = {
                                    date: dateKey,
                                    status: record.status,
                                    checkInTime: record.checkInTime,
                                    checkOutTime: record.checkOutTime
                                };
                            });
                        }
                        
                        console.log(`Total records loaded for ${personId}:`, Object.keys(this.attendanceHistory[personId]).length);
                        console.log('Attendance history data:', this.attendanceHistory[personId]);
                        
                    } catch (jsonError) {
                        console.warn('Failed to parse attendance history JSON response:', jsonError);
                        return;
                    }
                } else {
                    console.warn('Attendance history API returned non-JSON response');
                    return;
                }
            } else {
                console.warn(`Attendance history API returned status ${response.status}: ${response.statusText}`);
                return;
            }
        } catch (error) {
            console.error('Error fetching attendance history:', error);
            // Fallback to alternative method
            await this.fetchAttendanceHistoryAlternative(personId, startDate, endDate);
        }
    }

    // Alternative method to fetch attendance history using existing endpoint
    async fetchAttendanceHistoryAlternative(personId, startDate, endDate) {
        try {
            const token = await this.getAuthToken();
            if (!token) return;

            console.log(`Using alternative method to fetch attendance from ${startDate} to ${endDate}`);

            if (!this.attendanceHistory) this.attendanceHistory = {};
            if (!this.attendanceHistory[personId]) this.attendanceHistory[personId] = {};

            // Don't clear existing data - we'll merge new data
            // this.attendanceHistory[personId] = {};

            // Fetch attendance data for each day in the range
            const start = new Date(startDate);
            const end = new Date(endDate);
            const promises = [];
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                
                const promise = fetch(`/api/attendance/${dateStr}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }).then(response => {
                    if (response.ok) {
                        return response.json().then(dayData => ({
                            date: dateStr,
                            data: dayData
                        }));
                    }
                    return null;
                }).catch(error => {
                    console.error(`Error fetching attendance for ${dateStr}:`, error);
                    return null;
                });
                
                promises.push(promise);
            }

            // Wait for all requests to complete
            const results = await Promise.all(promises);
            
            // Process results
            results.forEach(result => {
                if (result && result.data && result.data[personId]) {
                    this.attendanceHistory[personId][result.date] = {
                        date: result.date,
                        status: result.data[personId].status,
                        checkInTime: result.data[personId].checkInTime,
                        checkOutTime: result.data[personId].checkOutTime
                    };
                    console.log(`Alternative method stored record for ${result.date}: ${result.data[personId].status}`);
                }
            });

            console.log(`Alternative method loaded ${Object.keys(this.attendanceHistory[personId]).length} records for ${personId}`);
            console.log('Alternative method attendance data:', this.attendanceHistory[personId]);
        } catch (error) {
            console.error('Error in alternative attendance history fetch:', error);
        }
    }

    // Render calendar with attendance data
    renderCalendar(container, date, personId, membershipInfo = null) {
        console.log(`Rendering calendar for personId: ${personId}, date: ${date.toISOString().split('T')[0]}`);
        console.log('Membership info:', membershipInfo);
        console.log('Attendance history for person:', this.attendanceHistory ? this.attendanceHistory[personId] : 'No history');
        
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Always use system date for 'today' (local time, no timezone offset)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}`;

        // Calculate membership period boundaries
        let membershipStart = null;
        let membershipEnd = null;
        
        if (membershipInfo) {
            membershipStart = membershipInfo.joinDate ? new Date(membershipInfo.joinDate) : null;
            membershipEnd = membershipInfo.membershipValidUntil ? new Date(membershipInfo.membershipValidUntil) : null;
            console.log('Membership period:', membershipStart, 'to', membershipEnd);
        }

        let calendarHTML = `
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 10px;">
                <div style="padding: 8px; font-weight: bold; text-align: center; background: #f5f5f5; border-radius: 4px;">Sun</div>
                <div style="padding: 8px; font-weight: bold; text-align: center; background: #f5f5f5; border-radius: 4px;">Mon</div>
                <div style="padding: 8px; font-weight: bold; text-align: center; background: #f5f5f5; border-radius: 4px;">Tue</div>
                <div style="padding: 8px; font-weight: bold; text-align: center; background: #f5f5f5; border-radius: 4px;">Wed</div>
                <div style="padding: 8px; font-weight: bold; text-align: center; background: #f5f5f5; border-radius: 4px;">Thu</div>
                <div style="padding: 8px; font-weight: bold; text-align: center; background: #f5f5f5; border-radius: 4px;">Fri</div>
                <div style="padding: 8px; font-weight: bold; text-align: center; background: #f5f5f5; border-radius: 4px;">Sat</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
        `;

        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dateStr = this.formatDateLocal(currentDate);
            const dayNumber = currentDate.getDate();
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = dateStr === todayStr;
            // Fix: Compare only date parts, not time
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const isPastDate = currentDateOnly <= todayDateOnly;
            const isSunday = currentDate.getDay() === 0;

            // Check if date is within membership period
            let isWithinMembershipPeriod = true;
            let membershipStatus = '';
            
            if (membershipInfo) {
                const dayDate = new Date(currentDate);
                dayDate.setHours(0, 0, 0, 0);
                
                if (membershipStart) {
                    const startDate = new Date(membershipStart);
                    startDate.setHours(0, 0, 0, 0);
                    if (dayDate < startDate) {
                        isWithinMembershipPeriod = false;
                        membershipStatus = 'before-membership';
                    }
                }
                
                if (membershipEnd) {
                    const endDate = new Date(membershipEnd);
                    endDate.setHours(0, 0, 0, 0);
                    if (dayDate > endDate) {
                        isWithinMembershipPeriod = false;
                        membershipStatus = 'after-membership';
                    }
                }
            }

            let attendanceStatus = 'none';
            let dotColor = 'transparent';
            let statusText = 'No data';
            let checkInTime = '';
            let cellBackground = isCurrentMonth ? (isToday ? '#e3f2fd' : '#fff') : '#f9f9f9';
            let cellOpacity = '1';

            // Handle different cases for attendance status
            if (!isWithinMembershipPeriod) {
                if (membershipStatus === 'before-membership') {
                    statusText = 'Before membership started';
                    cellBackground = '#ffe0e0';
                    cellOpacity = '0.6';
                } else if (membershipStatus === 'after-membership') {
                    statusText = 'After membership expired';
                    cellBackground = '#ffe0e0';
                    cellOpacity = '0.6';
                }
            } else if (isCurrentMonth && isPastDate && this.attendanceHistory && this.attendanceHistory[personId] && this.attendanceHistory[personId][dateStr]) {
                const record = this.attendanceHistory[personId][dateStr];
                attendanceStatus = record.status;
                checkInTime = record.checkInTime || '';
                console.log(`Found attendance record for ${dateStr}: ${record.status}`, record);
                switch (record.status) {
                    case 'present':
                        dotColor = '#4caf50';
                        statusText = `Present${checkInTime ? ' at ' + checkInTime : ''}`;
                        break;
                    case 'absent':
                        dotColor = '#f44336';
                        statusText = 'Absent';
                        break;
                    default:
                        dotColor = '#ff9800';
                        statusText = 'Not marked';
                        break;
                }
            } else if (isCurrentMonth && isToday && this.attendanceData && this.attendanceData[personId] && this.attendanceData[personId].status && this.attendanceData[personId].status !== 'pending') {
                // Special case for today's attendance from attendanceData
                const todayRecord = this.attendanceData[personId];
                attendanceStatus = todayRecord.status;
                checkInTime = todayRecord.checkInTime || '';
                console.log(`Found today's attendance record for ${dateStr}: ${todayRecord.status}`, todayRecord);
                switch (todayRecord.status) {
                    case 'present':
                        dotColor = '#4caf50';
                        statusText = `Present${checkInTime ? ' at ' + checkInTime : ''}`;
                        break;
                    case 'absent':
                        dotColor = '#f44336';
                        statusText = 'Absent';
                        break;
                    default:
                        dotColor = '#ff9800';
                        statusText = 'Not marked';
                        break;
                }
            } else if (isCurrentMonth && isPastDate && !isSunday && isWithinMembershipPeriod) {
                dotColor = '#ff9800';
                statusText = 'Not marked';
                console.log(`No attendance record found for ${dateStr}, marking as not marked`);
            } else if (isSunday && isCurrentMonth) {
                statusText = 'Weekend';
                dotColor = 'transparent';
            } else if (!isPastDate && isCurrentMonth) {
                statusText = 'Future date';
                dotColor = 'transparent';
            } else if (!isCurrentMonth) {
                statusText = 'Outside current month';
                dotColor = 'transparent';
            }

            calendarHTML += `
                <div style="
                    padding: 8px;
                    text-align: center;
                    background: ${cellBackground};
                    color: ${isCurrentMonth ? '#333' : '#ccc'};
                    border-radius: 4px;
                    position: relative;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    border: ${isToday ? '2px solid #1976d2' : '1px solid #e0e0e0'};
                    cursor: ${isCurrentMonth ? 'pointer' : 'default'};
                    transition: all 0.2s ease;
                    opacity: ${cellOpacity};
                " ${isCurrentMonth ? `title="${dayNumber} ${date.toLocaleString('default', { month: 'long' })}: ${statusText}"` : ''}>
                    <span style="font-size: 14px; font-weight: ${isToday ? 'bold' : 'normal'};">${dayNumber}</span>
                    ${dotColor !== 'transparent' ? `<div style="width: 8px; height: 8px; background: ${dotColor}; border-radius: 50%; margin-top: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div>` : ''}
                    ${isSunday && isCurrentMonth ? '<div style="position: absolute; top: 2px; right: 2px; font-size: 8px; color: #999;">⚡</div>' : ''}
                    ${!isWithinMembershipPeriod && isCurrentMonth ? '<div style="position: absolute; top: 2px; left: 2px; font-size: 8px; color: #f44336;">✗</div>' : ''}
                </div>
            `;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        calendarHTML += '</div>';
        
        // Add membership period information if available
        if (membershipInfo) {
            const joinDateStr = membershipInfo.joinDate ? new Date(membershipInfo.joinDate).toLocaleDateString() : 'N/A';
            const validUntilStr = membershipInfo.membershipValidUntil ? new Date(membershipInfo.membershipValidUntil).toLocaleDateString() : 'N/A';
            
            calendarHTML += `
                <div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 4px solid #1976d2;">
                    <small style="color: #666; display: block; margin-bottom: 5px;">
                        <i class="fas fa-info-circle"></i> Membership Period: ${joinDateStr} - ${validUntilStr}
                    </small>
                    <small style="color: #666;">
                        <span style="color: #f44336;">✗</span> Days outside membership period are marked
                    </small>
                </div>
            `;
        }
        
        container.innerHTML = calendarHTML;

        // Add hover effects
        container.querySelectorAll('div[title]').forEach(dayElement => {
            dayElement.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            });
            dayElement.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = 'none';
            });
        });
    }

    // Update attendance statistics for the month
    updateAttendanceStats(container, date, personId, membershipInfo = null) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();

        let presentCount = 0;
        let absentCount = 0;
        let notMarkedCount = 0;
        let totalWorkingDays = 0;

        // Determine membership boundaries
        let membershipStart = null;
        let membershipEnd = null;
        
        if (membershipInfo) {
            membershipStart = membershipInfo.joinDate ? new Date(membershipInfo.joinDate) : null;
            membershipEnd = membershipInfo.membershipValidUntil ? new Date(membershipInfo.membershipValidUntil) : null;
        }

        // Count working days (excluding Sundays) in the month within membership period
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            // Skip Sundays
            if (d.getDay() === 0) continue;
            
            // Fix: Compare only date parts, not time
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const currentDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            // Skip future dates
            if (currentDateOnly > todayDateOnly) continue;
            
            // Check if date is within membership period
            if (membershipStart && d < membershipStart) continue;
            if (membershipEnd && d > membershipEnd) continue;
            
            totalWorkingDays++;
            const dateStr = this.formatDateLocal(d);
            
            if (this.attendanceHistory && this.attendanceHistory[personId] && this.attendanceHistory[personId][dateStr]) {
                const record = this.attendanceHistory[personId][dateStr];
                if (record.status === 'present') {
                    presentCount++;
                } else if (record.status === 'absent') {
                    absentCount++;
                } else {
                    notMarkedCount++;
                }
            } else {
                notMarkedCount++;
            }
        }

        const attendanceRate = totalWorkingDays > 0 ? Math.round((presentCount / totalWorkingDays) * 100) : 0;

        container.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${presentCount}</div>
                <div style="font-size: 14px; color: #666;">Present</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #f44336;">${absentCount}</div>
                <div style="font-size: 14px; color: #666;">Absent</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #ff9800;">${notMarkedCount}</div>
                <div style="font-size: 14px; color: #666;">Not Marked</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${attendanceRate}%</div>
                <div style="font-size: 14px; color: #666;">Attendance Rate</div>
            </div>
            <div style="text-align: center; margin-top: 10px;">
                <div style="font-size: 12px; color: #666;">Working Days: ${totalWorkingDays}</div>
            </div>
        `;
    }

    // ========== BIOMETRIC ATTENDANCE FUNCTIONS ==========

    // Show biometric enrollment modal for a member/trainer
    async showBiometricEnrollment(personId, personType, personName) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content biometric-modal">
                <div class="modal-header">
                    <h3>Biometric Enrollment - ${personName}</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="enrollment-tabs">
                        <button class="tab-btn active" data-tab="fingerprint">
                            <i class="fas fa-fingerprint"></i> Fingerprint
                        </button>
                        <button class="tab-btn" data-tab="face">
                            <i class="fas fa-user"></i> Face Recognition
                        </button>
                    </div>
                    
                    <div class="tab-content active" id="fingerprint-tab">
                        <div class="enrollment-area">
                            <div class="scanner-visual">
                                <div class="fingerprint-scanner">
                                    <i class="fas fa-fingerprint scanner-icon"></i>
                                    <div class="scan-animation"></div>
                                </div>
                            </div>
                            <p class="instruction-text">Place finger on scanner and hold still</p>
                            <div class="progress-bar">
                                <div class="progress-fill" id="fingerprint-progress"></div>
                            </div>
                            <div class="scan-status" id="fingerprint-status">Ready to scan</div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="face-tab">
                        <div class="enrollment-area">
                            <div class="camera-visual">
                                <div class="face-camera">
                                    <i class="fas fa-camera camera-icon"></i>
                                    <div class="face-outline"></div>
                                </div>
                            </div>
                            <p class="instruction-text">Look directly at camera and remain still</p>
                            <div class="progress-bar">
                                <div class="progress-fill" id="face-progress"></div>
                            </div>
                            <div class="scan-status" id="face-status">Ready to scan</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn btn-primary" id="start-enrollment">Start Enrollment</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Tab switching
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabContents = modal.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                modal.querySelector(`#${tabId}-tab`).classList.add('active');
            });
        });

        // Start enrollment
        modal.querySelector('#start-enrollment').addEventListener('click', () => {
            const activeTab = modal.querySelector('.tab-btn.active').dataset.tab;
            this.startBiometricEnrollment(personId, personType, activeTab, modal);
        });
    }

    // Start the actual enrollment process
    async startBiometricEnrollment(personId, personType, biometricType, modal) {
        const progressBar = modal.querySelector(`#${biometricType}-progress`);
        const statusElement = modal.querySelector(`#${biometricType}-status`);
        const scannerIcon = modal.querySelector('.scanner-icon, .camera-icon');
        
        try {
            statusElement.textContent = 'Initializing scanner...';
            progressBar.style.width = '10%';
            
            await this.simulateDelay(1000);
            
            statusElement.textContent = 'Place finger on scanner' || 'Look at camera';
            progressBar.style.width = '25%';
            scannerIcon.classList.add('scanning');
            
            await this.simulateDelay(2000);
            
            statusElement.textContent = 'Scanning...';
            progressBar.style.width = '50%';
            
            await this.simulateDelay(2000);
            
            statusElement.textContent = 'Processing data...';
            progressBar.style.width = '75%';
            
            await this.simulateDelay(1500);
            
            // Call API to enroll biometric data
            const response = await fetch('/api/biometric/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({
                    personId,
                    personType,
                    biometricType,
                    deviceId: 'scanner-001',
                    templateData: this.generateMockTemplate(biometricType)
                })
            });

            if (response.ok) {
                statusElement.textContent = 'Enrollment successful!';
                progressBar.style.width = '100%';
                progressBar.style.backgroundColor = '#4CAF50';
                
                this.showToast(`${biometricType} enrollment completed for ${personType}`, 'success');
                
                setTimeout(() => {
                    modal.remove();
                    this.loadData(); // Refresh to show updated biometric status
                }, 2000);
            } else {
                throw new Error('Enrollment failed');
            }
            
        } catch (error) {
            statusElement.textContent = 'Enrollment failed';
            progressBar.style.backgroundColor = '#f44336';
            this.showToast('Biometric enrollment failed', 'error');
            console.error('Enrollment error:', error);
        } finally {
            scannerIcon.classList.remove('scanning');
        }
    }

    // Verify biometric and mark attendance
    async verifyBiometricAttendance(personId, personType, biometricType) {
        const loadingToast = this.showToast('Verifying biometric data...', 'info', 0);
        
        try {
            // Simulate biometric verification
            await this.simulateDelay(2000);
            
            const response = await fetch('/api/biometric/verify-attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({
                    personId,
                    personType,
                    biometricType,
                    deviceId: 'scanner-001',
                    templateData: this.generateMockTemplate(biometricType)
                })
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const result = await response.json();
                        this.hideToast(loadingToast);
                        
                        if (result.verified) {
                            this.showToast(`${biometricType} verified! Attendance marked.`, 'success');
                            this.loadData(); // Refresh attendance data
                        } else {
                            this.showToast('Biometric verification failed', 'error');
                        }
                    } catch (jsonError) {
                        console.warn('Failed to parse verification JSON response:', jsonError);
                        this.hideToast(loadingToast);
                        this.showToast('Biometric verification error', 'error');
                    }
                } else {
                    console.warn('Verification API returned non-JSON response');
                    this.hideToast(loadingToast);
                    this.showToast('Biometric verification error', 'error');
                }
            } else {
                throw new Error('Verification request failed');
            }
            
        } catch (error) {
            this.hideToast(loadingToast);
            this.showToast('Biometric verification error', 'error');
            console.error('Verification error:', error);
        }
    }

    // Generate mock biometric template for development
    generateMockTemplate(biometricType) {
        if (biometricType === 'fingerprint') {
            return {
                minutiae: Array.from({length: 20}, () => ({
                    x: Math.floor(Math.random() * 256),
                    y: Math.floor(Math.random() * 256),
                    angle: Math.floor(Math.random() * 360),
                    type: Math.random() > 0.5 ? 'ridge_ending' : 'bifurcation'
                })),
                quality: Math.floor(Math.random() * 30) + 70 // 70-100
            };
        } else if (biometricType === 'face') {
            return {
                encoding: Array.from({length: 128}, () => Math.random() * 2 - 1),
                landmarks: Array.from({length: 68}, () => ({
                    x: Math.floor(Math.random() * 256),
                    y: Math.floor(Math.random() * 256)
                })),
                quality: Math.floor(Math.random() * 30) + 70 // 70-100
            };
        }
    }

    // Add biometric status indicators to attendance rows
    addBiometricStatusToRows() {
        const rows = document.querySelectorAll('.attendance-row');
        
        rows.forEach(row => {
            const personId = row.dataset.personId;
            const personType = row.dataset.personType;
            
            if (!personId) return;
            
            // Check if biometric status already added
            if (row.querySelector('.biometric-status')) return;
            
            const statusContainer = document.createElement('div');
            statusContainer.className = 'biometric-status';
            statusContainer.innerHTML = `
                <div class="biometric-indicators">
                    <span class="biometric-indicator fingerprint" title="Fingerprint enrolled">
                        <i class="fas fa-fingerprint"></i>
                    </span>
                    <span class="biometric-indicator face" title="Face recognition enrolled">
                        <i class="fas fa-user"></i>
                    </span>
                </div>
                <div class="biometric-actions">
                    <button class="btn btn-sm btn-biometric" onclick="window.attendanceManager.showBiometricEnrollment('${personId}', '${personType}', '${row.querySelector('.member-name, .trainer-name')?.textContent || 'Unknown'}')">
                        <i class="fas fa-plus"></i> Enroll
                    </button>
                    <button class="btn btn-sm btn-verify" onclick="window.attendanceManager.verifyBiometricAttendance('${personId}', '${personType}', 'fingerprint')">
                        <i class="fas fa-fingerprint"></i> Verify
                    </button>
                </div>
            `;
            
            // Add to the row (append to the end)
            row.appendChild(statusContainer);
        });
    }

    // Simulate delay for demo purposes
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Hide toast message
    hideToast(toastElement) {
        if (toastElement && toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
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