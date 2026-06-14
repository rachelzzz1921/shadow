'use strict';

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');

// Lazy-load agents only when needed; lets the static demo work even if deps missing.
let agents = null;
function getAgents() {
  if (agents) return agents;
  try {
    agents = require('./lib/agents');
  } catch (error) {
    throw new Error(
      'Failed to load agent runtime. Did you run npm install? Underlying: ' + error.message
    );
  }
  return agents;
}

let storySession = null;
function getStorySession() {
  if (storySession) return storySession;
  try {
    storySession = require('./lib/story-session');
  } catch (error) {
    throw new Error(
      'Failed to load story session runtime. Did you run npm install? Underlying: ' + error.message
    );
  }
  return storySession;
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error('Invalid JSON body');
    err.status = 400;
    throw err;
  }
}

function hasAnyKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

// ------------------------------------------------------------
// Agent endpoints
// ------------------------------------------------------------
async function handlePersona(req, res) {
  const body = await readJson(req);
  if (!body.profile || !body.profile.choice) {
    sendJson(res, 400, { error: 'Missing profile.choice' });
    return;
  }
  const persona_card = await getAgents().runPersona({ profile: body.profile });
  const shadow = getAgents().deriveShadow(persona_card);
  sendJson(res, 200, { persona_card, shadow });
}

async function handleBeats(req, res) {
  const body = await readJson(req);
  if (!body.persona_card || !body.profile) {
    sendJson(res, 400, { error: 'Missing persona_card or profile' });
    return;
  }
  const beats = await getAgents().runBeats({
    persona_card: body.persona_card,
    profile: body.profile
  });
  sendJson(res, 200, beats);
}

async function handleYear(req, res) {
  const body = await readJson(req);
  const required = ['persona_card', 'year_n', 'beat_type', 'beat_seed', 'age'];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null) {
      sendJson(res, 400, { error: `Missing field: ${key}` });
      return;
    }
  }
  const year = await getAgents().runYear({
    persona_card: body.persona_card,
    memory_stream: body.memory_stream || [],
    current_mood: body.current_mood ?? 5,
    current_esteem: body.current_esteem ?? 5,
    year_n: body.year_n,
    age: body.age,
    beat_type: body.beat_type,
    beat_seed: body.beat_seed,
    user_intervention: body.user_intervention || null,
    full_beats: body.full_beats || [],
    pivotal_years: body.pivotal_years || []
  });
  sendJson(res, 200, year);
}

async function handleFinal(req, res) {
  const body = await readJson(req);
  if (!body.persona_card || !body.memory_stream || !body.profile) {
    sendJson(res, 400, { error: 'Missing persona_card / memory_stream / profile' });
    return;
  }
  const final = await getAgents().runFinal({
    persona_card: body.persona_card,
    memory_stream: body.memory_stream,
    final_mood: body.final_mood ?? 5,
    final_esteem: body.final_esteem ?? 5,
    profile: body.profile
  });
  sendJson(res, 200, final);
}

async function handleDialogue(req, res) {
  const body = await readJson(req);
  if (!body.persona_card || !body.user_question) {
    sendJson(res, 400, { error: 'Missing persona_card or user_question' });
    return;
  }
  const input = {
    persona_card: body.persona_card,
    memory_stream: body.memory_stream || [],
    current_mood: body.current_mood ?? 5,
    current_esteem: body.current_esteem ?? 5,
    at_year: body.at_year ?? 7,
    user_question: body.user_question
  };
  if (!hasAnyKey()) {
    const { askDialoguePlaceholder } = require('./lib/dialogue-hook');
    sendJson(res, 200, askDialoguePlaceholder(input));
    return;
  }
  const reply = await getAgents().runDialogue({ ...input, runtime: undefined });
  sendJson(res, 200, reply);
}

async function handleScenarioClassify(req, res) {
  const body = await readJson(req);
  const { classifyUserQuestion, classifyProfile } = require('./lib/scenario-classify');
  const text = body.text ?? body.question ?? body.choice ?? '';
  const result = text && !body.profile
    ? await classifyUserQuestion(text, {
        keywords: body.keywords,
        description: body.description
      })
    : await classifyProfile(body.profile || { choice: text, keywords: body.keywords, description: body.description });
  sendJson(res, 200, result);
}

async function handleFateContext(req, res) {
  const body = await readJson(req);
  const { askFatePlaceholder, askFateOnIntervention } = require('./lib/fate-hook');
  const fn = body.intervention || body.choice ? askFateOnIntervention : askFatePlaceholder;
  const result = await fn({
    profile: body.profile,
    persona_card: body.persona_card,
    narrativeYear: body.narrative_year ?? body.narrativeYear ?? 1,
    year: body.year,
    beatType: body.beat_type,
    choice: body.choice,
    lastIntervention: body.last_intervention,
    priorInterventions: body.prior_interventions || [],
    snippets: body.snippets
  });
  sendJson(res, 200, result);
}

async function handleStoryStart(req, res) {
  const body = await readJson(req);
  if (!body.profile || !body.profile.choice) {
    sendJson(res, 400, { error: 'Missing profile.choice' });
    return;
  }
  const { createRunTrace, persistTrace, finishRunTrace } = require('./lib/run-trace');
  const trace = createRunTrace({ profile: body.profile, mode: 'live' });
  try {
    const session = await getStorySession().startStorySession({ profile: body.profile, trace });
    persistTrace(trace);
    sendJson(res, 200, { session, run_id: trace.run_id });
  } catch (error) {
    finishRunTrace(trace, { stop_reason: 'start_failed' });
    throw error;
  }
}

async function handleStoryYear(req, res) {
  const body = await readJson(req);
  if (!body.session) {
    sendJson(res, 400, { error: 'Missing story session' });
    return;
  }
  const { loadRunTrace, persistTrace } = require('./lib/run-trace');
  const trace = body.session.run_id ? loadRunTrace(body.session.run_id) : null;
  const result = await getStorySession().generateNextYear({
    session: body.session,
    user_intervention: body.user_intervention || null,
    trace
  });
  if (trace) persistTrace(trace);
  sendJson(res, 200, result);
}

async function handleStoryFinal(req, res) {
  const body = await readJson(req);
  if (!body.session) {
    sendJson(res, 400, { error: 'Missing story session' });
    return;
  }
  const { loadRunTrace } = require('./lib/run-trace');
  const trace = body.session.run_id ? loadRunTrace(body.session.run_id) : null;
  const result = await getStorySession().finishStorySession({ session: body.session, trace });
  sendJson(res, 200, result);
}

// Full pipeline as a single Server-Sent Events stream — lets the frontend show
// each stage live without juggling 9 fetches itself.
async function handleStoryStream(req, res) {
  const body = await readJson(req);
  if (!body.profile || !body.profile.choice) {
    sendJson(res, 400, { error: 'Missing profile.choice' });
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });
  const send = (event, payload) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  try {
    const story = await getAgents().runFullStory({
      profile: body.profile,
      onProgress: (stage, payload) => send(stage, payload || {})
    });
    send('story:done', story);
    res.end();
  } catch (error) {
    send('error', { message: error.message });
    res.end();
  }
}

// ------------------------------------------------------------
// Legacy single-shot endpoint (kept so older frontend code still works)
// ------------------------------------------------------------
async function handleLegacyGenerate(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 500, {
      error: 'Legacy /api/generate requires OPENAI_API_KEY. Use /api/story instead.'
    });
    return;
  }
  try {
    const body = await readJson(req);
    if (!Array.isArray(body.messages)) {
      sendJson(res, 400, { error: 'Expected { messages: [...] }' });
      return;
    }
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: body.messages,
        response_format: { type: 'json_object' },
        temperature: 0.9
      })
    });
    const text = await upstream.text();
    res.writeHead(upstream.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(text);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

// ------------------------------------------------------------
// Static
// ------------------------------------------------------------
function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const safePath = path
    .normalize(decodeURIComponent(url.pathname))
    .replace(/^(\.\.[/\\])+/, '');
  const requested = safePath === '/' ? '/index.html' : safePath;
  const filePath = path.join(PUBLIC_DIR, requested);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : 'Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

// ------------------------------------------------------------
// Router
// ------------------------------------------------------------
const ROUTES = {
  'POST /api/persona': handlePersona,
  'POST /api/beats': handleBeats,
  'POST /api/year': handleYear,
  'POST /api/final': handleFinal,
  'POST /api/dialogue': handleDialogue,
  'POST /api/fate/context': handleFateContext,
  'POST /api/scenario/classify': handleScenarioClassify,
  'POST /api/story': handleStoryStream,
  'POST /api/story/start': handleStoryStart,
  'POST /api/story/year': handleStoryYear,
  'POST /api/story/final': handleStoryFinal,
  'POST /api/generate': handleLegacyGenerate
};

function handleHealth(req, res) {
  let provider = null;
  try {
    provider = getAgents().pickProvider();
  } catch {
    provider = null;
  }
  sendJson(res, 200, {
    ok: true,
    provider,
    has_key: hasAnyKey(),
    model_override: process.env.SHADOW_MODEL || null
  });
}

const server = http.createServer(async (req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`;

  if (key === 'GET /api/health') {
    return handleHealth(req, res);
  }

  if (ROUTES[key]) {
    try {
      await ROUTES[key](req, res);
    } catch (error) {
      console.error(`[${key}] ${error.stack || error.message}`);
      const status = error.status || 500;
      if (!res.headersSent) sendJson(res, status, { error: error.message });
      else res.end();
    }
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Shadow demo running at http://localhost:${PORT}`);
  console.log(
    hasAnyKey()
      ? `Live agents available. Provider precedence: ANTHROPIC_API_KEY > OPENAI_API_KEY.`
      : 'No API key detected. Local mode only — /api/* will fail until you export ANTHROPIC_API_KEY or OPENAI_API_KEY.'
  );
});
