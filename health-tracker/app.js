// Load saved data (or defaults)
let water = Number(localStorage.getItem("water")) || 0;
let exercises = JSON.parse(localStorage.getItem("exercises")) || [];

// Update UI at startup
document.getElementById("waterTotal").innerText =
  `Today: ${water} ml`;

renderExercises();

// Add water
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

// Add exercise
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

// Display exercises
function renderExercises() {
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";

  exercises.forEach(e => {
    const li = document.createElement("li");
    li.textContent = `${e.name} — ${e.duration} min`;
    list.appendChild(li);
  });
}
