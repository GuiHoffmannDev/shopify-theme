# Galeria editorial — carrossel full-bleed (estilo Nude Project)

**Data:** 2026-08-09
**Autor:** Guilherme + Claude

## Objetivo

Adicionar à home uma seção de galeria editorial full-bleed: fotos verticais (4:5)
lado a lado, roláveis na horizontal, com um único bloco de label sobreposto na
primeira foto (sobrelinha / título / botão → coleção). Espelha o padrão
"SS2026 / Pants / Shop Now" da Nude Project, na linguagem da Limen Club.

## Posição na home

Nova seção `gallery`, inserida em `templates/index.json` logo **depois do `hero`**
e antes de `showcase` (Vitrine). Reposicionável no editor de tema.

## Layout & comportamento

- **Full-bleed** como o hero: a seção NÃO usa `.wrap`, ocupa a largura da viewport.
- Cada quadro: `flex: 0 0 clamp(300px, 42vw, 600px)`, `aspect-ratio: 4/5`.
  ~2,2 quadros aparecem no desktop, ~1,3 no mobile — convida a rolar.
- Gap fino entre quadros (hairline, ~2px), imagens praticamente encostadas.
- Rolagem: touch nativa + `scroll-snap-type: x proximity` + arrastar-para-rolar no
  desktop. Setas prev/next opcionais (só desktop) reusando o visual `.showcase__arrow`.
- **Degrada sem JS:** é uma faixa de rolagem nativa; setas e drag são enhancement.
  JS novo e isolado em `[data-gallery]` (~30 linhas). NÃO mexe no JS da Vitrine
  (`[data-showcase]`).

## Label sobre a 1ª foto

- Ancorado ao canto inferior-esquerdo **dentro** do primeiro quadro (rola junto com ele).
- Texto creme (`--text-inverse`) sobre um **degradê navy** de baixo p/ cima
  (mesmo recurso de contraste do hero — não é texto claro cru sobre foto clara,
  que reprova no contraste ~2.6:1, conforme nota já existente no CSS do mosaico).
- Sobrelinha: uppercase, `--tracking-label`. Título: `--font-display` (Satoshi
  Medium), `--tracking-headline`. Botão: `btn btn--inverse`.
- Cópia padrão sem palavras banidas — ex.: sobrelinha "CHARTER — SS2026 01",
  título "A coleção do primeiro drop.", botão "Ver a coleção".

## Controles (schema, em PT)

Configurações da seção:
- `eyebrow` (text), `heading` (text), `button_label` (text), `button_link` (url).

Blocos `frame` (max 10), seguindo o padrão da Vitrine:
- `image` (image_picker), `asset` (text, fallback embutido em assets),
  `placeholder_label` (text).

Preset semeado com 3–4 fotos existentes (ex.: `photo-editorial-wall.jpg`,
`photo-lemons-towel.png`, `photo-oranges-pool.png`, `photo-interlude-chair.jpg`)
para não nascer vazio no editor.

## Arquivos tocados

- **Novo** `sections/gallery.liquid` (markup + schema).
- **Append** em `assets/theme.css`: bloco `.gallery*` (track, frame, label, scrim,
  setas, responsivo, reduced-motion).
- **Append** em `assets/theme.js`: bloco IIFE-interno keyed em `[data-gallery]`
  (setas + drag-to-scroll). Sem tocar no bloco `[data-showcase]`.
- **Editar** `templates/index.json`: adicionar `gallery` e colocar na `order`
  depois de `hero`.

## Acessibilidade

- Setas são `<button>` com `aria-label` (Anterior/Próximo), i18n via locales.
- Imagens com `alt` da imagem escolhida; `loading="lazy"`; `width`/`height` p/ evitar CLS.
- Respeita `prefers-reduced-motion` (sem smooth-scroll animado).
- Contraste do label garantido pelo degradê navy sob o texto creme.

## Fora de escopo

- Sem autoplay/timer.
- Sem links por foto (um único CTA no bloco da 1ª foto).
- Sem puxar produtos de coleção automaticamente (fotos escolhidas à mão).
