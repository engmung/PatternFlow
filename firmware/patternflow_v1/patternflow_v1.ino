#include <Arduino.h>
#include "config.h"
#include "core_display.h"

// 1. 공통 시스템 실체화
MatrixPanel_I2S_DMA *dma_display = nullptr; 
#include "core_encoders.h"

// 2. 현재 활성화할 패턴 장착
#include "pattern_origin.h"
#include "pattern_wave1.h"

// 3. 패턴 레지스트리
struct PatternEntry {
  const char* name;
  const char* const* knobLabels;
  void (*setup)();
  void (*update)(float, const InputFrame&);
  void (*draw)();
};

PatternEntry patterns[] = {
  {Origin::NAME, Origin::KNOB_LABELS, Origin::setup, Origin::update, Origin::draw},
  {Wave1::NAME, Wave1::KNOB_LABELS, Wave1::setup, Wave1::update, Wave1::draw},
};

const int NUM_PATTERNS = sizeof(patterns) / sizeof(patterns[0]);
int currentPatternIdx = 0;

enum AppMode {
  MODE_RUNNING,    // 일반 패턴 실행 중
  MODE_SELECTING   // 패턴 선택 모드
};
AppMode currentMode = MODE_RUNNING;

unsigned long lastMs = 0;

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== PatternFlow OS Booting... ===");

  initEncoders();
  initDisplay();

  // 모든 패턴 초기화
  for (int i = 0; i < NUM_PATTERNS; i++) {
    patterns[i].setup();
  }
  
  Serial.printf("Current Pattern: %s\n", patterns[currentPatternIdx].name);
  lastMs = millis();
}

void drawSelectingMode() {
  dma_display->fillScreen(0);
  
  uint16_t screenW = dma_display->width();
  uint16_t screenH = dma_display->height();

  // 1. 페이지 인디케이터 (상단)
  char pageStr[16];
  snprintf(pageStr, sizeof(pageStr), "%d / %d", currentPatternIdx + 1, NUM_PATTERNS);
  
  int16_t x1, y1; uint16_t w, h;
  dma_display->setTextSize(1);
  dma_display->setTextColor(dma_display->color565(100, 100, 100));
  dma_display->getTextBounds(pageStr, 0, 0, &x1, &y1, &w, &h);
  dma_display->setCursor((screenW - w) / 2, 10);
  dma_display->print(pageStr);

  // 2. 현재 패턴 이름 (중앙)
  const char* name = patterns[currentPatternIdx].name;
  // 글자 수에 따라 사이즈 조절 (임시)
  dma_display->setTextSize(strlen(name) > 8 ? 1 : 2);
  dma_display->setTextColor(dma_display->color565(255, 255, 255));
  dma_display->getTextBounds(name, 0, 0, &x1, &y1, &w, &h);
  dma_display->setCursor((screenW - w) / 2, (screenH / 2) - (h / 2));
  dma_display->print(name);
  
  // 3. 안내 문구 (하단)
  const char* hint = "HOLD TO SELECT";
  dma_display->setTextSize(1);
  dma_display->setTextColor(dma_display->color565(150, 150, 150));
  dma_display->getTextBounds(hint, 0, 0, &x1, &y1, &w, &h);
  dma_display->setCursor((screenW - w) / 2, screenH - h - 15);
  dma_display->print(hint);
}

void loop() {
  unsigned long now = millis();
  float dt = (now - lastMs) / 1000.0f;
  lastMs = now;

  // 1. 입력 상태 스냅샷 (InputFrame 채우기)
  static long prevKnobs[4] = {0, 0, 0, 0};
  InputFrame input;
  input.now = (uint32_t)now;
  
  input.knobs[0] = getClicks(0);
  input.knobs[1] = getClicks(1);
  input.knobs[2] = getClicks(2);
  input.knobs[3] = getClicks(3);

  for (int i = 0; i < 4; i++) {
    input.knobDeltas[i] = (int)(input.knobs[i] - prevKnobs[i]);
    prevKnobs[i] = input.knobs[i];
  }

  input.btnPressed[0] = btn1.pressed();
  input.btnPressed[1] = btn2.pressed();
  input.btnPressed[2] = btn3.pressed();
  input.btnPressed[3] = btn4.pressed();

  input.btnHeld[0] = btn1.isDown();
  input.btnHeld[1] = btn2.isDown();
  input.btnHeld[2] = btn3.isDown();
  input.btnHeld[3] = btn4.isDown();

  // 1-1. 모드 전환 로직 (Encoder 4 Long Press)
  if (btn4.longPressed(1000)) {
    if (currentMode == MODE_RUNNING) {
      currentMode = MODE_SELECTING;
      dma_display->setRotation(1); // 세로 모드 진입
      Serial.printf(">>> SELECT MODE ENTERED: %s\n", patterns[currentPatternIdx].name);
    } else {
      currentMode = MODE_RUNNING;
      dma_display->setRotation(0); // 원복
      Serial.printf(">>> RUNNING MODE: %s\n", patterns[currentPatternIdx].name);
    }
  }

  // 2. 모드별 동작
  if (currentMode == MODE_RUNNING) {
    // 일반 실행 모드
    patterns[currentPatternIdx].update(dt, input);
    patterns[currentPatternIdx].draw();
  } else {
    // 패턴 선택 모드
    if (input.knobDeltas[3] != 0) {
      currentPatternIdx += input.knobDeltas[3];
      // 순환 처리
      if (currentPatternIdx < 0) currentPatternIdx += NUM_PATTERNS;
      currentPatternIdx %= NUM_PATTERNS;
      Serial.printf("SELECTING: %s\n", patterns[currentPatternIdx].name);
    }

    // 화면 표시 (UI 그리기)
    drawSelectingMode();
  }

  // 3. 화면 송출
  dma_display->flipDMABuffer();
}