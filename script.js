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
let cycles = 0;
let toastTimeout = null;
const timers = {
  focus: { remaining: Number(focusInput.value) * 60, length: Number(focusInput.value) * 60, running: false, interval: null },
  break: { remaining: Number(breakInput.value) * 60, length: Number(breakInput.value) * 60, running: false, interval: null }
};

function getDuration(currentMode) {
  return Number(currentMode === 'focus' ? focusInput.value : breakInput.value) * 60;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

// Render timer yang sedang dipilih, termasuk progres dan status tombolnya.
function renderTimer() {
  const timer = timers[mode];
  timerDisplay.textContent = formatTime(timer.remaining);
  const progress = timer.length ? ((timer.length - timer.remaining) / timer.length) * 100 : 0;
  progressFill.style.width = `${progress}%`;
  document.title = `${formatTime(timer.remaining)} — ${mode === 'focus' ? 'Fokus' : 'Istirahat'}`;
  startButton.classList.toggle('is-running', timer.running);
  startButtonText.textContent = timer.running ? 'Jeda' : 'Mulai ' + (mode === 'focus' ? 'fokus' : 'istirahat');
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
  renderTimer();
}

function pauseTimer(currentMode = mode) {
  const timer = timers[currentMode];
  clearInterval(timer.interval);
  timer.interval = null;
  timer.running = false;
  if (currentMode === mode) renderTimer();
}

function startTimer() {
  const timer = timers[mode];
  if (timer.running) return;
  timer.running = true;
  renderTimer();
  timer.interval = setInterval(() => {
    timer.remaining -= 1;
    if (mode === (timer === timers.focus ? 'focus' : 'break')) renderTimer();
    if (timer.remaining <= 0) finishSession(timer === timers.focus ? 'focus' : 'break');
  }, 1000);
}

// Sesi yang selesai beralih otomatis ke mode berikutnya.
function finishSession(completedMode = mode) {
  const timer = timers[completedMode];
  pauseTimer(completedMode);
  timer.remaining = 0;
  if (mode === completedMode) renderTimer();

  if (completedMode === 'focus') {
    timer.remaining = getDuration('focus');
    timer.length = timer.remaining;
    setMode('break');
    showToast('Sesi fokus selesai — waktunya istirahat! 🌿');
  } else {
    cycles += 1;
    cycleCount.textContent = cycles;
    timer.remaining = getDuration('break');
    timer.length = timer.remaining;
    setMode('focus');
    showToast(`Siklus ${cycles} selesai — siap fokus kembali? ✨`);
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(completedMode === 'focus' ? 'Sesi fokus selesai!' : 'Waktunya fokus lagi!', {
      body: completedMode === 'focus' ? 'Ambil jeda sejenak dan segarkan pikiran.' : 'Istirahat selesai. Mulai sesi fokus baru.'
    });
  }

  // Lanjutkan otomatis ke mode berikutnya untuk membentuk siklus fokus–istirahat.
  startTimer();
}

// Pesan visual non-blocking agar perpindahan sesi tetap terasa jelas.
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 4200);
}

function resetTimer() {
  pauseTimer(mode);
  const timer = timers[mode];
  timer.remaining = getDuration(mode);
  timer.length = timer.remaining;
  timerMessage.textContent = mode === 'focus' ? 'Satu hal dalam satu waktu.' : 'Kamu sudah bekerja dengan baik.';
  renderTimer();
}

function selectMode(nextMode) {
  // Tiap mode menyimpan progres dan status jalannya sendiri saat tab diganti.
  setMode(nextMode);
}

function validateDuration(input) {
  const value = Math.min(180, Math.max(1, Number(input.value) || 1));
  input.value = value;
  return value;
}

startButton.addEventListener('click', () => {
  if (timers[mode].running) pauseTimer(mode);
  else startTimer();
});
document.getElementById('resetButton').addEventListener('click', resetTimer);
document.getElementById('skipButton').addEventListener('click', () => finishSession(mode));
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
    const changedMode = input === focusInput ? 'focus' : 'break';
    const timer = timers[changedMode];
    if (!timer.running) {
      timer.remaining = getDuration(changedMode);
      timer.length = timer.remaining;
      if (mode === changedMode) renderTimer();
    }
  });
});

// Meminta izin notifikasi hanya setelah pengguna mengaktifkan timer.
startButton.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

renderTimer();
