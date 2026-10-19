(function () {
  // Keep the background glow exactly as tall as the real page, so it always reaches
  // the bottom without ever forcing extra blank scroll space.
  var bgGlow = document.querySelector('.bg-glow');
  function sizeBgGlow() {
    if (!bgGlow) return;
    // Мерить и выставлять высоту нужно мгновенно. Если на элементе остался незакрытый
    // transition (его вешает animateBgGlowTo), промежуточное height:0 поехало бы
    // анимацией, и фон на глазах схлопнулся бы в ноль и обратно.
    bgGlow.style.transition = 'none';
    // Measure the real content height with the glow's own height taken out of the
    // equation first — otherwise scrollHeight includes the glow's *previous* size,
    // and the height can only ever grow, never shrink back down.
    bgGlow.style.height = '0px';
    var trueHeight = document.documentElement.scrollHeight;
    bgGlow.style.height = trueHeight + 'px';
    void bgGlow.offsetHeight; // снимок должен примениться до того, как вернём переходы
    bgGlow.style.transition = '';
  }

  // Ведёт фон к новой высоте плавно, в одном темпе с раскрывающейся/схлопывающейся сеткой.
  //
  // Зачем: у .bg-glow все background-position заданы в процентах, а проценты в фоновой
  // позиции резолвятся от (высота бокса − высота градиента). То есть любое изменение
  // высоты бокса сдвигает каждый слой по вертикали — верхний примерно на 18px, нижний
  // (120%) больше чем на 400px. Раньше sizeBgGlow дёргался один раз, в самом конце
  // сворачивания, и весь этот сдвиг случался за один кадр: сетка уезжала плавно, а фон
  // под ней прыгал. Теперь высота едет вместе с сеткой, и прыжка нет.
  function animateBgGlowTo(target, ms) {
    if (!bgGlow) return;
    var from = parseFloat(bgGlow.style.height) || document.documentElement.scrollHeight;
    if (Math.abs(target - from) < 1) return;
    bgGlow.style.transition = 'none';
    bgGlow.style.height = from + 'px';
    void bgGlow.offsetHeight; // стартовое состояние должно отрисоваться до включения перехода
    bgGlow.style.transition = 'height ' + ms + 'ms ease'; // та же кривая, что у сетки
    bgGlow.style.height = target + 'px';
  }

  // Высота страницы в том состоянии, в котором она окажется после анимации.
  //
  // Складывать дельты (сетка + подмена кнопок) не годится: кнопки "смотреть ещё" и
  // "скрыть" разной высоты, между секциями схлопываются отступы, и сумма расходится
  // с фактом на десяток-другой пикселей — как раз настолько фон и промахивался бы,
  // а в конце дёргался. Поэтому просто на миг приводим страницу в конечное состояние
  // и меряем по-настоящему. Всё синхронно: отрисоваться между этими строками браузер
  // не успевает, так что мигания нет.
  //
  // Сам фон на время замера обнуляется по той же причине, что и в sizeBgGlow: иначе
  // он войдёт в scrollHeight своим прежним размером и высота сможет только расти.
  function pageHeightAfter(apply, revert) {
    var prevHeight = bgGlow ? bgGlow.style.height : null;
    if (bgGlow) {
      bgGlow.style.transition = 'none';
      bgGlow.style.height = '0px';
    }
    apply();
    var h = document.documentElement.scrollHeight;
    revert();
    if (bgGlow) bgGlow.style.height = prevHeight;
    return h;
  }
  sizeBgGlow();
  window.addEventListener('load', sizeBgGlow);
  window.addEventListener('resize', sizeBgGlow);


  // ---------- Единый слой указателя: мышь и палец ----------
  // Все интерактивы на странице читают одно и то же — координаты указателя. Чтобы не
  // дублировать в каждом по четыре слушателя, они подписываются здесь.
  //
  // ПРО СКРОЛЛ. preventDefault не зовём нигде и намеренно. Все эти эффекты
  // горизонтальные, а у body стоит overflow-x: hidden — значит горизонтальный свайп и
  // так ничего не прокручивает, и отбирать у браузера жест не за чем. Вертикальный
  // свайп при этом продолжает листать страницу: эффекты просто отыгрывают под пальцем
  // по дороге. Блокировать скролл на узкой мобильной странице — значит отобрать у
  // человека единственный способ листать, и он решит, что сайт завис.
  //
  // ПРО ПРИЗРАЧНУЮ МЫШЬ. После touchend браузер досылает синтетические mousemove/
  // mouseenter в точке отрыва пальца. Без защиты они заново включали бы эффект сразу
  // после того, как мы его погасили, — и он застревал бы включённым навсегда, потому
  // что настоящих mousemove на телефоне больше не будет. Отсюда окно в 700мс, в
  // течение которого мышиные события игнорируются.
  // Слой указателя и «убегание» живут в js/pointer.js — им пользуется и магазин.
  var isGhostMouse = Pointer.isGhostMouse;
  var onPointerMove = Pointer.onMove;
  var onPointerEnd = Pointer.onEnd;
  var initDodge = Pointer.dodge;

  var logoLink = document.querySelector('.logo');
  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var footerLogo = document.querySelector('.footer__logo');
  if (footerLogo) {
    footerLogo.style.cursor = 'pointer';
    footerLogo.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Whichever letter/shape the mascot is currently sitting on (set by initMascotCycle,
  // read by initHeroLetterDodge) — shared across both so the mascot rides along when
  // its anchor dodges.
  var mascotAnchorEl = null;

  // ---------- Logo nav panel ----------
  // Desktop reveals it on hover via pure CSS (:hover / :focus-within on .logo-wrap).
  // Touch devices have no hover to rely on, so tapping the logo toggles it instead,
  // and tapping anywhere else closes it.
  (function initLogoNav() {
    var logoWrap = document.querySelector('.logo-wrap');
    if (!logoWrap || !logoLink) return;
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover) return;

    logoLink.addEventListener('click', function () {
      logoWrap.classList.toggle('is-nav-open');
    });

    document.addEventListener('click', function (e) {
      if (!logoWrap.contains(e.target)) {
        logoWrap.classList.remove('is-nav-open');
      }
    });
  })();

  // ---------- "Dodge" effect ----------
  // When the cursor comes within ZONE px of a "zone" footprint, the element slides
  // away from the cursor, up to DODGE px. The zone defaults to the element's own
  // footprint, but a separate, larger zoneEl can be passed — the logo uses its nav
  // panel's footprint, so it keeps dodging anywhere the panel covers, not just close
  // to the logo itself.
  // Expanding/collapsing a portfolio grid ("смотреть ещё"/"скрыть") shifts every
  // section below it up or down the page, which silently staled the cached rest
  // position of any dodge below that point — its hit-zone kept checking against
  // where the title used to be. Collecting each instance's measureRest here lets
  // the grid toggle handlers force a fresh measurement right when that happens
  // (see remeasureDodges below), instead of waiting for the next window resize.
  var dodgeRemeasureFns = [];
  document.querySelectorAll('.portfolio__title').forEach(function (title) {
    dodgeRemeasureFns.push(initDodge(title, 50));
  });
  dodgeRemeasureFns.push(initDodge(document.querySelector('.footer__logo')));

  function remeasureDodges() {
    dodgeRemeasureFns.forEach(function (fn) { if (fn) fn(); });
  }

  // Додж лого (две зоны) живёт в pointer.js — он нужен и магазину.
  Pointer.logoDodge();

  // ---------- Hero mascot: 6-position cycle ----------
  // Six fixed spots around "ЗАИСЬ" (see the matching comment in style.css for how
  // they line up with the letters/shapes). Each is in em relative to .hero__title's
  // own box, so the mascot stays anchored to the same spot on the text at every
  // breakpoint. On hover (mouse) or tap (touch) it jumps straight to the next one,
  // looping back to the first after the last.
  (function initMascotCycle() {
    var mascot = document.querySelector('.hero__mascot');
    var letters = document.querySelectorAll('.hero__letter'); // [З, А, И, С, Ь]
    var circleDeco = document.querySelector('.deco--circle');
    var diamondDeco = document.querySelector('.deco--diamond');
    if (!mascot || letters.length < 5) return;

    // left values are relative to .hero__title-inner (which hugs the text tightly and
    // scales 1:1 with font-size), not .hero__title itself (which stretches to fill its
    // container independently of font-size — anchoring to it drifted at other breakpoints).
    // `anchor` is the letter/shape the mascot is currently sitting on — initHeroLetterDodge
    // mirrors that element's own --dodge-x onto the mascot too, so it moves along with
    // whatever it's perched on instead of staying put while the letter dodges out from under it.
    // Re-tuned for Soledago: the previous values were measured off Moula's letter
    // widths, and swapping the typeface moved every letter's left edge (Soledago's
    // "ЗАИСЬ" is ~4.14em wide against Moula's ~5.9em at the same font-size), which
    // left the mascot landing in empty space past the end of the word. Left values
    // below centre it on each glyph's own box: З 0–0.48em, А 0.49–1.11em,
    // И 2.33–3.01em, С 3.02–3.57em, Ь 3.58–4.14em, circle 1.74–2.29em.
    // ТОЧКИ, ПО КОТОРЫМ ПРЫГАЕТ МАСКОТ. Править руками можно прямо здесь.
    // left/top — в em от левого верхнего угла .hero__title-inner (коробка, плотно
    // обнимающая надпись), rotate — наклон фигурки в градусах, anchor — буква или
    // фигура, на которой она сидит (нужен для «убегания»: маскот едет вместе с ней).
    // Первая строка таблицы — стартовая точка, её же дублирует style.css на случай,
    // если скрипт ещё не отработал.
    var MASCOT_WAYPOINTS_RU = [
      { left: '3.75em', top: '0.05em', rotate: 0, anchor: letters[4] },    // A — on "Ь"
      { left: '0.5em', top: '0.7em', rotate: 180, anchor: letters[1] },  // B — on "А"
      { left: '2.42em', top: '0.0em', rotate: -55, anchor: letters[2] },   // C — on "И"
      { left: '0.01em', top: '0.3em', rotate: 15, anchor: letters[0] },   // D — on "З"
      { left: '3.18em', top: '0.3em', rotate: 0, anchor: letters[3] },    // E — on "С"
      // F — на круг-фигуре. 1.85 − 0.039: круг сдвинут влево на --deco-nudge (см. style.css),
      // а transform не меняет раскладку, поэтому маскот надо увести за ним вручную,
      // иначе он сядет мимо центра фигуры.
      { left: '1.811em', top: '0.283em', rotate: 0, anchor: circleDeco }
    ];

    // Английская версия — своя таблица: слово другое (F ◆ KIN G ●), букв шесть, и
    // стоят они в других местах. Буквы здесь: 0 — F, 1 — K, 2 — I, 3 — N, 4 — пробел,
    // 5 — G. Их коробки в em (при тех же шрифтах): F 0–0.51, ромб 0.58–1.13,
    // K 1.14–1.75, I 1.76–2.00, N 2.01–2.70, G 2.92–3.48, круг 3.48–4.03.
    // Ширина самой фигурки — 0.333em, поэтому «по центру буквы» = её левый край
    // плюс (ширина буквы − 0.333) / 2. На фигурах держи поправку на --deco-nudge
    // (ромб +0.03em, круг −0.039em): фигуры сдвинуты трансформом, а он раскладку не
    // меняет, и без поправки маскот сядет мимо центра.
    var MASCOT_WAYPOINTS_EN = [
      { left: '3.1em', top: '0.1em', rotate: 0, anchor: letters[5] },     // A — на "G"
      { left: '1.2em', top: '0.6em', rotate: 230, anchor: letters[1] },  // B — на "K"
      { left: '2.16em', top: '0.0em', rotate: -65, anchor: letters[3] },   // C — на "N"
      { left: '0.15em', top: '0.075em', rotate: 0, anchor: letters[0] },   // D — на "F"
      { left: '0.65em', top: '0.24em', rotate: 0, anchor: diamondDeco },   // E — на ромбе
      { left: '3.6em', top: '0.23em', rotate: 0, anchor: circleDeco }   // F — на круге
    ];

    var MASCOT_WAYPOINTS = document.documentElement.lang === 'en' && letters.length > 5
      ? MASCOT_WAYPOINTS_EN
      : MASCOT_WAYPOINTS_RU;

    var waypointIndex = 0;
    mascotAnchorEl = MASCOT_WAYPOINTS[0].anchor;

    function applyWaypoint() {
      var wp = MASCOT_WAYPOINTS[waypointIndex];
      mascot.style.left = wp.left;
      mascot.style.top = wp.top;
      mascot.style.setProperty('--mascot-rotate', wp.rotate + 'deg');
      mascot.style.removeProperty('--dodge-x'); // landing fresh — any old anchor's offset no longer applies
      mascotAnchorEl = wp.anchor;
    }

    // Ставим стартовую точку сразу: так таблица — единственный источник правды, и
    // достаточно поправить её первую строку, не выискивая то же значение в CSS.
    applyWaypoint();

    function nextWaypoint() {
      waypointIndex = (waypointIndex + 1) % MASCOT_WAYPOINTS.length;
      applyWaypoint();
    }

    // Desktop hovers, mobile taps — not both: a touch tap also synthesizes a
    // mouseenter right before its click, so listening for both on every device
    // double-advanced the cycle (skipping a waypoint) on every tap.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      mascot.addEventListener('mouseenter', nextWaypoint);
    } else {
      mascot.addEventListener('click', nextWaypoint);
    }
  })();

  // ---------- Hero deco shapes: click to spin ----------
  // Each of the two decorative icon groups does a full 360deg spin, on demand, when clicked.
  (function initDecoSpin() {
    document.querySelectorAll('.deco').forEach(function (deco) {
      deco.addEventListener('click', function () {
        deco.classList.remove('is-spinning');
        void deco.offsetWidth; // restart the animation even if it's mid-spin already
        deco.classList.add('is-spinning');
      });
      deco.addEventListener('animationend', function () {
        deco.classList.remove('is-spinning');
      });
    });
  })();
  // ---------- Hero divider: the line sticks to the cursor ----------
  // Ближайший к курсору кусок линии притягивается к нему и "прилипает", остальная
  // часть плавно сходит на нет — получается горб, вершина которого сидит ровно под
  // курсором. Отпускает, когда курсор уходит дальше REACH_PX.
  (function initLineMagnet() {
    var svg = document.querySelector('.hero__line-svg');
    var path = svg && svg.querySelector('.hero__line-path');
    if (!path || typeof path.getTotalLength !== 'function') return;

    // Оригинальный d сохраняем строкой: в покое возвращаем именно его, а не свою
    // ломаную аппроксимацию, чтобы неподвижная линия была ровно тем, что нарисовано.
    var restD = path.getAttribute('d');

    var SAMPLES = 220;   // на сколько точек режем кривую
    var SPREAD = 34;     // ширина горба в точках (~15% длины линии)
    var REACH_PX = 180;  // дальше этого курсор линию уже не держит
    var EASE = 0.2;      // насколько быстро линия догоняет цель за кадр

    // Точки покоя в координатах viewBox. Считаются один раз: система координат
    // viewBox не зависит от того, какого размера SVG отрисован на экране,
    // поэтому на resize пересчитывать нечего.
    var base = [];
    var len = path.getTotalLength();
    for (var i = 0; i <= SAMPLES; i++) {
      var p = path.getPointAtLength(len * i / SAMPLES);
      base.push({ x: p.x, y: p.y });
    }

    var curr = base.map(function (p) { return { x: p.x, y: p.y }; });
    var target = base.map(function (p) { return { x: p.x, y: p.y }; });

    // ---- След от касания ----
    // Линия не возвращается ровно туда, откуда её потянули: когда курсор отпускает,
    // в точки покоя запекается небольшая доля горба, который он успел создать. Та
    // часть, к которой прикасались, остаётся чуть смещённой — линия «помнит»
    // касание. Поэтому base[] здесь уже не константа, а изменяемое состояние покоя.
    //
    // origin[] — исходная кривая, от неё считается общий снос: без потолка след
    // копился бы от касания к касанию, и за минуту возни линия превратилась бы в
    // кашу. MAX_DRIFT = 30 единиц viewBox — это ~18px при линии шириной ~1000px:
    // линию можно ощутимо помять, но не превратить в зигзаг.
    //
    // peak[] — самое сильное смещение каждой точки за текущее касание, а не то,
    // что было в момент отпускания. Разница принципиальная: курсор обычно уходит
    // от линии постепенно, хватка слабеет, и к моменту разрыва горб уже почти
    // разгладился — от «смещения на момент отпускания» не осталось бы почти ничего.
    // По пику след получается пропорционален тому, насколько сильно линию дёрнули,
    // и охватывает всё, по чему курсор прошёлся за одно касание.
    var origin = base.map(function (p) { return { x: p.x, y: p.y }; });
    var peak = base.map(function () { return { x: 0, y: 0, m: 0 }; });
    var drifted = false;

    // Сила следа. Было 0.05–0.11 и потолок 10: лёгкое касание оставляло ~2px, и за одно
    // касание разницу было почти не заметить. Доля поднята примерно втрое, а потолок —
    // тоже втрое: иначе сильный рывок сразу упирался бы в него, и все касания давали
    // бы один и тот же предельный след, стирая разницу между «задела» и «дёрнула».
    var KEEP_MIN = 0.16;     // какая доля пика остаётся насовсем
    var KEEP_MAX = 0.30;
    var MAX_DRIFT = 30;      // потолок общего сноса точки от исходной кривой, в единицах viewBox
    var SMOOTH_PASSES = 12;  // сглаживание следа вдоль линии перед запеканием

    var mouse = { x: 0, y: 0, active: false };
    var raf = null;
    var pulled = false;

    function smoothstep(t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return t * t * (3 - 2 * t);
    }

    function computeTargets() {
      var i;
      if (!mouse.active) {
        for (i = 0; i <= SAMPLES; i++) { target[i].x = base[i].x; target[i].y = base[i].y; }
        return false;
      }

      // Один и тот же коэффициент переводит и радиус, и координаты: SVG отрисован
      // с сохранением пропорций, поэтому масштаб по обеим осям одинаковый.
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return false;
      var scale = 1674.32 / rect.width;
      var reach = REACH_PX * scale;

      var mx = (mouse.x - rect.left) * scale;
      var my = (mouse.y - rect.top) * scale;

      // Ближайшая точка линии — она и станет местом "прилипания".
      var bi = 0, bd = Infinity;
      for (i = 0; i <= SAMPLES; i++) {
        var dx = base[i].x - mx, dy = base[i].y - my;
        var d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; bi = i; }
      }
      var dist = Math.sqrt(bd);

      // Ближе 70% радиуса — держим намертво (точка садится ровно на курсор),
      // дальше хватка плавно слабеет и к REACH сходит в ноль. Порог именно высокий:
      // при 55% зона уверенного прилипания получалась всего ~70px, и тонкую линию
      // было легко "промахнуть".
      var grip = 1 - smoothstep((dist - reach * 0.7) / (reach * 0.3));
      if (grip <= 0) {
        for (i = 0; i <= SAMPLES; i++) { target[i].x = base[i].x; target[i].y = base[i].y; }
        return false;
      }

      // Весь горб — это один и тот же вектор смещения, ослабленный к краям. Если
      // вместо этого тянуть каждую точку к курсору по отдельности, точки возле
      // вершины сбегаются в кучу и линия сама себя перехлёстывает.
      var vx = (mx - base[bi].x) * grip;
      var vy = (my - base[bi].y) * grip;

      for (i = 0; i <= SAMPLES; i++) {
        var f = 1 - Math.abs(i - bi) / SPREAD;
        f = f <= 0 ? 0 : smoothstep(f);
        var ox = vx * f;
        var oy = vy * f;
        target[i].x = base[i].x + ox;
        target[i].y = base[i].y + oy;

        var m = ox * ox + oy * oy;
        if (m > peak[i].m) { peak[i].m = m; peak[i].x = ox; peak[i].y = oy; }
      }
      return true;
    }

    // Касание закончилось — оставляем след и обнуляем пик под следующее.
    function bakeResidual() {
      var i;

      // Сначала сгладить сам пик. peak[] — это максимум по кадрам, а максимум от
      // ползущего горба операция негладкая: там, где «побеждающий» кадр сменяется,
      // у огибающей скачком ломается производная. На 60fps соседние кадры почти
      // совпадают и излом микроскопический, но на слабом телефоне кадры редкие, и
      // в следе остаются настоящие углы — вчетверо острее всего, что есть в
      // нарисованной кривой. Несколько проходов биномиальным ядром [1,2,1] убирают
      // это независимо от частоты кадров. Дешевле и честнее, чем потом маскировать
      // угол сглаживанием при отрисовке: кривая Безье его бы только закруглила,
      // а перегиб остался бы в данных и копился от касания к касанию.
      for (var pass = 0; pass < SMOOTH_PASSES; pass++) {
        var prevX = peak[0].x;
        var prevY = peak[0].y;
        for (i = 1; i < SAMPLES; i++) {
          var cx = peak[i].x;
          var cy = peak[i].y;
          peak[i].x = (prevX + 2 * cx + peak[i + 1].x) / 4;
          peak[i].y = (prevY + 2 * cy + peak[i + 1].y) / 4;
          prevX = cx;
          prevY = cy;
        }
      }
      // Размытие расползается за пределы задетого участка, поэтому модуль считаем
      // заново — иначе у появившихся «хвостов» он остался бы нулевым и они не
      // запеклись бы, вернув ступеньку на границе следа.
      for (i = 0; i <= SAMPLES; i++) {
        peak[i].m = peak[i].x * peak[i].x + peak[i].y * peak[i].y;
      }

      // Две независимые случайности, и обе нужны. keep — общая сила следа: одно
      // касание оставляет чуть больше, другое чуть меньше, так что повторить один и
      // тот же результат нельзя. Огибающая — плавная волна вдоль линии, из-за
      // которой след не является просто уменьшенной копией горба: где-то он
      // притормозил сильнее, где-то слабее, и форма выглядит помятой, а не
      // аккуратно отмасштабированной.
      //
      // Волна именно плавная (две синусоиды низкой частоты), а не независимый
      // random на каждую точку: 221 точка со своим случайным множителем — это шум
      // между соседями, то есть зубчатая линия. Здесь соседние точки получают
      // близкие множители, и линия остаётся гладкой.
      var keep = KEEP_MIN + Math.random() * (KEEP_MAX - KEEP_MIN);
      var ph1 = Math.random() * Math.PI * 2;
      var ph2 = Math.random() * Math.PI * 2;
      var fr1 = 1.5 + Math.random() * 2;
      var fr2 = 3.5 + Math.random() * 3;

      for (i = 0; i <= SAMPLES; i++) {
        if (peak[i].m > 0) {
          var t = i / SAMPLES;
          var env = 1 + 0.45 * (Math.sin(t * fr1 * Math.PI * 2 + ph1) +
                                Math.sin(t * fr2 * Math.PI * 2 + ph2)) / 2;

          var dx = base[i].x - origin[i].x;
          var dy = base[i].y - origin[i].y;

          // Мягкое насыщение вместо обрезки по потолку. Обрезка казалась очевидным
          // решением, но она портит форму: стоит дёрнуть линию посильнее — и целый
          // участок упирается в потолок ровно, след превращается в плоское плато,
          // которого в природе не бывает. tanh поджимает большие значения к MAX_DRIFT
          // плавно и никогда его не достигает, поэтому соседние точки остаются
          // разными и след держит форму, как бы сильно линию ни трепали.
          //
          // Считаем не модуль сноса, а его проекцию на направление нового рывка.
          // Так рывок В ТУ ЖЕ сторону упирается в насыщение, а рывок В ОБРАТНУЮ
          // получает отрицательную проекцию и разглаживает старый след — иначе
          // участок, уехавший до упора, замер бы там навсегда.
          var pm = Math.sqrt(peak[i].m);
          var ux = peak[i].x / pm;
          var uy = peak[i].y / pm;
          var proj = dx * ux + dy * uy;
          var next = MAX_DRIFT * Math.tanh((proj + pm * keep * env) / MAX_DRIFT);

          base[i].x += ux * (next - proj);
          base[i].y += uy * (next - proj);

          // Страховка. Вдоль рывка tanh держит снос сам, но перпендикулярная
          // составляющая от прошлых касаний в этот расчёт не входит, и сумма двух
          // может вылезти за потолок. Порог с запасом, чтобы обрезка срабатывала
          // только в этом редком случае и не рисовала плато в обычном.
          dx = base[i].x - origin[i].x;
          dy = base[i].y - origin[i].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          var hard = MAX_DRIFT * 1.5;
          if (d > hard) {
            base[i].x = origin[i].x + dx * hard / d;
            base[i].y = origin[i].y + dy * hard / d;
          }

          drifted = true;
          peak[i].m = 0; peak[i].x = 0; peak[i].y = 0;
        }

        // target был посчитан по старому base ещё до запекания — подтягиваем.
        target[i].x = base[i].x;
        target[i].y = base[i].y;
      }
    }

    // Точки соединяются кубическими кривыми, а не отрезками. Ломаная из 220 звеньев
    // сходила за гладкую ровно до тех пор, пока у линии не появился след от касания:
    // на прямых звеньях любой перегиб читается как угол, потому что касательная на
    // стыке меняется скачком.
    //
    // Схема — Катмулл-Ром: контрольные точки каждого сегмента строятся из соседей,
    // так что касательная в каждой точке параллельна отрезку между её соседями и на
    // стыке сегментов совпадает. Кривая при этом проходит РОВНО через все точки, а
    // не мимо них — это обязательное условие: по этим же точкам считается геометрия
    // магнита, и рисовать надо именно их, иначе линия разъедется с собственной
    // математикой. Коэффициент 1/6 — стандартный перевод Катмулл-Рома в Безье.
    function buildD() {
      var d = 'M' + curr[0].x.toFixed(1) + ',' + curr[0].y.toFixed(1);
      for (var i = 0; i < SAMPLES; i++) {
        var p0 = curr[i > 0 ? i - 1 : 0];
        var p1 = curr[i];
        var p2 = curr[i + 1];
        var p3 = curr[i + 2 <= SAMPLES ? i + 2 : SAMPLES];
        d += 'C' + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + ',' + (p1.y + (p2.y - p0.y) / 6).toFixed(1) +
             ' ' + (p2.x - (p3.x - p1.x) / 6).toFixed(1) + ',' + (p2.y - (p3.y - p1.y) / 6).toFixed(1) +
             ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1);
      }
      return d;
    }

    function frame() {
      var isPulled = computeTargets();
      if (isPulled !== pulled) {
        pulled = isPulled;
        path.classList.toggle('is-pulled', isPulled);
        if (!isPulled) bakeResidual();
      }

      var moving = false;
      for (var i = 0; i <= SAMPLES; i++) {
        curr[i].x += (target[i].x - curr[i].x) * EASE;
        curr[i].y += (target[i].y - curr[i].y) * EASE;
        if (!moving &&
            (Math.abs(curr[i].x - target[i].x) > 0.05 ||
             Math.abs(curr[i].y - target[i].y) > 0.05)) moving = true;
      }

      if (!moving && !isPulled) {
        // Осела — фиксируем состояние покоя и останавливаем цикл, чтобы не крутить
        // rAF вхолостую всё время, пока страница открыта.
        //
        // Пока линии никто не касался, ставим ровно тот d, что нарисован в разметке:
        // нетронутая линия должна быть настоящей кривой, а не ломаной из 220 точек.
        // После первого касания исходный d уже неверен — покой сместился, — и дальше
        // рисуем по точкам. На глаз разницы нет (сегмент ~5px при очень пологой
        // кривизне), но подменять кривую ломаной без причины незачем.
        for (var j = 0; j <= SAMPLES; j++) { curr[j].x = base[j].x; curr[j].y = base[j].y; }
        path.setAttribute('d', drifted ? buildD() : restD);
        raf = null;
        return;
      }

      path.setAttribute('d', buildD());
      raf = requestAnimationFrame(frame);
    }

    function wake() {
      if (raf === null) raf = requestAnimationFrame(frame);
    }

    onPointerMove(function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      wake();
    });

    // Указателя больше нет — курсор ушёл со вкладки или палец оторвали от экрана.
    // Без этого линия осталась бы натянутой: следующего движения, которое вернуло бы
    // её на место, просто не будет.
    onPointerEnd(function () {
      mouse.active = false;
      wake();
    });
  })();



  // ---------- Hero shapes: shake harder the longer you hover ----------
  // При наведении на фигуру она начинает мелко трястись, и чем дольше курсор на ней
  // держится, тем сильнее тряска — за RAMP_MS раскачивается до максимума и там
  // остаётся. Убрал курсор — за DECAY_MS плавно успокаивается.
  (function initShapeShake() {
    var MAX_SHIFT = 0.045;  // максимальный размах, в em от размера заголовка
    var MAX_ROT = 7;        // максимальный доворот, градусы
    var RAMP_MS = 1400;     // за сколько раскачивается до предела
    var DECAY_MS = 300;     // за сколько затухает после ухода курсора
    // Порог покраснения. Два значения, а не одно: включаем на 0.7, выключаем только
    // на 0.5. С одним порогом курсор, водящий туда-сюда у самой границы, дёргал бы
    // класс и запускал полусекундный переход цвета снова и снова — фигура мигала бы.
    var HOT_ON = 0.7;
    var HOT_OFF = 0.5;

    document.querySelectorAll('.deco').forEach(function (deco) {
      var shapes = Array.prototype.slice.call(deco.querySelectorAll('.shape'));
      if (!shapes.length) return;

      var hovering = false;
      var level = 0;       // 0 — покой, 1 — предельная тряска
      var hot = false;     // дошла ли тряска до покраснения
      var raf = null;
      var last = 0;

      function clear() {
        shapes.forEach(function (s) {
          s.style.removeProperty('--shake-x');
          s.style.removeProperty('--shake-y');
          s.style.removeProperty('--shake-r');
        });
      }

      function frame(now) {
        var dt = last ? Math.min(now - last, 50) : 16; // после фонового таба dt огромный — режем
        last = now;

        level += hovering ? dt / RAMP_MS : -dt / DECAY_MS;
        if (level > 1) level = 1;
        if (level < 0) level = 0;

        // Покраснение — следствие того, что тряска уже разошлась, поэтому порог, а не
        // плавная функция от level: цвет должен «включиться» на пике, а не ползти
        // вместе с амплитудой с самого начала.
        var wantHot = hot ? level > HOT_OFF : level >= HOT_ON;
        if (wantHot !== hot) {
          hot = wantHot;
          deco.classList.toggle('is-hot', hot);
        }
        if (level === 0) {
          // Успокоилась — гасим цикл, чтобы rAF не крутился впустую всё время,
          // пока страница открыта (тот же приём, что у магнита линии).
          clear();
          hot = false;
          deco.classList.remove('is-hot');
          raf = null;
          last = 0;
          return;
        }

        // Смещения пишутся в em, а не в px: em у .shape — это размер шрифта заголовка,
        // поэтому тряска сама масштабируется вместе с hero на любой ширине экрана.
        // Каждый кадр — новое случайное смещение; именно это читается как дрожь,
        // а не как плавное покачивание.
        var amp = MAX_SHIFT * level;
        var rot = MAX_ROT * level;
        shapes.forEach(function (s) {
          s.style.setProperty('--shake-x', ((Math.random() - 0.5) * 2 * amp).toFixed(4) + 'em');
          s.style.setProperty('--shake-y', ((Math.random() - 0.5) * 2 * amp).toFixed(4) + 'em');
          s.style.setProperty('--shake-r', ((Math.random() - 0.5) * 2 * rot).toFixed(2) + 'deg');
        });

        raf = requestAnimationFrame(frame);
      }

      function wake() {
        if (raf === null) raf = requestAnimationFrame(frame);
      }

      // mouseenter/mouseleave, а не mouseover/mouseout: последние стреляют ещё и при
      // переходе между дочерними картинками внутри .deco, и тряска сбрасывалась бы
      // каждый раз, когда курсор пересекает границу между фигурами.
      deco.addEventListener('mouseenter', function () {
        if (isGhostMouse()) return; // призрачное событие после отрыва пальца, см. слой указателя
        hovering = true; wake();
      });
      deco.addEventListener('mouseleave', function () {
        if (isGhostMouse()) return;
        hovering = false; wake();
      });

      // Палец: трясётся, пока держат, и перестаёт, как только отпустили.
      //
      // Отдельная ветка, а не onPointerMove: здесь важен не факт движения указателя,
      // а факт удержания на конкретной фигуре. Поэтому слушаем саму .deco, а не документ.
      //
      // Заметное движение отменяет тряску: значит человек не держит фигуру, а листает
      // страницу. Без этого фигура уезжала бы вверх вместе со страницей и продолжала
      // трястись, пока палец не оторвут. Порог 12px — обычный запас на дрожание руки.
      var touchStart = null;
      deco.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        lastTouchAt = Date.now();
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        hovering = true;
        wake();
      }, { passive: true });

      // touchmove приходит на элемент, где касание НАЧАЛОСЬ, даже если палец уже уехал
      // с него — поэтому слушателя на .deco достаточно, ловить движение на документе не нужно.
      deco.addEventListener('touchmove', function (e) {
        if (!touchStart || !hovering || e.touches.length !== 1) return;
        var t = e.touches[0];
        if (Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y) > 12) {
          hovering = false;
          wake();
        }
      }, { passive: true });

      function endTouch() {
        lastTouchAt = Date.now();
        touchStart = null;
        if (hovering) { hovering = false; wake(); }
      }
      deco.addEventListener('touchend', endTouch);
      deco.addEventListener('touchcancel', endTouch);
    });
  })();

  // ---------- Hero letters/shapes: horizontal-only escape ----------
  // Every letter of "ЗАИСЬ" plus the two decorative shapes is its own target. On
  // every mousemove, whichever of them are within RADIUS px of the cursor (in real
  // 2D distance) — at most the two closest — slide away from it, but strictly
  // left/right (their vertical position never changes).
  (function initHeroLetterDodge() {
    var innerEl = document.querySelector('.hero__title-inner');
    var mascot = document.querySelector('.hero__mascot');
    if (!innerEl) return;
    var targets = Array.prototype.slice.call(innerEl.querySelectorAll('.hero__letter, .deco'));
    if (!targets.length) return;

    var RADIUS = 100;
    var restRects = [];

    function measureRest() {
      var titleFontSize = parseFloat(getComputedStyle(innerEl).fontSize);
      restRects = targets.map(function (el) {
        var prevTransition = el.style.transition;
        el.style.transition = 'none';
        el.style.setProperty('--dodge-x', '0px');
        void el.offsetWidth; // force the reset to actually apply before we measure
        var r = el.getBoundingClientRect();
        el.style.removeProperty('--dodge-x');
        void el.offsetWidth;
        el.style.transition = prevTransition;
        return {
          el: el,
          left: r.left + window.scrollX,
          top: r.top + window.scrollY,
          width: r.width,
          height: r.height,
          // A shared fraction of the title's font-size, so the escape distance
          // scales with the text at every breakpoint instead of staying a fixed
          // px amount that would look oversized on mobile. Halved from 0.24 —
          // under Soledago the letters are wide enough that the old throw sent
          // them visibly barging into their neighbours.
          maxDodge: titleFontSize * 0.12
        };
      });
    }

    measureRest();
    window.addEventListener('resize', measureRest);
    // Custom fonts (Moula) load asynchronously — an initial measurement taken before
    // they're in reflects fallback-font glyph widths. Once Moula swaps in, letters with
    // the biggest width delta from the fallback (turned out to be "А" and "Ь" here) shift
    // the most, leaving their cached rest positions stale and making the dodge zone miss
    // where they actually are — which read as those two reacting "weaker" than the rest.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureRest);

    onPointerMove(function (e) {
      if (!restRects.length) return;
      var mx = e.clientX + window.scrollX;
      var my = e.clientY + window.scrollY;

      var withDist = restRects.map(function (r) {
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = cx - mx;
        var dy = cy - my;
        return { r: r, dx: dx, dist: Math.sqrt(dx * dx + dy * dy) };
      });

      withDist.sort(function (a, b) { return a.dist - b.dist; });
      var activeEls = withDist
        .filter(function (o) { return o.dist <= RADIUS; })
        .slice(0, 2)
        .map(function (o) { return o.r.el; });

      withDist.forEach(function (o) {
        if (activeEls.indexOf(o.r.el) === -1) {
          o.r.el.style.removeProperty('--dodge-x');
          if (mascot && o.r.el === mascotAnchorEl) mascot.style.removeProperty('--dodge-x');
          return;
        }
        // Scaled (not normalized) horizontal offset: at dx≈0 the cursor is directly
        // above/below the target with no clear left/right to flee, so it correctly
        // stays near put instead of picking an unstable direction.
        var k = o.r.maxDodge / RADIUS;
        var moveX = o.dx * k;
        if (Math.abs(moveX) > o.r.maxDodge) moveX = Math.sign(moveX) * o.r.maxDodge;
        o.r.el.style.setProperty('--dodge-x', moveX + 'px');
        // The mascot sits on top of one specific letter/shape — if that's the one
        // currently dodging, carry the mascot along with the exact same offset.
        if (mascot && o.r.el === mascotAnchorEl) mascot.style.setProperty('--dodge-x', moveX + 'px');
      });
    });

    // Палец оторвали — буквы возвращаются на место. Курсору это было не нужно: он
    // уезжал дальше и следующий mousemove сам сбрасывал неактивные буквы. На тач-экране
    // после отрыва событий больше нет, и буквы застряли бы сдвинутыми.
    onPointerEnd(function () {
      restRects.forEach(function (r) { r.el.style.removeProperty('--dodge-x'); });
      if (mascot) mascot.style.removeProperty('--dodge-x');
    });
  })();

  // ---------- About role/bio: подсветка слова под курсором ----------
  // Разбивает текст элемента на неразрывные .about__word спаны — по одному на слово.
  // Пробелы остаются обычным текстом между спанами, поэтому перенос строк работает
  // как обычно. Элемент пересобирается с нуля, так что вызывать это надо раньше
  // всего, что читает его содержимое.
  //
  // Раньше каждое слово дополнительно резалось на .about__letter спаны — под
  // подсветку по радиусу вокруг курсора, где загоралась часть слова. Теперь единица
  // подсветки — слово целиком, и буквенные спаны стали не нужны: минус ~140 узлов
  // DOM и минус слой, который надо было мерить.
  //
  // Вложенная разметка сохраняется. Раньше здесь было el.textContent = '' по всему
  // элементу, и любой <b> внутри абзаца бесследно схлопывался в плоский текст —
  // выделить слово жирным было просто невозможно. Теперь функция идёт по дочерним
  // узлам: текстовые режет на слова, а элементы копирует (cloneNode(false) — тег и
  // атрибуты без содержимого) и режет их содержимое уже внутрь копии. Слова внутри
  // <b> наследуют его начертание и при этом остаются обычными .about__word, так
  // что подсветка курсором работает на них ровно так же.
  //
  // Группы (data-group). Одно слово — не всегда один спан: в «занимаюсь
  // <b>анимациями</b>, презентациями» запятая лежит уже вне <b>, поэтому спанов
  // получается два — «анимациями» и «,». Подсвечивать их порознь нельзя: курсор на
  // запятой красил бы одну запятую. Поэтому соседние спаны, между которыми НЕ было
  // пробела, получают один и тот же data-group и загораются вместе. Счётчик общий на
  // все три источника (роль и два абзаца), а флаг open сбрасывается на каждом пробеле
  // и на каждом элементе без текста (тот же <br>).
  var wordGroupSeq = 0;

  function splitIntoWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    var state = { group: 0, open: false };
    el.textContent = '';
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {           // текстовый узел
        appendWords(el, node.nodeValue, state);
      } else if (node.nodeType === 1) {    // элемент — сохраняем его самого
        var holder = node.cloneNode(false);
        if (holder.textContent === '' && node.textContent === '') state.open = false;
        appendWords(holder, node.textContent, state);
        el.appendChild(holder);
      }
    });
    return Array.prototype.slice.call(el.querySelectorAll('.about__word'));
  }

  function appendWords(target, text, state) {
    text.split(/(\s+)/).forEach(function (token) {
      if (token === '') return;
      if (/^\s+$/.test(token)) {
        target.appendChild(document.createTextNode(token));
        state.open = false;
        return;
      }
      if (!state.open) {
        state.group = ++wordGroupSeq;
        state.open = true;
      }
      var word = document.createElement('span');
      word.className = 'about__word';
      word.setAttribute('data-group', state.group);
      word.textContent = token;
      target.appendChild(word);
    });
  }

  // Красным загорается ровно одно слово — то, на котором стоит курсор. Так было не
  // всегда: сначала текст физически убегал от курсора по буквам, потом краснели все
  // буквы внутри круга радиусом 100px. От круга отказались — он красил кусок фразы
  // поперёк строк, обрубая слова с обоих концов; слово целиком читается как выбор,
  // а не как пятно. "алеся мал" и "скачать резюме" по-прежнему уезжают целиком
  // (initDodge ниже) — меняется только строка роли и абзацы био.
  //
  // Гашение отложено на полсекунды, и делает это CSS, а не таймеры здесь: у
  // .about__word транзишен с delay 0.5s, у .about__word.is-lit — с delay 0. Транзишен
  // берётся у того состояния, В КОТОРОЕ переходим, поэтому загорается слово мгновенно,
  // а гаснет через полсекунды после ухода курсора. Даром достаются две вещи: при
  // быстром ведении по строке за курсором тянется короткий хвост из остывающих слов,
  // и дребезг на границе слова не мигает вовсе — если класс вернулся раньше, чем
  // истекла задержка, цвет так и не начал меняться.
  //
  // Позиции слов кэшируются, а не читаются на каждый mousemove, и перемеряются на
  // resize и на fonts.ready: текст перетекает при ресайзе, а замер до подгрузки Moula
  // отражает ширины глифов запасного шрифта — попадание было бы смещено относительно
  // того, где слова стоят на самом деле.
  (function initAboutWordGlow() {
    var sources = document.querySelectorAll('.about__role, .about__bio p');
    if (!sources.length) return;
    var words = [];
    sources.forEach(function (el) {
      words = words.concat(splitIntoWords(el));
    });
    if (!words.length) return;

    // Единица подсветки — группа спанов с общим data-group (обычно один спан, но
    // слово с примыкающей запятой вне <b> — два, см. splitIntoWords).
    var units = [];
    var byGroup = {};
    words.forEach(function (el) {
      var g = el.getAttribute('data-group');
      if (!byGroup[g]) {
        byGroup[g] = { els: [], rects: [] };
        units.push(byGroup[g]);
      }
      byGroup[g].els.push(el);
    });

    var current = null;

    function measureRest() {
      units.forEach(function (u) {
        u.rects = u.els.map(function (el) {
          var r = el.getBoundingClientRect();
          return {
            // Document coordinates, so the hit test stays correct at any scroll offset.
            left: r.left + window.scrollX,
            top: r.top + window.scrollY,
            right: r.right + window.scrollX,
            bottom: r.bottom + window.scrollY
          };
        });
      });
    }

    measureRest();
    window.addEventListener('resize', measureRest);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureRest);

    // Допуск вокруг прямоугольника слова. Ноль не годится: прямоугольник inline-спана
    // — это коробка глифов, а не строка целиком, поэтому между строками остаётся
    // несколько пустых пикселей, и при медленном ведении вдоль строки подсветка бы
    // проваливалась. С допуском курсор в такой щели подсвечивает ближайшее слово.
    // На мобилке допуск больше: палец шире курсора и метит грубее.
    var TOLERANCE_WIDE = 8;
    var TOLERANCE_NARROW = 16;
    var mobileQuery = window.matchMedia('(max-width: 640px)');
    var toleranceSq = 0;
    function updateTolerance() {
      var t = mobileQuery.matches ? TOLERANCE_NARROW : TOLERANCE_WIDE;
      toleranceSq = t * t;
    }
    updateTolerance();
    window.addEventListener('resize', updateTolerance);

    function setLit(unit) {
      if (current === unit) return;
      if (current) current.els.forEach(function (el) { el.classList.remove('is-lit'); });
      current = unit;
      if (current) current.els.forEach(function (el) { el.classList.add('is-lit'); });
    }

    onPointerMove(function (e) {
      if (!units.length) return;
      var x = e.clientX + window.scrollX;
      var y = e.clientY + window.scrollY;

      // Ближайшее слово, а не первое попавшее: внутри прямоугольника расстояние равно
      // нулю, так что попадание всегда выигрывает, а в щели между строками выбор
      // однозначен и не зависит от порядка обхода.
      var best = null;
      var bestDist = Infinity;
      for (var i = 0; i < units.length; i++) {
        var rs = units[i].rects;
        for (var j = 0; j < rs.length; j++) {
          var r = rs[j];
          var dx = x < r.left ? r.left - x : (x > r.right ? x - r.right : 0);
          var dy = y < r.top ? r.top - y : (y > r.bottom ? y - r.bottom : 0);
          var d = dx * dx + dy * dy;
          if (d < bestDist) { bestDist = d; best = units[i]; }
        }
      }

      setLit(bestDist <= toleranceSq ? best : null);
    });

    // Указателя больше нет — курсор ушёл со вкладки или палец оторвали. Слово обязано
    // вернуться в синий: следующего события, которое погасило бы его, не будет.
    onPointerEnd(function () {
      setLit(null);
    });
  })();

  // "алеся мал" and "скачать резюме" dodge as whole objects (not split into letters) —
  // the exact same 2D scheme as the header logo / portfolio titles / footer logo.
  initDodge(document.querySelector('.about__name'), 10);
  initDodge(document.querySelector('.about__resume'), 10);

  var modal = document.getElementById('workModal');
  var modalImg = document.getElementById('modalImg');
  var modalVideo = document.getElementById('modalVideo');
  var modalDesc = document.getElementById('modalDesc');
  var modalDate = document.getElementById('modalDate');
  var cards = document.querySelectorAll('.card');

  var modalDetail = document.getElementById('modalDetail');
  var modalBody = modal.querySelector('.modal__body');

  // Карусель внутри разбора. Прокрутка настоящая, нативная (scroll-snap + свайп
  // пальцем и трекпадом), стрелки просто прокручивают её на одну карточку — не
  // отдельный механизм показа слайдов, а кнопки к тому же скроллу. Поэтому свайп и
  // стрелки не могут разъехаться в разные состояния: состояние одно, scrollLeft.
  function initCarousel(root) {
    var viewport = root.querySelector('.carousel__viewport');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.carousel__slide'));
    var prev = root.querySelector('.carousel__arrow--prev');
    var next = root.querySelector('.carousel__arrow--next');
    if (!viewport || slides.length < 2) return;

    // Шаг «на одну карточку» — из реальной геометрии двух соседних слайдов. Лент две и
    // они разные: у верхней карточка во всю ширину без зазоров, у ленты текстовых основ
    // видно полторы карточки с зазором. Расстояние между началами соседних слайдов
    // верно для обеих и не требует дублировать в JS ширины и gap из CSS.
    function cardWidth() {
      return slides[1].offsetLeft - slides[0].offsetLeft;
    }

    function maxScroll() {
      return viewport.scrollWidth - viewport.clientWidth;
    }

    function syncArrows() {
      // Допуск в 1px: scrollLeft бывает дробным при дробной ширине слайда, и точное
      // сравнение с максимумом не сработало бы — стрелка осталась бы активной в самом
      // конце ленты.
      var max = viewport.scrollWidth - viewport.clientWidth;
      prev.disabled = viewport.scrollLeft <= 1;
      next.disabled = viewport.scrollLeft >= max - 1;
    }

    // ---- Плавная прокрутка ----
    // Раньше у ленты было жёсткое прилипание к карточкам (scroll-snap mandatory), и
    // любая остановка между ними тут же отбрасывалась к ближайшей: лента двигалась
    // только целыми карточками, рывками. Прилипание убрано, остановиться можно где
    // угодно, а движение от колеса и стрелок анимируем сами.
    //
    // Почему не нативный scrollTo({ behavior: 'smooth' }): у колеса каждый щелчок —
    // отдельное событие, и нативная анимация на каждом перезапускается с нуля, отчего
    // быстрое кручение идёт толчками. Здесь цель просто сдвигается, а текущая позиция
    // догоняет её каждый кадр — сколько бы щелчков ни пришло подряд, движение одно
    // и непрерывное.
    var EASE = 0.18;         // какую долю оставшегося пути проходим за кадр
    var WHEEL_SPEED = 1.5;   // во сколько раз щелчок колеса длиннее своей дельты
    var target = 0;
    var anim = null;

    function tick() {
      var cur = viewport.scrollLeft;
      var d = target - cur;
      if (Math.abs(d) < 1) {
        viewport.scrollLeft = target;
        anim = null;
        return;
      }
      var step = d * EASE;
      // Не меньше пикселя за кадр. Браузер округляет scrollLeft, и шаг в полпикселя
      // просто не применился бы: позиция замерла бы в паре пикселей от цели, а цикл
      // крутился бы вечно, так и не дойдя до условия остановки.
      if (Math.abs(step) < 1) step = d > 0 ? 1 : -1;
      viewport.scrollLeft = cur + step;
      anim = requestAnimationFrame(tick);
    }

    function animateTo(x) {
      target = Math.max(0, Math.min(maxScroll(), x));
      if (anim === null) anim = requestAnimationFrame(tick);
    }

    function stopAnim() {
      if (anim !== null) cancelAnimationFrame(anim);
      anim = null;
    }

    // Точка отсчёта для нового движения. Пока анимация идёт — это цель: иначе
    // щелчки колеса, пришедшие во время движения, складывались бы не с тем, куда лента
    // едет, а с тем, где она оказалась на этом кадре, и часть пути терялась бы.
    function base() {
      return anim === null ? viewport.scrollLeft : target;
    }

    // Стрелки ведут к границе соседней карточки. Если лента остановлена посередине,
    // «вперёд» доводит до начала следующей карточки, а не прыгает ещё на целую.
    function stepCards(dir) {
      var w = cardWidth();
      var pos = base() / w;
      var i = dir > 0 ? Math.floor(pos + 0.01) + 1 : Math.ceil(pos - 0.01) - 1;
      animateTo(i * w);
    }

    prev.addEventListener('click', function () { stepCards(-1); });
    next.addEventListener('click', function () { stepCards(1); });

    // Колесо мыши над лентой листает её вбок — у мыши нет своей горизонтальной
    // прокрутки.
    viewport.addEventListener('wheel', function (e) {
      // У трекпада горизонталь своя, настоящая и уже плавная — в неё не лезем, а
      // свою анимацию гасим, чтобы она не тянула ленту против пальцев.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { stopAnim(); return; }

      // deltaMode: 0 — пиксели, 1 — строки (так шлёт Firefox), 2 — страницы.
      var unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? viewport.clientWidth : 1;
      var delta = e.deltaY * unit * WHEEL_SPEED;
      var from = base();

      // На краю ленты прокрутку отдаём странице. Иначе курсор над каруселью залипал
      // бы: лента дальше не едет, а окно под ней не прокручивается.
      if ((delta < 0 && from <= 0) || (delta > 0 && from >= maxScroll())) return;

      e.preventDefault();
      animateTo(from + delta);
    }, { passive: false });

    // Палец на экране — хозяин ленты. Недоигранная анимация от стрелки иначе тянула
    // бы ленту против пальца.
    viewport.addEventListener('touchstart', stopAnim, { passive: true });

    viewport.addEventListener('scroll', syncArrows, { passive: true });

    // Единственный слушатель, который переживёт выброшенную разметку: он висит на
    // window, а не внутри карусели. Его надо снимать руками — вернём функцию отписки
    // наверх, иначе каждое открытие работы добавляло бы ещё один, и они копились бы
    // за сеанс, дёргая getBoundingClientRect у давно удалённых узлов.
    window.addEventListener('resize', syncArrows);

    // Стрелки на клавиатуре работают, когда фокус внутри карусели. Внутри модалки это
    // ожидаемо, а перехватывать их глобально нельзя — уедет прокрутка страницы.
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepCards(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stepCards(1); }
    });

    syncArrows();

    // Остановка анимации отдельно от полной отписки: разбор, спрятанный до
    // следующего открытия, ленту не выбрасывает, но крутиться ей там нельзя (см.
    // sleepDetail).
    teardown.stop = stopAnim;
    return teardown;

    function teardown() {
      window.removeEventListener('resize', syncArrows);
      // Обязательно. Если закрыть окно посреди прокрутки, цикл продолжил бы крутиться
      // над выброшенной лентой: у отсоединённого узла scrollLeft всегда 0, до цели
      // он не дойдёт никогда, и rAF работал бы до перезагрузки страницы.
      stopAnim();
    }
  }

  // Видео играют, только пока видны. Сначала это было про разборы (в разборе куба
  // роликов шесть, вместе ~38МБ: с обычным autoplay все шесть начали бы грузиться и
  // крутиться в момент открытия, хотя видно одно-два), а потом тем же способом
  // поехали и карточки работ в сетке: девять штук с autoplay тянули файлы все разом,
  // и на телефоне, где видно четыре карточки, последняя оживала заметно позже
  // остальных. Поэтому у таких видео нет autoplay, есть data-autoplay: файл
  // докачивается и запускается, когда видео подъезжает к краю окна (запас 200px,
  // чтобы успело стартовать до появления), а ушедшее из вида встаёт на паузу.
  //
  // scrollRoot — что считать «окном»: у разбора это сама панель модалки (она и
  // прокручивается), у сетки работ — null, то есть окно браузера.
  function initLazyVideos(root, scrollRoot) {
    var videos = root.querySelectorAll('video[data-autoplay]');
    if (!videos.length) return null;

    if (!('IntersectionObserver' in window)) {
      videos.forEach(function (v) { v.play().catch(function () {}); });
      return null;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          v.preload = 'auto';
          // Сафари на айфоне не начинает качать файл от одной смены preload — ему
          // нужен явный load(). Без него видео в разборах на телефоне так и висели
          // пустыми. Вызываем только когда не загружено ничего (readyState 0), иначе
          // load() сбросил бы уже идущее воспроизведение.
          if (v.readyState === 0) v.load();

          var started = v.play();
          if (started && started.catch) {
            started.catch(function (err) {
              // AbortError — это окно закрыли раньше, чем видео стартовало, дело
              // житейское. А вот NotAllowedError значит, что автозапуск запретили:
              // на айфоне так делает режим энергосбережения, на андроиде — экономия
              // трафика. Тогда отдаём человеку родные контролы: пустой прямоугольник
              // хуже, чем кнопка «играть».
              if (err && err.name === 'AbortError') return;
              v.controls = true;
            });
          }
        } else {
          v.pause();
        }
      });
    }, { root: scrollRoot === undefined ? root : scrollRoot, rootMargin: '200px 0px' });

    videos.forEach(function (v) { observer.observe(v); });

    return function () {
      observer.disconnect();
      videos.forEach(function (v) { v.pause(); });
    };
  }

  // Кнопка звука поверх видео со звуком. Видео всегда стартует без звука (иначе
  // браузер не даст автозапуск), кнопка включает и выключает звук только у своего
  // видео. Какие видео со звуком — помечено в разметке атрибутом data-sound: во многих
  // файлах аудиодорожка есть, но она пустая (запись экрана, экспорт с тишиной), и
  // по дорожке браузер эти случаи не различает — проверено декодированием звука.
  //
  // Кнопку не оборачиваем вместе с видео в обёртку: на видео завязаны правила вида
  // «.work > .work__video» и раскладки квадрата/плашки. Она ставится соседом и
  // позиционируется по координатам видео внутри того же родителя.
  var ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  var ICON_SOUND_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  var SOUND_BTN_INSET = 10;

  function initSoundButtons(root) {
    var videos = root.querySelectorAll('video[data-sound]');
    if (!videos.length) return null;

    var cleanups = [];
    videos.forEach(function (v) {
      var parent = v.parentNode;
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sound-btn';
      function render() {
        btn.innerHTML = v.muted ? ICON_SOUND_OFF : ICON_SOUND_ON;
        // Подпись рождается в коде, а не в разметке, поэтому переводчик её не видит —
        // зовём словарь сами (на русской версии I18N.t вернёт строку как есть).
        var label = v.muted ? 'Включить звук' : 'Выключить звук';
        btn.setAttribute('aria-label', window.I18N ? I18N.t(label) : label);
        btn.classList.toggle('is-on', !v.muted);
      }
      function place() {
        btn.style.left = (v.offsetLeft + v.offsetWidth - btn.offsetWidth - SOUND_BTN_INSET) + 'px';
        btn.style.top = (v.offsetTop + v.offsetHeight - btn.offsetHeight - SOUND_BTN_INSET) + 'px';
      }
      btn.addEventListener('click', function () {
        v.muted = !v.muted;
        if (!v.muted && v.paused) v.play().catch(function () {});
        render();
      });

      v.muted = true;
      render();
      parent.insertBefore(btn, v.nextSibling);
      place();

      var ro = null;
      if ('ResizeObserver' in window) {
        ro = new ResizeObserver(place);
        ro.observe(v);
        ro.observe(parent);
      }
      cleanups.push(function () { if (ro) ro.disconnect(); });
    });

    return function () {
      cleanups.forEach(function (fn) { fn(); });
    };
  }

  // Картинка с атрибутом data-zoom открывается по клику во весь экран: слой кладётся
  // поверх модалки (z-index выше), закрывается кликом или Esc. Так открываются все
  // картинки разбора «хехе», включая те, что лежат в горизонтальных лентах.
  function initZoom(root) {
    var imgs = root.querySelectorAll('img[data-zoom]');
    if (!imgs.length) return null;

    var layer = null;

    function close() {
      if (!layer) return;
      layer.remove();
      layer = null;
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        // Esc закрывает сначала картинку, а не весь разбор: обработчик модалки
        // висит на том же документе, поэтому событие до него не доводим.
        e.stopPropagation();
        close();
      }
    }

    function open(src, alt) {
      close();
      layer = document.createElement('div');
      layer.className = 'zoom';
      var img = document.createElement('img');
      img.src = src;
      img.alt = alt || '';
      layer.appendChild(img);
      layer.addEventListener('click', close);
      document.body.appendChild(layer);
      document.addEventListener('keydown', onKey, true);
    }

    var handlers = [];
    imgs.forEach(function (img) {
      var fn = function () { open(img.currentSrc || img.src, img.alt); };
      img.addEventListener('click', fn);
      handlers.push([img, fn]);
    });

    return function () {
      close();
      handlers.forEach(function (h) { h[0].removeEventListener('click', h[1]); });
    };
  }

  // Блок «ТЗ + референс»: высота картинки равна высоте текста рядом, ширина идёт от
  // пропорций картинки. В CSS это не решается: высота ряда складывается из обоих
  // столбцов, и растянутая картинка упиралась бы сама в себя.
  //
  // Задача с подвохом — у неё обратная связь. Картинка выше → она шире → текст уже →
  // текст выше → картинка ещё выше. Первая версия гоняла эту петлю через
  // ResizeObserver на тексте, и пока текст был мелким, петля сходилась. Когда текст
  // сделали крупным (как в about), она ушла вразнос: проверено, картинка раздулась до
  // 734×2328, а колонка текста схлопнулась в 0.
  //
  // Поэтому теперь подгонка — один синхронный расчёт, без петли через наблюдателя.
  // Стартуем с картинки нулевой высоты (текст на всю ширину, самый низкий) и шагаем
  // вверх: высота := высота текста при текущей картинке. Высота текста от роста
  // картинки только растёт, поэтому такой ряд подходит к ответу снизу и не
  // перескакивает его — в отличие от старта с большой картинки, откуда и был разнос.
  // Потолок — 45% ширины блока под картинку: если текст такой длинный, что ровной
  // высоты не получить, картинка останавливается там и текст просто оказывается
  // выше неё, а не выдавливается в ноль.
  //
  // Пересчёт — только при смене ширины блока и после загрузки шрифтов. Изменения
  // высоты, которые делает сам расчёт, наблюдатель пропускает — петли больше нет.
  // На телефоне столбцы стоят друг под другом, там подгонка не нужна.
  var BRIEF_IMG_MAX_SHARE = 0.45;

  function initBriefs(root) {
    var briefs = root.querySelectorAll('.work__brief');
    if (!briefs.length) return null;

    var cleanups = [];
    briefs.forEach(function (brief) {
      var img = brief.querySelector('.work__brief-img');
      var text = brief.querySelector('.work__brief-text');
      if (!img || !text) return;

      // Пропорции из атрибутов width/height: они известны сразу, картинка может ещё
      // не загрузиться. У столбика из нескольких картинок (div) атрибутов нет —
      // пропорции всего столбика берутся из data-ratio.
      var ratio = +img.getAttribute('data-ratio') ||
        (+img.getAttribute('width') || 1) / (+img.getAttribute('height') || 1);

      function fit() {
        brief.classList.remove('is-stacked');
        if (getComputedStyle(brief).flexDirection === 'column') {
          img.style.width = '';
          img.style.height = '';
          return;
        }
        var maxH = brief.clientWidth * BRIEF_IMG_MAX_SHARE / ratio;
        var h = 0;
        img.style.width = '';
        img.style.height = '0px';
        for (var i = 0; i < 40; i++) {
          var next = Math.min(text.offsetHeight, maxH);   // offsetHeight пересчитывает раскладку
          if (Math.abs(next - h) < 0.5) break;
          h = next;
          img.style.height = h + 'px';
        }

        // Точного равенства может не существовать вовсе. Высота текста растёт
        // ступеньками по строке, и при крупном шрифте текст при любой высоте картинки
        // хоть немного выше: замерено на ширине 734px — ближе чем на 21px не сойтись.
        // Поэтому ширину картинки фиксируем по найденной высоте, а высоту дотягиваем
        // ровно до текста; лишнее срезает object-fit: cover (в CSS). Ширина при этом
        // не меняется, значит и текст не перетекает — подгонка окончательная.
        // Обрезку ограничиваем 15%. Если разница больше (текст длинный, окно узкое),
        // картинку не ставим рядом вовсе: блок уходит в столбик, как на телефоне
        // (.is-stacked). Правило Алеси — рядом с ТЗ картинки ровно по высоте текста,
        // ничего не торчит снизу; узкая обрезанная полоска тоже не вариант.
        img.style.width = (h * ratio) + 'px';
        var t = text.offsetHeight;
        if (t - h <= h * 0.15) {
          img.style.height = t + 'px';
        } else {
          img.style.width = '';
          img.style.height = '';
          brief.classList.add('is-stacked');
        }
      }

      var lastWidth = -1;
      var raf = null;
      function schedule() {
        if (raf === null) raf = requestAnimationFrame(function () { raf = null; fit(); });
      }

      fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

      var ro = null;
      if ('ResizeObserver' in window) {
        ro = new ResizeObserver(function (entries) {
          var w = Math.round(entries[0].contentRect.width);
          if (w === lastWidth) return;   // сменилась только высота — это наш же расчёт
          lastWidth = w;
          schedule();
        });
        ro.observe(brief);
      }

      cleanups.push(function () {
        if (ro) ro.disconnect();
        if (raf !== null) cancelAnimationFrame(raf);
      });
    });

    return function () {
      cleanups.forEach(function (c) { c(); });
    };
  }

  var detailCleanupTimer = null;

  /* Разборы, которые уже открывали, не собираем заново. Раньше окно выбрасывало
     разметку при каждой смене работы, и свайп назад начинал всё сначала: пустой
     прямоугольник вместо видео, пока файл качается по второму разу. Теперь собранный
     разбор остаётся жить рядом, просто спрятанный, и при возврате показывается
     сразу — вместе с уже загруженным видео.

     Храним не все подряд, а шесть последних — ровно один раздел: можно обойти свайпом
     всю диджитал-часть или всю печатку и вернуться к началу, ничего не потеряв.
     Седьмая работа вытесняет самую давнюю, и та собирается заново.

     Второй предел — по видео, и он важнее первого. Сафари на айфоне держит
     ограниченное число загруженных медиа на страницу (около шестнадцати), а дальше
     просто перестаёт грузить новые — ровно та беда, с которой мы уже воевали в
     разборах. Поэтому если в сохранённых работах набралось больше дюжины загруженных
     видео, самые давние вылетают, сколько бы их ни было по счёту работ.

     Лишней закачки от этого нет: видео в разборе качаются по мере прокрутки
     (initLazyVideos), и в спрятанном разборе ни одно не начнёт грузиться само. */
  var DETAIL_CACHE_MAX = 6;
  var DETAIL_VIDEO_MAX = 12;
  var detailCache = [];       // [{ id, node, teardown, stops }], свежие в конце
  var activeDetail = null;    // запись, показанная сейчас

  function eachVideo(node, fn) {
    Array.prototype.forEach.call(node.querySelectorAll('video'), fn);
  }

  /* Усыпить разбор: он остаётся собранным, но не шумит и не жжёт батарею. Важнее, чем
     кажется: лента внутри может быть в середине плавной прокрутки, а у спрятанного
     узла scrollLeft всегда 0 — цикл анимации не дошёл бы до цели никогда и крутился
     бы до перезагрузки страницы. */
  function sleepDetail(entry) {
    if (!entry) return;
    entry.stops.forEach(function (stop) { stop(); });
    eachVideo(entry.node, function (v) { v.pause(); });
  }

  /* Собирает разбор и сразу вешает его в окно — видимым, а не спрятанным. Это
     обязательно: кнопка звука встаёт в угол видео по его замеренным размерам, а поля
     в ТЗ равняются по высоте соседней картинки. У спрятанного узла все размеры нули, и
     всё это встало бы не туда. Окно в этот момент ещё не открыто (прозрачное), но
     размеры у него уже настоящие — visibility: hidden раскладку не отменяет. */
  function buildDetail(id, tpl) {
    // У каждого разбора ровно один корневой <article class="work"> — его и берём,
    // без обёртки: CSS разбора написан про прямых детей .work.
    var node = tpl.content.firstElementChild.cloneNode(true);
    modalDetail.appendChild(node);

    // Лент в разборе может быть несколько, у каждой своя анимация и свой слушатель на
    // window — собираем все отписки в одну, чтобы снять их разом при вытеснении.
    var teardowns = [];
    var stops = [];
    node.querySelectorAll('.carousel').forEach(function (el) {
      var t = initCarousel(el);
      if (!t) return;
      teardowns.push(t);
      if (t.stop) stops.push(t.stop);
    });

    // Видео ищем в самой работе, а считаем видимыми — относительно окна разбора:
    // прокручивается именно оно. Передать сюда один node нельзя — наблюдатель мерил
    // бы видимость внутри самой работы, где видно всё и сразу.
    [initLazyVideos(node, modalDetail), initSoundButtons(node), initBriefs(node), initZoom(node)]
      .forEach(function (t) { if (t) teardowns.push(t); });

    var entry = {
      id: id,
      node: node,
      stops: stops,
      teardown: function () {
        teardowns.forEach(function (t) { t(); });
        node.remove();
      }
    };
    detailCache.push(entry);
    return entry;
  }

  function cachedDetail(id) {
    for (var i = 0; i < detailCache.length; i++) {
      if (detailCache[i].id === id) return detailCache.splice(i, 1)[0];
    }
    return null;
  }

  function loadedVideos() {
    var n = 0;
    detailCache.forEach(function (entry) {
      eachVideo(entry.node, function (v) { if (v.readyState > 0) n++; });
    });
    return n;
  }

  // Вытесняем самые давние, но никогда — показанную сейчас работу.
  function trimDetailCache() {
    while (detailCache.length > DETAIL_CACHE_MAX ||
           (detailCache.length > 1 && loadedVideos() > DETAIL_VIDEO_MAX)) {
      var victim = null;
      for (var i = 0; i < detailCache.length; i++) {
        if (detailCache[i] !== activeDetail) { victim = detailCache.splice(i, 1)[0]; break; }
      }
      if (!victim) return;
      victim.teardown();
    }
  }

  // Возвращает окно в простой режим: прячет разбор (не выбрасывая его из кэша) и
  // снимает хук is-detail.
  function resetDetail() {
    clearTimeout(detailCleanupTimer);
    sleepDetail(activeDetail);
    if (activeDetail) activeDetail.node.hidden = true;
    activeDetail = null;
    modalDetail.hidden = true;
    modalBody.hidden = false;
    modal.classList.remove('is-detail');
  }

  // Подставляет разбор работы, если он у неё есть. Возвращает true, если подставил.
  function openDetail(media) {
    var id = media.dataset.detail;
    var tpl = id ? document.getElementById(id) : null;
    // У работы нет разбора — показываем простое окно, прошлый разбор прячем.
    if (!tpl) { resetDetail(); return false; }

    clearTimeout(detailCleanupTimer);

    // Прошлую работу убираем первой: собирать новую надо уже в освободившемся окне,
    // чтобы она мерила себя по нему (см. buildDetail).
    var entry = cachedDetail(id);
    if (entry !== activeDetail) {
      sleepDetail(activeDetail);
      if (activeDetail) activeDetail.node.hidden = true;
      activeDetail = null;
    }
    modalDetail.hidden = false;
    modalBody.hidden = true;
    // Хук для CSS: у разбора свой фон и своя ширина окна, простую модалку не трогаем.
    modal.classList.add('is-detail');

    if (!entry) entry = buildDetail(id, tpl);
    else detailCache.push(entry);          // снова самая свежая
    entry.node.hidden = false;
    activeDetail = entry;

    // Работа всегда начинается сначала — и открытая из сетки, и возвращённая свайпом.
    // Отматываем только то, что уже загружено: трогать currentTime у видео, которое
    // ещё не начинало качаться, незачем, оно и так начнётся с нуля.
    eachVideo(entry.node, function (v) {
      if (v.readyState > 0) v.currentTime = 0;
    });
    // Ленты внутри — тоже к началу, иначе сохранённая работа открывалась бы
    // прокрученной до середины, а открытая из сетки — нет.
    Array.prototype.forEach.call(entry.node.querySelectorAll('.carousel__viewport'), function (vp) {
      vp.scrollLeft = 0;
    });

    // Открываем всегда с начала: окно могло остаться прокрученным с прошлого раза.
    modalDetail.scrollTop = 0;

    trimDetailCache();
    return true;
  }

  // Какая работа сейчас открыта — нужно свайпу, чтобы знать, от чего отсчитывать
  // соседей.
  var currentMedia = null;

  function openModal(media) {
    currentMedia = media;
    if (openDetail(media)) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      return;
    }

    if (media.tagName === 'VIDEO') {
      modalVideo.src = media.currentSrc || media.src;
      modalVideo.hidden = false;
      modalImg.hidden = true;
      modalVideo.currentTime = 0;
      // play() returns a promise that rejects (AbortError) if the modal gets closed
      // again before it resolves — expected on a quick open/close, not a real error.
      modalVideo.play().catch(function () {});
    } else {
      modalImg.src = media.src;
      modalImg.alt = media.alt;
      modalImg.hidden = false;
      modalVideo.hidden = true;
    }

    // data-desc/data-date carry per-work text (set on the card's img/video). Falls
    // back to alt text where there's no data-desc yet (other portfolio sections).
    modalDesc.textContent = media.dataset.desc || media.alt || '';
    var date = media.dataset.date || '';
    modalDate.textContent = date;
    modalDate.hidden = !date;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Видео и ленты гасим сразу: окна уже не видно, а звук и анимация остались бы.
    sleepDetail(activeDetail);

    // А прячем разбор только после того, как окно догаснет (opacity 0.3s в CSS). У
    // разбора свой серый фон и своя ширина окна: убери их мгновенно — и на гаснущей
    // панели на треть секунды мелькнёт белый прямоугольник другого размера. Сама
    // разметка при этом остаётся в кэше: откроют работу снова — покажем готовую.
    // Проверка is-open обязательна: если за эти 300мс окно успели открыть снова,
    // уборка уже не наша — новое содержимое прятать нельзя.
    clearTimeout(detailCleanupTimer);
    detailCleanupTimer = setTimeout(function () {
      if (!modal.classList.contains('is-open')) resetDetail();
    }, 300);
    // Stop playback and drop the source so a closed modal never keeps playing audio
    // (or holding the file open) in the background.
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
  }

  cards.forEach(function (card) {
    var media = card.querySelector('img, video');
    if (!media) return;
    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('click', function () { openModal(media); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(media);
      }
    });
  });

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  // ---------- Свайп между работами ----------
  // На телефоне окно работы занимает весь экран, и вернуться в сетку ради соседней
  // работы — три движения. Свайп влево открывает следующую, вправо — предыдущую, по
  // кругу внутри своего раздела: из последней работы печатки попадаешь в первую
  // работу печатки, а не в диджитал. Считаются все работы раздела, даже скрытые
  // свёрнутой сеткой: человек, который листает разборы, уже «внутри», и упираться в
  // невидимую границу ему незачем.
  //
  // Только палец: на компьютере для этого есть мышь и клавиатура, а ловить
  // горизонтальные жесты тачпада значит ловить и обычную прокрутку вбок.
  (function initWorkSwipe() {
    var SWIPE_MIN = 60;        // px, короче — случайное дёрганье пальцем
    var SWIPE_RATIO = 1.5;     // горизонталь должна быть настолько длиннее вертикали
    var panel = modal.querySelector('.modal__panel');
    if (!panel) return;

    var startX = 0, startY = 0, tracking = false;

    function siblings() {
      if (!currentMedia) return [];
      var section = currentMedia.closest('.portfolio');
      if (!section) return [];
      return Array.prototype.slice.call(section.querySelectorAll('.card img, .card video'));
    }

    // Длительности совпадают с .is-slide-out / .is-slide-in в style.css.
    var SLIDE_OUT = 170;
    var SLIDE_IN = 230;
    var sliding = false;

    function slide(dir, swap) {
      sliding = true;
      // Уезжаем в сторону свайпа: палец повёл влево — работа ушла влево.
      panel.classList.add('is-slide-out');
      panel.style.transform = 'translateX(' + dir * 100 + 'vw)';

      setTimeout(function () {
        // Панель за краем экрана — здесь её и переодеваем: подмены никто не видит.
        panel.classList.remove('is-slide-out');
        panel.classList.add('is-slide-jump');
        panel.style.transform = 'translateX(' + -dir * 100 + 'vw)';
        swap();

        // Перескок надо «проявить» до того, как мы включим обратный ход: без чтения
        // размера браузер склеит оба изменения в одно и панель не поедет, а просто
        // окажется на месте.
        void panel.offsetWidth;

        panel.classList.remove('is-slide-jump');
        panel.classList.add('is-slide-in');
        panel.style.transform = 'translateX(0)';

        setTimeout(function () {
          panel.classList.remove('is-slide-in');
          // Снимаем свой transform: в открытом окне он и так равен тому, что стоит
          // в CSS, поэтому панель не дёрнется.
          panel.style.transform = '';
          sliding = false;
        }, SLIDE_IN);
      }, SLIDE_OUT);
    }

    function go(step) {
      // Второй свайп поверх первого сбил бы перескок на середине и панель застыла бы
      // за краем экрана.
      if (sliding) return;
      var list = siblings();
      var i = list.indexOf(currentMedia);
      if (i === -1 || list.length < 2) return;
      var next = list[(i + step + list.length) % list.length];
      slide(step > 0 ? -1 : 1, function () { openModal(next); });
    }

    panel.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      // Ленты внутри разбора прокручиваются вбок сами — их жесты не наши.
      if (e.target.closest && e.target.closest('.carousel, .zoom')) { tracking = false; return; }
      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    panel.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN) return;
      // Вертикаль важнее: страницу внутри окна листают вверх-вниз постоянно, и
      // наклонное движение не должно подменять работу.
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
      go(dx < 0 ? 1 : -1);
    }, { passive: true });
  })();

  // ---------- Видео карточек в сетке ----------
  // Те же ленивые видео, что в разборах, только «окно» здесь обычное — браузерное.
  // Отписка не нужна: сетка живёт столько же, сколько страница. Скрытые карточки
  // (свёрнутая сетка) наблюдатель не считает видимыми, поэтому их файлы не качаются
  // вовсе, пока не нажмут «смотреть ещё».
  initLazyVideos(document, null);

  // ---------- "Заказать анимацию" CTA card + modal ----------
  var orderModal = document.getElementById('orderModal');
  var ctaCard = document.querySelector('.card--cta');

  function openOrderModal() {
    orderModal.classList.add('is-open');
    orderModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeOrderModal() {
    orderModal.classList.remove('is-open');
    orderModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (ctaCard && orderModal) {
    ctaCard.setAttribute('tabindex', '0');
    ctaCard.setAttribute('role', 'button');
    ctaCard.addEventListener('click', openOrderModal);
    ctaCard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openOrderModal();
      }
    });
    orderModal.querySelectorAll('[data-close-order]').forEach(function (el) {
      el.addEventListener('click', closeOrderModal);
    });
  }

  // ---------- Author photo modal ----------
  var authorModal = document.getElementById('authorModal');
  var authorModalImg = document.getElementById('authorModalImg');
  var authorNextBtn = document.getElementById('authorModalNext');
  var authorPrevBtn = document.getElementById('authorModalPrev');
  var authorPhoto = document.querySelector('.about__photo');

  // Три фотографии, крутятся по кругу в обе стороны. Окно квадратное, а снимки
  // разной формы, поэтому у каждого своё `pos` — куда сдвинуть кадр при обрезке в
  // квадрат (object-position). Горизонтальной хватает центра: по бокам она
  // обрезается, а по высоте входит целиком. Вертикальную тянем вверх: лицо в
  // верхней трети, по центру обрезало бы его.
  var AUTHOR_PHOTOS = [
    { src: 'assets/portrait.jpg', pos: '27% center', alt: 'Фото Алеси Мал' },
    { src: 'assets/portrait-2.webp', pos: 'center center', alt: 'Алеся на фоне города' },
    { src: 'assets/portrait-3.jpg', pos: 'center 18%', alt: 'Алеся в кафе' }
  ];
  var authorIndex = 0;

  /* Показывает снимок целиком: и файл, и кадрирование, и подпись — но только когда
     файл уже в памяти браузера.

     Иначе получался рывок: src меняется мгновенно, а картинка доезжает через
     мгновение, и всё это время в окне висит ПРЕДЫДУЩИЙ снимок — уже с чужим
     object-position. То есть старая фотография на долю секунды дёргалась вбок,
     прежде чем смениться. Поэтому сначала ждём загрузки в невидимый Image, и лишь
     потом переставляем всё разом. Файл из кэша отдаётся сразу (complete === true),
     так что второй проход по кругу мгновенный. */
  function showAuthorPhoto() {
    var photo = AUTHOR_PHOTOS[authorIndex];
    var loader = new Image();

    function put() {
      // Пока файл ехал, могли нажать стрелку ещё раз — тогда этот кадр уже не нужен.
      if (AUTHOR_PHOTOS[authorIndex] !== photo) return;
      authorModalImg.src = photo.src;
      authorModalImg.style.objectPosition = photo.pos;
      // Подпись рождается в коде, поэтому переводчик её не видит — зовём словарь сами
      // (на русской версии I18N.t вернёт строку как есть).
      authorModalImg.alt = window.I18N ? I18N.t(photo.alt) : photo.alt;
    }

    loader.src = photo.src;
    if (loader.decode) {
      // decode() ждёт не только загрузки, но и распаковки кадра — после него подмена
      // src рисуется в том же кадре, без мигания. Любая осечка (старый браузер,
      // битый файл) уводит в put(): пустое окно хуже, чем кадр не по центру.
      loader.decode().then(put).catch(put);
    } else if (loader.complete) {
      put();
    } else {
      loader.onload = put;
      loader.onerror = put;
    }
  }

  // Остальные снимки подтягиваем в фоне, как только окно открыли: к моменту, когда
  // человек нажмёт стрелку, они уже в кэше и листание мгновенное.
  function preloadAuthorPhotos() {
    AUTHOR_PHOTOS.forEach(function (photo) {
      var img = new Image();
      img.src = photo.src;
    });
  }

  function openAuthorModal() {
    authorIndex = 0;
    showAuthorPhoto();
    preloadAuthorPhotos();
    authorModal.classList.add('is-open');
    authorModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthorModal() {
    authorModal.classList.remove('is-open');
    authorModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (authorPhoto) {
    authorPhoto.setAttribute('tabindex', '0');
    authorPhoto.setAttribute('role', 'button');
    authorPhoto.addEventListener('click', openAuthorModal);
    authorPhoto.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAuthorModal();
      }
    });
  }

  // Листание по кругу: + длина перед остатком, иначе шаг назад с первой фотографии
  // дал бы -1 вместо последней.
  function stepAuthorPhoto(delta) {
    authorIndex = (authorIndex + delta + AUTHOR_PHOTOS.length) % AUTHOR_PHOTOS.length;
    showAuthorPhoto();
  }

  authorNextBtn.addEventListener('click', function () { stepAuthorPhoto(1); });
  authorPrevBtn.addEventListener('click', function () { stepAuthorPhoto(-1); });

  // Стрелки на клавиатуре — то же листание. Esc закрывает окно общим обработчиком
  // ниже, вместе с остальными модалками.
  document.addEventListener('keydown', function (e) {
    if (!authorModal.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stepAuthorPhoto(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepAuthorPhoto(-1); }
  });

  authorModal.querySelectorAll('[data-close-author]').forEach(function (el) {
    el.addEventListener('click', closeAuthorModal);
  });

  // Native scrollIntoView({behavior:'smooth'}) picks its own duration based on distance,
  // which can run longer than a fixed-length animation and end up out of sync with it.
  // This scrolls over an exact, known duration instead.
  function scrollToOver(targetEl, duration) {
    var startY = window.scrollY;
    var targetY = startY + targetEl.getBoundingClientRect().top;
    var startTime = null;
    function step(now) {
      if (startTime === null) startTime = now;
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, startY + (targetY - startY) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('.portfolio').forEach(function (section) {
    var grid = section.querySelector('.grid');
    var moreBtn = section.querySelector('.btn-more');
    var hideBtn = section.querySelector('.btn-hide');
    var SLIDE_MS = 650;
    var FADE_MS = 300;

    function resetMoreBtn() {
      moreBtn.style.transition = '';
      moreBtn.style.transform = '';
      moreBtn.style.opacity = '';
    }

    function resetGrid() {
      grid.style.transition = 'none';
      grid.style.height = '';
      grid.style.overflow = '';
      void grid.offsetHeight; // force the snap before re-enabling transitions
      grid.style.transition = '';
    }

    moreBtn.addEventListener('click', function () {
      var collapsedHeight = grid.getBoundingClientRect().height;

      var extraCards = Array.from(grid.querySelectorAll('.card')).filter(function (card) {
        return getComputedStyle(card).display === 'none';
      });
      extraCards.forEach(function (card) {
        card.classList.add('card--fade-init');
      });

      // Reveal the full grid (instant layout jump) so we can measure its natural full height.
      grid.classList.remove('is-collapsed');
      var expandedHeight = grid.getBoundingClientRect().height;

      // Сетка сейчас уже в конечном состоянии — заодно снимаем итоговую высоту
      // страницы, доставив к ней и конечное состояние кнопок.
      var targetPageHeight = pageHeightAfter(
        function () { moreBtn.hidden = true; hideBtn.hidden = false; },
        function () { moreBtn.hidden = false; hideBtn.hidden = true; }
      );

      // Lock the grid back to its old (collapsed) height and clip it, then animate it open —
      // that alone smoothly carries the button (a plain flow sibling right after it), and
      // everything after that, down with it — no separate transform needed on the button.
      grid.style.transition = 'none';
      grid.style.height = collapsedHeight + 'px';
      grid.style.overflow = 'hidden';
      void grid.offsetHeight; // force reflow

      // Stagger the cards fading in as the grid opens up around them.
      extraCards.forEach(function (card, i) {
        card.style.transitionDelay = (40 + (i * (SLIDE_MS / Math.max(extraCards.length, 1)))) + 'ms';
      });

      // Play it all together: the grid opens up carrying the button down with it, the button
      // dissolves into transparency as it arrives, and the cards fade in behind it.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          extraCards.forEach(function (card) { card.classList.remove('card--fade-init'); });

          grid.style.transition = 'height ' + SLIDE_MS + 'ms ease';
          grid.style.height = expandedHeight + 'px';
          // Фон тянется на ту же величину и в том же темпе — иначе он остался бы
          // на старой высоте до самого конца и прыгнул одним кадром (см. animateBgGlowTo).
          animateBgGlowTo(targetPageHeight, SLIDE_MS);

          moreBtn.style.transition = 'opacity ' + FADE_MS + 'ms ease ' + (SLIDE_MS - FADE_MS * 0.6) + 'ms';
          moreBtn.style.opacity = '0';
        });
      });
      setTimeout(function () {
        moreBtn.hidden = true;
        resetMoreBtn();
        resetGrid();
        extraCards.forEach(function (card) { card.style.transitionDelay = ''; });

        // Bring "скрыть" in with a soft fade rather than popping in at full opacity.
        hideBtn.hidden = false;
        hideBtn.style.transition = 'none';
        hideBtn.style.opacity = '0';
        void hideBtn.offsetHeight; // force reflow

        // sizeBgGlow строго ПОСЛЕ показа "скрыть". Раньше он стоял выше, и мерил
        // страницу в момент, когда обе кнопки спрятаны, — фон получался на высоту
        // этой кнопки (~17px) короче настоящей страницы и таким и оставался, потому
        // что повторно его никто не пересчитывал.
        sizeBgGlow();
        remeasureDodges();

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            hideBtn.style.transition = 'opacity 300ms ease';
            hideBtn.style.opacity = '1';
          });
        });
        setTimeout(resetHideBtn, 350);
      }, SLIDE_MS - FADE_MS * 0.6 + FADE_MS + 50);
    });

    function resetHideBtn() {
      hideBtn.style.transition = '';
      hideBtn.style.transform = '';
      hideBtn.style.opacity = '';
    }

    hideBtn.addEventListener('click', function () {
      var expandedHeight = grid.getBoundingClientRect().height;

      // Peek at the collapsed height (and which currently-visible cards vanish there), then revert.
      grid.classList.add('is-collapsed');
      var collapsedHeight = grid.getBoundingClientRect().height;
      var extraCards = Array.from(grid.querySelectorAll('.card')).filter(function (card) {
        return getComputedStyle(card).display === 'none';
      });
      // Сетка на этот миг уже в конечном состоянии — снимаем заодно итоговую высоту
      // страницы, доставив к ней и конечное состояние кнопок.
      var targetPageHeight = pageHeightAfter(
        function () { hideBtn.hidden = true; moreBtn.hidden = false; },
        function () { hideBtn.hidden = false; moreBtn.hidden = true; }
      );
      grid.classList.remove('is-collapsed');

      // Scroll back up right away, matched to the same duration as the closing animation
      // so neither one finishes noticeably before the other.
      scrollToOver(section, SLIDE_MS);

      // Fade the extra works out from the bottom up, so it looks like they tuck away behind
      // the top row rather than getting clipped mid-fade — every card needs to have finished
      // fading (delay + its own 0.4s transition) well before the shrinking grid reaches it,
      // so the stagger is compressed into an earlier window instead of spanning the full ride.
      var CARD_FADE_MS = 400; // matches .card's own opacity transition duration
      var fadeSpan = Math.max(SLIDE_MS - CARD_FADE_MS - 50, 0);
      extraCards.forEach(function (card, i) {
        card.style.transitionDelay = (extraCards.length - 1 - i) * (fadeSpan / Math.max(extraCards.length - 1, 1)) + 'ms';
        card.style.opacity = '0';
      });

      // Swap the buttons right away — the grid is still (visually) fully expanded at this point,
      // so "смотреть ещё" naturally appears exactly where "скрыть" just was: at the bottom.
      hideBtn.hidden = true;
      resetHideBtn();
      moreBtn.hidden = false;

      // Lock the grid at its current (expanded) height and clip it, then animate it shut —
      // that alone smoothly carries the button (a plain flow sibling right after it), and
      // everything after that, up with it — no separate transform needed on the button.
      grid.style.transition = 'none';
      grid.style.height = expandedHeight + 'px';
      grid.style.overflow = 'hidden';

      // The button just needs to start invisible. Force that starting state to actually paint
      // before switching on the transition, otherwise the browser can skip straight to the end
      // value with no visible fade.
      moreBtn.style.transition = 'none';
      moreBtn.style.opacity = '0';
      void moreBtn.offsetHeight; // force reflow

      // Play it all together: the grid closes up carrying the button up with it, while it
      // fades in — the exact reverse of how it descended and faded out on expand.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          grid.style.transition = 'height ' + SLIDE_MS + 'ms ease';
          grid.style.height = collapsedHeight + 'px';
          // То же самое на сворачивании, только дельта отрицательная.
          animateBgGlowTo(targetPageHeight, SLIDE_MS);

          moreBtn.style.transition = 'opacity ' + SLIDE_MS + 'ms ease';
          moreBtn.style.opacity = '1';
        });
      });

      setTimeout(function () {
        // The real collapse lands now, exactly where the animation already visually put it.
        // Snap the inline values away with no transition first — otherwise, for the instant
        // it takes to clear them, things briefly inherit a default transition and replay a
        // spurious little animation back to their resting state.
        grid.classList.add('is-collapsed');
        resetGrid();
        moreBtn.style.transition = 'none';
        moreBtn.style.opacity = '';
        void moreBtn.offsetHeight; // force the snap to apply before re-enabling transitions
        moreBtn.style.transition = '';
        extraCards.forEach(function (card) {
          card.style.opacity = '';
          card.style.transitionDelay = '';
        });
        sizeBgGlow();
        remeasureDodges();
      }, SLIDE_MS + 50);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('is-open')) closeModal();
    if (authorModal.classList.contains('is-open')) closeAuthorModal();
    if (orderModal && orderModal.classList.contains('is-open')) closeOrderModal();
  });
})();
