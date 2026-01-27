import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Member, Income, Expense, BookBankMovement } from '../../types';
import { CommonFeeReport } from './Reports/CommonFeeReport';
import { ExpenseSummary } from './Reports/ExpenseSummary';
import { BookBankReport } from './Reports/BookBankReport';
import { PieChart, ListChecks, Landmark } from 'lucide-react';
import clsx from 'clsx';

export const Reports = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [bookMovements, setBookMovements] = useState<BookBankMovement[]>([]);
    const [view, setView] = useState<'fee' | 'expense' | 'bookBank'>('fee');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [m, i, e, b] = await Promise.all([
            api.getMembers(),
            api.getIncomes(),
            api.getExpenses(),
            api.getBookBankMovements()
        ]);
        setMembers(m);
        setIncomes(i);
        setExpenses(e);

        if (Array.isArray(b)) {
            setBookMovements(b);
        } else {
            console.error("Failed to load book movements", b);
            setBookMovements([]);
        }

        setLoading(false);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-4">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500"></i>
            <span>กำลังประมวลผลข้อมูล...</span>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* Top Toggle Switcher - Floating Style */}
            <div className="flex justify-center -mt-4 mb-8">
                <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-slate-100 inline-flex relative z-10">
                    <button
                        onClick={() => setView('fee')}
                        className={clsx(
                            "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm",
                            view === 'fee'
                                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <ListChecks size={18} />
                        <span>รายงาน ค่าส่วนกลาง</span>
                    </button>

                    <div className="w-px bg-slate-200 my-2 mx-1"></div>

                    <button
                        onClick={() => setView('expense')}
                        className={clsx(
                            "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm",
                            view === 'expense'
                                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <PieChart size={18} />
                        <span>สรุปรายจ่าย</span>
                    </button>

                    <div className="w-px bg-slate-200 my-2 mx-1"></div>

                    <button
                        onClick={() => setView('bookBank')}
                        className={clsx(
                            "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm",
                            view === 'bookBank'
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <Landmark size={18} />
                        <span>เงินในบัญชี</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {view === 'fee' && <CommonFeeReport year={year} setYear={setYear} members={members} incomes={incomes} />}
                {view === 'expense' && <ExpenseSummary year={year} setYear={setYear} expenses={expenses} />}
                {view === 'bookBank' && <BookBankReport year={year} setYear={setYear} movements={bookMovements} expenses={expenses} incomes={incomes} />}
            </div>
        </div>
    );
};
