#pragma once

#include <Arduino.h>
#include <math.h>
#include <stdint.h>
#include "config.h"
#include "core_display.h"
#include "core_encoders.h"

namespace LotusPattern {

const char* NAME = "Lotus";
const char* const KNOB_LABELS[4] = {"HUE", "SPEED", "PETALS", "FOLD"};

const float LOTUS_HUE_STEP = 0.05f;
const float LOTUS_SPEED_STEP = 0.05f;
const float LOTUS_PETALS_STEP = 0.5f;
const float LOTUS_FOLD_STEP = 0.05f;

struct Params {
    float hueBase;
    float speed;
    float petals;
    float fold;
    float timeAcc;
};

Params params;

float LOTUS_SIN_LUT[1024];

void setup() {
    params.hueBase = 0.85f;
    params.speed = 1.0f;
    params.petals = 6.0f;
    params.fold = 1.0f;
    params.timeAcc = 0.0f;

    for (int i = 0; i < 1024; i++) {
        LOTUS_SIN_LUT[i] = sinf((float)i * 0.00613592315f); // i / 1024.0 * TWO_PI
    }
}

void update(float dt, const InputFrame& input) {
    params.hueBase = fmodf(params.hueBase + input.knobDeltas[0] * LOTUS_HUE_STEP, 1.0f);
    if (params.hueBase < 0.0f) params.hueBase += 1.0f;
    
    params.speed += input.knobDeltas[1] * LOTUS_SPEED_STEP;
    if (params.speed < 0.0f) params.speed = 0.0f;
    
    params.petals = constrain(params.petals + input.knobDeltas[2] * LOTUS_PETALS_STEP, 3.0f, 16.0f);
    params.fold = constrain(params.fold + input.knobDeltas[3] * LOTUS_FOLD_STEP, 0.0f, 5.0f);
    
    params.timeAcc += dt * params.speed;
}

// Fast sine using precomputed LUT
inline float fastSin(float rad) {
    float val = fmodf(rad, 6.283185307f);
    if (val < 0.0f) val += 6.283185307f;
    int idx = (int)(val * 162.9746617f); // 1024 / TWO_PI
    return LOTUS_SIN_LUT[idx % 1024];
}

// Fast approximate arctangent
inline float fastAtan2(float y, float x) {
    if (x == 0.0f && y == 0.0f) return 0.0f;
    float ax = fabsf(x);
    float ay = fabsf(y);
    float a = (ax < ay) ? ax / ay : ay / ax;
    float s = a * a;
    float r = ((-0.0464964749f * s + 0.15931422f) * s - 0.327622764f) * s * a + a;
    if (ay > ax) r = 1.570796327f - r;
    if (x < 0.0f) r = 3.141592654f - r;
    if (y < 0.0f) r = -r;
    return r;
}

void hsvToRgb(float h, float s, float v, float &r, float &g, float &b) {
    h = fmodf(h, 1.0f);
    if (h < 0.0f) h += 1.0f;
    int i = (int)floorf(h * 6.0f);
    float f = h * 6.0f - i;
    float p = v * (1.0f - s);
    float q = v * (1.0f - f * s);
    float t = v * (1.0f - (1.0f - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
}

void draw() {
    float t = params.timeAcc;
    float cx = PANEL_RES_W * 0.5f;
    float cy = PANEL_RES_H * 0.5f;
    float p = floorf(params.petals);
    float fold = params.fold;
    int tFloor = (int)floorf(t * 10.0f);

    for (int y = 0; y < PANEL_RES_H; y++) {
        float dy = (float)y - cy;
        float ay = fabsf(dy);
        
        for (int x = 0; x < PANEL_RES_W; x++) {
            float dx = (float)x - cx;
            float ax = fabsf(dx);
            
            float angle = fastAtan2(dy, dx);
            
            // Fast approximate distance to avoid sqrtf in inner loop
            float max_a = ax > ay ? ax : ay;
            float min_a = ax < ay ? ax : ay;
            float dist = max_a + min_a * 0.375f;
            
            float petalWave = fastSin(angle * p + t * 2.0f);
            float targetDist = 15.0f + petalWave * 10.0f + fastSin(dist * 0.5f - t * 3.0f) * fold * 5.0f;
            
            float val = fabsf(dist - targetDist);
            
            float r = 0.0f, g = 0.0f, b = 0.0f;
            
            if (val < 1.5f) {
                // Bright outline
                hsvToRgb(params.hueBase, 0.5f, 1.0f, r, g, b);
            } else if (val < 5.0f && dist < targetDist) {
                // Inner petal glow (boosted brightness slightly for HUB75)
                float v = 1.0f - (val / 5.0f);
                v = constrain(0.1f + v * 1.1f, 0.0f, 1.0f);
                hsvToRgb(params.hueBase + 0.1f, 0.9f, v, r, g, b);
            } else if (dist < targetDist * 0.4f) {
                // Core
                if ((x + y + tFloor) % 3 == 0) {
                    hsvToRgb(params.hueBase + 0.4f, 1.0f, 1.0f, r, g, b);
                }
            } else if (val < 10.0f && dist > targetDist) {
                // Outer aura (boosted brightness slightly for HUB75)
                int angleMod = (int)floorf(angle * 20.0f);
                if (angleMod % 2 == 0) {
                    float v = 0.4f * (1.0f - val / 10.0f);
                    v = constrain(0.05f + v * 1.5f, 0.0f, 1.0f);
                    hsvToRgb(params.hueBase + 0.6f, 1.0f, v, r, g, b);
                }
            }
            
            dma_display->drawPixelRGB888(
                x, y,
                (uint8_t)constrain(r * 255.0f, 0.0f, 255.0f),
                (uint8_t)constrain(g * 255.0f, 0.0f, 255.0f),
                (uint8_t)constrain(b * 255.0f, 0.0f, 255.0f)
            );
        }
    }
}

} // namespace LotusPattern