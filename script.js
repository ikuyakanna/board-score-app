// =============================
// State
// =============================
let currentProject = {
  name: "",
  members: [],
  rounds: []
};

// テンキー入力状態
let activeInput = null;
let inputDigits = "0";   // 数字部分（符号は別）
let isNegative = false;  // マイナスかどうか

// =============================
// Helpers
// =============================
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseIntSafe(v) {
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDigits(d) {
  // "00012" -> "12"（ただし "0" は維持）
  d = d.replace(/^0+(?=\d)/, "");
  if (d === "") return "0";
  return d;
}

// =============================
// Screen switching (global)
// =============================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");

  // 画面切替時はメニュー閉じる
  closeMenu();
}
window.showScreen = showScreen;

// =============================
// Create Project (global)
// =============================
function createProject() {
  const projectNameInput = document.getElementById("projectNameInput");
  const projectName = (projectNameInput?.value || "").trim();

  if (!projectName) {
    alert("プロジェクト名を入力してください");
    return;
  }

  const inputs = document.querySelectorAll("#memberInputs input");
  const members = Array.from(inputs)
    .map(i => i.value.trim())
    .filter(v => v.length > 0);

  if (members.length === 0) {
    alert("メンバーを1人以上入力してください");
    return;
  }
  if (members.length > 6) {
    alert("メンバーは最大6人です");
    return;
  }

  currentProject = {
    name: projectName,
    members,
    rounds: []
  };

  renderTable();
  showScreen("mainScreen");
}
window.createProject = createProject;

// =============================
// Render table
// =============================
function renderTable() {
  // タイトル
  const titleEl = document.getElementById("projectTitle");
  if (titleEl) titleEl.textContent = currentProject.name || "プロジェクト名";

  const table = document.getElementById("scoreTable");
  if (!table) return;

  // THEAD
  let theadHtml = "<tr><th></th>";
  currentProject.members.forEach(member => {
    theadHtml += `<th>${escapeHtml(member)}</th>`;
  });
  theadHtml += "</tr>";
  table.querySelector("thead").innerHTML = theadHtml;

  // TBODY
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  currentProject.rounds.forEach((row, idx) => {
    let tr = `<tr><td>R${idx + 1}</td>`;
    for (let i = 0; i < currentProject.members.length; i++) {
      const v = Number(row[i] ?? 0);
      tr += `<td>${v}</td>`;
    }
    tr += "</tr>";
    tbody.insertAdjacentHTML("beforeend", tr);
  });

  // TFOOT (totals)
  const totals = Array(currentProject.members.length).fill(0);
  currentProject.rounds.forEach(row => {
    for (let i = 0; i < totals.length; i++) {
      totals[i] += Number(row[i] ?? 0);
    }
  });

  let tfootHtml = "<tr><td>合計</td>";
  totals.forEach(t => {
    tfootHtml += `<td>${t}</td>`;
  });
  tfootHtml += "</tr>";
  table.querySelector("tfoot").innerHTML = tfootHtml;
}

// =============================
// Menu open/close
// =============================
let menuButton, sideMenu, overlay;

function openMenu() {
  sideMenu?.classList.add("open");
  overlay?.classList.add("show");
}

function closeMenu() {
  sideMenu?.classList.remove("open");
  overlay?.classList.remove("show");
}

function toggleMenu() {
  if (sideMenu?.classList.contains("open")) closeMenu();
  else openMenu();
}

// =============================
// Score modal open/close
// =============================
let addScoreButton;
let scoreModal, scoreModalOverlay, scoreModalClose, scoreModalCancel, scoreModalOk;
let scoreInputsContainer, keypadDisplay;

function openScoreModal() {
  if (!currentProject.members || currentProject.members.length === 0) {
    alert("先にプロジェクトを作成してください");
    return;
  }

  // 入力欄生成
  scoreInputsContainer.innerHTML = "";
  currentProject.members.forEach((name, idx) => {
    const row = document.createElement("div");
    row.className = "scoreRow";
    row.innerHTML = `
      <div class="name">${escapeHtml(name)}</div>
      <input type="text" inputmode="none" value="0" data-index="${idx}" />
    `;
    scoreInputsContainer.appendChild(row);
  });

  // 最初の入力欄をアクティブ化
  const firstInput = scoreInputsContainer.querySelector("input");
  if (firstInput) activateInput(firstInput);

  scoreModalOverlay.classList.remove("hidden");
  scoreModal.classList.remove("hidden");
}

function closeScoreModal() {
  scoreModalOverlay.classList.add("hidden");
  scoreModal.classList.add("hidden");
  activeInput = null;
}

// =============================
// Activate input + keypad display
// =============================
function setActiveRowVisual(input) {
  scoreInputsContainer.querySelectorAll(".scoreRow").forEach(r => r.classList.remove("active"));
  const row = input.closest(".scoreRow");
  if (row) row.classList.add("active");
}

function updateKeypadDisplay() {
  const signed = (isNegative ? "-" : "") + inputDigits;
  keypadDisplay.textContent = signed;
}

function applyToActiveInput() {
  if (!activeInput) return;
  const signed = (isNegative ? "-" : "") + inputDigits;
  activeInput.value = signed;
}

function activateInput(input) {
  activeInput = input;
  setActiveRowVisual(input);

  // 現在値をテンキー状態へ反映
  const raw = String(input.value || "0").trim();
  isNegative = raw.startsWith("-");
  inputDigits = raw.replace("-", "");
  if (inputDigits === "" || inputDigits === "0") inputDigits = "0";

  updateKeypadDisplay();
}

// =============================
// DOM Ready: get elements & bind events
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Menu elements
  menuButton = document.getElementById("menuButton");
  sideMenu = document.getElementById("sideMenu");
  overlay = document.getElementById("overlay");

  // Modal elements
  addScoreButton = document.getElementById("addScoreButton");

  scoreModal = document.getElementById("scoreModal");
  scoreModalOverlay = document.getElementById("scoreModalOverlay");
  scoreModalClose = document.getElementById("scoreModalClose");
  scoreModalCancel = document.getElementById("scoreModalCancel");
  scoreModalOk = document.getElementById("scoreModalOk");

  scoreInputsContainer = document.getElementById("scoreInputs");
  keypadDisplay = document.getElementById("keypadDisplay");

  // -------- Menu events --------
  menuButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  overlay?.addEventListener("click", closeMenu);

  sideMenu?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // -------- Score button --------
  if (addScoreButton) {
    addScoreButton.addEventListener("click", openScoreModal);
  } else {
    console.error("addScoreButton が見つかりません。index.html の id='addScoreButton' を確認してください");
  }

  // -------- Modal close --------
  scoreModalOverlay?.addEventListener("click", closeScoreModal);
  scoreModalClose?.addEventListener("click", closeScoreModal);
  scoreModalCancel?.addEventListener("click", closeScoreModal);

  // OK：1ラウンド追加
  scoreModalOk?.addEventListener("click", () => {
    const inputs = scoreInputsContainer.querySelectorAll("input");
    const row = Array.from(inputs).map(i => parseIntSafe(i.value));
    currentProject.rounds.push(row);
    renderTable();
    closeScoreModal();
  });

  // 入力欄クリックでアクティブ切替
  scoreInputsContainer?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.tagName === "INPUT") {
      activateInput(t);
    }
  });

  // Keypad buttons: event delegation on scoreModal
  scoreModal?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const key = btn.dataset.key;
    const action = btn.dataset.action;

    if (key) {
      if (inputDigits === "0") inputDigits = key;
      else inputDigits += key;
      inputDigits = normalizeDigits(inputDigits);

      updateKeypadDisplay();
      applyToActiveInput();
      return;
    }

    if (action === "sign") {
      isNegative = !isNegative;
      updateKeypadDisplay();
      applyToActiveInput();
      return;
    }

    if (action === "back") {
      inputDigits = inputDigits.slice(0, -1);
      if (inputDigits === "") inputDigits = "0";
      updateKeypadDisplay();
      applyToActiveInput();
      return;
    }

    if (action === "clear") {
      inputDigits = "0";
      isNegative = false;
      updateKeypadDisplay();
      applyToActiveInput();
      return;
    }

    if (action === "enter") {
      // 次の入力へ
      if (!activeInput) return;
      const idx = parseInt(activeInput.dataset.index, 10);
      const next = scoreInputsContainer.querySelector(`input[data-index="${idx + 1}"]`);
      if (next) activateInput(next);
      return;
    }
  });

  // Escで閉じる（PC確認用）
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (scoreModal && !scoreModal.classList.contains("hidden")) closeScoreModal();
      closeMenu();
    }
  });
});
