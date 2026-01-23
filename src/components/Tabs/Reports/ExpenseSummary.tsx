import React, { useMemo, useState } from 'react';
import type { Expense } from '../../../types';
import { MONTH_NAMES } from '../../../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PieChart, BarChart3, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import expenseTypesOrder from '../../../data/expenseTypes.json';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, ChartDataLabels);

interface ExpenseSummaryProps {
    year: number;
    setYear: (y: number) => void;
    expenses: Expense[];
}

const SHORT_MONTH_NAMES = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ year, setYear, expenses }) => {
    const [selectedType, setSelectedType] = useState<string | null>(null);



    const { chartData, barData, tableData, totalExpense, expenseTypes } = useMemo(() => {
        const yearExpenses = expenses.filter(ex => new Date(ex.date).getFullYear() === year);
        // Get unique types from data
        const uniqueTypes = Array.from(new Set(yearExpenses.map(e => e.type)));

        // Sort types based on the order in expenseTypes.json
        const types = uniqueTypes.sort((a, b) => {
            const indexA = expenseTypesOrder.indexOf(a);
            const indexB = expenseTypesOrder.indexOf(b);
            // If both are in the list, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If one is not in the list (e.g. new type), put it at the end
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return a.localeCompare(b);
        });

        // 1. Pie Chart Data
        const byType = types.map(t => yearExpenses.filter(e => e.type === t).reduce((sum, curr) => sum + curr.amount, 0));

        // 2. Bar Chart Data
        const filteredExpenses = selectedType
            ? yearExpenses.filter(e => e.type === selectedType)
            : yearExpenses;

        const byMonth = MONTH_NAMES.map(m =>
            filteredExpenses.filter(e => e.month === m).reduce((sum, curr) => sum + curr.amount, 0)
        );

        // 3. Table Data
        const crossTab = types.map(type => {
            const row = MONTH_NAMES.map(month => {
                return yearExpenses
                    .filter(e => e.type === type && e.month === month)
                    .reduce((sum, curr) => sum + curr.amount, 0);
            });
            return { type, data: row, total: row.reduce((a, b) => a + b, 0) };
        });

        const grandTotal = byType.reduce((a, b) => a + b, 0);

        return {
            chartData: {
                labels: types,
                datasets: [{
                    label: 'Expense Share',
                    data: byType,
                    backgroundColor: ['#4c1d95', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
                    borderWidth: 1,
                    borderColor: '#fff',
                    hoverOffset: 20
                }]
            },
            barData: {
                labels: SHORT_MONTH_NAMES, // Use short names for Chart Labels
                datasets: [{
                    label: selectedType || 'Total Monthly',
                    data: byMonth,
                    backgroundColor: selectedType ? '#d946ef' : '#7c3aed',
                    borderRadius: 4,
                }]
            },
            tableData: crossTab,
            totalExpense: grandTotal,
            expenseTypes: types
        };
    }, [expenses, year, selectedType]);

    const handlePieClick = (_: any, elements: any[]) => {
        if (elements.length > 0) {
            const index = elements[0].index;
            const type = expenseTypes[index];
            setSelectedType(prev => prev === type ? null : type);
        } else {
            setSelectedType(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-200 text-white">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">สรุปรายจ่ายภาพรวม</h2>
                        <p className="text-sm text-purple-600">Cross-tab สรุปรายจ่ายแต่ละประเภท</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-500">เลือกปี:</span>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border border-purple-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none text-purple-800 font-bold"
                    >
                        {[...Array(5)].map((_, i) => {
                            const y = new Date().getFullYear() - i;
                            return <option key={y} value={y}>ปี {y + 543} ({y})</option>;
                        })}
                    </select>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-purple-900 flex items-center">
                            <PieChart size={18} className="mr-2 text-purple-500" />
                            สัดส่วนรายจ่ายตามประเภท
                        </h3>
                        {selectedType && (
                            <button onClick={() => setSelectedType(null)} className="text-xs text-slate-400 hover:text-purple-600 flex items-center">
                                <RotateCcw size={12} className="mr-1" /> Reset
                            </button>
                        )}
                    </div>
                    <div className="flex-grow flex flex-col items-center justify-center relative">
                        {totalExpense > 0 ? (
                            <>
                                <div className="h-64 w-full">
                                    <Pie
                                        data={chartData}
                                        options={{
                                            maintainAspectRatio: false,
                                            onClick: handlePieClick,
                                            plugins: {
                                                legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } },
                                                tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${Number(ctx.raw).toLocaleString()} บาท` } },
                                                datalabels: { display: false } // Disable datalabels for Pie
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-4">* คลิกที่กราฟวงกลมเพื่อดูรายละเอียดรายเดือน</p>
                            </>
                        ) : (
                            <div className="text-center text-slate-300">ไม่มีข้อมูลรายจ่าย</div>
                        )}
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-purple-900 flex items-center truncate">
                            <BarChart3 size={18} className="mr-2 text-purple-500 shrink-0" />
                            <span className="truncate">
                                รายจ่ายรายเดือน: {selectedType || 'ภาพรวมรายจ่ายทั้งหมด'}
                            </span>
                        </h3>
                    </div>
                    <div className="flex-grow">
                        {totalExpense > 0 ? (
                            <Bar
                                data={barData}
                                options={{
                                    maintainAspectRatio: false,
                                    scales: { y: { grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } },
                                    layout: { padding: { top: 20 } },
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: (ctx) => ` ${ctx.formattedValue} บาท`
                                            }
                                        },
                                        datalabels: {
                                            display: true,
                                            align: 'end',
                                            anchor: 'end',
                                            formatter: (value) => value > 0 ? value.toLocaleString() : '',
                                            font: { size: 10, weight: 'bold' },
                                            color: '#6b21a8'
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300">ไม่มีข้อมูลรายจ่าย</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cross-tab Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="w-full text-sm relative">
                        <thead className="sticky top-0 z-40 shadow-sm ring-1 ring-slate-200">
                            <tr className="bg-slate-100 text-slate-700 font-extrabold text-sm uppercase tracking-wider">
                                <th className="sticky top-0 left-0 z-50 p-4 text-left min-w-[100px] sticky-col bg-slate-100 border-b border-purple-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">ประเภทรายจ่าย</th>
                                {SHORT_MONTH_NAMES.map(m => (
                                    <th key={m} className="sticky top-0 z-40 p-3 text-right bg-slate-100 border-b border-purple-100 min-w-[80px]">{m}</th>
                                ))}
                                <th className="sticky top-0 z-40 p-4 text-right bg-slate-100 border-b border-purple-200 min-w-[100px]">รวมทั้งสิ้น</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                            {tableData.length === 0 ? (
                                <tr><td colSpan={14} className="text-center py-8 text-slate-400">ไม่พบข้อมูลรายจ่ายในปีนี้</td></tr>
                            ) : tableData.map((row) => (
                                <tr key={row.type} className={selectedType && selectedType !== row.type ? "opacity-40 grayscale transition-all" : "transition-all"}>
                                    <td className="p-4 font-medium text-slate-700 sticky-col bg-white shadow-sm border-r border-slate-100">{row.type}</td>
                                    {row.data.map((amount, idx) => (
                                        <td key={idx} className="p-3 text-right text-slate-600 font-mono">
                                            {amount > 0 ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                        </td>
                                    ))}
                                    <td className="p-4 text-right font-bold text-purple-700 bg-purple-50/30">
                                        {row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                            {/* Footer Row */}
                            <tr className="bg-purple-100/50 font-bold text-purple-900 text-xs uppercase cursor-default">
                                <td className="p-4 sticky-col bg-purple-100/30 border-t border-purple-200 text-center">รวมทั้งหมด</td>
                                {MONTH_NAMES.map((_, idx) => {
                                    const colTotal = tableData.reduce((sum, row) => sum + row.data[idx], 0);
                                    return (
                                        <td key={idx} className="p-3 text-right border-t border-purple-200">
                                            {colTotal > 0 ? colTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                        </td>
                                    );
                                })}
                                <td className="p-4 text-right bg-purple-200/50 border-t border-purple-300">
                                    {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-200 flex justify-between text-xs text-slate-400">
                    <div className="flex items-center"><ChevronLeft className="w-3 h-3 mr-1" />เลื่อนดูรายละเอียด</div>
                    <div className="flex items-center">เลื่อนดูรายละเอียด <ChevronRight className="w-3 h-3 ml-1" /></div>
                </div>
            </div>
        </div>
    );
};
