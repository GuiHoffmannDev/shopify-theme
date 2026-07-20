# Home — mecânica de merchandising

**Date:** 2026-07-19
**Status:** Aprovado

## Goal

Trazer para a home três padrões de merchandising vistos em referências de e-commerce de
couro europeu — vitrine com carrossel, faixa em movimento, mosaico de categorias — sem
importar a estética delas. A paleta (creme `#F7F1E4`, navy, limão, oliva), a tipografia
Satoshi e o sistema de copy "prova, não adjetivo" permanecem intactos. Adotamos a
mecânica, não a aparência.

Contexto que condiciona tudo abaixo: **a loja não tem catálogo**. A busca no Admin em
19/07/2026 retornou 15 "Example product" de asset pack, dois apoios de punho de silicone
de dropshipping e nenhuma coleção real. Toda seção nova precisa ser legível com o
catálogo vazio.

## Changes

### 1. Nova seção `showcase.liquid` — a vitrine

Split: foto lifestyle à esquerda, card de produto à direita. Entra na posição 2, logo
abaixo do hero-manifesto, que **não** é substituído — a Regra #1 (foto que subverte
contexto) continua abrindo a página.

- Card reusa a hierarquia já aprovada em `2026-07-18-quiet-card-pricing-design.md`:
  nome em `--font-display` 19px+, preço 13px `--text-muted` com
  `money_without_trailing_zeros`. CTA é `.btn--outline` "Ver a bolsa" — nunca caixa
  alta gritada tipo "VIEW PRODUCT".
- Carrossel por CSS `scroll-snap` na faixa de slides; setas chamam `scrollBy`, dots são
  âncoras. Sem JS a seção degrada para scroll horizontal utilizável. **Sem autoplay.**
- Blocos de slide aceitam produto ou, vazio, caem no placeholder `.pcard__linen`.
- Foto de cena default: `photo-editorial-wall.jpg`. (A primeira escolha,
  `photo-interlude-chair.jpg`, foi descartada na verificação visual: é uma quadra de
  tênis, e a Regra #1 proíbe a quadra no hero.)
- Os pins shopáveis sobre a foto (hotspots x/y) ficam **fora de escopo** — ver abaixo.

### 2. Nova seção `marquee.liquid` — a fita de fatos

Faixa única, hairline em cima e embaixo, entre `positioning` e `proof-grid` (posição 5).
Blocos de texto curto separados pelo losango que já é token da marca (`.rule-diamond`,
`theme.css:87`). Conteúdo é fato verificável — "Fica em pé", "Troca em 30 dias",
"Drop Nº 01 aberto" — nunca anúncio.

- Uma linha, não duas. Sem recortes de produto entre as palavras (não existem packshots
  em PNG transparente, e o conteúdo natural desse formato seria grito de lançamento).
- Animação para em `prefers-reduced-motion`, estendendo o bloco de `theme.css:392`.
- `aria-hidden` no clone de repetição; o texto real fica legível uma vez para leitor de tela.

### 3. Nova seção `category-mosaic.liquid` — o mosaico

Um quadro grande à esquerda, dois empilhados à direita, label em caixa alta sobreposto
(`--tracking-label` 0.22em). Posição 8, fechando o bloco de loja.

**Desvio da referência, decidido na verificação:** a ref usa texto branco solto sobre a
foto. Medido nas fotos reais do repo, isso dá ~2.6:1 de contraste — abaixo do mínimo de
4.5:1 —, e escurecer o scrim o bastante apagaria a imagem. O label virou chip creme sobre
navy (mesmo padrão de `.coll-band__label`), que mede **11.75:1** e ainda lê como placa de
porta de sala do clube. A geometria do mosaico continua a da ref.

Blocos são **imagem + label + link livres**, não amarrados a objeto coleção — a loja tem
duas categorias reais e a ref tem três quadros; inventar uma terceira sala vazia violaria
a Regra #3. Defaults usam fotos já presentes no repo:

| Quadro | Label | Asset default |
|---|---|---|
| Grande | O Vestiário | `photo-club-elevator.jpg` |
| Topo dir. | O Grip | `photo-interlude-gravel.jpg` |
| Base dir. | O Jornal | `photo-journal-lookbook.jpg` |

### 4. Ajustes em arquivos existentes

- `featured-collection.liquid`: `limit` default 3 → 4; nova classe `.product-grid--4`
  em `theme.css` (a base está travada em `repeat(3,1fr)`, linha 229). A etiqueta por card
  já existe via `.pcard__tag`.
- `arrival-proof.liquid`: absorve a citação do `quote-banner` como pull-quote interno.
- `templates/index.json`: `quote` sai da ordem; home vai de 9 para 11 seções.
  `quote-banner.liquid` **continua no tema** para uso em outras páginas.

Ordem final: hero · vitrine · clube · posicionamento · marquee · prova · vestiário ·
mosaico · chegada · jornal · convite.

## Out of scope

- **Pins shopáveis** sobre a foto da vitrine. Adiado até uma foto carregar 3+ SKUs reais;
  com um produto por quadro, linkar a foto inteira entrega o mesmo com zero código.
- Qualquer mudança em tokens de cor, família tipográfica ou fundo de packshot.
- Preço na página de produto e no carrinho (segue intocado, conforme spec de 18/07).
- Limpeza do catálogo no Admin — necessária, mas é trabalho de loja, não de tema.

## Riscos

O fallback de placeholder linka para `/collections/all`, que hoje entrega os dois produtos
de dropshipping e os 15 exemplos. Enquanto o Admin não for limpo, todo CTA da home leva a
uma vitrine de apoios de punho de silicone.

## Verification

`shopify theme dev` com o catálogo vazio, conferindo em cada seção nova: (a) o fallback
renderiza sem produto, (b) a página não rola na horizontal no mobile, (c) o marquee
congela com `prefers-reduced-motion: reduce` ativo no DevTools, (d) o carrossel continua
navegável com JS desativado.
