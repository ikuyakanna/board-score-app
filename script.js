let players = [];
let currentPlayerId = null;
let currentInput = "0";

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (!name) return;

  players.push({
    id: Date.now(),
    name: name,
    score: 0,
    history: []
  });

  input.value = "";
  render();
}

function render() {
  const list = document.getElementById("playerList");
  list.innerHTML = "";

  players.forEach(player => {
    const div = document.createElement("div");
    div.className = "player";
    div.onclick = () => openKeypad(player.id);

    div.innerHTML = `
      <span>${player.name}</span>
      <span class="score">${player.score}</span>
    `;

    list.appendChild(div);
  });
}

function openKeypad(id) {
  currentPlayerId = id;
  currentInput = "0";
  updateDisplay();
  document.getElementById("keypad").classList.remove("hidden");
}

function pressKey(num) {
  if (currentInput === "0") {
    currentInput = num.toString();
  } else {
    currentInput += num.toString();
  }
  updateDisplay();
}

function pressDoubleZero() {
  currentInput += "00";
  updateDisplay();
}

function pressTripleZero() {
  currentInput += "000";
  updateDisplay();
}

function clearInput() {
  currentInput = "0";
  updateDisplay();
}

function updateDisplay() {
  document.getElementById("keypadDisplay").textContent = currentInput;
}

function confirmInput() {
  const value = parseInt(currentInput);

  players = players.map(player => {
    if (player.id === currentPlayerId) {
      return {
        ...player,
        score: player.score + value,
        history: [...player.history, value]
      };
    }
    return player;
  });

  document.getElementById("keypad").classList.add("hidden");
  render();
  renderHistory();
}

function renderHistory() {
  const player = players.find(p => p.id === currentPlayerId);
  if (!player) return;

  document.getElementById("historyTitle").textContent =
    player.name + " の履歴";

  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";

  player.history.slice().reverse().forEach(value => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent = "+" + value;
    historyList.appendChild(div);
  });
}
