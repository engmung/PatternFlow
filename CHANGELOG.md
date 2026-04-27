# Changelog

All notable changes to Patternflow will be documented in this file.

## [v1.1.0] — 2026-04 (Multi-pattern Update)

This update consolidates multiple patterns into a single firmware and introduces a runtime pattern selection mode.

### Firmware
- **Refactored Modular Architecture**: Patterns are now modularized (`pattern_*.h`) and registered in a central registry.
- **Unified Input Handling**: Introduced `InputFrame` to share normalized encoder and button states across patterns.
- **Pattern Selection Mode**: Long-press Encoder 4 (1 second) to enter/exit the pattern selection UI.
- **New Pattern**: Added `Wave1_Saw` (rotated sawtooth waves with fractal noise distortion).
- **Improved Performance**: Replaced macros with namespace-scoped constants and optimized LUT usage.

### Web
- **Consolidated Flasher**: The web flasher now provides a single "PatternFlow OS v1.1.0" image containing all patterns.
- **Simplified UI**: Removed individual pattern buttons in favor of the all-in-one OS build.

---

## [v1.0.0] — 2026-04 (initial public release)

The first publicly buildable version of Patternflow.

### Hardware
- 128×64 px HUB75 LED matrix (P2.5, 320×160 mm)
- ESP32-S3-WROOM-1 (N16R8 — 16MB Flash, 8MB PSRAM)
- 4× EC11 rotary encoders with push-switches
- Custom PCB (KiCad) — fabricated via PCBway sponsorship
- 3D-printed PLA case (white body, black knobs)
- Powered by user-supplied USB power bank, with internal mounting compartment

### Firmware
- Arduino-based firmware for ESP32-S3
- HUB75 DMA driver
- Default pattern set

### Documentation
- `docs/BUILD.md` — full build guide with BOM and assembly walkthrough
- AliExpress affiliate sourcing links for all electronic components
- KiCad project files for PCB
- STL files for case (3 prints total)

### License
- Firmware & web: MIT
- Hardware & designs: CC-BY-SA 4.0
- "Patternflow" is a trademark of SeungHun Lee

### Known Issues
See [docs/BUILD.md](docs/BUILD.md) — Known Issues section for full details.
- Reset button must be pressed once after power-up (EN-GND cap will be added in v1.1)
- Rotary encoder direction reversed in PCB (compensated in firmware)
- Silkscreen ambiguity between 0805 caps and resistors
- LED matrix alignment bumps require trimming during assembly

### Acknowledgments
- **PCBway** — for sponsoring v1.0 PCB fabrication
- **r/arduino community** — 1.6k upvotes on the prototype thread that pushed this from "just a personal project" toward open source
- **Doyoon** — for the suggestion that started the LED matrix direction
