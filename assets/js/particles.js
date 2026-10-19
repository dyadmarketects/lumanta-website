/* ==========================================================================
   Lumanta particles
   A lightweight WebGL point renderer built from the Particlefy export.
   The particles are the Lumanta logomark in its real gradient colors.
   States are driven by uniforms so GSAP (loader) and ScrollTrigger (homepage)
   can choreograph them:
     burst    0..1  core -> sphere burst (loader intro)
     form     0..1  start position -> logomark
     useStatic 0/1  start position is "static" noise instead of the burst
     staticAmt 0..1 TV-static flicker on the noise state
     explode  0..1  fly particles outward (loader exit)
     rise     0..1  float particles upward (section exit)
     additive 0..1  1 = glowing additive (dark bg), 0 = soft normal (light bg)
   ========================================================================== */
(function () {
  "use strict";

  let dataPromise = null;
  function loadParticleData(url) {
    if (dataPromise) return dataPromise;
    dataPromise = fetch(url).then(function (r) {
      if (!r.ok) throw new Error("particle data " + r.status);
      return r.arrayBuffer();
    }).then(function (buf) {
      const dv = new DataView(buf);
      const count = dv.getUint32(4, true);
      const scale = dv.getFloat32(8, true);
      const q = new Int16Array(buf, 12, count * 3);
      const c = new Uint8Array(buf, 12 + count * 6, count * 3);
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) pos[i] = (q[i] / 32767) * scale;
      return { count: count, pos: pos, col: c };
    });
    return dataPromise;
  }

  const VS = [
    "precision highp float;",
    "attribute vec3 aTarget; attribute vec3 aScatter; attribute vec3 aStatic; attribute vec3 aColor; attribute float aRandom;",
    "uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel;",
    "uniform float uTime, uBurst, uForm, uUseStatic, uStatic, uExplode, uRise, uSize, uDpr, uMouseOn, uLight;",
    "uniform vec3 uMouse;",
    "varying vec3 vColor; varying float vAlpha;",
    "float ease4(float t){ return 1.0 - pow(1.0 - t, 4.0); }",
    "float sm(float t){ return t * t * (3.0 - 2.0 * t); }",
    "float hash(float n){ return fract(sin(n) * 43758.5453123); }",
    "void main(){",
    "  vec3 core = vec3(0.0, -2.0, 0.0);",
    "  vec3 burst = mix(core, aScatter, ease4(clamp(uBurst, 0.0, 1.0)));",
    "  float tq = floor(uTime * 14.0);",
    "  vec3 jit = vec3(hash(aRandom * 91.7 + tq), hash(aRandom * 53.3 + tq * 1.37), hash(aRandom * 17.1 + tq * 0.71)) - 0.5;",
    "  vec3 drift = vec3(sin(uTime * 0.45 + aRandom * 31.0), cos(uTime * 0.38 + aRandom * 23.0), sin(uTime * 0.3 + aRandom * 11.0)) * 0.45;",
    "  vec3 stat = aStatic + (jit * 0.22 + drift) * uStatic;",
    "  vec3 start = mix(burst, stat, uUseStatic);",
    "  float f = sm(clamp(uForm * 1.4 - aRandom * 0.4, 0.0, 1.0));",
    "  vec3 pos = mix(start, aTarget, f);",
    "  float sw = sin(f * 3.14159) * 0.9;",
    "  pos.x += sin(aRandom * 40.0 + uTime * 0.9) * sw;",
    "  pos.z += cos(aRandom * 40.0 + uTime * 0.9) * sw;",
    "  pos.y += sin(uTime + aTarget.x * 3.0 + aRandom * 5.0) * 0.03 * f;",
    "  pos += normalize(aScatter + 0.0001) * uExplode * (3.0 + aRandom * 12.0);",
    "  pos.y += uRise * (1.5 + aRandom * 9.0);",
    "  pos.x += uRise * sin(aRandom * 50.0) * 1.2;",
    "  vec4 world = uModel * vec4(pos, 1.0);",
    "  if (uMouseOn > 0.001) {",
    "    vec3 d3 = world.xyz - uMouse; d3.z *= 0.35; float d = length(d3);",
    "    if (d < 2.5) { float k = smoothstep(0.0, 1.0, (2.5 - d) / 2.5); world.xyz += normalize(d3 + 0.0001) * k * (0.9 + aRandom * 1.6) * uMouseOn; }",
    "  }",
    "  vec4 mv = uView * world;",
    "  gl_Position = uProj * mv;",
    "  gl_PointSize = uSize * uDpr * (1.6 + aRandom * 4.4) * (12.0 / max(-mv.z, 0.5));",
    "  vec3 c = aColor;",
    "  float tw = sin(uTime * (2.0 + aRandom * 4.0) + aRandom * 100.0) * 0.5 + 0.5;",
    "  if (aRandom > 0.94) c = mix(c, vec3(1.0, 0.97, 0.86), tw * 0.85 * (1.0 - uLight));",
    "  vColor = c; vAlpha = 0.5 + 0.5 * aRandom;",
    "}"
  ].join("\n");

  const FS = [
    "precision mediump float;",
    "uniform float uAlpha, uAdditive, uLightF;",
    "varying vec3 vColor; varying float vAlpha;",
    "void main(){",
    "  vec2 xy = gl_PointCoord - 0.5; float d = length(xy); if (d > 0.5) discard;",
    "  float soft = pow(1.0 - d * 2.0, mix(1.2, 0.85, uLightF));",
    "  float a = vAlpha * soft * uAlpha * mix(1.0, 0.82, uLightF);",
    "  vec3 col = mix(vColor, vColor * 0.9, uLightF);",
    /* premultiplied output: alpha 0 => additive glow, alpha a => normal blend */
    "  gl_FragColor = vec4(col * a, a * (1.0 - uAdditive));",
    "}"
  ].join("\n");

  /* --- tiny matrix helpers (column-major) --- */
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(ex, ey, ez) {
    // camera at (ex,ey,ez) looking at origin, up = +y
    let zx = ex, zy = ey, zz = ez; let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = zz, xy = 0, xz = -zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xz /= l;   // up x z
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1]);
  }
  function rotYX(ry, rx) {
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    // R = Ry * Rx
    return new Float32Array([cy, 0, -sy, 0, sy * sx, cx, cy * sx, 0, sy * cx, -sx, cy * cx, 0, 0, 0, 0, 1]);
  }

  function LumantaParticles(canvas, opts) {
    this.canvas = canvas;
    this.opts = Object.assign({ count: 72000, dprMax: 2, fov: 60 }, opts || {});
    this.u = { time: 0, burst: 0, form: 0, useStatic: 0, staticAmt: 0, explode: 0, rise: 0, size: 1, alpha: 1, additive: 1, light: 0, mouseOn: 0 };
    this.cam = { z: 15, y: 0, ry: 0, rx: 0 };
    this.mouse = { x: 0, y: 0, z: 0, has: false, ndcX: 0, ndcY: 0, sx: 0, sy: 0, k: 0, init: false };
    this.running = false;
    this.ok = false;
    this._t0 = performance.now();
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance" });
    if (!gl) return;
    this.gl = gl;
    this.ok = this._initProgram();
    this._onResize = this.resize.bind(this);
    window.addEventListener("resize", this._onResize);
  }

  LumantaParticles.prototype._initProgram = function () {
    const gl = this.gl;
    function sh(type, src) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
    if (!v || !f) return false;
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return false; }
    this.prog = p;
    this.loc = {};
    ["uProj", "uView", "uModel", "uTime", "uBurst", "uForm", "uUseStatic", "uStatic", "uExplode", "uRise", "uSize", "uDpr", "uMouseOn", "uMouse", "uAlpha", "uAdditive", "uLight", "uLightF"].forEach(function (n) {
      this.loc[n] = gl.getUniformLocation(p, n);
    }, this);
    return true;
  };

  LumantaParticles.prototype.setData = function (data) {
    if (!this.ok) return;
    const gl = this.gl, n = Math.min(this.opts.count, data.count);
    this.n = n;
    const scatter = new Float32Array(n * 3), stat = new Float32Array(n * 3), rnd = new Float32Array(n), col = new Float32Array(n * 3);
    const aspect = Math.max(1, (this.canvas.clientWidth || innerWidth) / (this.canvas.clientHeight || innerHeight));
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const u = Math.random(), v = Math.random(), th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1), r = 3 + Math.random() * 10;
      scatter[i3] = r * Math.sin(ph) * Math.cos(th); scatter[i3 + 1] = r * Math.sin(ph) * Math.sin(th); scatter[i3 + 2] = r * Math.cos(ph);
      stat[i3] = (Math.random() * 2 - 1) * 9.5 * aspect; stat[i3 + 1] = (Math.random() * 2 - 1) * 7.5; stat[i3 + 2] = (Math.random() * 2 - 1) * 5;
      rnd[i] = Math.random();
      col[i3] = data.col[i3] / 255; col[i3 + 1] = data.col[i3 + 1] / 255; col[i3 + 2] = data.col[i3 + 2] / 255;
    }
    const self = this;
    function attr(name, arr, size) {
      const loc = gl.getAttribLocation(self.prog, name); if (loc < 0) return;
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    gl.useProgram(this.prog);
    attr("aTarget", data.pos.subarray(0, n * 3), 3);
    attr("aScatter", scatter, 3);
    attr("aStatic", stat, 3);
    attr("aColor", col, 3);
    attr("aRandom", rnd, 1);
    this.resize();
  };

  LumantaParticles.prototype.resize = function () {
    if (!this.ok) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.dprMax);
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.dpr = dpr; this.w = w; this.h = h; this.aspect = w / h;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };

  /* Camera distance that keeps the ~7.8 x 8 unit logomark comfortably in frame */
  LumantaParticles.prototype.fitZ = function (fill) {
    const t = Math.tan((this.opts.fov * Math.PI / 180) / 2);
    const zH = 8 / (2 * t * fill), zW = 7.8 / (2 * t * (this.aspect || 1) * fill);
    return Math.max(zH, zW);
  };

  LumantaParticles.prototype.setMouse = function (clientX, clientY) {
    if (!this.ok) return;
    const r = this.canvas.getBoundingClientRect();
    this.mouse.ndcX = ((clientX - r.left) / r.width) * 2 - 1;
    this.mouse.ndcY = -((clientY - r.top) / r.height) * 2 + 1;
    this.mouse.has = true;
  };

  LumantaParticles.prototype.render = function () {
    if (!this.ok || !this.n) return;
    const gl = this.gl, u = this.u, L = this.loc;
    u.time = (performance.now() - this._t0) / 1000;
    const fov = this.opts.fov * Math.PI / 180;
    const ey = this.cam.y, ez = this.cam.z;
    const proj = perspective(fov, this.aspect, 0.1, 200);
    const view = lookAt(0.0001, ey, ez);
    const model = rotYX(this.cam.ry, this.cam.rx);
    // mouse -> world point on z = 0 plane
    if (this.mouse.has) {
      const t = Math.tan(fov / 2);
      const dx = this.mouse.ndcX * t * this.aspect, dy = this.mouse.ndcY * t;
      // camera basis (looking at origin from (0,ey,ez))
      const l = Math.hypot(ey, ez), fz = -ez / l, fy = -ey / l;      // forward
      const uy = ez / l, uz = -ey / l;                                  // up (x=0)
      const ry = dy * uy + fy, rz = dy * uz + fz, rx = dx;              // ray dir
      const s = -ez / rz;
      this.mouse.x = rx * s; this.mouse.y = ey + ry * s; this.mouse.z = 0;
      if (!this.mouse.init) { this.mouse.sx = this.mouse.x; this.mouse.sy = this.mouse.y; this.mouse.init = true; }
    }
    // ease the pointer position and its strength so taps and drags glide in and out
    this.mouse.sx += (this.mouse.x - this.mouse.sx) * 0.2;
    this.mouse.sy += (this.mouse.y - this.mouse.sy) * 0.2;
    this.mouse.k += ((this.mouse.has ? 1 : 0) - this.mouse.k) * (this.mouse.has ? 0.12 : 0.06);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(L.uProj, false, proj);
    gl.uniformMatrix4fv(L.uView, false, view);
    gl.uniformMatrix4fv(L.uModel, false, model);
    gl.uniform1f(L.uTime, u.time); gl.uniform1f(L.uBurst, u.burst); gl.uniform1f(L.uForm, u.form);
    gl.uniform1f(L.uUseStatic, u.useStatic); gl.uniform1f(L.uStatic, u.staticAmt); gl.uniform1f(L.uExplode, u.explode);
    gl.uniform1f(L.uRise, u.rise); gl.uniform1f(L.uSize, u.size); gl.uniform1f(L.uDpr, this.dpr);
    gl.uniform1f(L.uMouseOn, u.mouseOn * this.mouse.k); gl.uniform3f(L.uMouse, this.mouse.sx, this.mouse.sy, 0);
    gl.uniform1f(L.uAlpha, u.alpha); gl.uniform1f(L.uAdditive, u.additive); gl.uniform1f(L.uLight, u.light); gl.uniform1f(L.uLightF, u.light);
    gl.drawArrays(gl.POINTS, 0, this.n);
  };

  LumantaParticles.prototype.start = function (onFrame) {
    if (this.running || !this.ok) return;
    this.running = true;
    const self = this;
    (function loop() {
      if (!self.running) return;
      if (onFrame) onFrame(self);
      self.render();
      self._raf = requestAnimationFrame(loop);
    })();
  };
  LumantaParticles.prototype.stop = function () { this.running = false; cancelAnimationFrame(this._raf); };
  LumantaParticles.prototype.destroy = function () {
    this.stop(); window.removeEventListener("resize", this._onResize);
    const ext = this.gl && this.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext();
  };

  window.LumantaParticles = LumantaParticles;
  window.loadParticleData = loadParticleData;
})();
