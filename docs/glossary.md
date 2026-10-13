---
title: Glossary
description: The words these docs use.
search: true
---

# Glossary

## Generator

A built-in WGSL program that draws one kind of background, such as an aurora, clouds or fire, from typed parameters. A layer's `type` names its generator.

## Layer

One generator in a document's stack, with its parameters, colours, blend mode, opacity and an optional mask.

Aliases: layers

## Palette

A document's colours, referenced by index from each layer's `colors`.

## CSS fallback

The background as plain CSS gradients, compiled from the same layers. It paints first, and stays where WebGPU isn't available.

Aliases: fallback

## Scene

A named group of backgrounds that share one clock and one continuous field, so separate panels read as one.

## OKLCH

A perceptual colour space: lightness, chroma and hue. Aurora's palettes are written in it.

## OKLab

The perceptual space OKLCH is the polar form of. Aurora blends colours in it, so mixes stay vivid.

## ΔE-OK

The distance between two colours in OKLab. Studio's fidelity score is the mean ΔE-OK between the WebGPU frame and the CSS fallback.

## Display P3

A wider colour gamut than sRGB, shown by most modern screens. Aurora renders in it when it's available.

Aliases: P3
