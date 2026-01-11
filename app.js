// ===============================
// DATE HELPERS
// ===============================
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// ===============================
// LOAD SAVED DATA
// ===============================
let water = Number(localStorage.getItem("water")) || 0;
let exercises = JSON.parse(localStorage.getItem("exercises")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let lastDate = localStorage.getItem("lastDate");

// ===============================
// DAILY RESET LOGIC
// ===============================
const today = getToday();

if (lastDate && lastDate !== today) {
  saveDayToHistory();
  water = 0;
  exercises = [];
  localStorage.setItem("water", water);
  localStorage.setItem("exercises", JSON.stringify(exercises));
  localStorage.setItem("lastDate", today);
}

if (!lastDate) {
  localStorage.setItem("lastDate", today);
}

// ===============================
// SAVE HISTORY
// ===============================
function saveDayToHistory() {
  if (water === 0 && exercises.length === 0) return;

  history.push({
    date: lastDate,
    water: water,
    exerciseCount: exercises.length
  });

  localStorage.setItem("history", JSON.stringify(history));
}

// ===============================
// INITIAL UI
// ===============================
document.getElementById("waterTotal").innerText =
  `Today: ${water} ml`;

renderExercises();
renderHistory();
renderCharts();

// ===============================
// ADD WATER
// ===============================
function addWater() {
  const input = document.getElementById("waterInput");
  const amount = Number(input.value);
  if (amount <= 0) return;

  water += amount;
  localStorage.setItem("water", water);
  document.getElementById("waterTotal").innerText =
    `Today: ${water} ml`;

  input.value = "";
}
// ===============================
// QUICK WATER BUTTONS
// ===============================
function addQuickWater(amount) {
  water += amount;
  localStorage.setItem("water", water);

  document.getElementById("waterTotal").innerText =
    `Today: ${water} ml`;
}

// ===============================
// ADD EXERCISE
// ===============================
function addExercise() {
  const name = document.getElementById("exerciseName").value;
  const duration = document.getElementById("exerciseDuration").value;
  if (!name || !duration) return;

  exercises.push({ name, duration });
  localStorage.setItem("exercises", JSON.stringify(exercises));

  renderExercises();
  document.getElementById("exerciseName").value = "";
  document.getElementById("exerciseDuration").value = "";
}

// ===============================
// RENDER EXERCISES
// ===============================
function renderExercises() {
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";

  exercises.forEach(e => {
    const li = document.createElement("li");
    li.textContent = `${e.name} — ${e.duration} min`;
    list.appendChild(li);
  });
}

// ===============================
// RENDER HISTORY
// ===============================
function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  if (history.length === 0) {
    list.innerHTML = "<li>No history yet.</li>";
    return;
  }

  history.slice().reverse().forEach(day => {
    const li = document.createElement("li");
    li.textContent =
      `${day.date} — 💧 ${day.water} ml — 🏋️ ${day.exerciseCount} exercises`;
    list.appendChild(li);
  });
}

// ===============================
// CHARTS (FEATURE 3)
// ===============================
function renderCharts() {
  if (history.length === 0) return;

  const labels = history.map(d => d.date);
  const waterData = history.map(d => d.water);
  const exerciseData = history.map(d => d.exerciseCount);

  new Chart(document.getElementById("waterChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Water Intake (ml)",
        data: waterData,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });

  new Chart(document.getElementById("exerciseChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Exercises per Day",
        data: exerciseData
      }]
    }
  });
}


