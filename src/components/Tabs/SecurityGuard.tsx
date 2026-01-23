import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { SecurityRecord } from '../../types';
import Swal from 'sweetalert2';
import { Plus, Trash, Edit2, Save, Clock, Car, User } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export const SecurityGuard = () => {
    const [history, setHistory] = useState<SecurityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const initialFormState: SecurityRecord = {
        date: new Date().toISOString().split('T')[0],
        timeIn: format(new Date(), 'HH:mm'),
        timeOut: '',
        visitorName: '',
        plateNumber: '',
        houseNo: '',
        purpose: ''
    };

    const [formData, setFormData] = useState<SecurityRecord>(initialFormState);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getSecurityRecords();
            setHistory(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        Swal.showLoading();
        try {
            await api.saveSecurityRecord(formData);
            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false });
            setFormData({ ...initialFormState, date: formData.date }); // Keep date
            setIsEditing(false);
            loadData();
        } catch (err) {
            Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
        }
    };

    const handleDelete = async (rowIndex: number | undefined) => {
        if (!rowIndex) return;
        const res = await Swal.fire({
            title: 'ยืนยันการลบ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบ'
        });
        if (res.isConfirmed) {
            await api.deleteSecurityRecord(rowIndex);
            loadData();
        }
    };

    const handleEdit = (item: SecurityRecord) => {
        setFormData(item);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) return <div className="p-8 text-center text-slate-400">กำลังโหลดข้อมูล...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Form Card */}
            <div className={clsx("bg-white p-6 rounded-2xl shadow-lg border transition-colors", isEditing ? "border-amber-200 bg-amber-50/10" : "border-orange-100")}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <div className={clsx("p-2 rounded-lg mr-3 shadow-sm", isEditing ? "bg-amber-100 text-amber-600" : "bg-orange-100 text-orange-600")}>
                            {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                        </div>
                        {isEditing ? 'แก้ไขรายการ' : 'บันทึกผู้มาติดต่อ'}
                    </h2>
                    {isEditing && (
                        <button onClick={() => { setIsEditing(false); setFormData(initialFormState); }} className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50">
                            ยกเลิก
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date/Time */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">วันที่</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-orange-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">เวลาเข้า/ออก</label>
                            <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <input type="time" value={formData.timeIn} onChange={e => setFormData({ ...formData, timeIn: e.target.value })} className="w-1/2 p-3 bg-transparent outline-none text-center border-r border-slate-200 focus:bg-orange-50" required />
                                <input type="time" value={formData.timeOut} onChange={e => setFormData({ ...formData, timeOut: e.target.value })} className="w-1/2 p-3 bg-transparent outline-none text-center focus:bg-orange-50" />
                            </div>
                        </div>
                    </div>

                    {/* Visitor Info */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ทะเบียนรถ</label>
                        <div className="relative">
                            <Car size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input type="text" value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 pl-10 bg-slate-50 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="เช่น 1กข-1234" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ชื่อผู้ติดต่อ</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input type="text" value={formData.visitorName} onChange={e => setFormData({ ...formData, visitorName: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 pl-10 bg-slate-50 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="ชื่อ-สกุล" required />
                        </div>
                    </div>

                    {/* Destination */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ติดต่อบ้านเลขที่</label>
                        <input type="text" value={formData.houseNo} onChange={e => setFormData({ ...formData, houseNo: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="เช่น 101/1" required />
                    </div>

                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">วัตถุประสงค์ / หมายเหตุ</label>
                        <input type="text" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="เช่น ส่งของ, ซ่อมไฟ" />
                    </div>

                    <div className="lg:col-span-1 flex items-end">
                        <button type="submit" className={clsx("w-full h-[50px] flex items-center justify-center space-x-2 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95", isEditing ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white")}>
                            {isEditing ? <><Edit2 size={18} /><span>อัปเดต</span></> : <><Save size={18} /><span>บันทึก</span></>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-orange-50 border-b border-orange-100 font-bold text-orange-800 flex justify-between items-center">
                    <span><i className="fa-solid fa-car-side mr-2"></i>ประวัติการเข้า-ออก</span>
                    <span className="text-xs font-normal text-orange-600">แสดง 50 รายการล่าสุด</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs sticky top-0">
                            <tr>
                                <th className="px-4 py-3">วันที่/เวลา</th>
                                <th className="px-4 py-3">ทะเบียนรถ</th>
                                <th className="px-4 py-3">ผู้ติดต่อ</th>
                                <th className="px-4 py-3">บ้านเลขที่</th>
                                <th className="px-4 py-3 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">ไม่พบข้อมูล</td></tr>
                            ) : history.map((item) => (
                                <tr key={item.rowIndex} className="hover:bg-orange-50/20 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-700">{format(new Date(item.date), 'dd/MM/yy')}</div>
                                        <div className="text-xs text-slate-500 font-mono flex items-center mt-1">
                                            <Clock size={12} className="mr-1" />
                                            {item.timeIn} - {item.timeOut || '...'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-700 bg-slate-100 rounded px-2 w-fit h-fit">{item.plateNumber}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <div>{item.visitorName}</div>
                                        <div className="text-xs text-slate-400 italic">{item.purpose}</div>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-orange-600">{item.houseNo}</td>
                                    <td className="px-4 py-3 flex justify-center space-x-2 opacity-60 group-hover:opacity-100">
                                        <button onClick={() => handleEdit(item)} className="text-amber-500 hover:text-amber-700 p-1"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(item.rowIndex)} className="text-red-500 hover:text-red-700 p-1"><Trash size={16} /></button>
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
