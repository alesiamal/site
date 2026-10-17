/* Словарь английской версии: русская строка -> английская. Движок — js/i18n.js.

   Ключ — это ровно тот текст, что стоит в разметке (у абзацев — вместе со
   строчными тегами внутри, <b> и <a>: в английской фразе другой порядок слов, и
   разбивать её по кускам нельзя). Пробелы внутри ключа не важны — они схлопываются
   перед поиском. Чего здесь нет, то на английской версии остаётся по-русски: это не
   ошибка, а сигнал, что строку добавили на страницу и не перевели.

   Собирается не руками: I18N.collect() в консоли возвращает все строки, которые
   перевод видит на странице. Добавила работу — открой консоль, сверь список с этим
   файлом. */
window.I18N_EN = {

  /* ---------- Шапка, подвал, общее ---------- */
  'алеся мал — графический дизайнер': 'alesia mal — graphic designer',
  'магазин — алеся мал': 'shop — alesia mal',
  'Разделы сайта': 'Site sections',
  'портфолио': 'portfolio',
  'магазин': 'shop',
  'Наверх': 'Back to top',
  'Алеся Мал': 'Alesia Mal',
  'алеся мал': 'alesia mal',

  /* ---------- Первый экран ---------- */
  /* Заголовок собран из двух слов и двух фигур: по-русски ЗА ◆ ● ИСЬ — «запись».
     По-английски F (.) KIN G (.) — обе точки те самые анимированные фигуры: первая
     стоит на стыке слов, как и по-русски, а вторая уезжает в конец строки (порядком
     во флексе, см. style.css, html[lang="en"]). Меняя слова, помни: первая фигура
     всегда встаёт между ними, вторая — после второго слова. */
  'ЗА': 'F',
  'ИСЬ': 'KIN G',
  'скоро будет': "let's",
  'дизайн': 'design',
  'анимация': 'animation',
  'вектор': 'vector',
  'презентации': 'presentations',
  'печать': 'print',

  /* ---------- Знакомство ---------- */
  'графический дизайнер': 'graphic designer',
  'в дизайне с 2019. занимаюсь <b class="about__em">анимациями</b>, презентациями, печаткой, работаю с <b class="about__em">вектором</b>.':
    'in design since 2019. i do <b class="about__em">animation</b>, presentations and print, and work with <b class="about__em">vector</b>.',
  'дизайню как душе угодно и стараюсь делать это хорошо.':
    'i design however my heart tells me to, and try to do it well.',
  // CV прописными: это аббревиатура, и строчными она читается как слово.
  'скачать резюме': 'download CV',
  // Английская версия отдаёт английское резюме. Ключ — путь из href, а не текст.
  'assets/resume.pdf': 'assets/resume-en.pdf',

  /* ---------- Разделы и кнопки портфолио ---------- */
  'диджитал': 'digital',
  'печатка': 'print',
  'смотреть ещё': 'show more',
  'скрыть': 'hide',
  'Подробнее о работе': 'About the work',
  'Закрыть': 'Close',
  'описание работы': 'work description',
  'Фото Алеси Мал': 'Photo of Alesia Mal',
  'Заказать анимацию': 'Order an animation',
  'написать в тг': 'message me on telegram',
  'Включить звук': 'Turn sound on',
  'Выключить звук': 'Turn sound off',

  /* ---------- Даты ---------- */
  'май 2023': 'May 2023',
  'апрель 2024': 'April 2024',
  'май 2024': 'May 2024',
  'август 2024': 'August 2024',
  'октябрь 2024': 'October 2024',
  'март 2025': 'March 2025',
  'август 2025': 'August 2025',
  'ноябрь 2025': 'November 2025',
  'декабрь 2025': 'December 2025',
  'июль 2026': 'July 2026',

  /* ---------- Диджитал: карточки ---------- */
  'Анимация 2': 'Animation 2',
  'Анимация 3': 'Animation 3',
  'Анимация 4': 'Animation 4',
  'Анимация 5': 'Animation 5',
  'Анимация 7': 'Animation 7',
  'Анимация 8': 'Animation 8',
  'Постер, который я сделала сама для себя, без цели. Иллюстрацию лица я изначально нарисовала на холсте ручкой и красками, потом повторила в диджитал на планшете, в программе ProCreate. Постер собирала в Photoshop, анимацию в After Effects.':
    'A poster I made for myself, with no goal in mind. I first drew the face on canvas with a pen and paints, then redrew it digitally on a tablet in Procreate. I put the poster together in Photoshop and animated it in After Effects.',
  'Анимация, которую я сделала сама для себя, в новый 2026 год. Полностью все собирала в After Effects.':
    'An animation I made for myself for the new year 2026. All of it was put together in After Effects.',
  'Зацикленная анимация, которую я делала в агентстве FISTASHKI для бренда t2. Анимация для большого драматического театра. Собирала анимацию в After Effects, фотки генерила в Midjourney и подготавливала к анимации в Photoshop.':
    'A looped animation I made at the FISTASHKI agency for the brand t2 — for the big drama theatre. I built the animation in After Effects, generated the images in Midjourney and prepared them for animation in Photoshop.',
  'Анимация для t2, которую я сделала в агентстве Fistashki. Работала в After Effects.':
    'An animation for t2 that I made at the Fistashki agency. Done in After Effects.',
  'Зацикленная анимация агентства FISTASHKI, отражающая кейс Банка России. Абстракция летающих объектов из портала. Собирала в After Effects. Объекты брала со стоков.':
    'A looped animation by the FISTASHKI agency for a Bank of Russia case. An abstraction of objects flying out of a portal. Built in After Effects; the objects are from stock libraries.',

  /* ---------- Разбор: эмоджи Fistashki ---------- */
  'Анимированные эмоджи Fistashki': 'Animated Fistashki emoji',
  'Ссылка на эмоджи': 'Link to the emoji',
  'ТЗ': 'Brief',
  'Необходимо было создать набор эмоджи для агентства Fistashki. Был набор необходимых эмоджи для написания в тг постах. Я выбрала стеклянную стилистику элементов, соответственно бренду, в фирменных цветах агентства':
    'The task was to create a set of emoji for the Fistashki agency — the set they needed for writing posts on Telegram. I chose a glassy style for the elements, in keeping with the brand and its colours',
  'Эмоджи: карандаш': 'Emoji: pencil',
  'Эмоджи: сердце': 'Emoji: heart',
  'Эмоджи: грустный документ': 'Emoji: sad document',
  'Я сделала некоторые эмоджи анимированными: глитч для фирменной фисташковой головы, бьющееся сердце, анимированный лого и цифры, переливы на сияния.<br>Сами элементы я генерировала в ИИ':
    "I animated some of the emoji: a glitch for the brand's pistachio head, a beating heart, the animated logo and numbers, shimmer on the sparkles.<br>The elements themselves I generated with AI",
  'Эмоджи: лягушка': 'Emoji: frog',
  'Эмоджи: анатомическое сердце': 'Emoji: anatomical heart',
  'Эмоджи: логотип Fistashki': 'Emoji: Fistashki logo',
  'Эмоджи: стеклянная голова': 'Emoji: glass head',
  'Эмоджи: какашка': 'Emoji: poop',
  'Эмоджи: огонь': 'Emoji: fire',
  'Эмоджи: ёлка': 'Emoji: christmas tree',

  /* ---------- Разбор: анимация 2026 ---------- */
  'Анимация 2026 года': 'Animation for 2026',
  'Я сделала для себя видео в новый год, просто экспериментальная анимашка.':
    'A video I made for myself for the new year — just a little experiment.',
  'Цветовой вариант анимации': 'Colour version of the animation',
  'Второй цветовой вариант анимации': 'Second colour version of the animation',
  'Фон сделала из звезд с эффектом bulge, добавила time poster для маленького fps. Сделала два цветовых варианта расцветки. Кубик сделала из прямоугольников, меняющих расположение точек, высчитывала точки для ровного расположения. Анимация зациклена. Добавляла музыку и замедляла ее так, чтобы она тоже казалась зацикленной и совпадала с ритмом анимации.':
    'I made the background out of stars with a bulge effect and added posterize time for a low fps. I made two colour versions. The cube is built from rectangles whose points move — I calculated the points so they would line up evenly. The animation loops. I added music and slowed it down so that it would feel looped too and match the rhythm of the animation.',
  'Процесс работы над анимацией': 'Working on the animation',
  'Ссылка на пост': 'Link to the post',

  /* ---------- Разбор: театр в Тюмени (t2) ---------- */
  'Видео для театра в Тюмени': 'Video for a theatre in Tyumen',
  'Суть визуала: хотим создать видео на основе примера':
    'The idea of the visual: we want to make a video based on the example',
  'Взять несколько достопримечательностей Тюмени для перечисления, выбрать именно драмтеатр':
    'Run through a few Tyumen landmarks and settle on the drama theatre',
  'Внутри театра, перед началом спектакля, крупно, партер, один из зрителей фотографирует заставку спектакля на телефон, в углу экрана видно, что он абонент Т2 / или человек на телефоне звук выключает, и видно оператора на экране / или еще какой-то вариант:)':
    'Inside the theatre, before the show, close up, the stalls: one of the audience photographs the show’s title screen on a phone and the corner of the screen shows they are a T2 subscriber / or the person mutes the phone and the carrier is visible on screen / or some other option :)',
  'Цвета иллюстрации: не обязательно делать чб вариант, можно придерживаться гармоничного сочетания основной палитры бренда для визуалов. Можно взять мадженту как один из самых узнаваемых цветов бренда.':
    'Colours of the illustration: a black-and-white version is not required, a harmonious combination from the brand’s main palette for visuals is fine. Magenta can be used as one of the most recognisable brand colours.',
  'Посев будем проводить ТГ и ВК.': 'We will seed it on Telegram and VK.',
  'Пример из ТЗ: кадр видео-референса': 'From the brief: a frame of the reference video',
  'Скрин с задачи, где я сделала первую раскадровку': 'Screenshot of the task where I made the first storyboard',
  'Скриншот задачи с первой раскадровкой': 'Screenshot of the task with the first storyboard',
  'В те времена мы пользовались Миджорни: я генерила несколько вариантов разных стилистик театра снаружи и внутри, мы остановились на наиболее приближенной версии реальных тюменских достопримечательностей в конфетной расцветке.':
    'Back then we were using Midjourney: I generated several style options for the theatre inside and out, and we settled on the version closest to the real Tyumen landmarks, in candy colours.',
  'Варианты из Midjourney: зал театра, руки со зданиями, фасады':
    'Midjourney options: the theatre hall, hands holding buildings, facades',
  'Процесс анимации в after effects': 'Animating in After Effects',
  'Скринкаст работы над анимацией в After Effects': 'Screencast of the work in After Effects',

  /* ---------- Разбор: постер «кто ты такой» ---------- */
  'Анимированный постер «Да ты хоть знаешь, кто ты такой?»': 'Animated poster “Do you even know who you are?”',
  'Да ты хоть знаешь, кто ты такой?': 'Do you even know who you are?',
  'Один из коллекции анимированных постеров, которые я делала просто для себя и выкладывала в инстаграм. Это лицо сначала я рисовала ручкой на холсте, потом перевела в диджитал на айпаде. Сделала постер и анимировала все в афтер эффектс. Использовала эффекты бегущего текста, тайм постер. Суть фразы типа в том, что гопники по типу этой морды могут в качестве угрозы задать вопрос “да ты хоть знаешь, кто Я такой?”. А я чуть перевернула этот вопрос скорее в философско-психологическое русло, спрашивая про тебя. Кто ты такой?':
    'One of a series of animated posters I made just for myself and posted on instagram. I first drew this face with a pen on canvas, then redrew it digitally on an iPad. I made the poster and animated everything in After Effects, using scrolling text and posterize time. The phrase plays on the way a street tough with a face like this might threaten you with “do you even know who I am?”. I turned the question around into something more philosophical, asking about you. Who are you?',
  'Второй вариант анимации постера': 'Second version of the poster animation',
  'Рисунок лица ручкой и его цветная версия': 'The face drawn with a pen and its colour version',
  'Анимированный постер из той же коллекции': 'Another animated poster from the same series',

  /* ---------- Разбор: Маяковский ---------- */
  'Анимация с Маяковским': 'Animation with Mayakovsky',
  'Клиент хочет сделать видео, чтобы удержать внимание и чтоб оно не растянулось на 30 сек?':
    'The client wants a video that holds attention and does not stretch out to 30 seconds?',
  'Размещение в ВК/ТГ.': 'To be posted on VK and Telegram.',
  'Текст и подача в стиле агиток Маяковского, чтобы зуммерам зашло, как "прикольное ретро". Предлагаю Маяковского отрисовывать его в современной одежде.':
    'Text and delivery in the style of Mayakovsky’s agitprop posters, so that zoomers read it as "cool retro". I suggest drawing Mayakovsky in modern clothes.',
  'Пример из ТЗ: Маяковский в современной одежде': 'From the brief: Mayakovsky in modern clothes',
  'Пример из ТЗ: исторические агитки': 'From the brief: historical agitprop posters',
  'Сначала я сделала анимацию короткого отрывка, чтобы согласовать стилистику':
    'First I animated a short fragment so we could agree on the style',
  'Скрин переписки с правками': 'Screenshot of the chat with the revisions',
  'После нескольких правок сделала финальный вариант: с аудиоозвучкой и без нее. Выбрали тишину.':
    'After a few rounds of revisions I made the final version: with voice-over and without. Silence won.',
  'Финальный вариант анимации': 'Final version of the animation',

  /* ---------- Разбор: Банк России ---------- */
  'Анимация для Банка России': 'Animation for the Bank of Russia',
  'Анимация для поста агентства': 'Animation for the agency’s post',
  'Нам нужно сделать что-то такое же, но с лого Банка России. Возможно, изменить летающие элементы и оттенки (взять из гайдлайнов банка). Чтобы окружение осталось, как в отп, но добавилось несколько фишек банка россии.':
    'We need something just like this, but with the Bank of Russia logo. Possibly change the flying elements and the shades (take them from the bank’s guidelines). Keep the environment as in the OTP one, but add a few Bank of Russia touches.',
  'Видео с Отп банком справа – также моя анимация': 'The OTP Bank video on the right is my animation too',
  'Анимация для ОТП банка': 'Animation for OTP Bank',
  'Я сделала зацикленную анимацию, отражающую кейс Банка России. Абстракция летающих объектов из портала. Собирала в After Effects. Объекты брала со стоков.':
    'I made a looped animation for the Bank of Russia case. An abstraction of objects flying out of a portal. Built in After Effects; the objects are from stock libraries.',
  'Процесс сборки анимации в After Effects': 'Putting the animation together in After Effects',

  /* ---------- Печатка: карточки ---------- */
  'Леттеринг «хехе»': '“xexe” lettering',
  'Упаковка карточек креативных методик Fistashki': 'Packaging for Fistashki’s creative-methods cards',
  'Конкурс MUSTART 2024': 'MUSTART 2024 competition',
  'Оформление фасада лицея №102': 'Facade design for Lyceum No. 102',
  'Газета «Теребуты»': '“Terebuty” newspaper',
  'Журнал ко дню рождения': 'Birthday magazine',

  /* ---------- Разбор: Xexe ---------- */
  '25 нарисованных дудликов': '25 drawn doodles',
  'Мой авторский проект. Я делала стикеры, футболки с вышивкой своих рисунков, оформляла профиль для соцсетей, придумывала брендбук.':
    'My own project. I made stickers and t-shirts embroidered with my drawings, designed the social-media profile and put together a brand book.',
  'Анимированная гифка проекта Xexe': 'Animated gif for the Xexe project',
  'Сначала я нарисовала на планшете 25 дудликов, разукрасила, стала готовить к печати':
    'First I drew 25 doodles on a tablet, coloured them in and started preparing them for print',
  'Дудлики на чёрном фоне': 'Doodles on a black background',
  'Контуры дудликов для печати': 'Doodle outlines for print',
  'Раскрашенные дудлики': 'Coloured doodles',
  'Напечатала стикеры с трассировкой обрезки': 'I printed the stickers with the cut lines traced',
  'Напечатанные стикеры, фото 1': 'Printed stickers, photo 1',
  'Напечатанные стикеры, фото 2': 'Printed stickers, photo 2',
  'Напечатанные стикеры, фото 3': 'Printed stickers, photo 3',
  'Подготовила пару дудликов в векторе для машинной вышивки на футболках. Закупала футболки на вб, относила в ателье для вышивки':
    'I prepared a couple of doodles in vector for machine embroidery on t-shirts. I bought the t-shirts online and took them to an embroidery studio',
  'Дудлик в векторе для вышивки': 'A doodle in vector for embroidery',
  'Футболка с вышивкой на синем фоне': 'Embroidered t-shirt on a blue background',
  'Серая футболка с вышитым дудликом': 'Grey t-shirt with an embroidered doodle',
  'Вышивка крупным планом': 'The embroidery close up',
  'Вышитый кот на рукаве': 'Embroidered cat on a sleeve',
  'Предыдущее фото': 'Previous photo',
  'Следующее фото': 'Next photo',
  'Делала дизайны для соцсети: оформляла сторисы, посты': 'I designed for social media: stories and posts',
  'Сторис «Привет)»': 'Story “hi)”',
  'Сторис с описанием футболки': 'Story describing a t-shirt',
  'Сторис с футболками в наличии': 'Story with the t-shirts in stock',
  'Сторис-туториал, как заказать футболку': 'Tutorial story: how to order a t-shirt',
  'Сторис «Спасибо за просмотр»': 'Story “thanks for watching”',
  'Предыдущий сторис': 'Previous story',
  'Следующий сторис': 'Next story',
  'Пост 1': 'Post 1',
  'Пост 2': 'Post 2',
  'Пост 3': 'Post 3',
  'Пост 4': 'Post 4',
  'Пост 5': 'Post 5',
  'Пост 6': 'Post 6',
  'Пост 7': 'Post 7',
  'Пост 8': 'Post 8',
  'Пост 9': 'Post 9',
  'Логотип «хехе»': '“xexe” logo',
  'Сделала по приколу еще баннеры с дудликами, придумывала для каждого мотивационную фразу':
    'For fun I also made banners with the doodles, coming up with a motivational phrase for each one',
  'Баннер CURIOSITY': 'CURIOSITY banner',
  'Баннер I LOVE U': 'I LOVE U banner',
  'Баннер BEWARE': 'BEWARE banner',
  'Баннер ODD': 'ODD banner',
  'Баннер SMILE': 'SMILE banner',
  'Баннер LOOKS': 'LOOKS banner',
  'Баннер BE SHY': 'BE SHY banner',
  'Баннер MUTUAL': 'MUTUAL banner',
  'Баннер TRY': 'TRY banner',
  'Баннер STRANGE': 'STRANGE banner',
  'Баннер SMART': 'SMART banner',
  'Баннер ENJOY': 'ENJOY banner',
  'Баннер LISTEN': 'LISTEN banner',
  'Баннер EMBRACE': 'EMBRACE banner',
  'Предыдущий баннер': 'Previous banner',
  'Следующий баннер': 'Next banner',

  /* ---------- Разбор: лицей ---------- */
  'Баннеры на фасаде лицея': 'Banners on the lyceum facade',
  'Баннеры для лицея в Ростове-на-Дону': 'Banners for a lyceum in Rostov-on-Don',
  'Это полублаготворительный проект агентства — печатные баннеры для школы':
    'A semi-charitable agency project — printed banners for a school',
  'Необходимо разработать визуал, который будет использован на входе в учебное заведение.':
    'We need a visual to be used at the entrance of the school.',
  'ЦА - школьники, родители.': 'Audience: pupils and parents.',
  'Особенности<br>- баннер находится на солнечной стороне, потому будет выгорать.':
    'Things to keep in mind<br>- the banner is on the sunny side, so it will fade.',
  'Задача минимум - сделать обновленный коллаж на темы, связанные с городом.<br>Задача максимум - предложить вариант, который будет использовать другое визуальное решение.':
    'Minimum goal: an updated collage on themes connected with the city.<br>Maximum goal: propose an option built on a different visual solution.',
  'Было бы круто, если бы школьники хотели фотографироваться на фоне баннера.':
    'It would be great if pupils wanted to take photos in front of the banner.',
  'Фасад лицея со старым баннером, фото 1': 'The lyceum facade with the old banner, photo 1',
  'Фасад лицея со старым баннером, фото 2': 'The lyceum facade with the old banner, photo 2',
  'С командой креатива мы думали над разными вариантами': 'With the creative team we worked through different options',
  'Первые варианты визуалов': 'The first visual options',
  'Ещё варианты визуалов': 'More visual options',
  'В конечном итоге пришли к трем идеям': 'In the end we arrived at three ideas',
  'Сообщение с тремя идеями': 'Message with the three ideas',
  'Идея 1, баннер 1': 'Idea 1, banner 1',
  'Идея 1, баннер 2': 'Idea 1, banner 2',
  'Идея 1, баннер 3': 'Idea 1, banner 3',
  'Идея 2, баннер «Учись»': 'Idea 2, “Learn” banner',
  'Идея 2, баннер «Мечтай»': 'Idea 2, “Dream” banner',
  'Идея 2, баннер «Достигай»': 'Idea 2, “Achieve” banner',
  'Идея 3, баннер «Прошлое»': 'Idea 3, “Past” banner',
  'Идея 3, баннер «Настоящее»': 'Idea 3, “Present” banner',
  'Идея 3, баннер «Будущее»': 'Idea 3, “Future” banner',
  'Показали клиенту три идеи. Клиент выбрал идею 2 с несущественными правками, которые вносил уже мой коллега в связи с моим отпуском':
    'We showed the client three ideas. They chose idea 2 with minor revisions, which a colleague made while I was away on holiday',
  'Правки': 'Revisions',
  'Просят поменять 3D объекты - вместо первого (шар с дырками + крестик) и второго (красный диск) на более понятные и более связанные с обучением предметы':
    'They ask us to swap the 3D objects — the first one (a ball with holes and a cross) and the second (a red disc) — for clearer objects more connected with studying',
  'Финальный баннер «Учись»': 'Final “Learn” banner',
  'Финальный баннер «Мечтай»': 'Final “Dream” banner',
  'Финальный баннер «Достигай»': 'Final “Achieve” banner',
  'Перед днем знаний:': 'Right before the first day of school:',
  'Сообщение команды с фотографиями баннеров': 'Message from the team with photos of the banners',
  'Готовые баннеры на фасаде лицея': 'The finished banners on the lyceum facade',
  'Второй год ещё не высветлилась краска)': 'Second year and the colours still have not faded)',
  'Фасад лицея через год': 'The lyceum facade a year later',

  /* ---------- Разбор: газета «Теребуты» ---------- */
  'Стопка газет «Теребуты»': 'A stack of “Terebuty” newspapers',
  'Газета для загородного места': 'A newspaper for a place in the countryside',
  'Фриланс-проект для домика в деревне. Теребуты — это место для отдыха без городской шумихи. Изначально я без референсов накидала разноцветную стилистику газеты по присланному тексту и фотографиям местечка.':
    'A freelance project for a house in a village. Terebuty is a place to rest away from the noise of the city. At first, with no references, I sketched out a colourful style for the newspaper from the text and the photos of the place they sent me.',
  'Цветной вариант: первая полоса': 'Colour version: the front page',
  'Цветной вариант: разворот': 'Colour version: a spread',
  'Я рисовала от руки, генерировала изображения животных, растений и предметов, накладывала слоями текстуры и фотографии, игралась с положением текста.':
    'I drew by hand, generated images of animals, plants and objects, layered textures and photographs over them and played with where the text sits.',
  'Коллаж из нарисованных и сгенерированных элементов': 'A collage of drawn and generated elements',
  'Потом клиент решил отобразить газету в более сдержанном стиле.':
    'Then the client decided the newspaper should look more restrained.',
  'Референсы:': 'References:',
  'Референс: журнальный разворот': 'Reference: a magazine spread',
  'Референс: пост в соцсети': 'Reference: a social-media post',
  'Тогда я ушла в чёрно-белую стилистику': 'So I moved to a black-and-white style',
  'Чёрно-белая полоса 1': 'Black-and-white page 1',
  'Чёрно-белая полоса 2': 'Black-and-white page 2',
  'Чёрно-белая полоса 3': 'Black-and-white page 3',
  'Чёрно-белая полоса 4': 'Black-and-white page 4',
  'Чёрно-белая полоса 5': 'Black-and-white page 5',
  'Чёрно-белая полоса 6': 'Black-and-white page 6',
  'Чёрно-белая полоса 7': 'Black-and-white page 7',
  'Чёрно-белая полоса 8': 'Black-and-white page 8',
  'Предыдущая полоса': 'Previous page',
  'Следующая полоса': 'Next page',
  'Газета «Кулинарные истории»': '“Culinary stories” newspaper',
  'Первая полоса «Теребуты»': '“Terebuty” front page',
  'Разворот с полезными приложениями': 'Spread with useful apps',
  'Домик в Теребутах': 'The house in Terebuty',

  /* ---------- Разбор: часы «Луч» ---------- */
  'Заставка презентации MUSTART 2024': 'Title screen of the MUSTART 2024 presentation',
  'Дизайн парных часов': 'A design for a pair of watches',
  'Проект для конкурса дизайнеров часового завода «Луч». В презентации я показываю свою визуальную идею для пары часов.':
    'A project for the design competition of the Luch watch factory. In the presentation I show my visual idea for a pair of watches.',
  'Идея: обменяться глазами': 'The idea: swapping eyes',
  'Пара часов: «любовь в каждом взгляде»': 'A pair of watches: “love in every glance”',
  'Разворот презентации': 'A spread of the presentation',
  'Детали: циферблат, цвета pantone, ремешок': 'Details: the dial, pantone colours, the strap',
  'Иллюстрации рисовала в Illustrator и Procreate, анимацию собирала в After Effects, обработка — в Photoshop.':
    'I drew the illustrations in Illustrator and Procreate, built the animation in After Effects and did the retouching in Photoshop.',
  'Анимация часов, вариант 1': 'Watch animation, version 1',
  'Анимация часов, вариант 2': 'Watch animation, version 2',

  /* ---------- Разбор: журнал сестре ---------- */
  'Журнал и постеры разворотами': 'The magazine and the posters as spreads',
  'Журнал на день рождения сестре': 'A birthday magazine for my sister',
  'Печатный журнал, который я сделала сестре на день рождения. Родные написали тёплые слова и прислали фотографии, а я собрала всё это в один весёлый журнал.':
    'A printed magazine I made for my sister’s birthday. The family wrote warm words and sent photos, and I put it all together into one cheerful magazine.',
  'Все развороты журнала': 'All the spreads of the magazine',
  'Обложка журнала и разворот про маму': 'The cover and the spread about mum',
  'Каждый разворот старалась делать в своём стиле: яркие цвета, стикеры, разные шрифты и случайные рисунки — но по-дизайнерски. Референсы к большинству идей искала в пинтересте.':
    'I tried to give every spread its own style: bright colours, stickers, different typefaces and random drawings — but designed. For most of the ideas I looked for references on Pinterest.',
  'Разворот с поздравлением': 'Spread with birthday wishes',
  'Разворот с фотографиями': 'Spread with photographs',
  'Разворот с коллажем': 'Spread with a collage',
  'Фотографии обрабатывала и дорисовывала в Photoshop, а собирала всё в InDesign — это была моя первая работа в нём. Печать в CMYK.':
    'I retouched and painted over the photos in Photoshop and laid everything out in InDesign — my first project in it. Printed in CMYK.',
  'Разворот «тётя Света»': 'The “aunt Sveta” spread',
  'Разворот с поздравлением и фотографиями': 'Spread with wishes and photographs',
  'Разворот журнала': 'A spread of the magazine',
  'Задняя обложка и разворот от всей семьи': 'The back cover and the spread from the whole family',
  'Видео с журналом': 'Video of the magazine',
  'Бегущая строка «thank you»': 'A “thank you” ticker',

  /* ---------- Разбор: Фисташечки ---------- */
  'Коробка «Карточки креативных методик»': 'The “Creative methods cards” box',
  'Карточки креативных методик': 'Creative methods cards',
  'Фисташечки — это благотворительный проект, который мы делали в агентстве. Мои коллеги посещали Благотворительный фонд Алиса, и делали вместе с детьми креативные карточки для онлайн и оффлайн размещений. Подробнее про идею и реализацию можно почитать в посте агентства:':
    'Fistashechki is a charity project we did at the agency. My colleagues visited the Alisa charity foundation and made creative cards together with the children, for use online and offline. You can read more about the idea and how it was done in the agency’s post:',
  'Ссылка на пост тг': 'Link to the Telegram post',
  'Моя задача заключалась в дизайне печатных карточек и коробки. Необходимо было "упаковать" 32 карточки с цитатами детей, сделать рубашку карт, вкладыш, дизайн коробки, подготовить все под печать и сделать цифровую версию для сайта и медиа.':
    'My part was designing the printed cards and the box. I had to "package" 32 cards with quotes from the children, make the card backs, the insert and the box design, prepare everything for print and make a digital version for the site and the media.',
  'Пост с фотографиями напечатанных карточек и вкладыша': 'Post with photos of the printed cards and the insert',
  'ТЗ на коробку': 'Brief for the box',
  'ТЗ на коробку: развёртка с текстами': 'Brief for the box: the dieline with the texts',
  'По моей инициативе согласились на том, чтобы сократить текст на коробке. Я печатала на домашнем принтере очень много разных вариантов, склеивала коробки на клей-карандаш, отправляла коллегам на согласование':
    'At my suggestion we agreed to shorten the text on the box. I printed a great many versions on my home printer, glued the boxes together with a glue stick and sent them to colleagues for approval',
  'Склеенный вариант коробки, видео 1': 'The glued box, video 1',
  'Склеенный вариант коробки, видео 2': 'The glued box, video 2',
  'Финальная версия вкладыша': 'Final version of the insert',
  'Вкладыш, внешняя сторона': 'The insert, outside',
  'Вкладыш, внутренняя сторона': 'The insert, inside',
  'Финальная версия карточек': 'Final version of the cards',
  'Карточка с методикой «Минус — это плюс»': 'A card with the “A minus is a plus” method',
  'Рубашка карт с детскими рисунками': 'The card backs with the children’s drawings',
  'Финальная версия коробки': 'Final version of the box',
  'Развёртка коробки под печать': 'The box dieline for print',
  'Коробка в объёме': 'The assembled box',
  'Мои коллеги занимались упаковкой и оформлением подарков клиенту':
    'My colleagues took care of packing and wrapping the gifts for the client',
  'Подарочная упаковка с открыткой': 'Gift packaging with a card',
  'Готовые коробки перед отправкой': 'The finished boxes before shipping',
  'Визуал поста для тг канала': 'Visual for the Telegram channel post',
  'Визуал поста для телеграм-канала': 'Visual for the Telegram channel post',

  /* ---------- Магазин: знакомство ---------- */
  'Алеся на фоне стены со своими рисунками': 'Alesia in front of a wall of her drawings',
  'Привет': 'Hi',
  'я алеся, продаю всякое нарисованное или напечатанное в Минске/ доставкой по Беларуси.':
    'i’m alesia, i sell all sorts of drawn and printed things in Minsk / with delivery across Belarus.',
  'по заказам пишите в <a href="https://t.me/alesiamal" target="_blank" rel="noopener">тг</a>)':
    'for orders write me on <a href="https://t.me/alesiamal" target="_blank" rel="noopener">telegram</a>)',

  /* ---------- Магазин: холсты ---------- */
  /* Цены в белорусских рублях: «р» на английской версии разворачивается в BYN,
     иначе одинокая буква ничего не говорит. */
  'холсты в наличии': 'canvases in stock',
  'Холст с розово-красными волнами': 'Canvas with pink and red waves',
  'Холст с синим оленем': 'Canvas with a blue deer',
  'Холст с розовым кричащим лицом': 'Canvas with a pink screaming face',
  'Холст с солнцем и лицом': 'Canvas with a sun and a face',
  'Холст с крылатой фигурой': 'Canvas with a winged figure',
  'Холст с лицом, прошитым нитками': 'Canvas with a face stitched with thread',
  'Холст с надписью и зелёными пятнами': 'Canvas with lettering and green blots',
  'Чистый холст': 'Blank canvas',
  'Холст с синим котом': 'Canvas with a blue cat',
  '12x18см': '12x18cm',
  '40x40см': '40x40cm',
  '20x20см <span class="shop-card__note">(напечатанный холст)</span>':
    '20x20cm <span class="shop-card__note">(printed canvas)</span>',
  '20x20 <span class="shop-card__note">(пришит нитками)</span>':
    '20x20 <span class="shop-card__note">(stitched with thread)</span>',
  '20р': '20 BYN',
  '40р': '40 BYN',
  '50р': '50 BYN',
  '60р': '60 BYN',

  /* ---------- Магазин: постеры ---------- */
  'постеры на печать': 'posters to print',
  '20x20см - 40р': '20x20cm — 40 BYN',
  '30x30см - 60р': '30x30cm — 60 BYN',
  '40x40см - 90р': '40x40cm — 90 BYN',
  'Постер с зелёным солнцем': 'Poster with a green sun',
  'Постер с розовой кричащей фигурой': 'Poster with a pink screaming figure',
  'Постер с лицом на синем фоне': 'Poster with a face on a blue background',

  /* ---------- Магазин: скетчи ---------- */
  'скетчи, которые я нарисую на холсте для вас': 'sketches i’ll paint on canvas for you',
  'получится индивидуальная картина, не точь-в-точь идентичная скетчу':
    'you’ll get a one-off painting, not an exact copy of the sketch',
  'Скетч 1': 'Sketch 1',
  'Скетч 2': 'Sketch 2',
  'Скетч 3': 'Sketch 3',
  'Скетч 4': 'Sketch 4',
  'Скетч 5': 'Sketch 5',
  'Скетч 6': 'Sketch 6',
  'Скетч 7': 'Sketch 7',
  'Скетч 8': 'Sketch 8',
  'Скетч 9': 'Sketch 9',
  'Скетч 10': 'Sketch 10',
  'Скетч 11': 'Sketch 11',
  'Скетч 12': 'Sketch 12',
  'Скетч 13': 'Sketch 13',
  'Скетч 14': 'Sketch 14',
  'Скетч 15': 'Sketch 15',
  'Скетч 16': 'Sketch 16',
  'Скетч 17': 'Sketch 17',
  'Скетч 18': 'Sketch 18',
  'Скетч 19': 'Sketch 19',
  'Скетч 20': 'Sketch 20',
  'Скетч 21': 'Sketch 21',
  'Скетч 22': 'Sketch 22',
  'Скетч 23': 'Sketch 23',
  'Скетч 24': 'Sketch 24',
  'Скетч 25': 'Sketch 25',

  /* ---------- Магазин: футболки ---------- */
  'футболки хехе': 'xexe t-shirts',
  '120р, предзаказ за месяц': '120 BYN, pre-order a month ahead',
  'Футболка с голубым лицом': 'T-shirt with a blue face',
  'Футболка с грибом на человеке': 'T-shirt with a mushroom on a person',
  'Футболка с красным грибом': 'T-shirt with a red mushroom',
  'Вышивка жёлтого кота': 'Embroidered yellow cat',
  'Вышивка розового кота': 'Embroidered pink cat',
  'Вышивка с рисунком на сером': 'Embroidery on grey'
};
