const BUBBLE_TYPES = [
  { name: "粉色", color: "#ff7a9b", wave: "sine", notes: [620, 880] },
  { name: "橙色", color: "#ffbf69", wave: "triangle", notes: [330, 495] },
  { name: "绿色", color: "#71d7c6", wave: "sine", notes: [440, 660] },
  { name: "蓝色", color: "#8e9cff", wave: "square", notes: [260, 390] },
  { name: "紫色", color: "#be8cff", wave: "triangle", notes: [520, 780] },
];
const DURATION = 45;
const field = document.querySelector("#playground");
const start = document.querySelector("#start");
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const secondsEl = document.querySelector("#seconds");
const welcome = document.querySelector("#welcome");
const message = document.querySelector("#message");
let score = 0, sameColorStreak = 0, lastType = -1, seconds = DURATION, running = false;
let timer, maker, audioContext;

function playPopSound(typeIndex) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
  const type = BUBBLE_TYPES[typeIndex];
  const now = audioContext.currentTime;
  type.notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type.wave;
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.035);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.25, now + 0.13);
    gain.gain.setValueAtTime(index === 0 ? 0.14 : 0.08, now + index * 0.035);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + index * 0.035);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + index * 0.035);
    oscillator.stop(now + 0.19 + index * 0.035);
  });
}

function addBubble() {
  if (!running) return;
  const typeIndex = Math.floor(Math.random() * BUBBLE_TYPES.length);
  const type = BUBBLE_TYPES[typeIndex];
  const bubble = document.createElement("button");
  const size = 58 + Math.random() * 45;
  bubble.className = "bubble";
  bubble.dataset.type = typeIndex;
  bubble.ariaLabel = `击破${type.name}泡泡`;
  bubble.style.cssText = `left:${8 + Math.random() * 76}%;top:${14 + Math.random() * 66}%;width:${size}px;height:${size}px;background:${type.color}`;
  bubble.innerHTML = "<i></i>";
  bubble.onclick = () => pop(bubble);
  field.appendChild(bubble);
  const all = field.querySelectorAll(".bubble");
  if (all.length > 7) all[0].remove();
}

function render() {
  scoreEl.textContent = score;
  comboEl.textContent = `${sameColorStreak}×`;
  secondsEl.textContent = `${seconds}s`;
}

function showPoints(bubble, points) {
  const label = document.createElement("span");
  label.className = "points";
  label.textContent = `+${points}`;
  label.style.left = bubble.style.left;
  label.style.top = bubble.style.top;
  field.appendChild(label);
  setTimeout(() => label.remove(), 650);
}

function pop(bubble) {
  if (!running) return;
  const typeIndex = Number(bubble.dataset.type);
  sameColorStreak = typeIndex === lastType ? sameColorStreak + 1 : 1;
  lastType = typeIndex;
  const points = 10 * Math.min(sameColorStreak, 5);
  score += points;
  playPopSound(typeIndex);
  showPoints(bubble, points);
  bubble.remove();
  render();
  setTimeout(addBubble, 160);
}

function finish() {
  running = false;
  clearInterval(timer);
  clearInterval(maker);
  field.querySelectorAll(".bubble").forEach((bubble) => bubble.remove());
  message.textContent = `本局得分 ${score}。慢慢呼吸，你做得很好。`;
  welcome.style.display = "grid";
  start.textContent = "再玩一局";
}

function begin() {
  clearInterval(timer);
  clearInterval(maker);
  field.querySelectorAll(".bubble,.points").forEach((item) => item.remove());
  score = 0; sameColorStreak = 0; lastType = -1; seconds = DURATION; running = true;
  welcome.style.display = "none";
  start.textContent = "重新开始";
  render();
  for (let i = 0; i < 4; i += 1) addBubble();
  maker = setInterval(addBubble, 760);
  timer = setInterval(() => { seconds -= 1; render(); if (seconds <= 0) finish(); }, 1000);
}

start.addEventListener("click", begin);
render();
