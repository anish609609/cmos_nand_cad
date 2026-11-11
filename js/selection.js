/* Raycaster picking (6px drag threshold), theme-aware highlight, Property Inspector & 3D popover */

function getHighlightHex() {
  var c = typeof cssVar === 'function' ? cssVar('--highlight') : '#ff2fb0';
  return new THREE.Color(c).getHex();
}

var selectedId = null;
var selectedMeshes = [];

var raycaster = new THREE.Raycaster();
var pointerDownPos = null;
var _centroidBox = new THREE.Box3();
var _tempVec = new THREE.Vector3();

function collectTargetMeshes(id) {
  var list = [];
  if (typeof VIRTUAL !== 'undefined' && VIRTUAL[id]) {
    var ids = VIRTUAL[id];
    for (var i = 0; i < ids.length; i++) {
      var arr = meshesById[ids[i]] || [];
      for (var j = 0; j < arr.length; j++) {
        if (list.indexOf(arr[j]) === -1) list.push(arr[j]);
      }
    }
  } else if (meshesById[id]) {
    var direct = meshesById[id];
    for (var k = 0; k < direct.length; k++) {
      list.push(direct[k]);
    }
  }
  return list;
}

function setMeshHighlight(mesh, on) {
  if (!mesh || !mesh.material) return;
  if (on) {
    if (mesh.material.emissive) {
      mesh.material.emissive.setHex(getHighlightHex());
      mesh.material.emissiveIntensity = 0.55;
    }
  } else {
    if (mesh.material.emissive) {
      mesh.material.emissive.setHex(mesh.userData.baseEmissive || 0x000000);
      mesh.material.emissiveIntensity = mesh.userData.baseEmissiveIntensity || 0;
    }
  }
}

function updateInspector() {
  var body = document.getElementById('inspector-body');
  if (!body) return;

  if (!selectedId || !INFO[selectedId]) {
    body.innerHTML = '<div class="empty-inspector">Click any 3D layer, diffusion, gate, contact, or Metal-1 trace (or switch to Schematic) to inspect physical properties and λ design rules.</div>';
    return;
  }

  var info = INFO[selectedId];
  var html = '<div class="insp-title">' + info.title + '</div>' +
    '<span class="insp-pill">' + info.layer + '</span>' +
    '<div class="insp-kv"><div class="insp-k">Material / Structure</div><div class="insp-v">' + info.type + '</div></div>' +
    '<div class="insp-kv"><div class="insp-k">Electrical &amp; Topological Role</div><div class="insp-v">' + info.role + '</div></div>' +
    '<div class="insp-kv"><div class="insp-k">Fabrication Process</div><div class="insp-v">' + info.process + '</div></div>';

  if (typeof getDimensionRulesForId === 'function') {
    var rules = getDimensionRulesForId(selectedId);
    if (rules && rules.length) {
      html += '<div class="insp-dims"><div class="insp-k">Process Dimensions (' + (typeof currentNodePreset !== 'undefined' ? currentNodePreset.node : '90nm') + ')</div>';
      for (var i = 0; i < rules.length; i++) {
        html += '<div class="dim-row"><span class="dim-lbl">' + rules[i].label + ' (' + rules[i].rule + ')</span>' +
          '<span class="dim-val">' + rules[i].valueText + '</span></div>';
      }
      html += '</div>';
    }
  }

  body.innerHTML = html;
}

function updatePopoverContent() {
  var pop = document.getElementById('popover');
  if (!pop) return;

  if (!selectedId || !INFO[selectedId]) {
    pop.classList.add('hidden');
    return;
  }

  var info = INFO[selectedId];
  var layerEl = document.getElementById('pop-layer');
  var titleEl = document.getElementById('pop-title');
  var roleEl = document.getElementById('pop-role');
  var dimEl = document.getElementById('pop-dim');

  if (layerEl) layerEl.textContent = info.layer;
  if (titleEl) titleEl.textContent = info.title;
  if (roleEl) roleEl.textContent = info.role;

  if (dimEl) {
    if (typeof getDimensionRulesForId === 'function') {
      var rules = getDimensionRulesForId(selectedId);
      if (rules && rules.length) {
        dimEl.textContent = rules[0].label + ': ' + rules[0].valueText + ' (' + rules[0].rule + ')';
        dimEl.classList.remove('hidden');
      } else {
        dimEl.classList.add('hidden');
      }
    } else {
      dimEl.classList.add('hidden');
    }
  }
}

function syncTreeAndSchematicSelection() {
  var treeItems = document.querySelectorAll('.tree-item[data-id]');
  for (var i = 0; i < treeItems.length; i++) {
    var tid = treeItems[i].getAttribute('data-id');
    treeItems[i].classList.toggle('active', tid === selectedId);
  }

  var schEls = document.querySelectorAll('.sch-el[data-id]');
  for (var j = 0; j < schEls.length; j++) {
    var sid = schEls[j].getAttribute('data-id');
    schEls[j].classList.toggle('active', sid === selectedId);
  }
}

function clearSelection() {
  for (var i = 0; i < selectedMeshes.length; i++) {
    setMeshHighlight(selectedMeshes[i], false);
  }
  selectedId = null;
  selectedMeshes = [];

  if (typeof applyLogicTint === 'function') {
    applyLogicTint();
  }

  updateInspector();
  updatePopoverContent();
  syncTreeAndSchematicSelection();

  if (typeof updateVoiceContext === 'function') {
    updateVoiceContext();
  }
}

function selectById(id) {
  if (!id || !INFO[id]) return;

  for (var i = 0; i < selectedMeshes.length; i++) {
    setMeshHighlight(selectedMeshes[i], false);
  }

  selectedId = id;
  selectedMeshes = collectTargetMeshes(id);

  if (typeof applyLogicTint === 'function') {
    applyLogicTint();
  }

  for (var j = 0; j < selectedMeshes.length; j++) {
    setMeshHighlight(selectedMeshes[j], true);
  }

  updateInspector();
  updatePopoverContent();
  syncTreeAndSchematicSelection();

  if (typeof updateVoiceContext === 'function') {
    updateVoiceContext();
  }
}

function updatePopoverPosition() {
  var pop = document.getElementById('popover');
  if (!pop) return;

  var isSchematic = typeof viewMode !== 'undefined' && viewMode === 'schematic';
  var isTour = typeof isTourRunning !== 'undefined' && isTourRunning;
  if (!selectedId || !selectedMeshes.length || isSchematic || isTour) {
    pop.classList.add('hidden');
    return;
  }

  _centroidBox.makeEmpty();
  var count = 0;
  for (var i = 0; i < selectedMeshes.length; i++) {
    var m = selectedMeshes[i];
    if (m.visible) {
      _centroidBox.expandByObject(m);
      count++;
    }
  }
  if (!count || _centroidBox.isEmpty()) {
    pop.classList.add('hidden');
    return;
  }

  _centroidBox.getCenter(_tempVec);
  _tempVec.project(camera);

  if (_tempVec.z > 1 || _tempVec.z < -1) {
    pop.classList.add('hidden');
    return;
  }

  var sx = (_tempVec.x * 0.5 + 0.5) * W();
  var sy = (-_tempVec.y * 0.5 + 0.5) * H();

  if (sx < -40 || sx > W() + 40 || sy < -40 || sy > H() + 40) {
    pop.classList.add('hidden');
    return;
  }

  var clampedX = Math.max(134, Math.min(W() - 134, sx));
  pop.style.left = clampedX.toFixed(1) + 'px';
  pop.style.top = sy.toFixed(1) + 'px';
  pop.classList.toggle('flip-below', sy < 145);
  pop.classList.remove('hidden');
}

if (renderer && renderer.domElement) {
  renderer.domElement.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('pointerup', function (e) {
    if (e.button !== 0 || !pointerDownPos) return;
    var dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    pointerDownPos = null;
    if (dist > 6) return;
    if (typeof isTourRunning !== 'undefined' && isTourRunning) return;

    var rect = renderer.domElement.getBoundingClientRect();
    var ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);

    var pickables = [];
    for (var i = 0; i < allMeshes.length; i++) {
      var m = allMeshes[i];
      if (m.visible && !m.userData.decorative) {
        pickables.push(m);
      }
    }

    var hits = raycaster.intersectObjects(pickables, false);
    if (hits.length > 0 && hits[0].object && hits[0].object.userData.id) {
      selectById(hits[0].object.userData.id);
    } else {
      clearSelection();
    }
  });
}

var popCloseBtn = document.getElementById('pop-close');
if (popCloseBtn) {
  popCloseBtn.addEventListener('click', function () {
    clearSelection();
  });
}
