---
title: Previewing
description: Viewport sizes, the CSS fallback, motion and reduced motion.
order: 4
---

# Previewing

## Sizes

The viewport buttons in the top bar, or <kbd>1</kbd> to <kbd>5</kbd>, show the background at common sizes: **Hero** (1440 × 720), **Panel** (960 × 540), **Tile** (420 × 420), **Phone** (390 × 844) and **Full page**. Some generators adapt to the shape, so check the sizes your page uses.

<kbd>L</kbd> switches between a dark and a light page, which changes the sample text and the picker's contrast check.

## The CSS fallback

Browsers without WebGPU show a CSS gradient compiled from the same file. The preview menu shows **WebGPU**, the **CSS fallback**, or both **side by side**, with a fidelity score: the average colour difference (ΔE-OK) between the two. Lower is closer. See [What shows first](../guide/runtime.md#what-shows-first).

## Motion

The playback bar plays and pauses the animation (<kbd>Space</kbd>) and sets its speed. The speed in the **Document** tab's **Motion** section is saved with the file; the playback speed is only for previewing.

**Preview reduced motion** shows what visitors who ask their system for less motion will see, as set by the document's reduced-motion setting.

## Focus

<kbd>F</kbd> hides the panels so you see only the background. Press <kbd>F</kbd> or <kbd>Esc</kbd> to bring them back.
