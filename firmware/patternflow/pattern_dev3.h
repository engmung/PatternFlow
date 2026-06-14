#pragma once

#include <Arduino.h>
#include <math.h>
#include <stdint.h>
#include "config.h"
#include "src/core_display.h"
#include "src/core_encoders.h"
#include "src/core_canvas.h"
#include "src/core_math.h"

namespace FoldedCrossMatrixPattern {

const char* NAME = "Folded Matrix";
const char* const KNOB_LABELS[4] = {"DENSITY", "CORE SPEED", "FOLD LIMIT", "COLOR MASK"};

const float FOLDED_CROSS_MATRIX_SCALE_MIN = 0.0f;
const float FOLDED_CROSS_MATRIX_SCALE_MAX = 1.0f;
const float FOLDED_CROSS_MATRIX_SCALE_STEP = 0.05f;

const float FOLDED_CROSS_MATRIX_SPEED_MIN = 0.1f;
const float FOLDED_CROSS_MATRIX_SPEED_MAX = 10.0f;
const float FOLDED_CROSS_MATRIX_SPEED_STEP = 0.10f;

const float FOLDED_CROSS_MATRIX_FOLDS_MIN = 0.0f;
const float FOLDED_CROSS_MATRIX_FOLDS_MAX = 4.9f;
const float FOLDED_CROSS_MATRIX_FOLDS_STEP = 0.05f;

const float FOLDED_CROSS_MATRIX_COLOR_MASK_MIN = 0.0f;
const float FOLDED_CROSS_MATRIX_COLOR_MASK_MAX = 1.0f;
const float FOLDED_CROSS_MATRIX_COLOR_MASK_STEP = 0.05f;

struct Params {
    float scale;
    float speed;
    float folds;
    float colorMask;
    float timeAcc;
};

Params params;

void setup() {
    params.scale = 0.5f;
    params.speed = 2.0f;
    params.folds = 2.5f;
    params.colorMask = 0.3f;
    params.timeAcc = 0.0f;

    PFMath::buildSinLUT();
}

void update(float dt, const InputFrame& input) {
    // Knob 1: Matrix Scale/Density (Wrap)
    params.scale += input.knobDeltas[0] * FOLDED_CROSS_MATRIX_SCALE_STEP;
    if (params.scale > FOLDED_CROSS_MATRIX_SCALE_MAX) params.scale -= (FOLDED_CROSS_MATRIX_SCALE_MAX - FOLDED_CROSS_MATRIX_SCALE_MIN);
    if (params.scale < FOLDED_CROSS_MATRIX_SCALE_MIN) params.scale += (FOLDED_CROSS_MATRIX_SCALE_MAX - FOLDED_CROSS_MATRIX_SCALE_MIN);

    // Knob 2: Translation Core Speed (Clamp)
    params.speed += input.knobDeltas[1] * FOLDED_CROSS_MATRIX_SPEED_STEP;
    params.speed = constrain(params.speed, FOLDED_CROSS_MATRIX_SPEED_MIN, FOLDED_CROSS_MATRIX_SPEED_MAX);

    // Knob 3: Spatial Tiling Grid Fold Limit (Clamp)
    params.folds += input.knobDeltas[2] * FOLDED_CROSS_MATRIX_FOLDS_STEP;
    params.folds = constrain(params.folds, FOLDED_CROSS_MATRIX_FOLDS_MIN, FOLDED_CROSS_MATRIX_FOLDS_MAX);

    // Knob 4: Color Inversion Mask State (Wrap)
    params.colorMask += input.knobDeltas[3] * FOLDED_CROSS_MATRIX_COLOR_MASK_STEP;
    if (params.colorMask > FOLDED_CROSS_MATRIX_COLOR_MASK_MAX) params.colorMask -= (FOLDED_CROSS_MATRIX_COLOR_MASK_MAX - FOLDED_CROSS_MATRIX_COLOR_MASK_MIN);
    if (params.colorMask < FOLDED_CROSS_MATRIX_COLOR_MASK_MIN) params.colorMask += (FOLDED_CROSS_MATRIX_COLOR_MASK_MAX - FOLDED_CROSS_MATRIX_COLOR_MASK_MIN);

    params.timeAcc += dt * params.speed;
}

void draw() {
    float t = params.timeAcc;

    int fSize = 8 + (int)floorf(params.scale * 24.0f);
    int fSize2 = fSize * 2;
    float foldLimit = params.folds;

    // Precompute column-only and row-only warp components outside the inner pixel loop
    float pre_sin_fx_02[PANEL_RES_W];
    float pre_cos_fx_01[PANEL_RES_W];
    for (int x = 0; x < PANEL_RES_W; x++) {
        float fx = fabsf((float)((x % fSize2) - fSize)) * foldLimit;
        pre_sin_fx_02[x] = PFMath::fastSin(fx * 0.2f + t);
        pre_cos_fx_01[x] = PFMath::fastCos(fx * 0.1f - t * 1.5f);
    }

    float pre_cos_fy_02[PANEL_RES_H];
    float pre_sin_fy_01[PANEL_RES_H];
    for (int y = 0; y < PANEL_RES_H; y++) {
        float fy = fabsf((float)((y % fSize2) - fSize)) * foldLimit;
        pre_cos_fy_02[y] = PFMath::fastCos(fy * 0.2f - t);
        pre_sin_fy_01[y] = PFMath::fastSin(fy * 0.1f + t);
    }

    for (int y = 0; y < PANEL_RES_H; y++) {
        for (int x = 0; x < PANEL_RES_W; x++) {
            
            float crossA = pre_sin_fx_02[x] * pre_cos_fy_02[y];
            float crossB = pre_cos_fx_01[x] * pre_sin_fy_01[y];
            
            float combined = fabsf(crossA + crossB);

            uint8_t r = 0, g = 0, b = 0;

            if (combined > 0.65f) {
                float mask = params.colorMask;
                float edge = (combined - 0.65f) / 0.35f;

                // Absolute punchy neon fill colors
                if (mask < 0.5f) {
                    float rF = 255.0f * edge;
                    float bF = 120.0f + 135.0f * (1.0f - edge);
                    
                    r = constrain((int)rF, 0, 255);
                    g = 0;
                    b = constrain((int)bF, 0, 255);
                } else {
                    float gF = 255.0f * edge;
                    float bF = 180.0f * edge;
                    
                    r = 0;
                    g = constrain((int)gF, 0, 255);
                    b = constrain((int)bF, 0, 255);
                }

                // Sharp laser lines tracking intersections
                if (combined > 0.92f) {
                    r = 255; 
                    g = 255; 
                    b = 255;
                }
            } else if (combined < 0.08f) {
                // Sharp vector dots tracking inverse centers
                r = 255; 
                g = 255; 
                b = 0;
            }

            PFCanvas::setPixel(x, y, r, g, b);
        }
    }

    PFCanvas::present();
}

} // namespace FoldedCrossMatrixPattern