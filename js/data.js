/* Global layer legend and detailed semiconductor CAD inspection dictionary for CMOS 2-Input NAND (NAND2) */

var LEGEND = [
  {
    key: 'substrate',
    label: 'P-Substrate',
    color: 'var(--c-substrate)',
    note: 'Lightly boron-doped p-type silicon wafer (~1e15 cm⁻³)'
  },
  {
    key: 'well',
    label: 'N-Well & P-Well',
    color: 'var(--c-well)',
    note: 'Twin-well retrograde Gaussian implants isolating PMOS & NMOS'
  },
  {
    key: 'active',
    label: 'Active S/D & Taps',
    color: 'linear-gradient(135deg, var(--c-active-p) 50%, var(--c-active-n) 50%)',
    note: 'Heavy P+ (amber) & N+ (blue) source/drain diffusions & series N+ bridge'
  },
  {
    key: 'sde',
    label: 'SDE / LDD Extensions',
    color: 'linear-gradient(135deg, var(--c-sde-p) 50%, var(--c-sde-n) 50%)',
    note: 'Shallow Drain/Source Extensions reducing hot-carrier & SCE effects'
  },
  {
    key: 'oxide',
    label: 'Gate Oxide (SiO2)',
    color: 'var(--c-oxide)',
    note: 'Ultra-thin thermal interfacial SiO2 (~0.8–1.2 nm EOT)'
  },
  {
    key: 'highk',
    label: 'High-K (HfO2)',
    color: 'var(--c-highk)',
    note: 'ALD Hafnium Dioxide dielectric suppressing gate tunneling leakage'
  },
  {
    key: 'poly',
    label: 'Polysilicon Gates',
    color: 'var(--c-poly)',
    note: 'Continuous vertical Gate A & Gate B stripes (Euler-path layout)'
  },
  {
    key: 'contact',
    label: 'Tungsten Contacts',
    color: '#4a4d54',
    note: '9 tapered CVD-W plugs bridging silicon/poly to Metal-1'
  },
  {
    key: 'metal',
    label: 'Metal-1 Interconnect',
    color: 'var(--c-metal)',
    note: 'Planar zero-crossing Cu/Al Metal-1 with 45° chamfered junctions'
  }
];

var INFO = {
  /* Substrate */
  psub: {
    title: 'P-Type Silicon Substrate',
    layer: 'substrate',
    type: 'Boron-doped crystalline Si <100> (~1e15 cm⁻³)',
    role: 'Mechanical wafer base and global ground-referenced bulk body isolating the N-Well (+Z) and P-Well (-Z) across the 1.90-unit central substrate corridor.',
    process: 'Czochralski single-crystal wafer with shallow trench isolation (STI) field regions defining active PMOS/NMOS islands.'
  },

  /* Twin Wells */
  nwell: {
    title: 'N-Well (Pull-Up Body)',
    layer: 'well',
    type: 'Phosphorus/Arsenic retrograde Gaussian well (~5e16 cm⁻³)',
    role: 'Provides the n-type body for parallel pull-up PMOS transistors MP1 and MP2. Tied to VDD via the N+ well tap to reverse-bias the well-to-substrate diode.',
    process: 'High-energy chained phosphorus ion implantation + rapid thermal anneal (RTA) forming a curved lateral straggle profile.'
  },
  pwell: {
    title: 'P-Well (Pull-Down Body)',
    layer: 'well',
    type: 'Boron retrograde Gaussian well (~5e16 cm⁻³)',
    role: 'Provides a controlled p-type threshold-adjusted body for series pull-down NMOS transistors MN1 and MN2. Tied to GND via the P+ substrate tap.',
    process: 'Twin-well boron implantation + drive-in anneal preventing latch-up and setting NMOS Vth.'
  },

  /* Body Taps */
  welltapAct: {
    title: 'N-Well Body Tap (N+)',
    layer: 'active',
    type: 'Heavy N+ diffusion in N-Well (~1e20 cm⁻³)',
    role: 'Ohmic contact region biasing the N-Well at VDD so the PMOS source/drain junctions remain reverse-biased and latch-up is suppressed.',
    process: 'Co-implanted with NMOS N+ S/D arsenic/phosphorus dose using N+ mask inside the N-Well.'
  },
  subtapAct: {
    title: 'P-Well / Substrate Tap (P+)',
    layer: 'active',
    type: 'Heavy P+ diffusion in P-Well (~1e20 cm⁻³)',
    role: 'Ohmic contact region tying the P-Well and P-Substrate cleanly to GND, sinking majority hole substrate currents.',
    process: 'Co-implanted with PMOS P+ S/D BF2/boron dose inside the P-Well.'
  },

  /* PMOS Active Diffusions */
  pmosASrc: {
    title: 'MP1 Source (P+ -> VDD)',
    layer: 'active',
    type: 'Boron-doped P+ diffusion (~1e20 cm⁻³)',
    role: 'Supplies VDD hole current into PMOS A (MP1) when Gate A is driven low (A = 0). Tied directly to the VDD rail via contact pmosASrcCt.',
    process: 'Self-aligned P+ source/drain implant masked by Poly Gate A and nitride spacers.'
  },
  pmosSharedDrn: {
    title: 'Shared PMOS Drain (P+ -> OUT)',
    layer: 'active',
    type: 'Merged P+ drain island (~1e20 cm⁻³)',
    role: 'Central Euler-shared drain of BOTH parallel PMOS devices (MP1 and MP2). If EITHER A = 0 OR B = 0, holes pull this node cleanly to VDD (OUT = 1).',
    process: 'Single merged P+ diffusion spanning X ∈ [-2.0, +2.0] between Gate A and Gate B, eliminating redundant spacing and cutting output capacitance.'
  },
  pmosBSrc: {
    title: 'MP2 Source (P+ -> VDD)',
    layer: 'active',
    type: 'Boron-doped P+ diffusion (~1e20 cm⁻³)',
    role: 'Supplies VDD hole current into PMOS B (MP2) when Gate B is driven low (B = 0). Tied to VDD via contact pmosBSrcCt.',
    process: 'Self-aligned P+ implant outside Gate B.'
  },

  /* NMOS Active Diffusions */
  nmosASrc: {
    title: 'MN1 Source (N+ -> GND)',
    layer: 'active',
    type: 'Arsenic-doped N+ diffusion (~1e20 cm⁻³)',
    role: 'Ground return of the series NMOS pull-down stack. Sinks output charge to GND only when BOTH MN1 (A = 1) and MN2 (B = 1) conduct simultaneously.',
    process: 'Self-aligned N+ implant + CoSi2/NiSi silicidation for low contact resistance.'
  },
  nmosMidNode: {
    title: 'Series N+ Bridge (Internal Node)',
    layer: 'active',
    type: 'Uncontacted N+ diffusion island (~1e20 cm⁻³)',
    role: 'Pure silicon diffusion bridge connecting MN1 drain directly to MN2 source in series! Requires NO Metal-1 contact, saving area and parasitic capacitance.',
    process: 'Continuous N+ island spanning X ∈ [-2.0, +2.0] between Poly Gate A and Poly Gate B in the P-Well.'
  },
  nmosBDrn: {
    title: 'MN2 Drain (N+ -> OUT)',
    layer: 'active',
    type: 'Arsenic-doped N+ diffusion (~1e20 cm⁻³)',
    role: 'Top drain of the series pull-down network connected to Metal-1 OUT via contact nmosBDrnCt. Discharges OUT to 0 when A = 1 and B = 1.',
    process: 'Self-aligned N+ implant outside Gate B in the P-Well.'
  },

  /* SDE / LDD Extensions */
  pmosASrcSde: {
    title: 'MP1 Source P-SDE',
    layer: 'sde',
    type: 'Shallow P-type Drain Extension (~2e19 cm⁻³)',
    role: 'Graded shallow junction tucking slightly beneath Gate A left edge to ensure continuous channel inversion overlap while curbing short-channel drain-induced barrier lowering (DIBL).',
    process: 'Low-energy BF2 implant performed immediately after gate etch, prior to spacer deposition.'
  },
  pmosADrnSde: {
    title: 'MP1 Drain P-SDE',
    layer: 'sde',
    type: 'Shallow P-type Drain Extension (~2e19 cm⁻³)',
    role: 'Links the Gate A inversion channel into the shared P+ drain island with reduced peak lateral electric field.',
    process: 'Low-energy BF2 LDD implant + spike anneal.'
  },
  pmosBDrnSde: {
    title: 'MP2 Drain P-SDE',
    layer: 'sde',
    type: 'Shallow P-type Drain Extension (~2e19 cm⁻³)',
    role: 'Links the Gate B inversion channel into the shared P+ drain island.',
    process: 'Low-energy BF2 LDD implant + spike anneal.'
  },
  pmosBSrcSde: {
    title: 'MP2 Source P-SDE',
    layer: 'sde',
    type: 'Shallow P-type Drain Extension (~2e19 cm⁻³)',
    role: 'Graded junction interfacing Gate B right channel edge to MP2 P+ source.',
    process: 'Low-energy BF2 LDD implant.'
  },
  nmosASrcSde: {
    title: 'MN1 Source N-SDE',
    layer: 'sde',
    type: 'Shallow N-type Drain Extension (~2e19 cm⁻³)',
    role: 'Shallow arsenic extension interfacing MN1 source to Gate A channel edge, suppressing hot-carrier injection.',
    process: 'Low-energy As+ LDD implant before sidewall spacer formation.'
  },
  nmosADrnSde: {
    title: 'MN1 Drain N-SDE',
    layer: 'sde',
    type: 'Shallow N-type Drain Extension (~2e19 cm⁻³)',
    role: 'Links Gate A NMOS channel smoothly into the series N+ bridge.',
    process: 'Low-energy As+ LDD implant.'
  },
  nmosBSrcSde: {
    title: 'MN2 Source N-SDE',
    layer: 'sde',
    type: 'Shallow N-type Drain Extension (~2e19 cm⁻³)',
    role: 'Links the series N+ internal bridge into Gate B NMOS channel.',
    process: 'Low-energy As+ LDD implant.'
  },
  nmosBDrnSde: {
    title: 'MN2 Drain N-SDE',
    layer: 'sde',
    type: 'Shallow N-type Drain Extension (~2e19 cm⁻³)',
    role: 'Graded junction relieving high electric field at MN2 drain edge connected to OUT.',
    process: 'Low-energy As+ LDD implant.'
  },

  /* Gate Oxide (SiO2) */
  pmosAOxide: {
    title: 'MP1 Interfacial Gate Oxide (SiO2)',
    layer: 'oxide',
    type: 'Thermal Silicon Dioxide (εr ≈ 3.9)',
    role: 'Atomically smooth interfacial layer beneath HfO2 preserving high hole mobility and low interface trap density (Dit) in MP1.',
    process: 'Rapid thermal oxidation (RTO) or chemical oxide (~0.5–1.0 nm physical).'
  },
  pmosBOxide: {
    title: 'MP2 Interfacial Gate Oxide (SiO2)',
    layer: 'oxide',
    type: 'Thermal Silicon Dioxide (εr ≈ 3.9)',
    role: 'Interfacial barrier beneath HfO2 under Gate B in the N-Well.',
    process: 'Rapid thermal oxidation.'
  },
  nmosAOxide: {
    title: 'MN1 Interfacial Gate Oxide (SiO2)',
    layer: 'oxide',
    type: 'Thermal Silicon Dioxide (εr ≈ 3.9)',
    role: 'Preserves electron channel quality under Gate A in the P-Well.',
    process: 'Rapid thermal oxidation.'
  },
  nmosBOxide: {
    title: 'MN2 Interfacial Gate Oxide (SiO2)',
    layer: 'oxide',
    type: 'Thermal Silicon Dioxide (εr ≈ 3.9)',
    role: 'Preserves electron channel quality under Gate B in the P-Well.',
    process: 'Rapid thermal oxidation.'
  },

  /* High-K (HfO2) */
  pmosAHighk: {
    title: 'MP1 High-K Dielectric (HfO2)',
    layer: 'highk',
    type: 'Hafnium Dioxide (εr ≈ 22)',
    role: 'Provides high gate capacitance (small EOT) with greater physical thickness, cutting quantum tunneling gate leakage by orders of magnitude.',
    process: 'Atomic Layer Deposition (ALD) of HfO2 followed by post-deposition anneal.'
  },
  pmosBHighk: {
    title: 'MP2 High-K Dielectric (HfO2)',
    layer: 'highk',
    type: 'Hafnium Dioxide (εr ≈ 22)',
    role: 'High-permittivity gate insulator for MP2 under Gate B.',
    process: 'ALD HfO2 deposition.'
  },
  nmosAHighk: {
    title: 'MN1 High-K Dielectric (HfO2)',
    layer: 'highk',
    type: 'Hafnium Dioxide (εr ≈ 22)',
    role: 'High-permittivity gate insulator for MN1 under Gate A.',
    process: 'ALD HfO2 deposition.'
  },
  nmosBHighk: {
    title: 'MN2 High-K Dielectric (HfO2)',
    layer: 'highk',
    type: 'Hafnium Dioxide (εr ≈ 22)',
    role: 'High-permittivity gate insulator for MN2 under Gate B.',
    process: 'ALD HfO2 deposition.'
  },

  /* Polysilicon Gates */
  polyA: {
    title: 'Polysilicon Gate A (MP1 + MN1)',
    layer: 'poly',
    type: 'Silicided Gate Electrode (X = -3.0, L = 2λ)',
    role: 'Continuous vertical Euler-path gate simultaneously driving PMOS MP1 (active low) and NMOS MN1 (active high) from Input A.',
    process: 'LPCVD polysilicon / HKMG patterning with 193nm/EUV lithography and anisotropic RIE.'
  },
  polyB: {
    title: 'Polysilicon Gate B (MP2 + MN2)',
    layer: 'poly',
    type: 'Silicided Gate Electrode (X = +3.0, L = 2λ)',
    role: 'Continuous vertical Euler-path gate simultaneously driving PMOS MP2 (active low) and NMOS MN2 (active high) from Input B.',
    process: 'LPCVD polysilicon / HKMG patterning aligned parallel to Gate A.'
  },

  /* 9 Tungsten Contacts */
  welltapCt: {
    title: 'Contact: N-Well Tap -> VDD',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Plug',
    role: 'Connects Metal-1 VDD stub to the N+ well tap at (-9.0, +4.85).',
    process: 'ILD etch + Ti/TiN barrier liner + CVD Tungsten fill + CMP planarization.'
  },
  pmosASrcCt: {
    title: 'Contact: MP1 Source -> VDD',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Plug',
    role: 'Delivers VDD rail potential into MP1 P+ source at (-5.5, +4.85).',
    process: 'TiN liner + CVD-W contact plug.'
  },
  pmosSharedDrnCt: {
    title: 'Contact: Shared PMOS Drain -> OUT',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Plug',
    role: 'Extracts pull-up output current from the merged MP1/MP2 P+ drain at (0.0, +4.85) onto the Metal-1 OUT net.',
    process: 'TiN liner + CVD-W contact plug.'
  },
  pmosBSrcCt: {
    title: 'Contact: MP2 Source -> VDD',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Plug',
    role: 'Delivers VDD rail potential into MP2 P+ source at (+5.5, +4.85).',
    process: 'TiN liner + CVD-W contact plug.'
  },
  subtapCt: {
    title: 'Contact: P-Well Tap -> GND',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Plug',
    role: 'Connects Metal-1 GND stub to the P+ substrate tap at (-9.0, -4.85).',
    process: 'TiN liner + CVD-W contact plug.'
  },
  nmosASrcCt: {
    title: 'Contact: MN1 Source -> GND',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Plug',
    role: 'Connects MN1 N+ source at (-5.5, -4.85) to the Metal-1 GND rail.',
    process: 'TiN liner + CVD-W contact plug.'
  },
  nmosBDrnCt: {
    title: 'Contact: MN2 Drain -> OUT',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Plug',
    role: 'Connects the top drain of the series NMOS stack at (+5.5, -4.85) to Metal-1 OUT.',
    process: 'TiN liner + CVD-W contact plug.'
  },
  polyACt: {
    title: 'Contact: Input A -> Poly Gate A',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Gate Plug',
    role: 'Lands cleanly inside the inter-well substrate corridor at (-3.0, +0.8), linking Metal-1 IN A to Poly Gate A without overlapping active silicon.',
    process: 'Gate-top W contact plug.'
  },
  polyBCt: {
    title: 'Contact: Input B -> Poly Gate B',
    layer: 'contact',
    type: 'Tapered CVD Tungsten (W) Gate Plug',
    role: 'Lands in the inter-well corridor at (+3.0, -0.8), offset in Z from OUT (+0.8) to preserve planar zero-crossing routing.',
    process: 'Gate-top W contact plug.'
  },

  /* Metal-1 Interconnects */
  vddRail: {
    title: 'Metal-1 VDD Power Rail (+Z)',
    layer: 'metal',
    type: 'Brushed Cu/Al Metal-1 (3λ width)',
    role: 'Top standard-cell power bus supplying VDD to the N-Well tap and both parallel PMOS sources (MP1 & MP2).',
    process: 'Single-damascene Cu / Al-Cu lithography with 45° chamfered T-junctions and octagonal 5λ via pads.'
  },
  vddStubTap: {
    title: 'Metal-1 VDD -> N-Well Tap Stub',
    layer: 'metal',
    type: 'Metal-1 Branch (X = -9.0)',
    role: 'Connects the VDD rail down to N-Well tap contact welltapCt.',
    process: 'Damascene Metal-1 branch.'
  },
  vddStubPmosA: {
    title: 'Metal-1 VDD -> MP1 Source Stub',
    layer: 'metal',
    type: 'Metal-1 Branch (X = -5.5)',
    role: 'Supplies VDD pull-up current into MP1 source via pmosASrcCt.',
    process: 'Damascene Metal-1 branch.'
  },
  vddStubPmosB: {
    title: 'Metal-1 VDD -> MP2 Source Stub',
    layer: 'metal',
    type: 'Metal-1 Branch (X = +5.5)',
    role: 'Supplies VDD pull-up current into MP2 source via pmosBSrcCt.',
    process: 'Damascene Metal-1 branch.'
  },
  gndRail: {
    title: 'Metal-1 GND Ground Rail (-Z)',
    layer: 'metal',
    type: 'Brushed Cu/Al Metal-1 (3λ width)',
    role: 'Bottom standard-cell ground bus tying the P-Well tap and MN1 source to VSS/GND.',
    process: 'Single-damascene Cu / Al-Cu lithography with 45° chamfered T-junctions.'
  },
  gndStubTap: {
    title: 'Metal-1 GND -> P-Well Tap Stub',
    layer: 'metal',
    type: 'Metal-1 Branch (X = -9.0)',
    role: 'Connects the GND rail to the P+ substrate tap contact subtapCt.',
    process: 'Damascene Metal-1 branch.'
  },
  gndStubNmosA: {
    title: 'Metal-1 GND -> MN1 Source Stub',
    layer: 'metal',
    type: 'Metal-1 Branch (X = -5.5)',
    role: 'Completes the pull-down ground path from MN1 source contact nmosASrcCt.',
    process: 'Damascene Metal-1 branch.'
  },
  inAPin: {
    title: 'Metal-1 Input A Pin',
    layer: 'metal',
    type: 'Metal-1 Signal Track (Z = +0.8, X ≤ -3.0)',
    role: 'Delivers Input A cleanly to Poly Gate A contact polyACt while terminating strictly left of the OUT spine (zero crossing).',
    process: 'Metal-1 track with 5λ octagonal landing pad.'
  },
  inBPin: {
    title: 'Metal-1 Input B Pin',
    layer: 'metal',
    type: 'Metal-1 Signal Track (Z = -0.8, X ≤ +3.0)',
    role: 'Runs parallel to IN A / OUT separated by 1.6 units in Z and terminates at Gate B (+3.0), staying cleanly left of outNmosBranch (+5.5).',
    process: 'Metal-1 track with 5λ octagonal landing pad.'
  },
  outPmosBranch: {
    title: 'Metal-1 OUT -> Shared PMOS Branch',
    layer: 'metal',
    type: 'Metal-1 Output Branch (X = 0.0)',
    role: 'Collects pull-up current from the shared MP1/MP2 drain contact onto the central OUT spine.',
    process: 'Damascene Metal-1 branch.'
  },
  outSpine: {
    title: 'Metal-1 OUT Collector Spine',
    layer: 'metal',
    type: 'Metal-1 Bridge (Z = +0.8, X ∈ [0.0, +5.5])',
    role: 'Joins the parallel PMOS shared drain at X = 0.0 with the series NMOS drain branch at X = +5.5.',
    process: 'Damascene Metal-1 spine.'
  },
  outNmosBranch: {
    title: 'Metal-1 OUT -> Series NMOS Branch',
    layer: 'metal',
    type: 'Metal-1 Output Branch (X = +5.5)',
    role: 'Connects MN2 drain contact nmosBDrnCt at Z = -4.85 up to the OUT spine at Z = +0.8.',
    process: 'Damascene Metal-1 branch with 45° chamfered T-junction.'
  },
  outPin: {
    title: 'Metal-1 Output (OUT) Pin',
    layer: 'metal',
    type: 'Metal-1 Output Track (Z = +0.8, X ≥ +5.5)',
    role: 'Carries inverted NAND logic output OUT = !(A · B) off the right edge of the standard cell.',
    process: 'Damascene Metal-1 output pin.'
  },

  /* Virtual Composite Nodes (Transistors & Subnetworks) */
  pmosA: {
    title: 'MP1 · PMOS Transistor A (Pull-Up)',
    layer: 'transistor',
    type: 'P-Channel MOSFET (Parallel Pull-Up)',
    role: 'Conducts when Input A = 0, pulling OUT toward VDD through MP1 Source -> Gate A Channel -> Shared P+ Drain.',
    process: 'Built inside N-Well with P+ S/D, P-SDE, SiO2/HfO2 stack, and Poly Gate A.'
  },
  pmosB: {
    title: 'MP2 · PMOS Transistor B (Pull-Up)',
    layer: 'transistor',
    type: 'P-Channel MOSFET (Parallel Pull-Up)',
    role: 'Conducts when Input B = 0, pulling OUT toward VDD in parallel with MP1. When both A=0 and B=0, both pull up concurrently!',
    process: 'Built inside N-Well with P+ S/D, P-SDE, SiO2/HfO2 stack, and Poly Gate B.'
  },
  nmosA: {
    title: 'MN1 · NMOS Transistor A (Pull-Down Bottom)',
    layer: 'transistor',
    type: 'N-Channel MOSFET (Series Pull-Down)',
    role: 'Lower series transistor tied to GND. Must be ON (A = 1) together with MN2 (B = 1) to discharge OUT to logic 0.',
    process: 'Built inside P-Well with N+ S/D, N-SDE, SiO2/HfO2 stack, and Poly Gate A.'
  },
  nmosB: {
    title: 'MN2 · NMOS Transistor B (Pull-Down Top)',
    layer: 'transistor',
    type: 'N-Channel MOSFET (Series Pull-Down)',
    role: 'Upper series transistor tied to OUT. Passes charge through the uncontacted N+ bridge into MN1 when B = 1.',
    process: 'Built inside P-Well with N+ S/D, N-SDE, SiO2/HfO2 stack, and Poly Gate B.'
  },
  pmos: {
    title: 'Parallel PMOS Pull-Up Network (MP1 || MP2)',
    layer: 'transistor',
    type: 'Dual Parallel P-Channel Network',
    role: 'Pulls OUT = 1 whenever at least one input is 0 (A = 0 OR B = 0). Uses a shared center P+ drain to minimize footprint.',
    process: 'Shared N-Well Euler-path diffusion topology.'
  },
  nmos: {
    title: 'Series NMOS Pull-Down Network (MN2 + MN1)',
    layer: 'transistor',
    type: 'Dual Series N-Channel Stack',
    role: 'Pulls OUT = 0 ONLY when A = 1 AND B = 1. Shares an uncontacted internal N+ diffusion bridge between Gate A and Gate B.',
    process: 'Shared P-Well Euler-path series diffusion topology.'
  }
};
