const SARVAM_CHAT_URL = 'https://api.sarvam.ai/v1/chat/completions';
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech/stream';

const LANG_DIRECTIVES = {
  'en-IN': 'Respond clearly in natural Indian English using concise spoken sentences suitable for voice narration. Avoid markdown bullets, symbols, or code syntax.',
  'hi-IN': 'Respond in natural Hindi (Devanagari script) using clear technical semiconductor terms where appropriate. Keep sentences concise and suitable for voice narration without markdown symbols.',
  'te-IN': 'Respond in natural Telugu (Telugu script) using clear technical semiconductor terms where appropriate. Keep sentences concise and suitable for voice narration without markdown symbols.'
};

function resolveApiKey(req, body) {
  const headerKey = req.headers && (req.headers['x-sarvam-key'] || req.headers['X-Sarvam-Key']);
  return (headerKey && String(headerKey).trim()) ||
    (body && body.apiKey && String(body.apiKey).trim()) ||
    (process.env.SARVAM_API_KEY && String(process.env.SARVAM_API_KEY).trim()) ||
    '';
}

function buildSystemPrompt(context) {
  const lang = (context && context.language) || 'en-IN';
  const langInstruction = LANG_DIRECTIVES[lang] || LANG_DIRECTIVES['en-IN'];
  const cs = (context && context.circuitState) || {};
  const sel = context && context.selectedInfo;
  const dims = context && context.dimensionRules;

  const lines = [
    'You are the interactive VLSI & Semiconductor CAD Voice Tutor inside the 3D CMOS 2-Input NAND Gate (NAND2, OUT = NOT(A AND B)) Physical Layout & Fabrication Viewer.',
    'Explain concepts accurately in terms of CMOS device physics, Euler-path layout topology, parallel PMOS pull-up (MP1 and MP2 in N-Well), series NMOS pull-down (MN1 and MN2 in P-Well sharing an uncontacted internal N+ silicon bridge), dual continuous polysilicon gates (A and B), 9 tungsten contacts, and planar zero-crossing Metal-1 routing.',
    langInstruction,
    'Keep answers focused and concise (2 to 4 crisp sentences unless the user asks for deep detail). Do not use markdown asterisks, backticks, or bullet points.',
    `Live Circuit State: Input A = ${cs.a ?? 'off'}, Input B = ${cs.b ?? 'off'}, MP1 (PMOS A) = ${cs.mp1 ?? 'unknown'}, MP2 (PMOS B) = ${cs.mp2 ?? 'unknown'}, MN1 (NMOS A) = ${cs.mn1 ?? 'unknown'}, MN2 (NMOS B) = ${cs.mn2 ?? 'unknown'}, OUT = ${cs.out ?? 'unknown'}.`
  ];

  if (context && context.selectedId && sel) {
    lines.push(
      `Currently Selected Component [${context.selectedId}]: ${sel.title || context.selectedId}. Layer: ${sel.layer || 'N/A'}. Type: ${sel.type || 'N/A'}. Role: ${sel.role || 'N/A'}. Process: ${sel.process || 'N/A'}.`
    );
  } else {
    lines.push('No specific 3D component is currently selected; refer to the full CMOS 2-Input NAND cell.');
  }

  if (dims) {
    lines.push(`Active Process Node & Dimensions: ${dims}`);
  }

  return lines.join('\n');
}

async function handleChat(req, res, body, apiKey) {
  const userText = (body && body.text ? String(body.text) : '').trim();
  if (!userText) {
    res.status(400).json({ error: 'Missing text prompt' });
    return;
  }

  const systemPrompt = buildSystemPrompt(body);
  const messages = [{ role: 'system', content: systemPrompt }];

  if (Array.isArray(body.history)) {
    const recent = body.history.slice(-6);
    for (const msg of recent) {
      if (msg && (msg.role === 'user' || msg.role === 'assistant') && msg.content) {
        messages.push({ role: msg.role, content: String(msg.content) });
      }
    }
  }
  messages.push({ role: 'user', content: userText });

  const upstream = await fetch(SARVAM_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey
    },
    body: JSON.stringify({
      model: 'sarvam-105b-conversations',
      messages,
      temperature: 0.45,
      max_tokens: 320,
      stream: false
    })
  });

  const rawText = await upstream.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch (err) {
    data = { raw: rawText };
  }

  if (!upstream.ok) {
    const errMsg = (data && (data.error && (data.error.message || data.error))) ||
      (data && data.message) ||
      `Sarvam chat failed (${upstream.status})`;
    res.status(upstream.status).json({ error: errMsg });
    return;
  }

  const reply = data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
    ? String(data.choices[0].message.content).trim()
    : '';

  res.status(200).json({ reply });
}

async function handleTts(req, res, body, apiKey) {
  const text = (body && body.text ? String(body.text) : '').trim();
  if (!text) {
    res.status(400).json({ error: 'Missing text for TTS' });
    return;
  }

  const targetLang = (body && body.language) || 'en-IN';
  const speaker = (body && body.speaker) || 'aparna_en_edtech';

  const upstream = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey
    },
    body: JSON.stringify({
      model: 'bulbul:v4-flash',
      text,
      target_language_code: targetLang,
      speaker,
      speech_sample_rate: 24000,
      enable_preprocessing: true,
      output_audio_codec: 'linear16'
    })
  });

  if (!upstream.ok) {
    const errBody = await upstream.text();
    let msg = `Sarvam TTS failed (${upstream.status})`;
    try {
      const parsed = JSON.parse(errBody);
      msg = parsed.message || (parsed.error && (parsed.error.message || parsed.error)) || msg;
    } catch (_) {}
    res.status(upstream.status).json({ error: msg });
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'audio/pcm');
  res.setHeader('X-Sample-Rate', '24000');
  res.setHeader('Cache-Control', 'no-store');

  if (!upstream.body) {
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
    return;
  }

  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength) {
        res.write(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
      }
    }
  } finally {
    res.end();
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const mode = body.mode || 'chat';

  if (mode === 'status') {
    res.status(200).json({
      hasServerKey: Boolean(process.env.SARVAM_API_KEY && String(process.env.SARVAM_API_KEY).trim())
    });
    return;
  }

  const apiKey = resolveApiKey(req, body);
  if (!apiKey) {
    res.status(401).json({ error: 'Sarvam API key is required. Configure SARVAM_API_KEY or enter a key in settings.' });
    return;
  }

  if (mode === 'tts') {
    await handleTts(req, res, body, apiKey);
    return;
  }

  await handleChat(req, res, body, apiKey);
};
