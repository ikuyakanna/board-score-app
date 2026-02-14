const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

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
