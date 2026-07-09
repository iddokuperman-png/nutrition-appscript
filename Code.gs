const SHEET_NAME = 'NutritionEntries';
const HEADERS = ['timestamp', 'date', 'meal', 'calories', 'protein', 'source'];

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Nutrition Tracker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getDashboardData() {
  const sheet = getOrCreateSheet();
  const rows = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), HEADERS.length).getValues();
  const entries = rows
    .filter((row) => row[0])
    .map((row) => ({
      timestamp: row[0],
      date: row[1],
      meal: row[2],
      calories: Number(row[3]) || 0,
      protein: Number(row[4]) || 0,
      source: row[5] || 'chat'
    }))
    .reverse();

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const todayEntries = entries.filter((entry) => entry.date === today);
  const summary = {
    calories: todayEntries.reduce((sum, entry) => sum + entry.calories, 0),
    protein: todayEntries.reduce((sum, entry) => sum + entry.protein, 0),
    count: todayEntries.length
  };

  return {
    today,
    summary,
    entries
  };
}

function saveEntry(mealText) {
  const trimmed = (mealText || '').trim();
  if (!trimmed) {
    throw new Error('Please enter a meal description.');
  }

  const sheet = getOrCreateSheet();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const estimate = estimateNutrition(trimmed);
  const row = [new Date(), today, trimmed, estimate.calories, estimate.protein, 'chat'];
  sheet.appendRow(row);

  return getDashboardData();
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#e8f0fe');
  }

  return sheet;
}

function estimateNutrition(text) {
  const normalized = (text || '').toLowerCase();
  const foodMap = [
    { name: 'egg', calories: 70, protein: 6 },
    { name: 'eggs', calories: 70, protein: 6 },
    { name: 'yogurt', calories: 120, protein: 10 },
    { name: 'banana', calories: 105, protein: 1 },
    { name: 'toast', calories: 80, protein: 3 },
    { name: 'bread', calories: 80, protein: 3 },
    { name: 'milk', calories: 60, protein: 4 },
    { name: 'chicken', calories: 180, protein: 35 },
    { name: 'salmon', calories: 220, protein: 25 },
    { name: 'rice', calories: 205, protein: 4 },
    { name: 'pasta', calories: 220, protein: 8 },
    { name: 'cheese', calories: 115, protein: 7 },
    { name: 'cereal', calories: 150, protein: 5 },
    { name: 'beans', calories: 130, protein: 9 },
    { name: 'oats', calories: 150, protein: 5 }
  ];

  let calories = 180;
  let protein = 18;

  foodMap.forEach((food) => {
    if (normalized.includes(food.name)) {
      calories += food.calories;
      protein += food.protein;
    }
  });

  if (normalized.includes('breakfast')) {
    calories += 30;
    protein += 5;
  }

  if (normalized.includes('lunch') || normalized.includes('dinner')) {
    calories += 40;
    protein += 6;
  }

  if (normalized.includes('protein')) {
    protein += 10;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein)
  };
}
