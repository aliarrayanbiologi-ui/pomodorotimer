// Custom Pomodoro Timer: durasi dapat diubah kapan saja untuk sesi berikutnya.
const focusInput = document.getElementById('focusDuration');
const breakInput = document.getElementById('breakDuration');
const timerDisplay = document.getElementById('timerDisplay');
const sessionLabel = document.getElementById('sessionLabel');
const timerMessage = document.getElementById('timerMessage');
const progressFill = document.getElementById('progressFill');
const startButton = document.getElementById('startButton');
const startButtonText = document.getElementById('startButtonText');
const cycleCount = document.getElementById('cycleCount');
const toast = document.getElementById('toast');

let mode = 'focus';
let running = false;
let remainingSeconds = Number(focusInput.value) * 60;
let sessionLength = remainingSeconds;
let cycles = 0;
let timerInterval = null;
let toastTimeout = null;

function getDuration(currentMode) {
  return Number(currentMode === 'focus' ? focusInput.value : breakInput.value) * 60;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

// Render angka, progres sesi, label, dan warna berdasarkan mode aktif.
function renderTimer() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  const progress = sessionLength ? ((sessionLength - remainingSeconds) / sessionLength) * 100 : 0;
  progressFill.style.width = `${progress}%`;
  document.title = `${formatTime(remainingSeconds)} — ${mode === 'focus' ? 'Fokus' : 'Istirahat'}`;
}

function setMode(nextMode) {
  mode = nextMode;
  document.body.classList.toggle('break-mode', mode === 'break');
  document.getElementById('focusTab').classList.toggle('active', mode === 'focus');
  document.getElementById('breakTab').classList.toggle('active', mode === 'break');
  document.getElementById('focusTab').setAttribute('aria-pressed', String(mode === 'focus'));
  document.getElementById('breakTab').setAttribute('aria-pressed', String(mode === 'break'));
  sessionLabel.textContent = mode === 'focus' ? 'WAKTU UNTUK FOKUS' : 'WAKTU UNTUK ISTIRAHAT';
  timerMessage.textContent = mode === 'focus' ? 'Satu hal dalam satu waktu.' : 'Kamu sudah bekerja dengan baik.';
  remainingSeconds = getDuration(mode);
  sessionLength = remainingSeconds;
  renderTimer();
}

function setRunning(isRunning) {
  running = isRunning;
  startButton.classList.toggle('is-running', running);
  startButtonText.textContent = running ? 'Jeda' : 'Mulai ' + (mode === 'focus' ? 'fokus' : 'istirahat');
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  setRunning(false);
}

function startTimer() {
  if (running) return;
  setRunning(true);
  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    renderTimer();
    if (remainingSeconds <= 0) finishSession();
  }, 1000);
}

// Setiap sesi berganti otomatis; satu siklus dihitung setelah fokus dan istirahat selesai.
function finishSession() {
  pauseTimer();
  remainingSeconds = 0;
  renderTimer();
  const completedMode = mode;

  if (completedMode === 'focus') {
    setMode('break');
    showToast('Sesi fokus selesai — waktunya istirahat! 🌿');
  } else {
    cycles += 1;
    cycleCount.textContent = cycles;
    setMode('focus');
    showToast(`Siklus ${cycles} selesai — siap fokus kembali? ✨`);
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(completedMode === 'focus' ? 'Sesi fokus selesai!' : 'Waktunya fokus lagi!', {
      body: completedMode === 'focus' ? 'Ambil jeda sejenak dan segarkan pikiran.' : 'Istirahat selesai. Mulai sesi fokus baru.'
    });
  }
}

// Pesan visual non-blocking agar perpindahan sesi tetap terasa jelas.
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 4200);
}

function resetTimer() {
  pauseTimer();
  remainingSeconds = getDuration(mode);
  sessionLength = remainingSeconds;
  renderTimer();
  timerMessage.textContent = mode === 'focus' ? 'Satu hal dalam satu waktu.' : 'Kamu sudah bekerja dengan baik.';
}

function selectMode(nextMode) {
  pauseTimer();
  setMode(nextMode);
}

function validateDuration(input) {
  const value = Math.min(180, Math.max(1, Number(input.value) || 1));
  input.value = value;
  return value;
}

startButton.addEventListener('click', () => running ? pauseTimer() : startTimer());
document.getElementById('resetButton').addEventListener('click', resetTimer);
document.getElementById('skipButton').addEventListener('click', finishSession);
document.getElementById('focusTab').addEventListener('click', () => selectMode('focus'));
document.getElementById('breakTab').addEventListener('click', () => selectMode('break'));
document.getElementById('resetCycleButton').addEventListener('click', () => {
  cycles = 0;
  cycleCount.textContent = cycles;
  showToast('Penghitung siklus diatur ulang.');
});

[focusInput, breakInput].forEach(input => {
  input.addEventListener('change', () => {
    validateDuration(input);
    if (!running) resetTimer();
  });
});

// Meminta izin notifikasi hanya setelah pengguna mengaktifkan timer.
startButton.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

renderTimer();
