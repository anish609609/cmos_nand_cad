/* Mead-Conway lambda scaling presets (1000nm -> 16nm), DIM_RULES table & DIM_MAP lookup */

var LAMBDA_PRESETS = [
  { id: '1000nm', node: '1000nm', lambda: 500,  eot: 20.0, hk: 0,   era: '1985 · 1.0 µm Planar' },
  { id: '350nm',  node: '350nm',  lambda: 175,  eot: 7.0,  hk: 0,   era: '1995 · 0.35 µm CMOS' },
  { id: '130nm',  node: '130nm',  lambda: 65,   eot: 2.2,  hk: 0,   era: '2001 · 130 nm Cu/Poly' },
  { id: '90nm',   node: '90nm',   lambda: 45,   eot: 1.2,  hk: 2.2, era: '2004 · 90 nm Strained Si' },
  { id: '45nm',   node: '45nm',   lambda: 22.5, eot: 0.9,  hk: 2.0, era: '2007 · 45 nm HKMG' },
  { id: '16nm',   node: '16nm',   lambda: 8,    eot: 0.7,  hk: 1.6, era: '2014 · 16 nm FinFET/HK' }
];

var currentNodePreset = LAMBDA_PRESETS[3]; /* 90nm default */

function fmtNm(nm) {
  if (nm >= 1000) return (nm / 1000).toFixed(2).replace(/\.00$/, '') + ' µm';
  if (nm < 10) return nm.toFixed(1) + ' nm';
  return Math.round(nm * 10) / 10 + ' nm';
}

var DIM_RULES = {
  gateLen: {
    label: 'Gate Length (L_min)',
    rule: '2λ',
    calc: function (p) { return fmtNm(2 * p.lambda); }
  },
  polyPitch: {
    label: 'Gate A ↔ Gate B Spacing',
    rule: '4λ',
    calc: function (p) { return fmtNm(4 * p.lambda); }
  },
  polyExt: {
    label: 'Poly Endcap Past Active',
    rule: '2λ',
    calc: function (p) { return fmtNm(2 * p.lambda); }
  },
  activeW: {
    label: 'Transistor Active Width (W)',
    rule: '6λ',
    calc: function (p) { return fmtNm(6 * p.lambda); }
  },
  sdLen: {
    label: 'S/D Diffusion Length',
    rule: '3λ',
    calc: function (p) { return fmtNm(3 * p.lambda); }
  },
  sharedBridge: {
    label: 'Shared Drain / Series Bridge',
    rule: '4λ',
    calc: function (p) { return fmtNm(4 * p.lambda); }
  },
  sdeOverlap: {
    label: 'SDE / LDD Gate Overlap',
    rule: '0.55λ',
    calc: function (p) { return fmtNm(0.55 * p.lambda); }
  },
  wellEnc: {
    label: 'Well Enclosure of Active',
    rule: '6λ',
    calc: function (p) { return fmtNm(6 * p.lambda); }
  },
  wellGap: {
    label: 'N-Well ↔ P-Well Corridor',
    rule: '1.9λ',
    calc: function (p) { return fmtNm(1.9 * p.lambda); }
  },
  oxideThick: {
    label: 'Interfacial SiO2 Thickness',
    rule: 'EOT',
    calc: function (p) { return p.eot.toFixed(1) + ' nm'; }
  },
  highkThick: {
    label: 'ALD HfO2 Physical Thickness',
    rule: 'HK',
    calc: function (p) { return p.hk > 0 ? p.hk.toFixed(1) + ' nm (εr≈22)' : 'N/A (SiO2 only)'; }
  },
  contactCut: {
    label: 'Tungsten Contact Cut',
    rule: '2λ × 2λ',
    calc: function (p) { return fmtNm(2 * p.lambda) + ' sq'; }
  },
  metalW: {
    label: 'Metal-1 Track Width',
    rule: '3λ',
    calc: function (p) { return fmtNm(3 * p.lambda); }
  },
  metalSpace: {
    label: 'Metal-1 Minimum Spacing',
    rule: '3λ',
    calc: function (p) { return fmtNm(3 * p.lambda); }
  },
  viaPad: {
    label: 'Octagonal Via Landing Pad',
    rule: '5λ × 5λ (1λ chamfer)',
    calc: function (p) { return fmtNm(5 * p.lambda) + ' sq'; }
  },
  cellPitch: {
    label: 'NAND2 Cell Area (X × Z)',
    rule: '24λ × 25λ',
    calc: function (p) { return fmtNm(24 * p.lambda) + ' × ' + fmtNm(25 * p.lambda); }
  }
};

var DIM_MAP = {
  psub: ['cellPitch', 'wellGap'],
  nwell: ['wellEnc', 'wellGap', 'activeW'],
  pwell: ['wellEnc', 'wellGap', 'activeW'],
  welltapAct: ['wellEnc', 'contactCut'],
  subtapAct: ['wellEnc', 'contactCut'],
  pmosASrc: ['sdLen', 'activeW', 'gateLen'],
  pmosSharedDrn: ['sharedBridge', 'activeW', 'polyPitch'],
  pmosBSrc: ['sdLen', 'activeW', 'gateLen'],
  nmosASrc: ['sdLen', 'activeW', 'gateLen'],
  nmosMidNode: ['sharedBridge', 'activeW', 'polyPitch'],
  nmosBDrn: ['sdLen', 'activeW', 'gateLen'],
  pmosASrcSde: ['sdeOverlap', 'gateLen'],
  pmosADrnSde: ['sdeOverlap', 'gateLen'],
  pmosBDrnSde: ['sdeOverlap', 'gateLen'],
  pmosBSrcSde: ['sdeOverlap', 'gateLen'],
  nmosASrcSde: ['sdeOverlap', 'gateLen'],
  nmosADrnSde: ['sdeOverlap', 'gateLen'],
  nmosBSrcSde: ['sdeOverlap', 'gateLen'],
  nmosBDrnSde: ['sdeOverlap', 'gateLen'],
  pmosAOxide: ['oxideThick', 'gateLen', 'activeW'],
  pmosBOxide: ['oxideThick', 'gateLen', 'activeW'],
  nmosAOxide: ['oxideThick', 'gateLen', 'activeW'],
  nmosBOxide: ['oxideThick', 'gateLen', 'activeW'],
  pmosAHighk: ['highkThick', 'oxideThick', 'gateLen'],
  pmosBHighk: ['highkThick', 'oxideThick', 'gateLen'],
  nmosAHighk: ['highkThick', 'oxideThick', 'gateLen'],
  nmosBHighk: ['highkThick', 'oxideThick', 'gateLen'],
  polyA: ['gateLen', 'polyPitch', 'polyExt'],
  polyB: ['gateLen', 'polyPitch', 'polyExt'],
  welltapCt: ['contactCut', 'viaPad'],
  pmosASrcCt: ['contactCut', 'viaPad'],
  pmosSharedDrnCt: ['contactCut', 'viaPad'],
  pmosBSrcCt: ['contactCut', 'viaPad'],
  subtapCt: ['contactCut', 'viaPad'],
  nmosASrcCt: ['contactCut', 'viaPad'],
  nmosBDrnCt: ['contactCut', 'viaPad'],
  polyACt: ['contactCut', 'viaPad'],
  polyBCt: ['contactCut', 'viaPad'],
  vddRail: ['metalW', 'metalSpace', 'viaPad'],
  vddStubTap: ['metalW', 'viaPad'],
  vddStubPmosA: ['metalW', 'viaPad'],
  vddStubPmosB: ['metalW', 'viaPad'],
  gndRail: ['metalW', 'metalSpace', 'viaPad'],
  gndStubTap: ['metalW', 'viaPad'],
  gndStubNmosA: ['metalW', 'viaPad'],
  inAPin: ['metalW', 'metalSpace', 'viaPad'],
  inBPin: ['metalW', 'metalSpace', 'viaPad'],
  outPmosBranch: ['metalW', 'viaPad'],
  outSpine: ['metalW', 'metalSpace'],
  outNmosBranch: ['metalW', 'viaPad'],
  outPin: ['metalW', 'metalSpace'],
  pmosA: ['gateLen', 'activeW', 'oxideThick', 'highkThick'],
  pmosB: ['gateLen', 'activeW', 'oxideThick', 'highkThick'],
  nmosA: ['gateLen', 'activeW', 'oxideThick', 'highkThick'],
  nmosB: ['gateLen', 'activeW', 'oxideThick', 'highkThick'],
  pmos: ['gateLen', 'activeW', 'sharedBridge', 'wellEnc'],
  nmos: ['gateLen', 'activeW', 'sharedBridge', 'wellEnc']
};

function getDimensionRulesForId(id) {
  var keys = DIM_MAP[id] || ['gateLen', 'metalW', 'cellPitch'];
  var out = [];
  for (var i = 0; i < keys.length; i++) {
    var r = DIM_RULES[keys[i]];
    if (r) {
      out.push({
        key: keys[i],
        label: r.label,
        rule: r.rule,
        valueText: r.calc(currentNodePreset)
      });
    }
  }
  return out;
}

function getDimensionSummaryText(id) {
  var rules = id ? getDimensionRulesForId(id) : [
    { label: 'Node', rule: 'L=2λ', valueText: currentNodePreset.node + ' (λ=' + fmtNm(currentNodePreset.lambda) + ')' },
    { label: 'Metal-1 Width', rule: '3λ', valueText: DIM_RULES.metalW.calc(currentNodePreset) },
    { label: 'Cell Footprint', rule: '24λ×25λ', valueText: DIM_RULES.cellPitch.calc(currentNodePreset) }
  ];
  var parts = ['Node ' + currentNodePreset.node + ' (λ=' + fmtNm(currentNodePreset.lambda) + ')'];
  for (var i = 0; i < rules.length; i++) {
    parts.push(rules[i].label + ' [' + rules[i].rule + ']: ' + rules[i].valueText);
  }
  return parts.join('; ');
}

function renderDimensionsPanel() {
  var presetsEl = document.getElementById('lambda-presets');
  var summaryEl = document.getElementById('lambda-summary');
  var tableEl = document.getElementById('dim-table');

  if (presetsEl) {
    var html = '';
    for (var i = 0; i < LAMBDA_PRESETS.length; i++) {
      var p = LAMBDA_PRESETS[i];
      var active = p.id === currentNodePreset.id ? ' active' : '';
      html += '<button type="button" class="node-btn' + active + '" data-node="' + p.id + '">' + p.node + '</button>';
    }
    presetsEl.innerHTML = html;
  }

  if (summaryEl) {
    summaryEl.textContent = currentNodePreset.era + ' · λ = ' + fmtNm(currentNodePreset.lambda);
  }

  if (tableEl) {
    var keys = ['gateLen', 'polyPitch', 'activeW', 'sharedBridge', 'oxideThick', 'highkThick', 'contactCut', 'metalW', 'viaPad', 'cellPitch'];
    var th = '';
    for (var j = 0; j < keys.length; j++) {
      var r = DIM_RULES[keys[j]];
      th += '<div class="dim-row"><span class="dim-lbl">' + r.label + ' (' + r.rule + ')</span>' +
        '<span class="dim-val">' + r.calc(currentNodePreset) + '</span></div>';
    }
    tableEl.innerHTML = th;
  }

  if (typeof updateInspector === 'function') updateInspector();
  if (typeof updatePopoverContent === 'function') updatePopoverContent();
}

function initDimensionsPanel() {
  var presetsEl = document.getElementById('lambda-presets');
  if (presetsEl) {
    presetsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.node-btn[data-node]');
      if (!btn) return;
      var nodeId = btn.getAttribute('data-node');
      for (var i = 0; i < LAMBDA_PRESETS.length; i++) {
        if (LAMBDA_PRESETS[i].id === nodeId) {
          currentNodePreset = LAMBDA_PRESETS[i];
          renderDimensionsPanel();
          break;
        }
      }
    });
  }
  renderDimensionsPanel();
}

initDimensionsPanel();
