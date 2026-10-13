---
title: Introduction
description: What Aurora is, and how its pieces fit together.
order: 0
---

# Introduction

Aurora draws animated backgrounds for web pages. You design one in [Aurora Studio](guide/studio.md), save it as a `.aurora` file, and add it to a page. WebGPU renders it. Browsers without WebGPU show a CSS gradient that approximates it, compiled from the same file.

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

That file is the whole background, and it's running above. Press **Edit** to change it, or **Studio** to open it in the builder.

## How it fits together

- **The file.** A `.aurora` file is a JSON file containing colours, layers and animation settings. It contains settings, not executable shader code. See [the format](guide/format.md).
- **The runtime.** `@goatsoft/aurora` renders every background on the page with one GPU device, in a worker where the browser supports it, and pauses backgrounds that are off screen. See [the runtime](guide/runtime.md).
- **The bindings.** `<AuroraBackground>` for Vue, `<aurora-bg>` for any page, `mountAurora()` for plain TypeScript. With the bundler plugin, files are checked and typed at build time.
- **Studio.** The editor, for adjusting layers, colours and motion. It opens and saves files on your machine. See [Aurora Studio](guide/studio.md).

## Where next

- [Getting started](guide/getting-started.md): install it and put a background on a page.
- [Generators](generators/README.md): every built-in generator and its parameters.
- [Glossary](glossary.md): the words these docs use.
