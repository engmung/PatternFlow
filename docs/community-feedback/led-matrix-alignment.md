# LED Matrix Back Alignment

- Status: Open
- Source: Community review
- Target: PCB / assembly docs

## Problem
The back of the PCB has alignment bumps for the LED matrix that do not match the silkscreen outline.

## Proposed Fix
- Verify bump positions against mechanical drawing
- Adjust PCB footprint to center bumps within silkscreen boundary
- Add assembly notes to fabrication drawing

## Files to Update
- `hardware/led_matrix.kicad_pcb`: Move bumps inward by 0.5mm
- `docs/mechanical.html`: Add alignment diagram
