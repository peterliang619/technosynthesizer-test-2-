let backgroundSound;
let amplitude;
let fft;
let activeOscillators = {};
let pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00];
let activeKeys = [];

// Visual parameters (same as sketch3)
let a = 3;
let b = 4;
let delta = 0;
let kickPulse = 0;
let hatFlicker = 0;
let breathe = 0;

// Audio-reactive parameters
let audioLevel = 0;
let bassLevel = 0;
let trebleLevel = 0;

let isPlaying = false;

function preload() {
  // Load the background sound
  backgroundSound = loadSound('background sound.mp3',
    () => console.log('Audio loaded successfully'),
    (err) => console.log('Error loading audio:', err)
  );
}

function setup() {
  createCanvas(720, 720);
  background(0);

  // Create audio analyzers
  amplitude = new p5.Amplitude();
  fft = new p5.FFT(0.3, 512); // Lower smoothing = more responsive

  // Connect background sound to analyzers
  backgroundSound.connect(amplitude);
  backgroundSound.connect(fft);

  // Display click instruction
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(20);
  text('Click to start audio', width / 2, height / 2);
}

function draw() {
  background(0, 0, 0, 25);

  if (!isPlaying) {
    // Show instructions
    fill(255, 150);
    noStroke();
    textSize(20);
    textAlign(CENTER, CENTER);
    text('Click anywhere to start', width / 2, height / 2);
    return;
  }

  // Analyze audio
  audioLevel = amplitude.getLevel();

  // Get frequency spectrum
  let spectrum = fft.analyze();

  // Bass: 20-400 Hz (first ~64 bins for better kick detection)
  bassLevel = 0;
  for (let i = 0; i < 64; i++) {
    bassLevel += spectrum[i];
  }
  bassLevel = bassLevel / 64 / 255;

  // Amplify bass peaks (square it to make kicks more pronounced)
  bassLevel = pow(bassLevel, 1.5) * 2.0;

  // Treble: 2000+ Hz (bins 128+)
  trebleLevel = 0;
  for (let i = 128; i < 200; i++) {
    trebleLevel += spectrum[i];
  }
  trebleLevel = trebleLevel / 72 / 255;

  // Map audio to visual effects (like sketch3's kickPulse and hatFlicker)
  kickPulse = bassLevel * 0.25;  // Bass -> pulse effect (more sensitive)
  hatFlicker = trebleLevel * 5;   // Treble -> flicker effect (more sensitive)

  // Animate phase shift
  delta += 0.03;

  // Decay visual effects
  kickPulse *= 0.85;
  hatFlicker *= 0.7;
  breathe *= 0.95;

  // Draw Lissajous curve
  drawLissajous();
}

function mousePressed() {
  if (!isPlaying && backgroundSound.isLoaded()) {
    userStartAudio();
    backgroundSound.loop();
    backgroundSound.setVolume(0.7);
    isPlaying = true;
  }
}

function drawLissajous() {
  push();
  translate(width / 2, height / 2);

  // Apply audio-reactive effects (same as sketch3 style)
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

  // Draw Lissajous
  beginShape();
  for (let t = 0; t < TWO_PI; t += 0.01) {
    let x = sin(a * t) * 225;
    let y = sin(b * t + delta) * 225;
    vertex(x, y);
  }
  endShape(CLOSE);

  pop();

  // Display info
  displayInfo();
}

function displayInfo() {
  fill(255, 150);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text('Press A-Z for synthesizer tones', 10, 10);
}

function keyPressed() {
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    let keyName = key.toUpperCase();

    if (activeOscillators[keyName]) {
      return;
    }

    // Add to active keys list
    if (!activeKeys.includes(keyName)) {
      activeKeys.push(keyName);
    }

    let keyIndex = keyName.charCodeAt(0) - 65;
    let scaleIndex = keyIndex % pentatonic.length;
    let octave = floor(keyIndex / pentatonic.length) % 2;
    let freq = pentatonic[scaleIndex] * pow(2, octave);

    // Randomize Lissajous parameters (same as sketch3)
    a = floor(random(1, 11));
    b = floor(random(1, 11));

    let osc = new p5.Oscillator('sine');
    osc.freq(freq);
    osc.start();

    let env = new p5.Envelope();
    env.setADSR(0.01, 0.2, 0.3, 0.15);
    env.setRange(0.35, 0);
    env.play(osc);

    activeOscillators[keyName] = { osc: osc, env: env };
  }
}

function keyReleased() {
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    let keyName = key.toUpperCase();

    // Remove from active keys list
    let index = activeKeys.indexOf(keyName);
    if (index > -1) {
      activeKeys.splice(index, 1);
    }

    if (activeOscillators[keyName]) {
      let oscData = activeOscillators[keyName];
      oscData.osc.amp(0, 0.2);

      setTimeout(() => {
        oscData.osc.stop();
        oscData.osc.dispose();
        delete activeOscillators[keyName];
      }, 250);
    }
  }
}
