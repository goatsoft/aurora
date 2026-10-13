---
title: Saving and sharing
description: Where your files live, exporting, share links, and editing your project's files.
order: 5
---

# Saving and sharing

Studio has no server. Your current document is kept in this browser between visits, and files are opened from and saved to your machine.

## Files

- **Chromium browsers** can open a `.aurora` file (<kbd>⌘O</kbd>) or a whole folder of them, and <kbd>⌘S</kbd> saves in place.
- **Other browsers** download the file when you save.
- **Drop** a `.aurora` file anywhere on Studio to open it.

Studio only saves or exports a document that is valid. If something is out of range, it says what and where.

## Export

**Export** in the top bar gives you the `.aurora` file, a Vue, HTML or CSS snippet to paste into a page, or a poster PNG.

Turn on **Use Tailwind classes** and the Vue and HTML snippets use `class="relative"` instead of an inline style. Studio remembers the setting.

## Share links

**Copy share link** puts the whole document in the link itself. Anyone with the link can open it in Studio, and nothing is uploaded anywhere.

## Editing your project's files

In a Vite project with the bundler plugin, the dev server prints an **Aurora Studio** link. Open it, and Studio lists your project's `.aurora` files and saves edits straight back to disk, where hot reload updates your page.

Without Vite, use the `aurora` command. It comes with the bundler plugin, so install `@goatsoft/aurora-unplugin` first, then run this in your project:

```sh
npx aurora studio
```

::: note What the connection can do
The connection needs the session token in the link your terminal printed. Only `.aurora` files inside the project can be read or written, only valid documents are saved, and only Studio and localhost may call it.
:::
