import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Member } from '../../types';
import Swal from 'sweetalert2';
import { Trash, Edit2, UserPlus, X } from 'lucide-react';

export const Members = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Member>({ houseNo: '', name: '', fee: 500, specialNote: '' });

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setLoading(true);
        const data = await api.getMembers();
        setMembers(data);
        setLoading(false);
    };

    const handleEdit = (member: Member) => {
        setFormData(member);
        setIsModalOpen(true);
    };

    const handleDelete = async (rowIndex: number | undefined) => {
        if (!rowIndex) return;
        const res = await Swal.fire({
            title: 'ยืนยันการลบ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        });
        if (res.isConfirmed) {
            await api.deleteMember(rowIndex);
            loadMembers();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.saveMember(formData);
        setIsModalOpen(false);
        loadMembers();
        Swal.fire({
            icon: 'success',
            title: 'บันทึกเรียบร้อย',
            timer: 1500,
            showConfirmButton: false
        });
    };

    if (loading) return <div className="p-4 text-center text-slate-400">กำลังโหลดรายชื่อ...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-slate-700">รายชื่อสมาชิกทั้งหมด ({members.length})</h3>
                <button onClick={() => { setFormData({ houseNo: '', name: '', fee: 500, specialNote: '' }); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 transform hover:scale-105 active:scale-95">
                    <UserPlus size={16} />
                    <span>เพิ่มสมาชิก</span>
                </button>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 bg-slate-50">บ้านเลขที่</th>
                            <th className="px-4 py-3 bg-slate-50">ชื่อ-สกุล</th>
                            <th className="px-4 py-3 text-right bg-slate-50">ค่าส่วนกลาง</th>
                            <th className="px-4 py-3 bg-slate-50">Note</th>
                            <th className="px-4 py-3 text-center bg-slate-50">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {members.map((m, i) => (
                            <tr key={i} className="hover:bg-indigo-50/20 transition-colors group">
                                <td className="px-4 py-3 font-bold text-slate-700">{m.houseNo}</td>
                                <td className="px-4 py-3 text-slate-600">{m.name}</td>
                                <td className="px-4 py-3 text-right font-mono text-indigo-700 opacity-80">{m.fee.toLocaleString()}</td>
                                <td className="px-4 py-3 text-red-400 italic text-xs">{m.specialNote}</td>
                                <td className="px-4 py-3 flex justify-center space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(m)} className="text-amber-500 hover:text-amber-700 p-1 hover:bg-amber-50 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(m.rowIndex)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                            <h3 className="font-bold text-indigo-900 flex items-center">
                                <UserPlus size={18} className="mr-2" />
                                {formData.rowIndex ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-full p-1"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">บ้านเลขที่</label>
                                <input type="text" value={formData.houseNo} onChange={e => setFormData({ ...formData, houseNo: e.target.value })} className="w-full border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" required placeholder="เช่น 101/1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อ-สกุล</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" required placeholder="ชื่อ นามสกุล" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">ค่าส่วนกลาง (บาท)</label>
                                <input type="number" value={formData.fee} onChange={e => setFormData({ ...formData, fee: Number(e.target.value) })} className="w-full border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Special Note</label>
                                <input type="text" value={formData.specialNote} onChange={e => setFormData({ ...formData, specialNote: e.target.value })} className="w-full border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="หมายเหตุเพิ่มเติม" />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-50 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium">ยกเลิก</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold transform hover:scale-105 active:scale-95 transition-all">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
