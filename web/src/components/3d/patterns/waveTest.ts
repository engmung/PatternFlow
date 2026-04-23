import { PatternDef } from './common';

// Simple radial wave — great for testing UV mapping
// Shows concentric rings from center, should look circular if aspect is correct
const waveTest: PatternDef = {
  name: 'Wave Test',
  defaults: { uSpeed: 2.0, uParam1: 12.0 },
  fragmentShader: `
precision highp float;
uniform float uTime;
uniform float uSpeed;
uniform float uParam1; // frequency
uniform float uParam2;
uniform float uParam3;
uniform float uParam4;
uniform float uAspect; // mesh width/height ratio
varying vec2 vUv;

void main() {
  // Quantize to 64x128 LED grid
  const float COLS = 64.0;
  const float ROWS = 128.0;
  vec2 cell = floor(vUv * vec2(COLS, ROWS));
  vec2 quv = (cell + 0.5) / vec2(COLS, ROWS);

  // Center and correct aspect ratio
  vec2 uv = quv - 0.5;
  uv.y *= uAspect;

  // Distance from center
  float dist = length(uv);

  // Simple radial wave
  float wave = sin(dist * uParam1 - uTime * uSpeed);

  // Map -1..1 to 0..1
  float v = wave * 0.5 + 0.5;

  // Color: dark blue → orange → white
  vec3 col = mix(
    vec3(0.02, 0.02, 0.08),
    vec3(1.0, 0.35, 0.1),
    smoothstep(0.3, 0.7, v)
  );
  col = mix(col, vec3(1.0), smoothstep(0.8, 1.0, v));

  // LOD: fade LED gaps based on screen-space pixel density
  vec2 ledUV = vUv * vec2(COLS, ROWS);
  vec2 f = fract(ledUV);
  float screenSize = length(fwidth(ledUV)); // how many LED cells per screen pixel
  float detail = 1.0 - smoothstep(uParam2, uParam3, screenSize); // uParam2=fadeStart, uParam3=fadeEnd

  float gapSize = 0.12;
  float gx = smoothstep(0.0, gapSize, f.x) * (1.0 - smoothstep(1.0 - gapSize, 1.0, f.x));
  float gy = smoothstep(0.0, gapSize, f.y) * (1.0 - smoothstep(1.0 - gapSize, 1.0, f.y));
  float gridMask = mix(1.0, mix(0.06, 1.0, gx * gy), detail);
  col *= gridMask;

  gl_FragColor = vec4(col, 1.0);
}
`,
};

export default waveTest;
