// 🎧🎨 Audio-Reactive Lissajous Techno Synthesizer
// Jerobeam Fenderson Oscilloscope Style + Patatap Keyboard Synth

// ===== AUDIO COMPONENTS =====
let kickOsc, kickEnv;
let hatNoise, hatEnv, hatFilter;
let userOsc, userEnv;

// ===== VISUAL PARAMETERS =====
let a = 3;  // Lissajous frequency X
let b = 4;  // Lissajous frequency Y
let delta = 0;  // Phase shift
let kickPulse = 0;  // Scale pulse from kick
let hatFlicker = 0;  // Flicker from hi-hat
let breathe = 0;  // Breathing effect from keyboard

// ===== KEYBOARD STATE =====
let keyIsPressed = false;
let currentKey = '';

function preload() {
  // No external assets needed
}

function setup() {
  createCanvas(800, 800);

  // ===== KICK DRUM SETUP =====
  kickOsc = new p5.Oscillator('sine');
  kickOsc.amp(0);
  kickOsc.start();

  kickEnv = new p5.Envelope();
  kickEnv.setADSR(0.001, 0.2, 0, 0);
  kickEnv.setRange(0.8, 0);

  // ===== HI-HAT SETUP =====
  hatNoise = new p5.Noise('white');
  hatNoise.amp(0);
  hatNoise.start();

  hatFilter = new p5.BandPass();
  hatFilter.freq(8000);  // Center frequency around 8kHz
  hatFilter.res(15);     // High resonance for sharper sound
  hatNoise.disconnect();
  hatNoise.connect(hatFilter);

  hatEnv = new p5.Envelope();
  hatEnv.setADSR(0.001, 0.05, 0, 0);
  hatEnv.setRange(0.3, 0);

  // ===== USER OSCILLATOR SETUP =====
  userOsc = new p5.Oscillator('sine');
  userOsc.amp(0);
  userOsc.start();

  userEnv = new p5.Envelope();
  userEnv.setADSR(0.05, 0.2, 0.4, 0.3);
  userEnv.setRange(0.35, 0);

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
  // Frequency envelope: 100Hz dropping to ~40Hz
  kickOsc.freq(100);
  kickOsc.freq(40, 0.2);

  // Trigger amplitude envelope
  kickEnv.play(kickOsc);

  // Visual reaction: pulse
  kickPulse = 0.15;
}

function playHat() {
  // Trigger noise burst through filter
  hatEnv.play(hatNoise);

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
  if (keyIsPressed) {
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
  text('Press A-Z for synth tones', 10, 10);
  text('Lissajous: a=' + a + ' b=' + b, 10, 30);
  if (keyIsPressed) {
    text('Key: ' + currentKey, 10, 50);
  }
}

function keyPressed() {
  // Only respond to letter keys A-Z
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    keyIsPressed = true;
    currentKey = key.toUpperCase();

    // ===== MAP KEY TO FREQUENCY (120-1000 Hz) =====
    let keyIndex = currentKey.charCodeAt(0) - 65;  // A=0, B=1, ... Z=25
    let freq = map(keyIndex, 0, 25, 120, 1000);

    // ===== RANDOMIZE LISSAJOUS PARAMETERS =====
    a = floor(random(1, 11));
    b = floor(random(1, 11));

    // ===== PLAY SYNTH TONE =====
    userOsc.freq(freq);
    userEnv.play(userOsc);
  }
}

function keyReleased() {
  // Only respond to letter keys A-Z
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    keyIsPressed = false;

    // ===== FADE OUT OSCILLATOR =====
    userOsc.amp(0, 0.3);
  }
}
