const FIREBASE_PATH = 'entries';

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
  const entries = getFirebaseEntries();
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

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const estimate = estimateNutrition(trimmed);
  const entry = {
    timestamp: new Date().toISOString(),
    date: today,
    meal: trimmed,
    calories: estimate.calories,
    protein: estimate.protein,
    source: 'chat'
  };

  writeFirebaseEntry(entry);
  return getDashboardData();
}

function getFirebaseBaseUrl() {
  const configuredUrl = PropertiesService.getScriptProperties().getProperty('FIREBASE_URL');
  if (!configuredUrl) {
    throw new Error('Missing Firebase URL. Add it to Script Properties as FIREBASE_URL.');
  }
  return configuredUrl.replace(/\/$/, '');
}

function getFirebaseEntries() {
  const baseUrl = getFirebaseBaseUrl();
  const response = UrlFetchApp.fetch(`${baseUrl}/${FIREBASE_PATH}.json`, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (response.getResponseCode() >= 400) {
    throw new Error(`Firebase request failed: ${response.getContentText()}`);
  }

  const payload = JSON.parse(response.getContentText() || '{}');
  const entries = Object.keys(payload || {})
    .map((key) => ({
      id: key,
      ...(payload[key] || {})
    }))
    .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

  return entries.map((entry) => ({
    ...entry,
    calories: Number(entry.calories) || 0,
    protein: Number(entry.protein) || 0
  }));
}

function writeFirebaseEntry(entry) {
  const baseUrl = getFirebaseBaseUrl();
  const response = UrlFetchApp.fetch(`${baseUrl}/${FIREBASE_PATH}.json`, {
    method: 'post',
    muteHttpExceptions: true,
    contentType: 'application/json',
    payload: JSON.stringify(entry)
  });

  if (response.getResponseCode() >= 400) {
    throw new Error(`Firebase write failed: ${response.getContentText()}`);
  }
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
