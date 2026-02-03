import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { api } from '../../lib/api';
import { calculatePayroll, type PayrollSummary } from '../../lib/payroll-utils';
import type { GuardTimeRecord } from '../../types';
import html2canvas from 'html2canvas';

interface PayrollCalculatorProps {
    filterMonth: string;
    filterPeriod: 'ALL' | '1' | '2';
    filterGuard: string;
    refreshTrigger: number;
}

export interface PayrollCalculatorRef {
    print: () => void;
}

export const PayrollCalculator = forwardRef<PayrollCalculatorRef, PayrollCalculatorProps>(({
    filterMonth,
    filterPeriod,
    filterGuard,
    refreshTrigger
}, ref) => {
    // const [period, setPeriod] = useState<'A' | 'B' | 'CUSTOM'>('A'); // Removed
    // const [customStart, setCustomStart] = useState(''); // Removed
    // const [customEnd, setCustomEnd] = useState(''); // Removed
    const [records, setRecords] = useState<GuardTimeRecord[]>([]);
    const [summary, setSummary] = useState<PayrollSummary[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch on mount or refresh
    const fetchAndCalculate = async () => {
        setLoading(true);
        try {
            const data = await api.getGuardTimeRecords(500);
            if (Array.isArray(data)) {
                setRecords(data);
            } else {
                console.error("API did not return an array:", data);
                setRecords([]);
            }
        } catch (error) {
            console.error(error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAndCalculate();
    }, [refreshTrigger]);

    useEffect(() => {
        if (records.length === 0 || !filterMonth) return;

        // Calculate Date Range based on Filters
        const [year, month] = filterMonth.split('-').map(Number);

        // Construct Start/End Dates
        let startDay = 1;
        let endDay = new Date(year, month, 0).getDate(); // Last day of month

        if (filterPeriod === '1') {
            endDay = 15;
        } else if (filterPeriod === '2') {
            startDay = 16;
        }

        // Format YYYY-MM-DD
        const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

        // Calculate
        const result = calculatePayroll(records, startDate, endDate);

        // Filter by Guard if needed
        let filteredResult = result;
        if (filterGuard !== 'ALL') {
            filteredResult = result.filter(s => s.guardName === filterGuard);
        }

        setSummary(filteredResult);

    }, [records, filterMonth, filterPeriod, filterGuard]);

    // Memoize the formatter instance to avoid recreating it on every render
    const formatCurrency = useMemo(() => {
        const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' });
        return (amount: number) => formatter.format(amount);
    }, []);

    const reportRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = async () => {
        if (!reportRef.current) return;

        const reportDiv = reportRef.current;
        let originalMinWidth = '';

        // 1. Force Desktop Width for consistent report layout (Horizontal Cards) always
        originalMinWidth = reportDiv.style.minWidth;
        reportDiv.style.minWidth = '1200px';

        // 2. Create & Add Header for Report
        const [y, m] = filterMonth.split('-').map(Number);
        const dateObj = new Date(y, m - 1);
        const thaiMonth = dateObj.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

        let periodText = 'ทั้งเดือน';
        if (filterPeriod === '1') periodText = 'งวดที่ 1 (1-15)';
        if (filterPeriod === '2') periodText = 'งวดที่ 2 (16-สิ้นเดือน)';

        const headerDiv = document.createElement('div');
        headerDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                <div>
                    <h2 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 0;">รายงานสรุปค่าจ้าง รปภ.</h2>
                    <p style="font-size: 16px; color: #64748b; margin: 5px 0 0 0;">ประจำเดือน: <span style="color: #0f172a; font-weight: 600;">${thaiMonth}</span> | งวด: <span style="color: #0f172a; font-weight: 600;">${periodText}</span></p>
                </div>
                <div style="text-align: right;">
                     <p style="font-size: 12px; color: #94a3b8; margin: 0;">วันที่พิมพ์รายงาน</p>
                     <p style="font-size: 14px; font-weight: 600; color: #475569; margin: 0;">${new Date().toLocaleString('th-TH')}</p>
                </div>
            </div>
        `;

        // Insert header at top
        reportDiv.insertBefore(headerDiv, reportDiv.firstChild);

        try {
            // 3. Capture
            const canvas = await html2canvas(reportDiv, {
                scale: 2,
                backgroundColor: '#ffffff', // Force white background
                windowWidth: 1400 // Simulate specific window width
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `payroll-report-${filterMonth}-${filterPeriod}.png`;
            link.click();

        } catch (error) {
            console.error('Print failed', error);
        } finally {
            // 4. Cleanup
            if (headerDiv.parentNode === reportDiv) {
                reportDiv.removeChild(headerDiv);
            }
            reportDiv.style.minWidth = originalMinWidth;
        }
    };

    useImperativeHandle(ref, () => ({
        print: handlePrint
    }));

    return (
        <div ref={reportRef} className="space-y-6 relative p-2">
            {/* Note: Filters are now controlling this view from parent */}

            {/* Content */}
            {loading ? (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">กำลังดึงข้อมูล...</p>
                </div>
            ) : summary.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {summary.map((guard, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{guard.guardName}</h3>
                                    <p className="text-sm text-gray-500">รวมทำงาน {guard.totalDays} วัน | สาย {guard.totalLateDays} วัน | ขาด {guard.totalAbsentDays} วัน</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase">รายรับสุทธิ</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(guard.netPayable)}</p>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-100">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">ค่าจ้างรวม</p>
                                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(guard.totalWage)}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">หักสาย/ขาด</p>
                                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(guard.totalDeduction)}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">เบี้ยขยัน</p>
                                    <p className="text-lg font-semibold text-yellow-700">+{formatCurrency(guard.diligenceBonus)}</p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        {guard.totalLateDays === 0 && guard.totalAbsentDays === 0 ? 'เข้าเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">สุทธิ</p>
                                    <p className="text-lg font-bold text-green-700">{formatCurrency(guard.netPayable)}</p>
                                </div>
                            </div>

                            {/* Details Accordion (Simplified as always open or valid region) */}
                            <div className="px-6 py-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">รายละเอียดรายวัน</h4>
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">วันที่</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">เข้า</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">ออก</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">สาย (นาที)</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">ค่าแรง</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">หัก</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">สุทธิ</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">หมายเหตุ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {guard.details.filter(d => {
                                                const now = new Date();
                                                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                                                if (filterMonth === currentMonth) {
                                                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                                    return d.date <= todayStr;
                                                }
                                                return true;
                                            }).map((d, i) => (
                                                <tr key={i} className={d.note === 'วันหยุด' ? 'bg-green-50' : d.isAbsent ? 'bg-red-50' : ''}>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{d.date}</td>
                                                    <td className="px-4 py-2 text-center text-sm text-gray-500">
                                                        {d.checkIn ? new Date(d.checkIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-sm text-gray-500">
                                                        {d.checkOut ? new Date(d.checkOut).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                    <td className={`px-4 py-2 text-center text-sm ${d.isLate ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                        {d.lateMinutes > 0 ? d.lateMinutes : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm text-gray-900">{d.wage}</td>
                                                    <td className="px-4 py-2 text-right text-sm text-red-600">{d.deduction > 0 ? -d.deduction : '-'}</td>
                                                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{d.netWage}</td>
                                                    <td className="px-4 py-2 text-left text-sm text-gray-600">
                                                        {d.note && (
                                                            <span className={d.note === 'ขาดงาน' ? 'text-red-600 font-semibold' : d.note === 'วันหยุด' ? 'text-green-600 font-semibold' : ''}>
                                                                {d.note}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
