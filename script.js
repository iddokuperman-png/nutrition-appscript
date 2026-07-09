function renderDashboard(data) {
  document.getElementById('calories-total').textContent = data.summary.calories;
  document.getElementById('protein-total').textContent = data.summary.protein;
  document.getElementById('entry-count').textContent = data.summary.count;

  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';

  if (!data.entries.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No meals logged yet.';
    historyList.appendChild(emptyItem);
    return;
  }

  data.entries.forEach((entry) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${entry.meal}</strong><br />
      <small>${entry.date} • ${entry.calories} kcal • ${entry.protein} g protein</small>
    `;
    historyList.appendChild(item);
  });
}

function loadDashboard() {
  const status = document.getElementById('status');
  status.textContent = 'Loading your data…';
  google.script.run.withSuccessHandler((data) => {
    renderDashboard(data);
    status.textContent = 'Ready to log a meal.';
  }).withFailureHandler((err) => {
    status.textContent = 'Could not load data.';
    console.error(err);
  }).getDashboardData();
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

  google.script.run.withSuccessHandler((data) => {
    renderDashboard(data);
    input.value = '';
    status.textContent = 'Meal added successfully.';
  }).withFailureHandler((err) => {
    status.textContent = err.message || 'Could not save the meal.';
    console.error(err);
  }).saveEntry(mealText);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('meal-form').addEventListener('submit', saveMeal);
  loadDashboard();
});
