import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Income as IncomeType, DropdownData } from '../../types';
import { MONTH_NAMES } from '../../types';
import Swal from 'sweetalert2';
import { Plus, Trash, Edit2, Save, X, Calendar, Layers } from 'lucide-react';
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

    // Multi-Pay State
    const [showMultiPay, setShowMultiPay] = useState(false);
    const [multiPayForm, setMultiPayForm] = useState({
        houseNo: '',
        name: '',
        year: new Date().getFullYear(),
        selectedMonths: [] as string[],
        amountPerMonth: 0,
        date: new Date().toISOString().split('T')[0],
        note: 'ชำระค่าส่วนกลางล่วงหน้า'
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        const [dd, hist] = await Promise.all([api.getDropdownData(), api.getIncomes(50)]);
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

            const hist = await api.getIncomes(50);
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
            const hist = await api.getIncomes(50);
            setHistory(hist);
        }
    };

    // --- Multi Pay Handlers ---
    const handleMultiPayHouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const hNo = e.target.value;
        const member = dropdowns?.members.find(m => m.houseNo === hNo);
        setMultiPayForm(prev => ({
            ...prev,
            houseNo: hNo,
            name: member ? member.name : '',
            amountPerMonth: member ? member.commonFee : 0
        }));
    };

    const toggleMultiPayMonth = (month: string) => {
        setMultiPayForm(prev => {
            const exists = prev.selectedMonths.includes(month);
            return {
                ...prev,
                selectedMonths: exists
                    ? prev.selectedMonths.filter(m => m !== month)
                    : [...prev.selectedMonths, month]
            };
        });
    };

    const handleMultiPaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!multiPayForm.houseNo || multiPayForm.selectedMonths.length === 0) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณาเลือกบ้านเลขที่และอย่างน้อย 1 เดือน', 'warning');
            return;
        }

        const total = multiPayForm.selectedMonths.length * multiPayForm.amountPerMonth;
        const confirm = await Swal.fire({
            title: 'ยืนยันการบันทึก?',
            html: `บ้านเลขที่: <b>${multiPayForm.houseNo}</b><br/>` +
                `จำนวน: <b>${multiPayForm.selectedMonths.length} เดือน</b><br/>` +
                `รวมเป็นเงิน: <b>${total.toLocaleString()} บาท</b>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการชำระ',
            cancelButtonText: 'ยกเลิก'
        });

        if (confirm.isConfirmed) {
            // Sort months by index to ensure chronological order if needed, though we save separate records
            const sortedMonths = [...multiPayForm.selectedMonths].sort((a, b) => MONTH_NAMES.indexOf(a) - MONTH_NAMES.indexOf(b));

            let successCount = 0;
            for (const month of sortedMonths) {
                Swal.update({
                    title: `กำลังบันทึก...`,
                    html: `เดือน: <b>${month}</b> (${successCount + 1}/${sortedMonths.length})`
                });
                Swal.showLoading();

                const record: IncomeType = {
                    date: multiPayForm.date,
                    type: 'ค่าส่วนกลาง', // Default to common fee
                    month: month,
                    houseNo: multiPayForm.houseNo,
                    name: multiPayForm.name,
                    amount: multiPayForm.amountPerMonth,
                    note: multiPayForm.note
                };

                await api.saveIncome(record);
                successCount++;
            }

            Swal.fire('สำเร็จ', `บันทึกข้อมูลเรียบร้อย ${successCount} รายการ`, 'success');
            setShowMultiPay(false);
            setMultiPayForm(prev => ({ ...prev, houseNo: '', name: '', selectedMonths: [] })); // Reset key fields

            // Refresh
            const hist = await api.getIncomes(50);
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
                    {!isEditing && (
                        <button
                            onClick={() => setShowMultiPay(true)}
                            className="ml-auto text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-4 py-2 rounded-xl border border-indigo-200 flex items-center shadow-sm transition-transform active:scale-95"
                        >
                            <Layers size={18} className="mr-2" />
                            ชำระหลายเดือน
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
                                <th className="px-6 py-3 whitespace-nowrap">ประเภท</th>
                                <th className="px-6 py-3 whitespace-nowrap">ประจำเดือน</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">จำนวนเงิน</th>
                                <th className="px-6 py-3 whitespace-nowrap">หมายเหตุ</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-8 text-slate-400">ไม่พบข้อมูลบันทึกรายรับ</td></tr>
                            ) :
                                history.map((item) => (
                                    <tr key={item.rowIndex} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {item.houseNo} <span className="text-xs text-slate-400 block">{item.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{item.type}</td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{item.month}</td>
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
            {/* Multi Pay Modal */}
            {showMultiPay && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-10 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                    <Layers className="mr-2 text-indigo-600" /> ชำระค่าส่วนกลางแบบเหมาจ่าย
                                </h3>
                                <p className="text-sm text-slate-500">บันทึกรับเงินล่วงหน้าหลายเดือนในครั้งเดียว</p>
                            </div>
                            <button onClick={() => setShowMultiPay(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-2 rounded-full shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Row 1: House & Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">บ้านเลขที่</label>
                                    <select value={multiPayForm.houseNo} onChange={handleMultiPayHouseChange} className="w-full border-slate-200 rounded-xl p-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium">
                                        <option value="">-- เลือกบ้านเลขที่ --</option>
                                        {dropdowns?.members.map(m => <option key={m.houseNo} value={m.houseNo}>{m.houseNo} ({m.name})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">วันที่ชำระเงิน</label>
                                    <input type="date" value={multiPayForm.date} onChange={e => setMultiPayForm({ ...multiPayForm, date: e.target.value })} className="w-full border-slate-200 rounded-xl p-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>

                            {/* Row 2: Info & Amount */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ชื่อสมาชิก</label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">{multiPayForm.name || '-'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ค่าส่วนกลาง/เดือน</label>
                                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700 font-bold text-right font-mono">{multiPayForm.amountPerMonth.toLocaleString()}</div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Month Selector */}
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">เลือกเดือนที่ชำระ (ปี {multiPayForm.year + 543})</label>
                                    <div className="flex space-x-2">
                                        <button type="button" onClick={() => setMultiPayForm(p => ({ ...p, selectedMonths: [...MONTH_NAMES] }))} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded">เลือกทั้งหมด</button>
                                        <button type="button" onClick={() => setMultiPayForm(p => ({ ...p, selectedMonths: [] }))} className="text-xs bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 px-2 py-1 rounded">ล้าง</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {MONTH_NAMES.map((month) => {
                                        const isSelected = multiPayForm.selectedMonths.includes(month);
                                        return (
                                            <button
                                                key={month}
                                                type="button"
                                                onClick={() => toggleMultiPayMonth(month)}
                                                className={clsx(
                                                    "p-3 rounded-xl border text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center space-y-1 relative overflow-hidden",
                                                    isSelected
                                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 transform scale-105"
                                                        : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <span>{month}</span>
                                                {isSelected && <div className="absolute top-1 right-1"><div className="w-2 h-2 bg-white rounded-full"></div></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary & Note */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">หมายเหตุ</label>
                                    <input type="text" value={multiPayForm.note} onChange={e => setMultiPayForm({ ...multiPayForm, note: e.target.value })} className="w-full border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                    <span className="text-slate-600 font-medium">จำนวนเดือนที่เลือก: <span className="text-indigo-600 font-bold">{multiPayForm.selectedMonths.length}</span> เดือน</span>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-500 mr-2">รวมเป็นเงินทั้งสิ้น</span>
                                        <span className="text-2xl font-bold text-indigo-700">{(multiPayForm.selectedMonths.length * multiPayForm.amountPerMonth).toLocaleString()}</span>
                                        <span className="text-xs text-slate-500 ml-1">บาท</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-2xl">
                            <button onClick={() => setShowMultiPay(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">ยกเลิก</button>
                            <button onClick={handleMultiPaySubmit} disabled={multiPayForm.selectedMonths.length === 0 || !multiPayForm.houseNo} className="px-8 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                                <Save size={18} className="mr-2" />
                                ยืนยันการบันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
