
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', 'src', 'data');
const outputDir = path.join(__dirname, '..', 'export_data');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Helper to escape CSV fields
const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

// 1. Members
const members = require(path.join(projectRoot, 'members.json'));
const membersHeader = ['ลำดับ', 'เลขที่/หลังที่', 'ชื่อ - สกุล', 'ค่าส่วนกลาง (บาท)', 'Special Note'].join(',');
const membersRows = members.map((m, i) => {
    return [
        i + 1,
        escape(m.houseNo),
        escape(m.name),
        m.fee,
        escape(m.specialNote)
    ].join(',');
});
fs.writeFileSync(path.join(outputDir, 'members.csv'), [membersHeader, ...membersRows].join('\n'));

// 2. Incomes
const incomes = require(path.join(projectRoot, 'incomes.json'));
const incomesHeader = ['วันที่บันทึก', 'ประเภทรายรับ', 'ประจำเดือน', 'เลขที่/หลังที่', 'ชื่อ - สกุล', 'จำนวนเงิน', 'หมายเหตุ', 'Timestamp'].join(',');
const incomesRows = incomes.map(i => {
    return [
        escape(i.date),
        escape(i.type),
        escape(i.month),
        escape(i.houseNo),
        escape(i.name),
        i.amount,
        escape(i.note),
        new Date().toISOString()
    ].join(',');
});
fs.writeFileSync(path.join(outputDir, 'incomes.csv'), [incomesHeader, ...incomesRows].join('\n'));

// 3. Expenses
const expenses = require(path.join(projectRoot, 'expenses.json'));
const expensesHeader = ['วันที่บันทึก', 'ประเภทรายจ่าย', 'ประจำเดือน', 'รายละเอียด', 'จำนวนเงิน', 'หมายเหตุ', 'Timestamp'].join(',');
const expensesRows = expenses.map(e => {
    return [
        escape(e.date),
        escape(e.type),
        escape(e.month),
        escape(e.details),
        e.amount,
        escape(e.note),
        new Date().toISOString()
    ].join(',');
});
fs.writeFileSync(path.join(outputDir, 'expenses.csv'), [expensesHeader, ...expensesRows].join('\n'));

// 4. Users
const users = require(path.join(projectRoot, 'users.json'));
const usersHeader = ['Role', 'Password', 'IsEnabled'].join(',');
const usersRows = users.map(u => {
    return [
        escape(u.role),
        escape(u.password),
        u.isEnabled
    ].join(',');
});
fs.writeFileSync(path.join(outputDir, 'users.csv'), [usersHeader, ...usersRows].join('\n'));

// 5. Income Types
const incomeTypes = require(path.join(projectRoot, 'incomeTypes.json'));
const incTypesHeader = ['ประเภทรายรับ'].join(',');
const incTypesRows = incomeTypes.map(t => escape(t));
fs.writeFileSync(path.join(outputDir, 'income_types.csv'), [incTypesHeader, ...incTypesRows].join('\n'));

// 6. Expense Types
const expenseTypes = require(path.join(projectRoot, 'expenseTypes.json'));
const expTypesHeader = ['ประเภทรายจ่าย'].join(',');
const expTypesRows = expenseTypes.map(t => escape(t));
fs.writeFileSync(path.join(outputDir, 'expense_types.csv'), [expTypesHeader, ...expTypesRows].join('\n'));

// 7. Security (Mock)
const securityRows = [
    ['2024-03-20', '08:00', '17:00', 'ช่างไฟ', '1กข-1234', '101/1', 'ซ่อมไฟ', new Date().toISOString()].map(escape).join(',')
];
const securityHeader = ['วันที่', 'เวลาเข้า', 'เวลาออก', 'ผู้มาติดต่อ', 'ทะเบียนรถ', 'บ้านเลขที่', 'วัตถุประสงค์', 'Timestamp'].join(',');
fs.writeFileSync(path.join(outputDir, 'security.csv'), [securityHeader, ...securityRows].join('\n'));

console.log('CSV Export Complete to ' + outputDir);
