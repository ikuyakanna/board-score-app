// =============================
// LocalStorage
// =============================
const LS_KEY = "scoreAppProjects_v1";

function loadAllProjects() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAllProjects(projects) {
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

function uid() {
  return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

// =============================
// State
// =============================
let projects = [];          // {id,name,members,rounds,updatedAt}
let currentProjectId = null;

let currentProject = {
  id: null,
  name: "",
  members: [],
  rounds: [],
  updatedAt: 0
};

// 初期は「未選択」スタート
let hasSelectedProject = false;

// テンキー入力状態
let activeInput = null;
let inputDigits = "0";
let isNegative = false;

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
  d = d.replace(/^0+(?=\d)/, "");
  if (d === "") return "0";
  return d;
}

function setMainNoProjectState(on) {
  const main = document.getElementById("mainScreen");
  if (!main) return;
  if (on) main.classList.add("noProject");
  else main.classList.remove("noProject");
}

// =============================
// Screen switching (global)
// =============================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
  closeMenu();
}
window.showScreen = showScreen;

// =============================
// Project persistence + UI
// =============================
function syncCurrentToList() {
  if (!currentProject.id) return;

  const idx = projects.findIndex(p => p.id === currentProject.id);
  if (idx >= 0) projects[idx] = structuredClone(currentProject);
  else projects.unshift(structuredClone(currentProject));

  projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  saveAllProjects(projects);
  renderProjectList();
}

function selectProject(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;

  currentProjectId = id;
  currentProject = structuredClone(p);

  hasSelectedProject = true;
  setMainNoProjectState(false);

  const addBtn = document.getElementById("addScoreButton");
  if (addBtn) addBtn.disabled = false;

  renderTable();
  showScreen("mainScreen");
  closeMenu();
}

function renderProjectList() {
  const ul = document.getElementById("projectList");
  if (!ul) return;

  ul.innerHTML = "";

  if (projects.length === 0) {
    ul.innerHTML = `<li class="muted">（まだ履歴はありません）</li>`;
    return;
  }

  projects.forEach(p => {
    const li = document.createElement("li");
    li.style.cursor = "pointer";
    li.dataset.id = p.id;

    li.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:2px;">
        <div style="font-weight:700;">${escapeHtml(p.name)}</div>
        <div class="muted" style="color:#bbb; font-size:12px;">
          メンバー:${p.members.length} / ラウンド:${p.rounds.length}
        </div>
      </div>
    `;

    li.addEventListener("click", () => selectProject(p.id));
    ul.appendChild(li);
  });
}

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

  const id = uid();
  currentProjectId = id;
  currentProject = {
    id,
    name: projectName,
    members,
    rounds: [],
    updatedAt: Date.now()
  };

  // 入力欄クリア（任意）
  if (projectNameInput) projectNameInput.value = "";
  inputs.forEach(i => (i.value = ""));

  // ★新規作成＝選択済み
  hasSelectedProject = true;
  setMainNoProjectState(false);

  const addBtn = document.getElementById("addScoreButton");
  if (addBtn) addBtn.disabled = false;

  syncCurrentToList();
  renderTable();
  showScreen("mainScreen");
}
window.createProject = createProject;

// =============================
// Render table
// =============================
function renderTable() {
  const titleEl = document.getElementById("projectTitle");
  const table = document.getElementById("scoreTable");
  if (!table) return;

  // 未選択（membersなし）なら何も描かない
  if (!currentProject.members || currentProject.members.length === 0) {
    if (titleEl) titleEl.textContent = "";
    table.querySelector("thead").innerHTML = "";
    table.querySelector("tbody").innerHTML = "";
    table.querySelector("tfoot").innerHTML = "";
    return;
  }

  if (titleEl) titleEl.textContent = currentProject.name || "プロジェクト名";

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
  if (!hasSelectedProject || !currentProject.members || currentProject.members.length === 0) {
    alert("先にプロジェクトを選択するか新規作成してください");
    return;
  }

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

  const raw = String(input.value || "0").trim();
  isNegative = raw.startsWith("-");
  inputDigits = raw.replace("-", "");
  if (inputDigits === "" || inputDigits === "0") inputDigits = "0";

  updateKeypadDisplay();
}

// =============================
// DOM Ready
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Menu
  menuButton = document.getElementById("menuButton");
  sideMenu = document.getElementById("sideMenu");
  overlay = document.getElementById("overlay");

  // Modal
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

  // 外側タップ
  overlay?.addEventListener("click", () => {
    if (sideMenu?.classList.contains("open") && !hasSelectedProject) {
      alert("プロジェクトを選択するか新規作成してください");
      return;
    }
    closeMenu();
  });

  sideMenu?.addEventListener("click", (e) => e.stopPropagation());

  // -------- Score button --------
  addScoreButton?.addEventListener("click", openScoreModal);

  // -------- Modal close --------
  scoreModalOverlay?.addEventListener("click", closeScoreModal);
  scoreModalClose?.addEventListener("click", closeScoreModal);
  scoreModalCancel?.addEventListener("click", closeScoreModal);

  // OK：1ラウンド追加 → 保存
  scoreModalOk?.addEventListener("click", () => {
    const inputs = scoreInputsContainer.querySelectorAll("input");
    const row = Array.from(inputs).map(i => parseIntSafe(i.value));
    currentProject.rounds.push(row);
    currentProject.updatedAt = Date.now();

    renderTable();
    syncCurrentToList();
    closeScoreModal();
  });

  // 入力欄クリックでアクティブ切替
  scoreInputsContainer?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.tagName === "INPUT") activateInput(t);
  });

  // Keypad buttons
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
      if (!activeInput) return;
      const idx = parseInt(activeInput.dataset.index, 10);
      const next = scoreInputsContainer.querySelector(`input[data-index="${idx + 1}"]`);
      if (next) activateInput(next);
      return;
    }
  });

  // Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (scoreModal && !scoreModal.classList.contains("hidden")) closeScoreModal();
      closeMenu();
    }
  });

  // -------- 初期ロード（未選択スタート）--------
  projects = loadAllProjects();
  renderProjectList();

  hasSelectedProject = false;
  currentProjectId = null;
  currentProject = { id: null, name: "", members: [], rounds: [], updatedAt: 0 };

  setMainNoProjectState(true);
  renderTable();
  showScreen("mainScreen");

  const addBtn = document.getElementById("addScoreButton");
  if (addBtn) addBtn.disabled = true;

  // ★0件でもメニューは開いたまま
  openMenu();
});
