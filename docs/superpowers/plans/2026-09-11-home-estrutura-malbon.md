# Home no esqueleto da Malbon — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar header, home e rodapé do tema Limen para o esqueleto de vitrine da malbon.com — hero em carrossel, duas prateleiras de produto roláveis, banner duplo full-bleed, grade de três salas e rodapé com newsletter embutida.

**Architecture:** Um arquivo de seção novo (`hero-carousel`), cinco reformas no lugar (`featured-collection`, `category-mosaic`, `product-card`, `header`, `footer`) e zero JS de carrossel escrito do zero — os dois comportamentos necessários já existem em `theme.js` e só deixam de ter nomes amarrados a uma seção. Cada tarefa que mexe na home atualiza `templates/index.json` no fim, então a home fica navegável depois de cada commit.

**Tech Stack:** Shopify Liquid, CSS puro com tokens em `:root`, JavaScript ES5 sem dependências, Shopify CLI (`shopify theme check`, `shopify theme dev`).

**Spec:** `docs/superpowers/specs/2026-09-11-home-estrutura-malbon-design.md`

## Global Constraints

Valores copiados do spec e do sistema de marca. Valem para toda tarefa.

- **Não há suíte de testes automatizados neste tema.** O ciclo de verificação de cada tarefa é `shopify theme check` + verificação visual em `shopify theme dev`. Não inventar arquivos de teste.
- **Números de linha citados referem-se ao commit `ecfafd5`.** Tarefas anteriores deslocam linhas. Sempre localizar o trecho pelo conteúdo citado, nunca só pelo número.
- **Cores:** fundo off-white `--paper-100` (#FAF9F6), texto navy `--navy-700` (#1F2D5C), limão `--lemon-500` (#E5C63F) só como acento. Nunca inverter. Card `--paper-50` (#FFFFFF), tint/placeholder `--stone-200` (#EEEDE7), reserva `--stone-300` (#E3E1DA).
- **Tipografia:** Satoshi em tudo (`--font-display`, `--font-body`, `--font-sans`). Headlines com `--tracking-headline` (-0.02em); labels em caixa alta com `--tracking-label` (0.22em). O script só no logo.
- **Palavras banidas em qualquer copy:** premium, luxo, qualidade, exclusivo, sofisticado, refinado, elegante, inovador. Todo claim vira prova ou fato.
- **CTAs calmos:** `Entrar`, `Ver tudo`, `Ver a bolsa`, `Ver a coleção`. Nunca gritados, nunca nomeando o desejo do cliente.
- **Coleções são salas do clube** (`O Vestiário`, `O Salão`), nunca "categorias".
- **Usar os tokens CSS existentes.** Nenhum hex cru em regra nova, exceto os `rgba(20,31,68,…)` de scrim que o tema já usa.
- **Toda `<img>` leva `width`, `height` e `loading`.** O `theme check` reprova sem isso.
- **Contraste:** texto claro sobre foto sempre sobre scrim graduado. Texto claro cru sobre imagem clara fica em ~2.6:1 e reprova.
- **JS em ES5 dentro do IIFE `'use strict'` existente:** `var`, `function` expressions dentro de blocos (nunca declaração de função dentro de `if`), sem arrow functions.
- **Idioma:** todo texto visível e todo `label`/`info` de schema em português do Brasil.

---

### Task 1: Generalizar os dois comportamentos de carrossel no JS

O JS dos dois carrosséis já existe, preso às seções que o estrearam. `data-showcase` é exatamente o que o hero precisa; `data-gallery` é exatamente o que a prateleira precisa. Renomear evita triplicar lógica nas tarefas seguintes.

**Files:**
- Modify: `assets/theme.js:94-136` (bloco que começa em `// Vitrine: setas e dots são âncoras`)
- Modify: `assets/theme.js:138-187` (bloco que começa em `// Galeria: faixa de rolagem nativa`)
- Modify: `sections/showcase.liquid:11-70`
- Modify: `sections/gallery.liquid:1-39`

**Interfaces:**
- Consumes: nada
- Produces: dois contratos de atributo usados pelas tarefas 3 e 4.
  - **Carrossel** (um slide por vez, com dots): raiz `[data-carousel]`, trilho `[data-carousel-track]`, slide `[data-carousel-slide]`, dot `[data-carousel-dot]`, setas opcionais `[data-carousel-prev]` / `[data-carousel-next]`. Não faz nada com menos de 2 slides.
  - **Prateleira** (rolagem livre): raiz `[data-rail]`, trilho `[data-rail-track]`, item `[data-rail-item]`, setas `[data-rail-prev]` / `[data-rail-next]`. A raiz recebe a classe `is-dragging` durante o arraste com mouse.

- [ ] **Step 1: Substituir o bloco da Vitrine no `theme.js`**

Trocar o bloco inteiro, do comentário `// Vitrine: setas e dots são âncoras, então a seção navega sem JS.` até o `});` que fecha o `forEach` de `[data-showcase]`, por:

```javascript
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
```

(`function go` fica declarada direto no corpo da callback do `forEach`, não dentro de um `if` — é permitido em strict mode, como já estava.)

A única mudança de comportamento: `track.querySelectorAll('.showcase__slide')` virou `[data-carousel-slide]`. O resto é renomeação.

- [ ] **Step 2: Substituir o bloco da Galeria no `theme.js`**

Trocar o bloco inteiro, do comentário `// Galeria: faixa de rolagem nativa.` até o `});` que fecha o `forEach` de `[data-gallery]`, por:

```javascript
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
```

A única mudança de comportamento: `track.querySelector('.gallery__frame')` virou `[data-rail-item]`.

- [ ] **Step 3: Atualizar os atributos em `sections/showcase.liquid`**

| De | Para |
| --- | --- |
| `<div class="showcase" data-showcase data-reveal>` | `<div class="showcase" data-carousel data-reveal>` |
| `<div class="showcase__track" data-showcase-track>` | `<div class="showcase__track" data-carousel-track>` |
| `<article class="showcase__slide" id="slide-{{ sid }}-{{ forloop.index }}" {{ block.shopify_attributes }}>` | `<article class="showcase__slide" id="slide-{{ sid }}-{{ forloop.index }}" data-carousel-slide {{ block.shopify_attributes }}>` |
| `data-showcase-prev` | `data-carousel-prev` |
| `data-showcase-next` | `data-carousel-next` |
| `data-showcase-dots` | `data-carousel-dots` |
| `data-showcase-dot` (no `<a class="showcase__dot" …>`) | `data-carousel-dot` |

As classes CSS (`showcase__slide`, `showcase__dot`, …) **não mudam**.

Conferir: `grep -n "data-showcase" sections/showcase.liquid` deve voltar vazio.

- [ ] **Step 4: Atualizar os atributos em `sections/gallery.liquid`**

| De | Para |
| --- | --- |
| `<section class="gallery" data-screen-label="Galeria" data-gallery>` | `<section class="gallery" data-screen-label="Galeria" data-rail>` |
| `<div class="gallery__track" data-gallery-track>` | `<div class="gallery__track" data-rail-track>` |
| `<article class="gallery__frame" {{ block.shopify_attributes }}>` | `<article class="gallery__frame" data-rail-item {{ block.shopify_attributes }}>` |
| `data-gallery-prev` | `data-rail-prev` |
| `data-gallery-next` | `data-rail-next` |

Conferir: `grep -rn "data-gallery\|data-showcase" sections/ assets/` deve voltar vazio.

- [ ] **Step 5: Rodar o theme check**

```bash
shopify theme check
```

Esperado: nenhum erro novo em relação ao estado anterior à tarefa.

- [ ] **Step 6: Verificar as duas seções ainda funcionando**

```bash
shopify theme dev
```

Na home (ainda a antiga):
- **Galeria** (primeira seção): setas ‹ › rolam a faixa; arrastar com o mouse rola; clicar no botão depois de arrastar **não** navega.
- **Vitrine** (segunda seção): dots navegam entre as peças; o dot ativo fica preenchido; setas funcionam.

Qualquer falha significa um atributo não trocado.

- [ ] **Step 7: Commit**

```bash
git add assets/theme.js sections/showcase.liquid sections/gallery.liquid
git commit -m "$(cat <<'EOF'
Carrossel e prateleira deixam de ter dono

Os dois comportamentos de rolagem já existiam presos à Vitrine e à
Galeria. Renomeados para data-carousel e data-rail, passam a servir
também o hero e as prateleiras de produto.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Card de produto — swatches e fim da moldura

O card ganha a fileira de bolinhas de cor e perde a borda hairline. O snippet é compartilhado com coleção, busca e lista de coleções — a mudança é intencionalmente global.

**Files:**
- Modify: `snippets/product-card.liquid` (ramo do produto real)
- Modify: `assets/theme.css:228` (regra `.pcard__media`) e final do arquivo

**Interfaces:**
- Consumes: nada
- Produces: `{% render 'product-card', product: product %}` renderiza `<div class="pcard__swatches">` quando aplicável. **A assinatura não muda:** `product`, `ph_category`, `ph_name`, `ph_price`, `ph_tag`, `ph_label`, `ph_url` — a Tarefa 4 depende disso.

- [ ] **Step 1: Adicionar os swatches ao snippet**

Em `snippets/product-card.liquid`, logo depois de `<div class="pcard__price">{{ product.price | money_without_trailing_zeros }}</div>` e antes do `</a>` que fecha o card **do produto real** (o primeiro ramo do `if`, não o de placeholder), inserir:

```liquid
    {%- comment -%}
      Swatches em cascata: hex do swatch → imagem do swatch → nada.
      O Shopify só entrega `swatch` quando a opção está tipada como Color no admin;
      em opção não tipada, `value.swatch` fica vazio e a fileira não sai — sem
      buraco no layout. Nunca um mapa de nomes-para-hex, que apodrece a cada cor
      nova do catálogo.
    {%- endcomment -%}
    {%- assign swatch_option = blank -%}
    {%- for option in product.options_with_values -%}
      {%- if swatch_option == blank and option.values.first.swatch != blank -%}
        {%- assign swatch_option = option -%}
      {%- endif -%}
    {%- endfor -%}
    {%- if swatch_option != blank -%}
      <div class="pcard__swatches">
        {%- for value in swatch_option.values limit: 6 -%}
          {%- if value.swatch.color != blank -%}
            <span class="pcard__swatch" style="background:{{ value.swatch.color }};" title="{{ value | escape }}"></span>
          {%- elsif value.swatch.image != blank -%}
            <span class="pcard__swatch" style="background-image:url({{ value.swatch.image | image_url: width: 48 }});" title="{{ value | escape }}"></span>
          {%- endif -%}
        {%- endfor -%}
        {%- if swatch_option.values.size > 6 -%}
          <span class="pcard__swatch-more">+{{ swatch_option.values.size | minus: 6 }}</span>
        {%- endif -%}
      </div>
    {%- endif -%}
```

- [ ] **Step 2: Tirar a borda e estilizar os swatches**

Em `assets/theme.css`, trocar a regra (mesma linha, sem acrescentar linha — as tarefas seguintes contam com isso):

```css
.pcard__media{position:relative;aspect-ratio:4/5;border:1px solid var(--border-hairline);overflow:hidden;background:var(--stone-200);}
```

por:

```css
.pcard__media{position:relative;aspect-ratio:4/5;overflow:hidden;background:var(--stone-200);}
```

E acrescentar ao final do arquivo:

```css
/* ---------- Swatches do card ---------- */
/* Sem moldura no media: a vitrine encosta a foto no fundo neutro. */
.pcard__swatches{display:flex;align-items:center;gap:6px;margin-top:10px;}
.pcard__swatch{
  width:14px;height:14px;border-radius:999px;display:block;
  border:1px solid var(--border-hairline);
  background-size:cover;background-position:center;
}
.pcard__swatch-more{
  font-family:var(--font-sans);font-size:10px;letter-spacing:0.08em;
  color:var(--text-muted);margin-left:2px;
}
```

- [ ] **Step 3: Rodar o theme check**

```bash
shopify theme check
```

Esperado: nenhum erro novo.

- [ ] **Step 4: Verificar nas páginas que usam o card**

Com `shopify theme dev`:
- `/collections/charter-ss2026-01` — THE CLUBHOUSE aparece **sem borda** em volta da foto.
- `/search?q=clubhouse` — mesmo card, sem borda.
- `/collections` — os três placeholders de sala continuam intactos, sem swatch e sem erro.

THE CLUBHOUSE tem variante única `SADDLE` e a opção provavelmente **não** está tipada como Color. **Nenhuma bolinha é o resultado esperado** — é a terceira perna da cascata. Para ver o caminho positivo: no admin, tipar a opção como Color, recarregar, e a bolinha deve surgir. Se não houver acesso ao admin, registrar no relatório da tarefa que o caminho positivo não foi exercitado.

- [ ] **Step 5: Commit**

```bash
git add snippets/product-card.liquid assets/theme.css
git commit -m "$(cat <<'EOF'
Card de produto ganha swatches e perde a moldura

Bolinhas lidas do swatch da opção, com a imagem do swatch como segunda
opção e nada como terceira — sem mapa de nome para hex. A borda hairline
sai: a vitrine encosta a foto no fundo neutro.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Hero em carrossel

Seção nova. Não reforma `hero.liquid` porque este não tem blocos e já carrega dois layouts exclusivos — um terceiro modo viraria sopa de condicionais. `hero.liquid` segue disponível para páginas internas.

**Files:**
- Create: `sections/hero-carousel.liquid`
- Modify: `assets/theme.css` (final do arquivo)
- Modify: `templates/index.json`

**Interfaces:**
- Consumes: contrato **Carrossel** da Tarefa 1
- Produces: seção `hero-carousel` com blocos `slide` (settings `image`, `asset`, `placeholder_label`, `heading`, `text`, `button_label`, `button_link`)

- [ ] **Step 1: Criar a seção**

Criar `sections/hero-carousel.liquid`:

```liquid
{%- comment -%}
  Hero em carrossel: um slide por vez, copy ancorada embaixo-à-esquerda sobre um
  degradê navy. Regra #1 vale em todo slide — a bolsa fora da quadra.
{%- endcomment -%}
{%- assign sid = section.id -%}
<section class="hero-carousel" data-carousel data-screen-label="Hero">
  <div class="hero-carousel__track" data-carousel-track>
    {%- for block in section.blocks -%}
      {%- comment -%} O 1º slide é o LCP da página: eager e com prioridade. {%- endcomment -%}
      {%- if forloop.first -%}
        {%- assign slide_loading = 'eager' -%}
      {%- else -%}
        {%- assign slide_loading = 'lazy' -%}
      {%- endif -%}
      <article class="hero-carousel__slide" id="hero-{{ sid }}-{{ forloop.index }}" data-carousel-slide {{ block.shopify_attributes }}>
        {%- if block.settings.image != blank -%}
          <img class="hero-carousel__img" src="{{ block.settings.image | image_url: width: 2400 }}" alt="{{ block.settings.image.alt | escape }}" width="{{ block.settings.image.width }}" height="{{ block.settings.image.height }}" loading="{{ slide_loading }}"{% if forloop.first %} fetchpriority="high"{% endif %}>
        {%- elsif block.settings.asset != blank -%}
          <img class="hero-carousel__img" src="{{ block.settings.asset | asset_url }}" alt="" width="928" height="1152" loading="{{ slide_loading }}"{% if forloop.first %} fetchpriority="high"{% endif %}>
        {%- else -%}
          <div class="ph"><span>{{ block.settings.placeholder_label }}</span></div>
        {%- endif -%}

        <span class="hero-carousel__scrim" aria-hidden="true"></span>

        <div class="hero-carousel__copy">
          {%- if forloop.first -%}
            <h1 class="hero-carousel__title">{{ block.settings.heading }}</h1>
          {%- else -%}
            <h2 class="hero-carousel__title">{{ block.settings.heading }}</h2>
          {%- endif -%}
          {%- if block.settings.text != blank -%}
            <p class="hero-carousel__lead">{{ block.settings.text }}</p>
          {%- endif -%}
          {%- if block.settings.button_label != blank -%}
            <div class="mt-5"><a href="{{ block.settings.button_link | default: routes.all_products_collection_url }}" class="btn btn--inverse">{{ block.settings.button_label }}</a></div>
          {%- endif -%}
        </div>
      </article>
    {%- endfor -%}
  </div>

  {%- if section.blocks.size > 1 -%}
    <div class="hero-carousel__dots" data-carousel-dots>
      {%- for block in section.blocks -%}
        <a class="hero-carousel__dot" href="#hero-{{ sid }}-{{ forloop.index }}" data-carousel-dot{% if forloop.first %} aria-current="true"{% endif %}>
          <span class="visually-hidden">{{ 'general.a11y.go_to_slide' | t: index: forloop.index }}</span>
        </a>
      {%- endfor -%}
    </div>
  {%- endif -%}
</section>

{% schema %}
{
  "name": "Hero carrossel",
  "settings": [
    { "type": "paragraph", "content": "Um slide por vez, full-bleed, com dots. A foto de cada slide segue a Regra #1: a bolsa fora da quadra — mesa de café, banca de frutas, banco do clube. Nunca a quadra." }
  ],
  "blocks": [
    {
      "type": "slide",
      "name": "Slide",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Foto" },
        { "type": "text", "id": "asset", "label": "Arquivo embutido (assets)", "info": "Usado quando não há foto escolhida acima.", "default": "photo-lemons-towel.png" },
        { "type": "text", "id": "placeholder_label", "label": "Legenda do placeholder", "default": "foto · a bolsa fora da quadra" },
        { "type": "text", "id": "heading", "label": "Título", "info": "Curto, em caixa alta.", "default": "CHARTER SS2026 01" },
        { "type": "textarea", "id": "text", "label": "Linha de apoio", "default": "Cinco bolsas. A raquete de um lado, o resto do seu dia do outro." },
        { "type": "text", "id": "button_label", "label": "Botão", "default": "Ver a coleção" },
        { "type": "url", "id": "button_link", "label": "Link do botão" }
      ]
    }
  ],
  "max_blocks": 5,
  "presets": [{
    "name": "Hero carrossel",
    "blocks": [
      { "type": "slide", "settings": { "asset": "photo-lemons-towel.png", "heading": "CHARTER SS2026 01", "text": "Cinco bolsas. A raquete de um lado, o resto do seu dia do outro.", "button_label": "Ver a coleção" } },
      { "type": "slide", "settings": { "asset": "photo-editorial-wall.jpg", "heading": "THE CLUBHOUSE", "text": "Compartimento forrado para a raquete, separado de chaves e celular.", "button_label": "Ver a bolsa" } },
      { "type": "slide", "settings": { "asset": "photo-interlude-chair.jpg", "heading": "O CLUBE", "text": "Sem lista de espera, sem indicação, sem mensalidade.", "button_label": "Conhecer o clube" } }
    ]
  }]
}
{% endschema %}
```

- [ ] **Step 2: Acrescentar o CSS**

Ao final de `assets/theme.css`:

```css
/* ---------- Hero carrossel ---------- */
.hero-carousel{position:relative;}
.hero-carousel__track{
  display:flex;overflow-x:auto;scroll-snap-type:x mandatory;
  scrollbar-width:none;-ms-overflow-style:none;
}
.hero-carousel__track::-webkit-scrollbar{display:none;}
.hero-carousel__slide{
  position:relative;flex:0 0 100%;scroll-snap-align:start;
  height:min(100svh,860px);overflow:hidden;background:var(--stone-200);
}
.hero-carousel__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.hero-carousel__slide .ph{position:absolute;inset:0;height:100%;border:0;}
/* Degradê só na base: a copy vive embaixo, e escurecer a foto inteira mataria a
   cena. Sem ele o texto creme reprova sobre as fotos claras. */
.hero-carousel__scrim{
  position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(20,31,68,0) 38%,rgba(20,31,68,0.58) 100%);
}
.hero-carousel__copy{
  position:absolute;left:var(--page-pad);right:var(--page-pad);bottom:96px;
  max-width:46ch;color:var(--paper-100);
}
.hero-carousel__title{
  font-family:var(--font-display);font-weight:var(--weight-display);
  font-size:clamp(38px,5.4vw,68px);line-height:1.02;
  letter-spacing:var(--tracking-headline);text-transform:uppercase;
}
.hero-carousel__lead{font-family:var(--font-body);font-size:17px;line-height:1.55;margin-top:14px;max-width:46ch;}
.hero-carousel__dots{
  position:absolute;left:0;right:0;bottom:32px;
  display:flex;justify-content:center;gap:12px;
}
.hero-carousel__dot{
  width:7px;height:7px;border-radius:999px;display:block;
  border:1px solid var(--paper-100);background:transparent;
}
.hero-carousel__dot[aria-current="true"]{background:var(--paper-100);}

@media (max-width:749px){
  .hero-carousel__slide{height:min(84svh,680px);}
  .hero-carousel__copy{bottom:72px;}
  .hero-carousel__lead{font-size:15px;}
}
```

- [ ] **Step 3: Trocar a galeria pelo hero no `index.json`**

Em `templates/index.json`, remover a chave `"gallery"` inteira de `"sections"` e colocar no lugar:

```json
    "hero": {
      "type": "hero-carousel",
      "blocks": {
        "s1": {
          "type": "slide",
          "settings": {
            "asset": "photo-lemons-towel.png",
            "heading": "CHARTER SS2026 01",
            "text": "Cinco bolsas. A raquete de um lado, o resto do seu dia do outro.",
            "button_label": "Ver a coleção",
            "button_link": "/collections/charter-ss2026-01"
          }
        },
        "s2": {
          "type": "slide",
          "settings": {
            "asset": "photo-editorial-wall.jpg",
            "heading": "THE CLUBHOUSE",
            "text": "Compartimento forrado para a raquete, separado de chaves e celular.",
            "button_label": "Ver a bolsa",
            "button_link": "/products/bolsa-guihard"
          }
        },
        "s3": {
          "type": "slide",
          "settings": {
            "asset": "photo-interlude-chair.jpg",
            "heading": "O CLUBE",
            "text": "Sem lista de espera, sem indicação, sem mensalidade.",
            "button_label": "Conhecer o clube",
            "button_link": ""
          }
        }
      },
      "block_order": ["s1", "s2", "s3"]
    },
```

Em `"order"`:

```json
  "order": ["hero", "showcase", "club", "positioning", "featured", "mosaic", "invite"]
```

`/products/bolsa-guihard` é o handle real de THE CLUBHOUSE na loja. O slide 3 fica com link vazio de propósito — a página do clube pode não existir; o `default` do Liquid manda para a lista de produtos em vez de um link morto.

- [ ] **Step 4: Rodar o theme check**

```bash
shopify theme check
```

Esperado: nenhum erro. JSON inválido em `index.json` = vírgula sobrando ou faltando.

- [ ] **Step 5: Verificar o hero**

Abrir `/`:
- Hero ocupa a altura da janela e é a primeira coisa da página; a galeria sumiu.
- Três dots; cada um desliza para seu slide; o ativo fica preenchido.
- No inspetor: título do slide 1 é `<h1>`, os outros `<h2>`; a primeira `<img>` tem `fetchpriority="high"`.
- Texto creme legível sobre as três fotos.
- Com JS desabilitado: o slide 1 aparece inteiro e os dots viram âncoras que ainda mudam o slide.

- [ ] **Step 6: Commit**

```bash
git add sections/hero-carousel.liquid assets/theme.css templates/index.json
git commit -m "$(cat <<'EOF'
Home abre em hero de carrossel

Três slides full-bleed com dots, copy ancorada embaixo à esquerda sobre
degradê navy. Reusa o comportamento data-carousel. A galeria sai do topo.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Coleção em destaque vira prateleira

A grade centralizada com sobrelinha e título em frase vira o par `TÍTULO [Ver tudo]` à esquerda, com cards em trilho rolável. A home passa a ter duas.

**Files:**
- Modify: `sections/featured-collection.liquid` (arquivo inteiro)
- Modify: `assets/theme.css` (regras `.gallery__arrow`, originalmente linhas 537-543, e final do arquivo)
- Modify: `templates/index.json`

**Interfaces:**
- Consumes: contrato **Prateleira** da Tarefa 1; snippet `product-card` da Tarefa 2 (assinatura inalterada)
- Produces: seção `featured-collection` com settings `heading`, `collection`, `limit`, `button_label`. **`drop_label`, `eyebrow` e `note` deixam de existir.** Produz também as classes `.rail__head` e `.rail__title`, reusadas pela Tarefa 5.

- [ ] **Step 1: Reescrever a seção**

Substituir todo o conteúdo de `sections/featured-collection.liquid` por:

```liquid
{%- comment -%}
  Prateleira: cabeçalho curto à esquerda com a pílula de destino ao lado, cards em
  trilho rolável full-bleed. Coleção vazia cai em tiles de demonstração — é o que
  sustenta a home enquanto o drop não está cadastrado.
{%- endcomment -%}
{%- assign coll = collections[section.settings.collection] -%}
{%- if coll != blank -%}
  {%- assign coll_url = coll.url -%}
{%- else -%}
  {%- assign coll_url = routes.all_products_collection_url -%}
{%- endif -%}

<section class="rail-section" data-screen-label="Prateleira">
  <div class="rail__head" data-reveal>
    <h2 class="rail__title">{{ section.settings.heading }}</h2>
    {%- if section.settings.button_label != blank -%}
      <a href="{{ coll_url }}" class="btn btn--outline btn--sm">{{ section.settings.button_label }}</a>
    {%- endif -%}
  </div>

  <div class="rail" data-rail data-reveal>
    <div class="rail__track" data-rail-track>
      {%- if coll != blank and coll.products_count > 0 -%}
        {%- for product in coll.products limit: section.settings.limit -%}
          <div class="rail__item" data-rail-item>
            {% render 'product-card', product: product %}
          </div>
        {%- endfor -%}
      {%- else -%}
        {%- comment -%} Espera do catálogo — mesmos tiles de demonstração da página de coleção. {%- endcomment -%}
        <div class="rail__item" data-rail-item>
          {% render 'product-card', ph_category: 'Bolsas', ph_name: 'A Diária', ph_price: 'R$ 590', ph_tag: 'Novo', ph_label: 'bolsa · foto de produto', ph_url: coll_url %}
        </div>
        <div class="rail__item" data-rail-item>
          {% render 'product-card', ph_category: 'Bolsas', ph_name: 'A de Duas Raquetes', ph_price: 'R$ 720', ph_label: 'bolsa · foto de produto', ph_url: coll_url %}
        </div>
        <div class="rail__item" data-rail-item>
          {% render 'product-card', ph_category: 'Bolsas', ph_name: 'A de Fim de Tarde', ph_price: 'R$ 540', ph_label: 'bolsa · foto de produto', ph_url: coll_url %}
        </div>
        <div class="rail__item" data-rail-item>
          {% render 'product-card', ph_category: 'Bolsas', ph_name: 'A Compacta', ph_price: 'R$ 450', ph_label: 'bolsa · foto de produto', ph_url: coll_url %}
        </div>
      {%- endif -%}
    </div>

    <button type="button" class="rail__arrow rail__arrow--prev" data-rail-prev aria-label="{{ 'general.a11y.previous' | t }}">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="1.25"/></svg>
    </button>
    <button type="button" class="rail__arrow rail__arrow--next" data-rail-next aria-label="{{ 'general.a11y.next' | t }}">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="1.25"/></svg>
    </button>
  </div>
</section>

{% schema %}
{
  "name": "Prateleira de produtos",
  "settings": [
    { "type": "paragraph", "content": "Cabeçalho curto em caixa alta à esquerda, com a pílula de destino ao lado. Coleções levam nome de sala do clube, não de categoria." },
    { "type": "text", "id": "heading", "label": "Título", "info": "Uma ou duas palavras, em caixa alta.", "default": "O DROP" },
    { "type": "collection", "id": "collection", "label": "Coleção" },
    { "type": "range", "id": "limit", "min": 2, "max": 12, "step": 1, "label": "Quantos produtos", "default": 8 },
    { "type": "text", "id": "button_label", "label": "Botão", "default": "Ver tudo" }
  ],
  "presets": [{ "name": "Prateleira de produtos" }]
}
{% endschema %}
```

- [ ] **Step 2: Fazer as setas da galeria servirem à prateleira**

Em `assets/theme.css`, localizar as três regras das setas da galeria e acrescentar o seletor da prateleira a cada uma:

| De | Para |
| --- | --- |
| `.gallery__arrow{` | `.gallery__arrow,.rail__arrow{` |
| `.gallery__arrow:hover{` | `.gallery__arrow:hover,.rail__arrow:hover{` |
| `.gallery__arrow svg{` | `.gallery__arrow svg,.rail__arrow svg{` |

Só os seletores mudam; as declarações ficam iguais. `.gallery__arrow--prev` / `--next` **não** mudam.

Conferir se existe regra de mobile escondendo `.gallery__arrow`: `grep -n "gallery__arrow" assets/theme.css`. Se houver dentro de `@media`, acrescentar `.rail__arrow` ao seletor dela também.

- [ ] **Step 3: Acrescentar o CSS da prateleira**

Ao final de `assets/theme.css`:

```css
/* ---------- Prateleira de produtos ---------- */
.rail-section{padding:var(--space-8) 0;}
/* Cabeçalho à esquerda com a pílula colada: o par título+destino da Malbon. */
.rail__head{
  display:flex;align-items:center;gap:var(--space-4);
  padding:0 var(--page-pad);margin-bottom:var(--space-5);
}
.rail__title{
  font-family:var(--font-sans);font-size:13px;font-weight:var(--weight-label);
  letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-primary);
}
.rail{position:relative;}
/* O padding lateral alinha o 1º card à calha da página; o último fica cortado na
   borda, convidando a rolar. */
.rail__track{
  display:flex;gap:20px;padding:0 var(--page-pad);
  overflow-x:auto;scroll-snap-type:x proximity;scroll-padding-left:var(--page-pad);
  scrollbar-width:none;-ms-overflow-style:none;
}
.rail__track::-webkit-scrollbar{display:none;}
.rail.is-dragging{cursor:grabbing;}
.rail.is-dragging .rail__track{scroll-snap-type:none;scroll-behavior:auto;}
.rail__item{flex:0 0 clamp(240px,22vw,340px);scroll-snap-align:start;}
.rail__arrow--prev{left:16px;}
.rail__arrow--next{right:16px;}

@media (max-width:749px){
  .rail__item{flex:0 0 66vw;}
  .rail__arrow{display:none;}
}
```

- [ ] **Step 4: Pôr as duas prateleiras no `index.json`**

Em `templates/index.json`, remover a chave `"featured"` inteira e colocar no lugar:

```json
    "rail_drop": {
      "type": "featured-collection",
      "settings": {
        "heading": "O DROP",
        "collection": "charter-ss2026-01",
        "limit": 8,
        "button_label": "Ver tudo"
      }
    },
    "rail_salao": {
      "type": "featured-collection",
      "settings": {
        "heading": "O SALÃO",
        "collection": "acessorios",
        "limit": 8,
        "button_label": "Ver tudo"
      }
    },
```

Em `"order"`:

```json
  "order": ["hero", "rail_drop", "mosaic", "rail_salao", "showcase", "club", "positioning", "invite"]
```

- [ ] **Step 5: Rodar o theme check**

```bash
shopify theme check
```

Esperado: nenhum erro.

- [ ] **Step 6: Verificar as prateleiras**

Abrir `/`:
- `O DROP` e `O SALÃO`, cada uma com a pílula `Ver tudo` colada ao título, alinhadas à **esquerda**.
- `O DROP` mostra THE CLUBHOUSE sozinho — a coleção tem produto, então **sem** placeholders.
- `O SALÃO` mostra os 4 tiles de demonstração — `acessorios` está vazia. Correto.
- Setas rolam ~um card; arraste com mouse rola; em 375px as setas somem e o toque rola.
- `Ver tudo` de `O SALÃO` leva a `/collections/acessorios`.

- [ ] **Step 7: Commit**

```bash
git add sections/featured-collection.liquid assets/theme.css templates/index.json
git commit -m "$(cat <<'EOF'
Coleção em destaque vira prateleira rolável

Grade centralizada com título em frase dá lugar ao par TÍTULO [Ver tudo]
à esquerda, com cards em trilho full-bleed. A home passa a ter duas: O
DROP e O SALÃO. O fallback de placeholder sobrevive.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Salas ganham a dupla full-bleed e a grade de três

O mosaico em L-invertido dá lugar a dois formatos: `duo` (dois quadros full-bleed de altura cheia) e `grid3` (três cards). A home usa a seção duas vezes. As classes `.mosaic*` são exclusivas desta seção (verificado por `grep`), então redefini-las é seguro.

**Files:**
- Modify: `sections/category-mosaic.liquid` (arquivo inteiro)
- Modify: `assets/theme.css` (bloco que começa em `/* ---------- Mosaico de salas ---------- */`)
- Modify: `templates/index.json`

**Interfaces:**
- Consumes: classes `.rail__head` e `.rail__title` da Tarefa 4
- Produces: seção `category-mosaic` com setting nova `layout` (`duo` | `grid3`) e, por bloco `tile`, setting nova `button_label`

- [ ] **Step 1: Reescrever a seção**

Substituir todo o conteúdo de `sections/category-mosaic.liquid` por:

```liquid
{%- comment -%}
  Salas do clube em dois formatos: `duo` são dois quadros full-bleed de altura
  cheia; `grid3` são três cards com título. Blocos livres (imagem + label + link)
  em vez de objeto coleção: o clube tem salas, não categorias, e o número delas
  muda a cada drop.
{%- endcomment -%}
{%- assign layout = section.settings.layout | default: 'duo' -%}

<section class="mosaic-section mosaic-section--{{ layout }}" data-screen-label="Salas">
  {%- if layout == 'grid3' and section.settings.heading != blank -%}
    <div class="rail__head" data-reveal>
      <h2 class="rail__title">{{ section.settings.heading }}</h2>
    </div>
  {%- endif -%}

  <div class="mosaic mosaic--{{ layout }}" data-reveal>
    {%- for block in section.blocks -%}
      <a href="{{ block.settings.link | default: routes.all_products_collection_url }}" class="mosaic__tile" {{ block.shopify_attributes }}>
        {%- if block.settings.image != blank -%}
          <img src="{{ block.settings.image | image_url: width: 1600 }}" alt="" width="{{ block.settings.image.width }}" height="{{ block.settings.image.height }}" loading="lazy">
        {%- elsif block.settings.asset != blank -%}
          <img src="{{ block.settings.asset | asset_url }}" alt="" width="928" height="1152" loading="lazy">
        {%- else -%}
          <div class="ph"><span>{{ block.settings.placeholder_label }}</span></div>
        {%- endif -%}
        <span class="mosaic__scrim" aria-hidden="true"></span>
        <span class="mosaic__body">
          <span class="mosaic__label">{{ block.settings.label }}</span>
          {%- if block.settings.button_label != blank -%}
            <span class="mosaic__btn">{{ block.settings.button_label }}</span>
          {%- endif -%}
        </span>
      </a>
    {%- endfor -%}
  </div>
</section>

{% schema %}
{
  "name": "Salas",
  "settings": [
    { "type": "paragraph", "content": "Duas medidas: \"Dupla\" são dois quadros full-bleed de altura cheia; \"Três quadros\" é a grade de cards com título em cima. Salas do clube — nunca \"categorias\"." },
    {
      "type": "select",
      "id": "layout",
      "label": "Formato",
      "options": [
        { "value": "duo", "label": "Dupla (dois quadros full-bleed)" },
        { "value": "grid3", "label": "Três quadros (grade com título)" }
      ],
      "default": "duo"
    },
    { "type": "text", "id": "heading", "label": "Título", "info": "Só aparece no formato de três quadros.", "default": "AS SALAS" }
  ],
  "blocks": [
    {
      "type": "tile",
      "name": "Sala",
      "settings": [
        { "type": "text", "id": "label", "label": "Nome da sala", "default": "O VESTIÁRIO" },
        { "type": "url", "id": "link", "label": "Link" },
        { "type": "text", "id": "button_label", "label": "Botão", "default": "Entrar" },
        { "type": "image_picker", "id": "image", "label": "Imagem" },
        { "type": "text", "id": "asset", "label": "Arquivo embutido (assets)", "info": "Usado quando não há imagem escolhida acima.", "default": "photo-club-elevator.jpg" },
        { "type": "text", "id": "placeholder_label", "label": "Legenda do placeholder", "default": "foto · a sala" }
      ]
    }
  ],
  "max_blocks": 3,
  "presets": [{
    "name": "Salas",
    "blocks": [
      { "type": "tile", "settings": { "label": "O VESTIÁRIO", "asset": "photo-club-elevator.jpg", "placeholder_label": "foto · as bolsas" } },
      { "type": "tile", "settings": { "label": "O SALÃO", "asset": "photo-interlude-gravel.jpg", "placeholder_label": "foto · os acessórios" } }
    ]
  }]
}
{% endschema %}
```

O `alt=""` na imagem é intencional: o nome da sala já é o texto do link; repetir no `alt` faria o leitor de tela ler duas vezes.

- [ ] **Step 2: Substituir o CSS do mosaico**

Em `assets/theme.css`, trocar o bloco que começa em `/* ---------- Mosaico de salas ---------- */` e termina na regra `.mosaic__tile:hover .mosaic__label{…}` (inclusive; originalmente linhas 432-457) por:

```css
/* ---------- Salas ---------- */
/* Dupla: dois quadros de altura cheia, encostados, sem calha — o par full-bleed da
   Malbon. Colunas iguais: com dois quadros não há o que hierarquizar. */
.mosaic--duo{display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:min(88svh,900px);}
/* Três quadros: grade com calha, dentro da margem da página. */
.mosaic-section--grid3{padding:var(--space-8) 0;}
.mosaic--grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0 var(--page-pad);}
.mosaic--grid3 .mosaic__tile{aspect-ratio:4/5;}
.mosaic__tile{position:relative;overflow:hidden;display:block;background:var(--stone-200);}
.mosaic__tile img{width:100%;height:100%;object-fit:cover;transition:transform var(--duration-slow) var(--ease-standard);}
.mosaic__tile:hover img{transform:scale(1.03);}
.mosaic__tile .ph{height:100%;border:0;}
/* Texto creme direto sobre a foto, como na Malbon — quem o sustenta é este degradê.
   Sem ele o contraste cai para ~2.6:1 nas fotos claras. */
.mosaic__scrim{
  position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(20,31,68,0.28) 0%,rgba(20,31,68,0.16) 45%,rgba(20,31,68,0.46) 100%);
}
.mosaic__body{
  position:absolute;inset:0;padding:0 var(--space-5);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
}
.mosaic__label{
  color:var(--paper-100);text-align:center;
  font-family:var(--font-display);font-weight:var(--weight-display);
  font-size:clamp(26px,3.4vw,46px);line-height:1.05;
  letter-spacing:var(--tracking-headline);text-transform:uppercase;
}
/* Chapa creme, como o "Shop" da Malbon. Não é <button>: o tile inteiro já é o link,
   isto é só a affordance. */
.mosaic__btn{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--paper-100);color:var(--navy-700);
  padding:11px 26px;border:1px solid var(--paper-100);
  font-family:var(--font-sans);font-size:11px;font-weight:var(--weight-label);
  letter-spacing:var(--tracking-label);text-transform:uppercase;
  transition:background var(--duration-fast) var(--ease-standard),color var(--duration-fast) var(--ease-standard);
}
.mosaic__tile:hover .mosaic__btn{background:transparent;color:var(--paper-100);}

@media (max-width:749px){
  .mosaic--duo{grid-template-columns:1fr;min-height:0;}
  .mosaic--duo .mosaic__tile{aspect-ratio:4/5;}
  .mosaic--grid3{grid-template-columns:1fr;}
}
```

Somem junto: `.mosaic` (base em L), `.mosaic__tile--lead`, `.mosaic--pair` e o chip antigo de `.mosaic__label`. A regra `@media (prefers-reduced-motion: reduce){ .mosaic__tile img{transition:none;} }` mais abaixo **fica**. A regra `.product-grid--4` também fica — é inofensiva.

Conferir: `grep -n "mosaic--pair\|mosaic__tile--lead" assets/theme.css sections/` deve voltar vazio.

- [ ] **Step 3: Montar o miolo final no `index.json`**

Em `templates/index.json`, remover a chave `"mosaic"` inteira e colocar no lugar:

```json
    "mosaic": {
      "type": "category-mosaic",
      "blocks": {
        "m1": {
          "type": "tile",
          "settings": {
            "label": "O VESTIÁRIO",
            "link": "/collections/charter-ss2026-01",
            "button_label": "Entrar",
            "asset": "photo-club-elevator.jpg",
            "placeholder_label": "foto · as bolsas"
          }
        },
        "m2": {
          "type": "tile",
          "settings": {
            "label": "O SALÃO",
            "link": "/collections/acessorios",
            "button_label": "Entrar",
            "asset": "photo-interlude-gravel.jpg",
            "placeholder_label": "foto · os acessórios"
          }
        }
      },
      "block_order": ["m1", "m2"],
      "settings": { "layout": "duo" }
    },
    "salas": {
      "type": "category-mosaic",
      "blocks": {
        "t1": {
          "type": "tile",
          "settings": {
            "label": "A COLEÇÃO",
            "link": "/collections/charter-ss2026-01",
            "button_label": "Ver a coleção",
            "asset": "photo-editorial-wall.jpg",
            "placeholder_label": "foto · a coleção"
          }
        },
        "t2": {
          "type": "tile",
          "settings": {
            "label": "COMO É FEITA",
            "link": "",
            "button_label": "Ver de perto",
            "asset": "photo-positioning-navy.jpg",
            "placeholder_label": "foto · a bolsa de lado"
          }
        },
        "t3": {
          "type": "tile",
          "settings": {
            "label": "O CLUBE",
            "link": "",
            "button_label": "Conhecer",
            "asset": "photo-club-bench.jpg",
            "placeholder_label": "foto · o clube"
          }
        }
      },
      "block_order": ["t1", "t2", "t3"],
      "settings": { "layout": "grid3", "heading": "AS SALAS" }
    },
```

Remover de `"sections"` as chaves `"showcase"`, `"club"`, `"positioning"` e `"invite"`. Os arquivos `.liquid` ficam no tema.

Em `"order"`, a ordem final da home:

```json
  "order": ["hero", "rail_drop", "mosaic", "rail_salao", "salas"]
```

`COMO É FEITA` e `O CLUBE` ficam com `link` vazio de propósito — as páginas podem não existir; o `default` do Liquid evita link morto. A âncora `id="clube"` de `club-editorial.liquid`, que era o destino antigo de "O Clube", deixa de existir na home.

Conferir: `grep -c '"type"' templates/index.json` não serve de prova; em vez disso abrir o arquivo e confirmar que `"sections"` tem exatamente as chaves `hero`, `rail_drop`, `mosaic`, `rail_salao`, `salas`.

- [ ] **Step 4: Rodar o theme check**

```bash
shopify theme check
```

Esperado: nenhum erro.

- [ ] **Step 5: Verificar a home inteira**

Abrir `/` e confirmar a ordem **hero → O DROP → dupla → O SALÃO → AS SALAS**, seguida do rodapé antigo (a newsletter do meio da home sumiu; volta dentro do rodapé na Tarefa 7).

- A dupla ocupa a largura toda, sem calha, dois quadros encostados.
- Cada quadro tem o nome da sala em creme grande e a chapa `Entrar`.
- `AS SALAS` tem três cards 4/5 com o título em caixa alta acima, à esquerda, alinhado com os títulos das prateleiras.
- Hover: leve zoom na foto e a chapa inverte.
- Em 375px: dupla e grade empilham um quadro por linha.
- Texto creme legível em todas as fotos.

- [ ] **Step 6: Commit**

```bash
git add sections/category-mosaic.liquid assets/theme.css templates/index.json
git commit -m "$(cat <<'EOF'
Salas ganham a dupla full-bleed e a grade de três

O mosaico em L dá lugar aos dois formatos da Malbon, e a home fecha o
miolo: hero, prateleira, dupla, prateleira, grade. Vitrine, clube,
posicionamento e convite saem da home; os arquivos ficam no tema.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Header ganha busca e moeda

O header já tem nav-esquerda / logo-centro / meta-direita e já é sticky. Faltam os itens da direita da Malbon: busca e seletor de moeda. O link institucional (`SOBRE`) entra pelo `menu_right`, que já existe no schema como `link_list` — quem define o conteúdo é o admin, não o código.

**Files:**
- Modify: `sections/header.liquid`
- Modify: `assets/theme.js` (logo depois do bloco do toggle do menu mobile)
- Modify: `assets/theme.css` (final do arquivo)
- Modify: `locales/pt-BR.default.json`

**Interfaces:**
- Consumes: nada
- Produces: formulário de localização com a classe `.site-header__loc`, cujo `<select>` é observado pelo JS do step 3

- [ ] **Step 1: Acrescentar as chaves de tradução**

Em `locales/pt-BR.default.json`, dentro de `general.a11y`, trocar:

```json
      "next_photo": "Próxima foto"
```

por:

```json
      "next_photo": "Próxima foto",
      "search": "Buscar",
      "country": "País e moeda"
```

- [ ] **Step 2: Acrescentar busca e moeda ao header**

Em `sections/header.liquid`, dentro de `<div class="site-header__meta">`, logo **depois** do bloco `{%- if section.settings.show_est -%}…{%- endif -%}` e **antes** de `{%- if section.settings.menu_right != blank -%}`, inserir:

```liquid
      {%- if section.settings.show_search -%}
        <a href="{{ routes.search_url }}" class="site-header__icon" aria-label="{{ 'general.a11y.search' | t }}">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.25"/><path d="M16 16l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.25"/></svg>
        </a>
      {%- endif -%}

      {%- if section.settings.show_currency and localization.available_countries.size > 1 -%}
        {%- form 'localization', class: 'site-header__loc' -%}
          <label class="visually-hidden" for="header-country">{{ 'general.a11y.country' | t }}</label>
          <select id="header-country" name="country_code" class="site-header__select">
            {%- for country in localization.available_countries -%}
              <option value="{{ country.iso_code }}"{% if country.iso_code == localization.country.iso_code %} selected{% endif %}>{{ country.currency.iso_code }}</option>
            {%- endfor -%}
          </select>
          <noscript><button type="submit" class="site-header__link">OK</button></noscript>
        {%- endform -%}
      {%- endif -%}
```

No `{% schema %}`, logo depois da setting `show_account`, acrescentar:

```json
    { "type": "checkbox", "id": "show_search", "label": "Mostrar busca", "default": true },
    { "type": "checkbox", "id": "show_currency", "label": "Mostrar seletor de moeda", "info": "Só aparece quando a loja vende para mais de um país.", "default": true },
```

- [ ] **Step 3: Enviar o seletor ao mudar**

Em `assets/theme.js`, logo depois do bloco `// Mobile nav toggle` (o `document.addEventListener('click', …)` que termina com `});`), acrescentar:

```javascript
  // Seletor de país/moeda: envia ao mudar. Sem JS, o <noscript> mostra o botão.
  document.querySelectorAll('.site-header__loc select').forEach(function (select) {
    select.addEventListener('change', function () {
      var form = select.closest('form');
      if (form) form.submit();
    });
  });
```

- [ ] **Step 4: Estilizar**

Ao final de `assets/theme.css`:

```css
/* ---------- Busca e moeda no header ---------- */
.site-header__icon{display:inline-flex;align-items:center;color:var(--navy-700);}
.site-header__icon svg{width:18px;height:18px;}
.site-header__icon:hover{color:var(--olive-700);}
.site-header__loc{display:inline-flex;align-items:center;margin:0;}
/* Select sem chrome de sistema: o header é uma linha de labels, não um formulário.
   A seta é desenhada com dois degradês para não depender de imagem. */
.site-header__select{
  appearance:none;-webkit-appearance:none;
  border:0;cursor:pointer;padding:0 18px 0 0;
  font-family:var(--font-sans);font-size:11px;font-weight:var(--weight-label);
  letter-spacing:0.2em;text-transform:uppercase;color:var(--navy-700);
  background-color:transparent;
  background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);
  background-position:calc(100% - 8px) center,calc(100% - 4px) center;
  background-size:4px 4px,4px 4px;background-repeat:no-repeat;
}
.site-header__select:hover{color:var(--olive-700);}
```

- [ ] **Step 5: Rodar o theme check**

```bash
shopify theme check
```

Esperado: nenhum erro. Chave de tradução ausente aparece como `MissingTranslation` — conferir o step 1.

- [ ] **Step 6: Verificar o header**

Em qualquer página:
- Lupa à direita, leva a `/search`.
- Se a loja tiver mais de um país em **Configurações → Mercados**, o seletor mostra `BRL`; trocar recarrega na moeda escolhida. **Se só o Brasil estiver habilitado, o seletor não aparece — correto.** Registrar no relatório qual dos dois casos foi observado.
- Header continua grudado no topo ao rolar.
- Em 375px, o hambúrguer abre a navegação e a lupa não quebra a linha.

- [ ] **Step 7: Commit**

```bash
git add sections/header.liquid assets/theme.js assets/theme.css locales/pt-BR.default.json
git commit -m "$(cat <<'EOF'
Header ganha busca e seletor de moeda

Lupa levando para /search e select de país que envia ao mudar, com botão
de fallback sem JS. O link institucional entra pelo menu da direita, que
já existia no schema.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Rodapé com colunas, social e newsletter

O brasão centralizado dá lugar a três colunas de links, ícones sociais e a newsletter à direita. A seção `newsletter` saiu da home na Tarefa 5; a copy migra para cá.

O rodapé é renderizado por `{% section 'footer' %}` em `layout/theme.liquid:43` — seção estática, onde blocos não são editáveis no editor de tema. Por isso colunas e redes são settings explícitas.

**Files:**
- Modify: `sections/footer.liquid` (arquivo inteiro)
- Modify: `assets/theme.css` (bloco das regras `.site-footer*`, originalmente linhas 157-164)
- Modify: `assets/theme.js` (antes do `})();` final)

**Interfaces:**
- Consumes: nada
- Produces: rodapé final; nada depende dele

- [ ] **Step 1: Reescrever o rodapé**

Substituir todo o conteúdo de `sections/footer.liquid` por:

```liquid
{%- comment -%}
  Rodapé em colunas com a newsletter à direita. As colunas viram acordeão no mobile
  via <details> — acessível sem JS. Seção estática: blocos não são editáveis no
  editor, então colunas e redes são settings explícitas.
{%- endcomment -%}
<footer class="site-footer">
  <div class="wrap site-footer__grid">
    {%- for i in (1..3) -%}
      {%- case i -%}
        {%- when 1 -%}
          {%- assign col_title = section.settings.title_1 -%}
          {%- assign col_menu = section.settings.menu_1 -%}
        {%- when 2 -%}
          {%- assign col_title = section.settings.title_2 -%}
          {%- assign col_menu = section.settings.menu_2 -%}
        {%- when 3 -%}
          {%- assign col_title = section.settings.title_3 -%}
          {%- assign col_menu = section.settings.menu_3 -%}
      {%- endcase -%}
      {%- if col_menu != blank -%}
        <details class="site-footer__col" open>
          <summary class="site-footer__col-title">{{ col_title }}</summary>
          <ul class="site-footer__col-list">
            {%- for link in col_menu.links -%}
              <li><a href="{{ link.url }}">{{ link.title }}</a></li>
            {%- endfor -%}
          </ul>
        </details>
      {%- endif -%}
    {%- endfor -%}

    <div class="site-footer__news">
      <p class="site-footer__col-title">{{ section.settings.news_title }}</p>
      {%- if section.settings.news_body != blank -%}
        <p class="site-footer__news-body">{{ section.settings.news_body }}</p>
      {%- endif -%}
      {%- form 'customer', class: 'site-footer__form' -%}
        <input type="hidden" name="contact[tags]" value="newsletter">
        <label class="visually-hidden" for="footer-email">{{ section.settings.news_placeholder }}</label>
        <input id="footer-email" type="email" name="contact[email]" required autocomplete="email"
               placeholder="{{ section.settings.news_placeholder }}" class="site-footer__input">
        <button type="submit" class="btn btn--inverse btn--sm">{{ section.settings.news_button }}</button>
        {%- if form.posted_successfully? -%}
          <p class="site-footer__news-ok" role="status">{{ section.settings.news_success }}</p>
        {%- endif -%}
      {%- endform -%}

      {%- if section.settings.social_instagram != blank or section.settings.social_tiktok != blank -%}
        <div class="site-footer__social">
          {%- if section.settings.social_instagram != blank -%}
            <a href="{{ section.settings.social_instagram }}" target="_blank" rel="noopener" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.25"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.25"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor"/></svg>
            </a>
          {%- endif -%}
          {%- if section.settings.social_tiktok != blank -%}
            <a href="{{ section.settings.social_tiktok }}" target="_blank" rel="noopener" aria-label="TikTok">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 2.1 4 4.5 4.2" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>
            </a>
          {%- endif -%}
        </div>
      {%- endif -%}
    </div>
  </div>

  <div class="wrap site-footer__base">
    <p class="site-footer__fine">{{ section.settings.fineprint }}</p>
    <p class="site-footer__sign">{{ section.settings.signoff }}</p>
  </div>
</footer>

{% schema %}
{
  "name": "Rodapé",
  "settings": [
    { "type": "header", "content": "Colunas" },
    { "type": "paragraph", "content": "Coluna sem menu escolhido não aparece." },
    { "type": "text", "id": "title_1", "label": "Título da coluna 1", "default": "O CLUBE" },
    { "type": "link_list", "id": "menu_1", "label": "Menu da coluna 1", "default": "footer" },
    { "type": "text", "id": "title_2", "label": "Título da coluna 2", "default": "A LOJA" },
    { "type": "link_list", "id": "menu_2", "label": "Menu da coluna 2" },
    { "type": "text", "id": "title_3", "label": "Título da coluna 3", "default": "AJUDA" },
    { "type": "link_list", "id": "menu_3", "label": "Menu da coluna 3" },

    { "type": "header", "content": "Correspondência" },
    { "type": "text", "id": "news_title", "label": "Título", "default": "O CLUBE ESCREVE PRIMEIRO" },
    { "type": "textarea", "id": "news_body", "label": "Texto", "default": "Uma carta por mês: o próximo drop, datas de reposição e o que estamos testando em quadra. Nenhum cupom no assunto." },
    { "type": "text", "id": "news_placeholder", "label": "Campo", "default": "Seu e-mail" },
    { "type": "text", "id": "news_button", "label": "Botão", "default": "Deixar meu nome" },
    { "type": "text", "id": "news_success", "label": "Confirmação", "default": "Recebido. A próxima carta chega antes do próximo drop." },

    { "type": "header", "content": "Redes" },
    { "type": "paragraph", "content": "Ícone sem link não aparece — melhor nenhum ícone que um ícone morto." },
    { "type": "url", "id": "social_instagram", "label": "Instagram" },
    { "type": "url", "id": "social_tiktok", "label": "TikTok" },

    { "type": "header", "content": "Base" },
    { "type": "text", "id": "fineprint", "label": "Rodapé fino", "default": "© 2026 Limen · Trocas em 30 dias · Envio para todo o Brasil" },
    { "type": "text", "id": "signoff", "label": "Assinatura", "info": "O fecho da marca.", "default": "◆ Bem-vindo ao clube. 🍋" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Substituir o CSS do rodapé**

Em `assets/theme.css`, trocar o bloco das regras do rodapé — de `.site-footer{background:var(--surface-inverse);…}` até `.site-footer__fine{…}` (inclusive; originalmente linhas 157-164, logo abaixo do comentário `/* ---------- Footer ---------- */`) — por:

```css
.site-footer{background:var(--surface-inverse);color:var(--text-inverse);}
.site-footer__grid{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) 1.6fr;
  gap:var(--space-7);padding-top:var(--space-8);padding-bottom:var(--space-7);
  align-items:start;
}
/* No desktop o acordeão não tem função: marcador escondido, conteúdo aberto. */
.site-footer__col-title{
  font-family:var(--font-sans);font-size:11px;font-weight:var(--weight-label);
  letter-spacing:var(--tracking-label);text-transform:uppercase;
  color:var(--paper-100);list-style:none;cursor:default;
}
.site-footer__col-title::-webkit-details-marker{display:none;}
.site-footer__col-list{list-style:none;margin:var(--space-4) 0 0;padding:0;display:grid;gap:10px;}
.site-footer__col-list a{font-size:14px;color:var(--paper-100);opacity:0.75;}
.site-footer__col-list a:hover{color:var(--lemon-300);opacity:1;}
.site-footer__news-body{font-size:14px;opacity:0.75;margin-top:var(--space-4);max-width:42ch;}
.site-footer__form{display:flex;flex-wrap:wrap;margin-top:var(--space-5);max-width:440px;}
.site-footer__input{
  flex:1;min-width:0;background:transparent;color:var(--paper-100);
  border:1px solid var(--border-hairline-inverse);border-right:0;
  padding:13px 16px;font-family:var(--font-body);font-size:14px;border-radius:0;
}
.site-footer__input::placeholder{color:var(--paper-100);opacity:0.5;}
.site-footer__news-ok{flex-basis:100%;font-size:13px;margin-top:12px;color:var(--lemon-300);}
.site-footer__social{display:flex;gap:var(--space-4);margin-top:var(--space-5);}
.site-footer__social a{color:var(--paper-100);display:inline-flex;}
.site-footer__social a:hover{color:var(--lemon-300);}
.site-footer__social svg{width:22px;height:22px;}
.site-footer__base{
  display:flex;justify-content:space-between;gap:var(--space-5);flex-wrap:wrap;
  border-top:1px solid var(--border-hairline-inverse);
  padding-top:var(--space-5);padding-bottom:var(--space-6);
}
.site-footer__fine{font-family:var(--font-sans);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.5;}
.site-footer__sign{font-family:var(--font-body);font-size:13px;opacity:0.75;}

@media (max-width:989px){
  .site-footer__grid{grid-template-columns:1fr 1fr;}
}
@media (max-width:749px){
  .site-footer__grid{grid-template-columns:1fr;gap:var(--space-5);}
  /* No mobile o acordeão volta a valer: título clicável. */
  .site-footer__col{border-bottom:1px solid var(--border-hairline-inverse);padding-bottom:var(--space-4);}
  .site-footer__col-title{cursor:pointer;}
  .site-footer__form{max-width:none;}
}
```

Saem junto, porque nada mais as usa: `.site-footer .wrap{…text-align:center;}`, `.site-footer__crest`, `.site-footer__links` (e `a`, `a:hover`) e `.site-footer__tagline`.

Conferir: `grep -rn "site-footer__crest\|site-footer__links\|site-footer__tagline" sections/ snippets/ layout/ assets/` deve voltar vazio. Se as regras de mobile antigas (dentro de algum `@media` mais abaixo no arquivo) citarem essas classes, removê-las também.

- [ ] **Step 3: Fechar o acordeão no mobile**

O `<details open>` deixa tudo aberto, o que no mobile vira uma parede de links. Em `assets/theme.js`, logo antes do `})();` final, acrescentar:

```javascript
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
```

(`syncFooterCols` é uma function expression atribuída a `var`, não uma declaração dentro do `if` — ver Global Constraints.)

- [ ] **Step 4: Rodar o theme check**

```bash
shopify theme check
```

Esperado: nenhum erro.

- [ ] **Step 5: Verificar o rodapé**

Abrir `/`, rolar até o fim:
- Colunas à esquerda, newsletter à direita, tudo alinhado à esquerda — sem brasão.
- Só a coluna `O CLUBE` aparece (usa o link list `footer`, que já existe); `A LOJA` e `AJUDA` **não aparecem** até existirem menus no admin. Correto.
- Sem URLs de redes preenchidas, nenhum ícone social aparece. Preencher Instagram no editor → o ícone surge.
- Campo e botão `Deixar meu nome` colados; enviar um e-mail válido mostra a confirmação em limão.
- Base: rodapé fino à esquerda, `◆ Bem-vindo ao clube. 🍋` à direita.
- Em 375px: colunas em acordeão **fechado**; tocar no título abre.
- Redimensionar de 375px para 1200px com a página aberta: as colunas se abrem sozinhas.

- [ ] **Step 6: Commit**

```bash
git add sections/footer.liquid assets/theme.css assets/theme.js
git commit -m "$(cat <<'EOF'
Rodapé vira colunas com a newsletter dentro

Brasão centralizado dá lugar a três colunas em acordeão no mobile, ícones
sociais que só aparecem com link preenchido e o formulário de
correspondência à direita. O fecho da marca fica na base.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Verificação final (depois da Tarefa 7)

Cobre a seção "Verificação" do spec como um todo:

- [ ] `shopify theme check` sem erros novos em relação a `ecfafd5`.
- [ ] Home em ordem: hero → O DROP → dupla → O SALÃO → AS SALAS → rodapé.
- [ ] `/collections/charter-ss2026-01`, `/search?q=clubhouse` e `/collections` íntegras depois da mudança do card.
- [ ] Com JS desabilitado: prateleiras rolam nativamente, hero mostra o slide 1, rodapé aberto, seletor de moeda com botão OK.
- [ ] Com `prefers-reduced-motion: reduce` emulado no DevTools: hero e prateleiras navegam sem animação suave.
- [ ] Texto creme legível sobre foto em hero, dupla e grade.
- [ ] `grep -rn "elegante\|elegância\|premium\|luxo\|qualidade\|exclusivo\|sofisticado\|refinado\|inovador" sections/hero-carousel.liquid sections/featured-collection.liquid sections/category-mosaic.liquid sections/header.liquid sections/footer.liquid templates/index.json` volta vazio.

## Pendências para o Gui

Nada disto bloqueia a implementação, mas a home só fica redonda quando resolvido:

1. **Páginas que não existem.** `COMO É FEITA` e `O CLUBE` (grade) e o slide 3 do hero estão com link vazio. Criar as páginas e preencher no editor.
2. **Menus do rodapé.** `A LOJA` e `AJUDA` só aparecem quando houver link lists para elas no admin. `SOBRE` no header entra pelo menu da direita.
3. **Redes sociais.** Preencher as URLs de Instagram e TikTok no editor do rodapé.
4. **Catálogo.** Enquanto `acessorios` estiver vazia, `O SALÃO` mostra placeholders. Cadastrar resolve sem tocar em código.
5. **Swatches.** As bolinhas só aparecem com a opção de cor tipada como **Color** no admin.
6. **Palavra banida.** "Toda a elegância do country club" continua como default no schema de `club-editorial.liquid`. Some da home, mas deve ser corrigido antes de reaproveitar a seção.
