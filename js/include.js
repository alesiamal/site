(function () {
  // Начертания, без которых первый экран выглядит не так, как задуман. Ждём именно
  // их поимённо, а не document.fonts.ready: ready резолвится, только когда доедут
  // ВСЕ шрифты, которые страница успела запросить, — включая Moula-Bold в скрытой
  // плашке навигации и Moula-Regular в модалках. Показ первого экрана не должен
  // зависеть от того, что нужно совсем другим блокам.
  var CRITICAL_FONTS = [
    '400 1em Soledago', // заголовок "ЗАИСЬ"
    '500 1em Moula',    // "скоро будет", "алеся мал", заголовки категорий
    '100 1em Moula'     // подписи вокруг hero, роль и текст в about
  ];

  // Предохранитель: если шрифт не доедет (404, оффлайн, очень медленная сеть),
  // страница обязана показаться всё равно — пусть системным шрифтом, но показаться.
  // Невидимый сайт хуже некрасивого.
  var REVEAL_TIMEOUT = 2500;

  function loadIncludes() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
    var loads = nodes.map(function (node) {
      var url = node.getAttribute('data-include');
      return fetch(url)
        .then(function (res) { return res.text(); })
        .then(function (html) {
          var tmp = document.createElement('div');
          tmp.innerHTML = html.trim();
          var content = tmp.firstElementChild;
          if (content) node.replaceWith(content);
        })
        .catch(function (err) {
          console.error('Failed to load include:', url, err);
        });
    });
    return Promise.all(loads);
  }

  // Пункт меню текущей страницы подсвечивается сам: раньше «is-active» был вписан
  // в partials/header.html руками, и на второй странице подсветка осталась бы на
  // портфолио. Шапка одна на все страницы, поэтому сравниваем с именем файла.
  function markActiveNav() {
    var page = location.pathname.split('/').pop() || 'index.html';
    var items = document.querySelectorAll('.logo-nav__item[href]');
    Array.prototype.forEach.call(items, function (item) {
      var href = item.getAttribute('href').split('/').pop();
      item.classList.toggle('is-active', href === page);
    });
  }

  // Вызывается ровно один раз — из ветки "шрифты готовы" или из таймаута, что
  // наступит раньше.
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    document.documentElement.classList.add('fonts-ready');
  }

  function waitForFonts() {
    // Старые браузеры без CSS Font Loading API — показываем сразу, для них поведение
    // просто откатывается к прежнему (шрифт подменится по мере загрузки).
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(CRITICAL_FONTS.map(function (font) {
      // .load() отклоняется, если начертание не нашлось — ловим здесь, чтобы одно
      // сломанное не заблокировало показ остальных.
      return document.fonts.load(font).catch(function () {});
    }));
  }

  loadIncludes().then(function () {
    // Перевод — сразу после сборки включений и ДО того, как страница показана
    // (заслонку снимает reveal ниже): на английской версии русский текст не должен
    // мелькнуть даже на кадр. Если i18n.js не подключён, всё работает как раньше.
    if (window.I18N) window.I18N.apply();

    // Порядок важен: сначала include'ы в DOM, потом ожидание шрифтов, и только потом
    // main.js. Так main.js меряет rest-позиции для доджа уже после того, как метрики
    // Moula/Soledago применились, — иначе он кэширует ширины фолбэк-шрифта и зоны
    // реакции не совпадают с реальными буквами (его собственный пересчёт по
    // document.fonts.ready остаётся как подстраховка, но теперь почти не нужен).
    setTimeout(reveal, REVEAL_TIMEOUT);

    return waitForFonts().then(function () {
      reveal();
      markActiveNav();
      // Какой скрипт страницы подключать — написано на самом теге include.js
      // (data-main). У портфолио это js/main.js, у магазина пока ничего: вся логика
      // main.js — про hero и модалки портфолио, на другой странице она не нужна.
      var self = document.querySelector('script[src$="include.js"]');
      var main = self && self.hasAttribute('data-main') ? self.getAttribute('data-main') : 'js/main.js';
      // Можно перечислить несколько файлов через запятую — у магазина их два.
      main.split(',').forEach(function (src) {
        src = src.trim();
        if (!src) return;
        var script = document.createElement('script');
        // Обязательно: у скрипта, добавленного через JS, async по умолчанию true, и
        // файлы выполнились бы в случайном порядке. А pointer.js должен отработать
        // раньше страничного скрипта — тот сразу зовёт Pointer.
        script.async = false;
        script.src = src;
        document.body.appendChild(script);
      });
    });
  });
})();
