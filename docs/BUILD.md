# Patternflow v1.1.0 — Build Guide

This guide walks you through building a Patternflow v1.1.0 from scratch. It assumes basic familiarity with soldering (through-hole + simple SMD) and 3D printing.

**Estimated build time:** 4–6 hours of active work, plus ~11 hours of 3D printing.

**Skill level:** Intermediate. If you've assembled a mechanical keyboard or built an Arduino project with SMD components, you're ready.

![All parts laid out before assembly](build-guide/images/all_parts.jpg)

---

## Table of Contents

1. [Bill of Materials (BOM)](#1-bill-of-materials-bom)
2. [3D Printing](#2-3d-printing)
3. [Case Bonding](#3-case-bonding)
4. [PCB Assembly](#4-pcb-assembly)
5. [LED Matrix](#5-led-matrix)
6. [Final Integration](#6-final-integration)
7. [Firmware Upload](#7-firmware-upload)
8. [First Boot](#8-first-boot)
9. [Known Issues](#9-known-issues)

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

## 3. Case Bonding

Before any assembly, bond the 3D-printed case halves together. The main body and back panel each print in upper and lower halves (too tall for most printers in one piece).

### 3.1 Bond the main body and back panel

1. **Main body (front + sides):** Apply super glue along the seam between the upper and lower halves. Press firmly until set.
2. **Back panel:** Bond upper and lower halves the same way.

Allow ~5 minutes to fully cure before handling.

<img src="build-guide/images/case_bond.jpg" width="33%">

### 3.2 Bond the internal divider

Inside the main body, a divider plate separates the LED matrix compartment from the PCB + power bank compartment. It has a hole for the USB cable to pass through.

**Insert the divider from the front side (power bank / lower side), sliding it up into position.** Apply super glue along the edges to bond it to the case interior. Do not insert from the back.

> 📷 *Photo coming soon — will be added in a future update.*

---

## 4. PCB Assembly

Solder smallest components first, working up to larger through-hole parts.

### 4.1 SMD Pass — Resistors and Capacitors (R1–R12, C1–C10, C12–C15)

You can use solder paste with a heat gun or hot plate. This guide uses the hand-soldering method.

**Work by component type** — all resistors first, then all capacitors (or vice versa).

> ⚠️ **Silkscreen note:** The v1.1.0 PCB silkscreen does not clearly distinguish 0805 resistors from 0805 capacitors. **Rule of thumb: the 0805 pad closest to each rotary encoder footprint is a capacitor. The other 0805 pads are resistors.** Refer to the schematic in `hardware/pcb/` when in doubt. This will be corrected in a future PCB revision.

**Hand-soldering technique:**

1. Apply flux to all SMD pads.
2. Tin one pad of every position with a small amount of solder.
3. Component by component: hold with tweezers, tack onto the tinned pad, reflow.
4. Solder the opposite pad of each component.

**Iron temperature:** ~350°C. **Keep parts flat and centered.**

### 4.2 Through-Hole Pass

Solder in order (smallest first):

1. **Female pin sockets (1×22 ×2)** — front of PCB. The ESP32 plugs in here later; do not solder it directly.
2. **J1 (HUB75 box header), J2 (USB power input screw terminal), J3 (LED matrix power screw terminal).**
3. **C11 (1000µF electrolytic)** — watch polarity: long lead = positive.

### 4.3 Rotary Encoders — ⚠️ CRITICAL

> ⚠️ **CRITICAL — Encoders MUST go on the BACK of the PCB. Ignore the silkscreen.**
>
> The silkscreen on v1.1.0 has the rotary encoder footprint marked on the **wrong side** — a known issue being corrected in the next PCB revision. **Solder all 4 rotary encoders (SW1–SW4) on the back of the PCB** (opposite side from the ESP32 socket), so the shafts protrude through the front panel of the case.
>
> Soldering encoders on the wrong side makes the build non-functional. Through-hole desoldering from a fully populated PCB is extremely difficult. **Flip the PCB, confirm you are on the back side, then solder every encoder.**

Press all encoder pins flush against the PCB and perpendicular before soldering.

### 4.4 ESP32 Pin Reference (Custom PCB / Schematic Reference)

If you are designing your own PCB or verifying wiring manually, the table below lists every pin assignment for the ESP32-S3-WROOM-1 N16R8 DevKit as used in Patternflow v1.1.0. Numbering is top-to-bottom with the USB connector at the top.

#### Left Side (top → bottom)

| # | Pin | Function |
| --- | --- | --- |
| 1 | 3V3 | +3.3 V supply |
| 2 | 3V3 | +3.3 V supply |
| 3 | RST | Not connected (NC) |
| 4 | IO4 | ENC1_A |
| 5 | IO5 | ENC2_A |
| 6 | IO6 | ENC3_A |
| 7 | IO7 | ENC4_A |
| 8 | IO15 | ENC2_SW |
| 9 | IO16 | ENC3_B |
| 10 | IO17 | ENC3_SW |
| 11 | IO18 | ENC4_B |
| 12 | IO8 | ENC1_B |
| 13 | IO3 | Not connected (NC) |
| 14 | IO46 | HUB_A |
| 15 | IO9 | ENC1_SW |
| 16 | IO10 | ENC2_B |
| 17 | IO11 | HUB_B |
| 18 | IO12 | HUB_D |
| 19 | IO13 | HUB_B2 |
| 20 | IO14 | HUB_OE |
| 21 | 5V | +5 V input |
| 22 | GND | GND |

#### Right Side (top → bottom)

| # | Pin | Function |
| --- | --- | --- |
| 23 | GND | GND |
| 24 | TX | Not connected (NC) |
| 25 | RX | Not connected (NC) |
| 26 | IO1 | ENC4_SW |
| 27 | IO2 | HUB_CLK |
| 28 | IO42 | HUB_R1 |
| 29 | IO41 | HUB_G1 |
| 30 | IO40 | HUB_B1 |
| 31 | IO39 | HUB_G2 |
| 32 | IO38 | HUB_R2 |
| 33 | IO37 | NC (PSRAM internal) |
| 34 | IO36 | NC (PSRAM internal) |
| 35 | IO35 | NC (PSRAM internal) |
| 36 | IO0 | Not connected (NC) |
| 37 | IO45 | Not connected (NC) |
| 38 | IO48 | HUB_C |
| 39 | IO47 | HUB_LAT |
| 40 | IO21 | HUB_E |
| 41 | IO20 | Not connected (NC) |
| 42 | IO19 | Not connected (NC) |
| 43 | GND | GND |
| 44 | GND | GND |

> IO35–IO37 are internally connected to the PSRAM on the N16R8 variant. Do not use these pins for external connections.

---

## 5. LED Matrix

### 5.1 Trim the alignment bumps

The LED matrix has two small alignment bumps on its back, diagonally opposite each other. These prevent it from sitting flat against the case.

**Cut them off with strong nippers or pliers.** Slight residual nubs are fine — flat enough is flat enough.

<img src="build-guide/images/matrix_bump_cut1.jpg" width="33%"> <img src="build-guide/images/matrix_bump_cut2.jpg" width="33%">

> A future case revision will include recesses for these bumps so trimming isn't needed.

### 5.2 Connect the matrix cables to the PCB

Before mounting the matrix, prepare and connect both cables to the PCB so they're ready when the PCB goes into the case.

- **HUB75 ribbon cable** — connect from the LED matrix to `J1` (box header on PCB).
- **Power cable (red/black)** — connect to `J3` (right screw terminal). The power line has two red (+) and two black (−) wires — bundle each pair before inserting:
  - Inner terminal → +5V (bundle both red wires)
  - Outer terminal → GND (bundle both black wires)

Cut both cables to a workable length and strip the power cable wires. Hold each cable in position to judge reach — exact measurements will be added in a future update.

> ⚠️ Watch polarity on J3 — red to +5V, black to GND.

### 5.3 Mount the matrix to the case

1. From the front of the case, lower the LED matrix into its slot.
2. Flip the case over.
3. From the back, secure the matrix with M4 screws (× 6).

> The screws thread directly into the LED matrix's mounting holes. Don't over-tighten.

<img src="build-guide/images/matrix_screw.jpg" width="33%">

---

## 6. Final Integration

<img src="build-guide/images/parts_layout.jpg" width="33%">

### 6.1 Wire the USB power input

Before inserting the PCB into the case, connect the USB power cable to `J2` (left screw terminal).

Cut the USB cable short — trim it to route through the divider hole without excessive slack. Strip the +5V (red) and GND (black) wires.

<img src="build-guide/images/usb_wire_cut.jpg" width="33%">

Pass the cable through the divider hole. Connect to `J2`:

- **Inner terminal → +5V (red)**
- **Outer terminal → GND (black)**

Tighten with a small screwdriver.

<img src="build-guide/images/pcb_left_screw.jpg" width="33%">

<img src="build-guide/images/power_wire_measure.jpg" width="33%">

> J2 (USB input) and J3 (LED matrix output) are connected internally on the PCB — no external bridging needed.

### 6.2 Insert the PCB

The PCB sits in the dedicated slot with the rotary encoder shafts facing through the front panel. The slot is intentionally tight. To install:

1. Hold the PCB at an angle, encoder side down.
2. Slide the bottom row of encoders into their slots first.
3. While tilting the PCB flat, guide the upper encoders into their slots simultaneously.
4. Push the PCB flat against the case interior.

<video src="build-guide/images/pcb_insert.webm" autoplay loop muted playsinline width="45%"></video> <img src="build-guide/images/pcb_inserted.jpg" width="45%">

### 6.3 Tighten the encoder nuts

From the front of the case, thread each rotary encoder's nut and tighten with a wrench or pliers. This locks both the encoder shaft and the PCB in place.

<img src="build-guide/images/encoder_nut.jpg" width="33%">

### 6.4 Attach the back cover

Slide the back cover panel into place along the rear of the case.

<img src="build-guide/images/back_cover.jpg" width="33%">

### 6.5 Attach the knobs

Press-fit the four black knobs onto the encoder shafts.

<img src="build-guide/images/knobs.jpg" width="33%">

### 6.6 Close the PCB compartment

Slide the PCB compartment cover panel into its slot to close off the electronics section.

<img src="build-guide/images/pcb_slider.jpg" width="33%">

### 6.7 Slide in the power bank cover

Insert the power bank into the compartment, then slide the battery cover in to hold everything in place.

<img src="build-guide/images/battery_slider.jpg" width="33%">

---

## 7. Firmware Upload

There are two ways to flash firmware onto your Patternflow: the browser-based flasher (recommended, no toolchain needed) or Arduino IDE for manual/custom builds.

### 7.1 Browser Flash (Recommended)

No installation required. Works on any desktop with Chrome or Edge.

1. Visit **[patternflow.work](https://patternflow.work)** on a desktop browser.
2. Connect your ESP32-S3 **separately** to your computer via a USB-C data cable — do not insert it into the PCB yet.
3. Scroll to the **Patterns** section and click **"Flash Patternflow v1 (All Patterns)"**.
4. Select the correct serial port when prompted and follow the on-screen steps.

<img src="build-guide/images/web_flash.jpg" width="33%">

5. Once flashing is complete, disconnect the USB-C cable.
6. Insert the flashed ESP32-S3 module into the female pin sockets on the Patternflow PCB.

<img src="build-guide/images/esp32_insert.jpg" width="33%">

> ⚠️ The Web Serial API is only supported on **desktop Chrome and Edge**. Firefox and Safari are not supported.

### 7.2 Arduino IDE (Manual / Custom Builds)

Use this method if you want to modify the firmware source, or if the browser flasher does not work for your setup.

#### Prerequisites

- Arduino IDE (latest version)
- ESP32 board package installed (Tools → Board → Boards Manager → search "esp32")

#### Board Settings

In Arduino IDE, **Tools** menu:

- **Board:** ESP32S3 Dev Module
- **PSRAM:** OPI PSRAM
- **Flash Size:** 16MB
- **Partition Scheme:** 16M Flash (3MB APP/9.9MB FATFS) or similar with PSRAM-aware partition
- **USB CDC On Boot:** Disabled
- **Upload Mode:** UART0 / Hardware CDC

#### Upload

1. Connect the ESP32-S3 module to your computer with a USB-C data cable.
2. Select the correct port under **Tools → Port**.
3. Open `firmware/patternflow_v1/patternflow_v1.ino`.
4. Check `firmware/patternflow_v1/config.h` to adjust pin mappings, brightness, or pattern limits if needed.
5. Click **Upload**.

If the upload fails, hold **BOOT** on the ESP32-S3 while pressing **RESET**, then click Upload again.

### 7.3 OTA (Preview)

OTA updates work via Arduino IDE's network port option once the device has been on the same Wi-Fi network at least once. **OTA in v1.0 is functional but not the recommended path.** Use the browser flasher or wired upload as the primary method.

---

## 8. First Boot

1. Plug the user's power bank into the USB cable wired into J2.
2. **Press the RESET button on the ESP32-S3 module once.**
3. The LED matrix should illuminate with the default pattern.
4. Turn the four knobs to confirm they all respond.

<img src="build-guide/images/first_boot.jpg" width="33%">

> The reset-button-on-first-boot step is a known v1.0 issue (see below). A fix is planned.

---

## 9. Known Issues

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

**Note:** The encoders in the BOM use 20mm shafts. Earlier notes mentioned 15mm as a possible alternative — **ignore this; 20mm is the correct and intended length.** The 3D-printed knobs and case are modeled for 20mm shafts and will fit correctly. Use the linked EC11 20mm part from the sourcing list.

---

## Questions, contributions, fixes

This is v1.0. It works. It also has known rough edges, all listed above.

If you build one — please open an issue on GitHub with photos and any notes. If something in this guide was unclear or wrong, send a PR. If you fix one of the Known Issues, you'll be credited as a contributor.

— SeungHun