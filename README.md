# Focus Timer ⏱️

A minimalist, luxury split-flap countdown study timer designed for deep focus and productivity. Built with pure HTML5, modern Vanilla CSS 3D transforms, and Web Audio API synthesis.

![Focus Timer Preview](WhatsApp%20Image%202026-09-30%20at%2019.38.55.jpeg)

## Features

- **3 Dedicated Study Tracks**:
  - **30 MIN** (Quick sprint / Pomodoro)
  - **60 MIN** (Standard deep work block)
  - **90 MIN** (Ultradian rhythm / extended focus)
- **Authentic Split-Flap 3D Physics**:
  - Dual-flap gravity animation (`0° → -90°` top flap, `90° → 0°` bottom flap).
  - Center horizontal seam with mechanical side-pin notches.
  - Zero backface flipping bugs or flicker when switching tracks or running countdowns.
- **Synthesized Audio Engine (No external sound files required)**:
  - **Clock Ticking Sound**: Gentle, subtle single-beat analog escapement tick for focus without distraction.
  - **Completion Chime**: Calming Tibetan singing bowl meditation chime upon timer completion.
  - **Ambient Focus Streams**: Optional deep brown noise, soft rain, or ticking.
- **Display Modes**:
  - Classic 2x2 Grid (as in retro flip desk clocks).
  - 1x4 Inline Linear Row.
- **Screen Wake Lock**:
  - Automatically keeps screen awake while studying so phones and laptops don't go to sleep.
- **Fully Responsive**:
  - Optimized for mobile phone touch screens and desktop widescreen displays.

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Start / Pause Timer |
| <kbd>R</kbd> | Reset to current track duration |
| <kbd>+</kbd> or <kbd>=</kbd> | Add +1 minute |
| <kbd>1</kbd> | Switch to 30 MIN track |
| <kbd>2</kbd> | Switch to 60 MIN track |
| <kbd>3</kbd> | Switch to 90 MIN track |
| <kbd>M</kbd> | Toggle Clock Tick / Sound Mute |
| <kbd>F</kbd> | Toggle Fullscreen Mode |
| <kbd>Esc</kbd> | Close Settings Dialog |

## Getting Started

Simply open `index.html` in any modern web browser, or run a local static server:

```bash
# Python
python3 -m http.server 3000

# Node.js
npx serve
```
Then visit `http://localhost:3000`.

## Tech Stack
- **Structure**: Semantic HTML5
- **Styling**: Vanilla CSS with 3D Perspective, Container Queries, and Keyframe Animations
- **Logic**: Vanilla ES6+ JavaScript
- **Audio**: Web Audio API (real-time procedural sound synthesis)
