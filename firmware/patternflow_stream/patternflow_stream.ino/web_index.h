#pragma once
#include <pgmspace.h>

const char INDEX_HTML[] PROGMEM = R"HTML(<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PatternFlow Stream</title>
<style>
  :root{--bg:#0a0a0a;--fg:#e8e8e8;--mut:#666;--ln:#1f1f1f;--ok:#5fdb89;--bad:#ff5d5d}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:12px/1.5 ui-monospace,monospace;
       display:flex;flex-direction:column;align-items:center;padding:20px;gap:16px}
  h1{font-size:11px;letter-spacing:.4em;opacity:.5;margin:0;font-weight:400}
  canvas{border:1px solid var(--ln);image-rendering:pixelated;width:512px;height:256px}
  #panel{width:512px;border:1px solid var(--ln);padding:16px}
  .row{display:flex;align-items:center;gap:12px;margin:6px 0}
  .row label{width:80px;color:var(--mut);font-size:11px}
  .row input[type=range]{flex:1;accent-color:#888}
  .row .v{width:54px;text-align:right;color:var(--mut);font-size:11px;font-variant-numeric:tabular-nums}
  #status{position:fixed;top:10px;right:10px;padding:6px 10px;border:1px solid var(--ln);
          background:#0d0d0d;font-size:10px;letter-spacing:.1em}
  .ok{color:var(--ok)} .bad{color:var(--bad)}
  #stats{font-size:10px;color:var(--mut);width:512px;display:flex;justify-content:space-between}
</style></head>
<body>
<h1>PATTERNFLOW · STREAM</h1>
<canvas id="cv" width="128" height="64"></canvas>
<div id="stats"><span id="fps">--- fps</span><span id="bw">--- KB/s</span></div>
<div id="panel">
  <div class="row"><label>K0 hue</label>     <input id="s0" type="range" min="0"   max="1"  step="0.001" value="0.55"><span class="v" id="v0">0.55</span></div>
  <div class="row"><label>K1 speed</label>   <input id="s1" type="range" min="0"   max="3"  step="0.01"  value="1.00"><span class="v" id="v1">1.00</span></div>
  <div class="row"><label>K2 scale</label>   <input id="s2" type="range" min="0.5" max="20" step="0.1"   value="6.0" ><span class="v" id="v2">6.0</span></div>
  <div class="row"><label>K3 distort</label> <input id="s3" type="range" min="0"   max="2"  step="0.01"  value="0.40"><span class="v" id="v3">0.40</span></div>
</div>
<div id="status">connecting…</div>

<script>
(() => {
  const W = 128, H = 64;
  const canvas = document.getElementById('cv');
  const gl = canvas.getContext('webgl2', { antialias:false, preserveDrawingBuffer:false });
  if (!gl) { document.body.innerHTML = '<p style="color:#f55">WebGL2 unavailable</p>'; return; }

  const VS = `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

  const FS = `#version 300 es
precision highp float;
uniform float uTime, uK0, uK1, uK2, uK3;
uniform vec2  uRes;
out vec4 fragColor;

vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(){
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  uv.x *= uRes.x / uRes.y;
  float t = uTime * uK1;
  vec2 q = uv;
  q += uK3 * vec2(sin(uv.y * 3.0 + t), cos(uv.x * 2.5 - t));
  float w = sin(q.x * uK2 + t) + sin(q.y * uK2 * 0.7 - t * 0.6);
  w = w * 0.5 + 0.5;
  vec3 col = hsv2rgb(vec3(uK0 + w * 0.2, 0.85, w));
  fragColor = vec4(col, 1.0);
}`;

  const sh = (t, src) => {
    const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uRes  = gl.getUniformLocation(prog, 'uRes');
  const uK    = [0,1,2,3].map(i => gl.getUniformLocation(prog, 'uK' + i));

  const rt = gl.createFramebuffer();
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, rt);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const pixels = new Uint8Array(W * H * 4);
  const knobs = [0.55, 1.0, 6.0, 0.40];

  for (let i = 0; i < 4; i++) {
    const s = document.getElementById('s' + i);
    const v = document.getElementById('v' + i);
    s.addEventListener('input', () => {
      knobs[i] = parseFloat(s.value);
      v.textContent = knobs[i].toFixed(2);
      if (wsCtrl?.readyState === 1)
        wsCtrl.send(JSON.stringify({ type:'knob', idx:i, val:knobs[i] }));
    });
  }

  const status = document.getElementById('status');
  const fpsEl = document.getElementById('fps'), bwEl = document.getElementById('bw');
  let wsStream, wsCtrl;
  let canSend = false;        // 백프레셔: ESP32 버퍼가 비었을 때만 송신

  function connect() {
    const host = location.hostname;
    wsStream = new WebSocket(`ws://${host}:81/`);
    wsStream.binaryType = 'arraybuffer';
    wsCtrl   = new WebSocket(`ws://${host}:82/`);

    wsStream.onopen = () => { canSend = true; };
    wsStream.onclose = () => { canSend = false; };
    wsStream.onerror = () => { canSend = false; };

    wsCtrl.onopen = () => {
      status.textContent = 'connected';
      status.className = 'ok';
      wsCtrl.send(JSON.stringify({ type:'hello', width:W, height:H, format:'RGB888' }));
    };
    wsCtrl.onmessage = e => console.log('[ctrl]', e.data);
    wsCtrl.onclose = () => {
      status.textContent = 'disconnected'; status.className = 'bad';
      setTimeout(connect, 1500);
    };
  }
  connect();

  const CHUNK_ROWS = 4;
  const CHUNK_PAYLOAD = CHUNK_ROWS * W * 3;     // 1536
  const NUM_CHUNKS = H / CHUNK_ROWS;              // 16
  const sendBuf = new Uint8Array(6 + CHUNK_PAYLOAD);
  const TARGET_INTERVAL = 1000 / 30;              // 30 fps target

  // bufferedAmount 임계값 — 이 이상 쌓이면 송신 스킵 (백프레셔)
  const BACKPRESSURE_LIMIT = 64 * 1024;           // 64KB

  let seq = 0, lastSent = 0, fpsCount = 0, byteCount = 0, fpsT0 = performance.now();

  function frame(now) {
    gl.uniform1f(uTime, now * 0.001);
    gl.uniform2f(uRes, W, H);
    for (let i = 0; i < 4; i++) gl.uniform1f(uK[i], knobs[i]);

    // 미리보기
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 페이싱 + 백프레셔 체크
    if (now - lastSent < TARGET_INTERVAL || !canSend ||
        wsStream.bufferedAmount > BACKPRESSURE_LIMIT) {
      requestAnimationFrame(frame);
      return;
    }
    lastSent = now;

    // 송신용 렌더 + readPixels
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt);
    gl.viewport(0, 0, W, H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    seq = (seq + 1) & 0xFF;
    for (let c = 0; c < NUM_CHUNKS; c++) {
      const offset = c * CHUNK_PAYLOAD;
      const isLast = (c === NUM_CHUNKS - 1) ? 1 : 0;

      sendBuf[0] = seq;
      sendBuf[1] = (offset >> 8) & 0xFF;
      sendBuf[2] = offset & 0xFF;
      sendBuf[3] = (CHUNK_PAYLOAD >> 8) & 0xFF;
      sendBuf[4] = CHUNK_PAYLOAD & 0xFF;
      sendBuf[5] = isLast;

      let dst = 6;
      for (let r = 0; r < CHUNK_ROWS; r++) {
        const panelY = c * CHUNK_ROWS + r;
        const glY = (H - 1) - panelY;
        const rowStart = glY * W * 4;
        for (let x = 0; x < W; x++) {
          const src = rowStart + x * 4;
          sendBuf[dst++] = pixels[src];
          sendBuf[dst++] = pixels[src + 1];
          sendBuf[dst++] = pixels[src + 2];
        }
      }
      try { wsStream.send(sendBuf); } catch(e) { canSend = false; break; }
      byteCount += sendBuf.length;
    }
    fpsCount++;

    if (now - fpsT0 >= 1000) {
      fpsEl.textContent = fpsCount + ' fps';
      bwEl.textContent  = (byteCount / 1024).toFixed(0) + ' KB/s';
      fpsCount = 0; byteCount = 0; fpsT0 = now;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
</script>
</body></html>
)HTML";