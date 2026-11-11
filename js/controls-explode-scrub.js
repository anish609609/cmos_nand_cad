/* Independent 3-axis EXPLODE (X/Y/Z) & always-on THREE.Plane section clipping (SCRUB X/Y/Z) */

var explodeX = 0;
var explodeY = 1;
var explodeZ = 0;

function computeExplodedPosition(restPos, layerKey, explodeIdx, ex, ey, ez) {
  var isSub = layerKey === 'substrate';
  var dx = isSub ? 0 : (restPos.x + 0.5) * 0.45 * ex;
  var dy = explodeIdx * EXPLODE_GAP * ey;
  var dz = isSub ? 0 : restPos.z * 0.50 * ez;
  return {
    x: restPos.x + dx,
    y: restPos.y + dy,
    z: restPos.z + dz
  };
}

function applyExplode() {
  var ex = explodeX / 100;
  var ey = explodeY / 100;
  var ez = explodeZ / 100;

  for (var i = 0; i < allMeshes.length; i++) {
    var m = allMeshes[i];
    var rp = m.userData.restPos;
    var pos = computeExplodedPosition(rp, m.userData.explodeLayer, m.userData.explodeIdx, ex, ey, ez);
    m.position.set(pos.x, pos.y, pos.z);
  }

  for (var j = 0; j < labelsList.length; j++) {
    var lbl = labelsList[j];
    var lrp = lbl.userData.restPos;
    var lpos = computeExplodedPosition(lrp, lbl.userData.explodeLayer, lbl.userData.explodeIdx, ex, ey, ez);
    lbl.position.set(lpos.x, lpos.y, lpos.z);
  }

  if (typeof rebuildFlowCurves === 'function') {
    rebuildFlowCurves();
  }
}

function setClipSliderPlane(planeIdx, val, maxVal, readoutEl) {
  if (!activeClipPlanes || !activeClipPlanes[planeIdx]) return;
  if (val >= maxVal - 0.01) {
    activeClipPlanes[planeIdx].constant = 999;
    if (readoutEl) readoutEl.textContent = 'OFF';
  } else {
    activeClipPlanes[planeIdx].constant = val;
    if (readoutEl) readoutEl.textContent = val.toFixed(1);
  }
}

function initExplodeAndScrubControls() {
  var exEl = document.getElementById('explode-x');
  var eyEl = document.getElementById('explode-y');
  var ezEl = document.getElementById('explode-z');
  var vexEl = document.getElementById('val-explode-x');
  var veyEl = document.getElementById('val-explode-y');
  var vezEl = document.getElementById('val-explode-z');

  if (exEl) {
    exEl.addEventListener('input', function () {
      explodeX = parseFloat(exEl.value) || 0;
      if (vexEl) vexEl.textContent = explodeX + '%';
      applyExplode();
    });
  }
  if (eyEl) {
    eyEl.addEventListener('input', function () {
      explodeY = parseFloat(eyEl.value) || 0;
      if (veyEl) veyEl.textContent = explodeY + '%';
      applyExplode();
    });
  }
  if (ezEl) {
    ezEl.addEventListener('input', function () {
      explodeZ = parseFloat(ezEl.value) || 0;
      if (vezEl) vezEl.textContent = explodeZ + '%';
      applyExplode();
    });
  }

  var cxEl = document.getElementById('clip-x');
  var cyEl = document.getElementById('clip-y');
  var czEl = document.getElementById('clip-z');
  var vcxEl = document.getElementById('val-clip-x');
  var vcyEl = document.getElementById('val-clip-y');
  var vczEl = document.getElementById('val-clip-z');

  if (cxEl) {
    cxEl.addEventListener('input', function () {
      setClipSliderPlane(0, parseFloat(cxEl.value), parseFloat(cxEl.max), vcxEl);
    });
  }
  if (cyEl) {
    cyEl.addEventListener('input', function () {
      setClipSliderPlane(1, parseFloat(cyEl.value), parseFloat(cyEl.max), vcyEl);
    });
  }
  if (czEl) {
    czEl.addEventListener('input', function () {
      setClipSliderPlane(2, parseFloat(czEl.value), parseFloat(czEl.max), vczEl);
    });
  }

  var hudCollapseBtn = document.getElementById('btn-hud-collapse');
  var hudEl = document.getElementById('view-hud');
  if (hudCollapseBtn && hudEl) {
    hudCollapseBtn.addEventListener('click', function () {
      hudEl.classList.toggle('collapsed');
      hudCollapseBtn.textContent = hudEl.classList.contains('collapsed') ? '▸' : '▾';
    });
  }

  applyExplode();
}

function resetExplodeAndScrub() {
  explodeX = 0;
  explodeY = 1;
  explodeZ = 0;

  var exEl = document.getElementById('explode-x');
  var eyEl = document.getElementById('explode-y');
  var ezEl = document.getElementById('explode-z');
  if (exEl) exEl.value = '0';
  if (eyEl) eyEl.value = '1';
  if (ezEl) ezEl.value = '0';

  var vexEl = document.getElementById('val-explode-x');
  var veyEl = document.getElementById('val-explode-y');
  var vezEl = document.getElementById('val-explode-z');
  if (vexEl) vexEl.textContent = '0%';
  if (veyEl) veyEl.textContent = '1%';
  if (vezEl) vezEl.textContent = '0%';

  var cxEl = document.getElementById('clip-x');
  var cyEl = document.getElementById('clip-y');
  var czEl = document.getElementById('clip-z');
  if (cxEl) cxEl.value = cxEl.max;
  if (cyEl) cyEl.value = cyEl.max;
  if (czEl) czEl.value = czEl.max;

  setClipSliderPlane(0, 999, 999, document.getElementById('val-clip-x'));
  setClipSliderPlane(1, 999, 999, document.getElementById('val-clip-y'));
  setClipSliderPlane(2, 999, 999, document.getElementById('val-clip-z'));

  applyExplode();
}

initExplodeAndScrubControls();
