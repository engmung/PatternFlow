#pragma once
#include <ESP32-HUB75-MatrixPanel-I2S-DMA.h>
#include "config.h"

extern MatrixPanel_I2S_DMA *dma_display;

inline void initDisplay() {
  HUB75_I2S_CFG::i2s_pins _pins = {
    R1_PIN, G1_PIN, B1_PIN, R2_PIN, G2_PIN, B2_PIN,
    PIN_A, PIN_B, PIN_C, PIN_D, PIN_E, LAT_PIN, OE_PIN, CLK_PIN
  };
  HUB75_I2S_CFG mxconfig(PANEL_RES_W, PANEL_RES_H, PANEL_CHAIN, _pins);
  
  mxconfig.clkphase    = false;
  mxconfig.double_buff = true;
  
  // ★ 핵심 변경: WiFi 간섭 줄이기
  mxconfig.i2sspeed = HUB75_I2S_CFG::HZ_10M;   // 디폴트 20M → 10M
  mxconfig.latch_blanking = 2;                  // 패널 안정화
  
  // ★ PSRAM에 DMA 버퍼 두지 않음 (WiFi 충돌 회피)
  // 라이브러리가 자동으로 PSRAM 쓰는 옵션이 빌드 플래그라 코드에선 못 끄지만,
  // 만약 build_opt.h나 build flag로 SPIRAM_DMA_BUFFER 켜져 있다면 꺼야 함

  mxconfig.setPixelColorDepthBits(6);
  
  dma_display = new MatrixPanel_I2S_DMA(mxconfig);
  if (!dma_display->begin()) {
    Serial.println("Matrix begin FAILED");
    while (1) delay(1000);
  }
  dma_display->setBrightness8(DEFAULT_BRIGHTNESS);
  dma_display->clearScreen();
}