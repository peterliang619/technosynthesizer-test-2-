let activeOscillators = {};
let pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00];
let currentFrequencies = [];
let globalAmplitude = 0;
let phase = 0;
let lissajousA = 3;
let lissajousB = 4;

function preload() {}

function setup() {
  createCanvas(800, 800);
  background(0);
  strokeWeight(2);
  noFill();
}

function draw() {
  background(0, 0, 0, 40);

  phase += 0.02;
  globalAmplitude *= 0.92;

  if (currentFrequencies.length > 0) {
    drawLissajousCurve();
  } else {
    drawIdleCurve();
  }
}

function drawLissajousCurve() {
  push();
  translate(width / 2, height / 2);

  let avgFreq = currentFrequencies.reduce((a, b) => a + b, 0) / currentFrequencies.length;
  let freqRatio = avgFreq / 261.63;

  lissajousA = lerp(lissajousA, floor(freqRatio * 3) + 1, 0.1);
  lissajousB = lerp(lissajousB, floor(freqRatio * 2) + 2, 0.1);

  let scale = 200 + globalAmplitude * 150;
  let thickness = 1 + globalAmplitude * 4;

  strokeWeight(thickness);
  stroke(255);

  beginShape();
  for (let t = 0; t < TWO_PI; t += 0.01) {
    let x = sin(lissajousA * t) * scale;
    let y = sin(lissajousB * t + phase) * scale;
    vertex(x, y);
  }
  endShape(CLOSE);

  pop();
}

function drawIdleCurve() {
  push();
  translate(width / 2, height / 2);

  strokeWeight(1);
  stroke(255, 100);

  beginShape();
  for (let t = 0; t < TWO_PI; t += 0.01) {
    let x = sin(3 * t) * 180;
    let y = sin(4 * t + phase) * 180;
    vertex(x, y);
  }
  endShape(CLOSE);

  pop();
}

function keyPressed() {
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    let keyName = key.toUpperCase();

    if (activeOscillators[keyName]) {
      return;
    }

    let keyIndex = keyName.charCodeAt(0) - 65;
    let scaleIndex = keyIndex % pentatonicScale.length;
    let octaveOffset = floor(keyIndex / pentatonicScale.length);
    let freq = pentatonicScale[scaleIndex] * pow(2, octaveOffset % 3);

    currentFrequencies.push(freq);

    let osc = new p5.Oscillator('sine');
    osc.freq(freq);
    osc.start();

    let env = new p5.Envelope();
    env.setADSR(0.01, 0.15, 0.3, 0.2);
    env.setRange(0.4, 0);
    env.play(osc);

    activeOscillators[keyName] = { osc: osc, env: env, freq: freq };

    globalAmplitude = 1.0;
  }
}

function keyReleased() {
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    let keyName = key.toUpperCase();

    if (activeOscillators[keyName]) {
      let oscData = activeOscillators[keyName];

      let freqIndex = currentFrequencies.indexOf(oscData.freq);
      if (freqIndex > -1) {
        currentFrequencies.splice(freqIndex, 1);
      }

      oscData.osc.amp(0, 0.2);

      setTimeout(() => {
        oscData.osc.stop();
        oscData.osc.dispose();
        delete activeOscillators[keyName];
      }, 250);
    }
  }
}
