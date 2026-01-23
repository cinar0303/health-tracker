// ===============================
// 1. GLOBAL VARIABLES & PLANNER STATE
// ===============================
let tempDailyPlan = []; 
let savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];

// ===============================
// 2. PLANNER LOGIC (Must be at the top)
// ===============================
function addToPlanTemp() {
  const name = document.getElementById("planExName").value.trim();
  const sets = document.getElementById("planExSets").value;
  const time = document.getElementById("planExTime").value;

  // Silent Fail Check: If name is empty, focus the box and do nothing
  if (!name) {
     document.getElementById("planExName").focus();
     return; 
  }

  // Create the object based on what was entered
  let item = { name };

  if (sets && time) {
    item.type = "combined";
    item.sets = sets;
    item.time = time;
    item.display = `${sets} sets × ${time} min`;
  } else if (sets) {
    item.type = "sets";
    item.sets = sets;
    item.display = `${sets} sets`;
  } else if (time) {
    item.type = "time";
    item.time = time;
    item.display = `${time} min`;
  } else {
    // If neither sets nor time, just save the name
    item.type = "reps"; 
    item.display = "reps";
  }

  tempDailyPlan.push(item);
  renderTempPlan();
  
  // Clear inputs
  document.getElementById("planExName").value = "";
  document.getElementById("planExSets").value = "";
  document.getElementById("planExTime").value = "";
  document.getElementById("planExName").focus();
}

function renderTempPlan() {
  const list = document.getElementById("tempPlanList");
  list.innerHTML = "";

  tempDailyPlan.forEach((item, index) => {
    const li = document.createElement("li");
    li.style.marginBottom = "8px";
    
    // Text
    const span = document.createElement("span");
    span.textContent = `${item.name} — ${item.display}`;
    
    // Delete Button (Small x)
    const delBtn = document.createElement("button");
    delBtn.textContent = "×";
    delBtn.style.background = "none";
    delBtn.style.border = "none";
    delBtn.style.color = "#ff5c5c";
    delBtn.style.fontSize = "18px";
    delBtn.style.cursor = "pointer";
    delBtn.onclick = () => {
      tempDailyPlan.splice(index, 1);
      renderTempPlan();
    };

    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function saveDailyPlan() {
  const planName = document.getElementById("planNameInput").value.trim();
  
  if (!planName) {
    alert("Please name your plan (e.g., 'Push Day')");
    return;
  }
  if (tempDailyPlan.length === 0) {
    alert("Add at least one exercise.");
    return;
  }

  // Create the Plan Object
  const newPlan = {
    id: Date.now(),
    name: planName,
    type: "daily",
    exercises: [...tempDailyPlan]
  };

  savedPlans.push(newPlan);
  localStorage.setItem("savedPlans", JSON.stringify(savedPlans));

  // Reset & Close
  tempDailyPlan = [];
  document.getElementById("planNameInput").value = "";
  renderTempPlan();
  closePlanCreator();
  
  // Refresh the Dashboard
  renderPlansGrid(); 
}

function renderPlansGrid() {
  const grid = document.getElementById("plansGrid");
  if (!grid) return;
  
  grid.innerHTML = "";

  if (savedPlans.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No plans yet.<br>Tap + to create one.</p>';
    return;
  }

  savedPlans.forEach(plan => {
    const card = document.createElement("div");
    card.className = "plan-card";
    // We will make this open the plan later
    card.onclick = () => openPlanViewer(plan.id);
    
    const title = document.createElement("div");
    title.className = "plan-title";
    title.textContent = plan.name;

    const count = document.createElement("div");
    count.className = "plan-count";
    count.textContent = `${plan.exercises.length} Exercises`;

    card.appendChild(title);
    card.appendChild(count);
    grid.appendChild(card);
  });
}

// ===============================
// PLAN VIEWER & START LOGIC
// ===============================
let activePlanId = null;

function openPlanViewer(planId) {
  const plan = savedPlans.find(p => p.id === planId);
  if (!plan) return;

  activePlanId = planId;
  document.getElementById("viewPlanTitle").textContent = plan.name;
  
  const list = document.getElementById("viewPlanList");
  list.innerHTML = "";

  plan.exercises.forEach(item => {
    const li = document.createElement("li");
    li.style.padding = "8px 0";
    li.style.borderBottom = "1px solid #333";
    li.style.color = "#ccc";
    li.textContent = `${item.name} — ${item.display}`;
    list.appendChild(li);
  });

  document.getElementById("planViewerModal").classList.add("open");
}

function closePlanViewer() {
  document.getElementById("planViewerModal").classList.remove("open");
  activePlanId = null;
}

function deletePlan() {
  if (!confirm("Delete this plan?")) return;
  
  savedPlans = savedPlans.filter(p => p.id !== activePlanId);
  localStorage.setItem("savedPlans", JSON.stringify(savedPlans));
  
  renderPlansGrid();
  closePlanViewer();
}

function startWorkout() {
  const plan = savedPlans.find(p => p.id === activePlanId);
  if (!plan) return;

  // Copy plan exercises into today's log
  // We clone them using {...e} so modifying today's log doesn't change the plan
  const newExercises = plan.exercises.map(e => ({...e}));
  
  exercises = [...exercises, ...newExercises];
  localStorage.setItem("exercises", JSON.stringify(exercises));
  
  // Update UI and Switch Page
  renderExercises();
  closePlanViewer();
  showPage('exercises');
}

function openPlanCreator() {
  document.getElementById("planCreatorModal").classList.add("open");
}

function closePlanCreator() {
  document.getElementById("planCreatorModal").classList.remove("open");
}

function switchPlanTab(mode) {
  document.getElementById("tabDaily").classList.toggle("active", mode === 'daily');
  document.getElementById("tabWeekly").classList.toggle("active", mode === 'weekly');
  document.getElementById("creator-daily").style.display = (mode === 'daily') ? "block" : "none";
  document.getElementById("creator-weekly").style.display = (mode === 'weekly') ? "block" : "none";

  // NEW: Initialize the Weekly View if selected
  if (mode === 'weekly') {
    renderWeekGrid();
    renderTray();
  }
}

// ===============================
// WEEKLY PLANNER LOGIC
// ===============================

let tempWeeklySchedule = Array(7).fill(null); // Stores plan IDs for Mon-Sun
let selectedDayIndex = null; // Which day box is currently highlighted (0-6)
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 1. Render the 7-Day Grid
function renderWeekGrid() {
  const row1 = document.getElementById("weekRow1");
  const row2 = document.getElementById("weekRow2");
  
  if (!row1 || !row2) return;

  row1.innerHTML = "";
  row2.innerHTML = "";

  dayNames.forEach((day, index) => {
    const box = document.createElement("div");
    
    // Base Classes
    let classes = "day-box";
    if (selectedDayIndex === index) classes += " selected";
    if (tempWeeklySchedule[index]) classes += " filled";
    
    box.className = classes;
    box.onclick = () => selectDay(index);

    // Content: Day Name + Assigned Plan Name
    const label = document.createElement("div");
    label.className = "day-label";
    label.textContent = day;

    const subText = document.createElement("div");
    subText.className = "day-plan-name";
    
    if (tempWeeklySchedule[index]) {
      // Find the plan name from ID
      const p = savedPlans.find(pl => pl.id === tempWeeklySchedule[index]);
      subText.textContent = p ? p.name : "Unknown";
    } else {
      subText.textContent = "-";
    }

    box.appendChild(label);
    box.appendChild(subText);

    // Add to Row 1 (first 5) or Row 2 (last 2)
    if (index < 5) row1.appendChild(box);
    else row2.appendChild(box);
  });
}

// 2. Render the Sliding Tray
function renderTray() {
  const tray = document.getElementById("dailyPlanTray");
  tray.innerHTML = "";

  // A. Add "Rest / Clear" Option
  const restBtn = document.createElement("div");
  restBtn.className = "tray-item rest-btn";
  restBtn.textContent = "REST / CLEAR";
  restBtn.onclick = () => assignPlanToDay(null); // Assign null to clear
  tray.appendChild(restBtn);

  // B. Add Saved Daily Plans
  const dailyPlans = savedPlans.filter(p => p.type === 'daily');

  if (dailyPlans.length === 0) {
    const msg = document.createElement("div");
    msg.style.color = "#666";
    msg.style.fontSize = "12px";
    msg.style.padding = "20px";
    msg.textContent = "Create Daily Plans first!";
    tray.appendChild(msg);
    return;
  }

  dailyPlans.forEach(plan => {
    const item = document.createElement("div");
    item.className = "tray-item";
    item.textContent = plan.name;
    item.onclick = () => assignPlanToDay(plan.id);
    tray.appendChild(item);
  });
}

// 3. User Interaction
function selectDay(index) {
  selectedDayIndex = index;
  renderWeekGrid(); // Re-render to show selection border
}

function assignPlanToDay(planId) {
  if (selectedDayIndex === null) {
    alert("Please tap a day box (like Mon) first!");
    return;
  }
  tempWeeklySchedule[selectedDayIndex] = planId;
  renderWeekGrid(); // Re-render to show blue fill
}

// 4. Save the Weekly Schedule
function saveWeeklyPlan() {
  const name = document.getElementById("weeklyPlanName").value.trim();
  
  // Check if at least one day is assigned
  const hasContent = tempWeeklySchedule.some(id => id !== null);

  if (!name) {
    alert("Please name your weekly schedule.");
    return;
  }
  if (!hasContent) {
    alert("Please assign at least one workout to a day.");
    return;
  }

  const newWeeklyPlan = {
    id: Date.now(),
    name: name,
    type: "weekly",
    schedule: [...tempWeeklySchedule]
  };

  savedPlans.push(newWeeklyPlan);
  localStorage.setItem("savedPlans", JSON.stringify(savedPlans));

  // Reset
  tempWeeklySchedule = Array(7).fill(null);
  selectedDayIndex = null;
  document.getElementById("weeklyPlanName").value = "";
  
  closePlanCreator();
  renderPlansGrid();
}


// ===============================
// 3. DATE HELPERS
// ===============================
function getToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ===============================
// 4. LOAD SAVED DATA (Legacy)
// ===============================
let water = Number(localStorage.getItem("water")) || 0;
let exercises = JSON.parse(localStorage.getItem("exercises")) || [];
let exerciseHistory = JSON.parse(localStorage.getItem("exerciseHistory")) || [];
let editingIndex = null;
let waterHistory = JSON.parse(localStorage.getItem("waterHistory")) || [];
let lastDate = localStorage.getItem("lastDate");
let exerciseChart = null;
let waterGoal = Number(localStorage.getItem("waterGoal")) || 2500;

// ===============================
// 5. DAILY RESET LOGIC
// ===============================
const today = getToday();

if (lastDate && lastDate !== today) {
  saveWaterToHistory();
  if (exercises.length > 0) {
    exerciseHistory.push({
      date: lastDate,
      exercises: [...exercises]
    });
    localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));
  }
  water = 0;
  exercises = [];
  localStorage.setItem("water", water);
  localStorage.setItem("exercises", JSON.stringify(exercises));
  localStorage.setItem("lastDate", today);
}

// ===============================
// 6. SAVE HISTORY
// ===============================
function saveWaterToHistory() {
  if (water === 0) return;
  waterHistory.push({ date: lastDate, water });
  localStorage.setItem("waterHistory", JSON.stringify(waterHistory));
}

// ===============================
// 7. INITIAL UI
// ===============================
document.getElementById("waterTotal").innerText = `Today: ${water} ml`;
document.getElementById("waterGoalInput").value = waterGoal;
updateWaterProgress();

renderExercises();
renderWaterHistory();
renderExerciseHistory();
renderTrendCharts();
renderPlansGrid(); // <--- This will now work because savedPlans is defined above!

// ===============================
// 8. APP LOGIC (Water, Exercises, Charts)
// ===============================
function addWater() {
  const input = document.getElementById("waterInput");
  const amount = Number(input.value);
  if (amount <= 0) return;
  water += amount;
  localStorage.setItem("water", water);
  document.getElementById("waterTotal").innerText = `Today: ${water} ml`;
  input.value = "";
  updateWaterProgress();
}

function addQuickWater(amount) {
  water += amount;
  localStorage.setItem("water", water);
  document.getElementById("waterTotal").innerText = `Today: ${water} ml`;
  updateWaterProgress();
}

function updateWaterProgress() {
  const percent = Math.min((water / waterGoal) * 100, 100);
  document.getElementById("waterProgressFill").style.width = `${percent}%`;
  document.getElementById("waterProgressText").innerText = `${water} / ${waterGoal} ml`;
}

function addExercise() {
  const name = document.getElementById("exerciseName").value.trim();
  const weight = Number(document.getElementById("exerciseWeight").value);
  const reps = Number(document.getElementById("exerciseReps").value);
  const time = Number(document.getElementById("exerciseTime").value);

  if (!name) return;

  let exercise;
  if (time && !weight && !reps) {
    exercise = { name, time, type: "time" };
  } else if (weight && reps && !time) {
    exercise = { name, weight, reps, type: "strength" };
  } else if (!weight && reps && !time) {
    exercise = { name, reps, type: "reps" };
  } else {
    return;
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

function renderExercises() {
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";

  exercises.forEach((e, index) => {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.style.cursor = "pointer";
    text.onclick = () => showExerciseChart(e.name);

    // LOGIC TO DISPLAY ALL TYPES (Including new Planner types)
    if (e.type === "time") {
      text.textContent = `${e.name} — ⏱️ ${e.time} min`;
    } 
    else if (e.type === "strength") {
      text.textContent = `${e.name} — 🏋️ ${e.weight} kg × ${e.reps}`;
    }
    else if (e.type === "reps") {
      text.textContent = `${e.name} — 🔁 ${e.reps} reps`;
    }
    // New types from Planner
    else if (e.type === "sets") {
      text.textContent = `${e.name} — 🔢 ${e.sets} sets`;
    }
    else if (e.type === "combined") {
      text.textContent = `${e.name} — 🔢 ${e.sets} sets × ⏱️ ${e.time} min`;
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


function startEditExercise(index) {
  const e = exercises[index];
  editingIndex = index;
  document.getElementById("exerciseName").value = e.name;
  document.getElementById("exerciseWeight").value = e.weight || "";
  document.getElementById("exerciseReps").value = e.reps || "";
  document.getElementById("exerciseTime").value = e.time || "";
  document.querySelector(".action-btn").textContent = "Save";
}

function deleteExercise(index) {
  exercises.splice(index, 1);
  localStorage.setItem("exercises", JSON.stringify(exercises));
  renderExercises();
}

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
    } else if (found.type === "reps") {
      data.push(found.reps);
      chartLabel = "Reps";
    } else if (found.type === "strength") {
      data.push(found.weight);
      chartLabel = "Weight (kg)";
    }
  });

  if (data.length === 0) return;

  const ctx = document.getElementById("exerciseProgressChart");
  if (exerciseChart) exerciseChart.destroy();

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
  document.getElementById("exerciseChartTitle").textContent = `📈 ${exerciseName} Progress`;
}

function updateExerciseSuggestions(filter = "") {
  const datalist = document.getElementById("exerciseSuggestions");
  datalist.innerHTML = "";
  if (!filter) return;
  const names = new Set();
  exercises.forEach(e => names.add(e.name));
  exerciseHistory.forEach(day => {
    day.exercises.forEach(e => names.add(e.name));
  });
  [...names]
    .filter(name => name.toLowerCase().startsWith(filter.toLowerCase()))
    .forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      datalist.appendChild(option);
    });
}

document.getElementById("exerciseName").addEventListener("input", (e) => {
  updateExerciseSuggestions(e.target.value);
});

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
    const wrapper = document.createElement("li");
    const header = document.createElement("div");
    header.className = "exercise-history-header";
    header.style.fontWeight = "600";
    const details = document.createElement("ul");
    details.className = "exercise-details";
    details.style.marginTop = "8px";
    details.style.paddingLeft = "14px";
    details.style.fontSize = "14px";
    const grouped = {};
    day.exercises.forEach(e => {
      if (!grouped[e.name]) grouped[e.name] = [];
      grouped[e.name].push(e);
    });
    header.textContent = `${day.date} — ` + Object.entries(grouped)
      .map(([name, sets]) => `${name} — ${sets.length} set${sets.length > 1 ? "s" : ""}`)
      .join(", ");
    Object.entries(grouped).forEach(([name, sets]) => {
      sets.forEach((e, i) => {
        const li = document.createElement("li");
        const nameSpan = document.createElement("span");
        nameSpan.textContent = name;
        nameSpan.style.fontWeight = "500";
        nameSpan.style.cursor = "pointer";
        nameSpan.style.textDecoration = "underline";
        nameSpan.onclick = () => showExerciseChart(name);
        const restSpan = document.createElement("span");
        if (e.type === "strength") restSpan.textContent = ` • Set ${i + 1}: ${e.weight} kg × ${e.reps}`;
        else if (e.type === "reps") restSpan.textContent = ` • Set ${i + 1}: ${e.reps} reps`;
        else if (e.type === "time") restSpan.textContent = ` • Set ${i + 1}: ${e.time} min`;
        li.appendChild(nameSpan);
        li.appendChild(restSpan);
        details.appendChild(li);
      });
    });
    header.onclick = () => {
      const allDetails = document.querySelectorAll(".exercise-details");
      const allHeaders = document.querySelectorAll(".exercise-history-header");
      const isOpen = details.classList.contains("open");
      allDetails.forEach(d => d.classList.remove("open"));
      allHeaders.forEach(h => h.classList.remove("open"));
      if (!isOpen) {
        details.classList.add("open");
        header.classList.add("open");
      }
    };
    wrapper.appendChild(header);
    wrapper.appendChild(details);
    list.appendChild(wrapper);
  });
}

document.getElementById("waterGoalInput").addEventListener("change", (e) => {
  const value = Number(e.target.value);
  if (value > 0) {
    waterGoal = value;
    localStorage.setItem("waterGoal", waterGoal);
    updateWaterProgress();
  }
});

function renderTrendCharts() {
  const waterCtx = document.getElementById("waterTrendChart");
  if (waterCtx && waterHistory.length > 0) {
    new Chart(waterCtx, {
      type: "line",
      data: {
        labels: waterHistory.map(d => d.date),
        datasets: [{
          label: "Daily Water (ml)",
          data: waterHistory.map(d => d.water),
          borderColor: "#0a84ff",
          backgroundColor: "rgba(10, 132, 255, 0.1)",
          fill: true,
          tension: 0.3
        }]
      }
    });
  }
  const activityCtx = document.getElementById("activityTrendChart");
  if (activityCtx && exerciseHistory.length > 0) {
    new Chart(activityCtx, {
      type: "bar",
      data: {
        labels: exerciseHistory.map(d => d.date),
        datasets: [{
          label: "Sets Completed",
          data: exerciseHistory.map(d => d.exercises.length),
          backgroundColor: "#34c759",
          borderRadius: 4
        }]
      }
    });
  }
}

// ===============================
// 9. NAVIGATION LOGIC
// ===============================
function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");
  menu.classList.toggle("open");
  overlay.classList.toggle("open");
}

function showPage(pageId) {
  document.getElementById("page-home").style.display = "none";
  document.getElementById("page-exercises").style.display = "none";
  document.getElementById("page-planner").style.display = "none";
  document.getElementById(`page-${pageId}`).style.display = "block";
  const titles = { home: "Water Tracker", exercises: "Exercise Tracker", planner: "Workout Planner" };
  document.getElementById("pageTitle").innerText = titles[pageId] || "Health Tracker";
  if (pageId === 'home') {
    const chart = Chart.getChart("waterTrendChart");
    if (chart) chart.resize();
  } else if (pageId === 'exercises') {
    const chart = Chart.getChart("activityTrendChart");
    if (chart) chart.resize();
  }
  // Only close the menu if it is actually open
  const menu = document.getElementById("sideMenu");
  if (menu.classList.contains("open")) {
    toggleMenu();
  }
}
