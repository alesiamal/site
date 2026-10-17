/* Английская версия сайта.

   Одна и та же разметка на оба языка: кнопка «en» в шапке запоминает выбор и
   перезагружает страницу, а перед показом содержимого русский текст подменяется
   английским по словарю js/i18n-en.js. Отдельных файлов страниц на английском нет —
   иначе любую правку пришлось бы делать дважды и рано или поздно версии разъехались
   бы.

   Почему перезагрузка, а не подмена на лету: к моменту, когда страница собрана,
   main.js уже разобрал абзацы about на спаны по словам, замерил их позиции для
   подсветки, посчитал зоны «убегания» у лого. Подменить текст под всем этим — значит
   чинить каждую такую мелочь по отдельности. Перезагрузка на статике мгновенная, а
   перевод применяется ДО того, как страница показана (include.js зовёт I18N.apply()
   сразу после сборки включений, до снятия заслонки по шрифтам), поэтому русского
   текста никто не видит — не мелькает даже на кадр.

   На первый визит язык угадывается по настройкам браузера (см. detect ниже), дальше
   решает только кнопка: нажатое запоминается и больше не перебивается.

   Словарь ключуется самим русским текстом, а не выдуманными id: ключ видно в
   разметке, и перевод не теряет связь с оригиналом. Чего нет в словаре — остаётся
   как есть, поэтому новая строка на странице не ломает ничего, просто не переводится
   (и это сразу видно).

   Что переводится:
     - «текстовые единицы» — элементы, внутри которых есть свой текст и только
       строчные теги (p, h2, span, button, a…). Ключ — их innerHTML целиком, вместе с
       <b> и <a>: у английской фразы другой порядок слов, и разбивать её по кускам
       нельзя;
     - атрибуты alt, title, aria-label, placeholder, data-desc, data-date;
     - <title> страницы и lang у <html>;
     - заголовок «ЗА◆●ИСЬ» — особый случай, см. applyWord ниже.
   Внутрь <template> (разборы работ) заходим отдельно: в обычный обход дерева они не
   попадают, а текста там больше, чем на самой странице. */
(function () {
  'use strict';

  var KEY = 'alesiamal-lang';
  var DEFAULT = 'ru';

  // Строчные теги: встречая их внутри абзаца, мы всё равно считаем абзац одной
  // фразой. Всё остальное (div, img, video, ul) означает, что это не фраза, а блок, —
  // внутрь надо идти глубже.
  var INLINE = { SPAN: 1, A: 1, B: 1, I: 1, EM: 1, STRONG: 1, BR: 1, SMALL: 1, SUP: 1, SUB: 1, U: 1 };
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };
  // href в списке ради одной строки: на английской версии «скачать резюме» ведёт на
  // другой файл (assets/resume-en.pdf). Остальные ссылки от этого не страдают — что
  // не записано в словаре, то не меняется.
  var ATTRS = ['alt', 'title', 'aria-label', 'placeholder', 'href', 'data-desc', 'data-date'];

  var dict = window.I18N_EN || {};

  function norm(s) {
    return String(s).replace(/\s+/g, ' ').trim();
  }

  /* Какой язык показывать. Три источника по убыванию важности:
     1) ?lang= в адресе — так можно дать ссылку сразу на нужную версию;
     2) выбор кнопкой, запомненный в localStorage;
     3) язык браузера — только для первого визита, пока человек ничего не выбрал. */
  function lang() {
    var q = /[?&]lang=(en|ru)(?:&|$)/.exec(location.search);
    if (q) {
      // Заодно запоминаем: дальше человек ходит по сайту уже на выбранном языке.
      if (q[1] !== stored()) setLang(q[1]);
      return q[1];
    }
    return stored() || detect();
  }

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      // Приватный режим: хранилище может быть недоступно — тогда выбора просто нет.
      return null;
    }
  }

  /* Язык первого визита — по настройкам браузера. navigator.languages это список
     языков, которые человек выбрал в системе, по убыванию предпочтения: у минчанина
     обычно ['ru-BY', 'ru', 'en'], у немца ['de-DE', 'de', 'en']. Берём первый, который
     умеем, — так язык чтения определяется по самому человеку, а не по стране, откуда
     он зашёл (русскоязычный из Варшавы и англоязычный из Минска получили бы по
     геопозиции не своё).

     Белорусский, украинский и казахский ведут на русскую версию: белорусской нет, а
     русский этим людям заведомо ближе английского. Любой другой язык — английская:
     она для них международный запасной, а не «неправильная» русская.

     Результат НЕ запоминается: это догадка, а не выбор. Нажмёт кнопку — вот тогда
     запомним и больше гадать не будем. */
  function detect() {
    var raw = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
    var list = [];
    for (var k = 0; k < raw.length; k++) {
      if (raw[k]) list.push(String(raw[k]).toLowerCase());
    }
    for (var i = 0; i < list.length; i++) {
      var code = list[i];
      if (/^(ru|be|uk|kk)\b/.test(code)) return 'ru';
      if (/^en\b/.test(code)) return 'en';
    }
    // Язык в списке есть, но незнакомый (немец, поляк) — английская версия. Списка
    // нет вовсе (браузер промолчал) — остаёмся на языке сайта.
    return list.length ? 'en' : DEFAULT;
  }

  function setLang(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  // Перевод одной строки. Если её нет в словаре — возвращаем как есть.
  function t(s) {
    var hit = dict[norm(s)];
    return hit === undefined ? s : hit;
  }

  /* Текстовая единица: есть собственный текст и ни одного блочного потомка. */
  function isUnit(el) {
    if (el.classList && el.classList.contains('hero__word')) return true;
    var own = false;
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.nodeValue.trim()) { own = true; break; }
    }
    if (!own) return false;
    var kids = el.getElementsByTagName('*');
    for (var i = 0; i < kids.length; i++) {
      if (!INLINE[kids[i].tagName]) return false;
    }
    return true;
  }

  /* Обход: сверху вниз, внутрь текстовых единиц не заходим (их переводим целиком),
     зато заходим в содержимое <template> — там лежат разборы работ. */
  function walk(node, visit) {
    for (var el = node.firstElementChild; el; el = el.nextElementSibling) {
      if (SKIP[el.tagName]) continue;
      if (el.tagName === 'TEMPLATE') { walk(el.content, visit); continue; }
      visit(el);
      if (!isUnit(el)) walk(el, visit);
    }
  }

  /* Заголовок «ЗА◆●ИСЬ» собран из отдельных спанов-букв: каждая буква живёт своей
     жизнью (наведение, анимация в main.js), и подменить innerHTML целиком нельзя —
     пропадут сами спаны. Поэтому у слова берём только текст, а английское слово
     раскладываем обратно по буквам. Длина может не совпадать: спаны пересобираются.
     Фигуры между словами не трогаются — они отдельные элементы. */
  function applyWord(el, en) {
    var cls = 'hero__letter';
    var first = el.querySelector('.' + cls);
    if (first) cls = first.className;
    var html = '';
    for (var i = 0; i < en.length; i++) {
      var ch = en.charAt(i);
      // Пробел внутри слова — только неразрывный: каждая буква здесь отдельный
      // флекс-элемент, а обычный пробел в нём схлопнулся бы в ноль, и «LET'S GO»
      // слиплось бы в одно слово.
      html += '<span class="' + cls + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
    }
    el.innerHTML = html;
  }

  function translate(root) {
    walk(root, function (el) {
      for (var i = 0; i < ATTRS.length; i++) {
        var name = ATTRS[i];
        if (!el.hasAttribute(name)) continue;
        var value = el.getAttribute(name);
        var en = dict[norm(value)];
        if (en !== undefined) el.setAttribute(name, en);
      }

      if (!isUnit(el)) return;

      if (el.classList.contains('hero__word')) {
        var word = dict[norm(el.textContent)];
        if (word !== undefined) applyWord(el, word);
        return;
      }

      var key = norm(el.innerHTML);
      var html = dict[key];
      if (html !== undefined) el.innerHTML = html;
    });
  }

  /* Кнопки «en / ru» в шапке. Вешаются всегда, на обоих языках: иначе с английской
     версии нельзя было бы вернуться. */
  function wireButtons(current) {
    var buttons = document.querySelectorAll('.logo-nav__lang-btn');
    Array.prototype.forEach.call(buttons, function (btn) {
      var value = norm(btn.textContent).toLowerCase();
      var isCurrent = value === current;
      btn.classList.toggle('is-current', isCurrent);
      if (isCurrent) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');

      btn.addEventListener('click', function () {
        if (value === lang()) return;
        setLang(value);
        // ?lang= из адреса убираем: иначе он перебил бы только что сделанный выбор,
        // и кнопка не сработала бы на странице, открытой по такой ссылке.
        var url = location.href.replace(/([?&])lang=(en|ru)(&|$)/, '$1').replace(/[?&]$/, '');
        if (url !== location.href) location.replace(url);
        else location.reload();
      });
    });
  }

  function apply() {
    var current = lang();
    wireButtons(current);
    if (current !== 'en') return;
    document.documentElement.lang = 'en';
    document.title = t(document.title);
    translate(document.body);
  }

  /* Для сбора словаря: I18N.collect() в консоли возвращает все строки, которые
     перевод вообще видит на этой странице, — по ним и собран js/i18n-en.js. Строка без
     кириллицы (instagram, telegram) в список не попадает: переводить её нечего. */
  function collect() {
    var out = [];
    var seen = {};
    function add(s) {
      s = norm(s);
      if (!s || seen[s] || !/[А-Яа-яЁё]/.test(s)) return;
      seen[s] = 1;
      out.push(s);
    }
    add(document.title);
    walk(document.body, function (el) {
      for (var i = 0; i < ATTRS.length; i++) {
        if (el.hasAttribute(ATTRS[i])) add(el.getAttribute(ATTRS[i]));
      }
      if (!isUnit(el)) return;
      add(el.classList.contains('hero__word') ? el.textContent : el.innerHTML);
    });
    return out;
  }

  window.I18N = { apply: apply, t: t, lang: lang, detect: detect, collect: collect };
})();
