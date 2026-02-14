const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

let currentProject = {
  name: "",
  members: [],
  rounds: []
};


menuButton.addEventListener("click", () => {
  sideMenu.classList.add("open");
  overlay.classList.add("show");
});

overlay.addEventListener("click", () => {
  sideMenu.classList.remove("open");
  overlay.classList.remove("show");
});

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  document.getElementById(id).classList.remove("hidden");

  // メニュー閉じる
  sideMenu.classList.remove("open");
  overlay.classList.remove("show");
}

function createProject() {

  // プロジェクト名取得
  const projectName = document.getElementById("projectNameInput").value.trim();
  if (!projectName) {
    alert("プロジェクト名を入力してください");
    return;
  }

  // メンバー取得
  const inputs = document.querySelectorAll("#memberInputs input");
  let members = [];

  inputs.forEach(input => {
    const name = input.value.trim();
    if (name) members.push(name);
  });

  if (members.length === 0) {
    alert("メンバーを1人以上入力してください");
    return;
  }

  // データ保存
  currentProject.name = projectName;
  currentProject.members = members;
  currentProject.rounds = [];

  // テーブル描画
  renderTable();

  // メイン画面へ
  showScreen("mainScreen");
}


function renderTable() {

  // タイトル変更
  document.getElementById("projectTitle").textContent = currentProject.name;

  const table = document.getElementById("scoreTable");

  // ヘッダー作成
  let thead = "<tr><th></th>";

  currentProject.members.forEach(member => {
    thead += `<th>${member}</th>`;
  });

  thead += "</tr>";

  table.querySelector("thead").innerHTML = thead;

  // 本文（まだラウンドなし）
  table.querySelector("tbody").innerHTML = "";

  // 合計行
  let totals = "<tr><td>合計</td>";

  currentProject.members.forEach(() => {
    totals += "<td>0</td>";
  });

  totals += "</tr>";

  table.querySelector("tfoot").innerHTML = totals;
}

