// ═══════════════════════════════════════════════════════════
// PatternFlow - Shared math helpers (sin LUT, fast trig, fract)
// Used by patterns to avoid duplicating LUTs and trig wrappers.
// Call PFMath::buildSinLUT() once from setup() before drawing.
// License: MIT
// ═══════════════════════════════════════════════════════════
#pragma once

#include <Arduino.h>
#include <math.h>

namespace PFMath {

constexpr int SIN_LUT_SIZE = 256;
constexpr float TWO_PI_F = 6.28318530717958647692f;
constexpr float INV_TWO_PI_F = 0.15915494309189533577f;

inline float sinLUT[SIN_LUT_SIZE];
inline bool sinLUTReady = false;

inline void buildSinLUT() {
  if (sinLUTReady) return;
  for (int i = 0; i < SIN_LUT_SIZE; i++) {
    sinLUT[i] = sinf((float)i / (float)SIN_LUT_SIZE * TWO_PI_F);
  }
  sinLUTReady = true;
}

inline float fract(float x) {
  return x - floorf(x);
}

inline float fastSin(float x) {
  float n = x * INV_TWO_PI_F;
  n -= floorf(n);
  if (n < 0.0f) n += 1.0f;
  return sinLUT[(int)(n * SIN_LUT_SIZE) & (SIN_LUT_SIZE - 1)];
}

inline float fastCos(float x) {
  return fastSin(x + (float)M_PI_2);
}

inline float lerp(float a, float b, float t) {
  return a + (b - a) * t;
}

} // namespace PFMath
