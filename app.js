// ===============================
// 1. GLOBAL VARIABLES & PLANNER STATE
// ===============================
let tempDailyPlan = []; 
let savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];

// Weekly Planner Variables
let tempWeeklySchedule = Array(7).fill(null); // Stores plan IDs for Mon-Sun
let selectedDayIndex = null; // Which day box is currently highlighted
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let smartDailyId = null;

// ===============================
// 2. PLANNER LOGIC
// ===============================

// --- DAILY PLANNER FUNCTIONS ---

function addToPlanTemp() {
  const name = document.getElementById("planExName").value.trim();
  const sets = document.getElementById("planExSets").value;
  const time = document.getElementById("planExTime").value;

  if (!name) {
     document.getElementById("planExName").focus();
     return; 
  }

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
    item.type = "reps"; 
    item.display = "reps";
  }

  tempDailyPlan.push(item);
  renderTempPlan();
  
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
    
    const span = document.createElement("span");
    span.textContent = `${item.name} — ${item.display}`;
    
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

  const newPlan = {
    id: Date.now(),
    name: planName,
    type: "daily",
    exercises: [...tempDailyPlan]
  };

  savedPlans.push(newPlan);
  localStorage.setItem("savedPlans", JSON.stringify(savedPlans));

  tempDailyPlan = [];
  document.getElementById("planNameInput").value = "";
  renderTempPlan();
  closePlanCreator();
  renderPlansGrid(); 
}

// --- WEEKLY PLANNER FUNCTIONS ---

function renderWeekGrid() {
  const row1 = document.getElementById("weekRow1");
  const row2 = document.getElementById("weekRow2");
  
  if (!row1 || !row2) return;

  row1.innerHTML = "";
  row2.innerHTML = "";

  dayNames.forEach((day, index) => {
    const box = document.createElement("div");
    
    let classes = "day-box";
    if (selectedDayIndex === index) classes += " selected";
    if (tempWeeklySchedule[index]) classes += " filled";
    
    box.className = classes;
    box.onclick = () => selectDay(index);

    const label = document.createElement("div");
    label.className = "day-label";
    label.textContent = day;

    const subText = document.createElement("div");
    subText.className = "day-plan-name";
    
    if (tempWeeklySchedule[index]) {
      const p = savedPlans.find(pl => pl.id === tempWeeklySchedule[index]);
      subText.textContent = p ? p.name : "Unknown";
    } else {
      subText.textContent = "-";
    }

    box.appendChild(label);
    box.appendChild(subText);

    if (index < 5) row1.appendChild(box);
    else row2.appendChild(box);
  });
}

function renderTray() {
  const tray = document.getElementById("dailyPlanTray");
  tray.innerHTML = "";

  const restBtn = document.createElement("div");
  restBtn.className = "tray-item rest-btn";
  restBtn.textContent = "REST / CLEAR";
  restBtn.onclick = () => assignPlanToDay(null);
  tray.appendChild(restBtn);

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

function selectDay(index) {
  selectedDayIndex = index;
  renderWeekGrid(); 
}

function assignPlanToDay(planId) {
  if (selectedDayIndex === null) {
    alert("Please tap a day box (like Mon) first!");
    return;
  }
  tempWeeklySchedule[selectedDayIndex] = planId;
  renderWeekGrid();
}

function saveWeeklyPlan() {
  const name = document.getElementById("weeklyPlanName").value.trim();
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

  tempWeeklySchedule = Array(7).fill(null);
  selectedDayIndex = null;
  document.getElementById("weeklyPlanName").value = "";
  
  closePlanCreator();
  renderPlansGrid();
}

// ===============================
// PINNING LOGIC
// ===============================

function togglePin(event, planId) {
  event.stopPropagation(); // Stop the click from opening the plan viewer
  
  // 1. Find the plan
  const planToPin = savedPlans.find(p => p.id === planId);
  if (!planToPin) return;

  // 2. Check current state
  const isCurrentlyPinned = planToPin.isPinned || false;
  
  // 3. Unpin EVERYTHING first (Enforce "Only One" rule)
  savedPlans.forEach(p => p.isPinned = false);

  // 4. If it wasn't pinned before, pin it now
  if (!isCurrentlyPinned) {
    planToPin.isPinned = true;
  }

  // 5. Save & Refresh Grid
  localStorage.setItem("savedPlans", JSON.stringify(savedPlans));
  renderPlansGrid();
  
  // 6. TRIGGER THE BANNER UPDATE (This was missing in your file!)
  updateAllBanners();
}

// --- SHARED PLANNER UI ---

function renderPlansGrid() {
  const weeklyGrid = document.getElementById("weeklyPlansGrid");
  const dailyGrid = document.getElementById("dailyPlansGrid");
  
  // Safety check: if elements don't exist yet, stop
  if (!weeklyGrid || !dailyGrid) return;
  
  weeklyGrid.innerHTML = "";
  dailyGrid.innerHTML = "";

  if (savedPlans.length === 0) {
    weeklyGrid.innerHTML = '<p class="empty-msg">No weekly schedules.</p>';
    dailyGrid.innerHTML = '<p class="empty-msg">Tap + to create a plan.</p>';
    return;
  }

  // SORT: Pinned plans always go to the top
  const sortedPlans = [...savedPlans].sort((a, b) => {
    return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
  });

  sortedPlans.forEach(plan => {
    const card = document.createElement("div");
    card.className = "plan-card";
    
    // Add Pinned Class if active
    if (plan.isPinned) card.classList.add("pinned");
    
    // --- WEEKLY PLANS ---
    if (plan.type === 'weekly') {
      // 1. Add Pin Button
      const pinBtn = document.createElement("button");
      pinBtn.className = "pin-btn";
      pinBtn.innerHTML = "📌";
      pinBtn.onclick = (e) => togglePin(e, plan.id);
      card.appendChild(pinBtn);

      // 2. Add Badge if Pinned
      if (plan.isPinned) {
        const badge = document.createElement("div");
        badge.className = "active-badge";
        badge.textContent = "★ Current Focus";
        card.appendChild(badge);
      }

      // 3. Text Content
      const daysCount = plan.schedule.filter(id => id !== null).length;
      const countDiv = document.createElement("div");
      countDiv.className = "plan-count";
      countDiv.textContent = `📅 ${daysCount} Days Planned`;

      const title = document.createElement("div");
      title.className = "plan-title";
      title.textContent = plan.name;

      card.appendChild(title);
      card.appendChild(countDiv);

      // 4. Click Action (Placeholder for Step 2)
      card.onclick = () => openWeeklyViewer(plan.id);
      
      weeklyGrid.appendChild(card);
    } 
    
    // --- DAILY PLANS ---
    else {
      const title = document.createElement("div");
      title.className = "plan-title";
      title.textContent = plan.name;

      const countDiv = document.createElement("div");
      countDiv.className = "plan-count";
      countDiv.textContent = `${plan.exercises.length} Exercises`;

      card.appendChild(title);
      card.appendChild(countDiv);

      // Click Action (Open standard viewer)
      card.onclick = () => openPlanViewer(plan.id);

      dailyGrid.appendChild(card);
    }
  });
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

  if (mode === 'weekly') {
    renderWeekGrid();
    renderTray();
  }
}

// ===============================
// 3. PLAN VIEWER & START LOGIC
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
  if (activePlanId) {
    closePlanViewer();
    openActiveWorkout(activePlanId);
  }
}

// ===============================
// 4. DATE HELPERS
// ===============================
function getToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ===============================
// 5. LOAD SAVED DATA (Legacy)
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
// 6. DAILY RESET LOGIC
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
// 7. SAVE HISTORY
// ===============================
function saveWaterToHistory() {
  if (water === 0) return;
  waterHistory.push({ date: lastDate, water });
  localStorage.setItem("waterHistory", JSON.stringify(waterHistory));
}

// ===============================
// 8. INITIAL UI
// ===============================
document.getElementById("waterTotal").innerText = `Today: ${water} ml`;
document.getElementById("waterGoalInput").value = waterGoal;
updateWaterProgress();

renderExercises();
renderWaterHistory();
renderExerciseHistory();
renderTrendCharts();
renderPlansGrid(); 
updateAllBanners();

// ===============================
// 9. APP LOGIC (Water, Exercises, Charts)
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

    if (e.type === "time") text.textContent = `${e.name} — ⏱️ ${e.time} min`;
    else if (e.type === "strength") text.textContent = `${e.name} — 🏋️ ${e.weight} kg × ${e.reps}`;
    else if (e.type === "reps") text.textContent = `${e.name} — 🔁 ${e.reps} reps`;
    // New types
    else if (e.type === "sets") text.textContent = `${e.name} — 🔢 ${e.sets} sets`;
    else if (e.type === "combined") text.textContent = `${e.name} — 🔢 ${e.sets} sets × ⏱️ ${e.time} min`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.style.marginLeft = "10px";
    editBtn.style.background = "none";
    editBtn.style.border = "none";
    editBtn.style.cursor = "pointer";
    editBtn.onclick = () => startEditExercise(index);

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
// 10. NAVIGATION LOGIC
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
  
  // FIX: Only close if open
  const menu = document.getElementById("sideMenu");
  if (menu.classList.contains("open")) {
    toggleMenu();
  }
}

// ===============================
// ACTIVE WORKOUT LOGIC (GUIDED)
// ===============================
let activeSessionData = []; // Stores the temporary state of every set

function openActiveWorkout(planId) {
  const plan = savedPlans.find(p => p.id === planId);
  if (!plan) return;

  activeSessionData = [];
  const list = document.getElementById("activeWorkoutList");
  list.innerHTML = "";

  // 1. EXPLODE: Convert "3 Sets" into 3 separate Rows
  plan.exercises.forEach(ex => {
    // Determine how many sets to generate
    let count = 1;
    if (ex.type === 'sets' || ex.type === 'combined') {
      count = parseInt(ex.sets) || 1;
    } else if (ex.type === 'strength') {
      // If it's a legacy strength item with reps but no set count, assume 1, 
      // or if you want to support multiple sets for legacy, we default to 1 here.
      count = 1; 
    }

    for (let i = 1; i <= count; i++) {
      // Create a data object for this specific row
      activeSessionData.push({
        id: Date.now() + Math.random(), // Unique ID
        name: ex.name,
        setNum: i,
        targetReps: ex.reps || "", 
        targetTime: ex.time || "",
        targetWeight: ex.weight || "",
        isDone: false,
        // Current Input Values
        valWeight: "",
        valReps: "",
        valTime: ""
      });
    }
  });

  renderActiveWorkout();
  document.getElementById("activeWorkoutModal").classList.add("open");
}

function renderActiveWorkout() {
  const list = document.getElementById("activeWorkoutList");
  list.innerHTML = "";

  activeSessionData.forEach((row, index) => {
    const div = document.createElement("div");
    div.className = `aw-row ${row.isDone ? "completed" : ""}`;
    
    // HTML Structure based on your design
    div.innerHTML = `
      <div>
        <span class="aw-name">${row.name}</span>
      </div>

      <div class="aw-set-label">Set ${row.setNum}</div>

      <div class="aw-inputs">
        ${getInputsHTML(row, index)}
        <button class="aw-done-btn" onclick="toggleActiveSet(${index})">
          ${row.isDone ? "Undo" : "Done"}
        </button>
      </div>
    `;

    list.appendChild(div);
  });
}

// Helper to generate correct inputs based on available targets
function getInputsHTML(row, index) {
  let html = "";
  
  // Show Weight Input?
  // We show it if it's not purely a Time or Reps exercise, or if it has a target weight
  // Defaulting to always showing Weight/Reps unless it is strictly Cardio
  
  // Weight
  html += `<input type="number" class="small-input" placeholder="kg" 
            value="${row.valWeight}" 
            onchange="updateActiveData(${index}, 'valWeight', this.value)" 
            style="width:70px; margin:0;">`;

  // Reps
  html += `<input type="number" class="small-input" placeholder="Reps" 
            value="${row.valReps}" 
            onchange="updateActiveData(${index}, 'valReps', this.value)" 
            style="width:60px; margin:0;">`;

  // Time (Optional - add if needed, or replace reps if it's cardio)
  if (row.targetTime) {
     html += `<input type="number" class="small-input" placeholder="Min" 
            value="${row.valTime}" 
            onchange="updateActiveData(${index}, 'valTime', this.value)" 
            style="width:60px; margin:0;">`;
  }

  return html;
}

function updateActiveData(index, field, value) {
  activeSessionData[index][field] = value;
}

function toggleActiveSet(index) {
  // Toggle State
  activeSessionData[index].isDone = !activeSessionData[index].isDone;
  // Re-render to update classes and button text
  renderActiveWorkout();
}

function finishActiveSession() {
  // Filter only COMPLETED sets
  const completedSets = activeSessionData.filter(row => row.isDone);

  if (completedSets.length === 0) {
    if(!confirm("No sets marked as Done. Close without saving?")) return;
    closeActiveWorkout();
    return;
  }

  // Convert to Main App History Format
  completedSets.forEach(row => {
    let newLog = {
      name: row.name,
      // If user typed input, use it. Otherwise use target. Otherwise 0.
      weight: Number(row.valWeight) || Number(row.targetWeight) || 0,
      reps: Number(row.valReps) || Number(row.targetReps) || 0,
      time: Number(row.valTime) || Number(row.targetTime) || 0,
      type: 'strength' // Simplification: logging everything as strength/hybrid
    };

    // Refine Type
    if (newLog.time > 0 && newLog.weight === 0) newLog.type = 'time';
    else if (newLog.weight === 0 && newLog.reps > 0) newLog.type = 'reps';

    exercises.push(newLog);
  });

  // Save Global State
  localStorage.setItem("exercises", JSON.stringify(exercises));
  
  // Update UI
  renderExercises();
  closeActiveWorkout();
  
  // Jump to Exercises page to see results
  showPage('exercises');
}

function closeActiveWorkout() {
  document.getElementById("activeWorkoutModal").classList.remove("open");
}

// ===============================
// WEEKLY PLAN VIEWER LOGIC
// ===============================
let activeWeeklyPlanId = null;

function openWeeklyViewer(planId) {
  const plan = savedPlans.find(p => p.id === planId);
  if (!plan) return;
  activeWeeklyPlanId = planId;

  document.getElementById("weeklyViewTitle").textContent = plan.name;

  // Render Read-Only Grid
  const row1 = document.getElementById("viewWeekRow1");
  const row2 = document.getElementById("viewWeekRow2");
  row1.innerHTML = ""; 
  row2.innerHTML = "";

  dayNames.forEach((day, index) => {
    const box = document.createElement("div");
    const assignedId = plan.schedule[index];
    let classes = "day-box readonly";
    if (assignedId) classes += " filled";
    
    box.className = classes;

    const label = document.createElement("div");
    label.className = "day-label";
    label.textContent = day;

    const subText = document.createElement("div");
    subText.className = "day-plan-name";
    
    if (assignedId) {
      const p = savedPlans.find(pl => pl.id === assignedId);
      subText.textContent = p ? p.name : "?";
    } else {
      subText.textContent = "-";
    }

    box.appendChild(label);
    box.appendChild(subText);

    if (index < 5) row1.appendChild(box);
    else row2.appendChild(box);
  });

  document.getElementById("weeklyViewerModal").classList.add("open");
}

function closeWeeklyViewer() {
  document.getElementById("weeklyViewerModal").classList.remove("open");
  activeWeeklyPlanId = null;
}

function deleteWeeklyPlan() {
  if (!confirm("Delete this weekly schedule?")) return;
  savedPlans = savedPlans.filter(p => p.id !== activeWeeklyPlanId);
  localStorage.setItem("savedPlans", JSON.stringify(savedPlans));
  
  renderPlansGrid();
  updateAllBanners(); 
  closeWeeklyViewer();
}

// ===============================
// SMART BANNER LOGIC
// ===============================

function updateAllBanners() {
  const banners = [
    document.getElementById("banner-home"),
    document.getElementById("banner-exercises")
  ];

  // 1. Find Pinned Plan
  const pinnedPlan = savedPlans.find(p => p.isPinned && p.type === 'weekly');
  
  if (!pinnedPlan) {
    banners.forEach(b => { if(b) b.style.display = "none"; });
    return;
  }

  // 2. Get Today's Schedule
  const jsDay = new Date().getDay(); 
  const todayIndex = (jsDay + 6) % 7; // Convert Sun(0) -> 6
  const dailyPlanId = pinnedPlan.schedule[todayIndex];

  // 3. Prepare Text
  let dailyText = "Rest Day 💤";
  let showButton = false;
  smartDailyId = null;

  if (dailyPlanId) {
    const dailyPlan = savedPlans.find(p => p.id === dailyPlanId);
    if (dailyPlan) {
      dailyText = `Today: ${dailyPlan.name}`;
      showButton = true;
      smartDailyId = dailyPlanId;
    } else {
      dailyText = "Today: Unknown Plan";
    }
  }

  // 4. Update BOTH banners
  banners.forEach(b => {
    if (!b) return;
    b.style.display = "flex";
    b.querySelector(".banner-title").textContent = pinnedPlan.name;
    b.querySelector(".banner-daily").textContent = dailyText;
    
    const btn = b.querySelector(".banner-start-btn");
    btn.style.display = showButton ? "block" : "none";
  });
}

function startSmartWorkout() {
  if (!smartDailyId) return;
  openActiveWorkout(smartDailyId);
}









