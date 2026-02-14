// =============================
// Elements (Menu)
// =============================
const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

// =============================
// Elements (Main / Modal)
// =============================
const addScoreButton = document.getElementById("addScoreButton");

const scoreModal = document.getElementById("scoreModal");
const scoreModalOverlay = document.getElementById("scoreModalOverlay");
const scoreModalClose = document.getElementById("scoreModalClose");
const scoreModalCancel = document.getElementById("scoreModalCancel");
const scoreModalOk = document.getElementById("scoreModalOk");

const scoreInputsContainer = document.getElementById("scoreInputs");
const keypadDisplay = document.getElementById("keypadDisplay");

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
let inputDigits = "0";     // 数字部分（符号は別）
let isNegative = false;    // マイナスかどうか

// =============================
// Menu open/close
// =============================
function openMenu() {
  sideMenu.classList.add("open");
  overlay.classList.add("show");
}
function closeMenu() {
  sideMenu.classList.remove("open");
  overlay.classList.remove("show");
}
function toggleMenu() {
  if (sideMenu.classList.contains("open")) closeMenu();
  else openMenu();
}

menuButton.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu();
});

overlay.addEventListener("click", () => {
  closeMenu();
});

sideMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

// =============================
// Screen switching
// =============================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");

  closeMenu();
}

// =============================
// Create Project
// =============================
function createProject() {
  const projectName = document.getElementById("projectNameInput").value.trim();
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

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =============================
// Score modal open/close
// =============================
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

addScoreButton.addEventListener("click", openScoreModal);
scoreModalOverlay.addEventListener("click", closeScoreModal);
scoreModalClose.addEventListener("click", closeScoreModal);
scoreModalCancel.addEventListener("click", closeScoreModal);

// OK：1ラウンド追加
scoreModalOk.addEventListener("click", () => {
  // 全員分取得
  const inputs = scoreInputsContainer.querySelectorAll("input");
  const row = Array.from(inputs).map(i => parseIntSafe(i.value));

  // roundsに追加（加算方式：ラウンド値をそのまま保持）
  currentProject.rounds.push(row);

  // 反映
  renderTable();
  closeScoreModal();
});

// =============================
// Activate input + Keypad
// =============================
function parseIntSafe(v) {
  const n = parseInt(String(v).replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

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

// 入力欄クリックでアクティブ切替
scoreInputsContainer.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.tagName === "INPUT") {
    activateInput(t);
  }
});

// =============================
// Keypad buttons (event delegation)
// =============================
scoreModal.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const key = btn.dataset.key;
  const action = btn.dataset.action;

  if (key) {
    // 数字入力
    if (inputDigits === "0") inputDigits = key;
    else inputDigits += key;

    // 先頭に0が残るのを避ける（例: 0000 になりすぎるのはOKだが、気になるならここで整形）
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
    // 入力確定：次の入力欄へ移動（最後ならOK押す運用）
    if (!activeInput) return;
    const idx = parseInt(activeInput.dataset.index, 10);
    const next = scoreInputsContainer.querySelector(`input[data-index="${idx + 1}"]`);
    if (next) activateInput(next);
    return;
  }
});

function normalizeDigits(d) {
  // "00012" -> "12"（ただし "0" は維持）
  d = d.replace(/^0+(?=\d)/, "");
  if (d === "") return "0";
  return d;
}

// Escでモーダル閉じる（PC確認用）
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // スコアモーダルが開いていたら閉じる
    if (!scoreModal.classList.contains("hidden")) closeScoreModal();
    // サイドメニューが開いていたら閉じる
    closeMenu();
  }
});

// =============================
// Expose for HTML onclick
// =============================
window.showScreen = showScreen;
window.createProject = createProject;
