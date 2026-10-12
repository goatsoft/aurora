---
title: Introduction
description: What Aurora is, and how its pieces fit together.
order: 0
---

# Introduction

Aurora is animated backgrounds for the web. You design one in [Aurora Studio](guide/studio.md), save it as a `.aurora` file, and drop it into any page. WebGPU renders it; browsers without WebGPU get a CSS fallback compiled from the same file, so nobody sees a blank box.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Northern sky",
  "palette": ["oklch(0.12 0.03 260)", "oklch(0.82 0.19 158)", "oklch(0.72 0.14 195)", "oklch(0.58 0.2 305)"],
  "layers": [
    { "type": "starfield", "colors": [0, 2, 2] },
    { "type": "aurora-fbm", "blend": "screen", "colors": [2, 3, 1], "params": { "intensity": 0.8, "stretch": 0.4 } }
  ]
}
```

That's a whole background, running live above. Press **Edit** to change it, or **Studio** to open it in the builder.

## How it fits together

- **The file.** A `.aurora` file is declarative JSON: a palette in OKLCH, and a stack of layers, each a built-in generator with its parameters, a blend mode and an optional mask. It can never contain code. See [the format](guide/format.md).
- **The runtime.** `@goatsoft/aurora` composes one WGSL shader per layer stack and renders every background on the page from one GPU device, in a worker where the browser allows. It pauses off-screen and keeps to a shared frame budget. See [the runtime](guide/runtime.md).
- **The bindings.** `<AuroraBackground>` for Vue, `<aurora-bg>` for any page, `mountAurora()` for plain TypeScript. With the bundler plugin, files are validated and typed at build time and their CSS fallback is in your server-rendered HTML.
- **Studio.** The builder: a live canvas with layers, generated controls, an OKLCH picker and a CSS fidelity score. It opens and saves files on your machine.

## Where next

- [Getting started](guide/getting-started.md): install it and put a background on a page.
- [Generators](generators/README.md): every built-in generator and its parameters.
- [Glossary](glossary.md): the words these docs use.
