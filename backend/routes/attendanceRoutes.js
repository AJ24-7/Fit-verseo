const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const Trainer = require('../models/trainerModel');
const gymadminAuth = require('../middleware/gymadminAuth');

// Get attendance for a specific date
router.get('/:date', gymadminAuth, async (req, res) => {
    try {
        const { date } = req.params;
        const gymId = req.admin.id; // Use req.admin.id from current auth structure

        const attendance = await Attendance.find({
            gymId,
            date: new Date(date)
        }).populate('personId', 'memberName firstName lastName membershipId specialty');

        const attendanceMap = {};
        attendance.forEach(record => {
            attendanceMap[record.personId._id] = {
                status: record.status,
                checkInTime: record.checkInTime,
                checkOutTime: record.checkOutTime
            };
        });

        res.json(attendanceMap);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Mark attendance
router.post('/', gymadminAuth, async (req, res) => {
    try {
        const { personId, personType, date, status, checkInTime, checkOutTime } = req.body;
        const gymId = req.admin.id; // Use req.admin.id from current auth structure

        // Validate person exists
        let person;
        if (personType === 'Member') {
            person = await Member.findById(personId);
        } else if (personType === 'Trainer') {
            person = await Trainer.findById(personId);
        }

        if (!person) {
            return res.status(404).json({ error: 'Person not found' });
        }

        // Check if attendance already exists for this date
        let attendance = await Attendance.findOne({
            gymId,
            personId,
            date: new Date(date)
        });

        if (attendance) {
            // Update existing attendance
            attendance.status = status;
            attendance.checkInTime = checkInTime;
            attendance.checkOutTime = checkOutTime;
            attendance.updatedAt = new Date();
        } else {
            // Create new attendance record
            attendance = new Attendance({
                gymId,
                personId,
                personType,
                date: new Date(date),
                status,
                checkInTime,
                checkOutTime
            });
        }

        await attendance.save();
        res.json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// Get attendance summary for a date range
router.get('/summary/:startDate/:endDate', gymadminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const gymId = req.admin.id; // Use req.admin.id from current auth structure

        const attendance = await Attendance.find({
            gymId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).populate('personId', 'memberName firstName lastName membershipId specialty');

        const summary = {
            totalDays: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1,
            memberAttendance: {},
            trainerAttendance: {},
            dailyStats: {}
        };

        attendance.forEach(record => {
            const dateKey = record.date.toISOString().split('T')[0];
            
            if (!summary.dailyStats[dateKey]) {
                summary.dailyStats[dateKey] = {
                    members: { present: 0, absent: 0, total: 0 },
                    trainers: { present: 0, absent: 0, total: 0 }
                };
            }

            const personKey = record.personId._id.toString();
            const personData = {
                id: record.personId._id,
                name: record.personId.memberName || 
                      (record.personId.firstName + ' ' + record.personId.lastName),
                membershipId: record.personId.membershipId,
                specialty: record.personId.specialty
            };

            if (record.personType === 'member') {
                if (!summary.memberAttendance[personKey]) {
                    summary.memberAttendance[personKey] = {
                        ...personData,
                        attendance: []
                    };
                }
                summary.memberAttendance[personKey].attendance.push({
                    date: dateKey,
                    status: record.status,
                    checkInTime: record.checkInTime,
                    checkOutTime: record.checkOutTime
                });

                summary.dailyStats[dateKey].members.total++;
                if (record.status === 'present') {
                    summary.dailyStats[dateKey].members.present++;
                } else if (record.status === 'absent') {
                    summary.dailyStats[dateKey].members.absent++;
                }
            } else if (record.personType === 'trainer') {
                if (!summary.trainerAttendance[personKey]) {
                    summary.trainerAttendance[personKey] = {
                        ...personData,
                        attendance: []
                    };
                }
                summary.trainerAttendance[personKey].attendance.push({
                    date: dateKey,
                    status: record.status,
                    checkInTime: record.checkInTime,
                    checkOutTime: record.checkOutTime
                });

                summary.dailyStats[dateKey].trainers.total++;
                if (record.status === 'present') {
                    summary.dailyStats[dateKey].trainers.present++;
                } else if (record.status === 'absent') {
                    summary.dailyStats[dateKey].trainers.absent++;
                }
            }
        });

        res.json(summary);
    } catch (error) {
        console.error('Error fetching attendance summary:', error);
        res.status(500).json({ error: 'Failed to fetch attendance summary' });
    }
});

// Get attendance statistics
router.get('/stats/:month/:year', gymadminAuth, async (req, res) => {
    try {
        const { month, year } = req.params;
        const gymId = req.admin.id; // Use req.admin.id from current auth structure

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendance = await Attendance.find({
            gymId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });

        const stats = {
            totalRecords: attendance.length,
            memberStats: {
                present: 0,
                absent: 0,
                total: 0
            },
            trainerStats: {
                present: 0,
                absent: 0,
                total: 0
            },
            dailyTrends: {}
        };

        attendance.forEach(record => {
            const dateKey = record.date.toISOString().split('T')[0];
            
            if (!stats.dailyTrends[dateKey]) {
                stats.dailyTrends[dateKey] = {
                    members: { present: 0, absent: 0 },
                    trainers: { present: 0, absent: 0 }
                };
            }

            if (record.personType === 'member') {
                stats.memberStats.total++;
                if (record.status === 'present') {
                    stats.memberStats.present++;
                    stats.dailyTrends[dateKey].members.present++;
                } else if (record.status === 'absent') {
                    stats.memberStats.absent++;
                    stats.dailyTrends[dateKey].members.absent++;
                }
            } else if (record.personType === 'trainer') {
                stats.trainerStats.total++;
                if (record.status === 'present') {
                    stats.trainerStats.present++;
                    stats.dailyTrends[dateKey].trainers.present++;
                } else if (record.status === 'absent') {
                    stats.trainerStats.absent++;
                    stats.dailyTrends[dateKey].trainers.absent++;
                }
            }
        });

        res.json(stats);
    } catch (error) {
        console.error('Error fetching attendance statistics:', error);
        res.status(500).json({ error: 'Failed to fetch attendance statistics' });
    }
});

// Bulk mark attendance
router.post('/bulk', gymadminAuth, async (req, res) => {
    try {
        const { attendanceRecords } = req.body;
        const gymId = req.admin.id; // Use req.admin.id from current auth structure

        const promises = attendanceRecords.map(async (record) => {
            const { personId, personType, date, status, checkInTime, checkOutTime } = record;

            let attendance = await Attendance.findOne({
                gymId,
                personId,
                date: new Date(date)
            });

            if (attendance) {
                attendance.status = status;
                attendance.checkInTime = checkInTime;
                attendance.checkOutTime = checkOutTime;
                attendance.updatedAt = new Date();
            } else {
                attendance = new Attendance({
                    gymId,
                    personId,
                    personType,
                    date: new Date(date),
                    status,
                    checkInTime,
                    checkOutTime
                });
            }

            return attendance.save();
        });

        await Promise.all(promises);
        res.json({ message: 'Bulk attendance marked successfully' });
    } catch (error) {
        console.error('Error bulk marking attendance:', error);
        res.status(500).json({ error: 'Failed to bulk mark attendance' });
    }
});

module.exports = router;
