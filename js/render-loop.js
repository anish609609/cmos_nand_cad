/* Main animation & render loop: travelling Metal-1 glow wave, semiconductor pulse, flow markers, OrbitControls & popover sync */

var _lastTime = performance.now();
var _animTime = 0;

function layerColorOf(m) {
  if (m.userData && m.userData.colorVar) return m.userData.colorVar;
  var layer = m.userData ? m.userData.layer : '';
  var map = {
    substrate: '--c-substrate',
    well: '--c-well',
    active: '--c-active-n',
    sde: '--c-sde-n',
    oxide: '--c-oxide',
    highk: '--c-highk',
    poly: '--c-poly',
    metal: '--c-metal'
  };
  return map[layer] || '--accent';
}

function updateActivePulse(t, stationary) {
  var flowColor = (typeof flowMode !== 'undefined' && flowMode === 'electron') ? 0x4fd1ff : 0xffcf4d;

  for (var i = 0; i < allMeshes.length; i++) {
    var m = allMeshes[i];
    if (!m.material || !m.material.emissive) continue;
    if (typeof selectedMeshes !== 'undefined' && selectedMeshes.indexOf(m) !== -1) continue;

    if (stationary || !m.userData.pulsing) {
      m.material.emissive.setHex(m.userData.baseEmissive || 0x000000);
      m.material.emissiveIntensity = m.userData.baseEmissiveIntensity || 0;
      continue;
    }

    if (m.userData.layer === 'metal') {
      var wave = 0.5 + 0.5 * Math.sin(t * 2.0 - (m.position.z || 0) * 0.45);
      m.material.emissive.setHex(flowColor);
      m.material.emissiveIntensity = 0.35 + 0.55 * wave;
    } else {
      var pulse = 0.35 + Math.abs(Math.sin(t * 1.2)) * 0.35;
      m.material.emissive.setHex(new THREE.Color(cssVar(layerColorOf(m))).getHex());
      m.material.emissiveIntensity = pulse;
    }
  }
}

function renderTick(now) {
  requestAnimationFrame(renderTick);

  var dt = Math.min(0.05, Math.max(0, (now - _lastTime) / 1000));
  _lastTime = now;

  var tourActive = typeof isTourRunning !== 'undefined' && isTourRunning;
  var frozen = typeof isCircuitFrozen !== 'undefined' && isCircuitFrozen;

  if (!tourActive && !frozen) {
    _animTime += dt;
    if (typeof updateFlowMarkers === 'function') {
      updateFlowMarkers(dt);
    }
    updateActivePulse(_animTime, false);
  } else {
    if (typeof hideAllFlowMarkers === 'function') {
      hideAllFlowMarkers();
    }
    updateActivePulse(_animTime, true);
  }

  controls.update();

  if (typeof updatePopoverPosition === 'function') {
    updatePopoverPosition();
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(renderTick);
