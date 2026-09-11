# Home no esqueleto da Malbon — vitrine no lugar de editorial

**Data:** 2026-09-11
**Autor:** Guilherme + Claude

## Objetivo

Reestruturar a página inicial (header, miolo e rodapé) para seguir o esqueleto de
[malbon.com](https://malbon.com/): hero em carrossel, duas prateleiras de produto
roláveis, um banner duplo full-bleed, uma grade de três salas e um rodapé com
colunas em acordeão e a newsletter embutida.

A decisão de fundo é de **gramática de página**: a Malbon é vitrine pura —
cabeçalhos de seção são uma ou duas palavras em caixa alta, alinhados à esquerda,
com uma pílula "Shop All" ao lado, e não existe um parágrafo editorial na home
inteira. A Limen hoje é o oposto: todo título é uma frase, `positioning` tem dois
parágrafos e `club-editorial` é um ensaio fotográfico.

Escolha do Gui em 11/set/2026: **esqueleto literal**. As seções editoriais saem da
home. A prova (Regra #3) não é abandonada — migra para o card `COMO É FEITA` da
grade de salas, virando foto e destino em vez de prosa.

## Restrição que molda todo o resto

A loja tem **1 produto** (THE CLUBHOUSE, R$ 699, variante única "SADDLE") e duas
coleções: `charter-ss2026-01` (1 produto) e `acessorios` (0 produtos).

O esqueleto da Malbon pressupõe catálogo grande — lá cada prateleira gira com
dezenas de itens. Decisão: construir a estrutura completa e deixar cada prateleira
cair em tiles de demonstração enquanto a coleção estiver vazia, reusando o fallback
que `featured-collection.liquid` já tem. Quando o drop for cadastrado, a home
preenche sozinha, sem tocar em código.

**Consequência aceita:** até lá, a home mostra placeholders em duas faixas.

## Estrutura da home

| # | Seção | Cabeçalho | Destino |
| --- | ----- | --------- | ------- |
| 1 | `hero-carousel` | 3 slides com dots | — |
| 2 | `featured-collection` (rail) | `O DROP` + `[Ver tudo]` | `charter-ss2026-01` |
| 3 | `category-mosaic` (`layout: duo`) | `O VESTIÁRIO` \| `O SALÃO` | as 2 coleções |
| 4 | `featured-collection` (rail) | `O SALÃO` + `[Ver tudo]` | `acessorios` |
| 5 | `category-mosaic` (`layout: grid3`) | `AS SALAS` | coleção + 2 páginas |
| — | `footer` | colunas + social + newsletter | — |

### Copy dos slides do hero

Regra #1 vale em todos: a bolsa fora da quadra.

1. `CHARTER SS2026 01` — "Cinco bolsas. A raquete de um lado, o resto do seu dia do outro." → **Ver a coleção**
2. `THE CLUBHOUSE` — "Compartimento forrado para a raquete, separado de chaves e celular." → **Ver a bolsa**
3. `O CLUBE` — "Sem lista de espera, sem indicação, sem mensalidade." → **Conhecer o clube**

### Por que os rails não repetem a duo

Na Malbon, `ICONS` aparece como prateleira **e** como card da grade de coleções —
ela pode, porque tem catálogo para encher os dois. Com duas coleções, repetir faria
a home dizer "O Vestiário" quatro vezes. Então:

- **duo (#3)** = as duas salas de compra
- **grade 3-up (#5)** = três entradas distintas — `A COLEÇÃO`, `COMO É FEITA`, `O CLUBE`

O card `COMO É FEITA` é o que absorve o `positioning` aposentado.

### CTAs

`Entrar` nos banners de sala (a Malbon usa "Shop"; numa marca que chama coleção de
sala, o botão que abre uma sala é "Entrar"), `Ver tudo` nas prateleiras, `Ver a
bolsa` nos produtos. Nenhum CTA gritado — Regra #4.

## Componentes

### JS: dois comportamentos que já existem viram genéricos

Achado da exploração: o JS dos dois carrosséis já está escrito.

- `theme.js:96-136` (`data-showcase`) — um slide por vez, dots, `IntersectionObserver`
  marcando o atual. É exatamente o hero.
- `theme.js:140-187` (`data-gallery`) — track de rolagem, setas que avançam um card,
  arrastar com o mouse. É exatamente o rail.

Renomear para `data-carousel` e `data-rail`, atualizando o atributo em
`gallery.liquid` e `showcase.liquid` (uma linha cada). Três seções passam a dividir
dois comportamentos em vez de triplicar a lógica. O JS não cresce.

### `sections/hero-carousel.liquid` — novo

Blocos `slide` (imagem, título, subtítulo, rótulo e link do botão). Full-bleed,
`100svh`, scrim navy graduado de baixo para cima, copy ancorada embaixo-à-esquerda,
dots centralizados no rodapé da seção. Usa `data-carousel`.

O primeiro slide é o LCP da página: `loading="eager"` + `fetchpriority="high"`; os
demais `lazy`.

Nasce como arquivo novo em vez de reformar `hero.liquid` porque este não tem blocos
e já carrega dois layouts mutuamente exclusivos — um terceiro modo faria dele um
arquivo de condicionais. `hero.liquid` continua disponível para páginas internas.

### `sections/featured-collection.liquid` — reforma para prateleira

- Grade → track horizontal com `data-rail`.
- Cabeçalho centralizado (sobrelinha + título em frase) → par `TÍTULO [Ver tudo]`
  alinhado à esquerda, caixa alta, `--tracking-label`.
- Saem do schema: `drop_label`, `eyebrow`, `note`.
- **Permanece intacto** o fallback de placeholder das linhas 20-24 — é o que sustenta
  a decisão de catálogo acima.
- `.product-grid` continua no CSS: as páginas de coleção e busca dependem dele.

### `sections/category-mosaic.liquid` — reforma com dois layouts

Ganha `layout`:

- `duo` — dois tiles full-bleed lado a lado, altura cheia, label centralizado + botão
- `grid3` — três cards em `aspect-ratio: 4/5`, label sobreposto + botão

Cada tile ganha `button_label`. O layout atual em L-invertido (`mosaic__tile--lead`
ocupando duas linhas) sai. A home usa a seção duas vezes, com layouts diferentes.

### `snippets/product-card.liquid` — reforma

- Perde a borda hairline de `.pcard__media` (a Malbon não tem borda), mantém o fundo
  `--stone-200`.
- Ganha `.pcard__swatches`.

**Swatches — regra em cascata.** O Shopify só entrega cor real quando a opção está
tipada como **Color** no admin, via `option.values[].swatch.color`. Não se sabe se a
opção de THE CLUBHOUSE está assim tipada. Então:

1. hex de `swatch.color`, se existir;
2. senão, miniatura da imagem da variante;
3. senão, nada — a fileira some sem deixar buraco.

Nenhum desses caminhos exige um mapa de nomes-para-hex, que é onde esse tipo de
código costuma apodrecer. Com mais de 6 variantes, contador `+N` como na Malbon.

**Alcance:** o snippet é compartilhado com as páginas de coleção e de busca. A
mudança é intencionalmente global — o card fica consistente em todo o site.

### `sections/header.liquid` — reforma

Já tem nav-esquerda / logo-centro / meta-direita e já é sticky. Acrescenta: ícone de
busca, seletor de moeda e link `SOBRE`. **Sem barra de anúncio** — a Malbon não tem
nenhuma, e o escopo é esqueleto literal.

**Sem toggle Men/Women** no primeiro rail: a Limen não tem linha por gênero e nada o
substitui. O cabeçalho da prateleira fica só `TÍTULO [Ver tudo]`.

### `sections/footer.liquid` — reescrita

Brasão centralizado → três colunas de links (acordeão no mobile) + ícones sociais +
newsletter à direita. A seção `newsletter` sai da home e sua copy migra para cá.

Colunas, cada uma alimentada por um `link_list` próprio no schema:

| Coluna | Conteúdo esperado |
| ------ | ----------------- |
| `O CLUBE` | sobre, como é feita, o manifesto |
| `A LOJA` | as bolsas, acessórios, o drop |
| `AJUDA` | trocas, envio, contato |

A newsletter reusa a copy da seção `newsletter` atual: título "O clube escreve
primeiro.", botão "Deixar meu nome".

**Preservado contra a Malbon:** o fecho de marca `Bem-vindo ao clube. 🍋` e o divisor
◆ continuam na linha fina. É assinatura da Limen, não estrutura de página.

## Seções aposentadas da home

Os arquivos **permanecem** no tema, disponíveis no editor para outras páginas. Só
saem de `templates/index.json`:

`gallery` · `showcase` · `club-editorial` · `positioning` · `newsletter` (migra para o rodapé)

## Dívida encontrada no caminho

O título da seção `club` em `templates/index.json` diz *"Toda a elegância do country
club"*. **"elegante/elegância" está na lista de palavras banidas da marca.** Como a
seção sai da home, o problema deixa de aparecer no site — mas segue no arquivo e
deve ser corrigido onde a seção for reaproveitada. Fora do escopo desta mudança.

## Links pendentes

O slide 3 do hero e os cards `COMO É FEITA` e `O CLUBE` apontam para páginas cuja
existência não foi verificada. Se não existirem, os links ficam **vazios e
configuráveis no editor**: a seção não quebra, mas o card vira um beco sem saída até
a página ser criada.

## Fora de escopo

- Quick-add nas prateleiras. O botão `+` da Malbon exige JS de carrinho e um popover
  de variante; comprar sem escolher variante não combina com uma bolsa de R$ 699.
  Decisão do Gui: badge e swatches sim, `+` não.
- Barra de anúncio.
- Cadastro dos produtos do drop na loja.
- Reforma das páginas de produto, coleção e busca — exceto o efeito colateral
  intencional do `product-card` nas duas últimas.

## Verificação

- `shopify theme check` sem erros novos.
- Home renderiza as 5 seções na ordem, com placeholders nas duas prateleiras.
- Prateleiras rolam por toque, por seta e por arraste de mouse; hero navega por dots.
- Sem JS, a página continua legível: prateleiras são rolagem nativa, hero mostra o
  primeiro slide.
- `prefers-reduced-motion` respeitado (o JS existente já trata).
- Páginas de coleção e busca continuam íntegras após a mudança no `product-card`.
- Contraste do texto sobre foto em hero, duo e grade: scrim graduado, nunca texto
  claro cru sobre imagem clara.
