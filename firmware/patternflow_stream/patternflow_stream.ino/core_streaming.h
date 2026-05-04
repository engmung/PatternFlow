#pragma once
#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include "config.h"

constexpr size_t CHUNK_HEADER_SIZE = 6;
constexpr size_t FRAME_BYTES = PANEL_RES_W * PANEL_RES_H * 3;

// 트리플 버퍼: 동시에 세 곳에서 안전하게 작업
uint8_t bufA[FRAME_BYTES];
uint8_t bufB[FRAME_BYTES];
uint8_t bufC[FRAME_BYTES];
uint8_t* writeBuf = bufA;   // 네트워크가 채우는 중
uint8_t* readyBuf = bufB;   // 그릴 준비 됐고 대기 중
uint8_t* drawBuf  = bufC;   // 렌더 태스크가 그리는 중

portMUX_TYPE bufMux = portMUX_INITIALIZER_UNLOCKED;

volatile uint8_t  currentSeq = 0xFF;
volatile bool     frameReady = false;
volatile uint32_t lastFrameMs = 0;
volatile uint32_t framesReceived = 0;
volatile uint32_t framesDropped = 0;
volatile uint32_t framesPushed  = 0;

extern MatrixPanel_I2S_DMA *dma_display;

void initStreaming() {
  memset(bufA, 0, FRAME_BYTES);
  memset(bufB, 0, FRAME_BYTES);
  memset(bufC, 0, FRAME_BYTES);
}

void handleStreamChunk(const uint8_t* data, size_t len) {
  if (len < CHUNK_HEADER_SIZE) { framesDropped++; return; }

  uint8_t  seq        = data[0];
  uint16_t offset     = (data[1] << 8) | data[2];
  uint16_t payloadLen = (data[3] << 8) | data[4];
  uint8_t  flags      = data[5];
  bool     isLast     = flags & 0x01;

  if (offset + payloadLen > FRAME_BYTES)     { framesDropped++; return; }
  if (CHUNK_HEADER_SIZE + payloadLen != len) { framesDropped++; return; }

  if (offset == 0) {
    currentSeq = seq;
  } else if (seq != currentSeq) {
    framesDropped++;
    return;
  }

  memcpy(writeBuf + offset, data + CHUNK_HEADER_SIZE, payloadLen);

  if (isLast) {
    // writeBuf 완성 → readyBuf와 swap (drawBuf는 절대 안 건드림)
    portENTER_CRITICAL(&bufMux);
    uint8_t* tmp = writeBuf;
    writeBuf = readyBuf;
    readyBuf = tmp;
    frameReady = true;
    portEXIT_CRITICAL(&bufMux);
    
    lastFrameMs = millis();
    framesReceived++;
  }
}

void renderTask(void* param) {
  for (;;) {
    bool gotFrame = false;
    
    // ready → draw로 atomic swap
    portENTER_CRITICAL(&bufMux);
    if (frameReady) {
      uint8_t* tmp = drawBuf;
      drawBuf = readyBuf;
      readyBuf = tmp;
      frameReady = false;
      gotFrame = true;
    }
    portEXIT_CRITICAL(&bufMux);

    if (gotFrame) {
      // drawBuf는 이제 이 태스크 단독 소유 — 안전하게 천천히 그림
      const uint8_t* buf = drawBuf;
      for (int y = 0; y < PANEL_RES_H; y++) {
        const uint8_t* row = buf + y * PANEL_RES_W * 3;
        for (int x = 0; x < PANEL_RES_W; x++) {
          uint8_t r = row[x * 3];
          uint8_t g = row[x * 3 + 1];
          uint8_t b = row[x * 3 + 2];
          dma_display->drawPixelRGB888(x, y, r, g, b);
        }
      }
      dma_display->flipDMABuffer();
      framesPushed++;
    } else {
      vTaskDelay(1);
    }
  }
}

void startRenderTask() {
  xTaskCreatePinnedToCore(renderTask, "render", 8192, nullptr, 2, nullptr, 1);
}

void fadeOutStep() {
  static uint32_t lastFadeMs = 0;
  uint32_t now = millis();
  if (now - lastFadeMs < 50) return;
  lastFadeMs = now;

  bool any = false;
  for (size_t i = 0; i < FRAME_BYTES; i++) {
    if (drawBuf[i] > 0) {
      drawBuf[i] = (uint8_t)((drawBuf[i] * 88) / 100);
      any = true;
    }
  }
  if (any) {
    portENTER_CRITICAL(&bufMux);
    frameReady = true;     // 다음 루프에서 drawBuf 그리도록
    // 단 readyBuf와 swap은 안 함 (drawBuf 직접 변경한 거니까)
    portEXIT_CRITICAL(&bufMux);
  }
}