---
title: Colours
description: How the palette and each layer's colours fit together, and how to edit them.
order: 3
---

# Colours

Colours live in one place, the document's **palette**. Layers don't hold colours of their own: each layer points at palette colours. That is what keeps a background coherent, and it is why changing one colour can change several layers.

## Editing a layer's colours

Select a layer and open the **Colours** section of the **Layer** tab. Each row is one colour the layer uses, named for what it paints (for an aurora curtain: the base, the middle and the ray tips). Below the name is the palette colour it points at, and how many other layers use that colour too.

Click a swatch to open the picker:

- **Change the colour** in the picker. This edits the palette colour, so every layer that shares it changes as well.
- **Use another palette colour** to point this row at a different colour instead.
- **Give this layer its own copy** (shown when the colour is shared) adds a copy to the palette and points this row at it. After that, editing it changes only this layer.

## Editing the palette

The **Document** tab's **Palette** section lists every colour. Edit one there to change it everywhere it is used. Add colours with **+**; a palette holds up to 16.

## The picker

The picker works in OKLCH, so equal steps look like equal changes:

- **The plane** is lightness (up) by chroma, or colourfulness (right), at the current hue. The solid line is the edge of sRGB, the colours every screen shows; the dashed line is the edge of Display P3, which wide-gamut screens show. Colours past sRGB are shown as close as your screen can get.
- **The hue strip** sets the hue.
- **The text field** takes any CSS colour, such as `#4ade80` or `oklch(0.8 0.2 150)`.
- **Contrast** checks the colour against your page's text, for the page colour set with <kbd>L</kbd>.
- **Harmonies** suggest the complement, triads and neighbours of the current colour. Click one to add it to the palette.
