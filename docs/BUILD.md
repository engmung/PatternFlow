# Patternflow v1.0 — Build Guide

This guide walks you through building a Patternflow v1.0 from scratch. It assumes basic familiarity with soldering (through-hole + simple SMD) and 3D printing.

**Estimated build time:** 4–6 hours of active work, plus ~11 hours of 3D printing.

**Skill level:** Intermediate. If you've assembled a mechanical keyboard or built an Arduino project with SMD components, you're ready.

---

## Table of Contents

1. [Bill of Materials (BOM)](#1-bill-of-materials-bom)
2. [3D Printing](#2-3d-printing)
3. [PCB Assembly](#3-pcb-assembly)
4. [Case Assembly](#4-case-assembly)
5. [Final Integration](#5-final-integration)
6. [Firmware Upload](#6-firmware-upload)
7. [First Boot](#7-first-boot)
8. [Known Issues](#8-known-issues)

---

## 1. Bill of Materials (BOM)

### Main Components

| Ref | Item | Spec | Qty | Notes |
| --- | --- | --- | --- | --- |
| — | LED Matrix Panel | HUB75, 128×64 px, P2.5, 320×160 mm | 1 | Full color SMD. Ships with HUB75 ribbon cable + power cable — both used as-is. |
| U1 | ESP32-S3 DevKit | ESP32-S3-WROOM-1, **N16R8** (16MB Flash, 8MB PSRAM), 44-pin, 25.4mm header spacing | 1 | PSRAM is required |
| SW1–4 | Rotary Encoder | EC11, 5-pin, 20mm shaft, with push-switch | 4 |  |
| — | Female Pin Socket (1×22, 2.54mm) | For ESP32-S3 module | 2 |  |
| J1 | Box Header (2×8, 2.54mm) | Horizontal, for HUB75 ribbon | 1 | LED matrix data |
| J2 | Screw Terminal | 2-pin, 5mm pitch | 1 | +5V input from power bank |
| J3 | Screw Terminal | 2-pin, 5mm pitch | 1 | +5V output to LED matrix |
| R1–R12 | Resistor 10kΩ 1% | 0805 SMD | 12 | Encoder pull-ups (3 per encoder × 4) |
| C1–C10, C12–C15 | Capacitor 100nF X7R | 0805 SMD | 14 | 12 for encoders (3 per encoder × 4), 2 for ESP32 decoupling |
| C11 | Electrolytic Cap 1000µF / 16V | Radial D10×L13 | 1 | Main bulk decoupling |
| — | M4 Screws | ~10mm length | 6 | LED matrix mounting |
| — | USB Cable (sacrificial) | Any USB cable, will be cut | 1 | For 5V power input |
| — | Power Bank | Any standard USB power bank that physically fits | 1 | User-supplied |

### Sourcing — AliExpress (with affiliate links)

These are the exact links I used. **Purchasing through these affiliate links directly supports the ongoing development of Patternflow at no extra cost to you.** 

💡 **Found a better part?** If you discover cheaper, more reliable, or higher-quality alternative components, please let me know! I highly welcome PRs or GitHub Issues recommending better sourcing options for the community.

AliExpress shipping to most regions takes ~7–14 days.

- **Rotary Encoders (5-pack):** [EC11 20mm 5pcs — ~3,250 KRW](https://s.click.aliexpress.com/e/_c3dYYGob)
- **ESP32-S3-N16R8:** [~10,300 KRW](https://s.click.aliexpress.com/e/_c3qxYiaP)
⚠️ Make sure it's the **N16R8** variant. Other variants without PSRAM will not work reliably.
- **LED Matrix:** [Full color 320×160mm P2.5 HUB75 — ~23,250 KRW](https://s.click.aliexpress.com/e/_c3SVdcQr)

PCB: order from your preferred fab using the KiCad files in `hardware/pcb/`. I used PCBway (sponsored).

### What you also need (not in BOM)

- 3D printer (I used Bambu P1S)
- White and black PLA filament
- Soldering iron, solder, flux, tweezers
- Wire cutters or strong nippers (for trimming the LED matrix back)
- Cyanoacrylate glue (super glue)
- Phillips screwdriver

---

## 2. 3D Printing

### Files (in `hardware/case/`)

| File | Contents | Color | Print Orientation |
| --- | --- | --- | --- |
| `v1_1.stl` | Main body (vertical, tall part) | White | Vertical (standing up) |
| `v1_2.stl` | Back covers and internal divider plates | White | Flat |
| `v1_3.stl` | All 4 knobs (one file) | Black | Standard |

**Print all three files. Each is one print job.** Knobs are bundled in a single STL — printing `v1_3.stl` once gives you all four.

### Print Settings

I used a **Bambu P1S** with default settings, with one tweak:

- **Nozzle:** 0.4mm
- **Layer height:** Default (0.2mm)
- **Infill:** Default
- **Support:** Default tree support disabled. Use **standard (regular) support** instead.
- **Brim:** Off
- **Aux fan:** Lower to ~20%
- **Total print time:** ~11 hours combined

The main body (`v1_1`) is the long, thin part. I orient it standing up — this is the orientation the slicer will probably default to. Supports are needed and easy to remove.

> **Why standard supports, not tree:** During earlier prototypes I found tree supports more troublesome on this geometry. Standard supports remove cleanly here.
> 

---

## 3. PCB Assembly

Solder SMD parts first, then through-hole.

### 3.1 SMD Pass (R1–R12, C1–C6, C11)

**Order: by component type.** Do all resistors first, then all capacitors (or vice versa). Mixing types makes it easier to mis-place parts.

> ⚠️ **Silkscreen note:** On v1.0 PCB, the silkscreen does not clearly mark which 0805 pad is a resistor vs a capacitor. **Rule of thumb: the 0805 pad closest to each rotary encoder pad is a capacitor (C1–C4). The other 0805 pads are resistors.** When in doubt, refer to the schematic in `hardware/pcb/`. This will be fixed in v1.1.
> 

**Technique:**

1. Apply flux to one pad of each SMD position.
2. Tin one pad with a small amount of solder.
3. Hold the SMD with tweezers, slide it onto the tinned pad, reflow.
4. Solder the opposite pad.
5. Move on to the next part of the same type.

**Iron temperature:** ~420°C is what I used. Default works fine.

**Keep parts flat and centered.** Slight tilt will not affect function but looks bad.

### 3.2 Through-Hole Pass

Solder, in order:

1. **Female pin sockets (1×22 ×2)** for ESP32-S3 — these go on the front of the PCB. The ESP32 module plugs into these later (do not solder the ESP32 directly).
2. **J1 (HUB75 box header), J2 (USB power input), and J3 (LED matrix power output)**.
3. **C11 (1000µF electrolytic)** — watch polarity (long lead = positive).
4. **Rotary encoders (SW1–SW4)** — these go on the **back** of the PCB. They mount facing outward so their shafts protrude through the case front.

Press all parts flush against the PCB and keep them perpendicular before soldering.

### 3.3 Plug in the ESP32-S3

Once the female sockets are soldered, plug the ESP32-S3-N16R8 module into them. **Do not solder the module directly** — keep it removable in case of replacement.

---

## 4. Case Assembly

The case prints in halves because it's too tall for most printers in one piece. You'll bond the halves first, then assemble.

### 4.1 Bond the case halves

The body and the back panel each come in upper and lower halves.

1. **Main body (front+sides):** Apply super glue along the seam between the upper and lower halves of the main body. Press firmly until set.
2. **Back panel:** Same — bond upper and lower halves of the back panel.

Allow ~5 minutes to fully cure before handling.

### 4.2 Trim the LED matrix mounting bumps

The LED matrix has two small alignment bumps on its back, diagonally opposite each other. These prevent it from sitting flat against the case.

**Cut them off with strong nippers or pliers.** Slight residual nubs are fine — flat enough is flat enough.

> A future case revision will include recesses for these bumps so trimming isn't needed.
> 

### 4.3 Bond the internal divider

Inside the case, there's an internal divider that separates the LED matrix volume from the electronics+power bank volume. The divider has a hole for the USB cable to pass through.

**Insert the divider from the front side (the power bank / lower side), sliding it up into position.** Apply super glue along the divider edges to bond it to the case interior. Do not insert it from the back.

### 4.4 Mount the LED matrix

1. From the front of the case, lower the LED matrix into its slot.
2. Flip the case over.
3. From the back, secure the matrix with the M4 screws (× 6).

> The screws thread directly into the LED matrix's mounting holes. Don't over-tighten.
> 

---

## 5. Final Integration

### 5.1 Insert the PCB

The PCB sits in the dedicated PCB slot, with the rotary encoders facing through the case front.

The slot is intentionally tight in v1.0. To install:

1. Hold the PCB at an angle, encoder side down.
2. Slide the bottom row of encoders into their slots first.
3. While tilting the PCB into a flat position, guide the upper encoders into their slots simultaneously.
4. Push the PCB flat against the case interior.

### 5.2 Secure the encoders

From the front of the case, attach each rotary encoder's nut and tighten with a wrench or pliers. This both secures the encoder shafts to the front face and locks the PCB in place.

### 5.3 Attach the knobs

Press-fit the four black knobs onto the encoder shafts.

### 5.4 Connect the LED matrix

The LED matrix ships with two cables:

- **HUB75 ribbon cable** (data) — connect from `J1` on the PCB to the LED matrix data input.
- **Power cable** (red/black) — connect to `J3` on the PCB. Either cut the connector off and screw the wires into the J3 terminal, or use the cable as-is if the bare end fits.

> ⚠️ Watch polarity on the J3 power cable — red to +5V, black to GND.
> 

### 5.5 Wire the USB power input

Cut the USB cable. Strip the +5V (red) and GND (black) wires.

Pass the cable through the divider hole. Wire +5V and GND into `J2` (the screw terminal). Watch polarity.

The other end (USB-A connector) plugs into the user's power bank.

> J2 (input) and J3 (output to LED matrix) are connected internally on the PCB. You don't need to bridge them externally — the PCB handles +5V distribution.
> 

### 5.6 Slide in the power bank cover

The power bank compartment has a slide-in cover. Insert the user's power bank into the compartment, then slide the cover in to hold everything in place.

---

## 6. Firmware Upload

### 6.1 Prerequisites

- Arduino IDE (latest version)
- ESP32 board package installed (Tools → Board → Boards Manager → search "esp32")

### 6.2 Board settings

In Arduino IDE, **Tools** menu:

- **Board:** ESP32S3 Dev Module
- **PSRAM:** OPI PSRAM
- **Flash Size:** 16MB
- **Partition Scheme:** 16M Flash (3MB APP/9.9MB FATFS) or similar with PSRAM-aware partition
- **USB CDC On Boot:** Disabled
- **Upload Mode:** UART0 / Hardware CDC

### 6.3 Upload

1. Connect the ESP32-S3 module to your computer with a USB-C cable (data-capable, not power-only).
2. Select the correct port under Tools → Port.
3. Open `firmware/patternflow_v1/patternflow_v1.ino`.
4. Click Upload.

If the upload fails, hold **BOOT** on the ESP32-S3 while pressing **RESET**, then click Upload.

### 6.4 OTA (preview)

OTA updates work via Arduino IDE's network port option once the device has been on the same Wi-Fi network at least once. **OTA in v1.0 is functional but not the recommended path.** Use wired upload as the primary method.

A browser-based flasher is planned for a future release.

---

## 7. First Boot

1. Plug the user's power bank into the USB cable wired into J2.
2. **Press the RESET button on the ESP32-S3 module once.**
3. The LED matrix should illuminate with the default pattern.
4. Turn the four knobs to confirm they all respond.

> The reset-button-on-first-boot step is a known v1.0 issue (see below).
> 

---

## 8. Known Issues

### Issue #1 — Reset button required on power-up

**Why:** The 3.3V rail rises slowly enough that the EN pin's RC time constant misses the boot window. Common to ESP32-S3 boards without an explicit EN-GND cap.
**Workaround (v1.0):** Press RESET once after applying power.
**Planned fix (v1.1):** Add a 0.1µF–1µF ceramic cap between EN and GND, either via PCB revision or a hand-soldered SMD cap on the module.
🛠 **Open to PRs** — see the GitHub Issues tab.

### Issue #2 — Encoder direction reversed in firmware

**Why:** Encoder footprint in v1.0 PCB is rotated relative to the intended orientation.
**Workaround (v1.0):** Firmware inverts the sign — invisible to the user.
**Planned fix (v1.1):** Correct PCB footprint orientation.

### Issue #3 — SMD silkscreen ambiguity (R vs C)

**Why:** Silkscreen on v1.0 doesn't clearly distinguish 0805 caps from 0805 resistors.
**Workaround:** Use the rule of thumb above (cap = closest 0805 to each encoder) or refer to the schematic.
**Planned fix (v1.1):** Updated silkscreen.

### Issue #4 — LED matrix back has alignment bumps

**Why:** The matrix manufacturer leaves two small alignment bumps on the back.
**Workaround (v1.0):** Cut them off during assembly.
**Planned fix (v1.x):** Case recess to accommodate them.

### Issue #5 — Encoder shaft length

**Why:** v1.0 ships with 20mm shafts (I'll be honest — I ordered the wrong length but they look fine).
**Status:** Working as intended for now. Shorter (15mm) shafts may be evaluated; this would require minor knob and case adjustments.

---

## Questions, contributions, fixes

This is v1.0. It works. It also has known rough edges, all listed above.

If you build one — please open an issue on GitHub with photos and any notes. If something in this guide was unclear or wrong, send a PR. If you fix one of the Known Issues, you'll be credited as a contributor.

— SeungHun