# Limen Club — Tema Shopify

Tema da Limen Club (acessórios para pickleball). Estética racquet club: navy `#1F2D5C`, limão `#E5C63F`, oliva `#75803E`, creme `#F7F1E4`. Tipografia: Satoshi via Fontshare (400/500/700) em tudo — headlines em Medium com tracking -0.02em, labels caixa alta 0.22em; o script fica só no logo.

## Estrutura

```text
assets/     CSS, JS e imagens (theme.css, limen-seal.png)
config/     settings do tema
layout/     theme.liquid
locales/    traduções (pt-BR)
sections/   seções da home, produto, etc.
snippets/   parciais reutilizáveis
templates/  templates JSON das páginas
```

## Desenvolvimento local

Pré-requisito: [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)

```bash
npm install -g @shopify/cli @shopify/theme

# preview local com hot reload
shopify theme dev --store SUA-LOJA.myshopify.com

# enviar/puxar manualmente
shopify theme push
shopify theme pull
```

## Fluxo com GitHub

1. Conecte este repositório na Shopify: **Loja online → Temas → Adicionar tema → Conectar do GitHub**.
2. Cada push na branch conectada atualiza o tema automaticamente.
3. Sugestão de branches:
   - `main` → tema publicado (produção)
   - `staging` → tema não publicado para testes

## VS Code

Instale a extensão **Shopify Liquid** (oficial) para highlight, autocomplete e Theme Check.
