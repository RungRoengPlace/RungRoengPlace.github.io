import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import type { User } from '../../../types';
import Swal from 'sweetalert2';
import { Users, Shield, ShieldCheck, Settings, Lock, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

export const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await api.getUsers();
            // Sort order: member, guard, treasurer, admin
            const order = ['member', 'guard', 'treasurer', 'admin'];
            const sorted = data.sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
            setUsers(sorted);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleToggleStatus = async (user: User) => {
        const newStatus = !user.isEnabled;
        try {
            await api.saveUser({ ...user, isEnabled: newStatus });
            setUsers(users.map(u => u.role === user.role ? { ...u, isEnabled: newStatus } : u));

            const toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
            });
            toast.fire({ icon: 'success', title: `บันทึกสถานะเรียบร้อย` });

        } catch (e) {
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const handleChangePassword = async (user: User) => {
        const { value: newPassword } = await Swal.fire({
            title: `เปลี่ยนรหัสผ่าน: ${getRoleName(user.role)}`,
            input: 'text',
            inputValue: user.password,
            inputLabel: 'รหัสผ่านใหม่',
            showCancelButton: true,
            confirmButtonColor: '#0f766e',
        });

        if (newPassword) {
            try {
                await api.saveUser({ ...user, password: newPassword });
                setUsers(users.map(u => u.role === user.role ? { ...u, password: newPassword } : u));
                Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
            } catch (e) {
                Swal.fire('Error', 'Failed to update password', 'error');
            }
        }
    };

    const getRoleName = (role: string) => {
        switch (role) {
            case 'member': return 'สมาชิก';
            case 'guard': return 'รปภ.';
            case 'treasurer': return 'เหรัญญิก';
            case 'admin': return 'ผู้ดูแลระบบ';
            default: return role;
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'member': return <Users className="text-blue-500" />;
            case 'guard': return <Shield className="text-orange-500" />;
            case 'treasurer': return <ShieldCheck className="text-teal-500" />;
            case 'admin': return <Settings className="text-purple-500" />;
            default: return <Users />;
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 text-left text-sm font-bold text-slate-600">ประเภทผู้ใช้</th>
                            <th className="p-6 text-left text-sm font-bold text-slate-600">สถานะ</th>
                            <th className="p-6 text-left text-sm font-bold text-slate-600">จัดการรหัสผ่าน</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map(user => (
                            <tr key={user.role} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center space-x-3">
                                        {getRoleIcon(user.role)}
                                        <span className="font-bold text-slate-700 text-lg">{getRoleName(user.role)}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <button
                                        onClick={() => handleToggleStatus(user)}
                                        className={clsx(
                                            "flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-sm transition-all duration-300",
                                            user.isEnabled
                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                : "bg-red-100 text-red-700 hover:bg-red-200"
                                        )}
                                    >
                                        {user.isEnabled ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                        <span>{user.isEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                                    </button>
                                </td>
                                <td className="p-6">
                                    <button
                                        onClick={() => handleChangePassword(user)}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 font-bold text-sm transition-all"
                                    >
                                        <Lock size={16} />
                                        <span>แก้ไขรหัสผ่าน ({user.isEnabled ? 'เปิดใช้งาน' : 'ปิด'})</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
