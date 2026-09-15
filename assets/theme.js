/* LIMEN — minimal theme behavior */
(function () {
  'use strict';

  // Mobile nav toggle
  document.addEventListener('click', function (e) {
    var burger = e.target.closest('[data-nav-toggle]');
    if (burger) {
      var nav = document.getElementById('mobile-nav');
      if (nav) {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    }
  });

  // Seletor de país/moeda: envia ao mudar. Sem JS, o <noscript> mostra o botão.
  document.querySelectorAll('.site-header__loc select').forEach(function (select) {
    select.addEventListener('change', function () {
      var form = select.closest('form');
      if (form) form.submit();
    });
  });

  // Busca do header: a lupa abre uma barra sob o cabeçalho e os resultados chegam
  // ali mesmo, sem trocar de página. Sem JS, a lupa segue sendo link para /search.
  var searchPanel = document.querySelector('[data-search-panel]');
  if (searchPanel) {
    var searchToggle = document.querySelector('[data-search-toggle]');
    var searchForm = searchPanel.querySelector('form');
    var searchInput = searchPanel.querySelector('[data-search-input]');
    var searchResults = searchPanel.querySelector('[data-search-results]');
    var searchTimer;
    var searchRequest = 0;

    if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');

    var setSearch = function (open, returnFocus) {
      searchPanel.hidden = !open;
      if (searchToggle) searchToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) searchInput.focus();
      else if (returnFocus && searchToggle) searchToggle.focus();
    };

    var runSearch = function () {
      clearTimeout(searchTimer);
      var q = searchInput.value.trim();
      var id = ++searchRequest;
      if (!q) { searchResults.innerHTML = ''; return; }
      var url = searchPanel.dataset.predictiveUrl + '?q=' + encodeURIComponent(q) +
        '&resources[type]=product&resources[limit]=6&section_id=predictive-search';
      fetch(url)
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.text(); })
        .then(function (html) {
          if (id !== searchRequest) return;
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var section = doc.getElementById('shopify-section-predictive-search');
          searchResults.innerHTML = section ? section.innerHTML : '';
        })
        .catch(function () { if (id === searchRequest) searchResults.innerHTML = ''; });
    };

    if (searchToggle) {
      searchToggle.addEventListener('click', function (e) {
        e.preventDefault();
        setSearch(searchPanel.hidden, false);
      });
    }
    searchPanel.querySelector('[data-search-close]').addEventListener('click', function () {
      setSearch(false, true);
    });
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(runSearch, 250);
    });
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      runSearch();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !searchPanel.hidden) setSearch(false, true);
    });
    document.addEventListener('click', function (e) {
      if (searchPanel.hidden || searchPanel.contains(e.target)) return;
      if (searchToggle && searchToggle.contains(e.target)) return;
      setSearch(false, false);
    });
  }

  // Product: variant swatches -> hidden id input + price + button state
  document.querySelectorAll('[data-product-form]').forEach(function (form) {
    var data = form.querySelector('[data-variants-json]');
    if (!data) return;
    var variants;
    try { variants = JSON.parse(data.textContent); } catch (err) { return; }
    var idInput = form.querySelector('[name="id"]');
    var priceEl = document.querySelector('[data-price]');
    var addBtn = form.querySelector('[data-add]');
    var selected = {};

    function findVariant() {
      return variants.find(function (v) {
        return v.options.every(function (opt, i) {
          return selected[i] == null || selected[i] === opt;
        });
      });
    }

    function refresh() {
      var v = findVariant();
      if (!v) return;
      idInput.value = v.id;
      if (priceEl && v.price != null) priceEl.textContent = v.priceFormatted;
      if (addBtn) {
        addBtn.disabled = !v.available;
        addBtn.textContent = v.available ? (addBtn.dataset.add || 'Adicionar à sacola') : 'Esgotado';
      }
    }

    form.querySelectorAll('[data-swatch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = parseInt(btn.dataset.optIndex, 10);
        selected[group] = btn.dataset.value;
        form.querySelectorAll('[data-opt-index="' + group + '"]').forEach(function (b) {
          b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
        });
        refresh();
      });
    });

    refresh();
  });

  // Header: a linha de base aparece quando a página sai do topo.
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    var headerTicking = false;
    var syncHeader = function () {
      headerTicking = false;
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 4);
    };
    window.addEventListener('scroll', function () {
      if (!headerTicking) { headerTicking = true; requestAnimationFrame(syncHeader); }
    }, { passive: true });
    syncHeader();
  }

  // Reveal on scroll — hidden state only applied when JS runs, so no-JS keeps content visible.
  // O que chega junto na tela entra em cascata. Com data-reveal-stagger, quem entra são os
  // filhos do elemento (ou os itens do seletor dado no atributo) — card a card.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion && revealEls.length) {
    var STAGGER_MS = 90;
    var STAGGER_MAX = 6;
    var staggerItems = function (el) {
      var sel = el.getAttribute('data-reveal-stagger');
      return Array.prototype.slice.call(sel ? el.querySelectorAll(sel) : el.children);
    };
    var reveal = function (el, order) {
      el.style.transitionDelay = Math.min(order, STAGGER_MAX) * STAGGER_MS + 'ms';
      el.classList.add('is-in');
      // Terminada a entrada, o elemento volta às próprias transições (hover etc.).
      el.addEventListener('transitionend', function done(e) {
        if (e.target !== el) return;
        el.removeEventListener('transitionend', done);
        el.classList.remove('reveal-pending', 'is-in');
        el.style.transitionDelay = '';
      });
    };
    var io = new IntersectionObserver(function (entries) {
      var order = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        if (!el.hasAttribute('data-reveal-stagger')) { reveal(el, order++); return; }
        // Itens abaixo da dobra esperam a própria vez; os da linha à vista — inclusive
        // os cortados na lateral de uma prateleira — entram juntos, em cascata.
        staggerItems(el).forEach(function (item) {
          if (item.getBoundingClientRect().top < window.innerHeight) reveal(item, order++);
          else io.observe(item);
        });
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) {
      if (el.hasAttribute('data-reveal-stagger')) {
        staggerItems(el).forEach(function (item) { item.classList.add('reveal-pending'); });
      } else {
        el.classList.add('reveal-pending');
      }
      io.observe(el);
    });
  }

  // Ambient video: only plays while on screen; stays on its poster under reduced motion
  var videos = document.querySelectorAll('[data-ambient-video], .club-media video');
  if (reduceMotion) {
    videos.forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  } else if ('IntersectionObserver' in window && videos.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { vio.observe(v); });
  }

  // Carrossel: um slide por vez, com dots. Setas e dots são âncoras, então a seção
  // navega sem JS. Aqui só evitamos o pulo vertical do #hash e marcamos qual slide
  // está à vista. Usado pela Vitrine e pelo Hero.
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-carousel-track]');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll('[data-carousel-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-carousel-dot]'));
    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    if (slides.length < 2) return;
    var index = 0;

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.scrollTo({
        left: slides[index].offsetLeft - track.offsetLeft,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }

    root.addEventListener('click', function (e) {
      var hit = e.target.closest('[data-carousel-dot],[data-carousel-prev],[data-carousel-next]');
      if (!hit) return;
      e.preventDefault();
      if (hit === prev) go(index - 1);
      else if (hit === next) go(index + 1);
      else go(dots.indexOf(hit));
    });

    if ('IntersectionObserver' in window) {
      // .is-active anima a copy do slide que chega; o 1º já nasce ativo para não piscar.
      slides[0].classList.add('is-active');
      root.classList.add('is-ready');
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          // Ao cruzar o limiar para baixo o slide ainda "intersecta"; só conta quem passou dele.
          var shown = entry.isIntersecting && entry.intersectionRatio >= 0.6;
          entry.target.classList.toggle('is-active', shown);
          if (!shown) return;
          index = slides.indexOf(entry.target);
          dots.forEach(function (dot, i) {
            if (i === index) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
          });
        });
      }, { root: track, threshold: 0.6 });
      slides.forEach(function (slide) { sio.observe(slide); });
    }
  });

  // Prateleira: faixa de rolagem nativa. As setas rolam ~um item; arrastar rola no
  // desktop. No toque, deixamos a rolagem nativa com inércia. Usada pela Galeria e
  // pelas prateleiras de produto.
  document.querySelectorAll('[data-rail]').forEach(function (root) {
    var track = root.querySelector('[data-rail-track]');
    if (!track) return;
    var prev = root.querySelector('[data-rail-prev]');
    var next = root.querySelector('[data-rail-next]');

    function step() {
      var item = track.querySelector('[data-rail-item]');
      var cs = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    }
    function nudge(dir) {
      track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { nudge(-1); });
    if (next) next.addEventListener('click', function () { nudge(1); });

    // Setas só aparecem quando há o que rolar (ex.: uma prateleira com um produto só).
    function syncArrows() {
      var hide = track.scrollWidth <= track.clientWidth + 1;
      if (prev) prev.hidden = hide;
      if (next) next.hidden = hide;
    }
    syncArrows();
    window.addEventListener('resize', syncArrows);
    window.addEventListener('load', syncArrows);

    // Arrastar-para-rolar (só mouse).
    var down = false, startX = 0, startLeft = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft;
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!root.classList.contains('is-dragging') && Math.abs(dx) > 4) {
        root.classList.add('is-dragging');
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (root.classList.contains('is-dragging')) { moved = dx; track.scrollLeft = startLeft - dx; }
    });
    function endDrag(e) {
      if (!down) return;
      down = false;
      if (root.classList.contains('is-dragging')) {
        root.classList.remove('is-dragging');
        try { track.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    // Evita que o arrasto vire clique no link sob o cursor.
    track.addEventListener('click', function (e) {
      if (Math.abs(moved) > 4) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }, true);
  });

  // Acordeão do rodapé: aberto no desktop, fechado no mobile. Em JS porque CSS não
  // controla o atributo `open`. Sem JS tudo fica aberto, que é o lado seguro.
  var footerCols = document.querySelectorAll('.site-footer__col');
  if (footerCols.length && window.matchMedia) {
    var narrowFooter = window.matchMedia('(max-width: 749px)');
    var syncFooterCols = function () {
      footerCols.forEach(function (col) { col.open = !narrowFooter.matches; });
    };
    syncFooterCols();
    if (narrowFooter.addEventListener) narrowFooter.addEventListener('change', syncFooterCols);
    else if (narrowFooter.addListener) narrowFooter.addListener(syncFooterCols);
  }
})();
