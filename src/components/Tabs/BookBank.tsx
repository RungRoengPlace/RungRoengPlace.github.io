import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { BookBankMovement } from '../../types';
import Swal from 'sweetalert2';
import { Plus, Trash, Edit2, Save } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export const BookBank = () => {
    const [history, setHistory] = useState<BookBankMovement[]>([]);
    const [loading, setLoading] = useState(true);

    const initialFormState: BookBankMovement = {
        date: new Date().toISOString().split('T')[0],
        account: 'บัญชีรอง',
        type: 'ฝาก',
        amount: 0,
        note: '-'
    };

    const [formData, setFormData] = useState<BookBankMovement>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const hist = await api.getBookBankMovements(50);
            if (Array.isArray(hist)) {
                setHistory(hist);
            } else {
                console.error("Invalid data received:", hist);
                // @ts-ignore
                if (hist?.error === "Unknown action") {
                    Swal.fire('Connection Error', 'กรุณาอัปเดต Google Apps Script (Deploy New Version) เพื่อรองรับฟีเจอร์ใหม่', 'error');
                } else {
                    setHistory([]);
                }
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error');
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || formData.amount <= 0) {
            Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุจำนวนเงินที่มากกว่า 0', 'warning');
            return;
        }

        Swal.showLoading();
        try {
            const res = await api.saveBookBankMovement(formData);
            // @ts-ignore
            if (res && res.error) {
                // @ts-ignore
                throw new Error(res.error);
            }

            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                timer: 1500,
                showConfirmButton: false
            });

            if (!isEditing) {
                setFormData(prev => ({ ...initialFormState, date: prev.date }));
            } else {
                setFormData(initialFormState);
                setIsEditing(false);
            }

            const hist = await api.getBookBankMovements(50);
            setHistory(hist);
        } catch (err: any) {
            console.error(err);
            Swal.fire('Error', err.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
    };

    const handleEdit = (item: BookBankMovement) => {
        setFormData(item);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (rowIndex: number | undefined) => {
        if (!rowIndex) return;
        const res = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "ข้อมูลนี้จะถูกลบถาวร",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
        });
        if (res.isConfirmed) {
            Swal.showLoading();
            await api.deleteBookBankMovement(rowIndex);
            Swal.close();
            const hist = await api.getBookBankMovements(50);
            setHistory(hist);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">กำลังโหลดข้อมูล...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Input Card */}
            <div className={clsx("bg-white p-6 rounded-2xl shadow-lg border transition-colors", isEditing ? "border-amber-200 bg-amber-50/10" : "border-blue-100")}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <div className={clsx("p-2 rounded-lg mr-3 shadow-sm", isEditing ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600")}>
                            {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                        </div>
                        {isEditing ? 'แก้ไขรายการ' : 'บันทึกยอดเงินในบัญชี'}
                    </h2>
                    {isEditing && (
                        <button onClick={() => { setIsEditing(false); setFormData(initialFormState); }} className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50">
                            ยกเลิกการแก้ไข
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">วันที่</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" required />
                    </div>
                    {/* Account */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">บัญชี</label>
                        <select value={formData.account} onChange={e => setFormData({ ...formData, account: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                            <option value="บัญชีหลัก">บัญชีหลัก</option>
                            <option value="บัญชีรอง">บัญชีรอง</option>
                        </select>
                    </div>
                    {/* Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">รายการ</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                            <option value="ฝาก">ฝาก (Deposit)</option>
                            <option value="ถอน">ถอน (Withdraw)</option>
                        </select>
                    </div>

                    {/* Amount */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">จำนวนเงิน</label>
                        <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono font-bold text-lg text-blue-700" required min="0" />
                    </div>

                    {/* Note */}
                    <div className="lg:col-span-5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">หมายเหตุ</label>
                        <input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="-" />
                    </div>

                    <div className="lg:col-span-5 flex justify-end mt-4">
                        <button type="submit" className={clsx("flex items-center space-x-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95", isEditing ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200")}>
                            {isEditing ? <><Edit2 size={18} /><span>อัปเดตข้อมูล</span></> : <><Save size={18} /><span>บันทึกรายการ</span></>}
                        </button>
                    </div>
                </form>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-600 flex justify-between items-center">
                    <span>ประวัติบัญชีล่าสุด</span>
                    <span className="text-xs font-normal text-slate-400">แสดง 50 รายการล่าสุด</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs sticky top-0">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">วันที่</th>
                                <th className="px-6 py-3 whitespace-nowrap">บัญชี</th>
                                <th className="px-6 py-3 whitespace-nowrap">รายการ</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">จำนวนเงิน</th>
                                <th className="px-6 py-3 whitespace-nowrap">หมายเหตุ</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-400">ไม่พบข้อมูล</td></tr>
                            ) :
                                history.map((item) => (
                                    <tr key={item.rowIndex} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{item.account}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx("px-2 py-1 rounded text-xs font-bold", item.type === 'ฝาก' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className={clsx("px-6 py-4 text-right font-bold font-mono", item.type === 'ฝาก' ? "text-green-600" : "text-red-600")}>
                                            {item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{item.note}</td>
                                        <td className="px-6 py-4 flex justify-center space-x-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(item)} className="text-amber-400 hover:text-amber-600 p-1 hover:bg-amber-50 rounded"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(item.rowIndex)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
