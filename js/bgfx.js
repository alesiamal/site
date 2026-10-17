/* Живой фон: паттерн рисуется в WebGL-холст под страницей, и рядом с курсором
   искажается — линза радиусом 100px плюс волны, как по воде, если вести курсор
   быстро.

   Почему WebGL, а не CSS: искажение нужно попиксельное (каждая точка фона берётся
   из смещённого места картинки), а CSS умеет двигать только элемент целиком.
   Холст лежит на z-index: -1, кликам не мешает, и пока он работает, фоновая
   картинка у body выключается (класс bgfx-on) — иначе паттерн рисовался бы дважды.

   Если WebGL нет, курсора нет (телефон) или человек просил меньше анимаций —
   скрипт молча выходит, и остаётся обычный фон из CSS. */
(function () {
  var PATTERN = 'assets/pattern.svg';
  var TILE_PX = 2048;          // растр паттерна: степень двойки, иначе WebGL не умеет повтор
  var FISH_RADIUS = 100;       // радиус линзы вокруг курсора, px
  var FISH_STRENGTH = 1.0;     // насколько сильно линза увеличивает
  var CLICK_POWER = 2.0;       // сила волны от клика — больше, чем от быстрого движения
  var RIPPLE_MAX = 8;          // сколько волн живёт одновременно
  var RIPPLE_SPEED = 420;      // скорость фронта волны, px/сек
  var RIPPLE_AMP = 7;          // высота волны в пикселях смещения
  var RIPPLE_WAVELENGTH = 46;  // длина волны, px
  var RIPPLE_WIDTH = 70;       // толщина «кольца» вокруг фронта
  var RIPPLE_DECAY = 1.7;      // затухание, 1/сек
  var RIPPLE_LIFE = 2.6;       // сколько секунд волна живёт
  var SPEED_TO_RIPPLE = 0.9;   // порог скорости курсора, px/мс
  var SPAWN_INTERVAL = 55;     // не чаще, чем раз в столько мс
  var IDLE_AFTER = 120;        // мс покоя курсора, после которых линза уезжает

  if (!window.matchMedia) return;
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'bgfx';
  canvas.setAttribute('aria-hidden', 'true');

  var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
  if (!gl) return;

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  // Волн в цикле ровно RIPPLE_MAX: в GLSL ES 1.0 цикл обязан иметь известную длину.
  var FRAG = [
    'precision highp float;',
    'uniform sampler2D uTex;',
    'uniform vec2 uRes;',        // размер холста в устройствах пикселях
    'uniform float uDpr;',
    'uniform float uTile;',      // сторона плитки в css-пикселях = ширина страницы
    'uniform float uScroll;',
    'uniform vec2 uMouse;',
    'uniform float uFish;',
    'uniform float uTime;',
    'uniform vec4 uRipples[' + RIPPLE_MAX + '];',  // x, y, время рождения, сила
    'void main(){',
    '  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;',
    '  vec2 shift = vec2(0.0);',
    // Линза: точку рядом с курсором берём ближе к его центру — то, что под курсором,
    // растягивается. К краю радиуса эффект сходит на нет, поэтому шва не видно.
    '  vec2 toMouse = px - uMouse;',
    '  float r = length(toMouse);',
    '  if (r < ' + FISH_RADIUS.toFixed(1) + ' && uFish > 0.0) {',
    '    float k = 1.0 - (r / ' + FISH_RADIUS.toFixed(1) + ');',
    '    k = k * k;',
    '    shift -= toMouse * k * uFish;',
    '  }',
    // Волны: кольцо расходится от места, где курсор дёрнулся, синус даёт гребень и
    // впадину, экспоненты гасят его и по расстоянию от фронта, и со временем.
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
    '  vec2 uv = vec2(px.x + shift.x, px.y + shift.y + uScroll) / uTile;',
    '  gl_FragColor = texture2D(uTex, uv);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('bgfx shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('bgfx link:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // Два треугольника на весь экран — вся работа происходит во фрагментном шейдере.
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var u = {};
  ['uTex', 'uRes', 'uDpr', 'uTile', 'uScroll', 'uMouse', 'uFish', 'uTime', 'uRipples']
    .forEach(function (name) { u[name] = gl.getUniformLocation(prog, name); });

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  // Заглушка, пока паттерн не загрузился: один белый пиксель, чтобы не было чёрного
  // экрана, если картинка придёт с задержкой.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255]));

  var ready = false;
  var img = new Image();
  img.onload = function () {
    // SVG растрируем сами: браузеру нужен явный размер, а сторона 2048 (степень
    // двойки) позволяет включить повтор текстуры и мипмапы.
    var c = document.createElement('canvas');
    c.width = c.height = TILE_PX;
    c.getContext('2d').drawImage(img, 0, 0, TILE_PX, TILE_PX);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    ready = true;
    document.documentElement.classList.add('bgfx-on');
    dirty = true;
    kick();
  };
  img.onerror = function () { /* остаётся фон из CSS */ };
  img.src = PATTERN;

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(canvas);
  });
  if (document.body) document.body.appendChild(canvas);

  var dpr = 1, tile = 0, scroll = 0;
  var mouse = [-9999, -9999], fish = 0;
  var ripples = new Float32Array(RIPPLE_MAX * 4);
  var ripIndex = 0;
  var lastMove = 0, lastSpawn = 0, lastPos = null;
  var t0 = performance.now();
  var dirty = true, running = false, clean = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    tile = w;                      // плитка ровно в ширину страницы
    gl.viewport(0, 0, canvas.width, canvas.height);
    dirty = true;
    kick();
  }

  function frame() {
    var now = performance.now();
    var time = (now - t0) / 1000;

    // Линза появляется, пока курсор движется, и плавно уезжает, когда он замер, —
    // иначе она зависала бы пятном на пустом месте.
    var target = (now - lastMove < IDLE_AFTER) ? 1 : 0;
    var next = fish + (target - fish) * 0.12;
    if (Math.abs(next - fish) > 0.001) dirty = true;
    fish = next;

    var alive = false;
    for (var i = 0; i < RIPPLE_MAX; i++) {
      if (ripples[i * 4 + 3] > 0) {
        if (time - ripples[i * 4 + 2] > RIPPLE_LIFE) ripples[i * 4 + 3] = 0;
        else alive = true;
      }
    }

    if (dirty || alive) {
      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(u.uTex, 0);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform1f(u.uTile, tile);
      gl.uniform1f(u.uScroll, scroll);
      gl.uniform2f(u.uMouse, mouse[0], mouse[1]);
      gl.uniform1f(u.uFish, fish * FISH_STRENGTH);
      gl.uniform1f(u.uTime, time);
      gl.uniform4fv(u.uRipples, ripples);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      dirty = false;
    }

    // Крутим цикл, только пока есть что показывать: живые волны, уезжающая линза или
    // новый скролл. В покое кадры не тратятся совсем.
    if (alive || fish > 0.002 || dirty) {
      requestAnimationFrame(frame);
    } else if (!clean) {
      // Последний кадр рисуем начисто: иначе на экране застыл бы тот момент, на
      // котором цикл остановился, — с недорисованной волной и остатком линзы.
      for (var j = 0; j < RIPPLE_MAX; j++) ripples[j * 4 + 3] = 0;
      fish = 0;
      clean = true;
      dirty = true;
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  // Волны лежат в кольцевом буфере: девятая затирает самую старую.
  function spawn(x, y, power) {
    var o = ripIndex * 4;
    ripples[o] = x;
    ripples[o + 1] = y;
    ripples[o + 2] = (performance.now() - t0) / 1000;
    ripples[o + 3] = power;
    ripIndex = (ripIndex + 1) % RIPPLE_MAX;
  }

  function kick() {
    clean = false;
    if (!ready || running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('scroll', function () {
    scroll = window.scrollY || window.pageYOffset || 0;
    dirty = true;
    kick();
  }, { passive: true });

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    var now = performance.now();
    mouse[0] = e.clientX;
    mouse[1] = e.clientY;
    lastMove = now;
    dirty = true;

    if (lastPos) {
      var dt = now - lastPos[2];
      if (dt > 0) {
        var speed = Math.hypot(e.clientX - lastPos[0], e.clientY - lastPos[1]) / dt;
        // Резкое движение роняет в воду каплю. Сила растёт со скоростью, но упирается
        // в потолок, иначе один рывок мышью залил бы весь экран волнами.
        if (speed > SPEED_TO_RIPPLE && now - lastSpawn > SPAWN_INTERVAL) {
          lastSpawn = now;
          var s = Math.min((speed - SPEED_TO_RIPPLE) / 2.5, 1);
          spawn(e.clientX, e.clientY, 0.35 + s * 0.65);
        }
      }
    }
    lastPos = [e.clientX, e.clientY, now];
    kick();
  }, { passive: true });

  // Клик роняет каплю и там, где курсор стоит неподвижно: волна сильнее, чем от
  // быстрого движения, и линза на миг просыпается, чтобы было видно, откуда пошло.
  window.addEventListener('pointerdown', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mouse[0] = e.clientX;
    mouse[1] = e.clientY;
    lastMove = performance.now();
    spawn(e.clientX, e.clientY, CLICK_POWER);
    dirty = true;
    kick();
  }, { passive: true });

  window.addEventListener('pointerleave', function () { lastMove = 0; kick(); });

  resize();
  scroll = window.scrollY || 0;
})();
