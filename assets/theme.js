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
})();
