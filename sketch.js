// 🎧🎨 Audio-Reactive Lissajous Techno Synthesizer
// Jerobeam Fenderson Oscilloscope Style + Patatap Keyboard Synth

// ===== AUDIO COMPONENTS =====
// Polyphonic keyboard synth - stores active oscillators per key
let activeOscillators = {};

// Loop system - stores captured loops
let loops = [];

// ===== VISUAL PARAMETERS =====
let a = 3;  // Lissajous frequency X
let b = 4;  // Lissajous frequency Y
let delta = 0;  // Phase shift
let kickPulse = 0;  // Scale pulse from kick
let hatFlicker = 0;  // Flicker from hi-hat
let breathe = 0;  // Breathing effect from keyboard

// ===== KEYBOARD STATE =====
let activeKeys = [];

function preload() {
  // No external assets needed
}

function setup() {
  createCanvas(800, 800);
  background(0);
}

function draw() {
  background(0, 0, 0, 25);  // Slight trail effect

  // ===== AUTO PERCUSSION TRIGGERS =====
  // Kick every 30 frames
  if (frameCount % 30 === 0) {
    playKick();
  }

  // Hi-hat every 15 frames
  if (frameCount % 15 === 0) {
    playHat();
  }

  // ===== ANIMATE PHASE SHIFT =====
  delta += 0.03;

  // ===== DECAY VISUAL EFFECTS =====
  kickPulse *= 0.85;
  hatFlicker *= 0.7;
  breathe *= 0.95;

  // ===== DRAW LISSAJOUS CURVE =====
  drawLissajous();
}

function playKick() {
  // Create new oscillator and envelope for each kick (allows overlapping)
  let kickOsc = new p5.Oscillator('sine');
  kickOsc.start();
  kickOsc.freq(100);
  kickOsc.freq(40, 0.2);

  let kickEnv = new p5.Envelope();
  kickEnv.setADSR(0.001, 0.2, 0, 0);
  kickEnv.setRange(0.8, 0);
  kickEnv.play(kickOsc);

  // Auto-cleanup after envelope completes
  setTimeout(() => {
    kickOsc.stop();
    kickOsc.dispose();
  }, 250);

  // Visual reaction: pulse
  kickPulse = 0.15;
}

function playHat() {
  // Create new noise source for each hi-hat (allows overlapping)
  let hatNoise = new p5.Noise('white');
  hatNoise.start();

  let hatFilter = new p5.BandPass();
  hatFilter.freq(8000);
  hatFilter.res(15);
  hatNoise.disconnect();
  hatNoise.connect(hatFilter);

  let hatEnv = new p5.Envelope();
  hatEnv.setADSR(0.001, 0.05, 0, 0);
  hatEnv.setRange(0.3, 0);
  hatEnv.play(hatNoise);

  // Auto-cleanup after envelope completes
  setTimeout(() => {
    hatNoise.stop();
    hatNoise.dispose();
    hatFilter.dispose();
  }, 100);

  // Visual reaction: flicker
  hatFlicker = random(1, 3);
}

function drawLissajous() {
  push();
  translate(width / 2, height / 2);

  // ===== APPLY AUDIO-REACTIVE EFFECTS =====
  // Kick pulse (zoom)
  let scaleAmount = 1 + kickPulse;

  // Keyboard breathing
  if (activeKeys.length > 0) {
    breathe = sin(frameCount * 0.1) * 0.03;
    scaleAmount += breathe;
  }

  scale(scaleAmount);

  // Hi-hat flicker (strokeWeight variation)
  let weight = 2 + hatFlicker;
  strokeWeight(weight);

  stroke(255);
  noFill();

  // ===== DRAW LISSAJOUS =====
  beginShape();
  for (let t = 0; t < TWO_PI; t += 0.01) {
    let x = sin(a * t) * 250;
    let y = sin(b * t + delta) * 250;
    vertex(x, y);
  }
  endShape(CLOSE);

  pop();

  // ===== OPTIONAL: DISPLAY INFO =====
  displayInfo();
}

function displayInfo() {
  fill(255, 150);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text('Press A-Z for synth tones (polyphonic!)', 10, 10);
  text('SPACE: Capture loop | C: Clear all loops', 10, 30);
  text('Lissajous: a=' + a + ' b=' + b, 10, 50);
  if (activeKeys.length > 0) {
    text('Keys: ' + activeKeys.join(', '), 10, 70);
  }
  if (loops.length > 0) {
    text('Loops: ' + loops.length + ' active', 10, 90);
  }
}

function keyPressed() {
  // Handle spacebar - capture current sounds as a loop
  if (key === ' ') {
    captureLoop();
    return false; // Prevent default spacebar behavior
  }

  // Handle 'C' key - clear all loops
  if (key === 'c' || key === 'C') {
    clearAllLoops();
    return;
  }

  // Only respond to letter keys A-Z (excluding C which is used for clearing)
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    let keyName = key.toUpperCase();

    // Skip 'C' as it's used for clearing loops
    if (keyName === 'C') {
      return;
    }

    // Prevent key repeat - only trigger if key not already pressed
    if (activeOscillators[keyName]) {
      return;
    }

    // Add to active keys list
    if (!activeKeys.includes(keyName)) {
      activeKeys.push(keyName);
    }

    // ===== MAP KEY TO FREQUENCY (120-1000 Hz) =====
    let keyIndex = keyName.charCodeAt(0) - 65;  // A=0, B=1, ... Z=25
    let freq = map(keyIndex, 0, 25, 120, 1000);

    // ===== RANDOMIZE LISSAJOUS PARAMETERS =====
    a = floor(random(1, 11));
    b = floor(random(1, 11));

    // ===== CREATE NEW OSCILLATOR FOR THIS KEY =====
    let osc = new p5.Oscillator('sine');
    osc.freq(freq);
    osc.start();

    let env = new p5.Envelope();
    env.setADSR(0.05, 0.2, 0.4, 0.3);
    env.setRange(0.35, 0);
    env.play(osc);

    // Store oscillator and envelope
    activeOscillators[keyName] = { osc: osc, env: env };
  }
}

function keyReleased() {
  // Only respond to letter keys A-Z
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    let keyName = key.toUpperCase();

    // Skip 'C' as it's used for clearing loops
    if (keyName === 'C') {
      return;
    }

    // Remove from active keys list
    let index = activeKeys.indexOf(keyName);
    if (index > -1) {
      activeKeys.splice(index, 1);
    }

    // ===== FADE OUT AND CLEANUP OSCILLATOR =====
    if (activeOscillators[keyName]) {
      let oscData = activeOscillators[keyName];
      oscData.osc.amp(0, 0.3);

      // Cleanup after fade out
      setTimeout(() => {
        oscData.osc.stop();
        oscData.osc.dispose();
        delete activeOscillators[keyName];
      }, 350);
    }
  }
}

// ===== LOOP SYSTEM =====
function captureLoop() {
  // Only capture if there are active keys
  if (activeKeys.length === 0) {
    return;
  }

  // Create a new loop with current active keys and their frequencies
  let newLoop = {
    oscillators: []
  };

  // For each active key, create a persistent looping oscillator
  for (let keyName of activeKeys) {
    if (activeOscillators[keyName]) {
      let keyIndex = keyName.charCodeAt(0) - 65;
      let freq = map(keyIndex, 0, 25, 120, 1000);

      // Create looping oscillator (no envelope, continuous)
      let loopOsc = new p5.Oscillator('sine');
      loopOsc.freq(freq);
      loopOsc.amp(0);
      loopOsc.start();

      // Fade in the loop oscillator
      loopOsc.amp(0.25, 0.1);

      newLoop.oscillators.push({
        osc: loopOsc,
        freq: freq,
        key: keyName
      });
    }
  }

  // Add loop to loops array
  loops.push(newLoop);

  // Visual feedback
  kickPulse = 0.3; // Big pulse to indicate loop captured
}

function clearAllLoops() {
  // Stop and dispose all loop oscillators
  for (let loop of loops) {
    for (let oscData of loop.oscillators) {
      oscData.osc.amp(0, 0.2);
      setTimeout(() => {
        oscData.osc.stop();
        oscData.osc.dispose();
      }, 250);
    }
  }

  // Clear loops array
  loops = [];

  // Visual feedback
  hatFlicker = 5; // Flicker to indicate cleared
}
