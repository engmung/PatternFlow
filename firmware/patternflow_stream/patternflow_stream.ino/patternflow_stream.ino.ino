#include <Arduino.h>
#include "config.h"
#include "core_display.h"

MatrixPanel_I2S_DMA *dma_display = nullptr;

#include "core_streaming.h"
#include "web_index.h"
#include "core_network.h"

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== PatternFlow STREAM Booting ===");

  initDisplay();
  initStreaming();
  initNetwork();
  initWebServer();
  startRenderTask();   // ← 추가: Core 1에 렌더 태스크 핀

  Serial.println("Ready. Open http://patternflow.local");
}

void loop() {
  uint32_t now = millis();
  static uint32_t lastFpsLog = 0;

  httpServer.handleClient();
  wsStream.loop();
  wsControl.loop();

  if (now - lastFpsLog >= 1000) {
    Serial.printf("[stream] rx=%u  push=%u  clients=%u  drops=%u\n",
                  framesReceived, framesPushed,
                  wsStreamClientCount, framesDropped);
    framesReceived = 0;
    framesPushed = 0;
    framesDropped = 0;
    lastFpsLog = now;
  }

  if (lastFrameMs > 0 && (now - lastFrameMs) > 1500) {
    fadeOutStep();
  }
}