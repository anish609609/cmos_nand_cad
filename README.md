# CMOS 2-Input NAND Gate — Physical Layout & Fabrication CAD Viewer

An interactive 3D standard-cell Semiconductor CAD & VLSI fabrication viewer for a **CMOS 2-Input NAND (`NAND2`, `OUT = !(A · B)`)** gate built with **Three.js (r128)** and an integrated **Sarvam AI Voice Tutor** powered by `sarvam-105b-conversations` and `bulbul:v4-flash` progressive 24 kHz PCM streaming audio.

Designed with **zero build step** and **zero frontend framework dependencies**—classic global scripts load cleanly whether opened directly over `file://` in a browser or served via `node server.js` (or deployed to Vercel).

---

## 🌟 Highlights & Key Features

### 1. Realistic CMOS NAND2 Architecture & Physical Stack
- **Euler-Path Dual-Gate Topology:** Continuous vertical polysilicon gates (`Gate A` at `X = -3.0` and `Gate B` at `X = +3.0`) each simultaneously drive one pull-up PMOS and one pull-down NMOS transistor across an inter-well substrate corridor.
- **Parallel PMOS Pull-Up Network (`MP1 || MP2`) in N-Well:** Two P-channel MOSFETs share a single merged central `P+` drain (`X = 0.0`, `X ∈ [-2.0, +2.0]`) wired to `OUT`, with outer `P+` sources tied to the `VDD` rail and an `N+` N-Well body tap at `X = -9.0`.
- **Series NMOS Pull-Down Network (`MN2 + MN1`) in P-Well:** Two N-channel MOSFETs connected through an **uncontacted internal `N+` series silicon bridge** (`X ∈ [-2.0, +2.0]`) requiring zero Metal-1 contact, with `MN1` source tied to `GND`, `MN2` drain routed to `OUT`, and a `P+` substrate/P-Well body tap at `X = -9.0`.
- **Gaussian Doping Profiles & Iso-Concentration Contours:** Curved 3D Gaussian tubs (`createGaussianTubGeometry`) with procedural depth-profile gradients (`gaussianDepthTexture`), volumetric `coreMesh` interiors, 3 depth iso-concentration `LineLoop` rings (`η = 0.25, 0.50, 0.75`), and a wafer-surface perimeter loop for the N-Well, P-Well, `P+`/`N+` diffusions, shallow `P-SDE`/`N-SDE` (LDD) extensions, and body taps.
- **HKMG Dielectric Stack & Interconnects:** Interfacial thermal $\text{SiO}_2$ (`0.035` thickness) + ALD $\text{HfO}_2$ High-K gate dielectric (`0.035` thickness), 9 tapered CVD Tungsten (`W`) contact plugs, and planar zero-crossing brushed Metal-1 tracks (`VDD`, `GND`, `IN A`, `IN B`, `OUT`) featuring filleted corners, octagonal $5\lambda \times 5\lambda$ via landing pads, and $45^\circ$ chamfered T-junction brackets.
- **Mead-Conway $\lambda$ Process Node Scaling:** Live scaling across `1000nm`, `350nm`, `130nm`, `90nm` (default), `45nm`, and `16nm` process nodes in the right-hand Property Inspector & $\lambda$ Rules drawer.

### 2. AI Voice Tutor (Sarvam AI Bulbul v4 Flash)
- **Multilingual Voice & Chat:** Switch dynamically between **English (`en-IN`)**, **Hindi (`hi-IN`)**, and **Telugu (`te-IN`)** with matched speaker personas (`aparna_en_edtech`, `aparna_en_companion`, `aparna_hi_customer`, `shubh_hi_customer`, `ritu_hi_customer`, `kavitha_te_narration`).
- **Live CAD Context Injection:** Every prompt automatically includes the currently selected 3D component/layer, its Mead-Conway $\lambda$ design rules, and the live `NAND2` input/transistor/output state (`A`, `B`, `MP1`, `MP2`, `MN1`, `MN2`, `OUT`).
- **Real-Time Audio & Speech Recognition:** Progressive 24 kHz linear16 PCM playback via Web Audio API with an animated 5-bar frequency waveform visualizer, quick-prompt chips, and browser Web Speech API microphone input (`STT`).
- **Local Key Privacy:** API keys entered in the browser modal are stored only on your device (`localStorage`, with an optional session-only toggle) and sent solely to Sarvam AI directly or through `/api/voice-assistant`.

### 3. Step-by-Step 3D Fabrication Tour (`[▶ PLAY TOUR]`)
- **8-Step Sequential Layer Drop-In:** Builds the NAND2 cell from bare `P-Substrate` up to `Metal-1` with a 700 ms cubic-out drop animation and smoothstep camera/target interpolation per step.
- **Audio Lockstep & Background Prefetch:** Prefetches step `i + 1` TTS PCM audio in the background while step `i` narrates, synchronizing transitions on `AudioBufferSourceNode.onended` (with automatic fallback timing if no API key is configured).
- **Focus Mode:** Automatically hides drawer toggles during the tour and provides a live progress banner with `STOP TOUR` abort control (`#tour-stop-btn`) that cleanly restores layer visibility, explode offsets, and logic tints.

### 4. View Controls, 3-Axis Explode & Scrubbing
- **Independent `EXPLODE X / Y / Z` Sliders:** Expand the wafer stack vertically along `Y` (1% default rest offset up to 100%) and laterally along `X` / `Z` while keeping 3D labels and carrier flow curves synchronized.
- **Always-On `SCRUB X / Y / Z` Section Planes:** Real-time hardware `THREE.Plane` cross-section clipping across all meshes, Gaussian contours, and inner core volumes.
- **`PHYSICAL LAYOUT ⇄ SCHEMATIC` Cross-Probing:** Toggle between the 3D physical cell layout and an interactive 2D transistor schematic (`#nand2-schematic-svg`) where clicking any MOSFET, node, or rail selects and highlights its physical counterpart in 3D.

### 5. Logic State & Conduction Simulation
- **Full 2-Input NAND Truth Table (`A, B ∈ {0, 1, OFF}`):**
  - `A = 0, B = 0` → Both parallel pull-up PMOS (`MP1`, `MP2`) turn **ON** with simultaneous **dual-branch** animated flow cones from `VDD` through the shared `P+` drain to `OUT = 1`.
  - `A = 0, B = 1` or `A = 1, B = 0` → Single active pull-up branch (`MP1` or `MP2`) drives `OUT = 1`.
  - `A = 1, B = 1` → Both series pull-down NMOS (`MN2`, `MN1`) turn **ON**, routing a single **series conduction curve** from `OUT` through `MN2`, across the uncontacted `N+` silicon bridge, through `MN1` to `GND` (`OUT = 0`).
  - `OFF` on either input → `HIGH-Z / FLOATING` or `WEAK PULL / LEAK` stationary state with carrier flow paused and leaking/partial emissive tints.
- **Carrier Flow Mode Toggle (`CURRENT` vs `ELECTRONS`):** Reverses animated 3D flow cone direction and switches Metal-1 travelling wave & cone colors between conventional current (`#ffcf4d` gold) and electron flow (`#4fd1ff` cyan).

### 6. Dark / Light EDA Theme Engine
- **Synchronized Theme Toggle (`DARK` / `LIGHT`):** Persists theme preference in `localStorage` and dynamically updates CSS custom properties, Three.js scene background/fog, 3-point lighting, ground grid, shadow plane opacity, `gaussianDepthTexture` depth maps, `coreMesh` colors, auto-colored contour loops, selection highlight colors (`#ff2fb0` / `#db2777`), and 3D sprite labels.

---

## 🛠️ Getting Started

### Option 1: Direct Browser Launch (`file://`)
No build tool or server is required for the 3D CAD viewer, schematic, tour animations, or direct browser-to-Sarvam AI requests:
1. Clone or download the repository.
2. Double-click `index.html` (or open it in Chrome, Edge, Firefox, or Safari).

### Option 2: Node.js Local Server (Recommended for `/api/voice-assistant`)
Running the built-in Node server enables the local `/api/voice-assistant` proxy endpoint and server-side `.env` `SARVAM_API_KEY` support:
```bash
npm start
# or
node server.js
```
Then open `http://localhost:3000` in your browser. *(You can also override the port via `PORT=3123 node server.js`.)*

### Option 3: Static File Servers
```bash
# Using npx serve
npx serve .

# Using Python 3
python -m http.server 8000
```

---

## 🔑 Sarvam AI Voice Assistant Setup

1. Create or sign in to an account at **[https://dashboard.sarvam.ai](https://dashboard.sarvam.ai)** and generate an API subscription key.
2. Launch the CMOS NAND2 CAD Viewer and click the floating microphone/voice launcher button in the bottom-right viewport corner.
3. Click the **🔑 Key** icon in the Voice Tutor header to open the API Key Configuration modal.
4. Paste your Sarvam subscription key (`api-subscription-key`), optionally check **Session-only** to auto-clear when the tab closes, and click **SAVE KEY**. *(Alternatively, when running `node server.js` or deploying to Vercel, set `SARVAM_API_KEY` in `.env` or environment variables.)*
5. Ask questions via text, microphone STT, or the quick-prompt chips—your key never leaves your browser (`localStorage`) except when authenticating directly with Sarvam AI or your local `/api/voice-assistant` endpoint.

---

## 🏗️ CMOS Fabrication Sequence (Tour Steps)

| Step | Fabrication Stage | Layer Key(s) | Description |
| :--- | :--- | :--- | :--- |
| **1** | **P-Type Silicon Substrate Wafer** | `substrate` | Lightly boron-doped `<100>` silicon base and global ground-referenced bulk isolating the cell. |
| **2** | **Retrograde N-Well & P-Well Implantation** | `well` | Twin Gaussian wells: N-Well (`+Z`) for parallel PMOS pull-ups and P-Well (`-Z`) for series NMOS pull-downs separated by a `1.9λ` substrate corridor. |
| **3** | **Active Diffusions, SDEs & Series N+ Bridge** | `active`, `sde` | Heavy `P+`/`N+` S/D islands, shallow `P-SDE`/`N-SDE` extensions, shared central `P+` drain, and the uncontacted internal `N+` series bridge. |
| **4** | **Interfacial Thermal Gate Oxide (SiO2)** | `oxide` | Ultra-thin thermal silicon dioxide across all four channel windows (`MP1`, `MP2`, `MN1`, `MN2`) beneath Gates A and B. |
| **5** | **Atomic Layer Deposited High-K (HfO2)** | `highk` | High-permittivity $\text{HfO}_2$ dielectric ($\varepsilon_r \approx 22$) boosting gate capacitance while suppressing tunneling leakage. |
| **6** | **Dual Continuous Polysilicon Gates (A & B)** | `poly` | Two parallel vertical Euler-path polysilicon stripes (`Gate A` and `Gate B`), each controlling one PMOS and one NMOS device. |
| **7** | **Nine Tapered Tungsten Contact Plugs** | `contact` | Nine tapered CVD-W plugs linking well taps, PMOS sources/shared drain, NMOS source/top drain, and Gates A & B inside the inter-well corridor. |
| **8** | **Planar Zero-Crossing Metal-1 Interconnect** | `metal` | Brushed Metal-1 `VDD`, `GND`, `IN A`, `IN B`, and `OUT` routing with octagonal $5\lambda$ via pads and $45^\circ$ chamfered T-junctions. |

---

## 📂 Project Architecture

```text
cmos_nand_cad/
├── index.html                  # Main CAD studio layout, topbar, drawers, HUDs, 2D SVG schematic & footer
├── package.json                # Package metadata & start/dev scripts
├── server.js                   # Zero-dependency Node HTTP server + .env loader + /api/voice-assistant router
├── vercel.json                 # Vercel rewrite rules for /api/* serverless functions
├── LICENSE                     # MIT License
├── README.md                   # Project documentation
├── api/
│   └── voice-assistant.js      # Serverless proxy for Sarvam 105B chat & Bulbul v4 Flash streaming PCM TTS
├── css/
│   └── style.css               # Dark/Light EDA theme variables, panels, HUDs, schematic, voice widget & footer
└── js/
    ├── data.js                 # LEGEND layer metadata & INFO semiconductor CAD dictionary
    ├── scene.js                # Three.js scene, camera, WebGLRenderer, 3-point lighting, grid & studio envMap
    ├── theme.js                # cssVar() reader, Dark/Light state & localStorage theme persistence
    ├── geometry.js             # Gaussian tubs, contour LineLoops, textures, BoxGeometry stacks, Metal-1 & labels
    ├── ui-panels.js            # Architecture tree, VIRTUAL composites, layer visibility toggles & legend UI
    ├── selection.js            # Raycaster picking, theme-aware highlight, Property Inspector & 3D popover
    ├── controls-explode-scrub.js # 3-axis EXPLODE X/Y/Z & always-on THREE.Plane SCRUB X/Y/Z sliders
    ├── dimensions.js           # Mead-Conway λ process node presets (1000nm -> 16nm) & DIM_RULES table
    ├── view-mode.js            # Physical Layout <-> 2D Schematic switcher & SVG [data-id] cross-probing
    ├── flow.js                 # CatmullRomCurve3 dual-PMOS & series-NMOS carrier paths + cone pools
    ├── logic-state.js          # NAND2 truth table, per-transistor emissive tints & live status HUD
    ├── build-anim.js           # 8-step 3D Fabrication Tour animation, camera lerp & audio prefetch lockstep
    ├── render-loop.js          # Animation loop, Metal-1 travelling glow wave, flow updates & popover sync
    ├── main.js                 # Drawer collapse toggles, HUD offset sync, RESET handler & startup loader
    └── voice-assistant.js      # Sarvam AI Voice Tutor UI, 24 kHz PCM Web Audio streamer & Web Speech STT
```

---

## 📐 Lambda (λ) Design Rules

All layout geometry and dimension readouts in `js/dimensions.js` scale dynamically across six Mead-Conway process node presets (`LAMBDA_PRESETS`):

| Process Node | $\lambda$ | Gate Length ($2\lambda$) | Interfacial $\text{SiO}_2$ (EOT) | ALD $\text{HfO}_2$ (HK) | Era / Technology |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`1000nm`** | `500 nm` | `1 µm` | `20.0 nm` | `N/A (SiO2 only)` | `1985 · 1.0 µm Planar` |
| **`350nm`** | `175 nm` | `350 nm` | `7.0 nm` | `N/A (SiO2 only)` | `1995 · 0.35 µm CMOS` |
| **`130nm`** | `65 nm` | `130 nm` | `2.2 nm` | `N/A (SiO2 only)` | `2001 · 130 nm Cu/Poly` |
| **`90nm`** *(default)* | `45 nm` | `90 nm` | `1.2 nm` | `2.2 nm (εr≈22)` | `2004 · 90 nm Strained Si` |
| **`45nm`** | `22.5 nm` | `45 nm` | `0.9 nm` | `2.0 nm (εr≈22)` | `2007 · 45 nm HKMG` |
| **`16nm`** | `8 nm` | `16 nm` | `0.7 nm` | `1.6 nm (εr≈22)` | `2014 · 16 nm FinFET/HK` |

Exact Mead-Conway $\lambda$ rules (`DIM_RULES`, shown below with `90nm` default values):

| Rule Key | Design Rule | $\lambda$ Expression | Value at `90nm` ($\lambda = 45\text{ nm}$) |
| :--- | :--- | :--- | :--- |
| `gateLen` | Gate Length (`L_min`) | `2λ` | `90 nm` |
| `polyPitch` | Gate A ↔ Gate B Spacing | `4λ` | `180 nm` |
| `polyExt` | Poly Endcap Past Active | `2λ` | `90 nm` |
| `activeW` | Transistor Active Width (`W`) | `6λ` | `270 nm` |
| `sdLen` | S/D Diffusion Length | `3λ` | `135 nm` |
| `sharedBridge` | Shared Drain / Series Bridge | `4λ` | `180 nm` |
| `sdeOverlap` | SDE / LDD Gate Overlap | `0.55λ` | `24.8 nm` |
| `wellEnc` | Well Enclosure of Active | `6λ` | `270 nm` |
| `wellGap` | N-Well ↔ P-Well Corridor | `1.9λ` | `85.5 nm` |
| `oxideThick` | Interfacial SiO2 Thickness | `EOT` | `1.2 nm` |
| `highkThick` | ALD HfO2 Physical Thickness | `HK` | `2.2 nm (εr≈22)` |
| `contactCut` | Tungsten Contact Cut | `2λ × 2λ` | `90 nm sq` |
| `metalW` | Metal-1 Track Width | `3λ` | `135 nm` |
| `metalSpace` | Metal-1 Minimum Spacing | `3λ` | `135 nm` |
| `viaPad` | Octagonal Via Landing Pad | `5λ × 5λ (1λ chamfer)` | `225 nm sq` |
| `cellPitch` | NAND2 Cell Area (`X × Z`) | `24λ × 25λ` | `1.08 µm × 1.13 µm` |

---

## ⚠️ Conceptual Accuracy Disclaimer

This CAD viewer is an **educational and conceptual visualization** of a CMOS 2-input NAND standard cell. Vertical layer thicknesses, Gaussian doping contours, contact aspect ratios, and static DC conduction/carrier animations are stylized and proportionally scaled for 3D clarity rather than foundry-signoff DRC/LVS or TCAD device simulation.

---

## 🤝 Contributing

Contributions, bug fixes, and enhancements are welcome!
1. Fork the repository (`https://github.com/anish609609/cmos_nand_cad`).
2. Create a feature branch (`git checkout -b feature/your-improvement`).
3. Commit your changes clearly and open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Raydurg Anish**
- Portfolio: [https://raydurg-anish-portfolio-amta50oot-anish609609s-projects.vercel.app/](https://raydurg-anish-portfolio-amta50oot-anish609609s-projects.vercel.app/)
- GitHub: [https://github.com/anish609609](https://github.com/anish609609)
