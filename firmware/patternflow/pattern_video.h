// ═══════════════════════════════════════════════════════════
// PatternFlow - Video Pattern (PFV1 Playback from FATFS)
//
// Reads baked .pfv files from the ESP32 FATFS partition
// and plays them back on the LED matrix as RGB565 frames.
//
// Knobs:
//   K1 — Brightness
//   K2 — Playback speed (rotate), pause/resume (press)
//   K3 — File select (rotate), next file + load (hold 1s)
//   K4 — (pattern select — handled by OS)
//
// Serial upload:
//   Send "PFV:<filename>:<size>\n" then raw binary data.
//   ESP32 saves to FATFS and auto-loads the file.
//
// License: MIT
// ═══════════════════════════════════════════════════════════
#pragma once

#include <FFat.h>
#include "core_display.h"

namespace VideoPattern {

  const char* NAME = "Video";
  const char* KNOB_LABELS[4] = {"bright", "speed", "file", "---"};

  // ── PFV1 Header (32 bytes, matches web encoder) ──────────

  struct PFV1Header {
    char     magic[4];      // "PFV1"
    uint16_t width;         // 128
    uint16_t height;        // 64
    uint16_t frameCount;
    uint16_t fpsMilli;      // ms per frame (e.g. 83 = 12fps)
    uint32_t flags;
    uint32_t dataCrc32;
    uint8_t  reserved[12];
  };

  // ── State ────────────────────────────────────────────────

  static const int FRAME_PIXELS = PANEL_RES_W * PANEL_RES_H;  // 128 * 64 = 8192
  static const int FRAME_BYTES  = FRAME_PIXELS * 2;            // 16384 bytes (RGB565)
  static const int MAX_FILES    = 16;
  static const int MAX_PATH_LEN = 48;

  // Frame buffer in PSRAM
  uint16_t* frameBuf    = nullptr;
  uint16_t  frameCount  = 0;
  uint16_t  currentFrame = 0;
  float     frameTimer  = 0.0f;
  float     msPerFrame  = 83.33f;
  float     speedMul    = 1.0f;
  uint8_t   brightness  = 204;
  bool      paused      = false;

  // Info splash timer (shows file info briefly after load)
  float     infoTimer   = 0.0f;
  static const float INFO_DURATION = 2.5f;  // seconds

  // File list
  char      fileList[MAX_FILES][MAX_PATH_LEN];
  int       fileCount    = 0;
  int       currentFile  = 0;
  bool      loaded       = false;
  bool      fatReady     = false;

  // ── File scanning ────────────────────────────────────────

  void scanFiles() {
    fileCount = 0;
    File root = FFat.open("/");
    if (!root || !root.isDirectory()) return;

    File entry;
    while ((entry = root.openNextFile()) && fileCount < MAX_FILES) {
      const char* name = entry.name();
      size_t len = strlen(name);
      if (len > 4 && strcasecmp(name + len - 4, ".pfv") == 0) {
        snprintf(fileList[fileCount], MAX_PATH_LEN, "/%s", name);
        Serial.printf("[Video] Found: %s (%d bytes)\n", fileList[fileCount], entry.size());
        fileCount++;
      }
      entry.close();
    }
    root.close();
    Serial.printf("[Video] %d PFV file(s) found\n", fileCount);
  }

  // ── Load a PFV file into PSRAM ───────────────────────────

  bool loadFile(int idx) {
    if (idx < 0 || idx >= fileCount) return false;

    File f = FFat.open(fileList[idx], "r");
    if (!f) {
      Serial.printf("[Video] Failed to open %s\n", fileList[idx]);
      return false;
    }

    PFV1Header hdr;
    if (f.read((uint8_t*)&hdr, sizeof(hdr)) != sizeof(hdr)) {
      Serial.println("[Video] Header read failed");
      f.close();
      return false;
    }

    if (memcmp(hdr.magic, "PFV1", 4) != 0) {
      Serial.println("[Video] Invalid magic (not PFV1)");
      f.close();
      return false;
    }

    if (hdr.width != PANEL_RES_W || hdr.height != PANEL_RES_H) {
      Serial.printf("[Video] Wrong resolution: %dx%d\n", hdr.width, hdr.height);
      f.close();
      return false;
    }

    Serial.printf("[Video] Loading %s: %d frames, %dms/frame\n",
                  fileList[idx], hdr.frameCount, hdr.fpsMilli);

    if (frameBuf) { free(frameBuf); frameBuf = nullptr; }

    size_t totalBytes = (size_t)hdr.frameCount * FRAME_BYTES;
    frameBuf = (uint16_t*)ps_malloc(totalBytes);
    if (!frameBuf) {
      frameBuf = (uint16_t*)malloc(totalBytes);
      if (!frameBuf) {
        Serial.println("[Video] Alloc failed"); f.close(); return false;
      }
    }

    size_t bytesRead = f.read((uint8_t*)frameBuf, totalBytes);
    f.close();

    if (bytesRead != totalBytes) {
      Serial.printf("[Video] Incomplete: %d/%d\n", bytesRead, totalBytes);
      free(frameBuf); frameBuf = nullptr; return false;
    }

    frameCount   = hdr.frameCount;
    msPerFrame   = (float)hdr.fpsMilli;
    currentFrame = 0;
    frameTimer   = 0.0f;
    loaded       = true;
    paused       = false;
    infoTimer    = INFO_DURATION;  // trigger info splash

    Serial.printf("[Video] OK — %d frames, %.1f fps, %d KB\n",
                  frameCount, 1000.0f / msPerFrame, totalBytes / 1024);
    return true;
  }

  // ── Serial PFV upload ────────────────────────────────────
  // Protocol: host sends "PFV:<filename>:<size>\n"
  //           then <size> bytes of raw PFV data.

  void checkSerialUpload() {
    if (!fatReady || !Serial.available()) return;

    if (Serial.peek() != 'P') return;

    String line = Serial.readStringUntil('\n');
    line.trim();

    if (!line.startsWith("PFV:")) return;

    String cmd = line.substring(4);

    // ── PFV:LIST — list all files ──
    if (cmd == "LIST") {
      Serial.printf("FILES:%d\n", fileCount);
      for (int i = 0; i < fileCount; i++) {
        File f = FFat.open(fileList[i], "r");
        Serial.printf("FILE:%s:%d\n", fileList[i], f ? f.size() : 0);
        if (f) f.close();
      }
      Serial.printf("FREE:%d\n", FFat.freeBytes());
      return;
    }

    // ── PFV:FREE — show free space ──
    if (cmd == "FREE") {
      Serial.printf("FREE:%d\n", FFat.freeBytes());
      return;
    }

    // ── PFV:CLEAR — delete all PFV files ──
    if (cmd == "CLEAR") {
      for (int i = 0; i < fileCount; i++) {
        FFat.remove(fileList[i]);
        Serial.printf("DELETED:%s\n", fileList[i]);
      }
      scanFiles();
      if (frameBuf) { free(frameBuf); frameBuf = nullptr; }
      loaded = false;
      frameCount = 0;
      Serial.printf("OK:CLEARED\nFREE:%d\n", FFat.freeBytes());
      return;
    }

    // ── PFV:DELETE:<filename> — delete one file ──
    if (cmd.startsWith("DELETE:")) {
      String fname = "/" + cmd.substring(7);
      if (FFat.remove(fname)) {
        Serial.printf("DELETED:%s\n", fname.c_str());
        scanFiles();
        // Reload if current file was deleted
        if (fileCount > 0) { currentFile = 0; loadFile(0); }
        else { loaded = false; frameCount = 0; if (frameBuf) { free(frameBuf); frameBuf = nullptr; } }
      } else {
        Serial.printf("ERR:NOT_FOUND:%s\n", fname.c_str());
      }
      Serial.printf("FREE:%d\n", FFat.freeBytes());
      return;
    }

    // ── PFV:<filename>:<size> — upload file ──
    int sep1 = cmd.indexOf(':');
    if (sep1 < 0) { Serial.println("ERR:BAD_FORMAT"); return; }

    String fname = "/" + cmd.substring(0, sep1);
    size_t fsize = cmd.substring(sep1 + 1).toInt();

    if (fsize == 0 || fsize > 8 * 1024 * 1024) {
      Serial.println("ERR:BAD_SIZE");
      return;
    }

    Serial.printf("READY:%d\n", fsize);

    // Receive and write to FATFS
    File f = FFat.open(fname, "w");
    if (!f) { Serial.println("ERR:OPEN_FAIL"); return; }

    // Show upload progress on display
    dma_display->fillScreen(0);
    dma_display->setTextSize(1);
    dma_display->setTextColor(dma_display->color565(100, 100, 100));
    dma_display->setCursor(20, 20);
    dma_display->print("UPLOADING...");
    dma_display->flipDMABuffer();

    size_t received = 0;
    uint8_t buf[4096];
    unsigned long lastActivity = millis();

    while (received < fsize) {
      if (Serial.available()) {
        size_t toRead = min((size_t)Serial.available(), sizeof(buf));
        toRead = min(toRead, fsize - received);
        size_t got = Serial.readBytes(buf, toRead);
        f.write(buf, got);
        received += got;
        lastActivity = millis();

        // Progress bar on display
        int pct = (int)(received * 100 / fsize);
        int barW = (int)(received * 88 / fsize);
        dma_display->fillRect(20, 38, 88, 6, 0);
        dma_display->fillRect(20, 38, barW, 6, dma_display->color565(255, 255, 255));
        dma_display->fillRect(20, 48, 88, 8, 0);
        dma_display->setCursor(20, 48);
        dma_display->printf("%d%%  %dK", pct, received / 1024);
        dma_display->flipDMABuffer();
      }

      // Timeout: 10 seconds of no data
      if (millis() - lastActivity > 10000) {
        Serial.println("ERR:TIMEOUT");
        f.close();
        return;
      }
      yield();
    }

    f.close();
    Serial.printf("OK:%d\n", received);

    // Rescan and load the new file
    scanFiles();
    for (int i = 0; i < fileCount; i++) {
      if (strcmp(fileList[i], fname.c_str()) == 0) {
        currentFile = i;
        loadFile(i);
        break;
      }
    }
  }

  // ── Pattern interface ────────────────────────────────────

  void setup() {
    if (!FFat.begin(false)) {
      Serial.println("[Video] FFat mount failed — formatting...");
      if (!FFat.begin(true)) {
        Serial.println("[Video] FFat format failed");
        return;
      }
    }
    fatReady = true;
    Serial.printf("[Video] FFat: %d KB free\n", FFat.freeBytes() / 1024);

    scanFiles();
    if (fileCount > 0) loadFile(0);
    else Serial.println("[Video] No .pfv files on FATFS");
  }

  void update(float dt, const InputFrame& input) {
    if (!fatReady) return;

    // Check for serial upload commands
    checkSerialUpload();

    // K1: Brightness (rotate ±5, press = reset)
    int d0 = input.knobDeltas[0];
    if (d0 != 0) {
      int b = (int)brightness + d0 * 5;
      brightness = (uint8_t)constrain(b, 10, 255);
      dma_display->setBrightness8(brightness);
    }
    if (input.btnPressed[0]) {
      brightness = DEFAULT_BRIGHTNESS;
      dma_display->setBrightness8(brightness);
    }

    // K2: Speed (rotate ±0.1x, press = pause/resume)
    int d1 = input.knobDeltas[1];
    if (d1 != 0) {
      speedMul = constrain(speedMul + d1 * 0.1f, 0.1f, 4.0f);
      paused = false;
    }
    if (input.btnPressed[1]) {
      paused = !paused;
      Serial.printf("[Video] %s\n", paused ? "Paused" : "Playing");
    }

    // K3: File select (rotate = browse files, hold = load next)
    int d2 = input.knobDeltas[2];
    if (d2 != 0 && fileCount > 1) {
      int next = ((currentFile + d2) % fileCount + fileCount) % fileCount;
      if (next != currentFile) {
        currentFile = next;
        loadFile(currentFile);
        Serial.printf("[Video] → %s\n", fileList[currentFile]);
      }
    }

    // Countdown info splash
    if (infoTimer > 0) {
      infoTimer -= dt;
    }

    // Advance frame timer
    if (loaded && frameCount > 0 && !paused && speedMul > 0.0f) {
      frameTimer += dt * speedMul * 1000.0f;
      while (frameTimer >= msPerFrame) {
        frameTimer -= msPerFrame;
        currentFrame = (currentFrame + 1) % frameCount;
      }
    }
  }

  // ── Draw helpers (vertical-aware, rotation=0 means 128w×64h) ──

  void drawCenteredText(const char* text, int y, uint16_t color, int textSize = 1) {
    int16_t x1, y1;
    uint16_t w, h;
    dma_display->setTextSize(textSize);
    dma_display->setTextColor(color);
    dma_display->getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
    dma_display->setCursor((dma_display->width() - w) / 2, y);
    dma_display->print(text);
  }

  void draw() {
    // ── No video loaded ──
    if (!loaded || !frameBuf || frameCount == 0) {
      dma_display->fillScreen(0);
      uint16_t dim = dma_display->color565(50, 50, 50);
      drawCenteredText("NO VIDEO", 24, dim);
      if (fatReady) {
        char buf[24];
        snprintf(buf, sizeof(buf), "%dKB FREE", FFat.freeBytes() / 1024);
        drawCenteredText(buf, 40, dma_display->color565(30, 30, 30));
      }
      return;
    }

    // ── Draw video frame ──
    const uint16_t* frame = frameBuf + (size_t)currentFrame * FRAME_PIXELS;
    for (int y = 0; y < PANEL_RES_H; y++) {
      for (int x = 0; x < PANEL_RES_W; x++) {
        dma_display->drawPixel(x, y, frame[y * PANEL_RES_W + x]);
      }
    }

    // ── Info splash overlay (first 2.5s after load) ──
    if (infoTimer > 0) {
      // Semi-transparent dark band at bottom
      for (int y = PANEL_RES_H - 20; y < PANEL_RES_H; y++) {
        for (int x = 0; x < PANEL_RES_W; x++) {
          dma_display->drawPixel(x, y, 0);  // black overlay
        }
      }

      // File info text
      char info1[32], info2[32];
      // Strip path prefix for display
      const char* fname = fileList[currentFile];
      if (fname[0] == '/') fname++;
      snprintf(info1, sizeof(info1), "%s", fname);
      snprintf(info2, sizeof(info2), "%df  %.0ffps  x%.1f",
               frameCount, 1000.0f / msPerFrame, speedMul);

      uint16_t white = dma_display->color565(200, 200, 200);
      uint16_t gray  = dma_display->color565(120, 120, 120);

      dma_display->setTextSize(1);
      dma_display->setTextColor(white);
      dma_display->setCursor(2, PANEL_RES_H - 18);
      dma_display->print(info1);

      dma_display->setTextColor(gray);
      dma_display->setCursor(2, PANEL_RES_H - 9);
      dma_display->print(info2);
    }
  }

} // namespace VideoPattern
