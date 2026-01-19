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
let exerciseHistory = JSON.parse(localStorage.getItem("exerciseHistory")) || [];
let editingIndex = null;
let waterHistory = JSON.parse(localStorage.getItem("waterHistory")) || [];
let lastDate = localStorage.getItem("lastDate");
let exerciseChart = null;

// ===============================
// DAILY RESET LOGIC
// ===============================
const today = getToday();

if (lastDate && lastDate !== today) {
  saveWaterToHistory();
  if (exercises.length > 0) {
    exerciseHistory.push({
      date: lastDate,
      exercises: [...exercises]
    });

    localStorage.setItem(
      "exerciseHistory",
      JSON.stringify(exerciseHistory)
    );
  }
			
  water = 0;
  exercises = [];


  localStorage.setItem("water", water);
  localStorage.setItem("exercises", JSON.stringify(exercises));
  localStorage.setItem("lastDate", today);
}

// ===============================
// SAVE HISTORY
// ===============================
function saveWaterToHistory() {
  if (water === 0) return;

  waterHistory.push({
    date: lastDate,
    water
  });

  localStorage.setItem("waterHistory", JSON.stringify(waterHistory));
}

// ===============================
// INITIAL UI
// ===============================
document.getElementById("waterTotal").innerText =
  `Today: ${water} ml`;

renderExercises();
renderWaterHistory();
renderExerciseHistory();



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
  const name = document.getElementById("exerciseName").value.trim();
  const weight = Number(document.getElementById("exerciseWeight").value);
  const reps = Number(document.getElementById("exerciseReps").value);
  const time = Number(document.getElementById("exerciseTime").value);

  if (!name) return;

  let exercise;

  // Time-based
  if (time && !weight && !reps) {
    exercise = { name, time, type: "time" };
  }

  // Weighted strength
  else if (weight && reps && !time) {
    exercise = { name, weight, reps, type: "strength" };
  }

  // Reps-only (bodyweight)
  else if (!weight && reps && !time) {
    exercise = { name, reps, type: "reps" };
  }

  else {
    return; // invalid combination
  }

  if (editingIndex !== null) {
    exercises[editingIndex] = exercise;
    editingIndex = null;
    document.querySelector(".action-btn").textContent = "Log";
  } else {
    exercises.push(exercise);
  }


  localStorage.setItem("exercises", JSON.stringify(exercises));
  renderExercises();


  document.getElementById("exerciseName").value = "";
  document.getElementById("exerciseWeight").value = "";
  document.getElementById("exerciseReps").value = "";
  document.getElementById("exerciseTime").value = "";
}

// ===============================
// RENDER EXERCISES
// ===============================
function renderExercises() {
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";

  exercises.forEach((e, index) => {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.style.cursor = "pointer";
    text.onclick = () => showExerciseChart(e.name);

    if (e.type === "time") {
      text.textContent = `${e.name} — ⏱️ ${e.time} min`;
    } 
    else if (e.type === "strength") {
      text.textContent = `${e.name} — 🏋️ ${e.weight} kg × ${e.reps}`;
    }
    else if (e.type === "reps") {
      text.textContent = `${e.name} — 🔁 ${e.reps} reps`;
    }


    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.style.marginLeft = "10px";
    editBtn.style.background = "none";
    editBtn.style.border = "none";
    editBtn.style.cursor = "pointer";

    editBtn.onclick = () => startEditExercise(index);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.style.marginLeft = "6px";
    delBtn.style.background = "none";
    delBtn.style.border = "none";
    delBtn.style.color = "#ff5c5c";
    delBtn.style.cursor = "pointer";

    delBtn.onclick = () => deleteExercise(index);

    li.appendChild(text);
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// ===============================
// EDIT EXERCISES
// ===============================
function startEditExercise(index) {
  const e = exercises[index];
  editingIndex = index;

  document.getElementById("exerciseName").value = e.name;
  document.getElementById("exerciseWeight").value = e.weight || "";
  document.getElementById("exerciseReps").value = e.reps || "";
  document.getElementById("exerciseTime").value = e.time || "";

  document.querySelector(".action-btn").textContent = "Save";
}




// ===============================
// DELETE EXERCISES
// ===============================
function deleteExercise(index) {
  exercises.splice(index, 1);
  localStorage.setItem("exercises", JSON.stringify(exercises));
  renderExercises();
}


// ===============================
// EXERCISE CHART
// ===============================

function showExerciseChart(exerciseName) {
  const labels = [];
  const data = [];
  let chartLabel = "";
  let chartType = "line";

  exerciseHistory.forEach(day => {
    const found = day.exercises.find(e => e.name === exerciseName);
    if (!found) return;

    labels.push(day.date);

    if (found.type === "time") {
      data.push(found.time);
      chartLabel = "Time (min)";
    }
    else if (found.type === "reps") {
      data.push(found.reps);
      chartLabel = "Reps";
    }
    else if (found.type === "strength") {
      data.push(found.weight);
      chartLabel = "Weight (kg)";
    }
  });

  if (data.length === 0) return;

  const ctx = document.getElementById("exerciseProgressChart");

  if (exerciseChart) {
    exerciseChart.destroy();
  }

  exerciseChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: chartLabel,
        data,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });

  document.getElementById("exerciseChartTitle").textContent =
    `📈 ${exerciseName} Progress`;
}


// ===============================
// SUGGESTIONS
// ===============================
function updateExerciseSuggestions(filter = "") {
  const datalist = document.getElementById("exerciseSuggestions");
  datalist.innerHTML = "";

  if (!filter) return;

  const names = new Set();

  // today's exercises
  exercises.forEach(e => names.add(e.name));

  // past exercises
  exerciseHistory.forEach(day => {
    day.exercises.forEach(e => names.add(e.name));
  });

  [...names]
    .filter(name =>
      name.toLowerCase().startsWith(filter.toLowerCase())
    )
    .forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      datalist.appendChild(option);
    });
}

// ===============================
// EXERCISE NAME SUGGESTION LISTENER
// ===============================
document
  .getElementById("exerciseName")
  .addEventListener("input", (e) => {
    updateExerciseSuggestions(e.target.value);
  });





// ===============================
// RENDER HISTORY
// ===============================
function renderWaterHistory() {
  const list = document.getElementById("waterHistoryList");
  list.innerHTML = "";

  if (waterHistory.length === 0) {
    list.innerHTML = "<li>No water history.</li>";
    return;
  }

  waterHistory.slice().reverse().forEach(day => {
    const li = document.createElement("li");
    li.textContent = `${day.date} — 💧 ${day.water} ml`;
    list.appendChild(li);
  });
}

function renderExerciseHistory() {
  const list = document.getElementById("exerciseHistoryList");
  list.innerHTML = "";

  if (exerciseHistory.length === 0) {
    list.innerHTML = "<li>No exercise history.</li>";
    return;
  }

  exerciseHistory.slice().reverse().forEach(day => {
    const li = document.createElement("li");

    const grouped = {};

    day.exercises.forEach(e => {
      if (!grouped[e.name]) {
        grouped[e.name] = 0;
      }
      grouped[e.name]++;
    });

    const summary = Object.entries(grouped)
      .map(([name, count]) => `${name} — ${count} set${count > 1 ? "s" : ""}`)
      .join(", ");

    li.textContent = `${day.date} — ${summary}`;
    list.appendChild(li);
  });
}
