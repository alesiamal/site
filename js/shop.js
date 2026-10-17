/* Магазин: картинка товара открывается во весь экран по клику.
   Механика та же, что у разборов работ на портфолио (initZoom в main.js) и тот же
   слой .zoom из style.css — но main.js сюда тянуть нечего, он весь про hero и модалки
   портфолио, поэтому здесь свой короткий файл.

   Слушатель один на всю страницу (делегирование): карточек полсотни, и вешать на
   каждую свой обработчик незачем; заодно новые картинки, добавленные в разметку
   потом, заработают сами. */
(function () {
  var SELECTOR = '.shop-card img, .shop-masonry img';
  var layer = null;

  function close() {
    if (!layer) return;
    layer.remove();
    layer = null;
    document.removeEventListener('keydown', onKey, true);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  function open(src, alt) {
    close();
    layer = document.createElement('div');
    layer.className = 'zoom';
    var big = document.createElement('img');
    big.src = src;
    big.alt = alt || '';
    layer.appendChild(big);
    layer.addEventListener('click', close);
    document.body.appendChild(layer);
    document.addEventListener('keydown', onKey, true);
  }

  document.addEventListener('click', function (e) {
    var img = e.target.closest ? e.target.closest(SELECTOR) : null;
    if (!img) return;
    open(img.currentSrc || img.src, img.alt);
  });

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
