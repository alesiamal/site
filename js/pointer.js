/* Общий слой указателя и «убегание» элементов от курсора.
   Этим пользуются обе страницы: портфолио (js/main.js) и магазин (js/shop.js),
   поэтому код живёт отдельно, а не внутри main.js, который весь про hero и модалки.

   Подключается ПЕРЕД страничным скриптом (см. data-main у include.js).

   ПРО СКРОЛЛ. preventDefault не зовём нигде и намеренно. Все эти эффекты
   горизонтальные, а у body стоит overflow-x: hidden — значит горизонтальный свайп и
   так ничего не прокручивает, и отбирать у браузера жест не за чем. Вертикальный
   свайп при этом продолжает листать страницу: эффекты просто отыгрывают под пальцем
   по дороге.

   ПРО ПРИЗРАЧНУЮ МЫШЬ. После touchend браузер досылает синтетические mousemove/
   mouseenter в точке отрыва пальца. Без защиты они заново включали бы эффект сразу
   после того, как мы его погасили, — и он застревал бы включённым навсегда, потому
   что настоящих mousemove на телефоне больше не будет. Отсюда окно в 700мс, в
   течение которого мышиные события игнорируются. */
window.Pointer = (function () {
  var lastTouchAt = 0;
  function isGhostMouse() { return Date.now() - lastTouchAt < 700; }

  // fn получает объект с clientX/clientY — им может быть и MouseEvent, и Touch.
  function onMove(fn) {
    document.addEventListener('mousemove', function (e) {
      if (isGhostMouse()) return;
      fn(e);
    });
    // touchstart тоже: эффект должен отозваться на само касание, не дожидаясь,
    // пока палец поедет.
    function fromTouch(e) {
      if (e.touches.length !== 1) return; // мультитач — это зум, не наш жест
      lastTouchAt = Date.now();
      fn(e.touches[0]);
    }
    document.addEventListener('touchstart', fromTouch, { passive: true });
    document.addEventListener('touchmove', fromTouch, { passive: true });
  }

  // Указателя больше нет: курсор ушёл со вкладки или палец оторвали от экрана.
  function onEnd(fn) {
    document.documentElement.addEventListener('mouseleave', function () {
      if (isGhostMouse()) return;
      fn();
    });
    function end() { lastTouchAt = Date.now(); fn(); }
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);
  }

  // Элемент отодвигается от курсора, пока тот в зоне, и возвращается, когда уходит.
  // zoneEl позволяет задать зону реакции шире самого элемента.
  // Возвращает функцию перемера — её зовут, когда вёрстка сдвинулась (раскрытие сетки).
  function dodge(el, amount, zoneEl) {
    if (!el) return;
    zoneEl = zoneEl || el;
    var ZONE = 15;
    var DODGE = amount || 20;

    // Позиции покоя кэшируются в координатах документа (не зависят от прокрутки):
    // читать их с элемента во время анимации нельзя — getBoundingClientRect вернёт
    // то, где элемент нарисован сейчас, а не куда он едет, и зона реакции поплывёт.
    var restRect = null;     // сам элемент — от его центра считается вектор побега
    var zoneRestRect = null; // zoneEl — он задаёт границы зоны

    function measureRest() {
      var prevTransition = el.style.transition;
      var prevTransform = el.style.transform;
      el.style.transition = 'none';
      el.style.transform = 'none';
      void el.offsetWidth; // сброс должен примениться до замера
      var r = el.getBoundingClientRect();
      restRect = { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
      el.style.transform = prevTransform;
      void el.offsetWidth;
      el.style.transition = prevTransition;

      var zr = zoneEl.getBoundingClientRect();
      zoneRestRect = { left: zr.left + window.scrollX, top: zr.top + window.scrollY, width: zr.width, height: zr.height };
    }

    measureRest();
    window.addEventListener('resize', measureRest);
    // Moula грузится асинхронно: если первый замер случился до неё, он снят по
    // метрикам запасного шрифта и после подмены станет неверным.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureRest);

    onMove(function (e) {
      if (!restRect || !zoneRestRect) return;
      var left = zoneRestRect.left - window.scrollX - ZONE;
      var top = zoneRestRect.top - window.scrollY - ZONE;
      var right = left + zoneRestRect.width + ZONE * 2;
      var bottom = top + zoneRestRect.height + ZONE * 2;

      if (e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom) {
        var cx = restRect.left - window.scrollX + restRect.width / 2;
        var cy = restRect.top - window.scrollY + restRect.height / 2;
        var dx = cx - e.clientX;
        var dy = cy - e.clientY;

        // Масштабируем вектор, а не нормируем: у самого центра dx/dy ≈ 0, и
        // нормированное направление там скачет от любого дрожания мыши.
        var refDist = Math.sqrt(Math.pow(restRect.width / 2 + ZONE, 2) + Math.pow(restRect.height / 2 + ZONE, 2));
        var k = DODGE / refDist;
        var moveX = dx * k;
        var moveY = dy * k;
        var moveDist = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveDist > DODGE) {
          moveX = moveX / moveDist * DODGE;
          moveY = moveY / moveDist * DODGE;
        }
        el.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px)';
      } else {
        el.style.transform = '';
      }
    });

    // Палец оторвали — элемент обязан вернуться на место. У мыши это происходит само
    // собой: курсор уезжает из зоны и приходит следующий mousemove с ветки else.
    onEnd(function () { el.style.transform = ''; });

    return measureRest;
  }

  // Лого в шапке: зона реакции зависит от того, открыта ли панель разделов.
  // Панель закрыта — реагируем только рядом с самим лого; открыта — на всю панель.
  function logoDodge() {
    var logoLink = document.querySelector('.logo');
    if (!logoLink) return;
    var logoNav = document.querySelector('.logo-nav');
    var DODGE = 20;
    var CLOSED_ZONE = 50;
    var OPEN_ZONE = 15;

    var logoRest = null;
    var navRest = null;

    function measureRest() {
      var prevTransition = logoLink.style.transition;
      var prevTransform = logoLink.style.transform;
      logoLink.style.transition = 'none';
      logoLink.style.transform = 'none';
      void logoLink.offsetWidth;
      var lr = logoLink.getBoundingClientRect();
      logoRest = { left: lr.left + window.scrollX, top: lr.top + window.scrollY, width: lr.width, height: lr.height };
      logoLink.style.transform = prevTransform;
      void logoLink.offsetWidth;
      logoLink.style.transition = prevTransition;

      if (logoNav) {
        var nr = logoNav.getBoundingClientRect();
        navRest = { left: nr.left + window.scrollX, top: nr.top + window.scrollY, width: nr.width, height: nr.height };
      }
    }

    measureRest();
    window.addEventListener('resize', measureRest);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureRest);

    onMove(function (e) {
      if (!logoRest) return;
      var panelOpen = logoNav && getComputedStyle(logoNav).visibility === 'visible';
      var zone = panelOpen && navRest ? navRest : logoRest;
      var pad = panelOpen ? OPEN_ZONE : CLOSED_ZONE;

      var left = zone.left - window.scrollX - pad;
      var top = zone.top - window.scrollY - pad;
      var right = left + zone.width + pad * 2;
      var bottom = top + zone.height + pad * 2;

      if (e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom) {
        var cx = logoRest.left - window.scrollX + logoRest.width / 2;
        var cy = logoRest.top - window.scrollY + logoRest.height / 2;
        var dx = cx - e.clientX;
        var dy = cy - e.clientY;

        var refDist = Math.sqrt(Math.pow(logoRest.width / 2 + pad, 2) + Math.pow(logoRest.height / 2 + pad, 2));
        var k = DODGE / refDist;
        var moveX = dx * k;
        var moveY = dy * k;
        var moveDist = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveDist > DODGE) {
          moveX = moveX / moveDist * DODGE;
          moveY = moveY / moveDist * DODGE;
        }
        logoLink.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px)';
      } else {
        logoLink.style.transform = '';
      }
    });

    onEnd(function () { logoLink.style.transform = ''; });
    return measureRest;
  }

  return { isGhostMouse: isGhostMouse, onMove: onMove, onEnd: onEnd, dodge: dodge, logoDodge: logoDodge };
})();
