/* 8-Step sequential 3D Fabrication Tour with smoothstep camera lerp, 700ms drop-in & audio prefetch lockstep */

var isTourRunning = false;
var tourAbortController = null;
var tourRunToken = 0;

var TOUR_STEPS = [
  {
    layer: 'substrate',
    layers: ['substrate'],
    title: '1. P-Type Silicon Substrate Wafer',
    cameraPos: { x: 26, y: 18, z: 28 },
    target: { x: -0.5, y: 1.0, z: 0 },
    scripts: {
      'en-IN': 'Step one starts with the lightly doped p-type silicon substrate wafer. It forms the mechanical base and ground-referenced bulk isolating our two-input NAND cell.',
      'hi-IN': 'पहले चरण में हम पी-टाइप सिलिकॉन सब्सट्रेट वेफर से शुरुआत करते हैं। यह पूरे टू-इनपुट नैंड गेट का आधार और ग्राउंड रेफरेंस प्रदान करता है।',
      'te-IN': 'మొదటి దశలో పి-టైప్ సిలికాన్ సబ్‌స్ట్రేట్ వేఫర్ ఉంటుంది. ఇది టూ-ఇన్‌పుట్ నాండ్ గేట్‌కు ఆధారాన్ని మరియు గ్రౌండ్ రిఫరెన్స్‌ను ఇస్తుంది.'
    }
  },
  {
    layer: 'well',
    layers: ['well'],
    title: '2. Retrograde N-Well & P-Well Implantation',
    cameraPos: { x: 22, y: 15, z: 24 },
    target: { x: -0.5, y: 1.6, z: 0 },
    scripts: {
      'en-IN': 'Next, twin retrograde Gaussian wells are implanted: the N-Well on the positive Z side houses parallel pull-up PMOS devices, while the P-Well on negative Z houses series pull-down NMOS devices across a clean substrate corridor.',
      'hi-IN': 'दूसरे चरण में एन-वेल और पी-वेल इम्प्लांट किए जाते हैं। एन-वेल में पैरेलल पुल-अप पीमॉस ट्रांजिस्टर और पी-वेल में सीरीज पुल-डाउन एनमॉस ट्रांजिस्टर बनते हैं।',
      'te-IN': 'రెండవ దశలో ఎన్-వెల్ మరియు పి-వెల్ ఇంప్లాంట్ చేయబడతాయి. ఎన్-వెల్‌లో ప్యారలల్ పిమాస్ మరియు పి-వెల్‌లో సిరీస్ ఎన్మాస్ ట్రాన్సిస్టర్లు ఏర్పడతాయి.'
    }
  },
  {
    layer: 'active',
    layers: ['active', 'sde'],
    title: '3. Active Diffusions, SDEs & Series N+ Bridge',
    cameraPos: { x: 16, y: 13, z: 22 },
    target: { x: 0.0, y: 1.8, z: 0 },
    scripts: {
      'en-IN': 'Heavy P-plus and N-plus active diffusions plus shallow SDE extensions are implanted. Notice the merged P-plus drain shared by both parallel PMOS devices, and the uncontacted series N-plus silicon bridge linking MN1 and MN2.',
      'hi-IN': 'तीसरे चरण में पी-प्लस और एन-प्लस एक्टिव डिफ्यूजन तथा शैलो एसडीई एक्सटेंशन बनते हैं। बीच का पी-प्लस ड्रेन दोनों पीमॉस में साझा है, जबकि एनमॉस में एक अनकॉन्टैक्टेड सीरीज एन-प्लस ब्रिज है।',
      'te-IN': 'మూడవ దశలో పి-ప్లస్, ఎన్-ప్లస్ డిఫ్యూషన్లు మరియు ఎస్‌డిఈ ఎక్స్‌టెన్షన్లు వేయబడతాయి. మధ్యలో ఉన్న పి-ప్లస్ డ్రెయిన్ రెండు పిమాస్‌లకు ఉమ్మడిగా ఉంటుంది, మరియు ఎన్మాస్‌లలో సిరీస్ ఎన్-ప్లస్ బ్రిడ్జ్ ఉంటుంది.'
    }
  },
  {
    layer: 'oxide',
    layers: ['oxide'],
    title: '4. Interfacial Thermal Gate Oxide (SiO2)',
    cameraPos: { x: 12, y: 10, z: 16 },
    target: { x: 0.0, y: 2.0, z: 0 },
    scripts: {
      'en-IN': 'An ultra-thin interfacial thermal silicon dioxide layer grows across the four transistor channel windows beneath gates A and B, guaranteeing clean carrier mobility.',
      'hi-IN': 'चौथे चरण में गेट ए और गेट बी के नीचे चारों चैनल विंडो पर अत्यंत पतली थर्मल सिलिकॉन डाइऑक्साइड ऑक्साइड परत उगाई जाती है।',
      'te-IN': 'నాల్గవ దశలో గేట్ ఎ మరియు గేట్ బి కింద నాలుగు ఛానెల్ స్థానాలలో అతి పలుచని సిలికాన్ డయాక్సైడ్ ఆక్సైడ్ పొర ఏర్పడుతుంది.'
    }
  },
  {
    layer: 'highk',
    layers: ['highk'],
    title: '5. Atomic Layer Deposited High-K (HfO2)',
    cameraPos: { x: 12, y: 10, z: 16 },
    target: { x: 0.0, y: 2.1, z: 0 },
    scripts: {
      'en-IN': 'Atop the oxide sits Atomic Layer Deposited Hafnium Dioxide, a High-K dielectric that boosts gate capacitance while suppressing quantum tunneling gate leakage.',
      'hi-IN': 'पांचवें चरण में ऑक्साइड के ऊपर एएलडी द्वारा हैफनियम डाइऑक्साइड हाई-के डाइइलेक्ट्रिक जमा किया जाता है, जो गेट लीकेज को रोकता है।',
      'te-IN': 'ఐదవ దశలో ఆక్సైడ్ పైన హాఫ్నియం డయాక్సైడ్ హై-కె డైఎలెక్ట్రిక్ పొర వేయబడుతుంది, ఇది గేట్ లీకేజీని గణనీయంగా తగ్గిస్తుంది.'
    }
  },
  {
    layer: 'poly',
    layers: ['poly'],
    title: '6. Dual Continuous Polysilicon Gates (A & B)',
    cameraPos: { x: 17, y: 14, z: 19 },
    target: { x: 0.0, y: 2.3, z: 0 },
    scripts: {
      'en-IN': 'Following an Euler-path layout, two continuous vertical polysilicon stripes form Gate A and Gate B, each simultaneously driving one PMOS pull-up and one NMOS pull-down transistor.',
      'hi-IN': 'छठे चरण में यूलर-पाथ टोपोलॉजी के अनुसार दो सीधी वर्टिकल पॉलीसिलिकॉन गेट ए और गेट बी पट्टियां बनती हैं, जो एक साथ पीमॉस और एनमॉस को नियंत्रित करती हैं।',
      'te-IN': 'ఆరవ దశలో యూలర్-పాత్ లేఅవుట్ ప్రకారం గేట్ ఎ మరియు గేట్ బి అనే రెండు పాలీసిలికాన్ గేట్లు పిమాస్ మరియు ఎన్మాస్‌లను ఒకేసారి నియంత్రిస్తాయి.'
    }
  },
  {
    layer: 'contact',
    layers: ['contact'],
    title: '7. Nine Tapered Tungsten Contact Plugs',
    cameraPos: { x: 18, y: 15, z: 18 },
    target: { x: 0.0, y: 2.6, z: 0 },
    scripts: {
      'en-IN': 'Nine tapered CVD tungsten plugs drop down to connect well taps, PMOS sources and shared drain, NMOS source and top drain, plus Gate A and Gate B safely inside the inter-well corridor.',
      'hi-IN': 'सातवें चरण में नौ टंगस्टन कॉन्टैक्ट प्लग वेल टैप, सोर्स, ड्रेन और दोनों गेट्स को ऊपर की मेटल परत से जोड़ने के लिए बनाए जाते हैं।',
      'te-IN': 'ఏడవ దశలో తొమ్మిది టంగ్‌స్టన్ కాంటాక్ట్ ప్లగ్స్ వెల్ ట్యాప్స్, సోర్స్, డ్రెయిన్ మరియు గేట్‌లను మెటల్ పొరకు కలుపుతాయి.'
    }
  },
  {
    layer: 'metal',
    layers: ['metal'],
    title: '8. Planar Zero-Crossing Metal-1 Interconnect',
    cameraPos: { x: -0.5, y: 34, z: 18 },
    target: { x: -0.5, y: 2.5, z: 0 },
    scripts: {
      'en-IN': 'Finally, brushed Metal-1 completes the VDD and GND rails, parallel Input A and Input B tracks, and the collector Output pin with 45-degree chamfered junctions and zero signal crossings.',
      'hi-IN': 'अंतिम चरण में ब्रश्ड मेटल-1 बिना किसी क्रॉसिंग के वीडीडी, ग्राउंड, इनपुट ए, इनपुट बी और आउटपुट पिन को जोड़कर नैंड2 सेल को पूरा करता है।',
      'te-IN': 'చివరి దశలో మెటల్-1 లేయర్ ఎటువంటి క్రాసింగ్‌లు లేకుండా వీడీడీ, గ్రౌండ్, ఇన్‌పుట్ ఎ, ఇన్‌పుట్ బి మరియు అవుట్‌పుట్ పిన్‌లను కలుపుతూ నాండ్2 సెల్‌ను పూర్తి చేస్తుంది.'
    }
  }
];

function getTourLanguageAndSpeaker() {
  var langEl = document.getElementById('va-lang');
  var spkEl = document.getElementById('va-persona');
  return {
    lang: (langEl && langEl.value) || 'en-IN',
    speaker: (spkEl && spkEl.value) || 'aparna_en_edtech'
  };
}

function getCurrentMeshTargetY(m) {
  var ey = (typeof explodeY !== 'undefined' ? explodeY : 1) / 100;
  return m.userData.restPos.y + m.userData.explodeIdx * EXPLODE_GAP * ey;
}

function animateStepDropAndCamera(step, token) {
  var targetLayers = step.layers || [step.layer];
  var stepMeshes = [];
  var stepLabels = [];

  for (var i = 0; i < allMeshes.length; i++) {
    var m = allMeshes[i];
    if (targetLayers.indexOf(m.userData.layer) !== -1) {
      m.visible = true;
      var finalY = getCurrentMeshTargetY(m);
      m.position.y = finalY + 2.5;
      stepMeshes.push({ obj: m, startY: finalY + 2.5, endY: finalY });
    }
  }

  for (var j = 0; j < labelsList.length; j++) {
    var lbl = labelsList[j];
    if (targetLayers.indexOf(lbl.userData.layer) !== -1 && (typeof showLabels3D === 'undefined' || showLabels3D)) {
      lbl.visible = true;
      var lFinalY = getCurrentMeshTargetY(lbl);
      lbl.position.y = lFinalY + 2.5;
      stepLabels.push({ obj: lbl, startY: lFinalY + 2.5, endY: lFinalY });
    }
  }

  var startCam = camera.position.clone();
  var endCam = new THREE.Vector3(step.cameraPos.x, step.cameraPos.y, step.cameraPos.z);
  var startTgt = controls.target.clone();
  var endTgt = new THREE.Vector3(step.target.x, step.target.y, step.target.z);

  var duration = 700;
  var t0 = performance.now();

  return new Promise(function (resolve) {
    function frame(now) {
      if (!isTourRunning || token !== tourRunToken) {
        resolve();
        return;
      }
      var raw = Math.min(1, (now - t0) / duration);
      var cubicOut = 1 - Math.pow(1 - raw, 3);
      var smooth = raw * raw * (3 - 2 * raw);

      for (var k = 0; k < stepMeshes.length; k++) {
        var sm = stepMeshes[k];
        sm.obj.position.y = sm.startY + (sm.endY - sm.startY) * cubicOut;
      }
      for (var l = 0; l < stepLabels.length; l++) {
        var sl = stepLabels[l];
        sl.obj.position.y = sl.startY + (sl.endY - sl.startY) * cubicOut;
      }

      camera.position.lerpVectors(startCam, endCam, smooth);
      controls.target.lerpVectors(startTgt, endTgt, smooth);

      if (raw < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

function prefetchStepPcm(step, lang, speaker, signal) {
  if (!step || typeof fetchSarvamTtsPcm !== 'function') {
    return Promise.resolve(null);
  }
  var text = (step.scripts && (step.scripts[lang] || step.scripts['en-IN'])) || step.title;
  return fetchSarvamTtsPcm(text, lang, speaker, signal, { silentError: true }).catch(function () {
    return null;
  });
}

function playStepAudioOrFallback(pcmPromise, scriptText, token, signal) {
  var fallbackMs = Math.max(2400, Math.min(4800, (scriptText ? scriptText.length : 80) * 28));

  function waitFallback() {
    return new Promise(function (resolve) {
      var timer = setTimeout(resolve, fallbackMs);
      if (signal) {
        signal.addEventListener('abort', function () {
          clearTimeout(timer);
          resolve();
        }, { once: true });
      }
    });
  }

  return pcmPromise.then(function (pcmBytes) {
    if (!isTourRunning || token !== tourRunToken) return;
    if (!pcmBytes || !pcmBytes.byteLength || typeof playBufferedPcm !== 'function') {
      return waitFallback();
    }
    return playBufferedPcm(pcmBytes, signal);
  }).catch(function () {
    if (!isTourRunning || token !== tourRunToken) return;
    return waitFallback();
  });
}

function updateTourBanner(stepIndex, step, lang) {
  var hud = document.getElementById('tour-hud');
  var pill = document.getElementById('tour-step-pill');
  var title = document.getElementById('tour-title');
  var scriptEl = document.getElementById('tour-script');
  var bar = document.getElementById('tour-progress-bar');

  if (hud) hud.classList.remove('hidden');
  if (pill) pill.textContent = 'STEP ' + (stepIndex + 1) + ' / ' + TOUR_STEPS.length;
  if (title) title.textContent = step.title;
  if (scriptEl) {
    scriptEl.textContent = (step.scripts && (step.scripts[lang] || step.scripts['en-IN'])) || '';
  }
  if (bar) {
    bar.style.width = (((stepIndex + 1) / TOUR_STEPS.length) * 100).toFixed(1) + '%';
  }
}

function stopTour() {
  if (!isTourRunning) return;
  isTourRunning = false;
  tourRunToken++;

  if (tourAbortController) {
    try { tourAbortController.abort(); } catch (_) {}
    tourAbortController = null;
  }
  if (typeof stopVoiceAudio === 'function') {
    stopVoiceAudio();
  }

  document.body.classList.remove('tour-running');
  var tourHud = document.getElementById('tour-hud');
  if (tourHud) tourHud.classList.add('hidden');

  var btnInner = document.querySelector('#btn-build-anim .tour-btn-inner');
  if (btnInner) btnInner.textContent = '▶ PLAY TOUR';

  if (typeof syncVisibilityCheckboxes === 'function') {
    syncVisibilityCheckboxes();
  }
  if (typeof applyExplode === 'function') {
    applyExplode();
  }
  if (typeof applyLogicTint === 'function') {
    applyLogicTint();
  }
}

async function startTour() {
  if (isTourRunning) {
    stopTour();
    return;
  }

  if (typeof setViewMode === 'function') setViewMode('layout');
  if (typeof clearSelection === 'function') clearSelection();
  if (typeof hideAllFlowMarkers === 'function') hideAllFlowMarkers();
  if (typeof clearGuideLines === 'function') clearGuideLines();

  isTourRunning = true;
  var token = ++tourRunToken;
  tourAbortController = new AbortController();
  var signal = tourAbortController.signal;

  document.body.classList.add('tour-running');
  var btnInner = document.querySelector('#btn-build-anim .tour-btn-inner');
  if (btnInner) btnInner.textContent = '⏹ STOP TOUR';

  /* Hide all meshes & labels initially */
  for (var i = 0; i < allMeshes.length; i++) {
    allMeshes[i].visible = false;
  }
  for (var j = 0; j < labelsList.length; j++) {
    labelsList[j].visible = false;
  }

  var pref = getTourLanguageAndSpeaker();
  var nextAudioPromise = prefetchStepPcm(TOUR_STEPS[0], pref.lang, pref.speaker, signal);

  for (var sIdx = 0; sIdx < TOUR_STEPS.length; sIdx++) {
    if (!isTourRunning || token !== tourRunToken) break;

    var step = TOUR_STEPS[sIdx];
    var currentAudioPromise = nextAudioPromise;

    /* Prefetch step i+1 in background while step i plays */
    if (sIdx + 1 < TOUR_STEPS.length) {
      nextAudioPromise = prefetchStepPcm(TOUR_STEPS[sIdx + 1], pref.lang, pref.speaker, signal);
    } else {
      nextAudioPromise = Promise.resolve(null);
    }

    updateTourBanner(sIdx, step, pref.lang);
    var scriptText = (step.scripts && (step.scripts[pref.lang] || step.scripts['en-IN'])) || step.title;

    var dropPromise = animateStepDropAndCamera(step, token);
    var audioPromise = playStepAudioOrFallback(currentAudioPromise, scriptText, token, signal);

    await Promise.all([dropPromise, audioPromise]);
  }

  if (token === tourRunToken && isTourRunning) {
    stopTour();
  }
}

function initTourControls() {
  var btn = document.getElementById('btn-build-anim');
  var stopBtn = document.getElementById('tour-stop-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      startTour();
    });
  }
  if (stopBtn) {
    stopBtn.addEventListener('click', function () {
      stopTour();
    });
  }
}

initTourControls();
