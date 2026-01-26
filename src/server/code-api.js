// --- PASTE THIS INTO YOUR GOOGLE APPS SCRIPT (code.gs) ---
// This turns your script into a JSON API for the React App

const SPREADSHEET_ID = '1NxPw9CGZOmK40yEaQbRMMAs8FYgaD-U-h2rVsWuKuUg';

function doGet(e) {
    const action = e.parameter.action;
    let result = {};

    // CORS Headers
    const output = ContentService.createTextOutput();

    try {
        if (action === 'getDropdownData') result = getDataForDropdowns();
        else if (action === 'getIncomes') {
            const limit = e.parameter.limit ? parseInt(e.parameter.limit) : 0;
            result = getRecentIncome(limit);
        }
        else if (action === 'getExpenses') {
            const limit = e.parameter.limit ? parseInt(e.parameter.limit) : 0;
            result = getRecentExpense(limit);
        }
        else if (action === 'getMembers') result = getMembersData();
        else if (action === 'getSecurityRecords') result = getSecurityData();
        else if (action === 'getUsers') result = getUsersData();
        else if (action === 'verifyPassword') {
            const role = e.parameter.role;
            const pass = e.parameter.pass;
            result = verifyPassword(role, pass);
        }
        else result = { error: 'Unknown action' };

        output.setContent(JSON.stringify(result));

    } catch (err) {
        output.setContent(JSON.stringify({ error: err.message }));
    }

    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

function doPost(e) {
    const output = ContentService.createTextOutput();
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        const payload = data.payload;
        let result = {};

        if (action === 'saveIncome') result = saveIncome(payload);
        else if (action === 'deleteIncome') result = deleteIncome(payload.rowIndex);
        else if (action === 'saveExpense') result = saveExpense(payload);
        else if (action === 'deleteExpense') result = deleteExpense(payload.rowIndex);
        else if (action === 'saveMember') result = saveMember(payload);
        else if (action === 'deleteMember') result = deleteMember(payload.rowIndex);
        // Security
        else if (action === 'saveSecurityRecord') result = saveSecurityRecord(payload);
        else if (action === 'deleteSecurityRecord') result = deleteSecurityRecord(payload.rowIndex);
        // Users
        else if (action === 'saveUser') result = saveUser(payload);
        else result = { error: 'Unknown action' };

        output.setContent(JSON.stringify(result));

    } catch (err) {
        output.setContent(JSON.stringify({ error: err.message }));
    }
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

// ---------------- COPY OF ORIGINAL LOGIC BELOW ----------------

// --- Helper Functions ---
function getSheet(ss, names) {
    if (!Array.isArray(names)) names = [names];
    for (const name of names) {
        const sheet = ss.getSheetByName(name);
        if (sheet) return sheet;
    }
    return null;
}

function getCleanData(sheet, colIndex) {
    if (!sheet || sheet.getLastRow() < 2) return [];
    const data = sheet.getRange(2, colIndex, sheet.getLastRow() - 1, 1).getValues();
    return data.flat().filter(item => item !== "");
}

function ensureHeader(sheet, headers) {
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
    } else {
        const firstCell = sheet.getRange(1, 1).getValue();
        if (firstCell !== headers[0]) {
            sheet.insertRowBefore(1);
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
    }
}

// --- Dropdown Data & Initial Load ---
function getDataForDropdowns() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const incTypeSheet = getSheet(ss, ['ประเภทรายรับ', 'income_types']);
    const incTypes = getCleanData(incTypeSheet, 1);
    const expTypeSheet = getSheet(ss, ['ประเภทรายจ่าย', 'expense_types']);
    const expTypes = getCleanData(expTypeSheet, 1);

    const memberSheet = getSheet(ss, ['รายชื่อสมาชิก', 'members']);
    let members = [];
    if (memberSheet && memberSheet.getLastRow() > 1) {
        const data = memberSheet.getRange(2, 2, memberSheet.getLastRow() - 1, 4).getValues();
        members = data.map((row, index) => ({
            id: index + 2,
            houseNo: String(row[0]).trim(),
            name: String(row[1]).trim(),
            commonFee: row[2] || 0,
            specialNote: String(row[3] || "")
        })).filter(m => m.houseNo !== "");
    }
    return { incomeTypes: incTypes, expenseTypes: expTypes, members: members };
}

// --- Helper: Get Min Year ---
function getMinDataYear() {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let minYear = new Date().getFullYear();
        // Check both Thai and English names
        const sheetNamesToCheck = [
            ['บันทึกรายรับ', 'incomes'],
            ['บันทึกรายจ่าย', 'expenses']
        ];

        sheetNamesToCheck.forEach(names => {
            const sheet = getSheet(ss, names);
            if (sheet && sheet.getLastRow() > 1) {
                const dates = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat();
                dates.forEach(d => {
                    if (d instanceof Date) {
                        const y = d.getFullYear();
                        if (y < minYear && y > 2000) {
                            minYear = y;
                        }
                    }
                });
            }
        });
        return minYear;
    } catch (e) {
        return new Date().getFullYear();
    }
}

// --- CRUD: Income ---
function saveIncome(data) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = getSheet(ss, ['บันทึกรายรับ', 'incomes']);
        if (!sheet) sheet = ss.insertSheet('บันทึกรายรับ');
        ensureHeader(sheet, ['วันที่บันทึก', 'ประเภทรายรับ', 'ประจำเดือน', 'เลขที่/หลังที่', 'ชื่อ - สกุล', 'จำนวนเงิน', 'หมายเหตุ', 'Timestamp']);
        sheet.appendRow([data.date, data.type, data.month, "'" + data.houseNo, data.name, data.amount, data.note, new Date()]);
        return { status: 'success' };
    } catch (e) { throw new Error(e.message); }
}

function updateIncome(data) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = getSheet(ss, ['บันทึกรายรับ', 'incomes']);
        const rowIndex = parseInt(data.rowIndex);
        sheet.getRange(rowIndex, 1, 1, 7).setValues([[data.date, data.type, data.month, "'" + data.houseNo, data.name, data.amount, data.note]]);
        sheet.getRange(rowIndex, 8).setValue(new Date());
        return { status: 'success' };
    } catch (e) { throw new Error("Update Error: " + e.message); }
}

function deleteIncome(rowIndex) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = getSheet(ss, ['บันทึกรายรับ', 'incomes']);
        sheet.deleteRow(parseInt(rowIndex));
        return { status: 'success' };
    } catch (e) { throw new Error("Delete Error: " + e.message); }
}

function getRecentIncome(limit = 0) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getSheet(ss, ['บันทึกรายรับ', 'incomes']);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const lastRow = sheet.getLastRow();

    // Default: Fetch ALL rows if limit is 0
    let numRows = lastRow - 1;
    let startRow = 2;

    // Apply limit if specified
    if (limit > 0) {
        numRows = Math.min(limit, lastRow - 1);
        startRow = lastRow - numRows + 1;
    }

    const data = sheet.getRange(startRow, 1, numRows, 7).getValues();

    return data.map((row, index) => ({
        rowIndex: startRow + index,
        date: row[0] instanceof Date ? row[0].toISOString() : row[0],
        type: row[1],
        month: row[2],
        houseNo: String(row[3]).replace("'", ""),
        name: row[4],
        amount: row[5],
        note: row[6]
    })).reverse();
}

// --- CRUD: Expense ---
function saveExpense(data) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = getSheet(ss, ['บันทึกรายจ่าย', 'expenses']);
        if (!sheet) sheet = ss.insertSheet('บันทึกรายจ่าย');
        ensureHeader(sheet, ['วันที่บันทึก', 'ประเภทรายจ่าย', 'ประจำเดือน', 'รายละเอียด', 'จำนวนเงิน', 'หมายเหตุ', 'Timestamp']);
        sheet.appendRow([data.date, data.type, data.month, data.details, data.amount, data.note, new Date()]);
        return { status: 'success' };
    } catch (e) { throw new Error(e.message); }
}

function updateExpense(data) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = getSheet(ss, ['บันทึกรายจ่าย', 'expenses']);
        const rowIndex = parseInt(data.rowIndex);
        sheet.getRange(rowIndex, 1, 1, 6).setValues([[data.date, data.type, data.month, data.details, data.amount, data.note]]);
        sheet.getRange(rowIndex, 7).setValue(new Date());
        return { status: 'success' };
    } catch (e) { throw new Error("Update Error: " + e.message); }
}

function deleteExpense(rowIndex) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = getSheet(ss, ['บันทึกรายจ่าย', 'expenses']);
        sheet.deleteRow(parseInt(rowIndex));
        return { status: 'success' };
    } catch (e) { throw new Error("Delete Error: " + e.message); }
}

function getRecentExpense(limit = 0) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getSheet(ss, ['บันทึกรายจ่าย', 'expenses']);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const lastRow = sheet.getLastRow();

    // Default: Fetch ALL rows if limit is 0
    let numRows = lastRow - 1;
    let startRow = 2;

    // Apply limit if specified
    if (limit > 0) {
        numRows = Math.min(limit, lastRow - 1);
        startRow = lastRow - numRows + 1;
    }

    const data = sheet.getRange(startRow, 1, numRows, 6).getValues();

    return data.map((row, index) => ({
        rowIndex: startRow + index,
        date: row[0] instanceof Date ? row[0].toISOString() : row[0],
        type: row[1],
        month: row[2],
        details: row[3],
        amount: row[4],
        note: row[5]
    })).reverse();
}

// --- CRUD: Members ---
function getMembersData() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = getSheet(ss, ['รายชื่อสมาชิก', 'members']);
    if (!sheet) return [];
    if (sheet.getLastRow() < 2) return [];
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    return data.map((row, index) => ({
        rowIndex: index + 2,
        no: row[0],
        houseNo: String(row[1]),
        name: String(row[2]),
        fee: row[3],
        specialNote: String(row[4] || "")
    }));
}

function saveMember(data) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = getSheet(ss, ['รายชื่อสมาชิก', 'members']);
        if (!sheet) sheet = ss.insertSheet('รายชื่อสมาชิก');
        ensureHeader(sheet, ['ลำดับ', 'เลขที่/หลังที่', 'ชื่อ - สกุล', 'ค่าส่วนกลาง (บาท)', 'Special Note']);

        if (data.rowIndex) {
            const row = parseInt(data.rowIndex);
            sheet.getRange(row, 2, 1, 4).setValues([[data.houseNo, data.name, data.fee, data.specialNote]]);
        } else {
            const lastRow = sheet.getLastRow();
            const newNo = lastRow > 0 ? lastRow : 1;
            sheet.appendRow([newNo, data.houseNo, data.name, data.fee, data.specialNote]);
        }
        return { status: 'success' };
    } catch (e) { throw new Error(e.message); }
}

function deleteMember(rowIndex) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = getSheet(ss, ['รายชื่อสมาชิก', 'members']);
        sheet.deleteRow(parseInt(rowIndex));
        return { status: 'success' };
    } catch (e) { throw new Error(e.message); }
}

// --- Auth / Settings Same as Before ---
function verifyPassword(role, inputPassword) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = getSheet(ss, ['ผู้ใช้', 'users']);
        if (!sheet || sheet.getLastRow() < 2) return { valid: false, message: 'No users found' };

        const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();

        let userRow = null;
        for (let i = data.length - 1; i >= 0; i--) {
            if (String(data[i][0]).trim().toLowerCase() === role.toLowerCase()) {
                userRow = data[i];
                break;
            }
        }

        if (!userRow) return { valid: false, message: 'Role not found' };

        const storedPassword = String(userRow[1]);
        const isEnabled = (userRow[2] === true || String(userRow[2]).toLowerCase() === 'true');

        if (!isEnabled) return { valid: true };

        return { valid: String(storedPassword) === String(inputPassword) };
    } catch (e) {
        return { valid: false, message: e.message };
    }
}
// --- CRUD: Security Records ---
function getSecurityData() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = getSheet(ss, ['บันทึก รปภ.', 'security']);
    if (!sheet || sheet.getLastRow() < 2) return [];

    // Get last 50
    const lastRow = sheet.getLastRow();
    const numRows = Math.min(50, lastRow - 1);
    const startRow = lastRow - numRows + 1;

    const data = sheet.getRange(startRow, 1, numRows, 8).getValues();
    return data.map((row, index) => ({
        rowIndex: startRow + index,
        date: row[0] instanceof Date ? row[0].toISOString().split('T')[0] : row[0],
        timeIn: row[1] instanceof Date ? row[1].toTimeString().slice(0, 5) : row[1],
        timeOut: row[2] instanceof Date ? row[2].toTimeString().slice(0, 5) : row[2],
        visitorName: String(row[3]),
        plateNumber: String(row[4]),
        houseNo: String(row[5]),
        purpose: String(row[6]),
        timestamp: row[7]
    })).reverse();
}

function saveSecurityRecord(data) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = getSheet(ss, ['บันทึก รปภ.', 'security']);
        if (!sheet) sheet = ss.insertSheet('บันทึก รปภ.');
        ensureHeader(sheet, ['วันที่', 'เวลาเข้า', 'เวลาออก', 'ผู้มาติดต่อ', 'ทะเบียนรถ', 'บ้านเลขที่', 'วัตถุประสงค์', 'Timestamp']);

        if (data.rowIndex) {
            const row = parseInt(data.rowIndex);
            sheet.getRange(row, 1, 1, 7).setValues([[
                data.date, data.timeIn, data.timeOut, data.visitorName, data.plateNumber, data.houseNo, data.purpose
            ]]);
            sheet.getRange(row, 8).setValue(new Date());
        } else {
            sheet.appendRow([
                data.date, data.timeIn, data.timeOut, data.visitorName, data.plateNumber, data.houseNo, data.purpose, new Date()
            ]);
        }
        return { status: 'success' };
    } catch (e) { throw new Error(e.message); }
}

function deleteSecurityRecord(rowIndex) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = getSheet(ss, ['บันทึก รปภ.', 'security']);
        sheet.deleteRow(parseInt(rowIndex));
        return { status: 'success' };
    } catch (e) { throw new Error(e.message); }
}

// --- CRUD: Users ---
function getUsersData() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = getSheet(ss, ['ผู้ใช้', 'users']);
    if (!sheet || sheet.getLastRow() < 2) return [];
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    return data.map((row, index) => ({
        role: row[0],
        password: row[1],
        isEnabled: row[2] === true || String(row[2]).toLowerCase() === 'true',
        updated: '' // No updated col in this simple version
    }));
}

function saveUser(data) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = getSheet(ss, ['ผู้ใช้', 'users']);
        if (!sheet) sheet = ss.insertSheet('ผู้ใช้');
        ensureHeader(sheet, ['Role', 'Password', 'IsEnabled']);

        const rows = sheet.getDataRange().getValues();
        let foundIndex = -1;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === data.role) {
                foundIndex = i + 1;
                break;
            }
        }

        if (foundIndex !== -1) {
            sheet.getRange(foundIndex, 2, 1, 2).setValues([[data.password, data.isEnabled]]);
        } else {
            sheet.appendRow([data.role, data.password, data.isEnabled]);
        }
        return { status: 'success' };
    } catch (e) { throw new Error(e.message); }
}
