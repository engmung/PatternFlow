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

// 아, 욕먹을 만했다. 미안하다.
// 프롬프트에 분명 "exact distance is not visually essential (정확한 거리가 시각적으로 중요하지 않을 때만)" 
// approxLength를 쓰라고 조건이 있었는데, 내가 최적화한답시고 동심원 패턴에 거리 근사치를 써버려서 
// 당연히 팔각형 찌그러짐(Octagonal artifact)이 발생한 거다.
// 원형 렌더링에 필수적인 부분이므로 PFMath::approxLength 대신 원본대로 sqrtf를 사용하도록 즉시 롤백했다.

namespace ConcentricVelvetRingsPattern {

const char* NAME = "Concentric Velvet Rings";
const char* const KNOB_LABELS[4] = {"RING FREQ", "VORTEX SPD", "EDGE SOFT", "THEME HUE"};

const float CONCENTRIC_VELVET_KNOB1_MIN = 0.0f;
const float CONCENTRIC_VELVET_KNOB1_MAX = 1.0f;
const float CONCENTRIC_VELVET_KNOB1_STEP = 0.05f;

const float CONCENTRIC_VELVET_KNOB2_MIN = 0.1f;
const float CONCENTRIC_VELVET_KNOB2_MAX = 10.0f;
const float CONCENTRIC_VELVET_KNOB2_STEP = 0.10f;

const float CONCENTRIC_VELVET_KNOB3_MIN = 0.0f;
const float CONCENTRIC_VELVET_KNOB3_MAX = 4.9f;
const float CONCENTRIC_VELVET_KNOB3_STEP = 0.05f;

const float CONCENTRIC_VELVET_KNOB4_MIN = 0.0f;
const float CONCENTRIC_VELVET_KNOB4_MAX = 1.0f;
const float CONCENTRIC_VELVET_KNOB4_STEP = 0.05f;

struct Params {
    float rawKnob1 = 0.3f;
    float rawKnob2 = 1.8f;
    float rawKnob3 = 0.444f;
    float rawKnob4 = 0.8f;

    float freq = 2.0f;
    float speed = 1.8f;
    float soft = 0.5f;
    float hue = 0.8f;

    float timeAcc = 0.0f;
};

Params params;

float dxArr[PANEL_RES_W];
float dyArr[PANEL_RES_H];
float powLUT[256];

void setup() {
    PFMath::buildSinLUT();

    params.rawKnob1 = (2.0f - 0.5f) / 5.0f; 
    params.rawKnob2 = 1.8f;
    params.rawKnob3 = (0.5f - 0.1f) / 0.9f;
    params.rawKnob4 = 0.8f;

    params.freq = 2.0f;
    params.speed = 1.8f;
    params.soft = 0.5f;
    params.hue = 0.8f;
    params.timeAcc = 0.0f;

    float cx = PANEL_RES_W / 2.0f;
    float cy = PANEL_RES_H / 2.0f;

    for (int x = 0; x < PANEL_RES_W; x++) {
        dxArr[x] = x - cx;
    }
    for (int y = 0; y < PANEL_RES_H; y++) {
        dyArr[y] = y - cy;
    }
}

void update(float dt, const InputFrame& input) {
    if (input.knobDeltas[0] != 0) {
        params.rawKnob1 += input.knobDeltas[0] * CONCENTRIC_VELVET_KNOB1_STEP;
        if (params.rawKnob1 > CONCENTRIC_VELVET_KNOB1_MAX) params.rawKnob1 -= (CONCENTRIC_VELVET_KNOB1_MAX - CONCENTRIC_VELVET_KNOB1_MIN);
        if (params.rawKnob1 < CONCENTRIC_VELVET_KNOB1_MIN) params.rawKnob1 += (CONCENTRIC_VELVET_KNOB1_MAX - CONCENTRIC_VELVET_KNOB1_MIN);
    }

    if (input.knobDeltas[1] != 0) {
        params.rawKnob2 += input.knobDeltas[1] * CONCENTRIC_VELVET_KNOB2_STEP;
        params.rawKnob2 = constrain(params.rawKnob2, CONCENTRIC_VELVET_KNOB2_MIN, CONCENTRIC_VELVET_KNOB2_MAX);
    }

    if (input.knobDeltas[2] != 0) {
        params.rawKnob3 += input.knobDeltas[2] * CONCENTRIC_VELVET_KNOB3_STEP;
        params.rawKnob3 = constrain(params.rawKnob3, CONCENTRIC_VELVET_KNOB3_MIN, CONCENTRIC_VELVET_KNOB3_MAX);
    }

    if (input.knobDeltas[3] != 0) {
        params.rawKnob4 += input.knobDeltas[3] * CONCENTRIC_VELVET_KNOB4_STEP;
        if (params.rawKnob4 > CONCENTRIC_VELVET_KNOB4_MAX) params.rawKnob4 -= (CONCENTRIC_VELVET_KNOB4_MAX - CONCENTRIC_VELVET_KNOB4_MIN);
        if (params.rawKnob4 < CONCENTRIC_VELVET_KNOB4_MIN) params.rawKnob4 += (CONCENTRIC_VELVET_KNOB4_MAX - CONCENTRIC_VELVET_KNOB4_MIN);
    }

    params.freq = 0.5f + params.rawKnob1 * 5.0f;
    params.speed = params.rawKnob2;
    params.soft = 0.1f + params.rawKnob3 * 0.9f;
    params.hue = params.rawKnob4;

    params.timeAcc += dt * params.speed;

    float power = params.soft * 3.0f;
    for (int i = 0; i < 256; i++) {
        powLUT[i] = powf(i / 255.0f, power);
    }
}

void draw() {
    for (int y = 0; y < PANEL_RES_H; y++) {
        float dy = dyArr[y];
        for (int x = 0; x < PANEL_RES_W; x++) {
            float dx = dxArr[x];

            // 완벽한 원형 렌더링을 위해 sqrtf 복구 (approxLength 사용 안 함)
            float dist = sqrtf(dx * dx + dy * dy) * 0.1f;
            float wave = PFMath::fastSin(dist * params.freq - params.timeAcc);
            
            float smoothSigBase = fabsf(wave);
            
            int lutIdx = constrain((int)(smoothSigBase * 255.0f), 0, 255);
            float smoothSig = powLUT[lutIdx];

            uint8_t outR = 0, outG = 0, outB = 0;

            if (smoothSig > 0.05f) {
                float hVal = fmodf(params.hue + dist * 0.01f, 1.0f);
                if (hVal < 0.0f) hVal += 1.0f; 

                uint8_t r8, g8, b8;
                PFColor::hsvToRgb(hVal, 0.85f, smoothSig, r8, g8, b8);
                
                int r = r8;
                int g = g8;
                int b = b8;

                if (smoothSig > 0.9f) {
                    r = constrain(r + 80, 0, 255);
                    g = constrain(g + 80, 0, 255);
                    b = constrain(b + 80, 0, 255);
                }

                outR = r;
                outG = g;
                outB = b;
            }

            PFCanvas::setPixel(x, y, outR, outG, outB);
        }
    }
    
    PFCanvas::present();
}

} // namespace ConcentricVelvetRingsPattern