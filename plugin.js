/*
 * Витрина — главная с баннером и лентами для Lampa.
 * Один файл, ES5, без сборки. Данные: только TMDB через Lampa и локальная история Lampa.
 * Трейлеры на баннере (настройка, можно выключить) проигрываются встроенным проигрывателем YouTube.
 */
(function () {
  'use strict';

  if (window.nfx_home_ready) return;
  window.nfx_home_ready = true;

  var COMPONENT = 'nfx_home';

  /* ------------------------------------------------------------------ токены дизайна (design/tokens.md) */
  var NFX = {
    color: {
      bg: '#141414',
      surface: '#262626',
      text: '#e8e8e8',
      textDim: '#a3a3a3',
      focus: '#ffffff',
      accent: '#ffb020',
      btn: '#3a3a3c',
      btnPress: '#e0e0e0',
      heroSkel: '#1b1b1b',
      noneIcon: '#4a4a4a'
    },
    alpha: {
      skelBar: 'rgba(255,255,255,0.07)',
      skelTitle: 'rgba(255,255,255,0.14)',
      track: 'rgba(255,255,255,0.35)',
      ringIn: 'rgba(0,0,0,0.35)'
    },
    font: {
      family: 'Roboto, "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
      heroTitle: 3,
      heroDesc: 1.1,
      button: 1.1,
      rowTitle: 1.25,
      capTitle: 1.1,
      capMeta: 0.9,
      overTitle: 1.15,
      errTitle: 1.6,
      errHint: 1
    },
    space: { u: 0.4, s2: 0.8, s3: 1.2, s4: 1.6, s6: 2.4 },
    size: {
      sidePad: 4.4,
      safeBottom: 2.4,
      headH: 4.8,
      heroH: 36,
      heroOverlap: 2.4,
      heroBottom: 6,
      heroTextW: 37,
      heroDescW: 33.6,
      btnH: 2.5,
      btnPadX: 1.6,
      btnGap: 0.8,
      cardW: 22,
      cardH: 12.375,
      cardGap: 0.4,
      cardStep: 22.4,
      rowHeadH: 2.8,
      capH: 3.6,
      rowGap: 1.6,
      progH: 0.35,
      scrimH: 3,
      ring: 0.15,
      skelCount: 5
    },
    radius: { card: 0.3, btn: 0.3, bar: 0.2 },
    // карточка Lampa: её собственные отступы (em), от которых считаются наши
    full: { scrollPad: 2.5, linePad: 1.5, fadeFrom: 23.4 },
    scale: { focus: 1.08, press: 0.97, pressCard: 1.03 },
    z: { hero: 0, shade: 1, heroBody: 2, rows: 3, cardFocus: 4, state: 6 },
    gradient: {
      top: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0, rgba(0,0,0,0) 5.8em)',
      bottom: 'linear-gradient(to bottom, rgba(20,20,20,0) 23.4em, #141414 36em)',
      left: 'linear-gradient(to right, rgba(20,20,20,0.92) 0, rgba(20,20,20,0.86) 30%, rgba(20,20,20,0.62) 46%, rgba(20,20,20,0.25) 60%, rgba(20,20,20,0) 80%)',
      cardOver: 'linear-gradient(to top, rgba(0,0,0,0.8) 0, rgba(0,0,0,0) 100%)',
      cardScrim: 'linear-gradient(to top, rgba(0,0,0,0.7) 0, rgba(0,0,0,0) 100%)',
      head: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)'
    },
    motion: {
      focus: 120,
      press: 100,
      rail: 260,
      railFast: 160,
      page: 300,
      heroFade: 400,
      heroTextOut: 120,
      heroTextIn: 220,
      imgReveal: 160,
      errIn: 250,
      skelPulse: 1600,
      heroDelay: 350,
      trailerDelay: 2500,   // сколько баннер должен простоять, прежде чем запустится трейлер
      trailerWait: 12000,   // если за это время видео не пошло — отменяем
      ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeSoft: 'ease-in-out'
    },
    img: { hero: 'w1280', card: 'w500' },
    data: {
      preloadRows: 5,   // сколько рядов ниже фокуса грузим заранее (при 3 удержание «вниз» упиралось в незагруженный ряд)
      mountRows: 2,     // сколько рядов вокруг фокуса держим в DOM
      cardMargin: 2,    // запас карточек слева и справа от видимых
      contLimit: 30,    // максимум тайтлов в «Продолжить просмотр»
      doneFrom: 90      // фильм или серия с таким процентом считаются досмотренными
    }
  };

  /* ------------------------------------------------------------------ тексты */
  var TEXT = {
    title: { ru: 'Витрина', en: 'Showcase' },
    watch: { ru: 'Смотреть', en: 'Watch' },
    details: { ru: 'Подробнее', en: 'Details' },
    row_now: { ru: 'Сейчас смотрят', en: 'Watching now' },
    row_trend: { ru: 'Сегодня в тренде', en: 'Trending today' },
    row_week: { ru: 'В тренде за неделю', en: 'Trending this week' },
    row_upcoming: { ru: 'Смотрите в кинозалах', en: 'In theaters' },
    row_movies: { ru: 'Популярные фильмы', en: 'Popular movies' },
    row_series: { ru: 'Популярные сериалы', en: 'Popular series' },
    row_top_movie: { ru: 'Топ фильмы', en: 'Top movies' },
    row_top_tv: { ru: 'Топ сериалы', en: 'Top series' },
    row_action: { ru: 'Боевики', en: 'Action' },
    row_comedy: { ru: 'Комедии', en: 'Comedy' },
    row_drama: { ru: 'Драмы', en: 'Drama' },
    row_thriller: { ru: 'Триллеры', en: 'Thrillers' },
    row_scifi: { ru: 'Фантастика', en: 'Sci-Fi' },
    row_cont: { ru: 'Продолжить просмотр', en: 'Continue watching' },
    untitled: { ru: 'Без названия', en: 'Untitled' },
    season: { ru: 'С', en: 'S' },
    episode: { ru: 'Э', en: 'E' },
    hour: { ru: 'ч', en: 'h' },
    minute: { ru: 'мин', en: 'min' },
    left_cap: { ru: 'Осталось', en: '' },
    left_low: { ru: 'осталось', en: '' },
    left_tail: { ru: '', en: 'left' },
    less_minute: { ru: 'менее минуты', en: 'under a minute' },
    err_title: { ru: 'Не удалось загрузить витрину', en: 'Couldn\'t load the showcase' },
    err_hint: {
      ru: 'Проверьте подключение к сети. Если интернет есть, а ошибка повторяется — возможно, недоступен TMDB или его прокси.',
      en: 'Check your network connection. If it is fine, TMDB or its proxy may be unavailable.'
    },
    empty_title: { ru: 'Пока нечего показать', en: 'Nothing to show yet' },
    retry: { ru: 'Повторить', en: 'Retry' },
    noty_error: { ru: 'Витрина: нет связи с сервером', en: 'Showcase: server unreachable' },
    set_home: { ru: 'Открывать вместо главной', en: 'Use as home screen' },
    set_home_d: {
      ru: 'Вместо стандартной главной Lampa при запуске открывается витрина.',
      en: 'Opens the showcase instead of Lampa\'s stock home.'
    },
    set_cap: { ru: 'Подписи под карточками', en: 'Text under cards' },
    set_cap_d: {
      ru: 'Название, год и жанры под каждым кадром. Если выключить, название пишется поверх кадра.',
      en: 'Title, year and genres under each card. When off, the title sits on the image.'
    },
    set_trailer: { ru: 'Трейлер на баннере', en: 'Trailer on the banner' },
    set_trailer_d: {
      ru: 'Через пару секунд на баннере витрины и карточки без звука запускается официальный трейлер с YouTube.',
      en: 'After a couple of seconds the official YouTube trailer plays muted on the showcase and title banners.'
    },
    set_card: { ru: 'Карточка в стиле витрины', en: 'Showcase-style title page' },
    set_card_d: {
      ru: 'Страница фильма или сериала выглядит как витрина: большой баннер и те же кнопки. Все кнопки и разделы Lampa остаются.',
      en: 'The title page looks like the showcase: a large banner and the same buttons. All Lampa buttons and sections stay.'
    },
    set_cont: { ru: 'Продолжить просмотр', en: 'Continue watching' },
    set_cont_d: {
      ru: 'Лента недосмотренных фильмов и сериалов из истории Lampa.',
      en: 'A row of unfinished titles from Lampa\'s history.'
    }
  };

  function T(key) {
    var item = TEXT[key];
    if (!item) return key;
    var lang = Lampa.Storage.get('language', 'ru');
    return lang === 'ru' ? item.ru : item.en;
  }

  /* ------------------------------------------------------------------ состав рядов (только TMDB) */
  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function dayString(time) {
    var d = new Date(time);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  // «Сейчас смотрят» — тот же выбор, что на стандартной главной Lampa: с настройкой Lampa «только релизы»
  // берём фильмы, вышедшие в цифре, на дисках или на ТВ за последние 90 дней, иначе — идущие в прокате.
  function nowWatchingUrl() {
    var released = false;
    try {
      released = !!Lampa.Storage.field('tmdb_only_released');
    } catch (e) {}
    if (!released) return 'movie/now_playing';
    var now = Date.now();
    return 'discover/movie?with_release_type=4|5|6&release_date.lte=' + dayString(now) +
      '&release_date.gte=' + dayString(now - 90 * 24 * 60 * 60 * 1000) + '&sort_by=popularity.desc';
  }

  // Первые восемь лент повторяют стандартную главную Lampa (источник TMDB): те же запросы и те же названия
  // (lang — ключ перевода Lampa, title — наш запасной текст). Баннер берётся из первой ленты.
  var ROWS = [
    { id: 'now', title: 'row_now', lang: 'title_now_watch', url: nowWatchingUrl, type: 'movie' },
    { id: 'trend', title: 'row_trend', lang: 'title_trend_day', url: 'trending/movie/day', type: 'movie' },
    { id: 'week', title: 'row_week', lang: 'title_trend_week', url: 'trending/movie/week', type: 'movie' },
    { id: 'upcoming', title: 'row_upcoming', lang: 'title_upcoming', url: 'movie/upcoming', type: 'movie' },
    { id: 'movies', title: 'row_movies', lang: 'title_popular_movie', url: 'movie/popular', type: 'movie' },
    { id: 'series', title: 'row_series', lang: 'title_popular_tv', url: 'trending/tv/week', type: 'tv' },
    { id: 'top_movie', title: 'row_top_movie', lang: 'title_top_movie', url: 'movie/top_rated', type: 'movie' },
    { id: 'top_tv', title: 'row_top_tv', lang: 'title_top_tv', url: 'tv/top_rated', type: 'tv' },
    { id: 'action', title: 'row_action', url: 'discover/movie?with_genres=28&sort_by=popularity.desc', type: 'movie' },
    { id: 'comedy', title: 'row_comedy', url: 'discover/movie?with_genres=35&sort_by=popularity.desc', type: 'movie' },
    { id: 'drama', title: 'row_drama', url: 'discover/movie?with_genres=18&sort_by=popularity.desc', type: 'movie' },
    { id: 'thriller', title: 'row_thriller', url: 'discover/movie?with_genres=53&sort_by=popularity.desc', type: 'movie' },
    { id: 'scifi', title: 'row_scifi', url: 'discover/movie?with_genres=878&sort_by=popularity.desc', type: 'movie' }
  ];

  /* ------------------------------------------------------------------ иконки (свои, статичные) */
  var ICON = {
    menu: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="3" width="19" height="9.5" rx="1.6" fill="currentColor"/><rect x="2.5" y="15" width="5.5" height="6" rx="1.2" fill="currentColor"/><rect x="9.25" y="15" width="5.5" height="6" rx="1.2" fill="currentColor"/><rect x="16" y="15" width="5.5" height="6" rx="1.2" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 4.5v15l12-7.5z"/></svg>',
    info: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1.2 15h-2.4v-6.5h2.4zm0-8.3h-2.4V6.4h2.4z"/></svg>',
    none: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 4h18v16H3zm2 2v2h2V6zm0 4v4h2v-4zm0 6v2h2v-2zm12-10v2h2V6zm0 4v4h2v-4zm0 6v2h2v-2zM9 6v12h6V6z"/></svg>',
    offline: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5.5 12.2a10 10 0 0 1 13 0"/><path d="M9 15.8a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="0.6"/><path d="M4 3l16 18"/></svg>'
  };

  /* ------------------------------------------------------------------ мелкие помощники */
  function el(cls, tag) {
    var node = document.createElement(tag || 'div');
    if (cls) node.className = cls;
    return node;
  }

  function textEl(cls, text) {
    var node = el(cls);
    node.textContent = text;
    return node;
  }

  function empty(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setTransform(node, value) {
    node.style.webkitTransform = value;
    node.style.transform = value;
  }

  function round(n) {
    return Math.round(n * 1000) / 1000;
  }

  function flag(name, def) {
    var v = Lampa.Storage.get(name, def);
    if (v === 'true') return true;
    if (v === 'false') return false;
    return !!v;
  }

  // Путь картинки приходит из сети: пускаем в CSS только простые пути TMDB.
  function imgUrl(path, size) {
    if (typeof path !== 'string' || !/^\/[A-Za-z0-9_.\-\/]+$/.test(path)) return '';
    return Lampa.Api.img(path, size) || '';
  }

  function cssUrl(url) {
    return 'url("' + url + '")';
  }

  function genreNames(type, raw) {
    var out = [];
    var i;
    if (raw.genres && raw.genres.length) {
      for (i = 0; i < raw.genres.length && out.length < 2; i++) {
        if (raw.genres[i] && typeof raw.genres[i].name === 'string' && raw.genres[i].name) out.push(raw.genres[i].name);
      }
      if (out.length) return out;
    }
    if (raw.genre_ids && raw.genre_ids.length) {
      try {
        var tmdb = Lampa.Api.sources.tmdb;
        if (tmdb && typeof tmdb.getGenresNameFromIds === 'function') {
          out = tmdb.getGenresNameFromIds(type, raw.genre_ids) || [];
        }
      } catch (e) {
        out = [];
      }
    }
    return out.slice(0, 2);
  }

  // Приводим ответ TMDB или карточку из истории Lampa к одному виду.
  function normalize(raw, typeHint) {
    if (!raw || !raw.id || raw.media_type === 'person') return null;
    var type;
    if (raw.media_type === 'tv' || raw.media_type === 'movie') type = raw.media_type;
    else if (typeHint) type = typeHint;
    else type = (raw.original_name || raw.first_air_date || raw.number_of_seasons || (raw.name && !raw.title)) ? 'tv' : 'movie';
    var date = raw.release_date || raw.first_air_date || '';
    var year = (date + '').slice(0, 4);
    return {
      id: raw.id,
      type: type,
      title: (raw.title || raw.name || raw.original_title || raw.original_name || '') + '',
      year: /^\d{4}$/.test(year) ? year : '',
      overview: (raw.overview || '') + '',
      backdrop: raw.backdrop_path || '',
      genres: genreNames(type, raw),
      card: raw,
      loaded: false,
      progress: 0,
      label: ''
    };
  }

  function metaLine(item) {
    if (item.label) return item.label;
    var genres = item.genres.join(', ');
    if (item.year && genres) return item.year + ' • ' + genres;
    return item.year || genres;
  }

  /* ------------------------------------------------------------------ трейлеры (YouTube — по решению пользователя) */
  // Домен без cookie; в адрес попадает только ключ ролика из TMDB, ничего об устройстве и истории.
  var YT_HOST = 'https://www.youtube-nocookie.com';

  function tmdbLang() {
    var lang = '';
    try {
      lang = Lampa.Storage.field('tmdb_lang') || Lampa.Storage.get('language', 'ru');
    } catch (e) {}
    lang = (lang + '').toLowerCase().slice(0, 2);
    return /^[a-z]{2}$/.test(lang) ? lang : 'en';
  }

  // Из списка видео TMDB берём ролик YouTube: сначала трейлер, потом тизер; при равенстве — на языке
  // пользователя и с пометкой «официальный».
  function pickTrailer(list, lang) {
    var best = '';
    var bestScore = 0;
    if (!list || !list.length) return '';
    for (var i = 0; i < list.length; i++) {
      var v = list[i];
      if (!v || v.site !== 'YouTube' || !/^[A-Za-z0-9_\-]{6,20}$/.test(v.key + '')) continue;
      var score = v.type === 'Trailer' ? 100 : (v.type === 'Teaser' ? 10 : 0);
      if (!score) continue;
      if (v.iso_639_1 === lang) score += 20;
      if (v.official) score += 5;
      if (score > bestScore) {
        bestScore = score;
        best = v.key + '';
      }
    }
    return best;
  }

  // Ключ трейлера запоминается в самой карточке: '' — трейлера нет.
  function findTrailer(item, done) {
    if (typeof item.trailer === 'string') {
      done(item.trailer);
      return;
    }
    if (!/^\d+$/.test(item.id + '') || (item.type !== 'movie' && item.type !== 'tv')) {
      done('');
      return;
    }
    var lang = tmdbLang();
    var method = item.type + '/' + item.id + '/videos?include_video_language=' + (lang === 'en' ? 'en' : lang + ',en');
    try {
      Lampa.Api.sources.tmdb.get(method, {}, function (json) {
        item.trailer = pickTrailer(json && json.results, lang);
        done(item.trailer);
      }, function () {
        done('');
      });
    } catch (e) {
      done('');
    }
  }

  // Проигрыватель трейлера: один встроенный кадр YouTube без звука. Когда запускать и останавливать, решают снаружи.
  // cls — класс обёртки (cls + '--on' показывает видео), mount(box) ставит обёртку в нужное место страницы.
  function makeTrailer(cls, mount) {
    var cur = null;   // { box, frame, playing, wait, ping, done }

    function drop(box) {
      if (box.parentNode) box.parentNode.removeChild(box);
    }

    function tell(message) {
      if (!cur || !cur.frame.contentWindow) return;
      try {
        cur.frame.contentWindow.postMessage(JSON.stringify(message), YT_HOST);
      } catch (e) {}
    }

    function ping() {
      tell({ event: 'listening', id: 1, channel: 'widget' });
      tell({ event: 'command', func: 'addEventListener', args: ['onStateChange'], id: 1, channel: 'widget' });
      tell({ event: 'command', func: 'addEventListener', args: ['onError'], id: 1, channel: 'widget' });
    }

    function stop(fade) {
      if (!cur) return;
      var box = cur.box;
      var shown = cur.playing;
      clearTimeout(cur.wait);
      clearInterval(cur.ping);
      window.removeEventListener('message', onMessage);
      cur = null;
      if (fade && shown) {
        box.className = cls;
        setTimeout(function () {
          drop(box);
        }, NFX.motion.heroFade + 60);
      } else {
        drop(box);
      }
    }

    function finish() {
      var done = cur.done;
      stop(true);
      if (done) done();
    }

    // Проигрыватель сообщает о состоянии; из сообщения читаем только число состояния.
    function onMessage(e) {
      if (!cur || e.origin !== YT_HOST || e.source !== cur.frame.contentWindow) return;
      var data = null;
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch (err) {
        return;
      }
      if (!data || typeof data !== 'object') return;
      if (cur.ping) {
        clearInterval(cur.ping);
        cur.ping = 0;
        // на случай, если автозапуск не сработал сам
        tell({ event: 'command', func: 'mute', args: [], id: 1, channel: 'widget' });
        tell({ event: 'command', func: 'playVideo', args: [], id: 1, channel: 'widget' });
      }
      var state = null;
      if (data.event === 'onStateChange' && typeof data.info === 'number') state = data.info;
      else if (data.event === 'infoDelivery' && data.info && typeof data.info.playerState === 'number') state = data.info.playerState;
      if (data.event === 'onError' || state === 0) {
        finish();   // ошибка или ролик доигран
      } else if (state === 1 && !cur.playing) {
        // показываем видео только когда оно действительно пошло
        cur.playing = true;
        clearTimeout(cur.wait);
        cur.box.className = cls + ' ' + cls + '--on';
      }
    }

    // done вызывается один раз, если ролик доигран, дал ошибку или не запустился за отведённое время.
    function play(key, done) {
      stop(false);
      var box = el(cls);
      var frame = document.createElement('iframe');
      var loc = window.location;
      var origin = /^https?:$/.test(loc.protocol) ? loc.protocol + '//' + loc.host : '';
      frame.className = 'nfx-video__frame';
      frame.setAttribute('allow', 'autoplay; encrypted-media');
      frame.setAttribute('frameborder', '0');
      frame.setAttribute('scrolling', 'no');
      frame.setAttribute('tabindex', '-1');
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      var mine = { box: box, frame: frame, playing: false, wait: 0, ping: 0, done: done };
      cur = mine;
      frame.onload = function () {
        if (cur !== mine || mine.ping) return;
        ping();
        mine.ping = setInterval(ping, 500);
      };
      window.addEventListener('message', onMessage);
      mine.wait = setTimeout(function () {
        if (cur === mine && !mine.playing) finish();
      }, NFX.motion.trailerWait);
      frame.src = YT_HOST + '/embed/' + key + '?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3' +
        '&modestbranding=1&playsinline=1&enablejsapi=1' + (origin ? '&origin=' + encodeURIComponent(origin) : '');
      box.appendChild(frame);
      mount(box);
    }

    return {
      play: play,
      stop: stop,
      active: function () {
        return !!cur;
      }
    };
  }

  // Название ленты: перевод Lampa, если он есть (совпадает со стандартной главной на любом языке), иначе свой текст.
  function rowTitle(def) {
    if (def.lang) {
      try {
        var text = Lampa.Lang.translate(def.lang);
        if (text && text !== def.lang) return text + '';
      } catch (e) {}
    }
    return T(def.title);
  }

  function request(def, ok, fail) {
    try {
      var url = typeof def.url === 'function' ? def.url() : def.url;
      Lampa.Api.sources.tmdb.get(url, {}, function (json) {
        var list = json && json.results && json.results.length ? json.results : [];
        var out = [];
        var seen = {};
        for (var i = 0; i < list.length; i++) {
          var item = normalize(list[i], def.type);
          if (!item) continue;
          var key = item.type + '_' + item.id;
          if (seen[key]) continue;
          seen[key] = true;
          out.push(item);
        }
        ok(out);
      }, function () {
        fail();
      });
    } catch (e) {
      fail();
    }
  }

  /* ------------------------------------------------------------------ «Продолжить просмотр»: только локальные данные Lampa */
  function leftText(seconds, lower) {
    var minutes = Math.round(seconds / 60);
    var value;
    if (minutes < 1) value = T('less_minute');
    else if (minutes < 60) value = minutes + ' ' + T('minute');
    else value = Math.floor(minutes / 60) + ' ' + T('hour') + ' ' + (minutes % 60) + ' ' + T('minute');
    var head = T(lower ? 'left_low' : 'left_cap');
    var tail = T('left_tail');
    return (head ? head + ' ' : '') + value + (tail ? ' ' + tail : '');
  }

  // Свежая запись таймкода на каждую карточку (Lampa хранит привязку card/season/episode в записи).
  // linked = false означает старую Lampa, где записи не привязаны к карточкам.
  function readRoads() {
    var result = { map: {}, linked: false };
    try {
      var name = Lampa.Timeline && typeof Lampa.Timeline.filename === 'function' ? Lampa.Timeline.filename() : 'file_view';
      var viewed = Lampa.Storage.get(name, {});
      if (!viewed || typeof viewed !== 'object') return result;
      for (var hash in viewed) {
        if (!Object.prototype.hasOwnProperty.call(viewed, hash)) continue;
        var road = viewed[hash];
        if (!road || typeof road !== 'object' || !road.card) continue;
        result.linked = true;
        if (!(road.percent > 0)) continue;
        var key = road.card + '';
        if (!result.map[key] || (result.map[key].updated || 0) <= (road.updated || 0)) result.map[key] = road;
      }
    } catch (e) {
      return result;
    }
    return result;
  }

  function progressOf(item, roads) {
    var raw = item.card;
    var road = null;
    var season = 0;
    var episode = 0;
    try {
      if (item.type === 'tv') {
        road = roads.map['tv_' + item.id] || null;
        if (road) {
          season = parseInt(road.season, 10) || 0;
          episode = parseInt(road.episode, 10) || 0;
        } else if (!roads.linked && Lampa.Timeline && typeof Lampa.Timeline.watched === 'function' && raw.original_name) {
          // Старая Lampa: известен только прогресс серий первого сезона, поэтому метку сезона не пишем.
          var list = Lampa.Timeline.watched(raw, true);
          if (list && list.length) road = list[list.length - 1].view;
        }
      } else {
        road = roads.map['movie_' + item.id] || null;
        if (!road && Lampa.Timeline && typeof Lampa.Timeline.view === 'function') {
          road = Lampa.Timeline.view(Lampa.Utils.hash(raw.original_title || raw.title || ''));
        }
      }
    } catch (e) {
      road = null;
    }
    var percent = road ? parseFloat(road.percent) || 0 : 0;
    if (!(percent > 0)) return null;
    // Досмотренное не показываем. Для сериала следующая серия нам неизвестна, поэтому он тоже уходит из ряда.
    if (percent >= NFX.data.doneFrom) return null;
    var time = road ? parseFloat(road.time) || 0 : 0;
    var duration = road ? parseFloat(road.duration) || 0 : 0;
    var left = duration > time ? duration - time : 0;
    var label = '';
    if (item.type === 'tv' && season > 0 && episode > 0) {
      label = T('season') + season + ' · ' + T('episode') + episode;
      if (left) label += ' — ' + leftText(left, true);
    } else if (left) {
      label = leftText(left, false);
    }
    return { percent: Math.max(3, Math.min(100, percent)), label: label };
  }

  function continueItems() {
    var out = [];
    var list;
    try {
      list = Lampa.Favorite.get({ type: 'history' }) || [];
    } catch (e) {
      list = [];
    }
    if (!list.length) return out;
    var roads = readRoads();
    var seen = {};
    for (var i = 0; i < list.length && out.length < NFX.data.contLimit; i++) {
      var item = normalize(list[i]);
      if (!item) continue;
      var key = item.type + '_' + item.id;
      if (seen[key]) continue;
      seen[key] = true;
      var progress = progressOf(item, roads);
      if (!progress) continue;
      item.progress = progress.percent;
      item.label = progress.label;
      out.push(item);
    }
    return out;
  }

  function signature(items) {
    var parts = [];
    for (var i = 0; i < items.length; i++) {
      parts.push(items[i].type + items[i].id + ':' + Math.round(items[i].progress) + ':' + items[i].label);
    }
    return parts.join('|');
  }

  /* ------------------------------------------------------------------ CSS из токенов */
  function buildCss() {
    var c = NFX.color;
    var a = NFX.alpha;
    var f = NFX.font;
    var s = NFX.size;
    var m = NFX.motion;
    var g = NFX.gradient;
    var z = NFX.z;
    var r = NFX.radius;
    var sp = NFX.space;
    var k = NFX.full;
    var rowH = s.rowHeadH + s.cardH + s.capH;
    var rowHNoCap = s.rowHeadH + s.cardH;
    var fill = 'position:absolute;left:0;top:0;width:100%;height:100%;';

    return [
      /* единственные правила для элементов самой Lampa — только пока открыт наш экран */
      'body.nfx--active .wrap__content{padding-top:0}',
      // Карточка Lampa в стиле витрины: все правила действуют только внутри экрана, помеченного классом nfx-full.
      '.nfx-full{background:' + c.bg + '}',
      '.nfx-full .full-start__background{left:0;top:0;width:100%;max-width:100%;height:' + s.heroH + 'em;opacity:1;-webkit-mask-image:none;mask-image:none;object-fit:cover;object-position:50% 20%;animation:none}',
      '.nfx-full .activity__body:after{content:"";position:absolute;left:0;top:0;width:100%;height:' + s.heroH + 'em;z-index:-1;background:' + g.top + ',' + g.left + '}',
      '.nfx-full__video{position:absolute;left:0;top:' + round(s.heroH / 2) + 'em;width:100%;height:0;padding-top:56.25%;margin-top:-28.125%;z-index:-1;opacity:0;background:#000;pointer-events:none;transition:opacity ' + m.heroFade + 'ms ease-out}',
      '.nfx-full__video--on{opacity:1}',
      '.nfx-full .scroll--mask{-webkit-mask-image:none;mask-image:none}',
      // «лист» с содержимым: сверху прозрачный, к низу баннера становится сплошным и при прокрутке закрывает кадр
      '.nfx-full .activity__body>div>.scroll>.scroll__content>.scroll__body{background:linear-gradient(to bottom, rgba(20,20,20,0) ' + round(k.fadeFrom - k.scrollPad) + 'em, ' + c.bg + ' ' + round(s.heroH - k.scrollPad) + 'em)}',
      '.nfx-full .full-start-new{padding:0 ' + s.sidePad + 'em ' + round(s.heroBottom - s.heroOverlap) + 'em}',
      '.nfx-full .full-start-new__body{height:' + round(s.heroH - s.heroBottom - k.scrollPad) + 'em}',
      '.nfx-full .full-start-new__left{display:none}',
      '.nfx-full .full-start-new__right{width:auto;max-width:52em}',
      '.nfx-full .full-start-new__head{font-size:1em;margin-bottom:' + sp.u + 'em;color:' + c.textDim + '}',
      '.nfx-full .full-start-new__title{font-size:' + f.heroTitle + 'em;line-height:1.1;font-weight:900;margin-bottom:' + round(sp.s2 / f.heroTitle) + 'em;-webkit-line-clamp:2;color:#fff}',
      '.nfx-full .full-start-new__tagline{font-size:' + f.heroDesc + 'em;margin-bottom:' + round(sp.s2 / f.heroDesc) + 'em;color:' + c.text + '}',
      '.nfx-full .full-start-new__rate-line{margin-bottom:' + sp.s2 + 'em}',
      '.nfx-full .full-start-new__details{font-size:1em;margin-bottom:' + sp.s2 + 'em;min-height:0;color:' + c.text + '}',
      '.nfx-full .full-start-new__reactions{margin-bottom:' + sp.s3 + 'em;min-height:0}',
      '.nfx-full .full-start-new__buttons .full-start__button{font-size:' + f.button + 'em;height:' + round(s.btnH / f.button) + 'em;padding:0 ' + round(s.btnPadX / f.button) + 'em;margin-right:' + round(s.btnGap / f.button) + 'em;border-radius:' + round(r.btn / f.button) + 'em;background:' + c.btn + ';color:#fff;font-weight:700;transition:transform ' + m.focus + 'ms ' + m.ease + '}',
      '.nfx-full .full-start-new__buttons .full-start__button.focus{background:' + c.focus + ';color:' + c.bg + ';transform:scale(' + NFX.scale.focus + ')}',
      '.nfx-full .items-line__head{padding-left:' + s.sidePad + 'em;padding-right:' + s.sidePad + 'em}',
      '.nfx-full .items-line__title{font-size:' + f.rowTitle + 'em;font-weight:700;color:' + c.text + '}',
      '.nfx-full .full-descr{padding-left:' + s.sidePad + 'em;padding-right:' + s.sidePad + 'em}',
      '.nfx-full .items-line__body>.scroll>.scroll__content>.scroll__body{padding-left:' + round(s.sidePad - k.linePad) + 'em;padding-right:' + round(s.sidePad - k.linePad) + 'em}',
      'body.nfx--active .head{background:' + g.head + '}',

      '.nfx-screen{position:absolute;left:0;top:0;width:100%;height:100vh;overflow:hidden;background:' + c.bg + ';color:' + c.text + ';font-family:' + f.family + '}',
      '.nfx-page{position:absolute;left:0;top:0;width:100%;will-change:transform;transition:transform ' + m.page + 'ms ' + m.ease + '}',

      /* баннер */
      '.nfx-hero{position:absolute;left:0;top:0;width:100%;height:' + s.heroH + 'em;overflow:hidden;background:' + c.bg + '}',
      '.nfx-hero__img{' + fill + 'z-index:' + z.hero + ';opacity:0;background-size:cover;background-position:50% 20%;background-repeat:no-repeat;transition:opacity ' + m.heroFade + 'ms ease-out}',
      // Видео 16:9 во всю ширину баннера, по вертикали по центру: верх и низ (подписи проигрывателя) обрезаются.
      '.nfx-hero__video{position:absolute;left:0;top:50%;width:100%;height:0;padding-top:56.25%;margin-top:-28.125%;z-index:' + z.shade + ';opacity:0;background:#000;pointer-events:none;transition:opacity ' + m.heroFade + 'ms ease-out}',
      '.nfx-hero__video--on{opacity:1}',
      '.nfx-video__frame{position:absolute;left:0;top:0;width:100%;height:100%;border:0;pointer-events:none}',
      '.nfx-hero__shade{' + fill + 'z-index:' + z.shade + ';background:' + g.top + ',' + g.bottom + ',' + g.left + '}',
      '.nfx-hero__body{position:absolute;left:' + s.sidePad + 'em;bottom:' + s.heroBottom + 'em;width:' + s.heroTextW + 'em;z-index:' + z.heroBody + ';transition:opacity ' + m.heroTextIn + 'ms ' + m.ease + '}',
      '.nfx-hero__body--out{opacity:0;transition:opacity ' + m.heroTextOut + 'ms ' + m.easeIn + '}',
      '.nfx-hero__title{margin:0 0 ' + round(sp.s2 / f.heroTitle) + 'em 0;font-size:' + f.heroTitle + 'em;line-height:1.1;font-weight:900;color:#fff;max-height:2.2em;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;text-shadow:0 .04em .3em rgba(0,0,0,.55)}',
      '.nfx-hero__title--solo{margin-bottom:' + round(sp.s4 / f.heroTitle) + 'em}',
      '.nfx-hero__desc{margin:0 0 ' + round(sp.s3 / f.heroDesc) + 'em 0;width:' + round(s.heroDescW / f.heroDesc) + 'em;font-size:' + f.heroDesc + 'em;line-height:1.45;color:#fff;max-height:4.35em;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;text-shadow:0 .04em .2em rgba(0,0,0,.6)}',
      '.nfx-hero__btns{display:flex;align-items:center}',

      /* кнопки */
      '.nfx-btn{display:flex;align-items:center;flex:none;height:' + s.btnH + 'em;line-height:' + s.btnH + 'em;padding:0 ' + s.btnPadX + 'em;margin-right:' + s.btnGap + 'em;border-radius:' + r.btn + 'em;background:' + c.btn + ';color:#fff;transition:transform ' + m.focus + 'ms ' + m.ease + '}',
      '.nfx-btn__text{font-size:' + f.button + 'em;font-weight:700;white-space:nowrap}',
      '.nfx-btn svg{width:1.1em;height:1.1em;margin-right:.6em;fill:currentColor;flex:none}',
      '.nfx-btn--focus{background:' + c.focus + ';color:' + c.bg + ';transform:scale(' + NFX.scale.focus + ')}',
      '.nfx-btn--press{background:' + c.btnPress + ';color:' + c.bg + ';transform:scale(' + NFX.scale.press + ');transition-duration:' + m.press + 'ms}',

      /* ряды */
      '.nfx-rows{position:absolute;left:0;top:' + round(s.heroH - s.heroOverlap) + 'em;width:100%;z-index:' + z.rows + '}',
      '.nfx-row{position:relative;height:' + round(rowH) + 'em;margin-bottom:' + s.rowGap + 'em}',
      '.nfx-row--nocap{height:' + round(rowHNoCap) + 'em}',
      '.nfx-row__head{height:' + s.rowHeadH + 'em;padding-left:' + s.sidePad + 'em}',
      '.nfx-row__title{margin:0;font-size:' + f.rowTitle + 'em;line-height:1.6;font-weight:700;color:' + c.text + ';white-space:nowrap}',
      '.nfx-rail{position:relative;height:' + round(s.cardH + s.capH) + 'em;transition:transform ' + m.rail + 'ms ' + m.ease + '}',
      '.nfx--fast .nfx-rail{transition-duration:' + m.railFast + 'ms}',
      '.nfx-row--active .nfx-rail{will-change:transform}',

      /* карточка */
      '.nfx-card{position:absolute;left:0;top:0;width:' + s.cardW + 'em}',
      '.nfx-card--focus{z-index:' + z.cardFocus + '}',
      '.nfx-card__frame{position:relative;width:' + s.cardW + 'em;height:' + s.cardH + 'em;border-radius:' + r.card + 'em;overflow:hidden;background:' + c.surface + ';transition:transform ' + m.focus + 'ms ' + m.ease + '}',
      '.nfx-card--focus .nfx-card__frame{transform:scale(' + NFX.scale.focus + ')}',
      '.nfx-card--press .nfx-card__frame{transform:scale(' + NFX.scale.pressCard + ');transition-duration:' + m.press + 'ms}',
      '.nfx-card__img{' + fill + 'opacity:0;background-size:cover;background-position:50% 30%;background-repeat:no-repeat;transition:opacity ' + m.imgReveal + 'ms ' + m.ease + '}',
      '.nfx-card__img--on{opacity:1}',
      '.nfx-card__img--still{transition:none}',
      '.nfx-card__none{' + fill + '}',
      '.nfx-card__none svg{position:absolute;left:50%;top:50%;width:3em;height:3em;margin:-1.5em 0 0 -1.5em;fill:' + c.noneIcon + '}',
      '.nfx-card__ring{' + fill + 'border-radius:' + r.card + 'em;opacity:0;box-shadow:inset 0 0 0 ' + s.ring + 'em ' + c.focus + ',inset 0 0 0 ' + round(s.ring + 0.07) + 'em ' + a.ringIn + ';transition:opacity ' + m.focus + 'ms ' + m.ease + '}',
      '.nfx-card--focus .nfx-card__ring{opacity:1}',
      '.nfx-card__over{position:absolute;left:0;bottom:0;width:100%;box-sizing:border-box;padding:' + sp.s6 + 'em ' + sp.s2 + 'em ' + sp.s2 + 'em;background:' + g.cardOver + '}',
      '.nfx-card__over-t{font-size:' + f.overTitle + 'em;line-height:1.2;font-weight:700;color:#fff;max-height:2.4em;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}',
      '.nfx-card__scrim{position:absolute;left:0;bottom:0;width:100%;height:' + s.scrimH + 'em;background:' + g.cardScrim + '}',
      '.nfx-card__prog{position:absolute;left:0;bottom:0;width:100%;height:' + s.progH + 'em;background:' + a.track + '}',
      '.nfx-card__prog-fill{height:100%;background:' + c.accent + '}',
      '.nfx-card__cap{height:' + s.capH + 'em;padding-top:' + sp.s2 + 'em;box-sizing:border-box;overflow:hidden}',
      '.nfx-card__title{font-size:' + f.capTitle + 'em;line-height:1.3;font-weight:500;color:' + c.text + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.nfx-card--focus .nfx-card__title{color:#fff}',
      '.nfx-card__meta{font-size:' + f.capMeta + 'em;line-height:1.35;color:' + c.textDim + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',

      /* скелетоны */
      '@keyframes nfx-pulse{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}',
      '.nfx-skel{animation:nfx-pulse ' + m.skelPulse + 'ms ' + m.easeSoft + ' infinite}',
      '.nfx-skel__bar{border-radius:' + r.bar + 'em;background:' + a.skelBar + '}',
      '.nfx-skel__bar--t{background:' + a.skelTitle + '}',
      '.nfx-skel__row-title{width:11em;height:1.1em;margin-top:.45em}',
      '.nfx-skel__cap-a{width:14em;height:1em}',
      '.nfx-skel__cap-b{width:9em;height:.8em;margin-top:.5em}',
      '.nfx-skel__hero{position:absolute;left:0;top:0;width:100%;height:' + s.heroH + 'em;background:' + c.heroSkel + '}',
      '.nfx-skel__hero-body{position:absolute;left:' + s.sidePad + 'em;bottom:' + s.heroBottom + 'em}',
      '.nfx-skel__hero-title{width:20em;height:2.6em;margin-bottom:1em}',
      '.nfx-skel__hero-line{height:1.1em;margin-bottom:.6em}',
      '.nfx-skel__hero-btns{display:flex;margin-top:1.2em}',
      '.nfx-skel__hero-btn{height:' + s.btnH + 'em;margin-right:' + s.btnGap + 'em}',

      /* слой состояния: ошибка, пусто, загрузка после «Повторить» */
      '@keyframes nfx-in{0%{opacity:0;transform:translate3d(0,.8em,0)}100%{opacity:1;transform:translate3d(0,0,0)}}',
      '.nfx-state{' + fill + 'z-index:' + z.state + ';background:' + c.bg + '}',
      '.nfx-err{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}',
      '.nfx-err__box{display:flex;flex-direction:column;align-items:center;animation:nfx-in ' + m.errIn + 'ms ' + m.ease + '}',
      '.nfx-err__box svg{width:4em;height:4em;margin-bottom:1em;fill:none;stroke:' + c.textDim + ';stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}',
      '.nfx-err__title{font-size:' + f.errTitle + 'em;line-height:1.3;font-weight:700;color:#fff;margin-bottom:.4em}',
      '.nfx-err__hint{font-size:' + f.errHint + 'em;line-height:1.45;color:' + c.textDim + ';width:24em;margin-bottom:2em}',
      '.nfx-err .nfx-btn{margin-right:0}'
    ].join('\n');
  }

  function injectStyle() {
    if (document.getElementById('nfx-style')) return;
    var style = document.createElement('style');
    style.id = 'nfx-style';
    style.textContent = buildCss();
    document.head.appendChild(style);
  }

  /* ------------------------------------------------------------------ экран */
  function Home(object) {
    var self = this;
    var S = NFX.size;
    var root = $('<div class="nfx-screen"></div>');
    var node = root[0];
    var pageEl = el('nfx-page');
    var rowsEl = el('nfx-rows');

    var destroyed = false;
    var active = false;        // управление у нашего экрана (не у меню, шапки или настроек)
    var generation = 0;        // ответы прошлых загрузок игнорируются
    var headLoading = false;

    var rows = [];             // показываемые ряды по порядку
    var zone = 'none';         // none | hero | rows | err
    var btnIndex = 0;
    var rowIndex = 0;
    var base = 0;              // верх блока рядов на странице, em
    var pageH = 0;

    var hero = null;           // DOM баннера
    var heroItem = null;
    var heroToken = 0;
    var heroTop = 0;           // какой из двух слоёв картинки сейчас верхний
    var heroFading = null;
    var heroLoader = null;

    var stateEl = null;
    var stateBtn = null;
    var stateKind = '';

    var focusNode = null;
    var focusCls = '';
    var activeRowEl = null;
    var isFast = false;
    var lastKey = 0;
    var timers = { hero: 0, heroText: 0, heroFade: 0, trailer: 0 };
    var view = { font: 22.81, w: 84.2, h: 47.35 };

    var captions = flag('nfx_captions', true);
    var useContinue = flag('nfx_continue', true);
    var useTrailer = flag('nfx_trailer', true);
    var trailer = makeTrailer('nfx-hero__video', function (box) {
      if (hero) hero.el.insertBefore(box, hero.shade);
    });
    var trailerItem = null;    // карточка, чей трейлер сейчас в проигрывателе
    var trailerFor = null;     // карточка, для которой трейлер запланирован или ищется
    var trailerSkip = null;    // карточка, чей трейлер уже доигран или не запустился: не повторяем, пока баннер не сменится
    var contSig = '';
    var contDirty = true;      // историю перечитываем только после возврата с другого экрана
    var started = false;       // экран сейчас показан (между start и pause/stop)
    var resizePending = false;

    /* ---------- размеры окна ---------- */
    function measure() {
      // em страницы считается от шрифта самого экрана; пока экран не в документе — от body
      var source = document.body.contains(node) ? node : document.body;
      var font = parseFloat(window.getComputedStyle(source).fontSize) || 22.81;
      view.font = font;
      view.w = window.innerWidth / font;
      view.h = window.innerHeight / font;
    }

    function rowHeight(row) {
      return S.rowHeadH + S.cardH + (row.capOn ? S.capH : 0);
    }

    function railX(row) {
      var count = row.items.length;
      var max = S.sidePad * 2 + count * S.cardStep - S.cardGap - view.w;
      var x = S.sidePad + row.col * S.cardStep + S.cardW / 2 - view.w / 2;
      if (x > max) x = max;
      if (x < 0) x = 0;
      return round(x);
    }

    // Высоты фиксированы, поэтому позиции считаем арифметикой и не читаем вёрстку.
    function layout() {
      base = hero ? S.heroH - S.heroOverlap : S.headH + NFX.space.s3;
      rowsEl.style.top = hero ? '' : round(base) + 'em';
      var acc = 0;
      for (var i = 0; i < rows.length; i++) {
        rows[i].h = rowHeight(rows[i]);
        rows[i].top = acc;
        acc += rows[i].h + S.rowGap;
      }
      // Запас снизу такой, чтобы последний ряд тоже вставал по центру: иначе подписи рядов выше него
      // попадают под шапку Lampa.
      var tail = S.safeBottom;
      if (rows.length > 1) tail = Math.max(tail, (view.h - rows[rows.length - 1].h) / 2);
      pageH = base + (rows.length ? acc - S.rowGap : 0) + tail;
    }

    function applyScroll() {
      var y = 0;
      var row = rows[rowIndex];
      if (zone === 'rows' && row) {
        if (rowIndex === 0) y = base + row.top + row.h - (view.h - S.safeBottom);
        else y = base + row.top + row.h / 2 - view.h / 2;
        var max = pageH - view.h;
        if (y > max) y = max;
        if (y < 0) y = 0;
      }
      setTransform(pageEl, 'translate3d(0,' + (-round(y)) + 'em,0)');
    }

    /* ---------- карточки ---------- */
    function showNone(card) {
      if (card.none) return;
      card.none = el('nfx-card__none');
      card.none.innerHTML = ICON.none;
      card.frame.insertBefore(card.none, card.frame.firstChild);
    }

    function createCard(row, index) {
      var item = row.items[index];
      var card = { node: el('nfx-card'), frame: el('nfx-card__frame'), imgEl: null, img: null, none: null, dead: false };
      var showCap = row.capOn;
      card.node.style.left = round(S.sidePad + index * S.cardStep) + 'em';

      var url = imgUrl(item.backdrop, NFX.img.card);
      if (url) {
        card.imgEl = el('nfx-card__img');
        card.frame.appendChild(card.imgEl);
        if (item.loaded) {
          card.imgEl.style.backgroundImage = cssUrl(url);
          card.imgEl.className = 'nfx-card__img nfx-card__img--on nfx-card__img--still';
        } else {
          card.img = new Image();
          card.img.onload = function () {
            if (card.dead) return;
            item.loaded = true;
            card.imgEl.style.backgroundImage = cssUrl(url);
            card.imgEl.className = 'nfx-card__img nfx-card__img--on';
            card.img = null;
          };
          card.img.onerror = function () {
            if (card.dead) return;
            card.img = null;
            showNone(card);
          };
          card.img.src = url;
        }
      } else {
        showNone(card);
      }

      if (!showCap) {
        var over = el('nfx-card__over');
        over.appendChild(textEl('nfx-card__over-t', item.title || T('untitled')));
        card.frame.appendChild(over);
      }
      if (row.kind === 'cont') {
        card.frame.appendChild(el('nfx-card__scrim'));
        var prog = el('nfx-card__prog');
        var fillEl = el('nfx-card__prog-fill');
        fillEl.style.width = round(item.progress) + '%';
        prog.appendChild(fillEl);
        card.frame.appendChild(prog);
      }
      card.frame.appendChild(el('nfx-card__ring'));
      card.node.appendChild(card.frame);

      if (showCap) {
        var cap = el('nfx-card__cap');
        cap.appendChild(textEl('nfx-card__title', item.title || T('untitled')));
        cap.appendChild(textEl('nfx-card__meta', metaLine(item)));
        card.node.appendChild(cap);
      }
      row.rail.appendChild(card.node);
      return card;
    }

    function removeCard(row, index) {
      var card = row.cards[index];
      if (!card) return;
      card.dead = true;
      if (card.img) {
        card.img.onload = null;
        card.img.onerror = null;
        card.img = null;
      }
      if (card.node === focusNode) focusNode = null;
      if (card.node.parentNode) card.node.parentNode.removeChild(card.node);
      delete row.cards[index];
    }

    // В DOM только карточки у видимой части ленты плюс запас по краям.
    function syncCards(row) {
      if (!row.rail || row.state !== 'ready') return;
      var count = row.items.length;
      var first = Math.floor((row.x - S.sidePad) / S.cardStep);
      var from = Math.max(0, first - NFX.data.cardMargin);
      var to = Math.min(count - 1, first + Math.ceil(view.w / S.cardStep) + NFX.data.cardMargin);
      var index;
      for (var key in row.cards) {
        if (!Object.prototype.hasOwnProperty.call(row.cards, key)) continue;
        index = parseInt(key, 10);
        if (index < from || index > to) removeCard(row, index);
      }
      for (index = from; index <= to; index++) {
        if (!row.cards[index]) row.cards[index] = createCard(row, index);
      }
    }

    /* ---------- ряды ---------- */
    function makeRow(def, kind) {
      var row = {
        def: def,
        kind: kind,
        title: rowTitle(def),
        state: 'idle',
        items: [],
        col: 0,
        x: 0,
        top: 0,
        h: 0,
        capOn: kind === 'cont' ? true : captions,
        el: null,
        rail: null,
        cards: {},
        mounted: false,
        retried: false
      };
      row.el = el('nfx-row' + (row.capOn ? '' : ' nfx-row--nocap'));
      return row;
    }

    function fillRow(row) {
      var head = el('nfx-row__head');
      head.appendChild(textEl('nfx-row__title', row.title));
      row.rail = el('nfx-rail');
      setTransform(row.rail, 'translate3d(' + (-row.x) + 'em,0,0)');
      row.el.appendChild(head);
      row.el.appendChild(row.rail);
      syncCards(row);
    }

    function fillSkeleton(row) {
      var wrap = el('nfx-skel');
      var head = el('nfx-row__head');
      var rail = el('nfx-rail');
      head.appendChild(el('nfx-skel__bar nfx-skel__bar--t nfx-skel__row-title'));
      for (var i = 0; i < S.skelCount; i++) {
        var card = el('nfx-card');
        card.style.left = round(S.sidePad + i * S.cardStep) + 'em';
        card.appendChild(el('nfx-card__frame'));
        if (row.capOn) {
          var cap = el('nfx-card__cap');
          cap.appendChild(el('nfx-skel__bar nfx-skel__cap-a'));
          cap.appendChild(el('nfx-skel__bar nfx-skel__cap-b'));
          card.appendChild(cap);
        }
        rail.appendChild(card);
      }
      wrap.appendChild(head);
      wrap.appendChild(rail);
      row.el.appendChild(wrap);
    }

    function unmountRow(row) {
      if (!row.mounted) return;
      for (var key in row.cards) {
        if (Object.prototype.hasOwnProperty.call(row.cards, key)) removeCard(row, parseInt(key, 10));
      }
      row.cards = {};
      row.rail = null;
      row.mounted = false;
      empty(row.el);
    }

    function mountRow(row) {
      if (row.mounted) return;
      row.mounted = true;
      if (row.state === 'ready') fillRow(row);
      else fillSkeleton(row);
    }

    function remountRow(row) {
      if (!row.mounted) return;
      unmountRow(row);
      mountRow(row);
    }

    function focusRow() {
      return zone === 'rows' ? rowIndex : 0;
    }

    function mountWindow() {
      var center = focusRow();
      for (var i = 0; i < rows.length; i++) {
        if (Math.abs(i - center) <= NFX.data.mountRows) mountRow(rows[i]);
        else unmountRow(rows[i]);
      }
    }

    function dropRow(row) {
      var index = rows.indexOf(row);
      if (index < 0) return;
      unmountRow(row);
      if (row.el.parentNode) row.el.parentNode.removeChild(row.el);
      rows.splice(index, 1);
      if (index < rowIndex) rowIndex--;
      if (rowIndex > rows.length - 1) rowIndex = Math.max(0, rows.length - 1);
      if (!rows.length && zone === 'rows') zone = hero ? 'hero' : 'none';
    }

    function loadRow(row) {
      var gen = generation;
      row.state = 'loading';
      request(row.def, function (items) {
        if (destroyed || gen !== generation || rows.indexOf(row) < 0) return;
        if (!items.length) {
          dropRow(row);
          layout();
        } else {
          row.items = items;
          row.state = 'ready';
          remountRow(row);
        }
        refresh();
      }, function () {
        if (destroyed || gen !== generation || rows.indexOf(row) < 0) return;
        // один повтор: разовый таймаут TMDB не должен убирать ряд до конца сеанса
        if (!row.retried) {
          row.retried = true;
          loadRow(row);
          return;
        }
        dropRow(row);
        layout();
        refresh();
      });
    }

    function ensureLoaded() {
      var last = Math.min(rows.length - 1, focusRow() + NFX.data.preloadRows);
      for (var i = 0; i <= last; i++) {
        if (rows[i].state === 'idle') loadRow(rows[i]);
      }
    }

    /* ---------- «Продолжить просмотр» ---------- */
    function contIndex() {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].kind === 'cont') return i;
      }
      return -1;
    }

    // Возвращает true, если состав рядов изменился.
    function syncContinue() {
      var items = useContinue ? continueItems() : [];
      var sig = signature(items);
      if (sig === contSig) return false;
      contSig = sig;
      var index = contIndex();
      var row;
      if (index >= 0) {
        row = rows[index];
        if (!items.length) {
          dropRow(row);
          return true;
        }
        row.items = items;
        if (row.col > items.length - 1) row.col = items.length - 1;
        row.x = railX(row);
        remountRow(row);
        return true;
      }
      if (!items.length) return false;
      index = Math.min(1, rows.length);
      row = makeRow({ id: 'cont', title: 'row_cont' }, 'cont');
      row.items = items;
      row.state = 'ready';
      rowsEl.insertBefore(row.el, rows[index] ? rows[index].el : null);
      rows.splice(index, 0, row);
      if (zone === 'rows' && rowIndex >= index) rowIndex++;
      return true;
    }

    /* ---------- баннер ---------- */
    function makeButton(icon, text) {
      var btn = el('nfx-btn');
      btn.innerHTML = icon;
      btn.appendChild(textEl('nfx-btn__text', text));
      return btn;
    }

    function buildHero() {
      hero = {
        el: el('nfx-hero'),
        layers: [el('nfx-hero__img'), el('nfx-hero__img')],
        body: el('nfx-hero__body'),
        title: el('nfx-hero__title'),
        desc: el('nfx-hero__desc'),
        btns: [makeButton(ICON.play, T('watch')), makeButton(ICON.info, T('details'))],
        shade: el('nfx-hero__shade')
      };
      var btns = el('nfx-hero__btns');
      btns.appendChild(hero.btns[0]);
      btns.appendChild(hero.btns[1]);
      hero.body.appendChild(hero.title);
      hero.body.appendChild(hero.desc);
      hero.body.appendChild(btns);
      hero.el.appendChild(hero.layers[0]);
      hero.el.appendChild(hero.layers[1]);
      hero.el.appendChild(hero.shade);
      hero.el.appendChild(hero.body);
      pageEl.insertBefore(hero.el, pageEl.firstChild);
      heroTop = 0;
      heroFading = null;
    }

    function fillHeroText(item) {
      hero.title.textContent = item.title || T('untitled');
      hero.title.className = 'nfx-hero__title' + (item.overview ? '' : ' nfx-hero__title--solo');
      hero.desc.textContent = item.overview;
      hero.desc.style.display = item.overview ? '' : 'none';
    }

    function finishFade() {
      clearTimeout(timers.heroFade);
      if (heroFading) {
        heroFading.style.backgroundImage = 'none';
        heroFading.style.opacity = '0';
        heroFading = null;
      }
    }

    // Новый кадр проявляется поверх старого; анимируется только opacity верхнего слоя.
    function heroFade(url, instant) {
      finishFade();
      var cur = hero.layers[heroTop];
      var next = hero.layers[1 - heroTop];
      heroTop = 1 - heroTop;
      next.style.transition = 'none';
      next.style.opacity = '0';
      next.style.zIndex = '1';
      cur.style.zIndex = '0';
      next.style.backgroundImage = url ? cssUrl(url) : 'none';
      if (instant) {
        next.style.opacity = '1';
        cur.style.backgroundImage = 'none';
        cur.style.opacity = '0';
        return;
      }
      void next.offsetWidth;   // один пересчёт на смену баннера, чтобы переход стартовал с нуля
      next.style.transition = '';
      next.style.opacity = '1';
      heroFading = cur;
      timers.heroFade = setTimeout(finishFade, NFX.motion.heroFade + 60);
    }

    function setHero(item, instant) {
      if (!hero || !item) return;
      heroItem = item;
      var token = ++heroToken;
      syncTrailer();

      clearTimeout(timers.heroText);
      if (instant) {
        fillHeroText(item);
      } else {
        hero.body.className = 'nfx-hero__body nfx-hero__body--out';
        timers.heroText = setTimeout(function () {
          if (destroyed || !hero) return;
          fillHeroText(item);
          hero.body.className = 'nfx-hero__body';
        }, NFX.motion.heroTextOut);
      }

      if (heroLoader) {
        heroLoader.onload = null;
        heroLoader.onerror = null;
        heroLoader = null;
      }
      var big = imgUrl(item.backdrop, NFX.img.hero);
      if (!big) {
        heroFade('', instant);
        return;
      }
      // Пока грузится крупный кадр, показываем уже загруженный кадр карточки.
      var standIn = item.loaded ? imgUrl(item.backdrop, NFX.img.card) : '';
      if (standIn) heroFade(standIn, instant);
      heroLoader = new Image();
      heroLoader.onload = function () {
        heroLoader = null;
        if (destroyed || !hero || token !== heroToken) return;
        if (standIn) hero.layers[heroTop].style.backgroundImage = cssUrl(big);
        else heroFade(big, false);
      };
      heroLoader.onerror = function () {
        heroLoader = null;
      };
      heroLoader.src = big;
    }

    function scheduleHero() {
      clearTimeout(timers.hero);
      if (!hero || zone !== 'rows' || rowIndex !== 0 || !rows[0] || rows[0].kind !== 'tmdb') return;
      var item = rows[0].items[rows[0].col];
      if (!item || item === heroItem || !item.backdrop) return;
      timers.hero = setTimeout(function () {
        if (!destroyed) setHero(item, false);
      }, NFX.motion.heroDelay);
    }

    /* ---------- трейлер на баннере ---------- */
    function heroInView() {
      return zone === 'hero' || (zone === 'rows' && rowIndex === 0);
    }

    function stopTrailer(fade) {
      clearTimeout(timers.trailer);
      trailerFor = null;
      trailerItem = null;
      trailer.stop(fade && !destroyed);
    }

    // Трейлер идёт, только пока баннер на экране и не меняется; любое расхождение — остановка.
    function syncTrailer() {
      var want = useTrailer && started && !destroyed && hero && heroItem && heroInView() ? heroItem : null;
      if (want && want === trailerSkip) want = null;
      if (trailerItem ? trailerItem === want : trailerFor === want) return;
      stopTrailer(true);
      if (!want) return;
      trailerFor = want;
      timers.trailer = setTimeout(function () {
        if (destroyed || trailerFor !== want) return;
        findTrailer(want, function (key) {
          if (destroyed || trailerFor !== want || trailerItem || !hero) return;
          trailerFor = null;
          if (!key) {
            trailerSkip = want;
            return;
          }
          trailerItem = want;
          trailer.play(key, function () {
            // ролик доигран или не запустился: для этой карточки больше не пробуем, пока баннер не сменится
            trailerSkip = want;
            trailerItem = null;
          });
        });
      }, NFX.motion.trailerDelay);
    }

    /* ---------- слой состояния ---------- */
    function clearState() {
      if (stateEl && stateEl.parentNode) stateEl.parentNode.removeChild(stateEl);
      if (stateBtn && stateBtn === focusNode) focusNode = null;
      stateEl = null;
      stateBtn = null;
      stateKind = '';
    }

    function showMessage(kind) {
      clearState();
      stateKind = kind;
      stateEl = el('nfx-state nfx-err');
      var box = el('nfx-err__box');
      box.innerHTML = ICON.offline;
      box.appendChild(textEl('nfx-err__title', T(kind === 'error' ? 'err_title' : 'empty_title')));
      if (kind === 'error') box.appendChild(textEl('nfx-err__hint', T('err_hint')));
      stateBtn = el('nfx-btn');
      stateBtn.appendChild(textEl('nfx-btn__text', T('retry')));
      box.appendChild(stateBtn);
      stateEl.appendChild(box);
      node.appendChild(stateEl);
      zone = 'err';
    }

    function showSkeleton() {
      clearState();
      stateKind = 'loading';
      stateEl = el('nfx-state nfx-skel');
      var heroEl = el('nfx-skel__hero');
      var body = el('nfx-skel__hero-body');
      var widths = [33.6, 30, 20];
      body.appendChild(el('nfx-skel__bar nfx-skel__bar--t nfx-skel__hero-title'));
      for (var i = 0; i < widths.length; i++) {
        var line = el('nfx-skel__bar nfx-skel__hero-line');
        line.style.width = widths[i] + 'em';
        body.appendChild(line);
      }
      var btns = el('nfx-skel__hero-btns');
      var btnA = el('nfx-skel__bar nfx-skel__hero-btn');
      var btnB = el('nfx-skel__bar nfx-skel__hero-btn');
      btnA.style.width = '9em';
      btnB.style.width = '10.4em';
      btns.appendChild(btnA);
      btns.appendChild(btnB);
      body.appendChild(btns);
      heroEl.appendChild(body);
      stateEl.appendChild(heroEl);
      var rowsBox = el('nfx-rows');
      var fake = { capOn: captions, el: el('nfx-row' + (captions ? '' : ' nfx-row--nocap')) };
      fillSkeleton(fake);
      // обёртка ряда пульсирует вместе со всем слоем, своя анимация ей не нужна
      fake.el.firstChild.className = '';
      rowsBox.appendChild(fake.el);
      stateEl.appendChild(rowsBox);
      node.appendChild(stateEl);
      zone = 'none';
    }

    /* ---------- фокус ---------- */
    function applyFocus() {
      var target = null;
      var cls = '';
      var rowEl = null;
      if (active) {
        if (zone === 'hero' && hero) {
          target = hero.btns[btnIndex];
          cls = 'nfx-btn--focus';
        } else if (zone === 'rows' && rows[rowIndex]) {
          var card = rows[rowIndex].cards[rows[rowIndex].col];
          target = card ? card.node : null;
          cls = 'nfx-card--focus';
        } else if (zone === 'err') {
          target = stateBtn;
          cls = 'nfx-btn--focus';
        }
      }
      if (zone === 'rows' && rows[rowIndex]) rowEl = rows[rowIndex].el;
      if (rowEl !== activeRowEl) {
        if (activeRowEl) activeRowEl.classList.remove('nfx-row--active');
        if (rowEl) rowEl.classList.add('nfx-row--active');
        activeRowEl = rowEl;
      }
      if (target === focusNode) return;
      if (focusNode) focusNode.classList.remove(focusCls);
      focusNode = target;
      focusCls = cls;
      if (target) target.classList.add(cls);
    }

    // Привести DOM в соответствие с моделью: загрузки, окно рядов, прокрутка, фокус.
    function refresh() {
      if (destroyed) return;
      ensureLoaded();
      mountWindow();
      applyScroll();
      applyFocus();
      scheduleHero();
      syncTrailer();
    }

    /* ---------- сборка и загрузка ---------- */
    function reset() {
      stopTrailer(false);
      trailerSkip = null;
      clearTimeout(timers.hero);
      clearTimeout(timers.heroText);
      finishFade();
      if (heroLoader) {
        heroLoader.onload = null;
        heroLoader.onerror = null;
        heroLoader = null;
      }
      for (var i = 0; i < rows.length; i++) unmountRow(rows[i]);
      rows = [];
      empty(rowsEl);
      if (hero && hero.el.parentNode) hero.el.parentNode.removeChild(hero.el);
      hero = null;
      heroItem = null;
      focusNode = null;
      activeRowEl = null;
      contSig = '';
      rowIndex = 0;
      btnIndex = 0;
    }

    function build(headItems) {
      var i;
      reset();
      measure();
      for (i = 0; i < ROWS.length; i++) {
        var row = makeRow(ROWS[i], 'tmdb');
        rows.push(row);
        rowsEl.appendChild(row.el);
      }
      rows[0].items = headItems;
      rows[0].state = 'ready';

      var first = null;
      for (i = 0; i < headItems.length; i++) {
        if (headItems[i].backdrop) {
          first = headItems[i];
          break;
        }
      }
      buildHero();
      setHero(first || headItems[0], true);

      syncContinue();
      contDirty = false;
      zone = 'hero';
      layout();
    }

    function loadHead() {
      if (headLoading) return;
      headLoading = true;
      var gen = ++generation;
      // Свой каркас показываем сразу, без лоадера Lampa: на медленной сети экран не остаётся пустым.
      // Управление Lampa включает сама (start сразу после create), поэтому activity.toggle() после данных не нужен —
      // он отбирал бы фокус, если пользователь за время загрузки ушёл в меню.
      showSkeleton();
      applyFocus();

      request(ROWS[0], function (items) {
        if (destroyed || gen !== generation) return;
        headLoading = false;
        clearState();
        if (items.length) build(items);
        else showMessage('empty');
        refresh();
      }, function () {
        if (destroyed || gen !== generation) return;
        headLoading = false;
        reset();
        showMessage('error');
        Lampa.Noty.show(T('noty_error'));
        refresh();
      });
    }

    // Настройки и история могли измениться, пока экран был не в фокусе.
    function applySettings() {
      useTrailer = flag('nfx_trailer', true);
      if (!rows.length) return;
      var changed = false;
      var cap = flag('nfx_captions', true);
      measure();
      if (cap !== captions) {
        captions = cap;
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          if (row.kind !== 'tmdb') continue;
          row.capOn = cap;
          row.el.className = 'nfx-row' + (cap ? '' : ' nfx-row--nocap');
          if (row.el === activeRowEl) activeRowEl = null;
          remountRow(row);
        }
        changed = true;
      }
      var cont = flag('nfx_continue', true);
      if (cont !== useContinue || contDirty) {
        useContinue = cont;
        contDirty = false;
        if (syncContinue()) changed = true;
      }
      if (changed) layout();
    }

    /* ---------- пульт ---------- */
    function keyTick() {
      var now = Date.now();
      var fast = now - lastKey < NFX.motion.railFast;
      lastKey = now;
      if (fast === isFast) return;
      isFast = fast;
      if (fast) node.classList.add('nfx--fast');
      else node.classList.remove('nfx--fast');
    }

    function moveCol(delta) {
      var row = rows[rowIndex];
      if (!row || row.state !== 'ready') return false;
      var next = row.col + delta;
      if (next < 0 || next > row.items.length - 1) return false;
      row.col = next;
      row.x = railX(row);
      syncCards(row);
      if (row.rail) setTransform(row.rail, 'translate3d(' + (-row.x) + 'em,0,0)');
      applyFocus();
      scheduleHero();
      return true;
    }

    function openFull(item) {
      if (!item) return;
      Lampa.Activity.push({
        url: '',
        component: 'full',
        id: item.id,
        method: item.type,
        card: item.card,
        source: item.card.source || 'tmdb'
      });
    }

    function press(target, cls) {
      if (!target) return;
      target.classList.add(cls);
      setTimeout(function () {
        target.classList.remove(cls);
      }, NFX.motion.press);
    }

    var controller = {
      link: self,
      invisible: true,
      toggle: function () {
        Lampa.Controller.collectionSet(root);
        active = true;
        applySettings();
        refresh();
      },
      gone: function () {
        // таймер баннера не гасим: если ушли в меню сразу после листания, баннер должен догнать фокус
        active = false;
        applyFocus();
      },
      left: function () {
        keyTick();
        if (zone === 'hero' && btnIndex > 0) {
          btnIndex--;
          applyFocus();
        } else if (zone === 'rows' && moveCol(-1)) {
          return;
        } else {
          Lampa.Controller.toggle('menu');
        }
      },
      right: function () {
        keyTick();
        if (zone === 'hero' && hero && btnIndex < hero.btns.length - 1) {
          btnIndex++;
          applyFocus();
        } else if (zone === 'rows') {
          moveCol(1);
        }
      },
      up: function () {
        keyTick();
        if (zone === 'rows' && rowIndex > 0) {
          rowIndex--;
          refresh();
        } else if (zone === 'rows' && hero) {
          zone = 'hero';
          btnIndex = 0;
          refresh();
        } else {
          Lampa.Controller.toggle('head');
        }
      },
      down: function () {
        keyTick();
        var next;
        if (zone === 'hero') next = 0;
        else if (zone === 'rows') next = rowIndex + 1;
        else return;
        // ряды, которые ещё грузятся, фокус не получают
        if (!rows[next] || rows[next].state !== 'ready') return;
        zone = 'rows';
        rowIndex = next;
        refresh();
      },
      enter: function () {
        if (zone === 'hero' && hero) {
          press(hero.btns[btnIndex], 'nfx-btn--press');
          openFull(heroItem);
        } else if (zone === 'rows' && rows[rowIndex]) {
          var row = rows[rowIndex];
          var card = row.cards[row.col];
          if (card) press(card.node, 'nfx-card--press');
          openFull(row.items[row.col]);
        } else if (zone === 'err') {
          loadHead();
        }
      },
      back: function () {
        Lampa.Activity.backward();
      }
    };

    function relayout() {
      measure();
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (row.state !== 'ready') continue;
        row.x = railX(row);
        if (row.rail) setTransform(row.rail, 'translate3d(' + (-row.x) + 'em,0,0)');
        syncCards(row);
      }
      layout();
    }

    function onResize() {
      if (destroyed) return;
      // экран под другой активностью не пересчитываем и ничего не догружаем — сделаем это при возврате
      if (!started) {
        resizePending = true;
        return;
      }
      relayout();
      refresh();
    }

    // Класс на body общий для всех экземпляров экрана: не снимаем его, если сейчас активна другая витрина.
    function releaseBody() {
      var current = Lampa.Activity.active();
      if (current && current.component === COMPONENT && current.activity !== self.activity) return;
      if (current && current.component === 'full' && card.slide) return;   // сейчас открыта карточка в нашем оформлении
      document.body.classList.remove('nfx--active');
    }

    /* ---------- методы, которые вызывает Lampa ---------- */
    this.create = function () {
      pageEl.appendChild(rowsEl);
      node.appendChild(pageEl);
      measure();
      window.addEventListener('resize', onResize);
      loadHead();
      return this.render();
    };

    this.start = function () {
      if (destroyed) return;
      started = true;
      contDirty = true;   // пока экран был под другой активностью, история и таймкоды могли измениться
      document.body.classList.add('nfx--active');
      if (resizePending) {
        resizePending = false;
        relayout();
      }
      Lampa.Controller.add('content', controller);
      Lampa.Controller.toggle('content');
    };

    this.pause = function () {
      active = false;
      started = false;
      clearTimeout(timers.hero);
      stopTrailer(false);
      releaseBody();
    };

    this.stop = function () {
      this.pause();
    };

    this.render = function (js) {
      return js ? node : root;
    };

    this.destroy = function () {
      destroyed = true;
      started = false;
      generation++;
      window.removeEventListener('resize', onResize);
      reset();
      clearState();
      releaseBody();
      root.remove();
    };
  }

  /* ------------------------------------------------------------------ встраивание в Lampa */
  function homeObject() {
    return { url: '', title: T('title'), component: COMPONENT, page: 1 };
  }

  function openHome() {
    var current = Lampa.Activity.active();
    if (current && current.component === COMPONENT) {
      Lampa.Controller.toggle('content');
      return;
    }
    Lampa.Activity.push(homeObject());
  }

  function addMenu() {
    if ($('.menu [data-action="' + COMPONENT + '"]').length) return;
    var title = T('title');
    // Порядок пунктов меню хранит сама Lampa (редактор меню): новые пункты она ставит в конец.
    // При первой установке записываем свой пункт первым, дальше порядок остаётся за пользователем.
    try {
      var sort = Lampa.Storage.get('menu_sort', '[]');
      if (Object.prototype.toString.call(sort) === '[object Array]' && sort.length && sort.indexOf(title) < 0) {
        sort.unshift(title);
        Lampa.Storage.set('menu_sort', sort);
      }
    } catch (e) {}
    var item = $('<li class="menu__item selector"><div class="menu__ico"></div><div class="menu__text"></div></li>');
    item.attr('data-action', COMPONENT);
    item.find('.menu__ico').html(ICON.menu);
    item.find('.menu__text').text(title);
    item.on('hover:enter', openHome);
    $('.menu .menu__list').eq(0).prepend(item);
  }

  function addSettings() {
    Lampa.SettingsApi.addComponent({ component: COMPONENT, name: T('title'), icon: ICON.menu });
    var params = [
      { name: 'nfx_as_home', def: false, title: 'set_home', desc: 'set_home_d' },
      { name: 'nfx_captions', def: true, title: 'set_cap', desc: 'set_cap_d' },
      { name: 'nfx_card', def: true, title: 'set_card', desc: 'set_card_d' },
      { name: 'nfx_trailer', def: true, title: 'set_trailer', desc: 'set_trailer_d' },
      { name: 'nfx_continue', def: true, title: 'set_cont', desc: 'set_cont_d' }
    ];
    for (var i = 0; i < params.length; i++) {
      Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: { name: params[i].name, type: 'trigger', 'default': params[i].def },
        field: { name: T(params[i].title), description: T(params[i].desc) }
      });
    }
  }

  // Режим «вместо главной»: стандартная главная Lampa подменяется витриной.
  function swapHome() {
    if (!flag('nfx_as_home', false)) return;
    var current = Lampa.Activity.active();
    if (!current || current.component !== 'main') return;
    // Если витрина уже открыта прямо под главной, возвращаемся к ней, а не открываем вторую.
    var stack = typeof Lampa.Activity.all === 'function' ? Lampa.Activity.all() : [];
    var previous = stack && stack.length > 1 ? stack[stack.length - 2] : null;
    if (previous && previous.component === COMPONENT) {
      // Lampa уничтожает закрываемый экран с задержкой; ставим главную на паузу, чтобы её догружающиеся
      // данные не перехватили управление у витрины.
      if (current.activity && typeof current.activity.pause === 'function') current.activity.pause();
      Lampa.Activity.backward();
    } else {
      Lampa.Activity.replace(homeObject(), true);
    }
  }

  function watchHome() {
    Lampa.Listener.follow('activity', function (e) {
      if (e.type === 'start' && e.component === 'main' && flag('nfx_as_home', false)) setTimeout(swapHome, 0);
    });
    swapHome();
  }

  /* ------------------------------------------------------------------ карточка Lampa в стиле витрины */
  // Сама карточка остаётся карточкой Lampa (все её кнопки и разделы, включая добавленные другими плагинами):
  // мы только помечаем её экран классом nfx-full, под которым действуют наши стили, и ставим трейлер на фон.
  var card = { slide: null, item: null, player: null, watch: 0, wait: 0, pending: false, skip: false };

  function slideOf(object) {
    var node = null;
    try {
      node = object.activity.render(true);
    } catch (e) {}
    return node && node.classList ? node : null;
  }

  function cardStopTrailer() {
    clearTimeout(card.wait);
    card.pending = false;
    if (card.player) card.player.stop(true);
  }

  function cardHeroVisible() {
    var start = card.slide.querySelector('.full-start-new');
    if (!start) return false;
    var rect = start.getBoundingClientRect();
    return rect.height > 0 && rect.top > -rect.height / 2;
  }

  // Раз в секунду сверяем, можно ли показывать трейлер: карточка на экране, баннер не прокручен, плеер не открыт.
  function cardTick() {
    var slide = card.slide;
    if (!slide) return;
    var ok = !card.skip && flag('nfx_trailer', true) && document.body.contains(slide) &&
      slide.classList.contains('activity--active') && !document.querySelector('.player') && cardHeroVisible();
    if (!ok) {
      cardStopTrailer();
      return;
    }
    if (card.pending || card.player.active()) return;
    var item = card.item;
    card.pending = true;
    card.wait = setTimeout(function () {
      findTrailer(item, function (key) {
        if (card.slide !== slide || card.item !== item || !card.pending) return;
        card.pending = false;
        if (!key) {
          card.skip = true;
          return;
        }
        card.player.play(key, function () {
          card.skip = true;   // доигран или не запустился — второй раз на этой карточке не пускаем
        });
      });
    }, NFX.motion.trailerDelay);
  }

  function undressCard() {
    clearInterval(card.watch);
    cardStopTrailer();
    card.slide = null;
    card.item = null;
    card.player = null;
  }

  function dressCard(object) {
    var slide = slideOf(object);
    if (!slide) return;
    if (card.slide !== slide) {
      undressCard();
      var source = object.source || 'tmdb';
      card.slide = slide;
      card.item = { id: object.id, type: object.method === 'tv' ? 'tv' : 'movie' };
      // трейлер ищем по номеру TMDB; у карточек из других источников номера свои
      card.skip = source !== 'tmdb' && source !== 'cub';
      card.player = makeTrailer('nfx-full__video', function (box) {
        (slide.querySelector('.activity__body') || slide).appendChild(box);
      });
    }
    slide.classList.add('nfx-full');
    document.body.classList.add('nfx--active');
    clearInterval(card.watch);
    card.watch = setInterval(cardTick, 1000);
  }

  function watchCard() {
    Lampa.Listener.follow('activity', function (e) {
      if (e.type === 'start') {
        if (e.component === 'full' && flag('nfx_card', true)) {
          dressCard(e.object);
          return;
        }
        undressCard();
        if (e.component === 'full') {
          var slide = slideOf(e.object);
          if (slide) slide.classList.remove('nfx-full');
        }
        if (e.component !== COMPONENT) document.body.classList.remove('nfx--active');
      } else if (e.type === 'destroy' && card.slide && e.object && slideOf(e.object) === card.slide) {
        undressCard();
      }
    });
  }

  function init() {
    injectStyle();
    Lampa.Component.add(COMPONENT, Home);
    addMenu();
    addSettings();
    watchHome();
    watchCard();
  }

  if (window.appready) init();
  else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') init();
    });
  }
})();
