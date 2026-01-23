const SPREADSHEET_ID = '1XPM_5eS7lRXQOHoDM6R5zR_yfeiP2x7EwRnsinNovfw';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('ระบบบัญชี หมู่บ้านรุ่งเรืองเพลส')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// --- Helper Functions ---
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
  const incTypeSheet = ss.getSheetByName('ประเภทรายรับ');
  const incTypes = getCleanData(incTypeSheet, 1);
  const expTypeSheet = ss.getSheetByName('ประเภทรายจ่าย');
  const expTypes = getCleanData(expTypeSheet, 1);
  
  const memberSheet = ss.getSheetByName('รายชื่อสมาชิก');
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
    ['บันทึกรายรับ', 'บันทึกรายจ่าย'].forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
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
    let sheet = ss.getSheetByName('บันทึกรายรับ');
    if (!sheet) sheet = ss.insertSheet('บันทึกรายรับ');
    ensureHeader(sheet, ['วันที่บันทึก', 'ประเภทรายรับ', 'ประจำเดือน', 'เลขที่/หลังที่', 'ชื่อ - สกุล', 'จำนวนเงิน', 'หมายเหตุ', 'Timestamp']);
    sheet.appendRow([data.date, data.type, data.month, "'" + data.houseNo, data.name, data.amount, data.note, new Date()]);
    return { status: 'success' };
  } catch (e) { throw new Error(e.message); }
}

function updateIncome(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('บันทึกรายรับ');
    const rowIndex = parseInt(data.rowIndex);
    sheet.getRange(rowIndex, 1, 1, 7).setValues([[data.date, data.type, data.month, "'" + data.houseNo, data.name, data.amount, data.note]]);
    sheet.getRange(rowIndex, 8).setValue(new Date());
    return { status: 'success' };
  } catch (e) { throw new Error("Update Error: " + e.message); }
}

function deleteIncome(rowIndex) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('บันทึกรายรับ');
    sheet.deleteRow(parseInt(rowIndex));
    return { status: 'success' };
  } catch (e) { throw new Error("Delete Error: " + e.message); }
}

function getRecentIncome() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('บันทึกรายรับ');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const lastRow = sheet.getLastRow();
  const numRows = Math.min(50, lastRow - 1);
  const startRow = lastRow - numRows + 1;
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
    let sheet = ss.getSheetByName('บันทึกรายจ่าย');
    if (!sheet) sheet = ss.insertSheet('บันทึกรายจ่าย');
    ensureHeader(sheet, ['วันที่บันทึก', 'ประเภทรายจ่าย', 'ประจำเดือน', 'รายละเอียด', 'จำนวนเงิน', 'หมายเหตุ', 'Timestamp']);
    sheet.appendRow([data.date, data.type, data.month, data.details, data.amount, data.note, new Date()]);
    return { status: 'success' };
  } catch (e) { throw new Error(e.message); }
}

function updateExpense(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('บันทึกรายจ่าย');
    const rowIndex = parseInt(data.rowIndex);
    sheet.getRange(rowIndex, 1, 1, 6).setValues([[data.date, data.type, data.month, data.details, data.amount, data.note]]);
    sheet.getRange(rowIndex, 7).setValue(new Date());
    return { status: 'success' };
  } catch (e) { throw new Error("Update Error: " + e.message); }
}

function deleteExpense(rowIndex) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('บันทึกรายจ่าย');
    sheet.deleteRow(parseInt(rowIndex));
    return { status: 'success' };
  } catch (e) { throw new Error("Delete Error: " + e.message); }
}

function getRecentExpense() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('บันทึกรายจ่าย');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const lastRow = sheet.getLastRow();
  const numRows = Math.min(50, lastRow - 1);
  const startRow = lastRow - numRows + 1;
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
  let sheet = ss.getSheetByName('รายชื่อสมาชิก');
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
    let sheet = ss.getSheetByName('รายชื่อสมาชิก');
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
    const sheet = ss.getSheetByName('รายชื่อสมาชิก');
    sheet.deleteRow(parseInt(rowIndex));
    return { status: 'success' };
  } catch (e) { throw new Error(e.message); }
}

// --- Reports ---
function getCommonFeeReport(year) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const incSheet = ss.getSheetByName('บันทึกรายรับ');
  const memSheet = ss.getSheetByName('รายชื่อสมาชิก'); 
  
  const result = {}; 
  const memberNotes = {}; 

  if (memSheet && memSheet.getLastRow() > 1) {
    const memData = memSheet.getRange(2, 2, memSheet.getLastRow() - 1, 4).getValues(); 
    memData.forEach(row => {
      const houseNo = String(row[0]).trim();
      const note = String(row[3] || "").trim(); 
      if (houseNo) memberNotes[houseNo] = note;
    });
  }

  if (!incSheet || incSheet.getLastRow() < 2) return { report: result, notes: memberNotes };
  
  const data = incSheet.getRange(2, 1, incSheet.getLastRow() - 1, 4).getValues(); 
  const monthMap = { "มกราคม": 0, "กุมภาพันธ์": 1, "มีนาคม": 2, "เมษายน": 3, "พฤษภาคม": 4, "มิถุนายน": 5, "กรกฎาคม": 6, "สิงหาคม": 7, "กันยายน": 8, "ตุลาคม": 9, "พฤศจิกายน": 10, "ธันวาคม": 11 };
  
  data.forEach(row => {
    try {
      const recordDate = new Date(row[0]);
      if (recordDate.getFullYear() == year && String(row[1]).trim() === 'ค่าส่วนกลาง') {
        const houseNo = String(row[3]).replace("'", "").trim();
        if (!result[houseNo]) result[houseNo] = new Array(12).fill(false);
        const monthIndex = monthMap[row[2]];
        if (monthIndex !== undefined) result[houseNo][monthIndex] = true;
      }
    } catch (e) {}
  });
  
  return { report: result, notes: memberNotes };
}

function getExpenseReport(year) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('บันทึกรายจ่าย');
  const result = {};
  if (!sheet || sheet.getLastRow() < 2) return result;
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  const monthMap = { "มกราคม": 0, "กุมภาพันธ์": 1, "มีนาคม": 2, "เมษายน": 3, "พฤษภาคม": 4, "มิถุนายน": 5, "กรกฎาคม": 6, "สิงหาคม": 7, "กันยายน": 8, "ตุลาคม": 9, "พฤศจิกายน": 10, "ธันวาคม": 11 };
  data.forEach(row => {
    try {
      const recordDate = new Date(row[0]);
      if (recordDate.getFullYear() == year) {
        const type = String(row[1]).trim();
        const amount = parseFloat(row[4]) || 0;
        if (!result[type]) result[type] = new Array(12).fill(0);
        const monthIndex = monthMap[row[2]];
        if (monthIndex !== undefined) result[type][monthIndex] += amount;
      }
    } catch (e) {}
  });
  return result;
}

// --- Auth / Settings (FIXED) ---
function getAuthSettings() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('ผู้ใช้');
  if (!sheet) return {};
  if (sheet.getLastRow() < 2) return {};
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const result = {};
  data.forEach(row => {
    // Normalizing key to ensure consistency
    const roleKey = String(row[0]).trim().toLowerCase();
    if(roleKey) {
        // Only return isEnabled
        result[roleKey] = { isEnabled: (row[2] === true || String(row[2]).toLowerCase() === 'true') };
    }
  });
  return result;
}

function verifyPassword(role, inputPassword) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ผู้ใช้');
    if (!sheet || sheet.getLastRow() < 2) return { valid: false, message: 'No users found' };
    
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    
    // FIX: Reverse search (find LAST matching row) to match getAuthSettings behavior
    // This solves the issue if duplicate rows exist.
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
    
    // Double check: If found row says disabled, allow access
    if (!isEnabled) return { valid: true }; 
    
    return { valid: String(storedPassword) === String(inputPassword) };
  } catch (e) {
    return { valid: false, message: e.message };
  }
}

function saveAuthSettings(role, password, isEnabled) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('ผู้ใช้');
    if (!sheet) sheet = ss.insertSheet('ผู้ใช้');
    ensureHeader(sheet, ['Role', 'Password', 'IsEnabled', 'Updated']);
    
    const lastRow = sheet.getLastRow();
    let rowToUpdate = -1;
    
    // FIX: Case-insensitive search to prevent duplicates
    if (lastRow > 1) {
      const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][0]).trim().toLowerCase() === String(role).trim().toLowerCase()) {
          rowToUpdate = i + 2;
          break;
        }
      }
    }
    
    if (rowToUpdate !== -1) {
      if(password) sheet.getRange(rowToUpdate, 2).setValue(password);
      sheet.getRange(rowToUpdate, 3).setValue(isEnabled);
      sheet.getRange(rowToUpdate, 4).setValue(new Date());
    } else {
      sheet.appendRow([role, password, isEnabled, new Date()]);
    }
    return { status: 'success' };
  } catch (e) { throw new Error("Error saving settings: " + e.message); }
}