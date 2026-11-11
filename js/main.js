/* Drawer toggles, HUD right/left offset synchronization, resetAll & startup ready */

function updateViewHudPosition() {
  var rightPanel = document.getElementById('right-panel');
  var leftPanel = document.getElementById('left-panel');
  var viewHud = document.getElementById('view-hud');
  var vaLauncher = document.getElementById('va-launcher-btn');
  var vaWidget = document.getElementById('voice-assistant-widget');
  var stateBadge = document.getElementById('state-badge');

  var rightCollapsed = !rightPanel || rightPanel.classList.contains('collapsed');
  var rightOffset = rightCollapsed ? 14 : (rightPanel.offsetWidth + 24);

  if (viewHud) viewHud.style.right = rightOffset + 'px';
  if (vaLauncher) vaLauncher.style.right = rightOffset + 'px';
  if (vaWidget) vaWidget.style.right = rightOffset + 'px';

  var leftCollapsed = !leftPanel || leftPanel.classList.contains('collapsed');
  var leftOffset = leftCollapsed ? 14 : (leftPanel.offsetWidth + 24);
  if (stateBadge) stateBadge.style.left = leftOffset + 'px';
}

function resetAll() {
  if (typeof isTourRunning !== 'undefined' && isTourRunning && typeof stopTour === 'function') {
    stopTour();
  }

  if (typeof resetExplodeAndScrub === 'function') {
    resetExplodeAndScrub();
  }

  for (var k in layerVisibility) {
    if (Object.prototype.hasOwnProperty.call(layerVisibility, k)) {
      layerVisibility[k] = true;
    }
  }
  showLabels3D = true;
  if (typeof syncVisibilityCheckboxes === 'function') {
    syncVisibilityCheckboxes();
  }

  if (typeof setFlowMode === 'function') {
    setFlowMode('current');
  }
  if (typeof setInputs === 'function') {
    setInputs('off', 'off');
  }
  if (typeof setViewMode === 'function') {
    setViewMode('layout');
  }
  if (typeof clearSelection === 'function') {
    clearSelection();
  }

  camera.position.copy(TOP_VIEW_POS);
  controls.target.copy(INITIAL_TARGET);
  controls.update();
}

function initMainUi() {
  var leftPanel = document.getElementById('left-panel');
  var rightPanel = document.getElementById('right-panel');
  var toggleLeft = document.getElementById('toggle-left');
  var toggleRight = document.getElementById('toggle-right');

  if (window.innerWidth < 1180) {
    if (leftPanel) leftPanel.classList.add('collapsed');
    if (rightPanel) rightPanel.classList.add('collapsed');
  }

  function syncToggleArrows() {
    if (toggleLeft && leftPanel) {
      toggleLeft.textContent = leftPanel.classList.contains('collapsed') ? '›' : '‹';
    }
    if (toggleRight && rightPanel) {
      toggleRight.textContent = rightPanel.classList.contains('collapsed') ? '‹' : '›';
    }
  }

  if (toggleLeft && leftPanel) {
    toggleLeft.addEventListener('click', function () {
      leftPanel.classList.toggle('collapsed');
      syncToggleArrows();
      updateViewHudPosition();
    });
  }

  if (toggleRight && rightPanel) {
    toggleRight.addEventListener('click', function () {
      rightPanel.classList.toggle('collapsed');
      syncToggleArrows();
      updateViewHudPosition();
    });
  }

  var btnTheme = document.getElementById('btn-theme');
  if (btnTheme && typeof toggleTheme === 'function') {
    btnTheme.addEventListener('click', toggleTheme);
  }

  var btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', resetAll);
  }

  syncToggleArrows();
  updateViewHudPosition();

  var overlay = document.getElementById('loading-overlay');
  if (overlay) {
    setTimeout(function () {
      overlay.classList.add('fade-out');
      setTimeout(function () {
        overlay.classList.add('hidden');
      }, 280);
    }, 120);
  }
}

initMainUi();
