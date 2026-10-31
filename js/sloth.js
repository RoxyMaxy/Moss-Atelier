// js/sloth.js - 64x64 pixel sloth sprite and stateful animation

export class Sloth {
  constructor(canvasId, statusElementId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.statusEl = document.getElementById(statusElementId);
    this.state = 'idle'; // 'idle', 'searching', 'dozing'
    this.lastInteraction = Date.now();
    this.frame = 0;
    this.animId = null;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
    });

    this.initActivityListeners();
    this.startLoop();
  }

  initActivityListeners() {
    const resetIdle = () => {
      this.lastInteraction = Date.now();
      if (this.state === 'dozing') {
        this.setState('idle');
      }
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    if (this.statusEl) {
      if (newState === 'idle') this.statusEl.textContent = 'RESTING';
      if (newState === 'searching') this.statusEl.textContent = 'THINKING';
      if (newState === 'dozing') this.statusEl.textContent = 'DOZING (Zzz)';
    }
  }

  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  update() {
    this.frame++;
    // Check 30 seconds idle threshold
    if (this.state === 'idle' && Date.now() - this.lastInteraction > 30000) {
      this.setState('dozing');
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 64, 64);

    // If reduced motion is active, render static resting sloth
    const breath = this.reducedMotion
      ? 0
      : this.state === 'searching'
      ? Math.sin(this.frame * 0.15) * 1.5
      : this.state === 'dozing'
      ? Math.sin(this.frame * 0.02) * 0.8
      : Math.sin(this.frame * 0.04) * 1.2;

    // Palette
    const cBranch = '#3B2F23';
    const cLeaf = '#7FA37A';
    const cBody = '#755F46';
    const cBelly = '#8D755A';
    const cFace = '#E0D2BC';
    const cDark = '#2A2016';
    const cEye = this.state === 'dozing' ? '#755F46' : '#12100D';
    const cBrass = '#D9A441';

    // 1. Wooden Branch (horizontal diagonally across top)
    ctx.fillStyle = cBranch;
    ctx.fillRect(4, 18, 56, 7);
    ctx.fillStyle = cLeaf;
    // Tiny leaves
    ctx.fillRect(8, 14, 5, 4);
    ctx.fillRect(52, 14, 6, 4);

    // 2. Arms clutching branch
    ctx.fillStyle = cBody;
    ctx.fillRect(16, 16, 7, 10);
    ctx.fillRect(41, 16, 7, 10);
    // Claws
    ctx.fillStyle = cFace;
    ctx.fillRect(16, 14, 2, 4);
    ctx.fillRect(19, 14, 2, 4);
    ctx.fillRect(41, 14, 2, 4);
    ctx.fillRect(44, 14, 2, 4);

    // 3. Hanging Body (affected by breathing)
    const bodyY = 22 + Math.round(breath);
    ctx.fillStyle = cBody;
    ctx.beginPath();
    ctx.roundRect(18, bodyY, 28, 22, 10);
    ctx.fill();

    // Belly patch
    ctx.fillStyle = cBelly;
    ctx.beginPath();
    ctx.roundRect(22, bodyY + 4, 20, 15, 6);
    ctx.fill();

    // 4. Sloth Head
    const headY = bodyY - 3;
    ctx.fillStyle = cBody;
    ctx.beginPath();
    ctx.arc(32, headY + 8, 11, 0, Math.PI * 2);
    ctx.fill();

    // Face mask (light patch)
    ctx.fillStyle = cFace;
    ctx.beginPath();
    ctx.ellipse(32, headY + 9, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye stripes (characteristic brown bands)
    ctx.fillStyle = cDark;
    ctx.fillRect(25, headY + 7, 5, 3);
    ctx.fillRect(34, headY + 7, 5, 3);

    // Eyes
    ctx.fillStyle = cEye;
    if (this.state === 'dozing') {
      // Closed sleepy lines
      ctx.fillRect(26, headY + 8, 3, 1);
      ctx.fillRect(35, headY + 8, 3, 1);
      // Floating Zzz
      if (!this.reducedMotion && (this.frame % 60 < 45)) {
        ctx.fillStyle = cBrass;
        ctx.font = '8px monospace';
        ctx.fillText('z', 48, 12 - (this.frame % 30) * 0.3);
      }
    } else if (this.state === 'searching') {
      // Wide attentive eyes
      ctx.beginPath();
      ctx.arc(27, headY + 8, 1.8, 0, Math.PI * 2);
      ctx.arc(36, headY + 8, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Calm eyes
      ctx.fillRect(26, headY + 8, 2, 2);
      ctx.fillRect(35, headY + 8, 2, 2);
    }

    // Cute small snout
    ctx.fillStyle = cDark;
    ctx.fillRect(31, headY + 11, 2, 2);

    // Calm smile
    ctx.fillRect(30, headY + 13, 4, 1);
  }
}
