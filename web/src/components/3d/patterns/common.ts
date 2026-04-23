// Common vertex shader shared by all patterns
export const patternVert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Pattern type definition
export interface PatternDef {
  name: string;
  fragmentShader: string;
  // Default uniform values (all patterns share these base uniforms)
  defaults?: {
    uSpeed?: number;
    uParam1?: number;
    uParam2?: number;
    uParam3?: number;
    uParam4?: number;
  };
}
