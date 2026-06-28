#pragma once

#include <Arduino.h>
#include "config.h"
#include "src/core_display.h"
#include "src/core_encoders.h"
#include "src/core_canvas.h"
#include "src/core_math.h"
#include "src/core_color.h"

namespace IsometricPillars {

    const char* NAME = "Iso Pillars";
    const char* const KNOB_LABELS[4] = {"Columns", "Speed", "Max Height", "Color Shift"};

    static float knob1 = 0.124f;
    static float knob2 = 1.598f;
    static float knob3 = 0.0f;
    static float knob4 = 0.568f;
    static float time_state = 0.0f;

    static void drawIsoPillar(int tx, int ty, int sx, int sy, int h, 
                              uint8_t rT, uint8_t gT, uint8_t bT, 
                              uint8_t rL, uint8_t gL, uint8_t bL, 
                              uint8_t rR, uint8_t gR, uint8_t bR) {
        int w = PANEL_RES_W;
        int dh = PANEL_RES_H;

        for (int dy = -sy; dy <= sy; dy++) {
            int span = (int)((1.0f - abs(dy) / (float)sy) * sx);
            for (int dx = -span; dx <= span; dx++) {
                int px = tx + dx;
                int py = ty + dy;
                if (px >= 0 && px < w && py >= 0 && py < dh) {
                    PFCanvas::setPixel(px, py, rT, gT, bT);
                }
            }
        }

        for (int dy = 0; dy < h; dy++) {
            for (int stepY = 0; stepY <= sy; stepY++) {
                int span = (int)(((float)stepY / sy) * sx);
                for (int dx = -span; dx < 0; dx++) {
                    int px = tx + dx;
                    int py = ty + sy + dy + stepY - sy;
                    if (px >= 0 && px < w && py >= 0 && py < dh) {
                        PFCanvas::setPixel(px, py, rL, gL, bL);
                    }
                }
            }
        }

        for (int dy = 0; dy < h; dy++) {
            for (int stepY = 0; stepY <= sy; stepY++) {
                int span = (int)(((float)stepY / sy) * sx);
                for (int dx = 0; dx <= span; dx++) {
                    int px = tx + dx;
                    int py = ty + sy + dy + stepY - sy;
                    if (px >= 0 && px < w && py >= 0 && py < dh) {
                        PFCanvas::setPixel(px, py, rR, gR, bR);
                    }
                }
            }
        }
    }

    void setup() {
        PFMath::buildSinLUT();
        time_state = 0.0f;
    }

    void update(float dt, const InputFrame& input) {
        knob1 += input.knobDeltas[0] * 0.05f;
        if (knob1 < 0.0f) knob1 = 0.0f; if (knob1 > 1.0f) knob1 = 1.0f;

        knob2 += input.knobDeltas[1] * 0.1f;
        if (knob2 < 0.1f) knob2 = 0.1f; if (knob2 > 10.0f) knob2 = 10.0f;

        knob3 += input.knobDeltas[2] * 0.05f;
        if (knob3 < 0.0f) knob3 = 0.0f; if (knob3 > 4.9f) knob3 = 4.9f;

        knob4 += input.knobDeltas[3] * 0.05f;
        if (knob4 < 0.0f) knob4 = 0.0f; if (knob4 > 1.0f) knob4 = 1.0f;

        time_state += dt * knob2 * 1.5f;
    }

    void draw() {
        for (int py = 0; py < PANEL_RES_H; py++) {
            for (int px = 0; px < PANEL_RES_W; px++) {
                PFCanvas::setPixel(px, py, 10, 10, 20);
            }
        }

        int cols = 8 + (int)(knob1 * 12);
        int rows = cols;
        const int sizeX = 8;
        const int sizeY = 4;
        float cx = PANEL_RES_W / 2.0f;
        float cy = PANEL_RES_H / 2.0f - 10.0f;
        float maxHeight = 10.0f + knob3 * 35.0f;

        for (int sum = 0; sum < rows + cols; sum++) {
            for (int r = 0; r < rows; r++) {
                int c = sum - r;
                if (c < 0 || c >= cols) continue;

                float isoX = cx + (c - r) * sizeX;
                float isoY = cy + (c + r) * sizeY;

                float dc = c - cols / 2.0f;
                float dr = r - rows / 2.0f;
                float dist = sqrtf(dc * dc + dr * dr);
                
                float wave = PFMath::fastSin(dist * 0.8f - time_state) * 0.5f + 0.5f;
                int height = (int)(wave * maxHeight);

                int tx = (int)isoX;
                int ty = (int)(isoY - height);

                float hue = wave * 0.3f + knob4;
                hue -= (int)hue;
                if (hue < 0.0f) hue += 1.0f;

                uint8_t rT, gT, bT;
                uint8_t rL, gL, bL;
                uint8_t rR, gR, bR;

                PFColor::hsvToRgb(hue, 0.85f, 0.95f, rT, gT, bT);
                PFColor::hsvToRgb(hue, 0.90f, 0.60f, rL, gL, bL);
                PFColor::hsvToRgb(hue, 0.95f, 0.40f, rR, gR, bR);

                drawIsoPillar(tx, ty, sizeX, sizeY, height, rT, gT, bT, rL, gL, bL, rR, gR, bR);
            }
        }

        PFCanvas::present();
    }

} // namespace IsometricPillars