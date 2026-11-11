/* PHYSICAL LAYOUT <-> SCHEMATIC switcher with SVG [data-id] cross-probing */

var viewMode = 'layout';

function setViewMode(mode) {
  viewMode = mode === 'schematic' ? 'schematic' : 'layout';
  var overlay = document.getElementById('schematic-overlay');
  var btnLayout = document.getElementById('btn-view-layout');
  var btnSch = document.getElementById('btn-view-schematic');

  if (btnLayout) btnLayout.classList.toggle('active', viewMode === 'layout');
  if (btnSch) btnSch.classList.toggle('active', viewMode === 'schematic');

  if (overlay) {
    overlay.classList.toggle('hidden', viewMode !== 'schematic');
  }

  if (viewMode === 'schematic') {
    var pop = document.getElementById('popover');
    if (pop) pop.classList.add('hidden');
  }
}

function updateSchematicVisuals(state) {
  if (!state) return;
  var map = [
    { id: 'pmosA', val: state.mp1, lblId: 'sch-mp1-state', name: 'PMOS A' },
    { id: 'pmosB', val: state.mp2, lblId: 'sch-mp2-state', name: 'PMOS B' },
    { id: 'nmosA', val: state.mn1, lblId: 'sch-mn1-state', name: 'NMOS A' },
    { id: 'nmosB', val: state.mn2, lblId: 'sch-mn2-state', name: 'NMOS B' }
  ];

  for (var i = 0; i < map.length; i++) {
    var item = map[i];
    var el = document.querySelector('#nand2-schematic-svg .sch-el[data-id="' + item.id + '"]');
    var lbl = document.getElementById(item.lblId);
    if (el) {
      el.classList.remove('sch-on', 'sch-off', 'sch-leak');
      if (item.val === true) el.classList.add('sch-on');
      else if (item.val === false) el.classList.add('sch-off');
      else el.classList.add('sch-leak');
    }
    if (lbl) {
      var stText = item.val === true ? 'ON' : (item.val === false ? 'OFF' : 'LEAK');
      lbl.textContent = item.name + ' · ' + stText;
    }
  }

  var aTxt = document.getElementById('sch-a-state');
  var bTxt = document.getElementById('sch-b-state');
  var outTxt = document.getElementById('sch-out-state');
  if (aTxt) aTxt.textContent = state.a === 'off' ? 'OFF' : String(state.a);
  if (bTxt) bTxt.textContent = state.b === 'off' ? 'OFF' : String(state.b);
  if (outTxt) {
    outTxt.textContent = state.out === 0 || state.out === 1 ? 'OUT = ' + state.out : state.out;
  }
}

function initViewMode() {
  var btnLayout = document.getElementById('btn-view-layout');
  var btnSch = document.getElementById('btn-view-schematic');
  var schBack = document.getElementById('sch-btn-layout');
  var schReset = document.getElementById('sch-btn-reset');
  var svg = document.getElementById('nand2-schematic-svg');

  if (btnLayout) {
    btnLayout.addEventListener('click', function () { setViewMode('layout'); });
  }
  if (btnSch) {
    btnSch.addEventListener('click', function () { setViewMode('schematic'); });
  }
  if (schBack) {
    schBack.addEventListener('click', function () { setViewMode('layout'); });
  }
  if (schReset) {
    schReset.addEventListener('click', function () {
      if (typeof clearSelection === 'function') clearSelection();
      if (typeof resetAll === 'function') resetAll();
    });
  }

  if (svg) {
    svg.addEventListener('click', function (e) {
      var el = e.target.closest('.sch-el[data-id]');
      if (!el) return;
      var id = el.getAttribute('data-id');
      setViewMode('layout');
      if (typeof selectById === 'function') {
        selectById(id);
      }
    });
  }
}

initViewMode();
