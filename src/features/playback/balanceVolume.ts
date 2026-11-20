/**
 * App-level volume leveling for HTML video playback.
 *
 * The graph is intentionally gentle: a compressor tames short peaks, a slow
 * RMS-driven gain stage evens out quiet and loud sources, and a limiter protects
 * the output. The dry path stays available so the feature can be bypassed
 * without touching the media element's own volume or mute state.
 */

type Chain = {
  ctx: AudioContext;
  video: HTMLVideoElement;
  source: MediaElementAudioSourceNode;
  compressor: DynamicsCompressorNode;
  agc: GainNode;
  limiter: DynamicsCompressorNode;
  analyser: AnalyserNode;
  dry: GainNode;
  wet: GainNode;
  buffer: Float32Array<ArrayBuffer>;
  timer: number;
  resetTimer: number;
  enabled: boolean;
  lastDb: number;
};

const TARGET_RMS_DB = -18;
const GATE_DB = -50;
const MAX_BOOST_DB = 10;
const MAX_CUT_DB = -12;
const DEADBAND_DB = 1.5;
const AGC_INTERVAL_MS = 50;
const ATTACK_SECONDS = 0.25;
const RELEASE_SECONDS = 1.2;
const CROSSFADE_SECONDS = 0.2;

const chains = new WeakMap<HTMLVideoElement, Chain>();
const wanted = new WeakMap<HTMLVideoElement, boolean>();
const pending = new WeakMap<HTMLVideoElement, () => void>();
let sharedContext: AudioContext | null = null;

function createContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try { return new Ctor({ latencyHint: "interactive" }); }
  catch {
    try { return new Ctor(); }
    catch { return null; }
  }
}

function getContext(): AudioContext | null {
  if (sharedContext?.state === "closed") sharedContext = null;
  if (!sharedContext) sharedContext = createContext();
  return sharedContext;
}

function setState(video: HTMLVideoElement, state: "off" | "pending" | "on" | "unsupported") {
  video.dataset.balanceVolume = state;
}

function ramp(param: AudioParam, value: number, ctx: AudioContext) {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + CROSSFADE_SECONDS);
}

function stopTimer(chain: Chain) {
  if (chain.timer) {
    window.clearInterval(chain.timer);
    chain.timer = 0;
  }
}

function tick(chain: Chain) {
  if (!chain.enabled || chain.ctx.state !== "running" || chain.video.paused || chain.video.seeking) return;
  chain.analyser.getFloatTimeDomainData(chain.buffer);
  let sum = 0;
  for (let i = 0; i < chain.buffer.length; i += 1) sum += chain.buffer[i] * chain.buffer[i];
  const rms = Math.sqrt(sum / chain.buffer.length);
  const measuredDb = 20 * Math.log10(rms + 1e-7);
  if (measuredDb < GATE_DB) return;

  const desiredDb = Math.max(-MAX_CUT_DB, Math.min(MAX_BOOST_DB, TARGET_RMS_DB - measuredDb));
  if (Math.abs(desiredDb - chain.lastDb) < DEADBAND_DB) return;
  const attack = desiredDb < chain.lastDb;
  const now = chain.ctx.currentTime;
  chain.agc.gain.cancelScheduledValues(now);
  chain.agc.gain.setTargetAtTime(
    10 ** (desiredDb / 20),
    now,
    attack ? ATTACK_SECONDS : RELEASE_SECONDS,
  );
  chain.lastDb = desiredDb;
}

function startTimer(chain: Chain) {
  if (chain.timer) return;
  chain.timer = window.setInterval(() => tick(chain), AGC_INTERVAL_MS);
}

function enableChain(chain: Chain) {
  chain.enabled = true;
  if (chain.resetTimer) {
    window.clearTimeout(chain.resetTimer);
    chain.resetTimer = 0;
  }
  startTimer(chain);
  ramp(chain.dry.gain, 0, chain.ctx);
  ramp(chain.wet.gain, 1, chain.ctx);
  setState(chain.video, "on");
  void chain.ctx.resume();
}

function disableChain(chain: Chain) {
  chain.enabled = false;
  ramp(chain.dry.gain, 1, chain.ctx);
  ramp(chain.wet.gain, 0, chain.ctx);
  setState(chain.video, "off");
  stopTimer(chain);
  if (chain.resetTimer) window.clearTimeout(chain.resetTimer);
  chain.resetTimer = window.setTimeout(() => {
    chain.resetTimer = 0;
    const now = chain.ctx.currentTime;
    chain.agc.gain.cancelScheduledValues(now);
    chain.agc.gain.setValueAtTime(1, now);
    chain.lastDb = 0;
  }, 300);
}

function clearPending(video: HTMLVideoElement) {
  const cleanup = pending.get(video);
  if (!cleanup) return;
  cleanup();
  pending.delete(video);
}

function waitForGesture(video: HTMLVideoElement, ctx: AudioContext) {
  if (pending.has(video)) return;
  let done = false;
  const events = ["pointerdown", "keydown", "touchend"] as const;
  const cleanup = () => {
    for (const event of events) document.removeEventListener(event, unlock, true);
  };
  const unlock = () => {
    if (done) return;
    done = true;
    cleanup();
    pending.delete(video);
    void ctx.resume().then(() => {
      if (wanted.get(video)) attach(video, ctx);
    }).catch(() => { /* Leave the dry path active; the setting stays pending. */ });
  };
  for (const event of events) document.addEventListener(event, unlock, true);
  pending.set(video, cleanup);
}

function attach(video: HTMLVideoElement, ctx: AudioContext) {
  if (!wanted.get(video)) return;
  const existing = chains.get(video);
  if (existing) { enableChain(existing); return; }
  clearPending(video);

  try {
    const source = ctx.createMediaElementSource(video);
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -30;
    compressor.knee.value = 8;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.35;

    const agc = ctx.createGain();
    agc.gain.value = 1;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0;
    limiter.release.value = 0.15;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;

    const dry = ctx.createGain();
    dry.gain.value = 1;
    const wet = ctx.createGain();
    wet.gain.value = 0;

    source.connect(dry);
    dry.connect(ctx.destination);
    source.connect(compressor);
    compressor.connect(analyser);
    compressor.connect(agc);
    agc.connect(limiter);
    limiter.connect(wet);
    wet.connect(ctx.destination);

    const chain: Chain = {
      ctx, source, compressor, agc, limiter, analyser, dry, wet,
      buffer: new Float32Array(analyser.fftSize),
      timer: 0, resetTimer: 0, enabled: false, lastDb: 0,
      video,
    };
    chains.set(video, chain);
    video.addEventListener("play", () => {
      if (chain.enabled) void ctx.resume();
    });
    enableChain(chain);
  } catch {
    setState(video, "unsupported");
  }
}

/** Apply the persisted preference to a video element. Creating the source node is lazy. */
export function setBalanceVolume(video: HTMLVideoElement | null, enabled: boolean) {
  if (!video) return;
  wanted.set(video, enabled);
  if (!enabled) {
    clearPending(video);
    const chain = chains.get(video);
    if (chain) disableChain(chain);
    else setState(video, "off");
    return;
  }

  const ctx = getContext();
  if (!ctx) { setState(video, "unsupported"); return; }
  setState(video, "pending");
  const activate = () => {
    if (wanted.get(video) && ctx.state === "running") attach(video, ctx);
  };
  void ctx.resume().then(activate).catch(() => { /* Wait for the next explicit gesture. */ });
  if (ctx.state !== "running") waitForGesture(video, ctx);
  else activate();
}
