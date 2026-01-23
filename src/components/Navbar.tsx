import React from 'react';
import type { UserRole } from '../types';
import { LogOut, User } from 'lucide-react';

interface NavbarProps {
    role: UserRole;
    onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ role, onLogout }) => {
    return (
        <nav className="bg-gradient-to-r from-teal-900 via-slate-800 to-purple-900 shadow-xl text-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm">
                            <img src="/Mini_Logo_remove_bg.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg md:text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-200">
                                หมู่บ้านรุ่งเรืองเพลส
                            </span>
                            <span className="text-xs text-slate-300 font-light hidden sm:block">ระบบบัญชีและการจัดการสารสนเทศ</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                            <User size={14} className="mr-2 text-teal-300" />
                            <span className="text-sm font-medium">
                                {
                                    {
                                        'member': 'สมาชิก',
                                        'guard': 'รปภ.',
                                        'treasurer': 'เหรัญญิก',
                                        'admin': 'ผู้ดูแลระบบ',
                                        'guest': 'Guest'
                                    }[role || 'member']
                                }
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                // Reset guest mode on logout
                                import('../lib/api').then(({ api }) => api.setGuestMode(false));
                                onLogout();
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors shadow-lg text-sm font-medium hover:shadow-red-500/30 ring-1 ring-red-400/50"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">ออก</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
