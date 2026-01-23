import React from 'react';
import type { UserRole } from '../types';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import { ShieldCheck, Shield, Users, Settings, UserPlus } from 'lucide-react';
import clsx from 'clsx';

interface LoginProps {
    onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {

    const handleLogin = async (role: UserRole) => {


        const roleNameMap: Record<string, string> = {
            'guard': 'รปภ.',
            'treasurer': 'เหรัญญิก',
            'admin': 'ผู้ดูแลระบบ'
        };


        // Set Guest Mode flag based on role
        api.setGuestMode(role === 'guest');

        try {
            const isPasswordRequired = await api.isPasswordRequired(role || '');

            if (!isPasswordRequired) {
                onLogin(role);
                return;
            }

            const { value: password } = await Swal.fire({
                title: `รหัสผ่าน ${roleNameMap[role || ''] || role}`,
                input: 'password',
                inputLabel: 'Password',
                inputPlaceholder: 'Enter password',
                showCancelButton: true,
                confirmButtonColor: '#0f766e',
            });

            if (password && role) {
                Swal.showLoading();
                const res = await api.verifyPassword(role, password);
                Swal.close();
                if (res.valid) {
                    onLogin(role);
                } else {
                    Swal.fire('Error', res.message || 'รหัสผ่านไม่ถูกต้อง', 'error');
                }
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Login system error', 'error');
        }
    };

    const cards = [
        {
            role: 'guest',
            title: 'Guest',
            desc: 'ทดลองใช้งานระบบ (Mock Data)',
            icon: <UserPlus size={40} />,
            color: 'text-pink-500',
            bg: 'bg-pink-50 group-hover:bg-pink-500 group-hover:text-white',
            border: 'hover:border-pink-500'
        },
        {
            role: 'member',
            title: 'สมาชิก',
            desc: 'ดูรายงานค่าส่วนกลางและรายจ่าย',
            icon: <Users size={40} />,
            color: 'text-blue-600',
            bg: 'bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
            border: 'hover:border-blue-500'
        },
        {
            role: 'guard',
            title: 'รปภ.',
            desc: 'บันทึกเวลาและผู้มาติดต่อ',
            icon: <Shield size={40} />,
            color: 'text-orange-500',
            bg: 'bg-orange-50 group-hover:bg-orange-500 group-hover:text-white',
            border: 'hover:border-orange-500'
        },
        {
            role: 'treasurer',
            title: 'เหรัญญิก',
            desc: 'บันทึกรายรับ-รายจ่าย',
            icon: <ShieldCheck size={40} />,
            color: 'text-teal-600',
            bg: 'bg-teal-50 group-hover:bg-teal-600 group-hover:text-white',
            border: 'hover:border-teal-500'
        },
        {
            role: 'admin',
            title: 'ผู้ดูแลระบบ',
            desc: 'จัดการข้อมูลทั้งหมด',
            icon: <Settings size={40} />,
            color: 'text-purple-600',
            bg: 'bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
            border: 'hover:border-purple-500'
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-8 font-sans">
            <div className="max-w-6xl w-full text-center animate-fade-in-up">
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
                    ยินดีต้อนรับสู่ระบบ
                </h1>
                <div className="flex justify-center mb-6">
                    <img src="/Full_Logo_remove_bg.png" alt="Logo" className="w-64 h-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto justify-items-center">
                    {cards.map((card) => (
                        <button
                            key={card.role}
                            onClick={() => handleLogin(card.role as UserRole)}
                            className={clsx(
                                "group bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent transition-all duration-300 flex flex-col items-center cursor-pointer text-center h-full w-[80%] hover:shadow-2xl hover:-translate-y-2",
                                card.border
                            )}
                        >
                            <div className={clsx(
                                "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 shadow-sm",
                                card.color,
                                card.bg
                            )}>
                                {card.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-slate-900">{card.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
