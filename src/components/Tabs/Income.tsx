import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Income as IncomeType, DropdownData } from '../../types';
import { MONTH_NAMES } from '../../types';
import Swal from 'sweetalert2';
import { Plus, Trash, Edit2, Save } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export const Income = () => {
    const [dropdowns, setDropdowns] = useState<DropdownData | null>(null);
    const [history, setHistory] = useState<IncomeType[]>([]);
    const [loading, setLoading] = useState(true);

    const initialFormState: IncomeType = {
        date: new Date().toISOString().split('T')[0],
        type: 'ค่าส่วนกลาง',
        month: MONTH_NAMES[new Date().getMonth()],
        houseNo: '',
        name: '',
        amount: 500,
        note: '-'
    };

    const [formData, setFormData] = useState<IncomeType>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        const [dd, hist] = await Promise.all([api.getDropdownData(), api.getIncomes()]);
        setDropdowns(dd);
        setHistory(hist);

        if (dd.members.length > 0 && !formData.houseNo) {
            // Optional: Preselect or keep empty
        }
        setLoading(false);
    };

    const handleHouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const hNo = e.target.value;
        const member = dropdowns?.members.find(m => m.houseNo === hNo);
        setFormData({
            ...formData,
            houseNo: hNo,
            name: member ? member.name : '',
            amount: member ? member.commonFee : 0
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.houseNo || !formData.amount) {
            Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุบ้านเลขที่และจำนวนเงิน', 'warning');
            return;
        }

        Swal.showLoading();
        try {
            await api.saveIncome(formData);
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                timer: 1500,
                showConfirmButton: false
            });

            if (!isEditing) {
                // If adding new, keep date and month but clear house
                setFormData(prev => ({ ...initialFormState, date: prev.date, month: prev.month }));
            } else {
                setFormData(initialFormState);
                setIsEditing(false);
            }

            const hist = await api.getIncomes();
            setHistory(hist);
        } catch (err) {
            Swal.fire('Error', 'เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
    };

    const handleEdit = (item: IncomeType) => {
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
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });
        if (res.isConfirmed) {
            Swal.showLoading();
            await api.deleteIncome(rowIndex);
            Swal.close();
            const hist = await api.getIncomes();
            setHistory(hist);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">กำลังโหลดข้อมูล...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Input Card */}
            <div className={clsx("bg-white p-6 rounded-2xl shadow-lg border transition-colors", isEditing ? "border-amber-200 bg-amber-50/10" : "border-teal-100")}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <div className={clsx("p-2 rounded-lg mr-3 shadow-sm", isEditing ? "bg-amber-100 text-amber-600" : "bg-teal-100 text-teal-600")}>
                            {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                        </div>
                        {isEditing ? 'แก้ไขรายการรับ' : 'บันทึกรายรับใหม่'}
                    </h2>
                    {isEditing && (
                        <button onClick={() => { setIsEditing(false); setFormData(initialFormState); }} className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50">
                            ยกเลิกการแก้ไข
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">วันที่</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow" required />
                    </div>
                    {/* Month */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ประจำเดือน</label>
                        <select value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow">
                            {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    {/* Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ประเภท</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow">
                            {dropdowns?.incomeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {/* House No */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">บ้านเลขที่</label>
                        <select value={formData.houseNo} onChange={handleHouseChange} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow" required>
                            <option value="">-- เลือก --</option>
                            {dropdowns?.members.map(m => <option key={m.houseNo} value={m.houseNo}>{m.houseNo} ({m.name})</option>)}
                        </select>
                    </div>

                    {/* Name (Readonly) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ชื่อ-สกุล</label>
                        <input type="text" value={formData.name} readOnly className="w-full border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-500 cursor-not-allowed" />
                    </div>
                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">จำนวนเงิน</label>
                        <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none text-right font-mono font-bold text-lg text-teal-700" required min="0" />
                    </div>
                    {/* Note */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">หมายเหตุ</label>
                        <input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow" placeholder="-" />
                    </div>

                    <div className="lg:col-span-4 flex justify-end mt-4">
                        <button type="submit" className={clsx("flex items-center space-x-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95", isEditing ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200" : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200")}>
                            {isEditing ? <><Edit2 size={18} /><span>อัปเดตข้อมูล</span></> : <><Save size={18} /><span>บันทึกรายรับ</span></>}
                        </button>
                    </div>
                </form>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-600 flex justify-between items-center">
                    <span>ประวัติรายการล่าสุด</span>
                    <span className="text-xs font-normal text-slate-400">แสดง 50 รายการล่าสุด</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs sticky top-0">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">วันที่</th>
                                <th className="px-6 py-3 whitespace-nowrap">บ้านเลขที่</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">จำนวนเงิน</th>
                                <th className="px-6 py-3 whitespace-nowrap">หมายเหตุ</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">ไม่พบข้อมูลบันทึกรายรับ</td></tr>
                            ) :
                                history.map((item) => (
                                    <tr key={item.rowIndex} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {item.houseNo} <span className="text-xs text-slate-400 block">{item.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-teal-600 font-mono">{item.amount.toLocaleString()}</td>
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
}
