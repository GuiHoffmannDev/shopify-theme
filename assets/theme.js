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

  // Reveal on scroll — hidden state only applied when JS runs, so no-JS keeps content visible
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) {
      el.classList.add('reveal-pending');
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

  // Vitrine: setas e dots são âncoras, então a seção navega sem JS. Aqui só evitamos
  // o pulo vertical do #hash e marcamos qual peça está à vista.
  document.querySelectorAll('[data-showcase]').forEach(function (root) {
    var track = root.querySelector('[data-showcase-track]');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll('.showcase__slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-showcase-dot]'));
    var prev = root.querySelector('[data-showcase-prev]');
    var next = root.querySelector('[data-showcase-next]');
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
      var hit = e.target.closest('[data-showcase-dot],[data-showcase-prev],[data-showcase-next]');
      if (!hit) return;
      e.preventDefault();
      if (hit === prev) go(index - 1);
      else if (hit === next) go(index + 1);
      else go(dots.indexOf(hit));
    });

    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
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
})();
