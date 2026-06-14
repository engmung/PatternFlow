#pragma once

#include <Arduino.h>
#include <math.h>
#include <stdint.h>
#include "config.h"
#include "src/core_display.h"
#include "src/core_encoders.h"
#include "src/core_canvas.h"
#include "src/core_math.h"
#include "src/core_color.h"

namespace FluidFlowPattern {

const char* NAME = "Fluid Flow";
const char* const KNOB_LABELS[4] = {"TURBULENCE", "VELOCITY", "DENSITY", "COLOR TWIST"};

const float FLUID_FLOW_SCALE_MIN = 0.0f;
const float FLUID_FLOW_SCALE_MAX = 1.0f;
const float FLUID_FLOW_SCALE_STEP = 0.05f;

const float FLUID_FLOW_SPEED_MIN = 0.1f;
const float FLUID_FLOW_SPEED_MAX = 10.0f;
const float FLUID_FLOW_SPEED_STEP = 0.10f;

const float FLUID_FLOW_DENSITY_MIN = 0.0f;
const float FLUID_FLOW_DENSITY_MAX = 4.9f;
const float FLUID_FLOW_DENSITY_STEP = 0.05f;

const float FLUID_FLOW_TWIST_MIN = 0.0f;
const float FLUID_FLOW_TWIST_MAX = 1.0f;
const float FLUID_FLOW_TWIST_STEP = 0.05f;

struct Params {
    float scale;
    float speed;
    float density;
    float twist;
    float timeAcc;
};

Params params;

void setup() {
    params.scale = 0.4f;
    params.speed = 2.5f;
    params.density = 2.0f;
    params.twist = 0.5f;
    params.timeAcc = 0.0f;

    PFMath::buildSinLUT();
}

void update(float dt, const InputFrame& input) {
    // Knob 1: Turbulence Scale (Wrap)
    params.scale += input.knobDeltas[0] * FLUID_FLOW_SCALE_STEP;
    if (params.scale > FLUID_FLOW_SCALE_MAX) params.scale -= (FLUID_FLOW_SCALE_MAX - FLUID_FLOW_SCALE_MIN);
    if (params.scale < FLUID_FLOW_SCALE_MIN) params.scale += (FLUID_FLOW_SCALE_MAX - FLUID_FLOW_SCALE_MIN);

    // Knob 2: Flow Velocity (Clamp)
    params.speed += input.knobDeltas[1] * FLUID_FLOW_SPEED_STEP;
    params.speed = constrain(params.speed, FLUID_FLOW_SPEED_MIN, FLUID_FLOW_SPEED_MAX);

    // Knob 3: Stream Density (Clamp)
    params.density += input.knobDeltas[2] * FLUID_FLOW_DENSITY_STEP;
    params.density = constrain(params.density, FLUID_FLOW_DENSITY_MIN, FLUID_FLOW_DENSITY_MAX);

    // Knob 4: Color Phase Twist (Wrap)
    params.twist += input.knobDeltas[3] * FLUID_FLOW_TWIST_STEP;
    if (params.twist > FLUID_FLOW_TWIST_MAX) params.twist -= (FLUID_FLOW_TWIST_MAX - FLUID_FLOW_TWIST_MIN);
    if (params.twist < FLUID_FLOW_TWIST_MIN) params.twist += (FLUID_FLOW_TWIST_MAX - FLUID_FLOW_TWIST_MIN);

    params.timeAcc += dt * params.speed;
}

void draw() {
    float t = params.timeAcc;
    float zoom = 0.03f + params.scale * 0.12f;
    float sharpness = 1.0f + params.density * 2.0f;

    // Precompute column-only and row-only warp components outside the inner pixel loop
    float pre_sin_Ax[PANEL_RES_W];
    float pre_cos_Cx[PANEL_RES_W];
    for (int x = 0; x < PANEL_RES_W; x++) {
        pre_sin_Ax[x] = PFMath::fastSin(x * zoom + t * 0.5f);
        pre_cos_Cx[x] = PFMath::fastCos(x * zoom * 1.7f - t * 0.4f);
    }

    float pre_cos_By[PANEL_RES_H];
    float pre_sin_Dy[PANEL_RES_H];
    for (int y = 0; y < PANEL_RES_H; y++) {
        pre_cos_By[y] = PFMath::fastCos(y * zoom - t * 0.3f);
        pre_sin_Dy[y] = PFMath::fastSin(y * zoom * 1.3f + t * 0.6f);
    }

    // Optimization: Calculate the lowest force output that would result in intensity > 0.1
    // to completely skip the powf() call and color computation in dark areas.
    float min_base = powf(0.1f, 1.0f / sharpness);

    for (int y = 0; y < PANEL_RES_H; y++) {
        for (int x = 0; x < PANEL_RES_W; x++) {
            float a1 = pre_sin_Ax[x] * pre_cos_By[y];
            float a2 = pre_cos_Cx[x] * pre_sin_Dy[y];

            float flowForce = PFMath::fastSin(x * 0.1f * a1 + y * 0.1f * a2 + t);
            float base = (flowForce + 1.0f) * 0.5f;

            if (base > min_base) {
                float intensity = powf(base, sharpness);

                // Note: mathematically, the angle simplifies such that we do not need PI here
                float directionHue = fmodf((a1 + a2) * params.twist + t * 0.02f, 1.0f);
                if (directionHue < 0.0f) {
                    directionHue += 1.0f;
                }

                uint8_t r, g, b;
                PFColor::hsvToRgb(directionHue, 0.9f, intensity, r, g, b);

                if (intensity > 0.85f) {
                    r = (r + 120 > 255) ? 255 : r + 120;
                    g = (g + 120 > 255) ? 255 : g + 120;
                    b = 255;
                }

                PFCanvas::setPixel(x, y, r, g, b);
            } else {
                PFCanvas::setPixel(x, y, 0, 0, 0);
            }
        }
    }

    PFCanvas::present();
}

} // namespace FluidFlowPattern