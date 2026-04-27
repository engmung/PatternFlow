import { PatternDef } from './common';

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform float uSpeed;
uniform float uParam1; // Angle (0..1 -> 0..2PI)
uniform float uParam2; // Scale (0..1 -> 0.5..6.0)
uniform float uParam3; // Dist (0..1 -> 0.0..4.0)
uniform float uParam4; // dScale (0..1 -> 0.3..5.0)
uniform float uAspect;
varying vec2 vUv;

// Perlin Noise helper functions
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float n00 = hash(i + vec2(0.0, 0.0));
  float n10 = hash(i + vec2(1.0, 0.0));
  float n01 = hash(i + vec2(0.0, 1.0));
  float n11 = hash(i + vec2(1.0, 1.0));

  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}

float fractalNoise(vec2 p) {
  float sum = 0.0, amp = 1.0, maxAmp = 0.0, freq = 1.0;
  for (int i = 0; i < 2; i++) {
    sum += noise(p * freq) * amp;
    maxAmp += amp;
    amp *= 0.22;
    freq *= 2.0;
  }
  return sum / maxAmp;
}

void main() {
  // Quantize to 64x128 grid
  const float COLS = 64.0;
  const float ROWS = 128.0;
  vec2 cell = floor(vUv * vec2(COLS, ROWS));
  vec2 localUV = fract(vUv * vec2(COLS, ROWS));

  // Coordinate mapping matching firmware (Swapped for vertical display):
  float u = ( (cell.y + 0.5)/ROWS - 0.5 ) * 2.0;
  float v = ( (cell.x + 0.5)/COLS - 0.5 ); 

  // Parameters from Knobs
  float angle = uParam1 * 6.28318;
  float scale = mix(0.5, 6.0, uParam2);
  float dist = uParam3 * 4.0;
  float dScale = mix(0.3, 5.0, uParam4);
  float phase = uTime * 2.4; 

  float cosA = cos(angle);
  float sinA = sin(angle);

  // Vector Rotate
  float xr = u * cosA - v * sinA;
  float yr = u * sinA + v * cosA;

  // Wave Texture: Bands X
  float n = xr * scale * 20.0 + phase;

  // Distortion
  if (dist > 0.01) {
    float nz = fractalNoise(vec2(xr * dScale, yr * dScale)) * 2.0 - 1.0;
    n += dist * nz;
  }

  // Saw profile: (n/2PI) - floor -> 0..1
  float t = n / 6.28318;
  t -= floor(t);

  // Color Ramp (Constant 3-step) with Emission for Bloom
  vec3 col;
  if (t < 0.14) { 
    col = vec3(3.5, 3.5, 3.5); // Glowy White
  } else if (t < 0.40) { 
    col = vec3(2.5, 0.0, 0.0); // Glowy Red
  } else { 
    col = vec3(0.0, 0.0, 3.0); // Glowy Blue
  }

  // LED Circle Mask logic from original pattern for consistency
  float distCircle = length(localUV - 0.5);
  float circle = smoothstep(0.45, 0.35, distCircle);
  
  // LOD logic: fade gaps when far away
  float fw = fwidth(vUv.y) * ROWS;
  float lodBlend = smoothstep(0.0, 0.29, fw); 
  float finalAlpha = mix(circle, 1.0, lodBlend);

  // Dark base color for unlit LEDs
  float unlit = 0.01;
  col = mix(vec3(unlit), col, 1.0); // Apply brightness to lit parts

  gl_FragColor = vec4(col * finalAlpha, 1.0);
}
`;

const patternWaveSaw: PatternDef = {
  name: 'Wave1_Saw',
  defaults: {
    uSpeed: 1.0,
    uParam1: 0.0,  // angle
    uParam2: 0.45, // scale
    uParam3: 0.0,  // dist
    uParam4: 0.15  // dScale
  },
  fragmentShader,
};

export default patternWaveSaw;
