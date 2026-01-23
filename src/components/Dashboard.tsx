import React, { useState } from 'react';
import type { UserRole } from '../types';
import { Navbar } from './Navbar';
import { Reports } from './Tabs/Reports';
import { Income } from './Tabs/Income';
import { Expense } from './Tabs/Expense';
import { Members } from './Tabs/Members';
import { SecurityGuard } from './Tabs/SecurityGuard';
import { UserManagement } from './Tabs/Settings/UserManagement';
import { Wallet, Receipt, Users, PieChart, Shield, Settings } from 'lucide-react';
import clsx from 'clsx';

interface DashboardProps {
    role: UserRole;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ role, onLogout }) => {
    // Determine default tab based on role
    const getDefaultTab = () => {
        if (role === 'guard') return 'security';
        return 'reports';
    };

    const [activeTab, setActiveTab] = useState<'reports' | 'income' | 'expense' | 'security' | 'settings'>(getDefaultTab());
    const [showMembers, setShowMembers] = useState(false);

    const canViewReports = role === 'member' || role === 'treasurer' || role === 'admin' || role === 'guest';
    const canEditFinance = role === 'treasurer' || role === 'admin' || role === 'guest';
    const canManageMembers = role === 'admin';
    const isGuard = role === 'guard' || role === 'guest';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar role={role} onLogout={onLogout} />

            <main className="flex-grow container mx-auto px-2 sm:px-4 py-8 max-w-7xl animate-fade-in-up">
                {/* Tab Navigation */}
                <nav className="flex flex-wrap justify-center gap-2 mb-8 bg-white p-2 rounded-2xl shadow-lg border border-slate-100 sticky top-20 z-40 backdrop-blur-sm bg-white/90">

                    {canViewReports && (
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={clsx(
                                "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                activeTab === 'reports' ? "bg-purple-600 text-white shadow-lg shadow-purple-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <PieChart size={18} />
                            <span>รายงานสรุป</span>
                        </button>
                    )}

                    {canEditFinance && (
                        <>
                            <button
                                onClick={() => setActiveTab('income')}
                                className={clsx(
                                    "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                    activeTab === 'income' ? "bg-teal-600 text-white shadow-lg shadow-teal-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <Wallet size={18} />
                                <span>บันทึกรายรับ</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('expense')}
                                className={clsx(
                                    "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                    activeTab === 'expense' ? "bg-red-500 text-white shadow-lg shadow-red-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <Receipt size={18} />
                                <span>บันทึกรายจ่าย</span>
                            </button>
                        </>
                    )}

                    {isGuard && (
                        <button
                            onClick={() => setActiveTab('security')}
                            className={clsx(
                                "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                activeTab === 'security' ? "bg-orange-500 text-white shadow-lg shadow-orange-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <Shield size={18} />
                            <span>บันทึกเวลา รปภ.</span>
                        </button>
                    )}


                    {canManageMembers && (
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={clsx(
                                "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                activeTab === 'settings' ? "bg-slate-800 text-white shadow-lg shadow-slate-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <Settings size={18} />
                            <span>ตั้งค่า สมาชิก</span>
                        </button>
                    )}
                </nav>

                {/* Dynamic Content */}
                <div className="space-y-6 min-h-[500px]">
                    {activeTab === 'reports' && canViewReports && <Reports />}
                    {activeTab === 'income' && canEditFinance && <Income />}
                    {activeTab === 'expense' && canEditFinance && <Expense />}
                    {activeTab === 'security' && isGuard && <SecurityGuard />}
                    {activeTab === 'settings' && canManageMembers && <UserManagement />}
                </div>

                {/* Members Section (Admin Only - Only on Settings Tab) */}
                {activeTab === 'settings' && canManageMembers && (
                    <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => setShowMembers(!showMembers)}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group bg-indigo-50/30"
                        >
                            <div className="flex items-center space-x-3 text-indigo-700 font-bold text-lg">
                                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors text-indigo-600">
                                    <Users size={24} />
                                </div>
                                <span>จัดการรายชื่อสมาชิก</span>
                            </div>
                            <div className={clsx("transition-transform duration-300 text-indigo-400", showMembers ? "rotate-180" : "")}>
                                <i className="fa-solid fa-chevron-down"></i>
                            </div>
                        </button>

                        {showMembers && (
                            <div className="p-4 border-t border-slate-100 animate-fade-in-up">
                                <Members />
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
