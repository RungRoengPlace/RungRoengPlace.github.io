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

const DAILY_WAGE = 420;
const LATE_PENALTY_THRESHOLD_1 = 15; // Minutes
const LATE_PENALTY_THRESHOLD_2 = 30; // Minutes
const HOURLY_RATE = DAILY_WAGE / 12;

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

        while (cur <= end) {
            const dateStr = cur.toISOString().split("T")[0];
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
                    note = 'ขาดงาน';
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

                if (checkInRecord) {
                    const dt = getThaiDate(checkInRecord.timestamp);
                    const hours = dt.getUTCHours();
                    const mins = dt.getUTCMinutes();

                    const startMins = 6 * 60 + 30; // 06:30
                    const actualMins = hours * 60 + mins;

                    if (actualMins > startMins) {
                        lateMinutes = actualMins - startMins;
                        if (lateMinutes > LATE_PENALTY_THRESHOLD_2) {
                            isLate = true;
                            deduction = HOURLY_RATE * 1;
                        } else if (lateMinutes > LATE_PENALTY_THRESHOLD_1) {
                            isLate = true;
                            deduction = HOURLY_RATE * 0.5;
                        }
                    }
                    checkInTime = checkInRecord.timestamp;
                }

                const dailyWage = DAILY_WAGE;

                details.push({
                    date: dateStr,
                    guardName,
                    checkIn: checkInTime || undefined,
                    checkOut: checkOutRecord?.timestamp,
                    isLate,
                    lateMinutes,
                    isAbsent: false,
                    totalWorkHours: 12, // Assume full shift if present
                    wage: dailyWage,
                    deduction,
                    netWage: dailyWage - deduction,
                    note: ''
                });

                if (isLate) totalLateDays++;
                totalWage += dailyWage;
                totalDeduction += deduction;
            }
            cur.setDate(cur.getDate() + 1);
        }

        const isBonusEligible = totalLateDays === 0 && totalAbsentDays === 0;
        const diligenceBonus = isBonusEligible ? 0 : 0;

        summaries.push({
            guardName,
            totalDays: details.filter(d => !d.isAbsent).length,
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
