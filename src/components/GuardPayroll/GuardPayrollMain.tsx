import React, { useState, useEffect } from 'react';
import { TimeRecordTable } from './TimeRecordTable';
import { PayrollCalculator } from './PayrollCalculator';
import { api } from '../../lib/api';

import { Printer } from 'lucide-react';
import type { PayrollCalculatorRef } from './PayrollCalculator';

export const GuardPayrollMain: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'RECORDS' | 'PAYROLL'>('RECORDS');
    const payrollRef = React.useRef<PayrollCalculatorRef>(null);

    // Shared Filter State
    const [selectedMonth, setSelectedMonth] = useState(''); // YYYY-MM
    const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | '1' | '2'>('ALL');
    const [selectedGuard, setSelectedGuard] = useState('ALL');
    const [guardList, setGuardList] = useState<string[]>([]);

    useEffect(() => {
        // Set default month to current month
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${yyyy}-${mm}`);

        // Fetch Guard List for Dropdown
        const fetchGuards = async () => {
            try {
                const data = await api.getGuardTimeRecords(500);
                if (Array.isArray(data)) {
                    const guards = Array.from(new Set(data.map(r => r.guardName))).filter(Boolean).sort();
                    setGuardList(guards);
                }
            } catch (error) {
                console.error("Failed to fetch guard list", error);
            }
        };
        fetchGuards();
    }, []);



    const refreshTrigger = 0;

    const handlePrint = () => {
        if (payrollRef.current) {
            payrollRef.current.print();
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">รายงานบันทึกเวลา และค่าจ้าง รปภ.</h1>
                <p className="mt-2 text-gray-600">จัดการเวลาเข้า-ออก และคำนวณเงินเดือนเจ้าหน้าที่รักษาความปลอดภัย</p>
            </div>

            {/* Filter Controls (Shared) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">รปภ.</label>
                        <select
                            value={selectedGuard}
                            onChange={(e) => setSelectedGuard(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                        >
                            <option value="ALL">ทุกท่าน</option>
                            {guardList.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">เดือน</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">งวด</label>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value as any)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">ทั้งเดือน</option>
                            <option value="1">งวดที่ 1 (1-15)</option>
                            <option value="2">งวดที่ 2 (16-สิ้นเดือน)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tab Navigation & Actions */}
            <div className="border-b border-gray-200 mb-6 flex justify-between items-end">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('RECORDS')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'RECORDS'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        ตารางบันทึกเวลา
                    </button>
                    <button
                        onClick={() => setActiveTab('PAYROLL')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'PAYROLL'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        การคำนวณค่าจ้าง
                    </button>
                </nav>

                {/* Print Button aligned with Tabs */}
                {activeTab === 'PAYROLL' && (
                    <button
                        onClick={handlePrint}
                        className="mb-2 flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-bold text-sm"
                    >
                        <Printer size={16} />
                        <span>พิมพ์รายงาน</span>
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div>
                {activeTab === 'RECORDS' && (
                    <TimeRecordTable
                        filterMonth={selectedMonth}
                        filterPeriod={selectedPeriod}
                        filterGuard={selectedGuard}
                        refreshTrigger={refreshTrigger}
                    />
                )}
                {activeTab === 'PAYROLL' && (
                    <PayrollCalculator
                        ref={payrollRef}
                        filterMonth={selectedMonth}
                        filterPeriod={selectedPeriod}
                        filterGuard={selectedGuard}
                        refreshTrigger={refreshTrigger}
                    />
                )}
            </div>
        </div>
    );
};
