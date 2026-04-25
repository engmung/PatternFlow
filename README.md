# Patternflow

[![Open Source Hardware](https://img.shields.io/badge/Open_Source-Hardware-blue?style=flat-square&logo=opensourceinitiative)](https://github.com/engmung/PatternFlow)
[![License: MIT](https://img.shields.io/badge/Code-MIT-green?style=flat-square)](./LICENSE-MIT)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/Hardware-CC_BY--SA_4.0-orange?style=flat-square)](./LICENSE-CC-BY-SA)

An LED synthesizer. Play light patterns with your fingertips.  
An open-source reinterpretation of Nam June Paik's *Participation TV* (1963).

## What is this?

Patternflow is an open-source hardware instrument: four rotary encoders controlling generative light patterns on a 128×64 LED matrix, powered by ESP32-S3.

| | |
|:---:|:---:|
| ![Patternflow Demo](./docs/media/demo_part1.webp) | ![Patternflow Demo](./docs/media/demo_part2.webp) |

**[📺 See it in action on r/arduino](https://www.reddit.com/r/arduino/comments/1so9er5/)** — 1.6k+ upvotes.

> 🚀 **v1.0 is here.** Hardware design, firmware, and build guide are released. Web pattern platform coming next.

## Links

- 🌐 [patternflow.work](https://patternflow.work) — official website with comprehensive docs and (soon) the web installer
- 📦 [Releases](../../releases) — stable bundles (coming soon)
- 💬 Discord — coming soon

## Repository structure

- `firmware/` — Arduino code for ESP32-S3
- `hardware/` — case (3D models) and PCB (KiCad, Gerber, schematic PDF)
- `web/` — Next.js site (landing + future web installer and pattern platform)
- `docs/` — build guide, roadmap, media

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