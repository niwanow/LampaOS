/*
 * NFX Home — главная в стиле Netflix для Lampa.
 *
 * Данные берутся только из TMDB через встроенный клиент Lampa (с его прокси и языком).
 * Никаких сторонних серверов, статистики и обфускации: весь код ниже читается как есть.
 * «Недавно смотрели» и «Мой список» берутся из локальной истории и закладок Lampa и никуда не отправляются.
 *
 * Установка: Настройки → Расширения → Добавить плагин → адрес этого файла.
 */
(function () {
  'use strict';

  if (window.nfx_home_ready) return;
  window.nfx_home_ready = true;

  var COMPONENT = 'nfx_home';
  var TITLE = 'Netflix';

  var ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm6 4v6l5-3-5-3z"/></svg>';

  var GENRES = {
    28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия', 80: 'Криминал',
    99: 'Документальный', 18: 'Драма', 10751: 'Семейный', 14: 'Фэнтези', 36: 'История',
    27: 'Ужасы', 10402: 'Музыка', 9648: 'Детектив', 10749: 'Мелодрама', 878: 'Фантастика',
    10770: 'Телефильм', 53: 'Триллер', 10752: 'Военный', 37: 'Вестерн',
    10759: 'Боевик и приключения', 10762: 'Детский', 10763: 'Новости', 10764: 'Реалити',
    10765: 'Фантастика и фэнтези', 10766: 'Мыльная опера', 10767: 'Ток-шоу', 10768: 'Война и политика'
  };

  // Ряды главной сверху вниз. type: 'top' — топ-10 с большими номерами, иначе горизонтальные карточки.
  // local — ряд из локальных данных Lampa (история, закладки), без запросов в сеть.
  var ROWS = [
    { id: 'history', title: 'Вы недавно смотрели', local: 'history' },
    { id: 'nf_tv', title: 'Популярное на Netflix', method: 'discover/tv?with_networks=213&sort_by=popularity.desc', media: 'tv', netflix: true },
    { id: 'top_movie', title: 'Топ-10 фильмов недели', method: 'trending/movie/week', media: 'movie', type: 'top' },
    { id: 'nf_movie', title: 'Фильмы на Netflix', method: 'discover/movie?with_watch_providers=8&watch_region=US&sort_by=popularity.desc', media: 'movie', netflix: true },
    { id: 'top_tv', title: 'Топ-10 сериалов недели', method: 'trending/tv/week', media: 'tv', type: 'top' },
    { id: 'book', title: 'Мой список', local: 'book' },
    { id: 'now', title: 'Сейчас в кино', method: 'movie/now_playing', media: 'movie' },
    { id: 'nf_best', title: 'Сериалы Netflix с высоким рейтингом', method: 'discover/tv?with_networks=213&sort_by=vote_average.desc&vote_count.gte=500', media: 'tv', netflix: true },
    { id: 'action', title: 'Боевики', method: 'discover/movie?with_genres=28&sort_by=popularity.desc', media: 'movie' },
    { id: 'comedy', title: 'Комедии', method: 'discover/movie?with_genres=35&sort_by=popularity.desc', media: 'movie' },
    { id: 'scifi', title: 'Фантастика', method: 'discover/movie?with_genres=878&sort_by=popularity.desc', media: 'movie' },
    { id: 'docs', title: 'Документальные сериалы Netflix', method: 'discover/tv?with_networks=213&with_genres=99&sort_by=popularity.desc', media: 'tv', netflix: true }
  ];

  var LOAD_TIMEOUT = 15000;
  var INFO_DELAY = 300;

  /* ---------- Данные ---------- */

  function tmdbGet(method, ok, fail) {
    try {
      var src = Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb;
      if (src && typeof src.get === 'function') {
        src.get(method, {}, ok, fail);
        return;
      }
    } catch (e) {}
    if (fail) fail();
  }

  function img(path, size) {
    if (!path) return '';
    try {
      if (Lampa.Api && typeof Lampa.Api.img === 'function') return Lampa.Api.img(path, size);
    } catch (e) {}
    return 'https://image.tmdb.org/t/p/' + size + path;
  }

  function mediaOf(card, fallback) {
    if (card.media_type === 'tv' || card.media_type === 'movie') return card.media_type;
    if (fallback) return fallback;
    return card.original_name || card.first_air_date || card.number_of_seasons ? 'tv' : 'movie';
  }

  function genreNames(card) {
    var ids = card.genre_ids;
    if (!ids && card.genres) {
      ids = [];
      for (var i = 0; i < card.genres.length; i++) ids.push(card.genres[i].id);
    }
    var out = [];
    for (var j = 0; ids && j < ids.length && out.length < 3; j++) {
      if (GENRES[ids[j]]) out.push(GENRES[ids[j]]);
    }
    return out;
  }

  function normalize(card, def) {
    var media = mediaOf(card, def.media);
    var date = card.release_date || card.first_air_date || '';
    return {
      card: card,
      media: media,
      id: card.id,
      netflix: !!def.netflix,
      title: card.title || card.name || card.original_title || card.original_name || '',
      year: date ? String(date).slice(0, 4) : '',
      vote: card.vote_average ? Number(card.vote_average).toFixed(1) : '',
      overview: card.overview || '',
      backdrop: card.backdrop_path || '',
      poster: card.poster_path || '',
      genres: genreNames(card)
    };
  }

  function localList(type) {
    try {
      if (Lampa.Favorite && typeof Lampa.Favorite.get === 'function') {
        return Lampa.Favorite.get({ type: type }) || [];
      }
    } catch (e) {}
    return [];
  }

  var logoCache = {};

  function loadLogo(item, cb) {
    var key = item.media + '_' + item.id;
    if (logoCache.hasOwnProperty(key)) return cb(logoCache[key]);
    if (item.card.source && item.card.source !== 'tmdb') {
      logoCache[key] = '';
      return cb('');
    }
    tmdbGet(item.media + '/' + item.id + '/images?include_image_language=ru,en,null', function (data) {
      var logos = (data && data.logos) || [];
      var pick = null;
      var langs = ['ru', 'en', null];
      for (var l = 0; l < langs.length && !pick; l++) {
        for (var i = 0; i < logos.length; i++) {
          if (logos[i].iso_639_1 === langs[l]) { pick = logos[i]; break; }
        }
      }
      if (!pick && logos.length) pick = logos[0];
      logoCache[key] = pick && pick.file_path ? img(pick.file_path.replace('.svg', '.png'), 'w500') : '';
      cb(logoCache[key]);
    }, function () {
      logoCache[key] = '';
      cb('');
    });
  }

  function openCard(item) {
    Lampa.Activity.push({
      url: '',
      component: 'full',
      id: item.id,
      method: item.media,
      card: item.card,
      source: item.card.source || 'tmdb'
    });
  }

  /* ---------- Экран ---------- */

  function Home(object) {
    var self = this;
    var html = $('<div class="nfx"></div>');
    var bg = $('<div class="nfx__bg"></div>');
    var layers = [$('<div class="nfx__bg-img"></div>'), $('<div class="nfx__bg-img"></div>')];
    var info = $(
      '<div class="nfx__info">' +
        '<div class="nfx__badge"></div>' +
        '<div class="nfx__logo"></div>' +
        '<div class="nfx__meta"></div>' +
        '<div class="nfx__overview"></div>' +
      '</div>'
    );
    var rowsBox = $('<div class="nfx__rows"><div class="nfx__rows-body"></div></div>');
    var body = rowsBox.find('.nfx__rows-body');

    var rows = [];
    var rowIndex = 0;
    var activeLayer = 0;
    var wantedBg = '';
    var currentKey = '';
    var infoTimer = null;
    var destroyed = false;

    bg.append(layers[0]).append(layers[1]);
    html.append(bg).append(info).append(rowsBox);

    function setBackdrop(url) {
      wantedBg = url;
      if (!url) {
        layers[0].removeClass('nfx__bg-img--show');
        layers[1].removeClass('nfx__bg-img--show');
        return;
      }
      var pre = new Image();
      pre.onload = function () {
        if (destroyed || url !== wantedBg) return;
        activeLayer = 1 - activeLayer;
        layers[activeLayer].css('background-image', 'url("' + url + '")').addClass('nfx__bg-img--show');
        layers[1 - activeLayer].removeClass('nfx__bg-img--show');
      };
      pre.src = url;
    }

    function badgeText(item, row, col) {
      if (row.def.type === 'top') return '№ ' + (col + 1) + ' в топе недели';
      if (item.netflix) return item.media === 'tv' ? 'Сериал Netflix' : 'Фильм на Netflix';
      return item.media === 'tv' ? 'Сериал' : 'Фильм';
    }

    function showInfo(item, row, col) {
      var key = item.media + '_' + item.id;
      if (key === currentKey) return;
      currentKey = key;

      info.find('.nfx__badge').text(badgeText(item, row, col));

      var logoBox = info.find('.nfx__logo').empty();
      logoBox.append($('<div class="nfx__title"></div>').text(item.title));

      var meta = info.find('.nfx__meta').empty();
      if (item.vote) meta.append($('<span class="nfx__vote"></span>').text('★ ' + item.vote));
      if (item.year) meta.append($('<span></span>').text(item.year));
      if (item.genres.length) meta.append($('<span></span>').text(item.genres.join(', ')));

      info.find('.nfx__overview').text(item.overview);

      // Картинки грузим с задержкой, чтобы не дёргать сеть при быстром пролистывании.
      clearTimeout(infoTimer);
      infoTimer = setTimeout(function () {
        if (destroyed || key !== currentKey) return;
        setBackdrop(img(item.backdrop, 'w1280'));
        loadLogo(item, function (url) {
          if (destroyed || key !== currentKey || !url) return;
          var image = document.createElement('img');
          image.onload = function () {
            if (destroyed || key !== currentKey) return;
            logoBox.empty().append(image);
          };
          image.src = url;
        });
      }, INFO_DELAY);
    }

    function loadImages() {
      var from = Math.max(0, rowIndex - 1);
      var to = Math.min(rows.length - 1, rowIndex + 2);
      for (var r = from; r <= to; r++) {
        var row = rows[r];
        var c0 = Math.max(0, row.col - 2);
        var c1 = Math.min(row.cards.length - 1, row.col + 9);
        for (var c = c0; c <= c1; c++) {
          var card = row.cards[c];
          if (card.data('nfx-loaded')) continue;
          card.data('nfx-loaded', true);
          var url = card.data('nfx-img');
          if (url) card.find('.nfx-card__img').css('background-image', 'url("' + url + '")');
        }
      }
    }

    function onFocus(r, c) {
      var row = rows[r];
      if (!row || !row.cards[c]) return;
      rowIndex = r;
      row.col = c;

      // Фокус всегда у левого края ряда, как в приложении Netflix на ТВ.
      var shift = row.cards[c][0].offsetLeft - row.cards[0][0].offsetLeft;
      row.track.css('transform', 'translate3d(' + (-shift) + 'px,0,0)');

      // Активный ряд поднимается к верху области рядов.
      body.css('transform', 'translate3d(0,' + (-row.el[0].offsetTop) + 'px,0)');

      showInfo(row.items[c], row, c);
      loadImages();
    }

    function focusCard(r, c) {
      var row = rows[r];
      if (!row || !row.cards.length) return;
      c = Math.max(0, Math.min(c, row.cards.length - 1));
      var el = row.cards[c][0];
      try {
        Lampa.Controller.collectionFocus(el, html);
      } catch (e) {
        html.find('.nfx-card.focus').removeClass('focus');
        $(el).addClass('focus');
      }
      onFocus(r, c);
    }

    function buildRow(def, items) {
      var top = def.type === 'top';
      var row = { def: def, items: items, col: 0, cards: [] };
      var el = $('<div class="nfx-row' + (top ? ' nfx-row--top' : '') + '"><div class="nfx-row__title"></div><div class="nfx-row__track"></div></div>');
      el.find('.nfx-row__title').text(def.title);
      var track = el.find('.nfx-row__track');

      for (var i = 0; i < items.length; i++) {
        (function (item, index) {
          var card;
          if (top) {
            card = $('<div class="nfx-card nfx-card--top selector"><div class="nfx-card__num"></div><div class="nfx-card__img"></div></div>');
            card.find('.nfx-card__num').text(index + 1);
            card.data('nfx-img', img(item.poster, 'w342'));
          } else {
            card = $('<div class="nfx-card selector"><div class="nfx-card__img"></div><div class="nfx-card__name"></div></div>');
            card.find('.nfx-card__name').text(item.title);
            card.data('nfx-img', item.backdrop ? img(item.backdrop, 'w500') : img(item.poster, 'w342'));
          }
          card.on('hover:focus', function () {
            onFocus(rows.indexOf(row), index);
          });
          card.on('hover:enter', function () {
            openCard(item);
          });
          track.append(card);
          row.cards.push(card);
        })(items[i], i);
      }

      row.el = el;
      row.track = track;
      return row;
    }

    function usable(card, def) {
      if (!card || !card.id) return false;
      return def.type === 'top' ? !!card.poster_path : !!(card.backdrop_path || card.poster_path);
    }

    function loadAll(done) {
      var results = [];
      var pending = 0;
      var finished = false;

      function finish() {
        if (finished) return;
        finished = true;
        clearTimeout(guard);
        for (var i = 0; i < ROWS.length; i++) {
          var def = ROWS[i];
          var list = results[i] || [];
          var items = [];
          for (var j = 0; j < list.length && items.length < (def.type === 'top' ? 10 : 20); j++) {
            if (usable(list[j], def)) items.push(normalize(list[j], def));
          }
          if (!items.length) continue;
          var row = buildRow(def, items);
          rows.push(row);
          body.append(row.el);
        }
        done();
      }

      var guard = setTimeout(finish, LOAD_TIMEOUT);

      for (var i = 0; i < ROWS.length; i++) {
        (function (def, index) {
          if (def.local) {
            results[index] = localList(def.local);
            return;
          }
          pending++;
          tmdbGet(def.method, function (data) {
            results[index] = (data && data.results) || [];
            if (--pending === 0) finish();
          }, function () {
            results[index] = [];
            if (--pending === 0) finish();
          });
        })(ROWS[i], i);
      }

      if (pending === 0) finish();
    }

    this.create = function () {
      this.activity.loader(true);
      loadAll(function () {
        if (destroyed) return;
        self.activity.loader(false);
        if (!rows.length) {
          html.append('<div class="nfx__empty">Подборки не загрузились: Lampa не получила ответ от TMDB. Проверьте интернет или включите расширение TMDB Proxy в «Настройки → Расширения», затем откройте этот экран снова.</div>');
        }
        self.activity.toggle();
      });
      return this.render();
    };

    this.start = function () {
      if (destroyed) return;
      $('body').addClass('nfx--active');
      Lampa.Controller.add('content', {
        link: this,
        toggle: function () {
          Lampa.Controller.collectionSet(html);
          if (rows[rowIndex]) focusCard(rowIndex, rows[rowIndex].col);
        },
        left: function () {
          var row = rows[rowIndex];
          if (row && row.col > 0) focusCard(rowIndex, row.col - 1);
          else Lampa.Controller.toggle('menu');
        },
        right: function () {
          var row = rows[rowIndex];
          if (row && row.col < row.cards.length - 1) focusCard(rowIndex, row.col + 1);
        },
        up: function () {
          if (rowIndex > 0) focusCard(rowIndex - 1, rows[rowIndex - 1].col);
          else Lampa.Controller.toggle('head');
        },
        down: function () {
          if (rowIndex < rows.length - 1) focusCard(rowIndex + 1, rows[rowIndex + 1].col);
        },
        back: function () {
          Lampa.Activity.backward();
        }
      });
      Lampa.Controller.toggle('content');
    };

    this.pause = function () {
      $('body').removeClass('nfx--active');
    };

    this.stop = function () {
      $('body').removeClass('nfx--active');
    };

    this.render = function () {
      return html;
    };

    this.destroy = function () {
      destroyed = true;
      clearTimeout(infoTimer);
      $('body').removeClass('nfx--active');
      html.remove();
      rows = [];
    };
  }

  /* ---------- Оформление ---------- */

  var CSS = [
    '.nfx{position:relative;height:100vh;overflow:hidden;background:#141414;color:#fff}',
    '.nfx__bg{position:absolute;top:0;right:0;width:72%;height:70%}',
    '.nfx__bg-img{position:absolute;top:0;left:0;right:0;bottom:0;background-size:cover;background-position:50% 20%;opacity:0;transition:opacity .6s ease}',
    '.nfx__bg-img--show{opacity:1}',
    '.nfx__bg:after{content:"";position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,#141414 0%,rgba(20,20,20,.8) 20%,rgba(20,20,20,0) 55%),linear-gradient(0deg,#141414 0%,rgba(20,20,20,0) 45%)}',
    '.nfx__info{position:absolute;left:3em;top:5.5em;width:42%;z-index:2}',
    '.nfx__badge{min-height:1.3em;margin-bottom:.6em;font-size:1em;font-weight:700;color:#e50914}',
    '.nfx__logo{height:7em;display:flex;align-items:flex-end;margin-bottom:1em}',
    '.nfx__logo img{max-height:7em;max-width:24em;object-fit:contain;object-position:left bottom}',
    '.nfx__title{font-size:3em;font-weight:900;line-height:1.05;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.nfx__meta{margin-bottom:.8em;font-size:1.1em;color:#bcbcbc}',
    '.nfx__meta span{margin-right:1em}',
    '.nfx__meta .nfx__vote{color:#46d369;font-weight:700}',
    '.nfx__overview{font-size:1.1em;line-height:1.45;color:#e5e5e5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.nfx__rows{position:absolute;left:0;right:0;top:56%;bottom:0;overflow:hidden;z-index:2}',
    '.nfx__rows-body{transition:transform .35s ease}',
    '.nfx-row{padding-bottom:1.2em}',
    '.nfx-row__title{margin:0 0 .3em 3em;font-size:1.35em;font-weight:700;color:#e5e5e5}',
    '.nfx-row__track{display:flex;padding:.6em 3em;transition:transform .3s ease}',
    '.nfx-card{position:relative;flex:0 0 auto;width:17em;height:9.56em;margin-right:.7em;border-radius:.35em;background:#2a2a2a;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease}',
    '.nfx-card__img{position:absolute;top:0;left:0;right:0;bottom:0;background-size:cover;background-position:center}',
    '.nfx-card__name{position:absolute;left:0;right:0;bottom:0;padding:1.6em .7em .55em;font-size:1em;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:linear-gradient(0deg,rgba(0,0,0,.85),rgba(0,0,0,0))}',
    '.nfx-card.focus{transform:scale(1.08);box-shadow:0 0 0 .2em #fff,0 .8em 2em rgba(0,0,0,.6);z-index:3}',
    '.nfx-card--top{display:flex;align-items:flex-end;width:auto;height:13.5em;background:none;overflow:visible}',
    '.nfx-card--top .nfx-card__num{position:relative;z-index:0;margin-right:-.12em;font-size:11em;font-weight:900;line-height:.8;letter-spacing:-.08em;color:#141414;-webkit-text-stroke:.03em #8c8c8c}',
    '.nfx-card--top .nfx-card__img{position:relative;z-index:1;flex:0 0 auto;width:9em;height:13.5em;border-radius:.35em;background-color:#2a2a2a}',
    '.nfx-card--top.focus{box-shadow:none}',
    '.nfx-card--top.focus .nfx-card__img{box-shadow:0 0 0 .2em #fff}',
    '.nfx__empty{position:absolute;left:3em;top:40%;max-width:32em;font-size:1.3em;line-height:1.45;color:#bcbcbc}',
    'body.nfx--active .wrap__content{padding-top:0}',
    'body.nfx--active .head{background:linear-gradient(180deg,rgba(0,0,0,.85),rgba(0,0,0,0))}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('nfx-style')) return;
    var style = document.createElement('style');
    style.id = 'nfx-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ---------- Меню, настройки, запуск ---------- */

  function openHome(replace) {
    var obj = { url: '', title: TITLE, component: COMPONENT, page: 1 };
    if (replace && Lampa.Activity.replace) Lampa.Activity.replace(obj);
    else Lampa.Activity.push(obj);
  }

  function addMenu() {
    if ($('.menu [data-action="' + COMPONENT + '"]').length) return;
    var item = $('<li class="menu__item selector" data-action="' + COMPONENT + '"><div class="menu__ico">' + ICON + '</div><div class="menu__text">' + TITLE + '</div></li>');
    item.on('hover:enter', function () {
      openHome(false);
    });
    var list = $('.menu .menu__list').eq(0);
    var first = list.find('.menu__item').eq(0);
    if (first.length) first.after(item);
    else list.append(item);
  }

  function addSettings() {
    if (!Lampa.SettingsApi) return;
    try {
      Lampa.SettingsApi.addComponent({ component: COMPONENT, name: 'Главная Netflix', icon: ICON });
      Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: { name: 'nfx_start', type: 'trigger', default: false },
        field: { name: 'Открывать при запуске', description: 'Lampa будет стартовать с этого экрана вместо обычной главной' }
      });
    } catch (e) {}
  }

  function startEnabled() {
    var v = Lampa.Storage.get('nfx_start', false);
    return v === true || v === 'true';
  }

  function maybeStart() {
    if (!startEnabled()) return;
    setTimeout(function () {
      try {
        var active = Lampa.Activity.active();
        openHome(!!(active && active.component === 'main'));
      } catch (e) {}
    }, 300);
  }

  function init() {
    injectStyle();
    Lampa.Component.add(COMPONENT, Home);
    addMenu();
    addSettings();
    maybeStart();
  }

  if (window.appready) init();
  else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') init();
    });
  }
})();
