# Patternflow

[![Open Source Hardware](https://img.shields.io/badge/Open_Source-Hardware-blue?style=flat-square&logo=opensourceinitiative)](https://github.com/engmung/PatternFlow)
[![License: MIT](https://img.shields.io/badge/Code-MIT-green?style=flat-square)](./LICENSE-MIT)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/Hardware-CC_BY--SA_4.0-orange?style=flat-square)](./LICENSE-CC-BY-SA)

> ⚠️ **Photosensitivity Warning**  
> Patternflow displays rapidly changing light patterns that may trigger seizures in people with photosensitive epilepsy. Viewer discretion is advised. If you experience any discomfort, stop use immediately.


An LED synthesizer. Play light patterns with your fingertips.  
An open-source reinterpretation of Nam June Paik's *Participation TV* (1963).

## What is this?

Patternflow is an open-source hardware instrument: four rotary encoders controlling generative light patterns on a 128×64 LED matrix, powered by ESP32-S3.

**Long-press encoder 4 to switch between patterns** — all bundled in a single firmware image, no reflashing needed.

<p align="center">
  <img src="./docs/media/demo_part1_v2.webp" height="500" />
  <img src="./docs/media/demo_part2.webp" height="500" />
</p>

**[📺 See it in action on r/arduino](https://www.reddit.com/r/arduino/comments/1so9er5/)** — 1.6k+ upvotes.

> 🚀 **v1.1.0 is now live.** Now features a unified PatternFlow OS with runtime pattern selection.

## Links

- 🌐 [patternflow.work](https://patternflow.work) — official website with comprehensive docs and (soon) the web installer
- 📝 [Patternflow in 30 days](https://patternflow.work/journal/v1-30-days?lang=en) — build log: from tangled wires to open source
- 📦 [Releases](../../releases) — stable bundles (v1.1.0)
- 💬 [Join the Patternflow Discord](https://discord.gg/Vr9QtsxeTk) — chat, ask questions, or show off your build

## Repository structure

- `firmware/` — Arduino code for ESP32-S3
- `hardware/` — case (3D models) and PCB (KiCad, Gerber, schematic PDF)
- `web/` — Next.js site (landing + future web installer and pattern platform)
- `docs/` — build guide, roadmap, media

## Patterns

PatternFlow OS v1.1.0 includes:

- **Origin** — concentric sine wave sampled by an emergent grid
- **Wave1** — rotated sawtooth waves with fractal noise distortion

Switch between patterns by long-pressing encoder 4 (1 second).

## Documentation

- 📖 **[Build Guide](docs/BUILD.md)** — full assembly instructions
- 🗺 **[Roadmap](docs/ROADMAP.md)** — what's next
- 📋 **[Changelog](CHANGELOG.md)** — version history
- ⚖️ **[License Summary](docs/LICENSE-SUMMARY.md)** — what's MIT, what's CC-BY-SA

## AI-assisted development

This project uses Google Antigravity with version-controlled harness configuration in `.agents/`. The configuration is compatible with Cursor and Claude Code via the standard `AGENTS.md` format.

If you fork or contribute, your AI coding agent will pick up the same project context, conventions, and skills automatically. The harness is part of the open-source release — it codifies how to work on Patternflow, not just what Patternflow is.

See `.agents/rules/project-context.md` for full project context.

## License

- Firmware & web — **MIT** ([LICENSE-MIT](./LICENSE-MIT))
- Hardware & designs — **CC-BY-SA 4.0** ([LICENSE-CC-BY-SA](./LICENSE-CC-BY-SA))

"Patternflow" is a trademark of SeungHun Lee.

The Patternflow series: LED Synthesizer (2026) · Origin (2026)
