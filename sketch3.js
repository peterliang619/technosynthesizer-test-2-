let activeOscillators = {};
let pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00];
let activeShapes = [];
let beatIndex = 0;
let lastBeatTime = 0;
let beatInterval = 400;
let beatPattern = [0, 2, 4, 2];
let globalPhase = 0;

function preload() {}

function setup() {
  createCanvas(800, 800);
  background(0);
}

function draw() {
  background(0, 0, 0, 30);

  globalPhase += 0.02;

  let currentTime = millis();
  if (currentTime - lastBeatTime > beatInterval) {
    playBeat();
    lastBeatTime = currentTime;
  }

  for (let i = activeShapes.length - 1; i >= 0; i--) {
    let shape = activeShapes[i];
    shape.life -= 0.015;
    if (shape.life <= 0) {
      activeShapes.splice(i, 1);
    } else {
      drawShape(shape);
    }
  }
}

function playBeat() {
  let noteIndex = beatPattern[beatIndex % beatPattern.length];
  let freq = pentatonic[noteIndex];

  let beatOsc = new p5.Oscillator('triangle');
  beatOsc.freq(freq * 0.5);
  beatOsc.start();

  let beatEnv = new p5.Envelope();
  beatEnv.setADSR(0.005, 0.08, 0, 0);
  beatEnv.setRange(0.15, 0);
  beatEnv.play(beatOsc);

  setTimeout(() => {
    beatOsc.stop();
    beatOsc.dispose();
  }, 100);

  beatIndex++;
}

function drawShape(shape) {
  push();
  translate(width / 2, height / 2);
  rotate(shape.rotation + globalPhase * shape.rotSpeed);

  let size = shape.size * shape.life;
  let alpha = 255 * shape.life;

  strokeWeight(1 + shape.life * 2);
  stroke(shape.color[0], shape.color[1], shape.color[2], alpha);
  noFill();

  beginShape();
  for (let t = 0; t < TWO_PI; t += 0.02) {
    let x = sin(shape.a * t + shape.phaseX) * size;
    let y = sin(shape.b * t + shape.phaseY + globalPhase) * size;
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
    let scaleIndex = keyIndex % pentatonic.length;
    let octave = floor(keyIndex / pentatonic.length) % 2;
    let freq = pentatonic[scaleIndex] * pow(2, octave);

    let osc = new p5.Oscillator('sine');
    osc.freq(freq);
    osc.start();

    let env = new p5.Envelope();
    env.setADSR(0.01, 0.2, 0.3, 0.15);
    env.setRange(0.35, 0);
    env.play(osc);

    activeOscillators[keyName] = { osc: osc, env: env };

    let shape = {
      a: (keyIndex % 5) + 2,
      b: ((keyIndex * 3) % 7) + 2,
      phaseX: keyIndex * 0.3,
      phaseY: keyIndex * 0.5,
      size: 150 + (freq / 10),
      life: 1.0,
      rotation: keyIndex * 0.4,
      rotSpeed: (keyIndex % 3) * 0.1,
      color: [
        (keyIndex * 30) % 255,
        150 + (keyIndex * 20) % 105,
        200 + (keyIndex * 15) % 55
      ]
    };

    activeShapes.push(shape);
  }
}

function keyReleased() {
  if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z') {
    let keyName = key.toUpperCase();

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
