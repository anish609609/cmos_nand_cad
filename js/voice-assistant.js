/* Sarvam AI Voice Tutor: sarvam-105b-conversations + bulbul:v4-flash progressive 24kHz PCM streaming & Web Speech STT */

var SARVAM_KEY_STORAGE = 'cmos_nand_sarvam_key';
var SARVAM_SESSION_FLAG = 'cmos_nand_sarvam_session_only';
var DIRECT_CHAT_URL = 'https://api.sarvam.ai/v1/chat/completions';
var DIRECT_TTS_URL = 'https://api.sarvam.ai/text-to-speech/stream';

var vaAudioCtx = null;
var vaAnalyser = null;
var vaActiveSources = [];
var vaWaveformRaf = null;
var vaRequestAbort = null;
var vaChatHistory = [];
var vaHasServerKey = false;
var vaRecognition = null;
var vaIsListening = false;
var vaSpeechSilenceTimer = null;

var QUICK_PROMPT_MAP = {
  'Explain Selected': function () {
    if (typeof selectedId !== 'undefined' && selectedId && INFO[selectedId]) {
      return 'Explain the ' + INFO[selectedId].title + ' in this CMOS 2-input NAND gate, including its fabrication layer and electrical role.';
    }
    return 'Give a concise overview of this CMOS 2-input NAND standard cell layout and how its pull-up and pull-down networks connect.';
  },
  'Why parallel PMOS?': function () {
    return 'Why are the two PMOS transistors MP1 and MP2 wired in parallel in the N-Well for a CMOS 2-input NAND gate?';
  },
  'Why series NMOS?': function () {
    return 'Why are the two NMOS transistors MN1 and MN2 wired in series in the P-Well, and how does the uncontacted series N+ bridge work?';
  },
  'How NAND2 switches': function () {
    return 'Walk through how the CMOS NAND2 output switches between VDD and GND across all four input combinations of A and B.';
  },
  'SDE / LDD role': function () {
    return 'What is the physical role of the shallow SDE / LDD extensions flanking Gate A and Gate B in this layout?';
  }
};

function getSarvamApiKey() {
  try {
    return (localStorage.getItem(SARVAM_KEY_STORAGE) || '').trim();
  } catch (_) {
    return '';
  }
}

function isSessionOnlyKey() {
  try {
    return localStorage.getItem(SARVAM_SESSION_FLAG) === '1';
  } catch (_) {
    return false;
  }
}

function saveSarvamApiKey(key, sessionOnly) {
  try {
    if (key) {
      localStorage.setItem(SARVAM_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(SARVAM_KEY_STORAGE);
    }
    localStorage.setItem(SARVAM_SESSION_FLAG, sessionOnly ? '1' : '0');
  } catch (_) {}
}

window.addEventListener('beforeunload', function () {
  if (isSessionOnlyKey()) {
    try {
      localStorage.removeItem(SARVAM_KEY_STORAGE);
    } catch (_) {}
  }
});

function ensureAudioContext() {
  if (!vaAudioCtx) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    vaAudioCtx = new Ctx({ sampleRate: 24000 });
    vaAnalyser = vaAudioCtx.createAnalyser();
    vaAnalyser.fftSize = 64;
    vaAnalyser.connect(vaAudioCtx.destination);
  }
  if (vaAudioCtx.state === 'suspended') {
    vaAudioCtx.resume().catch(function () {});
  }
  return vaAudioCtx;
}

function startWaveformLoop() {
  var bars = document.querySelectorAll('#va-waveform span');
  if (!bars.length || !vaAnalyser) return;
  var bins = new Uint8Array(vaAnalyser.frequencyBinCount);

  function tick() {
    if (!vaActiveSources.length && !vaIsListening) {
      for (var i = 0; i < bars.length; i++) bars[i].style.height = '5px';
      vaWaveformRaf = null;
      return;
    }
    if (vaActiveSources.length) {
      vaAnalyser.getByteFrequencyData(bins);
      for (var j = 0; j < bars.length; j++) {
        var val = bins[Math.min(bins.length - 1, j * 2 + 1)] || 0;
        var h = 4 + Math.round((val / 255) * 16);
        bars[j].style.height = h + 'px';
      }
    } else if (vaIsListening) {
      var t = performance.now() * 0.008;
      for (var k = 0; k < bars.length; k++) {
        bars[k].style.height = Math.round(6 + 7 * (0.5 + 0.5 * Math.sin(t + k * 1.1))) + 'px';
      }
    }
    vaWaveformRaf = requestAnimationFrame(tick);
  }

  if (!vaWaveformRaf) {
    vaWaveformRaf = requestAnimationFrame(tick);
  }
}

function stopVoiceAudio() {
  for (var i = 0; i < vaActiveSources.length; i++) {
    try { vaActiveSources[i].stop(); } catch (_) {}
    try { vaActiveSources[i].disconnect(); } catch (_) {}
  }
  vaActiveSources = [];
  var stopBtn = document.getElementById('va-btn-stop-audio');
  if (stopBtn) stopBtn.classList.add('hidden');
}

function stripRiffHeaderIfPresent(uint8) {
  if (uint8.length >= 44 &&
      uint8[0] === 82 && uint8[1] === 73 && uint8[2] === 70 && uint8[3] === 70) {
    return uint8.subarray(44);
  }
  return uint8;
}

function schedulePcmFloatBuffer(ctx, float32, nextTimeRef, onAllEnded) {
  if (!float32.length) return;
  var buf = ctx.createBuffer(1, float32.length, 24000);
  buf.copyToChannel(float32, 0);

  var src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(vaAnalyser);

  var startAt = Math.max(ctx.currentTime + 0.025, nextTimeRef.t);
  nextTimeRef.t = startAt + buf.duration;

  vaActiveSources.push(src);
  src.onended = function () {
    var idx = vaActiveSources.indexOf(src);
    if (idx !== -1) vaActiveSources.splice(idx, 1);
    if (!vaActiveSources.length && onAllEnded) {
      onAllEnded();
    }
  };
  src.start(startAt);
  startWaveformLoop();
}

function int16BytesToFloat32(bytes) {
  var sampleCount = Math.floor(bytes.byteLength / 2);
  var out = new Float32Array(sampleCount);
  var view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
  for (var i = 0; i < sampleCount; i++) {
    out[i] = view.getInt16(i * 2, true) / 32768.0;
  }
  return out;
}

/* Play a complete PCM ArrayBuffer (used by 8-Step Tour audio prefetch lockstep) */
function playBufferedPcm(arrayBuffer, signal) {
  stopVoiceAudio();
  var ctx = ensureAudioContext();
  var raw = stripRiffHeaderIfPresent(new Uint8Array(arrayBuffer));
  var f32 = int16BytesToFloat32(raw);
  if (!f32.length) return Promise.resolve();

  var buf = ctx.createBuffer(1, f32.length, 24000);
  buf.copyToChannel(f32, 0);

  var src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(vaAnalyser);
  vaActiveSources.push(src);
  startWaveformLoop();

  return new Promise(function (resolve) {
    var settled = false;
    function done() {
      if (settled) return;
      settled = true;
      var idx = vaActiveSources.indexOf(src);
      if (idx !== -1) vaActiveSources.splice(idx, 1);
      resolve();
    }
    src.onended = done;
    if (signal) {
      signal.addEventListener('abort', function () {
        try { src.stop(); } catch (_) {}
        done();
      }, { once: true });
    }
    src.start();
  });
}

function isFileOrigin() {
  return window.location.protocol === 'file:';
}

function buildDirectSystemPrompt(payload) {
  var cs = payload.circuitState || {};
  var sel = payload.selectedInfo;
  var langMap = {
    'en-IN': 'Respond concisely in clear spoken Indian English (2 to 4 sentences, no markdown).',
    'hi-IN': 'Respond concisely in natural Hindi Devanagari (2 to 4 sentences, no markdown).',
    'te-IN': 'Respond concisely in natural Telugu script (2 to 4 sentences, no markdown).'
  };
  var lines = [
    'You are the interactive VLSI CAD Voice Tutor for a 3D CMOS 2-Input NAND Gate (OUT = !(A*B)).',
    langMap[payload.language] || langMap['en-IN'],
    'Live Circuit State: A=' + cs.a + ', B=' + cs.b + ', MP1=' + cs.mp1 + ', MP2=' + cs.mp2 + ', MN1=' + cs.mn1 + ', MN2=' + cs.mn2 + ', OUT=' + cs.out + '.'
  ];
  if (payload.selectedId && sel) {
    lines.push('Selected Component [' + payload.selectedId + ']: ' + sel.title + ' (' + sel.layer + '). Role: ' + sel.role);
  }
  if (payload.dimensionRules) {
    lines.push('Process Dimensions: ' + payload.dimensionRules);
  }
  return lines.join('\n');
}

async function fetchChatReply(payload, signal) {
  var apiKey = getSarvamApiKey();
  var canUseBackend = !isFileOrigin();

  if (canUseBackend) {
    try {
      var headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-Sarvam-Key'] = apiKey;

      var res = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(Object.assign({ mode: 'chat' }, payload)),
        signal: signal
      });

      if (res.status === 401) {
        throw Object.assign(new Error('MISSING_KEY'), { code: 'MISSING_KEY' });
      }
      if (res.status !== 404 && res.status !== 405) {
        var json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Chat request failed');
        return json.reply || '';
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'MISSING_KEY') throw err;
      /* Fall through to direct browser-to-Sarvam if /api/voice-assistant is unavailable */
    }
  }

  if (!apiKey) {
    throw Object.assign(new Error('MISSING_KEY'), { code: 'MISSING_KEY' });
  }

  var messages = [{ role: 'system', content: buildDirectSystemPrompt(payload) }];
  var recent = (payload.history || []).slice(-6);
  for (var i = 0; i < recent.length; i++) {
    messages.push(recent[i]);
  }
  messages.push({ role: 'user', content: payload.text });

  var directRes = await fetch(DIRECT_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey
    },
    body: JSON.stringify({
      model: 'sarvam-105b-conversations',
      messages: messages,
      temperature: 0.45,
      max_tokens: 320,
      stream: false
    }),
    signal: signal
  });

  var directData = await directRes.json();
  if (!directRes.ok) {
    throw new Error((directData && directData.error && (directData.error.message || directData.error)) || 'Sarvam chat failed');
  }
  return directData.choices && directData.choices[0] && directData.choices[0].message
    ? String(directData.choices[0].message.content).trim()
    : '';
}

async function openTtsStreamResponse(text, language, speaker, signal) {
  var apiKey = getSarvamApiKey();
  var canUseBackend = !isFileOrigin();

  if (canUseBackend) {
    try {
      var headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-Sarvam-Key'] = apiKey;

      var res = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          mode: 'tts',
          text: text,
          language: language,
          speaker: speaker
        }),
        signal: signal
      });
      if (res.status === 401) {
        throw Object.assign(new Error('MISSING_KEY'), { code: 'MISSING_KEY' });
      }
      if (res.status !== 404 && res.status !== 405) {
        if (!res.ok) throw new Error('TTS request failed (' + res.status + ')');
        return res;
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'MISSING_KEY') throw err;
    }
  }

  if (!apiKey) {
    throw Object.assign(new Error('MISSING_KEY'), { code: 'MISSING_KEY' });
  }

  var directTts = await fetch(DIRECT_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey
    },
    body: JSON.stringify({
      model: 'bulbul:v4-flash',
      text: text,
      target_language_code: language,
      speaker: speaker,
      speech_sample_rate: 24000,
      enable_preprocessing: true,
      output_audio_codec: 'linear16'
    }),
    signal: signal
  });

  if (!directTts.ok) {
    throw new Error('Sarvam TTS failed (' + directTts.status + ')');
  }
  return directTts;
}

async function fetchSarvamTtsPcm(text, language, speaker, signal, opts) {
  opts = opts || {};
  try {
    if (!vaHasServerKey && !getSarvamApiKey()) return null;
    var res = await openTtsStreamResponse(text, language, speaker, signal);
    return await res.arrayBuffer();
  } catch (err) {
    if (!opts.silentError) throw err;
    return null;
  }
}

async function streamAndPlayTts(text, language, speaker, signal) {
  stopVoiceAudio();
  var ctx = ensureAudioContext();
  var stopBtn = document.getElementById('va-btn-stop-audio');
  if (stopBtn) stopBtn.classList.remove('hidden');

  var res = await openTtsStreamResponse(text, language, speaker, signal);
  if (!res.body) {
    var fullBuf = await res.arrayBuffer();
    await playBufferedPcm(fullBuf, signal);
    if (stopBtn) stopBtn.classList.add('hidden');
    return;
  }

  var reader = res.body.getReader();
  var leftover = null;
  var firstChunk = true;
  var nextTimeRef = { t: ctx.currentTime + 0.04 };
  var streamEnded = false;

  return new Promise(function (resolve, reject) {
    function finishIfDone() {
      if (streamEnded && !vaActiveSources.length) {
        if (stopBtn) stopBtn.classList.add('hidden');
        resolve();
      }
    }

    (async function pump() {
      try {
        while (true) {
          var step = await reader.read();
          if (step.done) break;
          var chunk = step.value;
          if (!chunk || !chunk.byteLength) continue;

          if (firstChunk) {
            firstChunk = false;
            chunk = stripRiffHeaderIfPresent(chunk);
          }

          var combined;
          if (leftover !== null) {
            combined = new Uint8Array(1 + chunk.byteLength);
            combined[0] = leftover;
            combined.set(chunk, 1);
            leftover = null;
          } else {
            combined = chunk;
          }

          if (combined.byteLength % 2 === 1) {
            leftover = combined[combined.byteLength - 1];
            combined = combined.subarray(0, combined.byteLength - 1);
          }

          if (combined.byteLength >= 2) {
            var f32 = int16BytesToFloat32(combined);
            schedulePcmFloatBuffer(ctx, f32, nextTimeRef, finishIfDone);
          }
        }
        streamEnded = true;
        finishIfDone();
      } catch (err) {
        if (stopBtn) stopBtn.classList.add('hidden');
        reject(err);
      }
    })();
  });
}

function appendVaMessage(role, text) {
  var box = document.getElementById('va-messages');
  if (!box) return;
  var div = document.createElement('div');
  div.className = 'va-msg ' + role;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function setVaStatus(text) {
  var el = document.getElementById('va-status-line');
  if (el) el.textContent = text;
}

function updateVoiceContext() {
  var bar = document.getElementById('va-context-bar');
  if (!bar) return;

  var selLabel = (typeof selectedId !== 'undefined' && selectedId && INFO[selectedId])
    ? INFO[selectedId].title
    : 'None';

  var cs = typeof getCircuitStateSnapshot === 'function'
    ? getCircuitStateSnapshot()
    : { a: 'OFF', b: 'OFF', out: 'HIGH-Z' };

  bar.textContent = 'Selected: ' + selLabel + ' · A=' + cs.a + ' B=' + cs.b + ' → OUT=' + cs.out;
}

function openKeyModal() {
  var modal = document.getElementById('va-key-modal');
  var input = document.getElementById('va-key-input');
  var chk = document.getElementById('va-key-session-only');
  if (input) input.value = getSarvamApiKey();
  if (chk) chk.checked = isSessionOnlyKey();
  if (modal) modal.classList.remove('hidden');
}

function closeKeyModal() {
  var modal = document.getElementById('va-key-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitVoicePrompt(promptText) {
  var text = (promptText || '').trim();
  if (!text) return;

  if (vaRequestAbort) {
    try { vaRequestAbort.abort(); } catch (_) {}
  }
  vaRequestAbort = new AbortController();
  var signal = vaRequestAbort.signal;

  stopVoiceAudio();
  appendVaMessage('user', text);
  setVaStatus('Thinking with Sarvam 105B...');

  var langEl = document.getElementById('va-lang');
  var spkEl = document.getElementById('va-persona');
  var language = (langEl && langEl.value) || 'en-IN';
  var speaker = (spkEl && spkEl.value) || 'aparna_en_edtech';

  var selId = typeof selectedId !== 'undefined' ? selectedId : null;
  var selInfo = (selId && INFO[selId]) ? INFO[selId] : null;
  var dimRules = typeof getDimensionSummaryText === 'function' ? getDimensionSummaryText(selId) : '';
  var circuitState = typeof getCircuitStateSnapshot === 'function' ? getCircuitStateSnapshot() : {};

  try {
    var reply = await fetchChatReply({
      text: text,
      language: language,
      speaker: speaker,
      selectedId: selId,
      selectedInfo: selInfo,
      dimensionRules: dimRules,
      circuitState: circuitState,
      history: vaChatHistory
    }, signal);

    if (!reply) reply = 'No response received.';
    vaChatHistory.push({ role: 'user', content: text });
    vaChatHistory.push({ role: 'assistant', content: reply });
    if (vaChatHistory.length > 12) vaChatHistory = vaChatHistory.slice(-12);

    appendVaMessage('assistant', reply);
    setVaStatus('Streaming Bulbul v4 Flash speech...');

    await streamAndPlayTts(reply, language, speaker, signal);
    setVaStatus('Ready');
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (err.code === 'MISSING_KEY') {
      setVaStatus('Sarvam API key required');
      appendVaMessage('error', 'Please enter your Sarvam API key to enable voice & AI responses.');
      openKeyModal();
      return;
    }
    setVaStatus('Error');
    appendVaMessage('error', err.message || 'Voice Tutor request failed.');
  }
}

function toggleMicListening() {
  var micBtn = document.getElementById('va-btn-mic');
  var inputEl = document.getElementById('va-input');
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRec) {
    appendVaMessage('error', 'Speech recognition is not supported in this browser. Type your question below.');
    return;
  }

  if (vaIsListening && vaRecognition) {
    try { vaRecognition.stop(); } catch (_) {}
    return;
  }

  stopVoiceAudio();
  vaRecognition = new SpeechRec();
  var langEl = document.getElementById('va-lang');
  vaRecognition.lang = (langEl && langEl.value) || 'en-IN';
  vaRecognition.interimResults = true;
  vaRecognition.continuous = true;

  var finalTranscript = '';
  vaIsListening = true;
  if (micBtn) micBtn.classList.add('listening');
  setVaStatus('Listening...');
  startWaveformLoop();

  function resetSilenceTimer() {
    if (vaSpeechSilenceTimer) clearTimeout(vaSpeechSilenceTimer);
    vaSpeechSilenceTimer = setTimeout(function () {
      if (vaRecognition && vaIsListening) {
        try { vaRecognition.stop(); } catch (_) {}
      }
    }, 1500);
  }

  vaRecognition.onresult = function (event) {
    var interim = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var res = event.results[i];
      if (res.isFinal) {
        finalTranscript += res[0].transcript + ' ';
      } else {
        interim += res[0].transcript;
      }
    }
    if (inputEl) inputEl.value = (finalTranscript + interim).trim();
    resetSilenceTimer();
  };

  vaRecognition.onerror = function () {
    vaIsListening = false;
    if (micBtn) micBtn.classList.remove('listening');
    setVaStatus('Mic idle');
  };

  vaRecognition.onend = function () {
    if (vaSpeechSilenceTimer) clearTimeout(vaSpeechSilenceTimer);
    vaIsListening = false;
    if (micBtn) micBtn.classList.remove('listening');
    var spoken = (inputEl && inputEl.value.trim()) || finalTranscript.trim();
    if (spoken) {
      if (inputEl) inputEl.value = '';
      submitVoicePrompt(spoken);
    } else {
      setVaStatus('Ready');
    }
  };

  resetSilenceTimer();
  vaRecognition.start();
}

function checkServerKeyStatus() {
  if (isFileOrigin()) return;
  fetch('/api/voice-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'status' })
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (d && d.hasServerKey) vaHasServerKey = true;
    })
    .catch(function () {});
}

function initVoiceAssistant() {
  var fab = document.getElementById('va-launcher-btn');
  var widget = document.getElementById('voice-assistant-widget');
  var closeBtn = document.getElementById('va-btn-close');
  var keyBtn = document.getElementById('va-btn-key');
  var sendBtn = document.getElementById('va-btn-send');
  var micBtn = document.getElementById('va-btn-mic');
  var stopBtn = document.getElementById('va-btn-stop-audio');
  var inputEl = document.getElementById('va-input');
  var chipsEl = document.getElementById('va-chips');
  var langEl = document.getElementById('va-lang');
  var spkEl = document.getElementById('va-persona');

  if (fab && widget) {
    fab.addEventListener('click', function () {
      widget.classList.remove('hidden');
      fab.classList.add('hidden');
      updateVoiceContext();
    });
  }
  if (closeBtn && widget && fab) {
    closeBtn.addEventListener('click', function () {
      widget.classList.add('hidden');
      fab.classList.remove('hidden');
    });
  }
  if (keyBtn) {
    keyBtn.addEventListener('click', openKeyModal);
  }
  if (stopBtn) {
    stopBtn.addEventListener('click', function () {
      stopVoiceAudio();
      setVaStatus('Stopped');
    });
  }
  if (sendBtn && inputEl) {
    sendBtn.addEventListener('click', function () {
      var v = inputEl.value.trim();
      if (!v) return;
      inputEl.value = '';
      submitVoicePrompt(v);
    });
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var v = inputEl.value.trim();
        if (!v) return;
        inputEl.value = '';
        submitVoicePrompt(v);
      }
    });
  }
  if (micBtn) {
    micBtn.addEventListener('click', toggleMicListening);
  }
  if (chipsEl) {
    chipsEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.va-chip[data-prompt]');
      if (!chip) return;
      var key = chip.getAttribute('data-prompt');
      var fn = QUICK_PROMPT_MAP[key];
      submitVoicePrompt(fn ? fn() : key);
    });
  }

  /* Auto-match default persona when switching language */
  if (langEl && spkEl) {
    langEl.addEventListener('change', function () {
      var l = langEl.value;
      if (l === 'en-IN' && spkEl.value.indexOf('_en_') === -1) spkEl.value = 'aparna_en_edtech';
      else if (l === 'hi-IN' && spkEl.value.indexOf('_hi_') === -1) spkEl.value = 'aparna_hi_customer';
      else if (l === 'te-IN' && spkEl.value.indexOf('_te_') === -1) spkEl.value = 'kavitha_te_narration';
    });
  }

  /* API Key Modal Buttons */
  var saveKeyBtn = document.getElementById('va-key-save');
  var clearKeyBtn = document.getElementById('va-key-clear');
  var cancelKeyBtn = document.getElementById('va-key-cancel');
  var keyInput = document.getElementById('va-key-input');
  var sessionChk = document.getElementById('va-key-session-only');

  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', function () {
      saveSarvamApiKey(keyInput ? keyInput.value : '', sessionChk ? sessionChk.checked : false);
      closeKeyModal();
      setVaStatus('API key saved');
    });
  }
  if (clearKeyBtn) {
    clearKeyBtn.addEventListener('click', function () {
      if (keyInput) keyInput.value = '';
      saveSarvamApiKey('', false);
      closeKeyModal();
      setVaStatus('API key cleared');
    });
  }
  if (cancelKeyBtn) {
    cancelKeyBtn.addEventListener('click', closeKeyModal);
  }

  updateVoiceContext();
  checkServerKeyStatus();
}

initVoiceAssistant();
