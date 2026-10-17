/* Волны по воде на фоновых скетчах магазина.

   Та же идея, что у живого фона портфолио (js/bgfx.js): картинка рисуется в WebGL, и
   рядом с курсором её точки берутся со смещением — расходится кольцо, как от капли.
   Отличия от портфолио: здесь не один холст на всю страницу, а свой на каждый скетч,
   и работают только волны, без линзы, — рисунки бледные, и постоянное увеличение на
   них читалось бы как грязь.

   Курсор ловится глобально, а не на самих холстах: скетчи лежат под контентом
   (z-index: -1, pointer-events: none), и события до них не доходят — поэтому просто
   сравниваем координаты курсора с прямоугольником каждого скетча.

   Если WebGL нет, курсора нет (телефон) или человек просил меньше анимаций, скрипт
   молча выходит — на странице остаются обычные <img>. */
(function () {
  var RIPPLE_MAX = 6;          // сколько волн живёт на одном скетче
  var RIPPLE_SPEED = 420;      // скорость фронта, px/сек
  var RIPPLE_AMP = 9;          // высота волны в пикселях смещения
  var RIPPLE_WAVELENGTH = 46;  // длина волны, px
  var RIPPLE_WIDTH = 70;       // толщина кольца вокруг фронта
  var RIPPLE_DECAY = 1.7;      // затухание, 1/сек
  var RIPPLE_LIFE = 2.6;       // сколько секунд живёт волна
  var SPEED_TO_RIPPLE = 0.6;   // порог скорости курсора, px/мс
  var SPAWN_INTERVAL = 70;     // не чаще, чем раз в столько мс
  var ENTER_POWER = 1.0;       // сила волны в момент, когда курсор вошёл на рисунок
  var CLICK_POWER = 1.6;

  if (!window.matchMedia) return;
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  // Длина цикла должна быть известна заранее — требование GLSL ES 1.0.
  var FRAG = [
    'precision highp float;',
    'uniform sampler2D uTex;',
    'uniform vec2 uSize;',   // размер картинки в css-пикселях
    'uniform float uTime;',
    'uniform vec4 uRipples[' + RIPPLE_MAX + '];',  // x, y, время рождения, сила
    'varying vec2 vUv;',
    'void main(){',
    '  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uSize;',
    '  vec2 shift = vec2(0.0);',
    '  for (int i = 0; i < ' + RIPPLE_MAX + '; i++) {',
    '    vec4 rip = uRipples[i];',
    '    if (rip.w <= 0.0) continue;',
    '    float age = uTime - rip.z;',
    '    if (age < 0.0 || age > ' + RIPPLE_LIFE.toFixed(1) + ') continue;',
    '    vec2 toR = px - rip.xy;',
    '    float d = length(toR);',
    '    if (d < 0.001) continue;',
    '    float front = age * ' + RIPPLE_SPEED.toFixed(1) + ';',
    '    float off = d - front;',
    '    float env = exp(-abs(off) / ' + RIPPLE_WIDTH.toFixed(1) + ') * exp(-age * ' + RIPPLE_DECAY.toFixed(2) + ');',
    '    float wave = sin(off * ' + (6.2831853 / RIPPLE_WAVELENGTH).toFixed(5) + ');',
    '    shift += (toR / d) * wave * env * rip.w * ' + RIPPLE_AMP.toFixed(1) + ';',
    '  }',
    // px уже сверху вниз, и у текстуры из <img> строка 0 — тоже верхняя, поэтому
    // переворачивать координату не нужно.
    '  vec2 uv = (px + shift) / uSize;',
    // За краями картинки брать нечего: там прозрачно, иначе край размазался бы.
    '  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0); return; }',
    '  gl_FragColor = texture2D(uTex, uv);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('shop-ripple shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  // Один скетч: холст вместо <img>, текстура из него же и свой набор волн.
  function makeSketch(img) {
    var rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    var canvas = document.createElement('canvas');
    canvas.className = img.className;
    canvas.setAttribute('aria-hidden', 'true');
    // Размер буфера задаём ДО вставки: у .shop-decor ширина в процентах, а высота
    // auto, и у холста она берётся из пропорций буфера. С дефолтными 300×150 первый
    // кадр встал бы не по месту, а замер после него дал бы уже неверную высоту.
    var dpr0 = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr0);
    canvas.height = Math.round(rect.height * dpr0);

    var gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: false });
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var u = {};
    ['uTex', 'uSize', 'uTime', 'uRipples'].forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Картинки произвольного размера (не степень двойки) — только CLAMP и LINEAR,
    // мипмапы для таких WebGL 1 не умеет.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    img.replaceWith(canvas);

    var sk = {
      canvas: canvas, gl: gl, prog: prog, u: u, tex: tex,
      ripples: new Float32Array(RIPPLE_MAX * 4),
      ripIndex: 0, running: false, inside: false, lastSpawn: 0, t0: performance.now(),
      w: 0, h: 0
    };

    var lastW = -1;
    sk.resize = function () {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // Реагируем только на смену ширины: высоту меняем сами (через пропорции
      // буфера), и наблюдатель иначе будил бы сам себя.
      if (Math.abs(r.width - lastW) < 0.5) { sk.draw(); return; }
      lastW = r.width;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      sk.w = r.width; sk.h = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      sk.draw();
    };

    sk.draw = function () {
      gl.useProgram(prog);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(u.uTex, 0);
      gl.uniform2f(u.uSize, sk.w, sk.h);
      gl.uniform1f(u.uTime, (performance.now() - sk.t0) / 1000);
      gl.uniform4fv(u.uRipples, sk.ripples);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    sk.spawn = function (x, y, power) {
      var o = sk.ripIndex * 4;
      sk.ripples[o] = x;
      sk.ripples[o + 1] = y;
      sk.ripples[o + 2] = (performance.now() - sk.t0) / 1000;
      sk.ripples[o + 3] = power;
      sk.ripIndex = (sk.ripIndex + 1) % RIPPLE_MAX;
      sk.kick();
    };

    sk.frame = function () {
      var time = (performance.now() - sk.t0) / 1000;
      var alive = false;
      for (var i = 0; i < RIPPLE_MAX; i++) {
        if (sk.ripples[i * 4 + 3] > 0) {
          if (time - sk.ripples[i * 4 + 2] > RIPPLE_LIFE) sk.ripples[i * 4 + 3] = 0;
          else alive = true;
        }
      }
      sk.draw();
      if (alive) requestAnimationFrame(sk.frame);
      else {
        // Последний кадр — начисто, иначе на экране застынет недорисованная волна.
        sk.draw();
        sk.running = false;
      }
    };

    sk.kick = function () {
      if (sk.running) return;
      sk.running = true;
      requestAnimationFrame(sk.frame);
    };

    sk.resize();
    if ('ResizeObserver' in window) new ResizeObserver(sk.resize).observe(canvas);
    return sk;
  }

  function init() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('img.shop-decor'));
    if (!imgs.length) return;

    var sketches = [];
    var ready = 0;
    imgs.forEach(function (img) {
      function build() {
        var sk = makeSketch(img);
        if (sk) sketches.push(sk);
        ready++;
      }
      if (img.complete && img.naturalWidth) build();
      else img.addEventListener('load', build, { once: true });
    });

    var last = null;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var now = performance.now();
      var speed = 0;
      if (last) {
        var dt = now - last[2];
        if (dt > 0) speed = Math.hypot(e.clientX - last[0], e.clientY - last[1]) / dt;
      }
      last = [e.clientX, e.clientY, now];

      sketches.forEach(function (sk) {
        var r = sk.canvas.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
        if (inside && !sk.inside) {
          // Курсор только что вошёл на рисунок — та самая «капля».
          sk.spawn(x, y, ENTER_POWER);
          sk.lastSpawn = now;
        } else if (inside && speed > SPEED_TO_RIPPLE && now - sk.lastSpawn > SPAWN_INTERVAL) {
          var s = Math.min((speed - SPEED_TO_RIPPLE) / 2.5, 1);
          sk.spawn(x, y, 0.35 + s * 0.65);
          sk.lastSpawn = now;
        }
        sk.inside = inside;
      });
    }, { passive: true });

    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      sketches.forEach(function (sk) {
        var r = sk.canvas.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) sk.spawn(x, y, CLICK_POWER);
      });
    }, { passive: true });

    window.addEventListener('resize', function () {
      sketches.forEach(function (sk) { sk.resize(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
