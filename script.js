// =============================
// Elements
// =============================
const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

// =============================
// State
// =============================
let currentProject = {
  name: "",
  members: [],
  rounds: []
};

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

// ☰押下：トグル
menuButton.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu();
});

// overlayをタップ：閉じる（＝メインをタップしたら閉じる）
overlay.addEventListener("click", () => {
  closeMenu();
});

// メニュー内クリックは外に伝播させない（誤って閉じないため）
sideMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Escキーでも閉じる（PC確認用）
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
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

  // 画面切替時はメニューを閉じる
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
  // タイトル反映
  const titleEl = document.getElementById("projectTitle");
  if (titleEl) titleEl.textContent = currentProject.name || "プロジェクト名";

  const table = document.getElementById("scoreTable");
  if (!table) return;

  // --- THEAD ---
  let theadHtml = "<tr><th></th>";
  currentProject.members.forEach(member => {
    theadHtml += `<th>${escapeHtml(member)}</th>`;
  });
  theadHtml += "</tr>";
  table.querySelector("thead").innerHTML = theadHtml;

  // --- TBODY (rounds) ---
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  currentProject.rounds.forEach((row, idx) => {
    let tr = `<tr><td>R${idx + 1}</td>`;
    for (let i = 0; i < currentProject.members.length; i++) {
      const v = row[i] ?? 0;
      tr += `<td>${v}</td>`;
    }
    tr += "</tr>";
    tbody.insertAdjacentHTML("beforeend", tr);
  });

  // --- TFOOT (totals) ---
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

// HTMLエスケープ（名前に記号入っても崩れないように）
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =============================
// Expose to HTML onclick
// =============================
window.showScreen = showScreen;
window.createProject = createProject;
window.renderTable = renderTable;
