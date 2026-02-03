import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { GuardTimeRecord } from '../../types';

interface TimeRecordTableProps {
    filterMonth: string;
    filterPeriod: 'ALL' | '1' | '2';
    filterGuard: string;
    refreshTrigger: number;
}

export const TimeRecordTable: React.FC<TimeRecordTableProps> = ({
    filterMonth,
    filterPeriod,
    filterGuard,
    refreshTrigger
}) => {
    const [records, setRecords] = useState<GuardTimeRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<GuardTimeRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            // Fetch more records to ensure we have data for filters. 
            // In a real production app with thousands of records, backend filtering is required.
            const data = await api.getGuardTimeRecords(500);
            if (Array.isArray(data)) {
                setRecords(data);
            } else {
                console.error("API did not return an array:", data);
                setRecords([]);
            }
        } catch (error) {
            console.error("Failed to fetch records", error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [refreshTrigger]);

    // Filter Logic
    useEffect(() => {
        if (!filterMonth) return;

        let res = records;

        // 1. Filter by Month
        res = res.filter(r => {
            if (!r.timestamp) return false;
            // timestamp is ISO string
            return r.timestamp.startsWith(filterMonth);
        });

        // 2. Filter by Period
        if (filterPeriod !== 'ALL') {
            res = res.filter(r => {
                const day = new Date(r.timestamp).getDate();
                if (filterPeriod === '1') return day >= 1 && day <= 15;
                if (filterPeriod === '2') return day >= 16;
                return true;
            });
        }

        // 3. Filter by Guard
        if (filterGuard !== 'ALL') {
            res = res.filter(r => r.guardName === filterGuard);
        }

        setFilteredRecords(res);

    }, [records, filterMonth, filterPeriod, filterGuard]);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">บันทึกเวลาล่าสุด</h2>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วัน-เวลา</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ รปภ.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เหตุการณ์</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                    กำลังโหลดข้อมูล...
                                </td>
                            </tr>
                        ) : filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                    ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map((r, idx) => {
                                const date = new Date(r.timestamp);
                                const dateStr = date.toLocaleDateString('th-TH', {
                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                });

                                return (
                                    <tr key={r.rowIndex || idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dateStr}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{r.guardName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${r.eventType.includes('เข้างาน') || r.eventType.includes('Check-in') ? 'bg-green-100 text-green-800' :
                                                    r.eventType.includes('เลิกงาน') || r.eventType.includes('Check-out') ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {r.eventType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.status}</td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
