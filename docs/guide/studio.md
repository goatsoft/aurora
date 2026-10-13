---
title: Aurora Studio
description: The builder, where your files live, and how it saves to your project.
order: 3
---

# Aurora Studio

[Studio](/studio/) is the editor: a live canvas filling the window, with panels for layers, parameters, motion and the preset gallery. Press <kbd>⌘K</kbd> (<kbd>Ctrl K</kbd>) for every command.

- **Adjust parameters.** Drag a field left or right to change its value; hold <kbd>⇧</kbd> for bigger steps and <kbd>⌥</kbd> for smaller ones. Click to type a value; double-click to reset it.
- **An OKLCH picker** with the sRGB and Display P3 gamut boundaries drawn on the plane, a contrast check against your page's text, and harmonies.
- **WebGPU and CSS side by side**, with a fidelity score: the average colour difference (ΔE-OK) between the CSS fallback and the WebGPU frame.
- **Undo, autosave and share links.** Your work is kept in this browser between visits. A share link contains the whole document.
- **Export** a `.aurora` file, copy a Vue, HTML or CSS snippet, or save a poster PNG.

## Where your files live

Studio has no server: it opens and saves files on your machine. Share links are the exception. They contain the document in the link itself, so anyone with the link can open it.

- **Chromium browsers** can open a `.aurora` file, or a whole folder of them, and <kbd>⌘S</kbd> saves in place.
- **Other browsers** download the file when you save.

## Editing your project's files

In a Vite project with the bundler plugin, the dev server prints an **Aurora Studio** link. Open it, and Studio lists your project's `.aurora` files and saves edits straight back to disk, where hot reload updates your page.

Without Vite, use the `aurora` command. It comes with the bundler plugin, so install `@goatsoft/aurora-unplugin` first, then run this in your project:

```sh
npx aurora studio
```

::: note What the connection can do
The connection needs the session token in the link your terminal printed. Only `.aurora` files inside the project can be read or written, only valid documents are saved, and only Studio and localhost may call it.
:::
