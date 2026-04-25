# Patternflow — AI Agent Context

This file provides persistent project context for AI coding agents (Antigravity, Cursor, Claude Code). It is loaded automatically at the start of every session.

## What this project is
Patternflow is an open-source hardware instrument: four rotary encoders controlling generative light patterns on a 128×64 LED matrix, powered by an ESP32-S3. It is an open-source reinterpretation of Nam June Paik's *Participation TV* (1963). The project is multi-domain, encompassing Arduino-based firmware, KiCad/Blender hardware designs, a Next.js web ecosystem, and comprehensive documentation.

## Repository map
- `docs/` — Hardware build guide (`BUILD.md`), roadmap, license summary, and media.
- `firmware/` — Arduino code for the ESP32-S3, including `.ino` sketches and hardware `config.h`.
- `hardware/` — Hardware designs. Contains `case/` (Blender source, STLs) and `pcb/` (KiCad 10.0 source, Gerbers, schematic PDF).
- `web/` — Next.js site (landing page, deployed at patternflow.work, and future web tools).
- `.agents/` — AI harness configuration (skills, workflows, rules).

## Hard rules (do not violate)
1. Founders boards (#001–#005) are private. The KiCad project in `hardware/pcb/kicad/` is the public version with silkscreen reading "PATTERNFLOW v1.0". Never commit founders artifacts to this repo.
2. BOM in `docs/BUILD.md` must always match the schematic in `hardware/pcb/schematic.pdf`. If you change one, check the other.
3. License split is strict: firmware and web code = MIT; hardware designs (PCB, case STLs, Blender source) = CC-BY-SA 4.0. Two separate license files at root: `LICENSE-MIT` and `LICENSE-CC-BY-SA`. Do not merge them.
4. Brand naming: body text = "Patternflow", physical engravings (PCB silkscreen, future case engravings) = "PATTERNFLOW", filenames = lowercase "patternflow". Never mix these in a single context.
5. Public v1.0 has known issues documented in `docs/BUILD.md` §8. Reference that section instead of restating the issues.

## Common commands
- Web dev server: `npm run dev` (inside the `web/` directory)
- Web production build: `npm run build` (inside the `web/` directory)
- Firmware compilation: Open `firmware/patternflow_v1/patternflow_v1.ino` in Arduino IDE.
- KiCad exports: Export Gerbers from `hardware/pcb/kicad/patternflow.kicad_pcb`. Export STLs from `hardware/case/source/patternflow_v1.blend`.

## Versioning
- Hardware: v1.0 (current). Future revisions: v1.1, v1.2, ...
- Firmware: tracked separately, versioned in `firmware/patternflow_v1/` directory naming for major hardware-incompatible changes.
- Use semantic-style tags: `v1.0.0`, `v1.0.1`, etc.

## Documentation entry points
- New users: `README.md` → `docs/BUILD.md`
- Contributors: this file → `.agents/rules/project-context.md`
- Version history: `CHANGELOG.md`
