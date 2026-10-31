---
description: Everything a gruff page can contain - frontmatter, callouts, code, links, wikilinks and the glossary.
order: 2
---

# Writing pages

A gruff page is a Markdown file that is also a Vue component. Everything here renders the same on GitHub as on your site, except Vue components and callouts, which GitHub shows as plain text.

## Frontmatter

YAML at the top of a page. All fields are optional.

```md
---
title: Installing the widget
sidebarTitle: Install
description: Get the widget running in five minutes.
order: 2
glossary: false
search: false
---
```

| Field | Effect |
| --- | --- |
| `title` | The page title in navigation, search and the head. Without it, the first `#` heading is the title (as plain text), and failing that the route. |
| `sidebarTitle` | A shorter label for the sidebar only. |
| `description` | Passed to your `useHead` for the meta description. |
| `order` | Sorts pages within a sidebar group (`navGroups`). Pages without one come after, by route. |
| `glossary: false` | Turns off glossary links on this page. |
| `search: false` | Leaves the page out of the search index. |

The layout receives everything as `frontmatter`, plus `toc` (the page's outline, below). Inside the page, `{{ frontmatter.title }}` works as in any Vue template.

## Headings and the outline

Headings get GitHub's ids (`## Install the widget` is `#install-the-widget`) and a `#` anchor link before their text with the class `heading-anchor`. Every `##` and `###` goes into `frontmatter.toc` as `{ id, text, level }`, which the docs layout shows as "On this page". Search indexes each `##` section separately, so a result opens at its heading.

## Callouts

```md
::: tip
Saves you a step.
:::

::: warning Mind the gap
A custom title replaces "Warning".
:::

::: details Show the full config
Collapsed until clicked.
:::
```

`tip`, `note`, `warning` and `danger` render `<div class="callout callout-tip" role="note">` with a `<p class="callout-title">`; `details` renders `<details class="callout callout-details">` with a `<summary>`. Style them in your stylesheet: gruff ships no CSS.

## Code

Fenced code is highlighted at build time by Shiki, in a light and a dark theme at once: each token carries `--shiki-light` and `--shiki-dark` custom properties, and your CSS picks one (see [the stylesheet in Getting started](getting-started.md#styles)).

````md
```ts [src/config.ts]
export const answer = 42 // [!code highlight]
const old = 1 // [!code --]
const new = 2 // [!code ++]
focus() // [!code focus]
```
````

- `[name]` after the language is a title, shown above the block (and used as the tab label in a code group).
- `// [!code highlight]`, `// [!code ++]`, `// [!code --]` and `// [!code focus]` mark lines with the classes `highlighted`, `diff add`, `diff remove` and `focused` (the `<pre>` also gets `has-focused`). Use the comment syntax of the block's language (`# [!code highlight]` in shell).
- Every block gets a copy button (`<CopyButton>`).

Blocks render as `<div class="code-block" data-lang="ts" data-title="src/config.ts">`, with `<div class="code-title">` when there is a title.

Built-in languages: `ts`, `js`, `vue`, `html`, `css`, `json`, `jsonc`, `sh`, `md`, `yaml`, `diff`, `toml`, `wgsl`, `luau` and `lua`. Others render as plain text; pass `highlight: { langs }` to change the list (it replaces the defaults, so include the ones you still want).

### Code groups

Tabs over several blocks, labelled by their titles (or their language when untitled):

````md
::: code-group

```sh [npm]
npm install widget
```

```sh [pnpm]
pnpm add widget
```

:::
````

The labels are in the prerendered HTML and the first block shows before the app starts, so nothing moves when the tabs come alive.

### Custom fences

`highlight.fences` takes over a language entirely, for live demos and the like. Each renderer gets the block's source, the highlighter and the markdown-it instance, and returns HTML (which may use your Vue components):

```ts [vite.config.ts]
gruff({
  // ...
  highlight: {
    fences: {
      demo: (source, code, md) => `<LiveDemo source="${md.utils.escapeHtml(source)}" code="${md.utils.escapeHtml(code(source, 'vue'))}" />\n`,
    },
  },
})
```

A ` ```demo ` block now renders `<LiveDemo>` with its source and the highlighted HTML. Escape anything that goes into an attribute.

## Links

Write links the way GitHub resolves them, and they work in both places:

| You write | On the site |
| --- | --- |
| `[Setup](guide/setup.md)` | The page's route (`/docs/guide/setup`), via your `route()` |
| `[Setup](guide/setup.md#install)` | The route with the anchor |
| `[the config](../vite.config.ts)` | The file on GitHub (`repoUrl` + its path), in a new tab |
| `[a page outside the site](/CONTRIBUTING.md)` | A leading `/` is the repository root (`root`); not a page, so GitHub |
| `[MDN](https://developer.mozilla.org)` | Opens in a new tab |
| `[mail](mailto:hi@example.com)` | Unchanged |

A `.md` file your `route()` returns `undefined` for is treated as a repository file and linked on GitHub.

## Images

Relative images (`![Diagram](./diagram.png)`) and repository-absolute ones (`![Logo](/assets/logo.svg)`) are bundled by Vite, so they get hashed file names. Every image gets `loading="lazy"` and `decoding="async"`.

## Wikilinks

`[[Getting Started]]` links to `/docs/getting-started`; `[[the setup guide|Setup#Install]]` shows "the setup guide" and links to `/docs/setup#install`. Names are slugged (lowercase, runs of other characters become `-`). The prefix is the `wikiBase` option, `/docs/` by default. Wikilinks get the class `wikilink`.

## The glossary

Point the `glossary` option at a Markdown file with one `##` heading per term:

```md [docs/glossary.md]
# Glossary

## CSS fallback

The background shown when WebGPU isn't available.

Aliases: fallback, CSS version
```

On every other page, the first use of each term (or alias) in a paragraph or list item becomes `<Term id="css-fallback">`, a link to its entry with the definition on hover. Longer names win ("CSS fallback" before "CSS"). Terms inside links, code and headings are left alone, and so is the glossary page itself. `virtual:gruff` exports the parsed entries as `glossary`. Glossary links pick up edits to the glossary without restarting the dev server.

## Vue in pages

Pages are Vue templates, so components and expressions work:

```md
Current version: {{ version }}

<VersionPicker />

<script setup>
import VersionPicker from '../src/components/VersionPicker.vue'
const version = '1.2.0'
</script>
```

Components registered globally (with `app.component`) need no import. HTML in Markdown is allowed, and URLs in text become links.
