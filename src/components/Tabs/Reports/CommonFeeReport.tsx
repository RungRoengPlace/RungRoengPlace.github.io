import { useRef } from 'react';
import type { Member, Income } from '../../../types';
import { MONTH_NAMES } from '../../../types';
import { CheckCircle2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';

import clsx from 'clsx';

interface CommonFeeReportProps {
    year: number;
    setYear: (y: number) => void;
    members: Member[];
    incomes: Income[];
}

const SHORT_MONTH_NAMES = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export const CommonFeeReport: React.FC<CommonFeeReportProps> = ({ year, setYear, members, incomes }) => {
    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrint = async () => {
        if (!reportRef.current) return;

        // Add Timestamp overlay
        const reportDiv = reportRef.current;
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
        reportDiv.style.position = 'relative'; // Ensure positioning context
        reportDiv.appendChild(timestampDiv);


        // Expand scrollable areas
        const scrollableDiv = reportDiv.querySelector('.overflow-auto') as HTMLElement;
        const printHeader = reportDiv.querySelector('#print-header') as HTMLElement;
        let originalOverflow = '';
        let originalMaxHeight = '';
        let originalDisplay = '';

        if (scrollableDiv) {
            originalOverflow = scrollableDiv.style.overflow;
            originalMaxHeight = scrollableDiv.style.maxHeight;
            scrollableDiv.style.overflow = 'visible';
            scrollableDiv.style.maxHeight = 'none';
        }

        if (printHeader) {
            originalDisplay = printHeader.style.display;
            printHeader.classList.remove('hidden');
            printHeader.style.display = 'block';
        }

        try {
            const canvas = await html2canvas(reportDiv, {
                scale: 2, // High resolution
                backgroundColor: '#f8fafc',
                ignoreElements: (element) => element.classList.contains('no-print')
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `common-fee-report-${year}-${Date.now()}.png`;
            link.click();
        } catch (error) {
            console.error('Print failed', error);
        } finally {
            reportDiv.removeChild(timestampDiv);
            if (scrollableDiv) {
                scrollableDiv.style.overflow = originalOverflow;
                scrollableDiv.style.maxHeight = originalMaxHeight;
            }
            if (printHeader) {
                printHeader.classList.add('hidden');
                printHeader.style.display = originalDisplay;
            }
        }
    };


    const getFeeStatus = (houseNo: string, monthIndex: number) => {
        const monthName = MONTH_NAMES[monthIndex];
        return incomes.some(inc =>
            inc.houseNo === houseNo &&
            inc.month === monthName &&
            (inc.type === 'ค่าส่วนกลาง' || inc.type === 'รายรับ' || inc.type.includes('ส่วนกลาง')) &&
            new Date(inc.date).getFullYear() === year
        );
    };

    const getRemarkStatus = (houseNo: string) => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonthIdx = today.getMonth();
        const currentDay = today.getDate();

        // Filter incomes for this house and year efficiently
        const houseIncomes = incomes.filter(inc =>
            inc.houseNo === houseNo &&
            new Date(inc.date).getFullYear() === year &&
            (inc.type === 'ค่าส่วนกลาง' || inc.type === 'รายรับ' || inc.type.includes('ส่วนกลาง'))
        );

        const paidMonthsIndices = new Set<number>();
        houseIncomes.forEach(inc => {
            const mIdx = MONTH_NAMES.indexOf(inc.month);
            if (mIdx !== -1) paidMonthsIndices.add(mIdx);
        });

        // 1. Full Year (Green) - Only current year
        if (year === currentYear && paidMonthsIndices.size === 12) {
            return { text: "ชำระล่วงหน้าครบปี", className: "text-green-600 font-bold" };
        }

        // 2. Overdue (Red)
        // Rule: Overdue if passed "End of Month" + 14 days
        let overdueCount = 0;
        if (year < currentYear) {
            overdueCount = 12 - paidMonthsIndices.size;
        } else if (year === currentYear) {
            for (let i = 0; i < currentMonthIdx; i++) {
                // Deadline passed (Start of next month)
                // Check 14 days buffer
                let isOverdue = false;

                // If i is previous month (currentMonthIdx - 1) check date > 14
                if (i === currentMonthIdx - 1) {
                    if (currentDay > 14) isOverdue = true;
                } else {
                    // Prior months are definitely overdue
                    isOverdue = true;
                }

                if (isOverdue && !paidMonthsIndices.has(i)) {
                    overdueCount++;
                }
            }
        }

        if (overdueCount > 0) {
            return { text: `ค้างชำระ ${overdueCount} เดือน`, className: "text-red-600 font-bold" };
        }

        // 3. Prepaid (Purple)
        if (year > currentYear && paidMonthsIndices.size > 0) {
            return { text: "ชำระล่วงหน้า", className: "text-purple-600 font-bold" };
        }
        if (year === currentYear) {
            const maxPaid = Math.max(...Array.from(paidMonthsIndices), -1);
            if (maxPaid > currentMonthIdx) {
                return { text: "ชำระล่วงหน้า", className: "text-purple-600 font-bold" };
            }
        }

        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 text-white">
                        <i className="fa-solid fa-list-check text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">รายงานค่าส่วนกลาง</h2>
                        <p className="text-sm text-blue-600">สรุปสถานะการจ่ายรายเดือน</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm font-bold text-sm"
                    >
                        <Printer size={16} />
                        <span>พิมพ์รายงาน</span>
                    </button>

                    <div className="h-8 w-px bg-slate-200 mx-2"></div>

                    <span className="text-sm font-bold text-slate-500">เลือกปี:</span>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-blue-800 font-bold"
                    >
                        {Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) => {
                            const y = new Date().getFullYear() - i;
                            return <option key={y} value={y}>ปี {y + 543} ({y})</option>;
                        })}
                    </select>
                </div>
            </div>

            <div ref={reportRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col p-4">
                <div className="overflow-auto max-h-[70vh]">
                    <div className="mb-4 text-center hidden" id="print-header">
                        <h1 className="text-2xl font-bold text-slate-800">รายงานค่าส่วนกลาง ประจำปี {year + 543}</h1>
                    </div>
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-40 shadow-sm ring-1 ring-slate-200">
                            <tr className="bg-slate-100 text-slate-700 font-extrabold text-sm uppercase tracking-wider">
                                <th className="sticky left-0 top-0 z-50 p-4 bg-slate-100 border-b border-r border-slate-200 min-w-[60px] text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">บ้านเลขที่</th>
                                <th className="sticky top-0 z-40 p-4 text-left bg-slate-100 border-b border-slate-200 min-w-[200px]">ชื่อ - สกุล</th>
                                {SHORT_MONTH_NAMES.map(m => <th key={m} className="sticky top-0 z-40 p-2 text-center bg-slate-100 border-b border-slate-200 min-w-[40px]">{m}</th>)}
                                <th className="sticky top-0 z-40 p-4 bg-slate-100 border-b border-slate-200 min-w-[100px]">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {members.map((member) => {
                                const status = getRemarkStatus(member.houseNo);
                                return (
                                    <tr key={member.houseNo} className="hover:bg-blue-50/30 transition-colors">
                                        <td className={clsx(
                                            "sticky left-0 z-30 p-4 font-bold text-center bg-white border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                                            member.specialNote ? "text-red-700" : (status ? status.className : "text-slate-700")
                                        )}>
                                            {member.houseNo}
                                        </td>
                                        <td className={clsx(
                                            "p-4 font-medium",
                                            member.specialNote ? "text-red-700 font-bold" : (status ? status.className : "text-slate-600")
                                        )}>
                                            {member.name}
                                        </td>
                                        {MONTH_NAMES.map((_, idx) => (
                                            <td key={idx} className="p-2 text-center">
                                                {getFeeStatus(member.houseNo, idx) ?
                                                    <div className="flex justify-center"><CheckCircle2 size={18} className="text-green-500 fill-green-100" /></div> :
                                                    null
                                                }
                                                {!getFeeStatus(member.houseNo, idx) && (
                                                    <div className="w-2 h-2 bg-slate-200 rounded-full mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                        <td className="p-4 text-xs">
                                            <div className="flex flex-wrap items-center gap-1">
                                                {status && <span className={status.className}>{status.text}</span>}
                                                {status && member.specialNote && <span className="text-slate-400">, </span>}
                                                {member.specialNote && <span className="text-red-700 font-bold italic">{member.specialNote}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
