import React from 'react';
import type { Member, Income } from '../../../types';
import { MONTH_NAMES } from '../../../types';
import { CheckCircle2 } from 'lucide-react';

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

    const getFeeStatus = (houseNo: string, monthIndex: number) => {
        const monthName = MONTH_NAMES[monthIndex];
        return incomes.some(inc =>
            inc.houseNo === houseNo &&
            inc.month === monthName &&
            (inc.type === 'ค่าส่วนกลาง' || inc.type === 'รายรับ' || inc.type.includes('ส่วนกลาง')) &&
            new Date(inc.date).getFullYear() === year
        );
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

                <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-500">เลือกปี:</span>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-blue-800 font-bold"
                    >
                        {[...Array(5)].map((_, i) => {
                            const y = new Date().getFullYear() - i;
                            return <option key={y} value={y}>ปี {y + 543} ({y})</option>;
                        })}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-auto max-h-[70vh]">
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
                            {members.map((member) => (
                                <tr key={member.houseNo} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="sticky left-0 z-30 p-4 font-bold text-slate-700 text-center bg-white border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{member.houseNo}</td>
                                    <td className="p-4 text-slate-600 font-medium">{member.name}</td>
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
                                    <td className="p-4 text-slate-400 italic text-xs">{member.specialNote}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
