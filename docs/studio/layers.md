---
title: Layers and parameters
description: Add, order, hide and tune the layers of a background.
order: 2
---

# Layers and parameters

A background is a stack of layers, drawn bottom to top. Each layer uses one [generator](../generators/README.md), such as a gradient, an aurora curtain or a treeline, and has its own parameters.

## The layer list

- **Add a layer** with the **+** button above the list, or from the command menu (<kbd>⌘K</kbd>, then type the generator's name). A background holds up to 16 layers.
- **Reorder** by dragging a row, or with <kbd>⌥↑</kbd> and <kbd>⌥↓</kbd>.
- **Hide** a layer with the eye button, or <kbd>M</kbd>. Hidden layers are still saved; they are only left out of the preview.
- **Delete** with the bin button on the row, or <kbd>⌫</kbd>. <kbd>⌘Z</kbd> brings it back.
- **Duplicate** with <kbd>⌘D</kbd>.

## Parameters

Select a layer and its parameters appear in the inspector's **Layer** tab. Every parameter has a range and a default, and the generator's page in the docs says what each one does.

- **Drag** a field left or right to change it. Hold <kbd>⇧</kbd> for bigger steps and <kbd>⌥</kbd> for smaller ones.
- **Click** a field to type a value.
- **Double-click** to reset it to the default.
- **Seed** parameters pick a different random variation of the same look. Press <kbd>R</kbd> or the shuffle button for a new one.

A drag is one undo step, however far you move.

## Compositing

The **Compositing** section sets how a layer combines with the layers under it:

- **Blend**: the blend mode, such as screen or multiply.
- **Opacity**: how strongly the layer shows.
- **Mix in**: the colour space the layer's colours blend in. OKLab gives even, natural gradients; sRGB matches the classic presets exactly.
- **Mask**: limits the layer to part of the canvas with a linear or radial fade.

## Changing the generator

The generator menu at the top of the **Layer** tab swaps the layer's generator and keeps any parameters the two share. Its colours and compositing stay as they are.
