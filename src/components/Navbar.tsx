import React from 'react';
import type { UserRole } from '../types';
import { LogOut, User, Key } from 'lucide-react';
import { GuardStatusIndicator } from './GuardStatusIndicator';
import { api } from '../lib/api';
import Swal from 'sweetalert2';

interface NavbarProps {
    role: UserRole;
    onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ role, onLogout }) => {

    const handleChangePassword = async () => {
        if (!role) return;

        const { value: newPassword } = await Swal.fire({
            title: `เปลี่ยนรหัสผ่าน ${role}`,
            html: `
                <div class="flex flex-col gap-4 text-left">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                        <input id="swal-new-pass" class="swal2-input m-0 w-full" placeholder="New Password" type="password">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                        <input id="swal-confirm-pass" class="swal2-input m-0 w-full" placeholder="Confirm Password" type="password">
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#0f766e',
            preConfirm: () => {
                const pass1 = (document.getElementById('swal-new-pass') as HTMLInputElement).value;
                const pass2 = (document.getElementById('swal-confirm-pass') as HTMLInputElement).value;

                if (!pass1 || !pass2) {
                    Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
                    return false;
                }
                if (pass1 !== pass2) {
                    Swal.showValidationMessage('รหัสผ่านไม่ตรงกัน');
                    return false;
                }
                return pass1;
            }
        });

        if (newPassword) {
            Swal.showLoading();
            try {
                // @ts-ignore - function added to api but interface might not be updated in IDE yet
                const res = await api.changePassword(role, newPassword);
                Swal.close();

                if (res && res.status !== 'error') {
                    Swal.fire({
                        icon: 'success',
                        title: 'สำเร็จ',
                        text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire('Error', res?.message || 'Transaction failed', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'An unexpected error occurred', 'error');
            }
        }
    };

    const canChangePassword = role === 'admin' || role === 'treasurer';

    return (
        <nav className="bg-gradient-to-r from-teal-900 via-slate-800 to-purple-900 shadow-xl text-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm">
                            <img src="/Mini_Logo_remove_bg.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="font-bold text-lg md:text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-200">
                                หมู่บ้านรุ่งเรืองเพลส
                            </span>
                            <span className="text-xs text-slate-300 font-light hidden sm:block">ระบบบัญชีและการจัดการสารสนเทศ</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <GuardStatusIndicator />
                        <div className="flex items-center px-3 md:px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
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

                        {canChangePassword && (
                            <button
                                onClick={handleChangePassword}
                                className="flex items-center justify-center w-10 h-10 bg-amber-500/80 hover:bg-amber-600 rounded-lg transition-colors shadow-lg hover:shadow-amber-500/30 ring-1 ring-amber-400/50"
                                title="เปลี่ยนรหัสผ่าน"
                            >
                                <Key size={18} />
                            </button>
                        )}

                        <button
                            onClick={() => {
                                // Reset guest mode on logout
                                api.setGuestMode(false);
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
