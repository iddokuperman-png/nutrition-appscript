function getFirebaseUrl() {
  const input = document.getElementById('firebase-url');
  const rawValue = (input ? input.value : '').trim();
  const storedValue = localStorage.getItem('nutritionFirebaseUrl') || '';
  const value = rawValue || storedValue;

  if (value) {
    const normalized = value.replace(/\/$/, '');
    if (input) {
      input.value = normalized;
    }
    localStorage.setItem('nutritionFirebaseUrl', normalized);
    return normalized;
  }

  return '';
}

function isAppsScriptAvailable() {
  return typeof google !== 'undefined' && google && google.script && google.script.run;
}

function renderDashboard(data) {
  const summary = data.summary || { calories: 0, protein: 0, count: 0 };
  document.getElementById('calories-total').textContent = summary.calories;
  document.getElementById('protein-total').textContent = summary.protein;
  document.getElementById('entry-count').textContent = summary.count;

  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';

  const entries = data.entries || [];
  if (!entries.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No meals logged yet.';
    historyList.appendChild(emptyItem);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${entry.meal}</strong><br />
      <small>${entry.date} • ${entry.calories} kcal • ${entry.protein} g protein</small>
    `;
    historyList.appendChild(item);
  });
}

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeEntries(payload) {
  const entries = Object.keys(payload || {})
    .map((key) => ({ id: key, ...(payload[key] || {}) }))
    .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

  return entries.map((entry) => ({
    ...entry,
    calories: Number(entry.calories) || 0,
    protein: Number(entry.protein) || 0
  }));
}

function loadDashboardFromFirebase() {
  const status = document.getElementById('status');
  const url = getFirebaseUrl();

  if (!url) {
    renderDashboard({ summary: { calories: 0, protein: 0, count: 0 }, entries: [] });
    status.textContent = 'Enter your Firebase URL to load entries.';
    return;
  }

  status.textContent = 'Loading your data…';
  fetch(`${url}/entries.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Could not fetch data from Firebase.');
      }
      return response.json();
    })
    .then((payload) => {
      const entries = normalizeEntries(payload);
      const today = formatToday();
      const todayEntries = entries.filter((entry) => entry.date === today);
      const summary = {
        calories: todayEntries.reduce((sum, entry) => sum + entry.calories, 0),
        protein: todayEntries.reduce((sum, entry) => sum + entry.protein, 0),
        count: todayEntries.length
      };

      renderDashboard({ summary, entries });
      status.textContent = 'Ready to log a meal.';
    })
    .catch((err) => {
      status.textContent = err.message || 'Could not load data.';
      console.error(err);
    });
}

function loadDashboard() {
  const status = document.getElementById('status');
  status.textContent = 'Loading your data…';

  if (isAppsScriptAvailable()) {
    google.script.run.withSuccessHandler((data) => {
      renderDashboard(data);
      status.textContent = 'Ready to log a meal.';
    }).withFailureHandler((err) => {
      status.textContent = err.message || 'Could not load data.';
      console.error(err);
    }).getDashboardData();
    return;
  }

  loadDashboardFromFirebase();
}

function saveEntryToFirebase(mealText) {
  const status = document.getElementById('status');
  const url = getFirebaseUrl();
  const entry = {
    timestamp: new Date().toISOString(),
    date: formatToday(),
    meal: mealText,
    calories: 180,
    protein: 18,
    source: 'chat'
  };

  return fetch(`${url}/entries.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Could not save the meal to Firebase.');
      }
      return response.json();
    })
    .then(() => loadDashboardFromFirebase())
    .catch((err) => {
      status.textContent = err.message || 'Could not save the meal.';
      console.error(err);
    });
}

function saveMeal(event) {
  event.preventDefault();
  const input = document.getElementById('meal-input');
  const status = document.getElementById('status');
  const mealText = input.value;

  if (!mealText.trim()) {
    status.textContent = 'Please enter a meal description.';
    return;
  }

  status.textContent = 'Saving your meal…';

  if (isAppsScriptAvailable()) {
    google.script.run.withSuccessHandler((data) => {
      renderDashboard(data);
      input.value = '';
      status.textContent = 'Meal added successfully.';
    }).withFailureHandler((err) => {
      status.textContent = err.message || 'Could not save the meal.';
      console.error(err);
    }).saveEntry(mealText);
    return;
  }

  saveEntryToFirebase(mealText.trim()).then(() => {
    input.value = '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('meal-form').addEventListener('submit', saveMeal);
  loadDashboard();
});
