/* Магазин: картинка товара открывается во весь экран по клику.
   Механика та же, что у разборов работ на портфолио (initZoom в main.js) и тот же
   слой .zoom из style.css — но main.js сюда тянуть нечего, он весь про hero и модалки
   портфолио, поэтому здесь свой короткий файл.

   Слушатель один на всю страницу (делегирование): карточек полсотни, и вешать на
   каждую свой обработчик незачем; заодно новые картинки, добавленные в разметку
   потом, заработают сами. */
(function () {
  var SELECTOR = '.shop-card img, .shop-masonry img';
  var SWIPE_MIN = 50;        // px, короче — случайное дёрганье пальцем
  var SWIPE_RATIO = 1.5;     // горизонталь должна быть настолько длиннее вертикали

  var layer = null;
  var big = null;
  var gallery = [];          // соседи открытой картинки — весь её раздел
  var index = 0;

  function close() {
    if (!layer) return;
    layer.remove();
    layer = null;
    big = null;
    gallery = [];
    sliding = false;
    document.removeEventListener('keydown', onKey, true);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  }

  /* Листание по кругу. + длина перед остатком: иначе шаг назад с первой картинки дал
     бы -1 вместо последней.

     Снимок уезжает в сторону листания, за краем экрана меняется и возвращается с
     другой стороны: мгновенная подмена между похожими скетчами читалась как «ничего
     не произошло». Длительности и классы — общие с панелью работы в портфолио
     (initWorkSwipe в main.js, .is-slide-* в style.css). */
  var SLIDE_OUT = 170;
  var SLIDE_IN = 230;
  var sliding = false;

  function step(delta) {
    if (!layer || gallery.length < 2 || sliding) return;

    var img = big;
    var dir = delta > 0 ? -1 : 1;
    sliding = true;
    img.classList.add('is-slide-out');
    img.style.transform = 'translateX(' + dir * 100 + 'vw)';

    setTimeout(function () {
      // Окно могли закрыть, пока картинка уезжала, — тогда менять уже нечего.
      if (!layer || big !== img) { sliding = false; return; }
      img.classList.remove('is-slide-out');
      img.classList.add('is-slide-jump');
      img.style.transform = 'translateX(' + -dir * 100 + 'vw)';
      index = (index + delta + gallery.length) % gallery.length;
      show();

      // Чтение размера проявляет перескок: без него браузер склеит оба изменения в
      // одно и картинка просто окажется на месте, без движения.
      void img.offsetWidth;

      img.classList.remove('is-slide-jump');
      img.classList.add('is-slide-in');
      img.style.transform = 'translateX(0)';

      setTimeout(function () {
        img.classList.remove('is-slide-in');
        img.style.transform = '';
        sliding = false;
      }, SLIDE_IN);
    }, SLIDE_OUT);
  }

  function show() {
    var img = gallery[index];
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || '';
  }

  function open(img) {
    close();

    // Листаем в пределах своего раздела: из скетчей не улетаем в футболки.
    var section = img.closest ? img.closest('.shop-section') : null;
    gallery = section
      ? Array.prototype.slice.call(section.querySelectorAll(SELECTOR))
      : [img];

    // Порядок — как глазами по странице: сверху вниз, при равной высоте слева
    // направо. По разметке листать нельзя: в кладке сначала идёт вся первая колонка,
    // потом вся вторая, и «следующая» картинка оказалась бы где-то в другом конце
    // экрана. Сортируем по месту на странице, а не по DOM.
    gallery.sort(function (a, b) {
      var ra = a.getBoundingClientRect();
      var rb = b.getBoundingClientRect();
      // Допуск: картинки в одном ряду почти никогда не совпадают по верху до пикселя.
      if (Math.abs(ra.top - rb.top) > 24) return ra.top - rb.top;
      return ra.left - rb.left;
    });

    index = Math.max(gallery.indexOf(img), 0);

    layer = document.createElement('div');
    layer.className = 'zoom';
    big = document.createElement('img');
    layer.appendChild(big);
    show();

    // Клик закрывает — но только если это именно клик, а не конец свайпа: после
    // касания браузер досылает click, и без этой проверки пролистывание закрывало бы
    // окно.
    var swiped = false;
    layer.addEventListener('click', function () {
      if (swiped) { swiped = false; return; }
      close();
    });

    var startX = 0, startY = 0, tracking = false;
    layer.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      tracking = true;
      swiped = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    layer.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
      swiped = true;
      step(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.body.appendChild(layer);
    document.addEventListener('keydown', onKey, true);
  }

  document.addEventListener('click', function (e) {
    var img = e.target.closest ? e.target.closest(SELECTOR) : null;
    if (!img) return;
    open(img);
  });

  /* Кладка скетчей и футболок: на компьютере три колонки, на телефоне две.

     Раньше на телефоне колонки распускались, и картинки шли общим потоком через CSS
     columns. Браузер балансирует такой поток приблизительно: в скетчах одна колонка
     заканчивалась на 138px ниже другой — та самая «одна ниже другой», на которую
     жаловалась Алеся.

     Поэтому раскладываем сами: идём по картинкам в исходном порядке и кладём каждую
     в ту колонку, которая сейчас короче. Высоту считаем по атрибутам width/height у
     картинки, а не по факту на странице: так расчёт не ждёт загрузки файлов и не
     вызывает лишних перерасчётов раскладки. Остаток разницы добирает CSS: у колонок
     общая высота, и последняя картинка в короткой растягивается до общего низа.

     На компьютере картинки возвращаются в свои исходные колонки — порядок в макете
     авторский, и пересобирать его незачем. */
  (function initMasonryColumns() {
    var MOBILE = '(max-width: 900px)';
    var MOBILE_COLS = 2;
    if (!window.matchMedia) return;
    var mq = matchMedia(MOBILE);

    document.querySelectorAll('.shop-masonry').forEach(function (masonry) {
      var cols = Array.prototype.slice.call(masonry.querySelectorAll('.shop-masonry__col'));
      var frames = Array.prototype.slice.call(masonry.querySelectorAll('.shop-frame'));
      if (cols.length <= MOBILE_COLS || !frames.length) return;

      // Откуда картинка родом — чтобы вернуть её на место на большом экране.
      var home = frames.map(function (frame) { return frame.parentNode; });

      function gap() {
        return parseFloat(getComputedStyle(masonry).columnGap) || 0;
      }

      function ratio(frame) {
        var img = frame.querySelector('img');
        if (!img) return 1;
        var w = parseFloat(img.getAttribute('width')) || img.naturalWidth || 1;
        var h = parseFloat(img.getAttribute('height')) || img.naturalHeight || 1;
        return h / w;
      }

      function layout() {
        // Лишние колонки прячем руками: CSS-селектор :empty на них не сработает —
        // внутри остаются переводы строк из разметки, а это для него содержимое.
        cols.forEach(function (col, i) {
          col.style.display = (mq.matches && i >= MOBILE_COLS) ? 'none' : '';
        });

        if (mq.matches) {
          // Высоты считаем в долях ширины колонки: колонки одинаковой ширины, и для
          // сравнения этого достаточно. Зазор переводим в те же единицы.
          var colWidth = Math.max(cols[0].offsetWidth, 1);
          var g = gap() / colWidth;

          // Первый проход, жадный: каждая картинка идёт в ту колонку, которая сейчас
          // короче.
          var place = frames.map(function () { return 0; });
          var heights = [];
          for (var i = 0; i < MOBILE_COLS; i++) heights.push(0);
          frames.forEach(function (frame, idx) {
            var shortest = 0;
            for (var c = 1; c < MOBILE_COLS; c++) {
              if (heights[c] < heights[shortest]) shortest = c;
            }
            place[idx] = shortest;
            heights[shortest] += ratio(frame) + (heights[shortest] ? g : 0);
          });

          // Второй проход, доводка. Жадность оставляет разницу в несколько процентов,
          // а её потом забирают промежутки между картинками — и в одной колонке они
          // становятся заметно шире. Поэтому пробуем переносить по одной картинке из
          // высокой колонки в низкую и оставляем перенос, если разница уменьшилась.
          // Порядок внутри колонок при этом не меняется: место картинки определяется
          // её номером в разметке, а не тем, когда её перенесли.
          function spread(assign) {
            var h = [];
            for (var c = 0; c < MOBILE_COLS; c++) h.push(0);
            assign.forEach(function (col, idx) {
              h[col] += ratio(frames[idx]) + (h[col] ? g : 0);
            });
            return Math.max.apply(null, h) - Math.min.apply(null, h);
          }

          var best = spread(place);
          var improved = true;
          var guard = 0;
          while (improved && guard++ < 50) {
            improved = false;
            for (var idx = 0; idx < place.length; idx++) {
              for (var c = 0; c < MOBILE_COLS; c++) {
                if (c === place[idx]) continue;
                var was = place[idx];
                place[idx] = c;
                var now = spread(place);
                if (now < best - 0.0005) {
                  best = now;
                  improved = true;
                } else {
                  place[idx] = was;
                }
              }
            }
          }

          frames.forEach(function (frame, idx) { cols[place[idx]].appendChild(frame); });
        } else {
          frames.forEach(function (frame, i) { home[i].appendChild(frame); });
        }
      }

      layout();
      if (mq.addEventListener) mq.addEventListener('change', layout);
      else if (mq.addListener) mq.addListener(layout);
    });
  })();

  // «Убегание» от курсора — та же механика, что на портфолио (js/pointer.js):
  // лого в шапке и в подвале и названия разделов. У названий зона шире (50px):
  // строка низкая, и с маленькой зоной эффект почти не успевает сработать.
  if (window.Pointer) {
    Pointer.logoDodge();
    Pointer.dodge(document.querySelector('.footer__logo'));
    document.querySelectorAll('.shop-section__title').forEach(function (title) {
      Pointer.dodge(title, 50);
    });
    Pointer.dodge(document.querySelector('.shop__sun'), 20);
  }
})();
