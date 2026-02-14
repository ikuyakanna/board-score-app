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

let hasSelectedProject = false;

// モーダルのモード（追加/編集）
let modalMode = "add";      // "add" | "edit"
let editingRoundIndex = -1; // edit時の対象行

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

function deleteProjectById(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;

  const ok = confirm(`「${p.name}」を削除します。よろしいですか？`);
  if (!ok) return;

  projects = projects.filter(x => x.id !== id);
  saveAllProjects(projects);
  renderProjectList();

  // 選択中が消えたら未選択に戻す
  if (currentProjectId === id) {
    hasSelectedProject = false;
    currentProjectId = null;
    currentProject = { id: null, name: "", members: [], rounds: [], updatedAt: 0 };

    setMainNoProjectState(true);
    const addBtn = document.getElementById("addScoreButton");
    if (addBtn) addBtn.disabled = true;

    renderTable();
    showScreen("mainScreen");
    openMenu();
  }
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
    li.dataset.id = p.id;

    li.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="display:flex; flex-direction:column; gap:2px; min-width:0;">
          <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${escapeHtml(p.name)}
          </div>
          <div class="muted" style="color:#bbb; font-size:12px;">
            メンバー:${p.members.length} / ラウンド:${p.rounds.length}
          </div>
        </div>
        <button class="iconBtn" data-action="deleteProject" title="削除">🗑</button>
      </div>
    `;

    li.addEventListener("click", () => selectProject(p.id));

    const delBtn = li.querySelector('button[data-action="deleteProject"]');
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteProjectById(p.id);
    });

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
    .filter(v => v.length > 0); // ★空欄は不参加

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
// Render table（合計バーも更新）
// =============================
function renderTable() {
  const titleEl = document.getElementById("projectTitle");
  const table = document.getElementById("scoreTable");

  const totalsSticky = document.getElementById("totalsSticky");
  const totalsTableBody = document.querySelector("#totalsTable tbody");

  if (!table) return;

  // 未選択なら空
  if (!currentProject.members || currentProject.members.length === 0) {
    if (titleEl) titleEl.textContent = "";
    table.querySelector("thead").innerHTML = "";
    table.querySelector("tbody").innerHTML = "";
    table.querySelector("tfoot").innerHTML = "";
    if (totalsSticky) totalsSticky.classList.add("hidden");
    if (totalsTableBody) totalsTableBody.innerHTML = "";
    return;
  }

  if (titleEl) titleEl.textContent = currentProject.name || "";

  // THEAD
  let theadHtml = "<tr><th></th>";
  currentProject.members.forEach(member => {
    theadHtml += `<th>${escapeHtml(member)}</th>`;
  });
  theadHtml += `<th class="colDelete"></th></tr>`;
  table.querySelector("thead").innerHTML = theadHtml;

  // TBODY
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  currentProject.rounds.forEach((row, idx) => {
    let tr = `<tr data-round-index="${idx}" style="cursor:pointer;"><td>R${idx + 1}</td>`;
    for (let i = 0; i < currentProject.members.length; i++) {
      const v = Number(row[i] ?? 0);
      tr += `<td>${v}</td>`;
    }

    tr += `
      <td class="colDelete">
        <button class="tableIconBtn" data-action="deleteRound" title="削除">🗑</button>
      </td>
    `;
    tr += "</tr>";

    tbody.insertAdjacentHTML("beforeend", tr);
  });

  // totals 計算
  const totals = Array(currentProject.members.length).fill(0);
  currentProject.rounds.forEach(row => {
    for (let i = 0; i < totals.length; i++) totals[i] += Number(row[i] ?? 0);
  });

  // TFOOT（Web用）
  let tfootHtml = "<tr><td>合計</td>";
  totals.forEach(t => (tfootHtml += `<td>${t}</td>`));
  tfootHtml += `<td class="colDelete"></td></tr>`;
  table.querySelector("tfoot").innerHTML = tfootHtml;

  // iPad対応：固定合計バー
  if (totalsSticky && totalsTableBody) {
    totalsSticky.classList.remove("hidden");
    let stickyRow = "<tr><td>合計</td>";
    totals.forEach(t => (stickyRow += `<td>${t}</td>`));
    stickyRow += `<td class="colDelete"></td></tr>`;
    totalsTableBody.innerHTML = stickyRow;
  }
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
let scoreInputsContainer, keypadDisplay, scoreModalTitle;

function buildScoreInputs(values) {
  scoreInputsContainer.innerHTML = "";
  currentProject.members.forEach((name, idx) => {
    const row = document.createElement("div");
    row.className = "scoreRow";
    const v = values && Array.isArray(values) ? Number(values[idx] ?? 0) : 0;

    row.innerHTML = `
      <div class="name">${escapeHtml(name)}</div>
      <input type="text" inputmode="none" value="${v}" data-index="${idx}" />
    `;
    scoreInputsContainer.appendChild(row);
  });

  const firstInput = scoreInputsContainer.querySelector("input");
  if (firstInput) activateInput(firstInput);
}

function openScoreModalAdd() {
  if (!hasSelectedProject || !currentProject.members || currentProject.members.length === 0) {
    alert("先にプロジェクトを選択するか新規作成してください");
    return;
  }

  modalMode = "add";
  editingRoundIndex = -1;

  if (scoreModalTitle) scoreModalTitle.textContent = "点数入力（このラウンド）";
  if (scoreModalOk) scoreModalOk.textContent = "OK（1ラウンド追加）";

  buildScoreInputs(null);

  scoreModalOverlay.classList.remove("hidden");
  scoreModal.classList.remove("hidden");
}

function openScoreModalEdit(roundIndex) {
  if (!hasSelectedProject) return;
  if (roundIndex < 0 || roundIndex >= currentProject.rounds.length) return;

  modalMode = "edit";
  editingRoundIndex = roundIndex;

  if (scoreModalTitle) scoreModalTitle.textContent = `ラウンド編集（R${roundIndex + 1}）`;
  if (scoreModalOk) scoreModalOk.textContent = "OK（このラウンドを更新）";

  buildScoreInputs(currentProject.rounds[roundIndex]);

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
  scoreModalTitle = document.getElementById("scoreModalTitle");

  scoreInputsContainer = document.getElementById("scoreInputs");
  keypadDisplay = document.getElementById("keypadDisplay");

  // -------- Menu events --------
  menuButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // 外側タップ：未選択なら閉じないでメッセージ
  overlay?.addEventListener("click", () => {
    if (sideMenu?.classList.contains("open") && !hasSelectedProject) {
      alert("プロジェクトを選択するか新規作成してください");
      return;
    }
    closeMenu();
  });

  sideMenu?.addEventListener("click", (e) => e.stopPropagation());

  // -------- Score button --------
  addScoreButton?.addEventListener("click", openScoreModalAdd);

  // -------- Modal close --------
  scoreModalOverlay?.addEventListener("click", closeScoreModal);
  scoreModalClose?.addEventListener("click", closeScoreModal);
  scoreModalCancel?.addEventListener("click", closeScoreModal);

  // OK：追加 or 編集 → 保存
  scoreModalOk?.addEventListener("click", () => {
    const inputs = scoreInputsContainer.querySelectorAll("input");
    const row = Array.from(inputs).map(i => parseIntSafe(i.value));

    if (modalMode === "add") {
      currentProject.rounds.push(row);
    } else if (modalMode === "edit" && editingRoundIndex >= 0) {
      currentProject.rounds[editingRoundIndex] = row;
    }

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

  // ラウンド行クリック：🗑なら確認→削除、それ以外は編集
  const scoreTable = document.getElementById("scoreTable");
  const scoreTableBody = scoreTable?.querySelector("tbody");

  scoreTableBody?.addEventListener("click", (e) => {
    const tr = e.target.closest("tr");
    if (!tr) return;

    const idx = parseInt(tr.dataset.roundIndex, 10);
    if (!Number.isFinite(idx)) return;

    const btn = e.target.closest('button[data-action="deleteRound"]');
    if (btn) {
      e.stopPropagation();
      const ok = confirm(`R${idx + 1} を削除します。よろしいですか？`);
      if (!ok) return;

      currentProject.rounds.splice(idx, 1);
      currentProject.updatedAt = Date.now();

      renderTable();
      syncCurrentToList();
      return;
    }

    openScoreModalEdit(idx);
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

  // 0件でもメニューは開いたまま
  openMenu();
});
