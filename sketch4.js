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
  createCanvas(800, 800);
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
  bassLevel = pow(bassLevel, 1.5) * 2.5;

  // Treble: 2000+ Hz (bins 128+)
  trebleLevel = 0;
  for (let i = 128; i < 200; i++) {
    trebleLevel += spectrum[i];
  }
  trebleLevel = trebleLevel / 72 / 255;

  // Animate phase shift
  delta += 0.03 + (audioLevel * 0.1);

  // Decay breathing effect
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

  // Audio-reactive scaling
  // Bass affects overall scale (kick effect) - MUCH more sensitive now!
  let scaleAmount = 1 + (bassLevel * 0.8) + (audioLevel * 0.3);

  // Keyboard breathing
  if (activeKeys.length > 0) {
    breathe = sin(frameCount * 0.1) * 0.03;
    scaleAmount += breathe;
  }

  scale(scaleAmount);

  // Treble affects stroke weight (shimmer)
  let weight = 2 + (trebleLevel * 4);
  strokeWeight(weight);

  // Audio-reactive color
  let hue = (frameCount * 0.5 + audioLevel * 360) % 360;
  colorMode(HSB);
  stroke(hue, 80, 100);
  colorMode(RGB);
  noFill();

  // Draw Lissajous
  beginShape();
  for (let t = 0; t < TWO_PI; t += 0.01) {
    let x = sin(a * t) * 250;
    let y = sin(b * t + delta) * 250;
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
  text('Press A-Z for pentatonic synth tones', 10, 10);
  text('Lissajous: a=' + a + ' b=' + b, 10, 30);
  text('Audio Level: ' + nf(audioLevel, 1, 3), 10, 50);
  text('Bass: ' + nf(bassLevel, 1, 3) + ' | Treble: ' + nf(trebleLevel, 1, 3), 10, 70);
  if (activeKeys.length > 0) {
    text('Keys: ' + activeKeys.join(', '), 10, 90);
  }
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
