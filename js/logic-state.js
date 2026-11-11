/* CMOS 2-Input NAND truth-table state machine, per-transistor emissive tints & STATUS HUD */

var currentA = 'off';
var currentB = 'off';
var isCircuitFrozen = true;

var TINT_ON = { color: 0x2fbf7a, intensity: 0.35 };
var TINT_OFF = { color: 0x3a1414, intensity: 0.25 };
var TINT_PARTIAL = { color: 0xd97706, intensity: 0.32 };

function computeNand2State(a, b) {
  var mp1 = (a === 'off') ? 'partial' : (a === 0);
  var mp2 = (b === 'off') ? 'partial' : (b === 0);
  var mn1 = (a === 'off') ? 'partial' : (a === 1);
  var mn2 = (b === 'off') ? 'partial' : (b === 1);

  var out;
  var frozen = (a === 'off' || b === 'off');
  if (frozen) {
    out = (a === 0 || b === 0) ? '1 (WEAK PULL / LEAK)' : 'FLOATING (HIGH-Z)';
  } else {
    out = (a === 1 && b === 1) ? 0 : 1;
  }

  return {
    a: a,
    b: b,
    mp1: mp1,
    mp2: mp2,
    mn1: mn1,
    mn2: mn2,
    out: out,
    frozen: frozen
  };
}

function getCircuitStateSnapshot() {
  var s = computeNand2State(currentA, currentB);
  function fmtDev(v) {
    if (v === true) return 'ON';
    if (v === false) return 'OFF';
    return 'LEAK/PARTIAL';
  }
  return {
    a: s.a === 'off' ? 'OFF' : String(s.a),
    b: s.b === 'off' ? 'OFF' : String(s.b),
    mp1: fmtDev(s.mp1),
    mp2: fmtDev(s.mp2),
    mn1: fmtDev(s.mn1),
    mn2: fmtDev(s.mn2),
    out: String(s.out)
  };
}

function setOnOffTint(meshId, stateVal) {
  var arr = meshesById[meshId];
  if (!arr || !arr.length) return;
  var tint = stateVal === true ? TINT_ON : (stateVal === 'partial' ? TINT_PARTIAL : TINT_OFF);

  for (var i = 0; i < arr.length; i++) {
    var m = arr[i];
    if (!m.material || !m.material.emissive) continue;
    m.userData.baseEmissive = tint.color;
    m.userData.baseEmissiveIntensity = tint.intensity;

    if (typeof selectedMeshes !== 'undefined' && selectedMeshes.indexOf(m) !== -1) {
      continue;
    }
    m.material.emissive.setHex(tint.color);
    m.material.emissiveIntensity = tint.intensity;
  }
}

function setMetalPulsing(idsMap) {
  for (var i = 0; i < allMeshes.length; i++) {
    var m = allMeshes[i];
    if (m.userData.layer !== 'metal') continue;
    var active = Boolean(idsMap[m.userData.id]);
    m.userData.pulsing = active;
    if (!active && m.material && m.material.emissive) {
      m.userData.baseEmissive = 0x000000;
      m.userData.baseEmissiveIntensity = 0;
      if (typeof selectedMeshes === 'undefined' || selectedMeshes.indexOf(m) === -1) {
        m.material.emissive.setHex(0x000000);
        m.material.emissiveIntensity = 0;
      }
    }
  }
}

function applyLogicTint() {
  var s = computeNand2State(currentA, currentB);
  isCircuitFrozen = s.frozen;

  /* MP1 diffusions & SDEs + channel */
  setOnOffTint('pmosASrc', s.mp1);
  setOnOffTint('pmosASrcSde', s.mp1);
  setOnOffTint('pmosADrnSde', s.mp1);
  setOnOffTint('chMP1', s.mp1);

  /* MP2 diffusions & SDEs + channel */
  setOnOffTint('pmosBSrc', s.mp2);
  setOnOffTint('pmosBDrnSde', s.mp2);
  setOnOffTint('pmosBSrcSde', s.mp2);
  setOnOffTint('chMP2', s.mp2);

  /* Shared PMOS drain: ON if MP1 OR MP2 is ON */
  var sharedPmosState = (s.mp1 === true || s.mp2 === true)
    ? true
    : ((s.mp1 === 'partial' || s.mp2 === 'partial') ? 'partial' : false);
  setOnOffTint('pmosSharedDrn', sharedPmosState);

  /* MN1 diffusions & SDEs + channel */
  setOnOffTint('nmosASrc', s.mn1);
  setOnOffTint('nmosASrcSde', s.mn1);
  setOnOffTint('nmosADrnSde', s.mn1);
  setOnOffTint('chMN1', s.mn1);

  /* MN2 diffusions & SDEs + channel */
  setOnOffTint('nmosBDrn', s.mn2);
  setOnOffTint('nmosBSrcSde', s.mn2);
  setOnOffTint('nmosBDrnSde', s.mn2);
  setOnOffTint('chMN2', s.mn2);

  /* Series N+ Bridge: ON if MN1 AND MN2 are ON, or 'partial' if either is 'partial', else OFF */
  var midState;
  if (s.mn1 === true && s.mn2 === true) {
    midState = true;
  } else if (s.mn1 === 'partial' || s.mn2 === 'partial') {
    midState = 'partial';
  } else {
    midState = false;
  }
  setOnOffTint('nmosMidNode', midState);

  /* Active Metal-1 pulsing routes (frozen when A==='off' || B==='off') */
  var pulseIds = {};
  if (!s.frozen) {
    if (s.a === 0 && s.b === 0) {
      pulseIds = { vddRail: 1, vddStubPmosA: 1, vddStubPmosB: 1, outPmosBranch: 1, outSpine: 1, outPin: 1 };
    } else if (s.a === 0 && s.b === 1) {
      pulseIds = { vddRail: 1, vddStubPmosA: 1, outPmosBranch: 1, outSpine: 1, outPin: 1 };
    } else if (s.a === 1 && s.b === 0) {
      pulseIds = { vddRail: 1, vddStubPmosB: 1, outPmosBranch: 1, outSpine: 1, outPin: 1 };
    } else if (s.a === 1 && s.b === 1) {
      pulseIds = { outPin: 1, outSpine: 1, outNmosBranch: 1, gndStubNmosA: 1, gndRail: 1 };
    }
  }
  setMetalPulsing(pulseIds);

  if (s.frozen && typeof hideAllFlowMarkers === 'function') {
    hideAllFlowMarkers();
  }
  if (typeof refreshFlowGuides === 'function') {
    refreshFlowGuides();
  }
}

function updateStateBadgeAndButtons() {
  var s = computeNand2State(currentA, currentB);

  var aBtns = document.querySelectorAll('#input-a-group .seg-btn[data-a]');
  for (var i = 0; i < aBtns.length; i++) {
    var va = aBtns[i].getAttribute('data-a');
    var matchA = (va === 'off' && currentA === 'off') || (va !== 'off' && Number(va) === currentA);
    aBtns[i].classList.toggle('active', matchA);
  }

  var bBtns = document.querySelectorAll('#input-b-group .seg-btn[data-b]');
  for (var j = 0; j < bBtns.length; j++) {
    var vb = bBtns[j].getAttribute('data-b');
    var matchB = (vb === 'off' && currentB === 'off') || (vb !== 'off' && Number(vb) === currentB);
    bBtns[j].classList.toggle('active', matchB);
  }

  function devBadge(val) {
    if (val === true) return '<span class="st-v st-on">ON</span>';
    if (val === false) return '<span class="st-v st-off">OFF</span>';
    return '<span class="st-v st-leak">LEAKING</span>';
  }

  function inBadge(val) {
    if (val === 'off') return '<span class="st-v st-leak">OFF</span>';
    return '<span class="st-v">' + val + '</span>';
  }

  var outHtml;
  if (s.out === 1) outHtml = '<span class="st-v st-out1">1 (VDD)</span>';
  else if (s.out === 0) outHtml = '<span class="st-v st-out0">0 (GND)</span>';
  else outHtml = '<span class="st-v st-leak">' + s.out + '</span>';

  var rowsEl = document.getElementById('state-rows');
  if (rowsEl) {
    rowsEl.innerHTML =
      '<span class="st-k">IN A</span>' + inBadge(s.a) +
      '<span class="st-k">IN B</span>' + inBadge(s.b) +
      '<span class="st-k">MP1 (PMOS A)</span>' + devBadge(s.mp1) +
      '<span class="st-k">MP2 (PMOS B)</span>' + devBadge(s.mp2) +
      '<span class="st-k">MN1 (NMOS A)</span>' + devBadge(s.mn1) +
      '<span class="st-k">MN2 (NMOS B)</span>' + devBadge(s.mn2) +
      '<span class="st-k">OUT</span>' + outHtml;
  }

  var bannerEl = document.getElementById('state-banner');
  var dotEl = document.getElementById('state-dot');
  if (bannerEl) {
    if (s.frozen) {
      bannerEl.textContent = 'CIRCUIT STATE: HIGH-Z / FLOATING INPUT (STATIONARY — FLOW INACTIVE)';
      bannerEl.classList.add('frozen');
    } else if (s.a === 0 && s.b === 0) {
      bannerEl.textContent = 'PULL-UP PARALLEL: BOTH MP1 & MP2 CONDUCT -> OUT = 1';
      bannerEl.classList.remove('frozen');
    } else if (s.a === 0 || s.b === 0) {
      bannerEl.textContent = (s.a === 0 ? 'PULL-UP MP1 ON' : 'PULL-UP MP2 ON') + ' -> OUT = 1';
      bannerEl.classList.remove('frozen');
    } else {
      bannerEl.textContent = 'PULL-DOWN SERIES: MN2 -> N+ BRIDGE -> MN1 -> GND (OUT = 0)';
      bannerEl.classList.remove('frozen');
    }
  }
  if (dotEl) {
    dotEl.style.background = s.frozen ? 'var(--amber)' : (s.out === 1 ? 'var(--cyan)' : 'var(--gold)');
  }

  if (typeof updateSchematicVisuals === 'function') {
    updateSchematicVisuals(s);
  }
  if (typeof updateVoiceContext === 'function') {
    updateVoiceContext();
  }
}

function setInputs(a, b) {
  currentA = a;
  currentB = b;
  applyLogicTint();
  updateStateBadgeAndButtons();
}

function initLogicStateControls() {
  var aGrp = document.getElementById('input-a-group');
  var bGrp = document.getElementById('input-b-group');

  if (aGrp) {
    aGrp.addEventListener('click', function (e) {
      var btn = e.target.closest('.seg-btn[data-a]');
      if (!btn) return;
      var raw = btn.getAttribute('data-a');
      setInputs(raw === 'off' ? 'off' : Number(raw), currentB);
    });
  }
  if (bGrp) {
    bGrp.addEventListener('click', function (e) {
      var btn = e.target.closest('.seg-btn[data-b]');
      if (!btn) return;
      var raw = btn.getAttribute('data-b');
      setInputs(currentA, raw === 'off' ? 'off' : Number(raw));
    });
  }

  setInputs('off', 'off');
}

initLogicStateControls();
