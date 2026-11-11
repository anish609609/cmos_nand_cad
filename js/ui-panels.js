/* Left panel architecture TREE, VIRTUAL composite definitions, layer visibility & legend */

var VIRTUAL = {
  pmosA: ['pmosASrc', 'pmosSharedDrn', 'pmosASrcSde', 'pmosADrnSde', 'pmosAOxide', 'pmosAHighk', 'polyA'],
  pmosB: ['pmosBSrc', 'pmosSharedDrn', 'pmosBDrnSde', 'pmosBSrcSde', 'pmosBOxide', 'pmosBHighk', 'polyB'],
  nmosA: ['nmosASrc', 'nmosMidNode', 'nmosASrcSde', 'nmosADrnSde', 'nmosAOxide', 'nmosAHighk', 'polyA'],
  nmosB: ['nmosMidNode', 'nmosBDrn', 'nmosBSrcSde', 'nmosBDrnSde', 'nmosBOxide', 'nmosBHighk', 'polyB'],
  pmos: [
    'nwell', 'pmosASrc', 'pmosSharedDrn', 'pmosBSrc',
    'pmosASrcSde', 'pmosADrnSde', 'pmosBDrnSde', 'pmosBSrcSde',
    'pmosAOxide', 'pmosBOxide', 'pmosAHighk', 'pmosBHighk', 'polyA', 'polyB'
  ],
  nmos: [
    'pwell', 'nmosASrc', 'nmosMidNode', 'nmosBDrn',
    'nmosASrcSde', 'nmosADrnSde', 'nmosBSrcSde', 'nmosBDrnSde',
    'nmosAOxide', 'nmosBOxide', 'nmosAHighk', 'nmosBHighk', 'polyA', 'polyB'
  ]
};

var TREE = [
  {
    group: 'SUBSTRATE',
    items: [
      { id: 'psub', label: 'P-Substrate Wafer', tag: 'SI' }
    ]
  },
  {
    group: 'WELL (N-WELL & P-WELL)',
    items: [
      { id: 'nwell', label: 'N-Well (Pull-Up Body)', tag: 'NW' },
      { id: 'pwell', label: 'P-Well (Pull-Down Body)', tag: 'PW' },
      { id: 'welltapAct', label: 'N-Well Body Tap (N+)', tag: 'TAP' },
      { id: 'subtapAct', label: 'P-Well Body Tap (P+)', tag: 'TAP' }
    ]
  },
  {
    group: 'TRANSISTORS & DIFFUSIONS',
    items: [
      { id: 'pmosA', label: 'MP1 · PMOS A (Pull-Up)', tag: 'DEV' },
      { id: 'pmosB', label: 'MP2 · PMOS B (Pull-Up)', tag: 'DEV' },
      { id: 'nmosA', label: 'MN1 · NMOS A (Pull-Down)', tag: 'DEV' },
      { id: 'nmosB', label: 'MN2 · NMOS B (Pull-Down)', tag: 'DEV' },
      { id: 'pmosASrc', label: 'MP1 Source (P+ -> VDD)', tag: 'P+' },
      { id: 'pmosSharedDrn', label: 'Shared P+ Drain (OUT)', tag: 'P+' },
      { id: 'pmosBSrc', label: 'MP2 Source (P+ -> VDD)', tag: 'P+' },
      { id: 'nmosASrc', label: 'MN1 Source (N+ -> GND)', tag: 'N+' },
      { id: 'nmosMidNode', label: 'Series N+ Bridge', tag: 'N+' },
      { id: 'nmosBDrn', label: 'MN2 Drain (N+ -> OUT)', tag: 'N+' }
    ]
  },
  {
    group: 'GATE OXIDE (SiO2)',
    items: [
      { id: 'pmosAOxide', label: 'MP1 Gate Oxide', tag: 'OX' },
      { id: 'pmosBOxide', label: 'MP2 Gate Oxide', tag: 'OX' },
      { id: 'nmosAOxide', label: 'MN1 Gate Oxide', tag: 'OX' },
      { id: 'nmosBOxide', label: 'MN2 Gate Oxide', tag: 'OX' }
    ]
  },
  {
    group: 'HIGH-K DIELECTRIC (HfO2)',
    items: [
      { id: 'pmosAHighk', label: 'MP1 High-K (HfO2)', tag: 'HK' },
      { id: 'pmosBHighk', label: 'MP2 High-K (HfO2)', tag: 'HK' },
      { id: 'nmosAHighk', label: 'MN1 High-K (HfO2)', tag: 'HK' },
      { id: 'nmosBHighk', label: 'MN2 High-K (HfO2)', tag: 'HK' }
    ]
  },
  {
    group: 'POLYSILICON (GATES A & B)',
    items: [
      { id: 'polyA', label: 'Poly Gate A (MP1 + MN1)', tag: 'GA' },
      { id: 'polyB', label: 'Poly Gate B (MP2 + MN2)', tag: 'GB' }
    ]
  },
  {
    group: 'CONTACTS (9 TUNGSTEN)',
    items: [
      { id: 'welltapCt', label: 'N-Well Tap Contact', tag: 'W' },
      { id: 'pmosASrcCt', label: 'MP1 Source Contact', tag: 'W' },
      { id: 'pmosSharedDrnCt', label: 'Shared PMOS Drain Contact', tag: 'W' },
      { id: 'pmosBSrcCt', label: 'MP2 Source Contact', tag: 'W' },
      { id: 'subtapCt', label: 'P-Well Tap Contact', tag: 'W' },
      { id: 'nmosASrcCt', label: 'MN1 Source Contact', tag: 'W' },
      { id: 'nmosBDrnCt', label: 'MN2 Drain Contact', tag: 'W' },
      { id: 'polyACt', label: 'Poly Gate A Contact', tag: 'W' },
      { id: 'polyBCt', label: 'Poly Gate B Contact', tag: 'W' }
    ]
  },
  {
    group: 'METAL-1 INTERCONNECTS',
    items: [
      { id: 'vddRail', label: 'VDD Rail (+Z)', tag: 'M1' },
      { id: 'gndRail', label: 'GND Rail (-Z)', tag: 'M1' },
      { id: 'inAPin', label: 'Input A Pin (Z = +0.8)', tag: 'M1' },
      { id: 'inBPin', label: 'Input B Pin (Z = -0.8)', tag: 'M1' },
      { id: 'outPmosBranch', label: 'OUT PMOS Branch', tag: 'M1' },
      { id: 'outSpine', label: 'OUT Collector Spine', tag: 'M1' },
      { id: 'outNmosBranch', label: 'OUT NMOS Branch', tag: 'M1' },
      { id: 'outPin', label: 'OUT Output Pin', tag: 'M1' }
    ]
  }
];

var layerVisibility = {};
for (var li = 0; li < LEGEND.length; li++) {
  layerVisibility[LEGEND[li].key] = true;
}
var showLabels3D = true;

function applyLayerVisibility() {
  for (var i = 0; i < allMeshes.length; i++) {
    var m = allMeshes[i];
    var vis = layerVisibility[m.userData.layer] !== false;
    m.visible = vis;
  }
  for (var j = 0; j < labelsList.length; j++) {
    var lbl = labelsList[j];
    var lvis = showLabels3D && (layerVisibility[lbl.userData.layer] !== false);
    lbl.visible = lvis;
  }
}

function syncVisibilityCheckboxes() {
  var checks = document.querySelectorAll('#layer-toggles input[data-layer]');
  for (var i = 0; i < checks.length; i++) {
    var key = checks[i].getAttribute('data-layer');
    checks[i].checked = layerVisibility[key] !== false;
  }
  var lblChk = document.getElementById('chk-labels');
  if (lblChk) lblChk.checked = showLabels3D;
  applyLayerVisibility();
}

function buildUiPanels() {
  /* Build Architecture Tree */
  var treeEl = document.getElementById('arch-tree');
  if (treeEl) {
    var html = '<div class="tree-root-lbl">CMOS 2-INPUT NAND</div>';
    for (var gi = 0; gi < TREE.length; gi++) {
      var grp = TREE[gi];
      html += '<div class="tree-grp" data-grp="' + gi + '">';
      html += '<div class="tree-grp-hdr"><span>▾</span><span>' + grp.group + '</span></div>';
      html += '<div class="tree-grp-items">';
      for (var ii = 0; ii < grp.items.length; ii++) {
        var it = grp.items[ii];
        html += '<button type="button" class="tree-item" data-id="' + it.id + '">' +
          '<span>' + it.label + '</span>' +
          '<span class="tree-tag">' + it.tag + '</span>' +
          '</button>';
      }
      html += '</div></div>';
    }
    treeEl.innerHTML = html;

    treeEl.addEventListener('click', function (e) {
      var hdr = e.target.closest('.tree-grp-hdr');
      if (hdr) {
        var grpEl = hdr.closest('.tree-grp');
        grpEl.classList.toggle('collapsed');
        hdr.firstElementChild.textContent = grpEl.classList.contains('collapsed') ? '▸' : '▾';
        return;
      }
      var itemBtn = e.target.closest('.tree-item[data-id]');
      if (itemBtn && typeof selectById === 'function') {
        selectById(itemBtn.getAttribute('data-id'));
      }
    });
  }

  /* Build Layer Visibility Toggles */
  var togglesEl = document.getElementById('layer-toggles');
  if (togglesEl) {
    var th = '';
    for (var i = 0; i < LEGEND.length; i++) {
      var leg = LEGEND[i];
      th += '<label class="layer-row">' +
        '<input type="checkbox" data-layer="' + leg.key + '" checked />' +
        '<span class="layer-swatch" style="background:' + leg.color + '"></span>' +
        '<span>' + leg.label + '</span>' +
        '</label>';
    }
    togglesEl.innerHTML = th;

    togglesEl.addEventListener('change', function (e) {
      var chk = e.target;
      if (chk && chk.hasAttribute('data-layer')) {
        layerVisibility[chk.getAttribute('data-layer')] = chk.checked;
        applyLayerVisibility();
      }
    });
  }

  var btnAllOn = document.getElementById('btn-layers-all');
  if (btnAllOn) {
    btnAllOn.addEventListener('click', function () {
      for (var k in layerVisibility) {
        if (Object.prototype.hasOwnProperty.call(layerVisibility, k)) {
          layerVisibility[k] = true;
        }
      }
      showLabels3D = true;
      syncVisibilityCheckboxes();
    });
  }

  var chkLabels = document.getElementById('chk-labels');
  if (chkLabels) {
    chkLabels.addEventListener('change', function () {
      showLabels3D = chkLabels.checked;
      applyLayerVisibility();
    });
  }

  /* Build Legend List */
  var legendEl = document.getElementById('legend-list');
  if (legendEl) {
    var lh = '';
    for (var j = 0; j < LEGEND.length; j++) {
      var l = LEGEND[j];
      lh += '<div class="legend-row">' +
        '<span class="layer-swatch" style="background:' + l.color + ';margin-top:2px;"></span>' +
        '<div><div class="legend-name">' + l.label + '</div>' +
        '<div class="legend-note">' + l.note + '</div></div>' +
        '</div>';
    }
    legendEl.innerHTML = lh;
  }

  /* Collapsible Panel Section Headers */
  var hdrs = document.querySelectorAll('.panel-sec .sec-hdr');
  for (var hi = 0; hi < hdrs.length; hi++) {
    hdrs[hi].addEventListener('click', function () {
      this.closest('.panel-sec').classList.toggle('collapsed');
    });
  }
}

buildUiPanels();
