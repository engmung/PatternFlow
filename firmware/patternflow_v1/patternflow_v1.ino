// ═══════════════════════════════════════════════════════════
// PatternFlow — ESP32-S3 + 4 Rotary Encoders + HUB75 128x64
// + Arduino OTA (For Developers)
//
// Encoder 1 → Hue        🎨 (10° steps, rotation wrap)
// Encoder 2 → Speed      ⏩ (0.0~5.0, 0.2 steps) ← Modified
// Encoder 3 → Mode       🔀 (5 presets)
// Encoder 4 → Freq       〰️ (50~1000)
//
// Each encoder button → Reset corresponding parameter to 0 (or default)
//   - Speed button: 0.0 (Complete stop)
//   - Hue button: 0° (Red)
//   - Mode button: Preset 0
//   - Freq button: 0 (Effectively static pattern)
//
// ⚠️ Encoders mounted on the back of PCB → INVERT_ENCODER = 1
// ═══════════════════════════════════════════════════════════

#include <ESP32-HUB75-MatrixPanel-I2S-DMA.h>
#include <WiFi.h>
#include <ArduinoOTA.h>
#include <ESPmDNS.h>
#include <math.h>
#include "config.h"

// ═══════════════════════════════════════════════════════════
// WiFi Settings — Modify according to your environment
// ═══════════════════════════════════════════════════════════
const char* WIFI_SSID = "wifiiii";
const char* WIFI_PASS = "lsh678902";
const char* OTA_HOSTNAME = "patternflow";   // patternflow.local

MatrixPanel_I2S_DMA *dma_display = nullptr;

// ─── OTA Status ───
volatile bool otaInProgress = false;

// ═══════════════════════════════════════════════════════════
// Encoders (Interrupt-based)
// ═══════════════════════════════════════════════════════════
volatile long encPos[4]      = {0, 0, 0, 0};
volatile uint8_t encState[4] = {0, 0, 0, 0};

static inline void IRAM_ATTR handleEncoder(int idx, int pinA, int pinB) {
  uint8_t s = (digitalRead(pinA) << 1) | digitalRead(pinB);
  uint8_t combined = (encState[idx] << 2) | s;
  switch (combined) {
    case 0b0001: case 0b0111: case 0b1110: case 0b1000:
#if INVERT_ENCODER
      encPos[idx]--;
#else
      encPos[idx]++;
#endif
      break;
    case 0b0010: case 0b1011: case 0b1101: case 0b0100:
#if INVERT_ENCODER
      encPos[idx]++;
#else
      encPos[idx]--;
#endif
      break;
  }
  encState[idx] = s;
}

void IRAM_ATTR isr1() { handleEncoder(0, ENC1_A, ENC1_B); }
void IRAM_ATTR isr2() { handleEncoder(1, ENC2_A, ENC2_B); }
void IRAM_ATTR isr3() { handleEncoder(2, ENC3_A, ENC3_B); }
void IRAM_ATTR isr4() { handleEncoder(3, ENC4_A, ENC4_B); }

inline long getClicks(int idx) { return encPos[idx] / 4; }

// ─── Buttons ───
struct Button {
  int pin;
  bool lastState = HIGH;
  uint32_t lastMs = 0;
  void begin(int p) { pin = p; pinMode(pin, INPUT_PULLUP); }
  bool pressed() {
    bool cur = digitalRead(pin);
    uint32_t now = millis();
    if (cur != lastState && (now - lastMs) > 50) {
      lastMs = now;
      lastState = cur;
      if (cur == LOW) return true;
    }
    return false;
  }
};
Button btn1, btn2, btn3, btn4;

// ═══════════════════════════════════════════════════════════
// Parameters
// ═══════════════════════════════════════════════════════════
struct Params {
  int hueDeg = 0;        // 0~360
  float speed = 2.0f;    // 0.0~5.0 ← New parameter
  int mode = 0;          // 0~4
  int freq = 110;        // 0~1000
};
Params params;

// ═══════════════════════════════════════════════════════════
// Pattern Presets
// ═══════════════════════════════════════════════════════════
struct PatternPreset {
  int rows, cols, gap, tileSize, gridStep, gridCells;
};

#define NUM_PRESETS 5
const PatternPreset presets[NUM_PRESETS] = {
  { 1, 2,  4, 56, 7, 8 },
  { 2, 4,  3, 27, 3, 9 },
  { 3, 6,  2, 18, 3, 6 },
  { 3, 6,  2, 18, 2, 9 },
  { 6, 12, 0, 10, 2, 5 },
};

int curMode = -1;
int totalW, totalH, offsetX, offsetY;

#define MAX_GRID_CELLS 9
float distLUT[MAX_GRID_CELLS][MAX_GRID_CELLS];

void applyPreset(int idx) {
  const PatternPreset &p = presets[idx];
  totalW = p.cols * p.tileSize + (p.cols + 1) * p.gap;
  totalH = p.rows * p.tileSize + (p.rows + 1) * p.gap;
  offsetX = (PANEL_RES_W - totalW) / 2;
  offsetY = (PANEL_RES_H - totalH) / 2;

  float cx = p.tileSize / 2.0f;
  for (int gy = 0; gy < p.gridCells; gy++)
    for (int gx = 0; gx < p.gridCells; gx++) {
      float dx = gx * p.gridStep + p.gridStep / 2.0f - cx;
      float dy = gy * p.gridStep + p.gridStep / 2.0f - cx;
      distLUT[gy][gx] = sqrtf(dx * dx + dy * dy);
    }
  curMode = idx;
}

// ─── Sin LUT ───
#define SIN_LUT_SIZE 256
float sinLUT[SIN_LUT_SIZE];

void buildSinLUT() {
  for (int i = 0; i < SIN_LUT_SIZE; i++)
    sinLUT[i] = sinf((float)i / SIN_LUT_SIZE * 2.0f * PI);
}

inline float fastSin(float x) {
  float norm = x / (2.0f * PI);
  norm -= floorf(norm);
  if (norm < 0) norm += 1.0f;
  return sinLUT[(int)(norm * SIN_LUT_SIZE) & (SIN_LUT_SIZE - 1)];
}

// ─── HSV → RGB ───
void hsvToRgb(float h, float s, float v, uint8_t &r, uint8_t &g, uint8_t &b) {
  float c = v * s;
  float x = c * (1.0f - fabsf(fmodf(h * 6.0f, 2.0f) - 1.0f));
  float m = v - c;
  float rf, gf, bf;
  switch ((int)(h * 6.0f) % 6) {
    case 0: rf=c; gf=x; bf=0; break;
    case 1: rf=x; gf=c; bf=0; break;
    case 2: rf=0; gf=c; bf=x; break;
    case 3: rf=0; gf=x; bf=c; break;
    case 4: rf=x; gf=0; bf=c; break;
    default: rf=c; gf=0; bf=x; break;
  }
  r = (uint8_t)((rf + m) * 255.0f);
  g = (uint8_t)((gf + m) * 255.0f);
  b = (uint8_t)((bf + m) * 255.0f);
}

// ─── Color Ramp ───
struct ColorStop { float position; uint8_t r, g, b; };
#define NUM_STOPS 5
ColorStop colorRamp[NUM_STOPS];

void updateColorRamp(float hue) {
  uint8_t hr, hg, hb;
  hsvToRgb(hue, 1.0f, 1.0f, hr, hg, hb);
  colorRamp[0] = {0.000f, 0, 0, 0};
  colorRamp[1] = {0.154f, 40, 40, 40};
  colorRamp[2] = {0.556f, hr, hg, hb};
  colorRamp[3] = {0.816f, 255, 255, 255};
  colorRamp[4] = {1.000f, 255, 255, 255};
}

void sampleColorRamp(float val, uint8_t &r, uint8_t &g, uint8_t &b) {
  float t = (val + 1.0f) * 0.5f;
  t = constrain(t, 0.0f, 1.0f);
  r = colorRamp[0].r; g = colorRamp[0].g; b = colorRamp[0].b;
  for (int i = 0; i < NUM_STOPS; i++) {
    if (t >= colorRamp[i].position) {
      r = colorRamp[i].r; g = colorRamp[i].g; b = colorRamp[i].b;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Pattern Rendering
// To add other patterns in the future, add functions here
// and branch inside renderCurrent() (currently only one 'Concentric' pattern)
// ═══════════════════════════════════════════════════════════
void renderConcentric(float phase) {
  const PatternPreset &p = presets[curMode];
  updateColorRamp(params.hueDeg / 360.0f);

  float br = 80.0f / 100.0f;
  int cellW = p.tileSize + p.gap;
  int cellH = p.tileSize + p.gap;
  float curFreqBase = (float)params.freq;
  float curFreqVar  = (float)params.freq * 0.9f;

  for (int y = 0; y < PANEL_RES_H; y++) {
    for (int x = 0; x < PANEL_RES_W; x++) {
      int lx = x - offsetX;
      int ly = y - offsetY;
      int ti = (lx - p.gap) / cellW;
      int tj = (ly - p.gap) / cellH;

      if (ti < 0 || ti >= p.cols || tj < 0 || tj >= p.rows) {
        dma_display->drawPixelRGB888(x, y, 0, 0, 0);
        continue;
      }

      int localX = lx - (p.gap + ti * cellW);
      int localY = ly - (p.gap + tj * cellH);

      if (localX < 0 || localX >= p.tileSize || localY < 0 || localY >= p.tileSize) {
        dma_display->drawPixelRGB888(x, y, 0, 0, 0);
        continue;
      }

      int gx = localX / p.gridStep;
      int gy = localY / p.gridStep;
      if (gx >= p.gridCells) gx = p.gridCells - 1;
      if (gy >= p.gridCells) gy = p.gridCells - 1;

      float dist = distLUT[gy][gx];
      float tileFreq = curFreqBase + (tj * p.cols + ti) * curFreqVar * 0.15f;
      float wave = fastSin(dist * tileFreq * 0.5f + phase);

      uint8_t r, g, b;
      sampleColorRamp(wave * br, r, g, b);
      dma_display->drawPixelRGB888(x, y, r, g, b);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Setup
// ═══════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== PatternFlow ESP32-S3 ===");

  // ─── Initialize Encoders ───
  pinMode(ENC1_A, INPUT_PULLUP); pinMode(ENC1_B, INPUT_PULLUP);
  pinMode(ENC2_A, INPUT_PULLUP); pinMode(ENC2_B, INPUT_PULLUP);
  pinMode(ENC3_A, INPUT_PULLUP); pinMode(ENC3_B, INPUT_PULLUP);
  pinMode(ENC4_A, INPUT_PULLUP); pinMode(ENC4_B, INPUT_PULLUP);

  encState[0] = (digitalRead(ENC1_A) << 1) | digitalRead(ENC1_B);
  encState[1] = (digitalRead(ENC2_A) << 1) | digitalRead(ENC2_B);
  encState[2] = (digitalRead(ENC3_A) << 1) | digitalRead(ENC3_B);
  encState[3] = (digitalRead(ENC4_A) << 1) | digitalRead(ENC4_B);

  attachInterrupt(ENC1_A, isr1, CHANGE);
  attachInterrupt(ENC1_B, isr1, CHANGE);
  attachInterrupt(ENC2_A, isr2, CHANGE);
  attachInterrupt(ENC2_B, isr2, CHANGE);
  attachInterrupt(ENC3_A, isr3, CHANGE);
  attachInterrupt(ENC3_B, isr3, CHANGE);
  attachInterrupt(ENC4_A, isr4, CHANGE);
  attachInterrupt(ENC4_B, isr4, CHANGE);

  btn1.begin(ENC1_SW);
  btn2.begin(ENC2_SW);
  btn3.begin(ENC3_SW);
  btn4.begin(ENC4_SW);

  Serial.println("Encoders ready");

  // ─── Initialize Matrix ───
  HUB75_I2S_CFG::i2s_pins _pins = {
    R1_PIN, G1_PIN, B1_PIN, R2_PIN, G2_PIN, B2_PIN,
    PIN_A, PIN_B, PIN_C, PIN_D, PIN_E, LAT_PIN, OE_PIN, CLK_PIN
  };
  HUB75_I2S_CFG mxconfig(PANEL_RES_W, PANEL_RES_H, PANEL_CHAIN, _pins);
  mxconfig.clkphase    = false;
  mxconfig.double_buff = true;

  dma_display = new MatrixPanel_I2S_DMA(mxconfig);
  if (!dma_display->begin()) {
    Serial.println("Matrix begin FAILED");
    while (1) delay(1000);
  }
  dma_display->setBrightness8(DEFAULT_BRIGHTNESS);
  dma_display->clearScreen();

  buildSinLUT();
  applyPreset(0);
  updateColorRamp(0.0f);

  // ─── WiFi Connection (15s timeout) ───
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi connecting");
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 15000) {
    delay(300);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi OK. IP: %s\n", WiFi.localIP().toString().c_str());

    // ─── Configure OTA ───
    ArduinoOTA.setHostname(OTA_HOSTNAME);
    ArduinoOTA
      .onStart([]() {
        Serial.println("OTA Start");
        otaInProgress = true;
        if (dma_display) dma_display->clearScreen();
      })
      .onEnd([]() {
        Serial.println("\nOTA End");
      })
      .onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("OTA %u%%\r", (progress * 100) / total);
      })
      .onError([](ota_error_t error) {
        Serial.printf("OTA Error[%u]\n", error);
        otaInProgress = false;
      });
    ArduinoOTA.begin();
    Serial.printf("OTA ready: %s.local\n", OTA_HOSTNAME);
  } else {
    Serial.println("\nWiFi FAILED — running without OTA");
  }

  Serial.println("\n--- Controls ---");
  Serial.println("E1: Hue (btn=0°)");
  Serial.println("E2: Speed 0~5 (btn=stop/0)");
  Serial.println("E3: Mode 0~4 (btn=mode 0)");
  Serial.println("E4: Freq 0~1000 (btn=0)");
}

// ═══════════════════════════════════════════════════════════
// Loop
// ═══════════════════════════════════════════════════════════
void loop() {
  ArduinoOTA.handle();

  if (otaInProgress) {
    delay(10);
    return;
  }

  static long lastClick1 = 0, lastClick2 = 0, lastClick3 = 0, lastClick4 = 0;
  static float phase = 0.0f;
  static unsigned long lastMs = millis();
  static uint32_t lastLogMs = 0;

  unsigned long now = millis();
  float dt = (now - lastMs) / 1000.0f;
  lastMs = now;

  // ─── Enc1: Hue ───
  long c1 = getClicks(0);
  if (c1 != lastClick1) {
    long delta = c1 - lastClick1;
    params.hueDeg = (params.hueDeg + (int)(delta * 10)) % MAX_HUE;
    if (params.hueDeg < 0) params.hueDeg += MAX_HUE;
    lastClick1 = c1;
  }
  if (btn1.pressed()) { params.hueDeg = 0; Serial.println("[Hue → 0°]"); }

  // ─── Enc2: Speed (0.0~5.0, 0.2 steps) ───
  long c2 = getClicks(1);
  if (c2 != lastClick2) {
    long delta = c2 - lastClick2;
    params.speed = constrain(params.speed + delta * SPEED_STEP, 0.0f, MAX_SPEED);
    lastClick2 = c2;
  }
  if (btn2.pressed()) { params.speed = 0.0f; Serial.println("[Speed → 0 (STOP)]"); }

  // ─── Enc3: Mode ───
  long c3 = getClicks(2);
  if (c3 != lastClick3) {
    long delta = c3 - lastClick3;
    params.mode = ((params.mode + (int)delta) % NUM_PRESETS + NUM_PRESETS) % NUM_PRESETS;
    lastClick3 = c3;
  }
  if (btn3.pressed()) { params.mode = 0; Serial.println("[Mode → 0]"); }

  // ─── Enc4: Freq ───
  long c4 = getClicks(3);
  if (c4 != lastClick4) {
    long delta = c4 - lastClick4;
    params.freq = constrain(params.freq + (int)(delta * FREQ_STEP), 0, MAX_FREQ);
    lastClick4 = c4;
  }
  if (btn4.pressed()) { params.freq = 0; Serial.println("[Freq → 0]"); }

  // ─── Change Mode ───
  if (params.mode != curMode) {
    applyPreset(params.mode);
    Serial.printf("Mode %d: %dx%d tile=%d gap=%d\n",
      params.mode, presets[params.mode].cols, presets[params.mode].rows,
      presets[params.mode].tileSize, presets[params.mode].gap);
  }

  // ─── Time Progression (If Speed is 0, phase stops) ───
  phase += dt * params.speed * 2.0f;

  // ─── Render ───
  renderConcentric(phase);
  dma_display->flipDMABuffer();

  // ─── Serial Log (Every 1 second) ───
  if (now - lastLogMs > 1000) {
    lastLogMs = now;
    Serial.printf("Hue:%3d°  Spd:%.1f  Mode:%d  Freq:%4d\n",
      params.hueDeg, params.speed, params.mode, params.freq);
  }
}

// ═══════════════════════════════════════════════════════════
// Future Migration Guide (Production Stage)
// ═══════════════════════════════════════════════════════════
//
// [Current] ArduinoOTA — Only the developer (me) can push from IDE
//
// [Next Stage] esp_https_ota + Update.h + Local Web Server
//
// 1. Split firmware partition for OTA
//    Tools → Partition Scheme → "Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)"
//    Or if using a 16MB flash, choose a more spacious OTA partition
//
// 2. Mount LittleFS + Host static UI
//    #include <LittleFS.h>
//    #include <ESPAsyncWebServer.h>
//    AsyncWebServer server(80);
//    server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");
//
// 3. Parameter REST Endpoints
//    GET  /api/state         → Current hue/speed/mode/freq JSON
//    POST /api/state         → Update parameters
//    GET  /api/version       → Current firmware version
//    POST /api/update/check   → Check latest version on GitHub Releases
//    POST /api/update/start   → Auto-update via esp_https_ota
//    POST /api/update/upload  → Manual .bin upload (fallback path)
//
// 4. mDNS can reuse the one already started by ArduinoOTA
//    MDNS.begin("patternflow") → http://patternflow.local
//    (Android requires manual IP entry fallback)
//
// 5. Build UI with Vite/Svelte → Copy dist/ folder to LittleFS
//    Gzip compression during build → Serve raw gzip
//
// 6. Use esp_wifi_provisioning library for BLE provisioning
//    Runs only once initially, then saves SSID/PW to NVS
//
// 7. 16MB ESP32-S3 module recommended for flash (More room for UI/OTA)
//
// → With this structure, parameter control becomes possible via Web UI,
//    Encoder/Web UI are synchronized so operating either will reflect changes.
//    Encoders handle "physical immediacy", Web handles "precision + preset saving".
//
// ═══════════════════════════════════════════════════════════