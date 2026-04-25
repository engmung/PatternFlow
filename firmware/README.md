# Patternflow Firmware

Arduino-based firmware for the ESP32-S3 powering Patternflow v1.0.

## Setup

### Required board package
- ESP32 by Espressif Systems (latest)

### Arduino IDE board settings
- **Board:** ESP32S3 Dev Module
- **PSRAM:** OPI PSRAM
- **Flash Size:** 16MB
- **Partition Scheme:** 16M Flash with PSRAM-aware partition
- **USB CDC On Boot:** Disabled
- **Upload Mode:** UART0 / Hardware CDC

### Required libraries
_To be filled in — install via Library Manager:_
- `ESP32-HUB75-MatrixPanel-DMA` (version: TBD)
- _other libraries_

## Pin Mapping

_To be filled in based on schematic. See `hardware/pcb/schematic.pdf`._

## Project layout

- `patternflow_v1/` — main sketch for v1.0 hardware
- `examples/` — minimal templates for adding new patterns

## Adding a new pattern

_Coming soon._

## License

MIT — see root LICENSE file.
