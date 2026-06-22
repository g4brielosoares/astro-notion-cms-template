# Astro + Notion CMS Template

Template simples em Astro com Tailwind CSS e um pacote local para sincronizar conteúdo do Notion.

O template usa o workspace local `@local/astro-notion-cms`. O pacote busca todas as páginas acessíveis da data source, normaliza metadados, converte o conteúdo para Markdown, baixa cover/imagens e gera arquivos em `src/content/notion/<slug>/index.md`.

O sync não aplica filtros editoriais. O blog filtra depois pela collection `notion`, usando `properties.status === "Publicado"`.

## Estrutura

- `src/pages`: rotas da aplicação.
- `src/layouts`: layouts base de página e post.
- `src/components/layout`: componentes estruturais, como header, footer e container.
- `src/components/blog`: componentes de listagem, tags, cards e datas de posts.
- `src/components/seo`: metadados compartilhados da aplicação.
- `src/utils`: helpers para posts, tags e dados do blog.
- `src/styles`: estilos globais e markdown.
- `src/content`: conteúdo sincronizado ou dados locais.
- `packages/astro-notion-cms`: pacote local responsável pela integração com Notion.

## Frontmatter gerado

Os arquivos sincronizados seguem este formato:

```yaml
title: "Titulo da pagina"
slug: "titulo-da-pagina"
cover: "./cover.png"
page:
  id: "notion-page-id"
  url: "https://app.notion.com/..."
  createdTime: "2026-01-01T00:00:00.000Z"
  lastEditedTime: "2026-01-01T00:00:00.000Z"
properties:
  status: "Publicado"
  tags:
    - Astro
  author: "Autor"
```

- `page` guarda metadados da página Notion.
- `properties` guarda as propriedades da data source, normalizadas em `camelCase`.
- `cover` é o caminho local da cover baixada, ou `null` quando não houver cover.
- `icon`, `coverUrl`, `pageId` e campos editoriais flat não são injetados no topo.

## Comandos

```bash
npm install
npm run dev
npm run content:sync
npm run build
```

Copie `.env.example` para `.env` e preencha as variáveis necessárias para sincronizar o Notion:

```env
# Token da integracao interna do Notion.
NOTION_TOKEN=
# ID da data source do Notion usada pelo sync.
NOTION_DATA_SOURCE_ID=
# URL publica do site, usada por Astro, RSS e sitemap.
SITE_URL=
# PAT do GitHub usado por automacoes de deploy.
GITHUB_TOKEN=
# Usuario ou organizacao dona do repositorio no GitHub.
GITHUB_OWNER=
# Nome do repositorio no GitHub.
GITHUB_REPO=
# Branch usada por automacoes de deploy.
BRANCH=
```
