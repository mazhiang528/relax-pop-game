const BUBBLE_TYPES = [
  { name: "粉色", color: "#ff7a9b", wave: "sine", notes: [620, 880] },
  { name: "橙色", color: "#ffbf69", wave: "triangle", notes: [330, 495] },
  { name: "绿色", color: "#71d7c6", wave: "sine", notes: [440, 660] },
  { name: "蓝色", color: "#8e9cff", wave: "square", notes: [260, 390] },
  { name: "紫色", color: "#be8cff", wave: "triangle", notes: [520, 780] },
];
const MODES = {
  relax: { name: "休闲", duration: 60, xp: 1, interval: 950, max: 6 },
  classic: { name: "经典", duration: 45, xp: 1.5, interval: 760, max: 7 },
  challenge: { name: "挑战", duration: 30, xp: 2.5, interval: 520, max: 9 },
};
const STORAGE_KEY = "bubble-station-player-v1";
const $ = (selector) => document.querySelector(selector);
const field = $("#playground"), start = $("#start"), scoreEl = $("#score"), comboEl = $("#combo"), secondsEl = $("#seconds");
const welcome = $("#welcome"), message = $("#message"), levelEl = $("#level"), coinsEl = $("#coins"), currentXpEl = $("#currentXp"), nextXpEl = $("#nextXp"), xpBar = $("#xpBar");
let player = loadPlayer();
let selectedMode = "relax", score = 0, sameColorStreak = 0, lastType = -1, seconds = MODES.relax.duration, running = false;
let timer, maker, audioContext;

function loadPlayer() {
  try { return { level: 1, xp: 0, coins: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; }
  catch { return { level: 1, xp: 0, coins: 0 }; }
}
function savePlayer() { localStorage.setItem(STORAGE_KEY, JSON.stringify(player)); }
function xpNeeded(level) { return 100 + (level - 1) * 75; }
function renderPlayer() {
  const needed = xpNeeded(player.level);
  levelEl.textContent = player.level; coinsEl.textContent = player.coins; currentXpEl.textContent = player.xp; nextXpEl.textContent = needed;
  xpBar.style.width = `${Math.min(100, player.xp / needed * 100)}%`;
  $("#shopCoins").textContent = player.coins;
}

function playPopSound(typeIndex) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
  const type = BUBBLE_TYPES[typeIndex], now = audioContext.currentTime;
  type.notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = type.wave;
    oscillator.frequency.setValueAtTime(frequency, now + index * .035);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.25, now + .13);
    gain.gain.setValueAtTime(index ? .08 : .14, now + index * .035);
    gain.gain.exponentialRampToValueAtTime(.001, now + .16 + index * .035);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + index * .035); oscillator.stop(now + .19 + index * .035);
  });
}

function addBubble() {
  if (!running) return;
  const typeIndex = Math.floor(Math.random() * BUBBLE_TYPES.length), type = BUBBLE_TYPES[typeIndex];
  const bubble = document.createElement("button"), size = 58 + Math.random() * 45;
  bubble.className = "bubble"; bubble.dataset.type = typeIndex; bubble.ariaLabel = `击破${type.name}泡泡`;
  bubble.style.cssText = `left:${8 + Math.random() * 76}%;top:${14 + Math.random() * 66}%;width:${size}px;height:${size}px;background:${type.color}`;
  bubble.innerHTML = "<i></i>"; bubble.onclick = () => pop(bubble); field.appendChild(bubble);
  const all = field.querySelectorAll(".bubble"); if (all.length > MODES[selectedMode].max) all[0].remove();
}
function renderGame() { scoreEl.textContent = score; comboEl.textContent = `${sameColorStreak}×`; secondsEl.textContent = `${seconds}s`; }
function showPoints(bubble, points) {
  const label = document.createElement("span"); label.className = "points"; label.textContent = `+${points}`;
  label.style.left = bubble.style.left; label.style.top = bubble.style.top; field.appendChild(label); setTimeout(() => label.remove(), 650);
}
function pop(bubble) {
  if (!running) return;
  const typeIndex = Number(bubble.dataset.type);
  sameColorStreak = typeIndex === lastType ? sameColorStreak + 1 : 1; lastType = typeIndex;
  const points = 10 * Math.min(sameColorStreak, 5); score += points;
  playPopSound(typeIndex); showPoints(bubble, points); bubble.remove(); renderGame(); setTimeout(addBubble, 160);
}

function grantExperience(amount) {
  player.xp += amount;
  let totalReward = 0;
  while (player.xp >= xpNeeded(player.level)) {
    player.xp -= xpNeeded(player.level); player.level += 1;
    const reward = 50 + player.level * 25; player.coins += reward; totalReward += reward;
  }
  savePlayer(); renderPlayer();
  if (totalReward) {
    $("#rewardLevel").textContent = player.level; $("#rewardCoins").textContent = totalReward; $("#rewardModal").hidden = false;
  }
}
function finish() {
  running = false; clearInterval(timer); clearInterval(maker); field.querySelectorAll(".bubble").forEach((bubble) => bubble.remove());
  const earnedXp = Math.max(5, Math.round(score / 10 * MODES[selectedMode].xp));
  grantExperience(earnedXp);
  message.textContent = `${MODES[selectedMode].name}模式得分 ${score}，获得 ${earnedXp} XP。`;
  welcome.style.display = "grid"; start.textContent = "再玩一局"; $("#modeSection").classList.remove("locked");
}
function begin() {
  clearInterval(timer); clearInterval(maker); field.querySelectorAll(".bubble,.points").forEach((item) => item.remove());
  score = 0; sameColorStreak = 0; lastType = -1; seconds = MODES[selectedMode].duration; running = true;
  welcome.style.display = "none"; renderGame(); $("#modeSection").classList.add("locked");
  for (let i = 0; i < 4; i += 1) addBubble(); maker = setInterval(addBubble, MODES[selectedMode].interval);
  timer = setInterval(() => { seconds -= 1; renderGame(); if (seconds <= 0) finish(); }, 1000);
}

document.querySelectorAll(".mode").forEach((button) => button.addEventListener("click", () => {
  if (running) return;
  selectedMode = button.dataset.mode; document.querySelectorAll(".mode").forEach((item) => item.classList.toggle("active", item === button));
  seconds = MODES[selectedMode].duration; message.textContent = `${MODES[selectedMode].name}模式，经验 ×${MODES[selectedMode].xp}`; renderGame();
}));
$("#shopButton").addEventListener("click", () => { renderPlayer(); $("#shopModal").hidden = false; });
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => { $(`#${button.dataset.close}`).hidden = true; }));
start.addEventListener("click", begin);
renderPlayer(); renderGame();
