import React, { useMemo, useRef } from 'react';
import type { BookBankMovement, Expense, Income } from '../../../types';
import { Landmark, ArrowUpCircle, ArrowDownCircle, Printer } from 'lucide-react';
import clsx from 'clsx';
import html2canvas from 'html2canvas';

interface BookBankReportProps {
    year: number;
    setYear: (year: number) => void;
    movements: BookBankMovement[];
    expenses: Expense[];
    incomes: Income[];
}

export const BookBankReport: React.FC<BookBankReportProps> = ({ year, setYear, movements, expenses, incomes }) => {
    const reportRef = useRef<HTMLDivElement>(null);

    // Filter by year if needed, but usually Account Balance is cumulative.
    // However, the prompt mentions "Report... visually displays...".
    // Let's show All Time Balance, but maybe filter movements list by year if we show a table.
    // For the Summary Cards, we should likely use ALL time to get correct balance.

    const mainAccountName = 'บัญชีหลัก';
    const secondaryAccountName = 'บัญชีรอง';

    const stats = useMemo(() => {
        // Use ALL TIME data for correct Balance calculation
        const totalExpensesTab = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncomesTab = incomes.reduce((sum, i) => sum + i.amount, 0);

        // Calculate Secondary Account Stats (All Time)
        // Balance = (Deposits + Revenue) - (Withdraws + Expenses)
        // Assumption: 'Shared' Revenue and Expenses flow through the Secondary Account (Operating Account)

        const secondaryMovements = movements.filter(m => m.account === secondaryAccountName);
        const secondaryDeposit = secondaryMovements.filter(m => m.type === 'ฝาก').reduce((sum, m) => sum + m.amount, 0);
        const secondaryBookWithdraw = secondaryMovements.filter(m => m.type === 'ถอน').reduce((sum, m) => sum + m.amount, 0);

        // Combine Revenue sources
        const secondaryTotalDeposit = secondaryDeposit + totalIncomesTab;

        // Combine Withdrawals sources
        const secondaryTotalWithdraw = secondaryBookWithdraw + totalExpensesTab;

        const secondaryBalance = secondaryTotalDeposit - secondaryTotalWithdraw;

        // Calculate Main Account Stats (All Time)
        const mainMovements = movements.filter(m => m.account === mainAccountName);
        const mainDeposit = mainMovements.filter(m => m.type === 'ฝาก').reduce((sum, m) => sum + m.amount, 0);
        const mainWithdraw = mainMovements.filter(m => m.type === 'ถอน').reduce((sum, m) => sum + m.amount, 0);
        const mainBalance = mainDeposit - mainWithdraw;

        const totalBalance = mainBalance + secondaryBalance;

        return {
            secondary: {
                deposit: secondaryTotalDeposit,
                withdraw: secondaryTotalWithdraw,
                balance: secondaryBalance,
                bookDeposit: secondaryDeposit,
                bookWithdraw: secondaryBookWithdraw
            },
            main: { deposit: mainDeposit, withdraw: mainWithdraw, balance: mainBalance },
            totalBalance: totalBalance,
            totalExpensesTab,
            totalIncomesTab
        };
    }, [movements, expenses, incomes]);

    const years = Array.from(new Set(movements.map(m => new Date(m.date).getFullYear()))).sort((a, b) => b - a);
    if (!years.includes(year)) years.push(year);

    // Filter movements for the list view (Yearly?)
    const yearlyMovements = movements.filter(m => new Date(m.date).getFullYear() === year);

    const handlePrint = async () => {
        if (!reportRef.current) return;

        const reportDiv = reportRef.current;
        const movementsList = reportDiv.querySelector('#movements-list') as HTMLElement;
        let originalDisplay = '';

        // Add Timestamp overlay
        const timestampDiv = document.createElement('div');
        timestampDiv.innerText = `พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}`;
        timestampDiv.style.position = 'absolute';
        timestampDiv.style.top = '10px';
        timestampDiv.style.right = '10px';
        timestampDiv.style.fontSize = '12px';
        timestampDiv.style.color = '#64748b';
        timestampDiv.style.fontWeight = 'bold';
        timestampDiv.style.background = 'rgba(255,255,255,0.8)';
        timestampDiv.style.padding = '4px 8px';
        timestampDiv.style.borderRadius = '4px';
        timestampDiv.style.zIndex = '1000';
        reportDiv.style.position = 'relative';
        reportDiv.appendChild(timestampDiv);

        if (movementsList) {
            originalDisplay = movementsList.style.display;
            movementsList.style.display = 'none';
        }

        try {
            const canvas = await html2canvas(reportDiv, {
                scale: 2,
                backgroundColor: '#f8fafc',
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `book-bank-report-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
        } catch (error) {
            console.error('Print failed', error);
        } finally {
            reportDiv.removeChild(timestampDiv);
            if (movementsList) {
                movementsList.style.display = originalDisplay;
            }
        }
    };

    return (
        <div className="space-y-6">

            {/* Header Action Bar */}
            <div className="flex justify-end">
                <button
                    onClick={handlePrint}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm font-bold text-sm"
                >
                    <Printer size={16} />
                    <span>พิมพ์รายงาน</span>
                </button>
            </div>

            <div ref={reportRef} className="space-y-6 p-4 bg-slate-50 rounded-2xl">
                {/* Total Balance Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Landmark size={150} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-blue-100 font-medium text-lg mb-1">ยอดเงินรวมทั้งหมด (บัญชีหลัก + บัญชีรอง)</h2>
                        <div className="text-5xl font-black tracking-tight my-2 drop-shadow-md">
                            ฿ {stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex space-x-6 mt-4 opacity-90 text-sm font-medium">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>{mainAccountName}: {stats.main.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                <span>{secondaryAccountName}: {stats.secondary.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Breakdown Header */}
                <div className="flex justify-between items-center mt-2">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full block"></span>
                        รายละเอียด: {secondaryAccountName} (ทั้งหมด)
                    </h3>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Deposit */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 bg-green-50 rounded-full text-green-600 mb-2"><ArrowUpCircle size={32} /></div>
                        <span className="text-slate-500 text-sm font-bold uppercase">ยอดเงินฝากรวม</span>
                        <span className="text-3xl font-bold text-green-600">{stats.secondary.deposit.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">รวมรายรับทั้งหมด</span>
                    </div>

                    {/* Withdraw */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 bg-red-50 rounded-full text-red-600 mb-2"><ArrowDownCircle size={32} /></div>
                        <span className="text-slate-500 text-sm font-bold uppercase">ยอดเงินถอนรวม</span>
                        <span className="text-3xl font-bold text-red-600">{stats.secondary.withdraw.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">รวมรายจ่ายทั้งหมด</span>
                    </div>

                    {/* Balance */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 flex flex-col items-center justify-center space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mb-2"><Landmark size={32} /></div>
                        <span className="text-slate-500 text-sm font-bold uppercase">ยอดคงเหลือในบัญชี</span>
                        <span className="text-4xl font-black text-indigo-600">
                            {stats.secondary.balance.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400">สุทธิ (รวมรายรับ-รายจ่าย)</span>
                    </div>
                </div>

                {/* Comparison / Analysis */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 border-l-4 border-indigo-500 pl-3">วิเคราะห์สถานะการเงิน (เฉพาะบัญชีรอง)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-600 font-medium">+ เงินฝาก (Book Bank)</span>
                                <span className="font-bold text-green-600 text-lg">{stats.secondary.bookDeposit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-600 font-medium">+ รายรับค่าส่วนกลาง (ทั้งหมด)</span>
                                <span className="font-bold text-teal-600 text-lg">{stats.totalIncomesTab.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-600 font-medium">- รายจ่ายรวม (ทั้งหมด)</span>
                                <span className="font-bold text-orange-600 text-lg"> ({stats.totalExpensesTab.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-600 font-medium">- ถอนเงิน (Book Bank)</span>
                                <span className="font-bold text-red-600 text-lg"> ({stats.secondary.bookWithdraw.toLocaleString()})</span>
                            </div>

                            <hr className="border-slate-200" />
                            <div className="flex justify-between items-center p-4 bg-slate-100 rounded-xl border border-slate-200">
                                <span className="text-slate-800 font-bold">คงเหลือสุทธิ</span>
                                <span className={clsx("font-bold text-xl", stats.secondary.balance >= 0 ? "text-green-600" : "text-red-600")}>
                                    {stats.secondary.balance.toLocaleString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">* คิดจากยอดเงินฝาก + รายรับ - รายจ่าย - ยอดถอน</p>
                        </div>
                    </div>
                </div>

                {/* Movements List */}
                <div id="movements-list" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div className="font-bold text-slate-600">รายการเคลื่อนไหว ปี {year + 543}</div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-slate-500">เลือกปี:</span>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm"
                            >
                                {years.map(y => <option key={y} value={y}>{y + 543}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-slate-500 uppercase font-bold text-xs sticky top-0 border-b">
                                <tr>
                                    <th className="px-6 py-3">วันที่</th>
                                    <th className="px-6 py-3">รายการ</th>
                                    <th className="px-6 py-3 text-right">จำนวนเงิน</th>
                                    <th className="px-6 py-3">หมายเหตุ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {yearlyMovements.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">ไม่มีข้อมูลในปีนี้</td></tr>
                                ) : yearlyMovements.map((m, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-slate-600">{new Date(m.date).toLocaleDateString('th-TH')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={clsx("w-fit px-2 py-1 rounded text-xs font-bold mb-1", m.type === 'ฝาก' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                                    {m.type}
                                                </span>
                                                <span className="text-xs text-slate-400">{m.account}</span>
                                            </div>
                                        </td>
                                        <td className={clsx("px-6 py-4 text-right font-mono font-bold", m.type === 'ฝาก' ? "text-green-600" : "text-red-600")}>
                                            {m.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{m.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
