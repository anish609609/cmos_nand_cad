/* Procedural 3D NAND2 physical layout geometry, Gaussian doping profiles, iso-contours, PDK Metal-1 & themeable labels */

var Y = {
  subBot: 0.0,    subTop: 2.0,
  wellBot: 1.10,  wellTop: 2.05,    // sits in UPPER part of substrate, +0.05 proud
  actBot: 1.55,   actTop: 1.95,     // recessed below well/substrate top surface
  oxideBot: 1.95, oxideTop: 1.985,  // interfacial SiO2 (thickness 0.035)
  highkBot: 1.985,highkTop: 2.02,   // High-K HfO2 (thickness 0.035)
  polyBot: 2.02,  polyTop: 2.32,    // polysilicon height 0.30
  metalBot: 2.95, metalTop: 3.10    // flat ribbon: 0.15 (1λ) thick
};

var LAYER_ORDER = ['substrate', 'well', 'active', 'oxide', 'highk', 'poly', 'contact', 'metal'];
var EXPLODE_GAP = 3.2;

var allMeshes = [];
var meshById = {};
var meshesById = {};
var labelSprites = [];
var labelsList = labelSprites;
var gaussTexCache = {};
var brushedMetalTexCache = null;

var activeClipPlanes = [
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), 999),
  new THREE.Plane(new THREE.Vector3(0, -1, 0), 999),
  new THREE.Plane(new THREE.Vector3(0, 0, -1), 999)
];

/* ============================================================
   PROCEDURAL GRADIENT & BRUSHED METAL TEXTURES
   ============================================================ */

function gaussianDepthTexture(colorVarOrHex, peakV, sigmaV, opts) {
  opts = opts || {};
  var rawColor = colorVarOrHex.indexOf('--') === 0 ? cssVar(colorVarOrHex) : colorVarOrHex;
  var key = [rawColor, peakV, sigmaV, opts.isoLines || 5].join('|');
  if (gaussTexCache[key]) return gaussTexCache[key];

  var TW = 512, TH = 256;
  var c = document.createElement('canvas'); c.width = TW; c.height = TH;
  var ctx = c.getContext('2d');
  var img = ctx.createImageData(TW, TH), data = img.data;

  var tc = new THREE.Color(rawColor);
  var r0 = Math.round(tc.r * 255), g0 = Math.round(tc.g * 255), b0 = Math.round(tc.b * 255);
  var nIso = opts.isoLines !== undefined ? opts.isoLines : 5;

  for (var py = 0; py < TH; py++) {
    var v = py / (TH - 1); // 0 = wafer surface, 1 = junction bottom
    var dv = (v - peakV) / sigmaV;
    var gDepth = Math.exp(-0.5 * dv * dv);

    for (var px = 0; px < TW; px++) {
      var u = px / (TW - 1);
      var uMod = 0.94 + 0.06 * Math.cos(u * Math.PI * 4);
      var conc = Math.min(1.0, gDepth * uMod);

      var idx = (py * TW + px) * 4;
      data[idx]     = Math.min(255, Math.round(r0 * (0.65 + 0.45 * conc) + 40 * conc));
      data[idx + 1] = Math.min(255, Math.round(g0 * (0.65 + 0.45 * conc) + 40 * conc));
      data[idx + 2] = Math.min(255, Math.round(b0 * (0.65 + 0.45 * conc) + 40 * conc));
      data[idx + 3] = Math.round(180 + 75 * conc);
    }
  }
  ctx.putImageData(img, 0, 0);

  var isoRatios = [0.85, 0.60, 0.35, 0.15, 0.05].slice(0, nIso);
  isoRatios.forEach(function (ratio, i) {
    var dv = Math.sqrt(-2.0 * Math.log(ratio)) * sigmaV;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.70 - i * 0.10).toFixed(2) + ')';
    ctx.lineWidth = 1.4;
    var vUp = peakV - dv;
    if (vUp >= 0 && vUp <= 1) {
      ctx.beginPath(); ctx.moveTo(0, vUp * (TH - 1)); ctx.lineTo(TW, vUp * (TH - 1)); ctx.stroke();
    }
    var vDn = peakV + dv;
    if (vDn >= 0 && vDn <= 1) {
      ctx.beginPath(); ctx.moveTo(0, vDn * (TH - 1)); ctx.lineTo(TW, vDn * (TH - 1)); ctx.stroke();
    }
  });

  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(TW, 2); ctx.stroke();
  ctx.setLineDash([]);

  var tex = new THREE.CanvasTexture(c);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  gaussTexCache[key] = tex;
  return tex;
}

function getBrushedMetalTexture() {
  if (brushedMetalTexCache) return brushedMetalTexCache;
  var c = document.createElement('canvas'); c.width = 256; c.height = 256;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(0, 0, 256, 256);
  for (var i = 0; i < 300; i++) {
    var y = Math.random() * 256;
    var len = 30 + Math.random() * 150;
    var x = Math.random() * 256;
    var alpha = 0.08 + Math.random() * 0.15;
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,' + alpha + ')' : 'rgba(80,80,80,' + alpha + ')';
    ctx.lineWidth = 0.7 + Math.random() * 1.0;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
  var tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  brushedMetalTexCache = tex;
  return tex;
}

/* ============================================================
   EXACT GEOMETRY BUILDER FUNCTIONS
   ============================================================ */

function getRoundedRectPoint(hx, hz, cr, theta) {
  var cos = Math.cos(theta), sin = Math.sin(theta);
  var sx = Math.max(0, hx - cr), sz = Math.max(0, hz - cr);
  var qx = cos >= 0 ? 1 : -1, qz = sin >= 0 ? 1 : -1;
  var cCos = Math.abs(cos), cSin = Math.abs(sin);
  var len = Math.hypot(cCos, cSin) || 1;
  return [qx * (sx + cr * (cCos / len)), qz * (sz + cr * (cSin / len))];
}

// 3D GAUSSIAN CURVED TUB GEOMETRY (Wells, S/D, SDE/LDD, Taps)
function createGaussianTubGeometry(w, h, d, opts) {
  opts = opts || {};
  var nLayers = opts.nLayers || 20;
  var nPerim = opts.nPerim || 48;
  var straggle = opts.straggle !== undefined ? opts.straggle : 0.18;
  var cornerR = opts.cornerR !== undefined ? opts.cornerR : Math.min(w, d) * 0.22;

  var positions = [], uvs = [], indices = [];
  var halfW = w / 2, halfD = d / 2;

  for (var i = 0; i <= nLayers; i++) {
    var eta = i / nLayers; // 0 at wafer surface, 1 at bottom apex
    var rFactor = Math.sqrt(Math.max(0, 1.0 - eta * eta));
    var curHx = halfW * (1.0 - straggle * (1.0 - rFactor));
    var curHz = halfD * (1.0 - straggle * (1.0 - rFactor));
    var curCr = cornerR * (0.35 + 0.65 * rFactor);
    var y = h * 0.5 - h * eta;

    for (var j = 0; j < nPerim; j++) {
      var theta = (j / nPerim) * Math.PI * 2;
      var pt = getRoundedRectPoint(curHx, curHz, curCr, theta);
      positions.push(pt[0], y, pt[1]);
      uvs.push(j / nPerim, eta);
    }
  }

  for (var i2 = 0; i2 < nLayers; i2++) {
    var ring1 = i2 * nPerim, ring2 = (i2 + 1) * nPerim;
    for (var j2 = 0; j2 < nPerim; j2++) {
      var nextJ = (j2 + 1) % nPerim;
      var a = ring1 + j2, b = ring2 + j2, c = ring2 + nextJ, dIdx = ring1 + nextJ;
      indices.push(a, b, dIdx, b, c, dIdx);
    }
  }

  var bottomCenterIdx = positions.length / 3;
  positions.push(0, -h * 0.5, 0);
  uvs.push(0.5, 1.0);
  var lastRingStart = nLayers * nPerim;
  for (var jb = 0; jb < nPerim; jb++) {
    indices.push(bottomCenterIdx, lastRingStart + ((jb + 1) % nPerim), lastRingStart + jb);
  }

  var topCenterIdx = positions.length / 3;
  positions.push(0, h * 0.5, 0);
  uvs.push(0.5, 0.0);
  for (var jt = 0; jt < nPerim; jt++) {
    indices.push(topCenterIdx, jt, (jt + 1) % nPerim);
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// FILLETED METAL-1 TRACE GEOMETRY
function createFilletedTraceGeometry(w, h, d, cornerRadius, bevel) {
  cornerRadius = Math.min(cornerRadius !== undefined ? cornerRadius : 0.15, Math.min(w, d) * 0.48);
  bevel = Math.min(bevel !== undefined ? bevel : 0.02, Math.min(w, h, d) * 0.25);
  var hw = w / 2, hd = d / 2, cr = cornerRadius;

  var shape = new THREE.Shape();
  shape.moveTo(-hw + cr, -hd);
  shape.lineTo(hw - cr, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + cr);
  shape.lineTo(hw, hd - cr);
  shape.quadraticCurveTo(hw, hd, hw - cr, hd);
  shape.lineTo(-hw + cr, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - cr);
  shape.lineTo(-hw, -hd + cr);
  shape.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);

  var geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: Math.max(0.001, h - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2
  });
  geo.rotateX(Math.PI / 2);
  geo.center();
  return geo;
}

// OCTAGONAL 5λ×5λ VIA LANDING PAD (1λ 45° chamfer)
function createOctagonalViaPadGeometry(size, h, chamfer, bevel) {
  size = size || 0.75;
  chamfer = chamfer || 0.15;
  bevel = bevel !== undefined ? bevel : 0.02;
  var hs = size / 2, c = Math.min(chamfer, hs * 0.6);

  var shape = new THREE.Shape();
  shape.moveTo(-hs + c, -hs); shape.lineTo(hs - c, -hs);
  shape.lineTo(hs, -hs + c);  shape.lineTo(hs, hs - c);
  shape.lineTo(hs - c, hs);   shape.lineTo(-hs + c, hs);
  shape.lineTo(-hs, hs - c);  shape.lineTo(-hs, -hs + c);
  shape.closePath();

  var geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: Math.max(0.001, h - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2
  });
  geo.rotateX(Math.PI / 2);
  geo.center();
  return geo;
}

// 45-DEGREE CHAMFERED T-JUNCTION BRACKET
function createChamferedTJunctionGeometry(branchDir, railW, branchW, chamfer, height, bevel) {
  railW = railW || 0.45; branchW = branchW || 0.45;
  chamfer = chamfer || 0.15; height = height || 0.15;
  bevel = bevel !== undefined ? bevel : 0.02;

  var hwRail = railW / 2, hwBranch = branchW / 2, c = chamfer;
  var armRail = hwBranch + c + 0.20, armBranch = hwRail + c + 0.20;

  var shape = new THREE.Shape();
  shape.moveTo(-hwRail, armRail);
  shape.lineTo(hwRail, armRail);
  shape.lineTo(hwRail, hwBranch + c);
  shape.lineTo(hwRail + c, hwBranch);
  shape.lineTo(armBranch, hwBranch);
  shape.lineTo(armBranch, -hwBranch);
  shape.lineTo(hwRail + c, -hwBranch);
  shape.lineTo(hwRail, -hwBranch - c);
  shape.lineTo(hwRail, -armRail);
  shape.lineTo(-hwRail, -armRail);
  shape.closePath();

  var geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: Math.max(0.001, height - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2
  });
  geo.rotateX(Math.PI / 2);
  geo.computeBoundingBox();
  var bb = geo.boundingBox;
  geo.translate(0, -(bb.min.y + bb.max.y) / 2, 0);

  if (branchDir === '-z')      geo.rotateY(Math.PI / 2);
  else if (branchDir === '+z') geo.rotateY(-Math.PI / 2);
  else if (branchDir === '-x') geo.rotateY(Math.PI);
  return geo;
}

/* ============================================================
   GAUSSIAN TUB + CONTOUR LOOPS + CORE MESH BUILDER
   ============================================================ */

function createTubContourLoop(w, h, d, eta, yOverride, straggle, cornerR, colorObj, opacity) {
  var nPerim = 48;
  var halfW = w / 2, halfD = d / 2;
  var rFactor = Math.sqrt(Math.max(0, 1.0 - eta * eta));
  var curHx = halfW * (1.0 - straggle * (1.0 - rFactor));
  var curHz = halfD * (1.0 - straggle * (1.0 - rFactor));
  var curCr = cornerR * (0.35 + 0.65 * rFactor);
  var y = yOverride !== undefined ? yOverride : (h * 0.5 - h * eta);

  var pts = [];
  for (var j = 0; j < nPerim; j++) {
    var theta = (j / nPerim) * Math.PI * 2;
    var pt = getRoundedRectPoint(curHx, curHz, curCr, theta);
    pts.push(new THREE.Vector3(pt[0], y, pt[1]));
  }

  var geo = new THREE.BufferGeometry().setFromPoints(pts);
  var mat = new THREE.LineBasicMaterial({
    color: colorObj,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    clippingPlanes: activeClipPlanes
  });
  var loop = new THREE.LineLoop(geo, mat);
  loop.raycast = function () {};
  return loop;
}

function gaussianDopingMesh(w, h, d, colorVar, opts) {
  opts = opts || {};
  var peakV = opts.peakV !== undefined ? opts.peakV : 0.15;
  var sigmaV = opts.sigmaV !== undefined ? opts.sigmaV : 0.22;
  var isoLines = opts.isoLines !== undefined ? opts.isoLines : 5;
  var straggle = opts.straggle !== undefined ? opts.straggle : 0.16;
  var cornerR = opts.cornerR !== undefined ? opts.cornerR : Math.min(w, d) * 0.22;

  var baseColor = new THREE.Color(cssVar(colorVar));
  var tex = gaussianDepthTexture(colorVar, peakV, sigmaV, { isoLines: isoLines });

  var outerGeo = createGaussianTubGeometry(w, h, d, {
    nLayers: 20,
    nPerim: 48,
    straggle: straggle,
    cornerR: cornerR
  });

  var outerMat = new THREE.MeshStandardMaterial({
    color: baseColor.clone(),
    map: tex,
    roughness: 0.50,
    metalness: 0.15,
    emissive: 0x000000,
    emissiveIntensity: 0,
    transparent: true,
    opacity: opts.opacity !== undefined ? opts.opacity : 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    clippingPlanes: activeClipPlanes
  });

  var mesh = new THREE.Mesh(outerGeo, outerMat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.renderOrder = opts.renderOrder !== undefined ? opts.renderOrder : 3;

  mesh.userData.colorVar = colorVar;
  mesh.userData.gaussParams = { peakV: peakV, sigmaV: sigmaV, isoLines: isoLines };

  /* 3 depth iso-concentration LineLoop rings at eta = [0.25, 0.50, 0.75] */
  var contourEtas = [0.25, 0.50, 0.75];
  var depthColor = opts.outlineColor
    ? new THREE.Color(opts.outlineColor)
    : baseColor.clone().offsetHSL(0, 0.1, 0.2);

  for (var idx = 0; idx < contourEtas.length; idx++) {
    var depthLoop = createTubContourLoop(
      w, h, d,
      contourEtas[idx],
      undefined,
      straggle,
      cornerR,
      depthColor.clone(),
      0.70 - idx * 0.15
    );
    depthLoop.userData.isAutoOutline = !opts.outlineColor;
    depthLoop.userData.isDepthRing = true;
    mesh.add(depthLoop);
  }

  /* 1 top wafer-surface perimeter LineLoop at y = h * 0.5 + 0.005 */
  var topColor = opts.outlineColor
    ? new THREE.Color(opts.outlineColor)
    : baseColor.clone();
  var topLoop = createTubContourLoop(
    w, h, d,
    0,
    h * 0.5 + 0.005,
    straggle,
    cornerR,
    topColor,
    0.85
  );
  topLoop.userData.isAutoOutline = !opts.outlineColor;
  topLoop.userData.isDepthRing = false;
  mesh.add(topLoop);

  /* Inner volumetric high-concentration coreMesh */
  var coreGeo = createGaussianTubGeometry(0.70 * w, 0.60 * h, 0.70 * d, {
    nLayers: 12,
    nPerim: 32,
    straggle: straggle * 1.2,
    cornerR: cornerR * 0.7
  });
  var coreMat = new THREE.MeshBasicMaterial({
    color: baseColor.clone(),
    transparent: true,
    opacity: 0.30,
    depthWrite: false,
    side: THREE.DoubleSide,
    clippingPlanes: activeClipPlanes
  });
  var coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.raycast = function () {};
  mesh.add(coreMesh);
  mesh.userData.coreMesh = coreMesh;

  return mesh;
}

function makeMetalMaterial(colorVar) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(cssVar(colorVar)),
    metalness: 0.90,
    roughness: 0.20,
    roughnessMap: getBrushedMetalTexture(),
    envMap: typeof studioEnvMap !== 'undefined' ? studioEnvMap : null,
    envMapIntensity: 1.25,
    emissive: 0x000000,
    emissiveIntensity: 0,
    opacity: 1.0,
    transparent: false,
    side: THREE.FrontSide,
    depthWrite: true,
    clippingPlanes: activeClipPlanes
  });
}

function registerMesh(mesh, id, layer, opts) {
  opts = opts || {};
  mesh.userData.id = id;
  mesh.userData.layer = layer;
  mesh.userData.explodeLayer = opts.explodeLayer || layer;
  mesh.userData.explodeIdx = LAYER_ORDER.indexOf(mesh.userData.explodeLayer);
  if (mesh.userData.explodeIdx < 0) mesh.userData.explodeIdx = 0;
  mesh.userData.restPos = mesh.position.clone();
  mesh.userData.decorative = Boolean(opts.decorative);
  mesh.userData.pulsing = false;
  mesh.userData.baseColor = mesh.material && mesh.material.color ? mesh.material.color.getHex() : 0xffffff;
  mesh.userData.baseEmissive = mesh.material && mesh.material.emissive ? mesh.material.emissive.getHex() : 0x000000;
  mesh.userData.baseEmissiveIntensity = mesh.material && mesh.material.emissiveIntensity ? mesh.material.emissiveIntensity : 0;

  if (opts.decorative) {
    mesh.raycast = function () {};
  }

  cellGroup.add(mesh);
  allMeshes.push(mesh);

  if (!meshesById[id]) meshesById[id] = [];
  meshesById[id].push(mesh);
  if (!meshById[id]) meshById[id] = mesh;
  return mesh;
}

function contactAt(id, x, z, topOfLower) {
  var h = Y.metalBot - topOfLower;
  var midY = (topOfLower + Y.metalBot) / 2;
  var geo = new THREE.CylinderGeometry(0.21, 0.17, h, 16, 1, false);
  var mat = new THREE.MeshStandardMaterial({
    color: 0x4a4d54,
    metalness: 0.95,
    roughness: 0.25,
    envMap: typeof studioEnvMap !== 'undefined' ? studioEnvMap : null,
    envMapIntensity: 1.1,
    emissive: 0x000000,
    emissiveIntensity: 0,
    opacity: 1.0,
    transparent: false,
    side: THREE.FrontSide,
    depthWrite: true,
    clippingPlanes: activeClipPlanes
  });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, midY, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return registerMesh(mesh, id, 'contact');
}

/* ============================================================
   3D LABEL SPRITES & DYNAMIC THEME SYNCHRONIZATION
   ============================================================ */

function renderLabelCanvasTexture(text, colorHex) {
  var isLight = document.documentElement.getAttribute('data-theme') === 'light';
  var pad = 10, fontSize = 26;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  ctx.font = '600 ' + fontSize + 'px IBM Plex Mono, monospace';
  var metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + pad * 2;
  canvas.height = fontSize + pad * 2;
  ctx.font = '600 ' + fontSize + 'px IBM Plex Mono, monospace';
  ctx.fillStyle = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(10,13,18,0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = colorHex; ctx.lineWidth = 1.5;
  ctx.strokeRect(0.75, 0.75, canvas.width - 1.5, canvas.height - 1.5);
  ctx.fillStyle = colorHex;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad, canvas.height / 2 + 1);

  var tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  return { tex: tex, width: canvas.width, height: canvas.height };
}

function makeLabel(text, colorHex) {
  var isLight = document.documentElement.getAttribute('data-theme') === 'light';
  var pad = 10, fontSize = 26;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  ctx.font = '600 ' + fontSize + 'px IBM Plex Mono, monospace';
  var metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + pad * 2;
  canvas.height = fontSize + pad * 2;
  ctx.font = '600 ' + fontSize + 'px IBM Plex Mono, monospace';
  ctx.fillStyle = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(10,13,18,0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = colorHex; ctx.lineWidth = 1.5;
  ctx.strokeRect(0.75, 0.75, canvas.width - 1.5, canvas.height - 1.5);
  ctx.fillStyle = colorHex;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad, canvas.height / 2 + 1);

  var tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  var mat = new THREE.SpriteMaterial({ map: tex, depthTest: true, depthWrite: false, transparent: true });
  var sprite = new THREE.Sprite(mat);
  sprite.scale.set(canvas.width * 0.014, canvas.height * 0.014, 1);
  sprite.renderOrder = 999;
  sprite.raycast = function () {};
  sprite.userData.isLabel = true;
  sprite.userData.labelText = text;
  sprite.userData.colorHex = colorHex;
  labelSprites.push(sprite);
  return sprite;
}

function addLabel(text, x, y, z, layerKey, colorHex, opts) {
  opts = opts || {};
  var sprite = makeLabel(text, colorHex);
  sprite.position.set(x, y, z);
  sprite.userData.layer = layerKey;
  sprite.userData.explodeLayer = opts.explodeLayer || layerKey;
  sprite.userData.explodeIdx = LAYER_ORDER.indexOf(sprite.userData.explodeLayer);
  if (sprite.userData.explodeIdx < 0) sprite.userData.explodeIdx = 0;
  sprite.userData.restPos = sprite.position.clone();
  cellGroup.add(sprite);
  return sprite;
}

function refreshAllLabelSprites() {
  for (var i = 0; i < labelSprites.length; i++) {
    var sprite = labelSprites[i];
    if (!sprite || !sprite.userData || !sprite.userData.isLabel) continue;
    var built = renderLabelCanvasTexture(sprite.userData.labelText, sprite.userData.colorHex);
    if (sprite.material.map) sprite.material.map.dispose();
    sprite.material.map = built.tex;
    sprite.material.needsUpdate = true;
    sprite.scale.set(built.width * 0.014, built.height * 0.014, 1);
  }
}

function updateMaterialsTheme() {
  for (var i = 0; i < allMeshes.length; i++) {
    var m = allMeshes[i];
    var colorVar = m.userData.colorVar;
    if (!colorVar || !m.material) continue;

    var nextColor = new THREE.Color(cssVar(colorVar));
    if (m.material.color) {
      m.material.color.copy(nextColor);
    }
    m.userData.baseColor = nextColor.getHex();

    if (m.userData.gaussParams) {
      var gp = m.userData.gaussParams;
      m.material.map = gaussianDepthTexture(colorVar, gp.peakV, gp.sigmaV, {
        isoLines: gp.isoLines
      });
      m.material.needsUpdate = true;
    }

    if (m.userData.coreMesh && m.userData.coreMesh.material && m.userData.coreMesh.material.color) {
      m.userData.coreMesh.material.color.copy(nextColor);
    }

    if (m.children && m.children.length) {
      for (var c = 0; c < m.children.length; c++) {
        var child = m.children[c];
        if (child.isLineLoop && child.userData && child.userData.isAutoOutline && child.material && child.material.color) {
          if (child.userData.isDepthRing) {
            child.material.color.copy(nextColor.clone().offsetHSL(0, 0.1, 0.2));
          } else {
            child.material.color.copy(nextColor);
          }
        }
      }
    }
  }

  refreshAllLabelSprites();

  if (typeof selectedMeshes !== 'undefined' && selectedMeshes.length && typeof setMeshHighlight === 'function') {
    for (var s = 0; s < selectedMeshes.length; s++) {
      setMeshHighlight(selectedMeshes[s], true);
    }
  }
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(function () {
    refreshAllLabelSprites();
  });
}

/* ============================================================
   BUILD FULL CMOS 2-INPUT NAND (NAND2) CELL
   ============================================================ */

function buildNand2Cell() {
  var PMOS_ZC = 4.85;
  var NMOS_ZC = -4.85;
  var ACTIVE_W = 6.0;
  var TAP_X = -9.0;
  var LEFT_X = -5.5;
  var GATE_A_X = -3.0;
  var MID_X = 0.0;
  var GATE_B_X = 3.0;
  var RIGHT_X = 5.5;
  var RAIL_Z = 9.45;
  var METAL_W = 0.45;
  var metalH = Y.metalTop - Y.metalBot;
  var metalMidY = (Y.metalBot + Y.metalTop) / 2;

  /* 1. P-Substrate (Sharp BoxGeometry, NO outline edges) */
  var subGeo = new THREE.BoxGeometry(24, Y.subTop - Y.subBot, 25, 1, 1, 1);
  var subMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cssVar('--c-substrate')),
    roughness: 0.85,
    metalness: 0.05,
    emissive: 0x000000,
    emissiveIntensity: 0,
    opacity: 1.0,
    transparent: false,
    side: THREE.FrontSide,
    depthWrite: true,
    clippingPlanes: activeClipPlanes
  });
  var psub = new THREE.Mesh(subGeo, subMat);
  psub.position.set(-0.5, (Y.subBot + Y.subTop) / 2, 0);
  psub.receiveShadow = true;
  psub.castShadow = true;
  psub.renderOrder = 1;
  psub.userData.colorVar = '--c-substrate';
  registerMesh(psub, 'psub', 'substrate');

  /* 2. Twin Wells (Gaussian Doping Tubs with 4 soft LineLoop contours + coreMesh) */
  var wellW = 18.70;
  var wellH = Y.wellTop - Y.wellBot;
  var wellMidY = (Y.wellBot + Y.wellTop) / 2;
  var wellD = 7.80;
  var wellX = -1.15;

  var nwell = gaussianDopingMesh(wellW, wellH, wellD, '--c-well', {
    peakV: 0.35,
    sigmaV: 0.28,
    straggle: 0.08,
    cornerR: 0.35,
    opacity: 0.85,
    renderOrder: 2
  });
  nwell.position.set(wellX, wellMidY, PMOS_ZC);
  registerMesh(nwell, 'nwell', 'well');

  var pwell = gaussianDopingMesh(wellW, wellH, wellD, '--c-substrate', {
    peakV: 0.35,
    sigmaV: 0.28,
    straggle: 0.08,
    cornerR: 0.35,
    opacity: 0.80,
    outlineColor: '#5a7799',
    renderOrder: 2
  });
  pwell.position.set(wellX, wellMidY, NMOS_ZC);
  registerMesh(pwell, 'pwell', 'well');

  /* 3. Body Taps & Active Diffusions (Gaussian Doping Tubs) */
  var actH = Y.actTop - Y.actBot;
  var actMidY = (Y.actBot + Y.actTop) / 2;

  var welltapAct = gaussianDopingMesh(1.3, actH, 1.3, '--c-well', {
    peakV: 0.18,
    sigmaV: 0.24,
    straggle: 0.20,
    cornerR: 0.3,
    opacity: 0.88,
    outlineColor: '#8fe6c8',
    renderOrder: 3
  });
  welltapAct.position.set(TAP_X, actMidY, PMOS_ZC);
  registerMesh(welltapAct, 'welltapAct', 'active');

  var subtapAct = gaussianDopingMesh(1.3, actH, 1.3, '--c-substrate', {
    peakV: 0.18,
    sigmaV: 0.24,
    straggle: 0.20,
    cornerR: 0.3,
    opacity: 0.88,
    outlineColor: '#aab4c2',
    renderOrder: 3
  });
  subtapAct.position.set(TAP_X, actMidY, NMOS_ZC);
  registerMesh(subtapAct, 'subtapAct', 'active');

  /* P+ Active Diffusions: MP1 Source, Shared P+ Drain, MP2 Source */
  var pActOpts = {
    peakV: 0.15,
    sigmaV: 0.22,
    straggle: 0.16,
    cornerR: 0.5,
    opacity: 0.88,
    outlineColor: '#f0b877',
    renderOrder: 3
  };

  var pmosASrc = gaussianDopingMesh(3.0, actH, ACTIVE_W, '--c-active-p', pActOpts);
  pmosASrc.position.set(LEFT_X, actMidY, PMOS_ZC);
  registerMesh(pmosASrc, 'pmosASrc', 'active');

  var pmosSharedDrn = gaussianDopingMesh(4.0, actH, ACTIVE_W, '--c-active-p', pActOpts);
  pmosSharedDrn.position.set(MID_X, actMidY, PMOS_ZC);
  registerMesh(pmosSharedDrn, 'pmosSharedDrn', 'active');

  var pmosBSrc = gaussianDopingMesh(3.0, actH, ACTIVE_W, '--c-active-p', pActOpts);
  pmosBSrc.position.set(RIGHT_X, actMidY, PMOS_ZC);
  registerMesh(pmosBSrc, 'pmosBSrc', 'active');

  /* N+ Active Diffusions: MN1 Source, Series N+ Bridge, MN2 Drain */
  var nActOpts = {
    peakV: 0.15,
    sigmaV: 0.22,
    straggle: 0.16,
    cornerR: 0.5,
    opacity: 0.88,
    outlineColor: '#7fc3ec',
    renderOrder: 3
  };

  var nmosASrc = gaussianDopingMesh(3.0, actH, ACTIVE_W, '--c-active-n', nActOpts);
  nmosASrc.position.set(LEFT_X, actMidY, NMOS_ZC);
  registerMesh(nmosASrc, 'nmosASrc', 'active');

  var nmosMidNode = gaussianDopingMesh(4.0, actH, ACTIVE_W, '--c-active-n', nActOpts);
  nmosMidNode.position.set(MID_X, actMidY, NMOS_ZC);
  registerMesh(nmosMidNode, 'nmosMidNode', 'active');

  var nmosBDrn = gaussianDopingMesh(3.0, actH, ACTIVE_W, '--c-active-n', nActOpts);
  nmosBDrn.position.set(RIGHT_X, actMidY, NMOS_ZC);
  registerMesh(nmosBDrn, 'nmosBDrn', 'active');

  /* 4. P-SDE & N-SDE / LDD Extensions (flush at Y.actTop, explodeLayer = 'active') */
  var sdeW = 0.55;
  var sdeH = actH * 0.65;
  var sdeMidY = Y.actTop - sdeH / 2;

  var pSdeOpts = {
    peakV: 0.10,
    sigmaV: 0.28,
    straggle: 0.12,
    cornerR: 0.25,
    opacity: 0.72,
    outlineColor: '#fcd34d',
    renderOrder: 4
  };
  var nSdeOpts = {
    peakV: 0.10,
    sigmaV: 0.28,
    straggle: 0.12,
    cornerR: 0.25,
    opacity: 0.72,
    outlineColor: '#bae6fd',
    renderOrder: 4
  };

  var sdeSpecs = [
    { id: 'pmosASrcSde', x: -3.925, z: PMOS_ZC, colorVar: '--c-sde-p', opts: pSdeOpts },
    { id: 'pmosADrnSde', x: -2.075, z: PMOS_ZC, colorVar: '--c-sde-p', opts: pSdeOpts },
    { id: 'pmosBDrnSde', x: 2.075,  z: PMOS_ZC, colorVar: '--c-sde-p', opts: pSdeOpts },
    { id: 'pmosBSrcSde', x: 3.925,  z: PMOS_ZC, colorVar: '--c-sde-p', opts: pSdeOpts },
    { id: 'nmosASrcSde', x: -3.925, z: NMOS_ZC, colorVar: '--c-sde-n', opts: nSdeOpts },
    { id: 'nmosADrnSde', x: -2.075, z: NMOS_ZC, colorVar: '--c-sde-n', opts: nSdeOpts },
    { id: 'nmosBSrcSde', x: 2.075,  z: NMOS_ZC, colorVar: '--c-sde-n', opts: nSdeOpts },
    { id: 'nmosBDrnSde', x: 3.925,  z: NMOS_ZC, colorVar: '--c-sde-n', opts: nSdeOpts }
  ];

  for (var si = 0; si < sdeSpecs.length; si++) {
    var sp = sdeSpecs[si];
    var sdeMesh = gaussianDopingMesh(sdeW, sdeH, ACTIVE_W - 0.1, sp.colorVar, sp.opts);
    sdeMesh.position.set(sp.x, sdeMidY, sp.z);
    registerMesh(sdeMesh, sp.id, 'sde', { explodeLayer: 'active' });
  }

  /* Gate Channel Segs directly under Gate A & Gate B (Sharp BoxGeometry, no outline) */
  var chSpecs = [
    { id: 'chMP1', x: GATE_A_X, z: PMOS_ZC, colorVar: '--c-active-p' },
    { id: 'chMP2', x: GATE_B_X, z: PMOS_ZC, colorVar: '--c-active-p' },
    { id: 'chMN1', x: GATE_A_X, z: NMOS_ZC, colorVar: '--c-active-n' },
    { id: 'chMN2', x: GATE_B_X, z: NMOS_ZC, colorVar: '--c-active-n' }
  ];
  for (var chi = 0; chi < chSpecs.length; chi++) {
    var ch = chSpecs[chi];
    var chGeo = new THREE.BoxGeometry(2.0, 0.12, ACTIVE_W - 0.14);
    var chMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cssVar(ch.colorVar)),
      roughness: 0.50,
      metalness: 0.15,
      emissive: 0x000000,
      emissiveIntensity: 0,
      opacity: 0.28,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
      clippingPlanes: activeClipPlanes
    });
    var chMesh = new THREE.Mesh(chGeo, chMat);
    chMesh.position.set(ch.x, Y.actTop - 0.06, ch.z);
    chMesh.renderOrder = 3;
    chMesh.userData.colorVar = ch.colorVar;
    registerMesh(chMesh, ch.id, 'active', { decorative: true });
  }

  /* 5. Gate Oxide (SiO2) & High-K (HfO2) (Sharp BoxGeometry, no outline) */
  var oxH = Y.oxideTop - Y.oxideBot;
  var oxMidY = (Y.oxideBot + Y.oxideTop) / 2;
  var hkH = Y.highkTop - Y.highkBot;
  var hkMidY = (Y.highkBot + Y.highkTop) / 2;

  var gateSiteSpecs = [
    { oxId: 'pmosAOxide', hkId: 'pmosAHighk', x: GATE_A_X, z: PMOS_ZC },
    { oxId: 'pmosBOxide', hkId: 'pmosBHighk', x: GATE_B_X, z: PMOS_ZC },
    { oxId: 'nmosAOxide', hkId: 'nmosAHighk', x: GATE_A_X, z: NMOS_ZC },
    { oxId: 'nmosBOxide', hkId: 'nmosBHighk', x: GATE_B_X, z: NMOS_ZC }
  ];

  for (var gi = 0; gi < gateSiteSpecs.length; gi++) {
    var gs = gateSiteSpecs[gi];
    var oxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, oxH, ACTIVE_W),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(cssVar('--c-oxide')),
        roughness: 0.15,
        metalness: 0.00,
        emissive: 0x000000,
        emissiveIntensity: 0,
        opacity: 0.85,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: true,
        clippingPlanes: activeClipPlanes
      })
    );
    oxMesh.position.set(gs.x, oxMidY, gs.z);
    oxMesh.castShadow = true;
    oxMesh.receiveShadow = true;
    oxMesh.userData.colorVar = '--c-oxide';
    registerMesh(oxMesh, gs.oxId, 'oxide');

    var hkMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, hkH, ACTIVE_W),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(cssVar('--c-highk')),
        roughness: 0.12,
        metalness: 0.10,
        emissive: 0x000000,
        emissiveIntensity: 0,
        opacity: 0.78,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: true,
        clippingPlanes: activeClipPlanes
      })
    );
    hkMesh.position.set(gs.x, hkMidY, gs.z);
    hkMesh.castShadow = true;
    hkMesh.receiveShadow = true;
    hkMesh.userData.colorVar = '--c-highk';
    registerMesh(hkMesh, gs.hkId, 'highk');
  }

  /* 6. Dual Continuous Vertical Polysilicon Gates (A & B) (Sharp BoxGeometry, no outline) */
  var polyH = Y.polyTop - Y.polyBot;
  var polyMidY = (Y.polyBot + Y.polyTop) / 2;
  var polyD = 15.70; /* Z in [-7.85, +7.85] */

  var polySpecs = [
    { id: 'polyA', x: GATE_A_X },
    { id: 'polyB', x: GATE_B_X }
  ];
  for (var pi = 0; pi < polySpecs.length; pi++) {
    var ps = polySpecs[pi];
    var polyGeo = new THREE.BoxGeometry(2.0, polyH, polyD);
    var polyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cssVar('--c-poly')),
      roughness: 0.45,
      metalness: 0.20,
      emissive: 0x000000,
      emissiveIntensity: 0,
      opacity: 1.0,
      transparent: false,
      side: THREE.FrontSide,
      depthWrite: true,
      clippingPlanes: activeClipPlanes
    });
    var polyMesh = new THREE.Mesh(polyGeo, polyMat);
    polyMesh.position.set(ps.x, polyMidY, 0);
    polyMesh.castShadow = true;
    polyMesh.receiveShadow = true;
    polyMesh.userData.colorVar = '--c-poly';
    registerMesh(polyMesh, ps.id, 'poly');
  }

  /* 7. 9 Tapered Tungsten Contacts */
  contactAt('welltapCt', TAP_X, PMOS_ZC, Y.actTop);
  contactAt('pmosASrcCt', LEFT_X, PMOS_ZC, Y.actTop);
  contactAt('pmosSharedDrnCt', MID_X, PMOS_ZC, Y.actTop);
  contactAt('pmosBSrcCt', RIGHT_X, PMOS_ZC, Y.actTop);
  contactAt('subtapCt', TAP_X, NMOS_ZC, Y.actTop);
  contactAt('nmosASrcCt', LEFT_X, NMOS_ZC, Y.actTop);
  contactAt('nmosBDrnCt', RIGHT_X, NMOS_ZC, Y.actTop);
  contactAt('polyACt', GATE_A_X, 0.8, Y.polyTop);
  contactAt('polyBCt', GATE_B_X, -0.8, Y.polyTop);

  /* 8. Planar Zero-Crossing Metal-1 Interconnects */
  function addMetalTrace(id, x, z, w, d, colorVar) {
    var geo = createFilletedTraceGeometry(w, metalH, d, 0.15, 0.02);
    var m = new THREE.Mesh(geo, makeMetalMaterial(colorVar));
    m.position.set(x, metalMidY, z);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.colorVar = colorVar;
    return registerMesh(m, id, 'metal');
  }

  function addViaPad(id, x, z, colorVar) {
    var geo = createOctagonalViaPadGeometry(0.75, metalH + 0.002, 0.15, 0.02);
    var mat = makeMetalMaterial(colorVar);
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, metalMidY, z);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.colorVar = colorVar;
    return registerMesh(m, id, 'metal');
  }

  function addTJunction(id, branchDir, x, z, colorVar) {
    var geo = createChamferedTJunctionGeometry(branchDir, METAL_W, METAL_W, 0.15, metalH + 0.002, 0.02);
    var mat = makeMetalMaterial(colorVar);
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, metalMidY, z);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.colorVar = colorVar;
    return registerMesh(m, id, 'metal');
  }

  /* VDD Rail & 3 Stubs */
  addMetalTrace('vddRail', -0.5, RAIL_Z, 22.0, METAL_W, '--c-vdd');
  addMetalTrace('vddStubTap', TAP_X, (PMOS_ZC + RAIL_Z) / 2, METAL_W, RAIL_Z - PMOS_ZC, '--c-vdd');
  addMetalTrace('vddStubPmosA', LEFT_X, (PMOS_ZC + RAIL_Z) / 2, METAL_W, RAIL_Z - PMOS_ZC, '--c-vdd');
  addMetalTrace('vddStubPmosB', RIGHT_X, (PMOS_ZC + RAIL_Z) / 2, METAL_W, RAIL_Z - PMOS_ZC, '--c-vdd');
  addTJunction('vddRail', '-z', TAP_X, RAIL_Z, '--c-vdd');
  addTJunction('vddRail', '-z', LEFT_X, RAIL_Z, '--c-vdd');
  addTJunction('vddRail', '-z', RIGHT_X, RAIL_Z, '--c-vdd');
  addViaPad('vddStubTap', TAP_X, PMOS_ZC, '--c-vdd');
  addViaPad('vddStubPmosA', LEFT_X, PMOS_ZC, '--c-vdd');
  addViaPad('vddStubPmosB', RIGHT_X, PMOS_ZC, '--c-vdd');

  /* GND Rail & 2 Stubs */
  addMetalTrace('gndRail', -0.5, -RAIL_Z, 22.0, METAL_W, '--c-gnd');
  addMetalTrace('gndStubTap', TAP_X, (NMOS_ZC - RAIL_Z) / 2, METAL_W, RAIL_Z + NMOS_ZC, '--c-gnd');
  addMetalTrace('gndStubNmosA', LEFT_X, (NMOS_ZC - RAIL_Z) / 2, METAL_W, RAIL_Z + NMOS_ZC, '--c-gnd');
  addTJunction('gndRail', '+z', TAP_X, -RAIL_Z, '--c-gnd');
  addTJunction('gndRail', '+z', LEFT_X, -RAIL_Z, '--c-gnd');
  addViaPad('gndStubTap', TAP_X, NMOS_ZC, '--c-gnd');
  addViaPad('gndStubNmosA', LEFT_X, NMOS_ZC, '--c-gnd');

  /* Input A & Input B */
  addMetalTrace('inAPin', -7.25, 0.8, 8.5, METAL_W, '--c-in');
  addViaPad('inAPin', GATE_A_X, 0.8, '--c-in');

  addMetalTrace('inBPin', -4.25, -0.8, 14.5, METAL_W, '--c-in');
  addViaPad('inBPin', GATE_B_X, -0.8, '--c-in');

  /* Output Net (OUT) */
  addMetalTrace('outPmosBranch', MID_X, 2.7125, METAL_W, 4.275, '--c-out');
  addViaPad('outPmosBranch', MID_X, PMOS_ZC, '--c-out');

  addMetalTrace('outSpine', 2.6375, 0.8, 5.725, METAL_W, '--c-out');

  addMetalTrace('outNmosBranch', RIGHT_X, -2.025, METAL_W, 5.65, '--c-out');
  addViaPad('outNmosBranch', RIGHT_X, NMOS_ZC, '--c-out');
  addTJunction('outNmosBranch', '-z', RIGHT_X, 0.8, '--c-out');

  addMetalTrace('outPin', 8.0, 0.8, 5.0, METAL_W, '--c-out');

  /* 9. 3D Floating Depth-Tested Labels */
  addLabel('VDD', -10.5, Y.metalTop + 0.45, RAIL_Z + 0.85, 'metal', '#e35d5d');
  addLabel('GND', -10.5, Y.metalTop + 0.45, -RAIL_Z - 0.85, 'metal', '#9aa6b6');
  addLabel('IN A', -10.5, Y.metalTop + 0.45, 1.55, 'metal', '#e6c94a');
  addLabel('IN B', -10.5, Y.metalTop + 0.45, -1.55, 'metal', '#e6c94a');
  addLabel('OUT', 9.6, Y.metalTop + 0.45, 1.55, 'metal', '#57cf8f');

  addLabel('N-WELL', 7.4, Y.wellTop + 0.35, 8.3, 'well', '#3f8f6f');
  addLabel('P-WELL', 7.4, Y.wellTop + 0.35, -8.3, 'well', '#4a92c9');
  addLabel('P-SUBSTRATE', 8.8, Y.subTop + 0.25, -11.3, 'substrate', '#9aa6b6');

  addLabel('POLY A', GATE_A_X, Y.polyTop + 0.35, -8.55, 'poly', '#d8503c');
  addLabel('POLY B', GATE_B_X, Y.polyTop + 0.35, -8.55, 'poly', '#d8503c');

  addLabel('PMOS A (MP1)', LEFT_X, Y.actTop + 0.45, 3.25, 'active', '#cf8a4a');
  addLabel('PMOS B (MP2)', RIGHT_X, Y.actTop + 0.45, 3.25, 'active', '#cf8a4a');
  addLabel('SHARED P+ DRAIN', MID_X, Y.actTop + 0.45, 6.65, 'active', '#cf8a4a');
  addLabel('NMOS A (MN1)', LEFT_X, Y.actTop + 0.45, -3.25, 'active', '#4a92c9');
  addLabel('NMOS B (MN2)', RIGHT_X, Y.actTop + 0.45, -3.25, 'active', '#4a92c9');
  addLabel('SERIES N+ BRIDGE', MID_X, Y.actTop + 0.45, -4.85, 'active', '#4a92c9');

  addLabel('P-SDE', -3.925, Y.actTop + 0.32, 2.25, 'sde', '#f0b47a', { explodeLayer: 'active' });
  addLabel('N-SDE', -3.925, Y.actTop + 0.32, -2.25, 'sde', '#8fd0f8', { explodeLayer: 'active' });
  addLabel('HIGH-K (HfO2)', GATE_B_X, Y.highkTop + 0.35, 3.3, 'highk', '#c084fc');
  addLabel('SiO2 OXIDE', GATE_A_X, Y.oxideTop + 0.32, 3.3, 'oxide', '#8fc9dc');
}

buildNand2Cell();
