let activeOscillators = {};
let pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00];
let activeKeys = [];

// Visual parameters
let a = 3;
let b = 4;
let delta = 0;
let kickPulse = 0;
let hatFlicker = 0;
let breathe = 0;

function preload() {}

function setup() {
  createCanvas(800, 800);
  background(0);
}

function draw() {
  background(0, 0, 0, 25);

  // Kick every 30 frames
  if (frameCount % 30 === 0) {
    playKick();
  }

  // Hi-hat every 15 frames
  if (frameCount % 15 === 0) {
    playHat();
  }

  // Animate phase shift
  delta += 0.03;

  // Decay visual effects
  kickPulse *= 0.85;
  hatFlicker *= 0.7;
  breathe *= 0.95;

  // Draw Lissajous curve
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

  // Apply audio-reactive effects
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
  if (activeKeys.length > 0) {
    text('Keys: ' + activeKeys.join(', '), 10, 50);
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

    // Randomize Lissajous parameters
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
