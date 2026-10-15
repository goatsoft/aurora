---
title: Accessibility
description: Reduced motion, playback, keyboard controls and readable content over Aurora backgrounds.
order: 8
---

# Accessibility

Aurora backgrounds are decorative. They stay `aria-hidden`, never receive keyboard focus, and leave your content and controls in the normal document order.

## Motion and playback

Aurora honours `prefers-reduced-motion`. The default is a still frame; a document can instead request slower animation or its CSS fallback. Signal distortion is disabled under reduced motion. Interactive scenes remove spring overshoot and replace travelling impulses with a quiet, still response.

Give visitors a visible way to stop animation as well. The Aurora website has a **Pause animations** button in the navigation. It pauses backgrounds throughout the site, including the gallery and documentation demos, and remembers the choice. Each interaction playground also has its own pause control. Studio's Play/Pause control holds the current frame without editing the document.

For your own site, connect a labelled button to `background.pause()` and `background.resume()`, or the Vue `paused` prop. Resuming preserves the animation's phase. A manual resume never overrides the visitor's reduced-motion preference. See [runtime playback controls](/docs/guide/runtime#playback-controls).

## Keyboard and touch

Website navigation, theme selection and playback controls work with a keyboard and show a visible focus outline. Use **Skip to content** to bypass the navigation.

Interaction playgrounds provide buttons as alternatives to gestures. Focus a scene to move its target with the arrow keys, press Enter to emit a pulse, or G to grab and release where supported. Escape resets it. Pointer dragging is opt-in so a touch gesture can still scroll the page. See [interaction controls](/docs/guide/interactions#keyboard-and-application-controls).

## Light and dark pages

The website defaults to **System**, following your system colour scheme. Choose **Light** or **Dark** in the navigation to override it, or choose **System** again to resume following your device. Both themes use separate text, link and focus colours; dark scene previews keep their own readable controls. Studio can preview a scene on light and dark pages, while keeping its editing panels dark.

`@goatsoft/color` provides `luminance` and `contrastRatio` for opaque OKLab/OKLCH colours, measured in sRGB. Use `contrastOn(foreground, background, canvas)` when colours have transparency; it composites them over the supplied opaque page before calculating contrast. `compositeOver` also supports sRGB and Display P3 compositing. Studio uses the composited contrast to label palette colours against the text in the selected light or dark page preview. That reading describes the selected colour on the page, rather than every pixel of a layered animation.

When placing text over a background, check every part of its motion in both themes. Put text on a sufficiently opaque panel or add a scrim when the colours behind it can change. Reduced motion does not fix low contrast.

## WCAG checks

WCAG 2.2 AA is the accessibility target for the website and Studio. We test keyboard controls, playback, reduced motion and theme contrast. Automated checks help find problems, but cannot establish full WCAG conformance on their own.

A background library cannot guarantee the accessibility of a page built with it. Your content, colour choices, overlays and custom interactions still need review, including text contrast, focus visibility and flashing effects. For normal text, aim for a contrast ratio of at least 4.5:1; large text and control boundaries need at least 3:1. Keep a pause control available whenever continuous animation appears alongside content.
