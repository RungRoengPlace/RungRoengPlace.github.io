export interface Income {
  rowIndex?: number;
  date: string;
  type: string;
  month: string;
  houseNo: string;
  name: string;
  amount: number;
  note: string;
}

export interface Expense {
  rowIndex?: number;
  date: string;
  type: string;
  month: string;
  details: string;
  amount: number;
  note: string;
}

export interface Member {
  rowIndex?: number;
  houseNo: string;
  name: string;
  fee: number;
  specialNote: string;
}

export interface SecurityRecord {
  rowIndex?: number;
  date: string;
  timeIn: string;
  timeOut: string;
  visitorName: string;
  plateNumber: string;
  houseNo: string;
  purpose: string;
}

export interface BookBankMovement {
  rowIndex?: number;
  date: string;
  account: string; // 'บัญชีหลัก' | 'บัญชีรอง'
  type: string; // 'ฝาก' | 'ถอน'
  amount: number;
  note: string;
}

export interface DropdownData {
  incomeTypes: string[];
  expenseTypes: string[];
  members: Array<{
    id: number;
    houseNo: string;
    name: string;
    commonFee: number;
    specialNote: string;
  }>;
}

export type UserRole = 'member' | 'guard' | 'treasurer' | 'admin' | 'guest' | null;

export const MONTH_NAMES = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
export interface User {
  role: string;
  password: string;
  isEnabled: boolean;
  updated: string;
}
