import React, { useState, useCallback, Suspense, lazy } from 'react';
import type { UserRole } from '../types';
import { Navbar } from './Navbar';
import { Wallet, Receipt, Users, PieChart, Shield, Settings, Landmark, CalendarClock } from 'lucide-react';
import clsx from 'clsx';

// Lazy load tab components for code splitting
const Reports = lazy(() => import('./Tabs/Reports').then(m => ({ default: m.Reports })));
const Income = lazy(() => import('./Tabs/Income').then(m => ({ default: m.Income })));
const Expense = lazy(() => import('./Tabs/Expense').then(m => ({ default: m.Expense })));
const Members = lazy(() => import('./Tabs/Members').then(m => ({ default: m.Members })));
const SecurityGuard = lazy(() => import('./Tabs/SecurityGuard').then(m => ({ default: m.SecurityGuard })));
const BookBank = lazy(() => import('./Tabs/BookBank').then(m => ({ default: m.BookBank })));
const UserManagement = lazy(() => import('./Tabs/Settings/UserManagement').then(m => ({ default: m.UserManagement })));
const GuardPayrollMain = lazy(() => import('./GuardPayroll/GuardPayrollMain').then(m => ({ default: m.GuardPayrollMain })));

// Loading fallback component
const TabLoader = () => (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-4">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500"></i>
        <span>กำลังโหลด...</span>
    </div>
);

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

    const [activeTab, setActiveTab] = useState<'reports' | 'income' | 'expense' | 'bookBank' | 'security' | 'settings' | 'guardPayroll'>(getDefaultTab());
    const [showMembers, setShowMembers] = useState(false);
    const [showPermissions, setShowPermissions] = useState(true);

    // Memoize tab handlers to prevent re-creating on every render
    const handleTabClick = useCallback((tab: typeof activeTab) => () => setActiveTab(tab), []);
    const toggleMembers = useCallback(() => setShowMembers(prev => !prev), []);
    const togglePermissions = useCallback(() => setShowPermissions(prev => !prev), []);

    const canViewReports = role === 'member' || role === 'treasurer' || role === 'admin' || role === 'guest';
    const canEditFinance = role === 'treasurer' || role === 'admin' || role === 'guest';
    const canManageBookBank = role === 'treasurer' || role === 'admin';
    const canManageMembers = role === 'admin';
    const isGuard = role === 'guard' || role === 'guest';
    const canViewGuardPayroll = role === 'admin' || role === 'treasurer';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar role={role} onLogout={onLogout} />

            <main className="flex-grow container mx-auto px-2 sm:px-4 py-8 max-w-7xl animate-fade-in-up">
                {/* Tab Navigation */}
                <nav className="flex flex-wrap justify-center gap-2 mb-8 bg-white p-2 rounded-2xl shadow-lg border border-slate-100 sticky top-20 z-40 backdrop-blur-sm bg-white/90">

                    {canViewReports && (
                        <button
                            onClick={handleTabClick('reports')}
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
                                onClick={handleTabClick('income')}
                                className={clsx(
                                    "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                    activeTab === 'income' ? "bg-teal-600 text-white shadow-lg shadow-teal-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <Wallet size={18} />
                                <span>บันทึกรายรับ</span>
                            </button>

                            <button
                                onClick={handleTabClick('expense')}
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

                    {canManageBookBank && (
                        <button
                            onClick={handleTabClick('bookBank')}
                            className={clsx(
                                "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                activeTab === 'bookBank' ? "bg-blue-600 text-white shadow-lg shadow-blue-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <Landmark size={18} />
                            <span>บันทึกยอดเงิน</span>
                        </button>
                    )}

                    {canViewGuardPayroll && (
                        <button
                            onClick={handleTabClick('guardPayroll')}
                            className={clsx(
                                "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                activeTab === 'guardPayroll' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <CalendarClock size={18} />
                            <span>ค่าจ้าง รปภ.</span>
                        </button>
                    )}

                    {isGuard && (
                        <button
                            onClick={handleTabClick('security')}
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
                            onClick={handleTabClick('settings')}
                            className={clsx(
                                "flex items-center space-x-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base",
                                activeTab === 'settings' ? "bg-slate-800 text-white shadow-lg shadow-slate-200 transform scale-105" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <Settings size={18} />
                            <span>ตั้งค่าระบบ</span>
                        </button>
                    )}
                </nav>

                {/* Dynamic Content */}
                <div className="space-y-6 min-h-[500px]">
                    <Suspense fallback={<TabLoader />}>
                        {activeTab === 'reports' && canViewReports && <Reports />}
                        {activeTab === 'income' && canEditFinance && <Income />}
                        {activeTab === 'expense' && canEditFinance && <Expense />}
                        {activeTab === 'bookBank' && canManageBookBank && <BookBank />}
                        {activeTab === 'guardPayroll' && canViewGuardPayroll && <GuardPayrollMain />}
                        {activeTab === 'security' && isGuard && <SecurityGuard />}
                    </Suspense>

                    {/* Settings Sections (Admin Only) */}
                    {activeTab === 'settings' && canManageMembers && (
                        <div className="space-y-6">
                            {/* Permissions Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <button
                                    onClick={togglePermissions}
                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group bg-slate-50/50"
                                >
                                    <div className="flex items-center space-x-3 text-slate-700 font-bold text-lg">
                                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors text-slate-600">
                                            <Settings size={24} />
                                        </div>
                                        <span>ตั้งค่าสิทธิ์การใช้งาน</span>
                                    </div>
                                    <div className={clsx("transition-transform duration-300 text-slate-400", showPermissions ? "rotate-180" : "")}>
                                        <i className="fa-solid fa-chevron-down"></i>
                                    </div>
                                </button>

                                {showPermissions && (
                                    <div className="p-4 border-t border-slate-100 animate-fade-in-up">
                                        <Suspense fallback={<TabLoader />}>
                                            <UserManagement />
                                        </Suspense>
                                    </div>
                                )}
                            </div>

                            {/* Members Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <button
                                    onClick={toggleMembers}
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
                                        <Suspense fallback={<TabLoader />}>
                                            <Members />
                                        </Suspense>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div >
    );
};
