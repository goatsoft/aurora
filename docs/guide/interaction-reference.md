---
title: Interaction reference
order: 9
---

# Interaction reference

Generated from the shared interaction spec. See the [interaction guide](interactions.md) for examples and input behaviour. A document supports up to 8 modules, each with up to 64 bindings.

Activation: `hover` (hover), `focus` (focus), `both` (hover or focus). Default: `both`.

## Follow (`follow`)

Light follows the pointer, then eases back to rest.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `strength` | Strength | 1 | 0 to 2 | 0.01 | Response strength. |
| `smoothing` | Smoothing | 0.65 | 0 to 1 | 0.01 | Follow easing; 0 responds immediately. |
| `decay` | Settle time | 1 | 0.05 to 5 | 0.01 | Seconds for an impulse or return to settle. |

## Impulse (`impulse`)

A tap emits a pulse that fades away.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `strength` | Strength | 1 | 0 to 2 | 0.01 | Response strength. |
| `decay` | Settle time | 1 | 0.05 to 5 | 0.01 | Seconds for an impulse or return to settle. |

## Grab & Release (`grab`)

Pull the scene, then release it into a spring.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `strength` | Strength | 1 | 0 to 2 | 0.01 | Response strength. |
| `decay` | Settle time | 1 | 0.05 to 5 | 0.01 | Seconds for an impulse or return to settle. |
| `damping` | Damping | 0.75 | 0 to 1 | 0.01 | Grab spring damping; higher settles faster. |

## Bindings

Inputs: `x` (horizontal), `y` (vertical), `strength` (strength), `travel` (elapsed time). Only Impulse emits `travel` or uses pulse slots beyond zero. Signal bindings omit `layer`.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `amount` | Amount | 1 | -4 to 4 | 0.01 | Add this much to the authored control at full input; negative values repel. |
| `slot` | Pulse slot | 0 | 0 to 3 | 1 | Impulse slot, from newest (0) to oldest (3). |
