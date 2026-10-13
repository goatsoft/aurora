---
title: Aurora Studio
description: The builder, where your files live, and how it saves to your project.
order: 3
---

# Aurora Studio

[Studio](/studio/) is the builder: a full-bleed live canvas, with glass panels for layers, the inspector, motion and the gallery. Press <kbd>⌘K</kbd> (<kbd>Ctrl K</kbd>) for every command.

- **Generated controls.** Every generator's parameters become scrubbable fields. Drag a label to scrub; hold <kbd>⇧</kbd> for big steps and <kbd>⌥</kbd> for fine ones; double-click to reset.
- **An OKLCH picker** with the sRGB and Display P3 gamut boundaries drawn on the plane, a contrast check against your page's text, and harmonies.
- **WebGPU and CSS side by side**, with a fidelity score: how closely the fallback matches the real thing, in ΔE-OK.
- **Undo, autosave and share links.** Your work is kept in the browser between visits, and a share link carries the whole document in the URL.
- **Export** a `.aurora` file, copy a Vue, HTML or CSS snippet, or save a poster PNG.

## Where your files live

Files stay on your machine. Studio never uploads them.

- **Chromium browsers** can open a `.aurora` file, or a whole folder of them, and <kbd>⌘S</kbd> saves in place.
- **Other browsers** download the file when you save.

## Editing your project's files

In a Vite project with the bundler plugin, the dev server prints an **Aurora Studio** link. Open it, and Studio lists your project's `.aurora` files and saves edits straight back to disk, where hot reload updates your page.

Without Vite, run this in your project:

```sh
npx aurora studio
```

::: note Safe by design
The connection needs the session token in the link your terminal printed. Only `.aurora` files inside the project can be read or written, only valid documents are saved, and only Studio and localhost may call it.
:::
