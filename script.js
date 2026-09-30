/**
 * Focus Study Timer - Split-Flap Clock Engine
 * Precision countdown with 3D dual-flap animations, audio synthesis, and study tracks.
 */

(function () {
  'use strict';

  // --- State Configuration ---
  const state = {
    trackMinutes: 30, // Default 30 min
    remainingSeconds: 30 * 60,
    totalSeconds: 30 * 60,
    isRunning: false,
    intervalId: null,
    endTime: null,
    soundEnabled: true,
    chimeEnabled: true,
    ambientType: 'none',
    wakeLock: null,
    displayLayout: 'grid' // 'grid' (2x2) or 'row' (1x4)
  };

  // --- Audio Context Engine (Zero External Dependencies) ---
  let audioCtx = null;
  let ambientSource = null;
  let ambientGain = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Gentle, realistic clock ticking sound (Single beat, subtle and quiet for focus)
  function playClockTickSound() {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;

      // 1. Escapement tick transient (tiny 8ms click, quiet and crisp)
      const bufferSize = Math.floor(audioCtx.sampleRate * 0.008); // 8ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(3.5, now);

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.06, now); // Gentle, subtle volume
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      noiseSource.start(now);

      // 2. Subtle clock body resonance (gentle low wood tick)
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.012);

      oscGain.gain.setValueAtTime(0.04, now); // Very quiet
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.012);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Serene Tibetan singing bowl / meditation chime on timer completion
  function playCompletionChime() {
    if (!state.chimeEnabled && !state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      const fundamental = 528; // Solfeggio frequency for clarity/peace

      [fundamental, fundamental * 1.5, fundamental * 2.05].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = 0.22 / (idx + 1);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 4.0);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Ambient sound synthesizer (Brown noise, soft rain, tick)
  function startAmbientSound(type) {
    stopAmbientSound();
    if (type === 'none') return;

    try {
      initAudio();
      if (!audioCtx) return;

      const sampleRate = audioCtx.sampleRate;

      if (type === 'brown' || type === 'rain') {
        const bufferSize = sampleRate * 3; // 3-second looping buffer
        const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
        const output = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'brown') {
            output[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // Gain compensation
          } else {
            // Rain (filtered pink/white with droplets)
            output[i] = (lastOut + 0.06 * white) / 1.06;
            lastOut = output[i];
            if (Math.random() < 0.001) {
              output[i] += (Math.random() - 0.5) * 0.8;
            }
          }
        }

        ambientSource = audioCtx.createBufferSource();
        ambientSource.buffer = buffer;
        ambientSource.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = type === 'brown' ? 'lowpass' : 'bandpass';
        filter.frequency.value = type === 'brown' ? 380 : 1200;

        ambientGain = audioCtx.createGain();
        ambientGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        ambientGain.gain.linearRampToValueAtTime(type === 'brown' ? 0.35 : 0.25, audioCtx.currentTime + 1.5);

        ambientSource.connect(filter);
        filter.connect(ambientGain);
        ambientGain.connect(audioCtx.destination);
        ambientSource.start();
      }
    } catch (e) {
      console.warn('Ambient sound error:', e);
    }
  }

  function stopAmbientSound() {
    if (ambientGain && audioCtx) {
      try {
        ambientGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        setTimeout(() => {
          if (ambientSource) {
            ambientSource.stop();
            ambientSource.disconnect();
            ambientSource = null;
          }
        }, 500);
      } catch (e) {
        if (ambientSource) ambientSource.stop();
        ambientSource = null;
      }
    } else if (ambientSource) {
      ambientSource.stop();
      ambientSource = null;
    }
  }

  // --- Screen Wake Lock (Keep Screen On While Studying) ---
  async function requestWakeLock() {
    if ('wakeLock' in navigator && !state.wakeLock) {
      try {
        state.wakeLock = await navigator.wakeLock.request('screen');
        state.wakeLock.addEventListener('release', () => {
          state.wakeLock = null;
        });
      } catch (err) {
        // WakeLock fallback
      }
    }
  }

  function releaseWakeLock() {
    if (state.wakeLock) {
      state.wakeLock.release().catch(() => {});
      state.wakeLock = null;
    }
  }

  // --- DOM Elements ---
  const units = {
    m10: document.getElementById('unit-m10'),
    m1: document.getElementById('unit-m1'),
    s10: document.getElementById('unit-s10'),
    s1: document.getElementById('unit-s1')
  };

  const trackBtns = document.querySelectorAll('.track-btn');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const btnAddMin = document.getElementById('btn-add-min');
  const btnResetBottom = document.getElementById('btn-reset-bottom');
  const btnResetTop = document.getElementById('btn-reset-top');
  const progressBar = document.getElementById('progress-bar');
  const clockGrid = document.getElementById('clock-grid');

  // Top Bar Actions
  const btnSound = document.getElementById('btn-sound');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const iconSoundOff = document.getElementById('icon-sound-off');
  const btnLayout = document.getElementById('btn-layout');
  const btnSettings = document.getElementById('btn-settings');

  // Modal Elements
  const settingsDialog = document.getElementById('settings-dialog');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const settingFlipSound = document.getElementById('setting-flip-sound');
  const settingChimeSound = document.getElementById('setting-chime-sound');
  const settingAmbientType = document.getElementById('setting-ambient-type');
  const settingWakeLock = document.getElementById('setting-wake-lock');
  const btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');
  const layoutPills = document.querySelectorAll('.layout-pill');

  // --- Split-Flap Card Flip Engine ---
  function flipDigit(unitEl, newDigit, playAudio = true) {
    if (!unitEl) return;
    const currentDigit = unitEl.dataset.current || '0';
    if (currentDigit === newDigit && !unitEl.classList.contains('flipping')) return;

    // If an animation is already running on this unit, cleanly commit it first
    if (unitEl._flipTimeout) {
      clearTimeout(unitEl._flipTimeout);
      unitEl._flipTimeout = null;
      commitDigit(unitEl, unitEl._targetDigit || currentDigit);
      void unitEl.offsetWidth; // Force reflow
    }

    if (unitEl.dataset.current === newDigit) return;

    unitEl._targetDigit = newDigit;

    const staticTop = unitEl.querySelector('.static-top .digit');
    const staticBottom = unitEl.querySelector('.static-bottom .digit');
    const movingTop = unitEl.querySelector('.moving-top .digit');
    const movingBottom = unitEl.querySelector('.moving-bottom .digit');

    // 1. Stage the flaps:
    // staticTop has newDigit (revealed when movingTop drops)
    // staticBottom has currentDigit (visible initially at bottom)
    // movingTop has currentDigit (drops from 0deg to -90deg)
    // movingBottom has newDigit (drops from 90deg to 0deg, covering staticBottom)
    staticTop.textContent = newDigit;
    staticBottom.textContent = currentDigit;
    movingTop.textContent = currentDigit;
    movingBottom.textContent = newDigit;

    // 2. Trigger 3D keyframe animations
    unitEl.classList.add('flipping');

    // 3. Complete cleanly after both flaps settle (0.51s)
    unitEl._flipTimeout = setTimeout(() => {
      commitDigit(unitEl, newDigit);
      unitEl._flipTimeout = null;
    }, 510);
  }

  function commitDigit(unitEl, finalDigit) {
    unitEl.classList.remove('flipping');

    const staticTop = unitEl.querySelector('.static-top .digit');
    const staticBottom = unitEl.querySelector('.static-bottom .digit');
    const movingTop = unitEl.querySelector('.moving-top .digit');
    const movingBottom = unitEl.querySelector('.moving-bottom .digit');

    staticTop.textContent = finalDigit;
    staticBottom.textContent = finalDigit;
    movingTop.textContent = finalDigit;
    movingBottom.textContent = finalDigit;
    unitEl.dataset.current = finalDigit;
    unitEl._targetDigit = null;
  }

  // --- Update Timer Display with Split-Flap Transitions ---
  function updateDisplay(seconds, playAudio = true) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');

    // Check if any digit changed to emit a single, soothing 1-beat clock tick
    const hasChange =
      units.m10.dataset.current !== mStr[0] ||
      units.m1.dataset.current !== mStr[1] ||
      units.s10.dataset.current !== sStr[0] ||
      units.s1.dataset.current !== sStr[1];

    flipDigit(units.m10, mStr[0]);
    flipDigit(units.m1, mStr[1]);
    flipDigit(units.s10, sStr[0]);
    flipDigit(units.s1, sStr[1]);

    if (hasChange && playAudio) {
      playClockTickSound(); // Exactly 1 beat, gentle clock ticking sound
    }

    // Update progress bar
    if (state.totalSeconds > 0) {
      const progressFraction = Math.max(0, state.remainingSeconds / state.totalSeconds);
      progressBar.style.transform = `scaleX(${progressFraction})`;
    }
  }

  // Force digits instantly without animation (for initial load)
  function setDigitsInstant(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');

    const digitMap = [
      { unit: units.m10, val: mStr[0] },
      { unit: units.m1, val: mStr[1] },
      { unit: units.s10, val: sStr[0] },
      { unit: units.s1, val: sStr[1] }
    ];

    digitMap.forEach(({ unit, val }) => {
      if (unit._flipTimeout) {
        clearTimeout(unit._flipTimeout);
        unit._flipTimeout = null;
      }
      commitDigit(unit, val);
    });

    if (state.totalSeconds > 0) {
      const progressFraction = Math.max(0, state.remainingSeconds / state.totalSeconds);
      progressBar.style.transform = `scaleX(${progressFraction})`;
    }
  }

  // --- Timer Engine (High Precision Drift-Free) ---
  function startTimer() {
    if (state.remainingSeconds <= 0) {
      state.remainingSeconds = state.totalSeconds;
    }

    initAudio();
    state.isRunning = true;
    state.endTime = Date.now() + state.remainingSeconds * 1000;

    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
    clockGrid.classList.remove('clock-complete');

    if (settingWakeLock.checked) {
      requestWakeLock();
    }

    if (state.ambientType !== 'none') {
      startAmbientSound(state.ambientType);
    }

    state.intervalId = setInterval(tick, 250);
  }

  function pauseTimer() {
    state.isRunning = false;
    clearInterval(state.intervalId);
    state.intervalId = null;

    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');

    releaseWakeLock();
    stopAmbientSound();
  }

  function togglePlayPause() {
    if (state.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function tick() {
    const now = Date.now();
    const diff = Math.max(0, Math.ceil((state.endTime - now) / 1000));

    if (diff !== state.remainingSeconds) {
      state.remainingSeconds = diff;
      updateDisplay(state.remainingSeconds, true);
    }

    if (diff <= 0) {
      onTimerCompleted();
    }
  }

  function onTimerCompleted() {
    pauseTimer();
    clockGrid.classList.add('clock-complete');
    playCompletionChime();

    // Trigger device vibration if available
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 600]);
    }
  }

  function resetTimer() {
    pauseTimer();
    clockGrid.classList.remove('clock-complete');
    state.remainingSeconds = state.trackMinutes * 60;
    state.totalSeconds = state.trackMinutes * 60;
    updateDisplay(state.remainingSeconds, true);
  }

  function addOneMinute() {
    initAudio();
    state.remainingSeconds += 60;
    state.totalSeconds += 60;
    if (state.isRunning) {
      state.endTime += 60 * 1000;
    }
    updateDisplay(state.remainingSeconds, true);
  }

  // --- Track Selection (30m, 60m, 90m) ---
  function selectTrack(minutes) {
    initAudio();
    state.trackMinutes = parseInt(minutes, 10);
    state.totalSeconds = state.trackMinutes * 60;
    state.remainingSeconds = state.totalSeconds;

    trackBtns.forEach(btn => {
      const match = parseInt(btn.dataset.minutes, 10) === state.trackMinutes;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    if (state.isRunning) {
      state.endTime = Date.now() + state.remainingSeconds * 1000;
    }

    clockGrid.classList.remove('clock-complete');
    updateDisplay(state.remainingSeconds, true);
  }

  // --- Sound Toggle ---
  function toggleSound() {
    initAudio();
    state.soundEnabled = !state.soundEnabled;
    iconSoundOn.classList.toggle('hidden', !state.soundEnabled);
    iconSoundOff.classList.toggle('hidden', state.soundEnabled);
    settingFlipSound.checked = state.soundEnabled;

    if (!state.soundEnabled) {
      stopAmbientSound();
    } else if (state.isRunning && state.ambientType !== 'none') {
      startAmbientSound(state.ambientType);
    }
  }

  // --- Layout Toggle (2x2 Grid vs 1x4 Inline) ---
  function setLayout(layout) {
    state.displayLayout = layout;
    const isInline = layout === 'row';
    clockGrid.classList.toggle('inline-layout', isInline);

    layoutPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.layout === layout);
    });
  }

  // --- Event Listeners ---
  // Tracks
  trackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectTrack(btn.dataset.minutes);
    });
  });

  // Controls
  btnPlayPause.addEventListener('click', togglePlayPause);
  btnAddMin.addEventListener('click', addOneMinute);
  btnResetBottom.addEventListener('click', resetTimer);
  btnResetTop.addEventListener('click', resetTimer);

  // Top icons
  btnSound.addEventListener('click', toggleSound);
  btnLayout.addEventListener('click', () => {
    setLayout(state.displayLayout === 'grid' ? 'row' : 'grid');
  });

  btnSettings.addEventListener('click', () => {
    initAudio();
    settingsDialog.showModal();
  });

  btnCloseModal.addEventListener('click', () => {
    settingsDialog.close();
  });

  // Settings inputs
  settingFlipSound.addEventListener('change', e => {
    state.soundEnabled = e.target.checked;
    iconSoundOn.classList.toggle('hidden', !state.soundEnabled);
    iconSoundOff.classList.toggle('hidden', state.soundEnabled);
  });

  settingChimeSound.addEventListener('change', e => {
    state.chimeEnabled = e.target.checked;
  });

  settingAmbientType.addEventListener('change', e => {
    state.ambientType = e.target.value;
    if (state.isRunning) {
      startAmbientSound(state.ambientType);
    }
  });

  layoutPills.forEach(pill => {
    pill.addEventListener('click', () => {
      setLayout(pill.dataset.layout);
    });
  });

  btnToggleFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      btnToggleFullscreen.textContent = 'Exit Fullscreen';
    } else {
      document.exitFullscreen().catch(() => {});
      btnToggleFullscreen.textContent = 'Enter Fullscreen';
    }
  });

  document.addEventListener('fullscreenchange', () => {
    btnToggleFullscreen.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Enter Fullscreen';
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'KeyR':
        resetTimer();
        break;
      case 'Equal': // + key
      case 'NumpadAdd':
        addOneMinute();
        break;
      case 'Digit1':
      case 'Numpad1':
        selectTrack(30);
        break;
      case 'Digit2':
      case 'Numpad2':
        selectTrack(60);
        break;
      case 'Digit3':
      case 'Numpad3':
        selectTrack(90);
        break;
      case 'KeyM':
        toggleSound();
        break;
      case 'KeyF':
        btnToggleFullscreen.click();
        break;
      case 'Escape':
        if (settingsDialog.open) {
          settingsDialog.close();
        }
        break;
    }
  });

  // Handle visibility change (recalculate time when returning to active tab)
  document.addEventListener('visibilitychange', () => {
    if (state.isRunning && !document.hidden && state.endTime) {
      const now = Date.now();
      state.remainingSeconds = Math.max(0, Math.ceil((state.endTime - now) / 1000));
      updateDisplay(state.remainingSeconds, false);
      if (settingWakeLock.checked) {
        requestWakeLock();
      }
    }
  });

  // Initial render: 30:00 (instantly, without flip transition on first frame)
  setDigitsInstant(state.remainingSeconds);

})();
