import type { GuardTimeRecord } from "../types";

export interface DailyWorkRecord {
    date: string;
    guardName: string;
    checkIn?: string; // ISO String
    checkOut?: string; // ISO String
    isLate: boolean;
    lateMinutes: number;
    isAbsent: boolean;
    totalWorkHours: number;
    wage: number;
    deduction: number;
    netWage: number;
    note?: string; // Remark (e.g., 'ขาดงาน')
}

export interface PayrollSummary {
    guardName: string;
    totalDays: number;
    totalLateDays: number;
    totalAbsentDays: number;
    totalWage: number;
    totalDeduction: number;
    diligenceBonus: number;
    netPayable: number;
    details: DailyWorkRecord[];
}

// Helper to get YYYY-MM-DD in Thai Timezone (UTC+7) safely
const getThaiDate = (isoString: string): Date => {
    const date = new Date(isoString);
    // Add 7 hours to convert UTC to Bangkok Time
    // Note: This creates a Date object that represents the Bangkok time as if it were UTC.
    // Useful for extracting Year/Month/Day/Hours consistent with Bangkok.
    return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};

const getThaiDateStr = (isoString: string) => {
    const thDate = getThaiDate(isoString);
    return thDate.toISOString().split('T')[0];
};

const getThaiHour = (isoString: string) => {
    return getThaiDate(isoString).getUTCHours();
};



export function calculatePayroll(
    records: GuardTimeRecord[],
    startDate: string,
    endDate: string
): PayrollSummary[] {
    // 1. Filter Records by Date Range
    const filtered = records.filter((r) => {
        const d = getThaiDateStr(r.timestamp);
        return d >= startDate && d <= endDate;
    });

    // 2. Group by Guard -> Date
    const grouped: Record<string, Record<string, GuardTimeRecord[]>> = {};

    filtered.forEach((r) => {
        if (!grouped[r.guardName]) grouped[r.guardName] = {};
        const date = getThaiDateStr(r.timestamp);
        if (!grouped[r.guardName][date]) grouped[r.guardName][date] = [];
        grouped[r.guardName][date].push(r);
    });

    const summaries: PayrollSummary[] = [];

    // 3. Process each Guard
    Object.keys(grouped).forEach((guardName) => {
        const days = grouped[guardName];
        const details: DailyWorkRecord[] = [];
        let totalLateDays = 0;
        let totalAbsentDays = 0;
        let totalWage = 0;
        let totalDeduction = 0;

        const cur = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date(); // Local date is fine to compare because we only use the date string
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        while (cur <= end) {
            const dateStr = cur.toISOString().split("T")[0];

            // Stop calculating if the date is in the future
            if (dateStr > todayStr) {
                break;
            }

            const dayOfWeek = cur.getDay(); // 0=Sun, 6=Sat

            // Spec: Working days: Monday to Saturday. Sunday is Off.
            const isWorkDay = dayOfWeek !== 0;

            const dailyRecords = days[dateStr] || [];

            if (dailyRecords.length === 0) {
                // NO RECORDS
                let note = '';
                let isAbsent = false;

                if (!isWorkDay) { // If it's Sunday
                    note = 'วันหยุด';
                    isAbsent = false; // Not considered absent for penalty
                } else { // If it's Mon-Sat
                    note = 'ขาด/ลา';
                    isAbsent = true;
                }

                details.push({
                    date: dateStr,
                    guardName,
                    isLate: false,
                    lateMinutes: 0,
                    isAbsent,
                    totalWorkHours: 0,
                    wage: 0,
                    deduction: 0,
                    netWage: 0,
                    note
                });

                if (isAbsent) totalAbsentDays++;

            } else {
                // PRESENCE (Even on Sunday/Holiday)

                // Sort records by time to be sure. Use rowIndex as tie-breaker.
                dailyRecords.sort((a, b) => {
                    const tA = new Date(a.timestamp).getTime();
                    const tB = new Date(b.timestamp).getTime();
                    if (tA !== tB) return tA - tB;
                    return (a.rowIndex || 0) - (b.rowIndex || 0);
                });

                // Flexible Check-In Detection
                let checkInRecord = dailyRecords.find(r => r.eventType.includes('เข้า') || r.eventType.includes('Check-in'));

                if (!checkInRecord && dailyRecords.length > 0) {
                    // Fallback: Use the earliest record if it's before noon
                    const first = dailyRecords[0];
                    if (getThaiHour(first.timestamp) < 12) {
                        checkInRecord = first;
                    }
                }

                // Flexible Check-Out Detection
                let checkOutRecord = [...dailyRecords].reverse().find(r => r.eventType.includes('เลิก') || r.eventType.includes('Check-out'));

                if (!checkOutRecord && dailyRecords.length > 0) {
                    // Fallback: Use the latest record if it's after noon
                    const last = dailyRecords[dailyRecords.length - 1];
                    // Ensure we don't treat a Check-In record as Check-Out
                    const isCheckIn = last.eventType.includes('เข้า') || last.eventType.includes('Check-in');
                    if (getThaiHour(last.timestamp) >= 12 && !isCheckIn) {
                        checkOutRecord = last;
                    }
                }

                // Conflict Resolution
                if (checkInRecord && checkOutRecord && checkInRecord.rowIndex === checkOutRecord.rowIndex) {
                    const hr = getThaiHour(checkInRecord.timestamp);
                    if (hr >= 12) {
                        checkInRecord = undefined;
                    } else {
                        checkOutRecord = undefined;
                    }
                }

                let checkInTime = null;
                let isLate = false;
                let lateMinutes = 0;
                let deduction = 0;
                let dailyWage = 0;
                let actualWorkHours = 0;
                let payableHoursForNote = 0;

                if (checkInRecord) {
                    checkInTime = checkInRecord.timestamp;
                    const inDt = getThaiDate(checkInTime);
                    const inHours = inDt.getUTCHours();
                    const inMins = inDt.getUTCMinutes();
                    const actualInMinsTotal = inHours * 60 + inMins;

                    if (checkOutRecord) {
                        const outDt = getThaiDate(checkOutRecord.timestamp);
                        actualWorkHours = (outDt.getTime() - inDt.getTime()) / (1000 * 60 * 60);
                    } else {
                        actualWorkHours = 12; // Fallback assume full day if no checkout
                    }

                    // 1. Calculate Base Wage
                    if (actualWorkHours >= 11) {
                        dailyWage = 420; // Full day
                    } else {
                        const exactHours = Math.floor(actualWorkHours);
                        const remainingMins = Math.round((actualWorkHours - exactHours) * 60);
                        let payableHours = exactHours;
                        if (remainingMins > 15) {
                            payableHours += 1;
                        }
                        payableHoursForNote = payableHours;
                        dailyWage = payableHours * 35; // Hourly for < 11 hours
                    }

                    // 2. Calculate Lateness
                    const expectedInMinsTotal = 6 * 60 + 30; // 06:30

                    if (actualInMinsTotal > expectedInMinsTotal) {
                        lateMinutes = actualInMinsTotal - expectedInMinsTotal;
                        if (lateMinutes > 15) {
                            isLate = true;
                            // Only deduct lateness penalty if they are on Full Day track
                            // Hourly workers already get paid less by hours worked.
                            if (dailyWage === 420) {
                                if (lateMinutes <= 30) {
                                    deduction = 17.5;
                                } else if (lateMinutes <= 59) {
                                    deduction = 35;
                                } else {
                                    // Round up to nearest hour
                                    deduction = Math.ceil(lateMinutes / 60) * 35;
                                }
                            }
                        }
                    }
                }

                let curNote = '';
                if (!isWorkDay) {
                    curNote = 'มาทำงานในวันหยุด';
                }

                if (dailyWage === 210) {
                    curNote = curNote ? `${curNote}, ทำงานครึ่งวัน` : 'ทำงานครึ่งวัน';
                } else if (dailyWage > 0 && dailyWage < 420) {
                    curNote = curNote ? `${curNote}, ทำงานรายชั่วโมง (${payableHoursForNote} ชม.)` : `ทำงานรายชั่วโมง (${payableHoursForNote} ชม.)`;
                }

                if (deduction >= 210) {
                    curNote = curNote ? `${curNote}, ขาด/ลา` : 'ขาด/ลา';
                }

                details.push({
                    date: dateStr,
                    guardName,
                    checkIn: checkInTime || undefined,
                    checkOut: checkOutRecord?.timestamp,
                    isLate,
                    lateMinutes,
                    isAbsent: false,
                    totalWorkHours: actualWorkHours > 0 ? Number(actualWorkHours.toFixed(2)) : 12,
                    wage: dailyWage > 0 ? Number(dailyWage.toFixed(2)) : 0,
                    deduction,
                    netWage: Number((dailyWage - deduction).toFixed(2)),
                    note: curNote
                });

                if (isLate) totalLateDays++;
                if (dailyWage < 210 || deduction >= 210) {
                    totalAbsentDays += 1;
                } else if (dailyWage === 210) {
                    totalAbsentDays += 0.5;
                }
                totalWage += dailyWage;
                totalDeduction += deduction;
            }
            cur.setDate(cur.getDate() + 1);
        }

        const isBonusEligible = totalLateDays === 0 && totalAbsentDays === 0;
        const diligenceBonus = isBonusEligible ? 0 : 0;

        summaries.push({
            guardName,
            totalDays: details.reduce((sum, d) => {
                if (d.isAbsent) return sum;
                if (d.wage === 0 && d.note === 'วันหยุด') return sum + 1;
                if (d.wage === 210) return sum + 0.5;
                if (d.wage < 210 && d.wage > 0) return sum + (d.wage / 420);
                if (d.deduction >= 210) return sum + 0.5;
                return sum + 1;
            }, 0),
            totalLateDays,
            totalAbsentDays,
            totalWage,
            totalDeduction,
            diligenceBonus,
            netPayable: totalWage - totalDeduction + diligenceBonus,
            details
        });

    });

    return summaries;
}
