import type { Income, Expense, Member, DropdownData, SecurityRecord, User } from '../types';

import dataIncomes from '../data/incomes.json';
import dataExpenses from '../data/expenses.json';
import dataMembers from '../data/members.json';
import dataIncomeTypes from '../data/incomeTypes.json';
import dataExpenseTypes from '../data/expenseTypes.json';

import dataUsers from '../data/users.json';

// ==========================================
// CONFIGURATION
// ==========================================
// 1. Deploy your Google Apps Script using src/server/code-api.js
// 2. Paste the URL below
// 3. Set USE_REAL_API = true
const USE_REAL_API = true;
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgpl1uxA7g2HCBGHlWqTvqseJWevIfpKvhJxyNzOrPekEtTc6B5fGEd1BomnYJ6WZqcw/exec';
let isGuestMode = false;
// ==========================================

// --- MOCK DATA ---
let mockIncomes: Income[] = (dataIncomes as any[]).map((Item, i) => ({ ...Item, rowIndex: i + 2 })) as Income[];
let mockExpenses: Expense[] = (dataExpenses as any[]).map((Item, i) => ({ ...Item, rowIndex: i + 2 })) as Expense[];
let mockMembers: Member[] = (dataMembers as any[]).map((Item, i) => ({ ...Item, rowIndex: i + 2, fee: Number(Item.fee) })) as Member[];
let mockSecurityRecords: SecurityRecord[] = [
    { rowIndex: 2, date: '2024-03-20', timeIn: '08:00', timeOut: '17:00', visitorName: 'ช่างไฟ', plateNumber: '1กข-1234', houseNo: '101/1', purpose: 'ซ่อมไฟ' }
];
let mockUsers: User[] = (dataUsers as any[]).map(u => ({ ...u, isEnabled: u.isEnabled === true })) as User[];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API IMPLEMENTATION ---
export const api = {
    setGuestMode: (isGuest: boolean) => { isGuestMode = isGuest; },

    getDropdownData: async (): Promise<DropdownData> => {
        if (USE_REAL_API && !isGuestMode) return await fetchGet('getDropdownData');
        await delay(500);
        return {
            incomeTypes: dataIncomeTypes,
            expenseTypes: dataExpenseTypes,
            members: mockMembers.map((m, i) => ({
                id: i + 2,
                houseNo: m.houseNo,
                name: m.name,
                commonFee: m.fee,
                specialNote: m.specialNote
            }))
        };
    },

    getIncomes: async (): Promise<Income[]> => {
        if (USE_REAL_API && !isGuestMode) return await fetchGet('getIncomes');
        await delay(600);
        return [...mockIncomes].reverse();
    },

    saveIncome: async (data: Income) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('saveIncome', data);
        await delay(800);
        if (data.rowIndex) {
            const idx = mockIncomes.findIndex(i => i.rowIndex === Number(data.rowIndex));
            if (idx !== -1) mockIncomes[idx] = data;
        } else {
            mockIncomes.push({ ...data, rowIndex: Date.now() });
        }
        return { status: 'success' };
    },

    deleteIncome: async (rowIndex: number) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('deleteIncome', { rowIndex });
        await delay(500);
        mockIncomes = mockIncomes.filter(i => i.rowIndex !== Number(rowIndex));
        return { status: 'success' };
    },

    getExpenses: async (): Promise<Expense[]> => {
        if (USE_REAL_API && !isGuestMode) return await fetchGet('getExpenses');
        await delay(600);
        return [...mockExpenses].reverse();
    },

    saveExpense: async (data: Expense) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('saveExpense', data);
        await delay(800);
        if (data.rowIndex) {
            const idx = mockExpenses.findIndex(e => e.rowIndex === Number(data.rowIndex));
            if (idx !== -1) mockExpenses[idx] = data;
        } else {
            mockExpenses.push({ ...data, rowIndex: Date.now() });
        }
        return { status: 'success' };
    },

    deleteExpense: async (rowIndex: number) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('deleteExpense', { rowIndex });
        await delay(500);
        mockExpenses = mockExpenses.filter(e => e.rowIndex !== Number(rowIndex));
        return { status: 'success' };
    },

    getMembers: async (): Promise<Member[]> => {
        if (USE_REAL_API && !isGuestMode) return await fetchGet('getMembers');
        await delay(600);
        return [...mockMembers];
    },

    saveMember: async (data: Member) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('saveMember', data);
        await delay(800);
        if (data.rowIndex) {
            const idx = mockMembers.findIndex(m => m.rowIndex === Number(data.rowIndex));
            if (idx !== -1) mockMembers[idx] = data;
        } else {
            mockMembers.push({ ...data, rowIndex: Date.now() });
        }
        return { status: 'success' };
    },

    deleteMember: async (rowIndex: number) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('deleteMember', { rowIndex });
        await delay(500);
        mockMembers = mockMembers.filter(m => m.rowIndex !== Number(rowIndex));
        return { status: 'success' };
    },

    getSecurityRecords: async (): Promise<SecurityRecord[]> => {
        if (USE_REAL_API && !isGuestMode) return await fetchGet('getSecurityRecords');
        await delay(600);
        return [...mockSecurityRecords].reverse();
    },

    saveSecurityRecord: async (data: SecurityRecord) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('saveSecurityRecord', data);
        await delay(800);
        if (data.rowIndex) {
            const idx = mockSecurityRecords.findIndex(s => s.rowIndex === Number(data.rowIndex));
            if (idx !== -1) mockSecurityRecords[idx] = data;
        } else {
            mockSecurityRecords.push({ ...data, rowIndex: Date.now() });
        }
        return { status: 'success' };
    },

    deleteSecurityRecord: async (rowIndex: number) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('deleteSecurityRecord', { rowIndex });
        await delay(500);
        mockSecurityRecords = mockSecurityRecords.filter(s => s.rowIndex !== Number(rowIndex));
        return { status: 'success' };
    },

    isPasswordRequired: async (role: string): Promise<boolean> => {
        if (role === 'guest') return false;
        if (USE_REAL_API && !isGuestMode) {
            // Assume real API returns user config or we can fetch verify first. 
            // For now, let's assume real API logic is handled server side or we fetch users.
            // Simplified: Mock only for now as per previous step context.
            return true;
        }
        await delay(300);
        const user = mockUsers.find(u => u.role === role);
        return user ? user.isEnabled : true; // Default to true if not found for safety
    },

    getUsers: async (): Promise<User[]> => {
        if (USE_REAL_API && !isGuestMode) return await fetchGet('getUsers');
        await delay(500);
        return [...mockUsers];
    },

    saveUser: async (data: User) => {
        if (USE_REAL_API && !isGuestMode) return await fetchPost('saveUser', data);
        await delay(800);
        const idx = mockUsers.findIndex(u => u.role === data.role);
        if (idx !== -1) {
            mockUsers[idx] = { ...data, updated: new Date().toLocaleString('en-GB') };
        }
        return { status: 'success' };
    },

    verifyPassword: async (role: string, pass: string) => {
        if (USE_REAL_API && !isGuestMode) {
            const res = await fetchGet('verifyPassword', `&role=${role}&pass=${pass}`);
            return res;
        }
        await delay(1000);

        const user = mockUsers.find(u => u.role === role);
        if (!user) return { valid: false, message: 'Role not found' };
        if (!user.isEnabled) return { valid: false, message: 'บัญชีถูกระงับการใช้งาน' };

        // Simple string comparison
        if (String(user.password) === String(pass)) return { valid: true };

        return { valid: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    }
};

// --- HELPER FOR REAL API ---
async function fetchGet(action: string, params: string = '') {
    const url = `${GOOGLE_SCRIPT_URL}?action=${action}${params}`;
    const response = await fetch(url);
    return await response.json();
}

async function fetchPost(action: string, payload: any) {
    // We use no-cors if simple POST, but we need response.
    // Apps Script Web App must be deployed as "Anyone" for this to work with CORS.
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action, payload })
    });
    return await response.json();
}
