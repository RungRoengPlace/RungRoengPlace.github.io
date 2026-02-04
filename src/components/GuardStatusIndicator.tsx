import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export const GuardStatusIndicator: React.FC = () => {
    const [status, setStatus] = useState<'LOADING' | 'HOLIDAY' | 'OUTSIDE_HOURS' | 'WORKING' | 'ABSENT'>('LOADING');

    // Working Hours: 06:30 - 18:30
    const WORK_START_HOUR = 6;
    const WORK_START_MINUTE = 30;
    const WORK_END_HOUR = 18;
    const WORK_END_MINUTE = 30;

    // Lunch Break: 12:00 - 13:00 (Approximate)
    const LUNCH_START_HOUR = 12;
    const LUNCH_END_HOUR = 13;

    const checkStatus = async () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeVal = currentHour * 60 + currentMinute;
        const isSunday = now.getDay() === 0;

        // 1. Check Holiday (Sunday)
        if (isSunday) {
            setStatus('HOLIDAY');
            return;
        }

        // Convert times to minutes for comparison
        const workStartVal = WORK_START_HOUR * 60 + WORK_START_MINUTE;
        const workEndVal = WORK_END_HOUR * 60 + WORK_END_MINUTE;
        const lunchStartVal = LUNCH_START_HOUR * 60;
        const lunchEndVal = LUNCH_END_HOUR * 60;

        // 2. Check Outside Working Hours
        const isBeforeWork = currentTimeVal < workStartVal;
        const isAfterWork = currentTimeVal >= workEndVal;
        const isLunch = currentTimeVal >= lunchStartVal && currentTimeVal < lunchEndVal;

        if (isBeforeWork || isAfterWork || isLunch) {
            setStatus('OUTSIDE_HOURS');
            return;
        }

        // 3. Check Inside Working Hours
        try {
            // Fetch records, using 500 to match main component behavior
            const records = await api.getGuardTimeRecords(500);

            const todayStr = now.toISOString().split('T')[0];

            // Note: api.ts normalizeThaiDate returns ISO strings
            const todayRecords = records.filter(r => {
                if (!r.timestamp || r.guardName === 'ทดสอบ') return false;
                return r.timestamp.startsWith(todayStr);
            });

            if (todayRecords.length === 0) {
                setStatus('ABSENT');
                return;
            }

            // Find the latest record
            const sorted = todayRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const latest = sorted[0];

            if (latest.eventType.includes('เข้า')) {
                setStatus('WORKING');
            } else if (latest.eventType.includes('พัก')) {
                setStatus('OUTSIDE_HOURS'); // Lunch break
            } else {
                setStatus('ABSENT');
            }

        } catch (err) {
            console.error(err);
            setStatus('ABSENT');
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    if (status === 'LOADING') return null;

    const config = {
        'HOLIDAY': { color: 'bg-yellow-400', text: 'วันหยุด' },
        'OUTSIDE_HOURS': { color: 'bg-yellow-400', text: 'นอกเวลาปฏิบัติงาน' },
        'WORKING': { color: 'bg-green-500', text: 'กำลังปฏิบัติงาน' },
        'ABSENT': { color: 'bg-red-500', text: 'ไม่มาปฏิบัติงาน' },
    }[status];

    return (
        <div className="hidden md:flex items-center space-x-2 mr-4 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm">
            <span className="text-sm text-slate-300 font-normal">สถานะ รปภ :</span>
            <span className={`flex h-3 w-3 rounded-full ${config.color} shadow-[0_0_8px_rgba(0,0,0,0.5)] animate-pulse`}></span>
            <span className="text-sm text-white/90 font-medium tracking-wide">
                {config.text}
            </span>
        </div>
    );
};
