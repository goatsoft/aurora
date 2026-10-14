/**
 * What each palette colour paints, per built-in generator, in the order a layer's `colors` lists
 * them. For the generator reference docs (and anything else that explains how to recolour a
 * layer); kept out of the generator modules so it never ships with the runtime.
 */
export const COLOR_ROLES: Readonly<Record<string, readonly string[]>> = {
  'aurora-fbm': ['Ribbons, first colour', 'Ribbons, second colour', 'Ribbon highlights, and the right-hand end of `sweep`'],
  'mesh-gradient': ['First drifting colour point', 'Second colour point', 'Third colour point', 'Fourth colour point'],
  'linear-sweep': ['First colour along the sweep', 'Middle colour', 'Last colour'],
  'linear-gradient': ['Start of the gradient', 'Second stop', 'Third stop (with three or more stops)', 'Fourth stop (with four stops)'],
  'conic': ['First colour around the centre', 'Second colour', 'Third colour'],
  'grain': ['Grain'],
  'digital-rain': ['Dark field', 'Glyph trails', 'Bright leading glyphs'],
  'glitch': ['Dark field', 'First signal accent', 'Second signal accent'],
  'static': ['Dark field', 'Signal noise', 'Interference highlights'],
  'radar': ['Dark field', 'Sweep and range rings', 'Contact highlights'],
  'scanlines': ['Dark field', 'Raster lines', 'Rolling exposure highlights'],
  'phosphor': ['Dark field', 'First phosphor tint', 'Second phosphor tint'],
  'ping': ['Dark field', 'Pulse halo', 'Pulse cores'],
  'strata': ['Darkest layers', 'Middle layers', 'Lightest layers'],
  'mountains': ['Nearest ridges', 'Farthest ridges and the haze', 'Rim light on the crests, and valley mist'],
  'treeline': ['Nearest trees and the ground', 'Farthest trees', 'Glow along the horizon'],
  'clouds': ['Sky at the top', 'Shaded side of the clouds', 'Lit side of the clouds, and the sky near the horizon'],
  'wind': ['Faint parts of the streaks', 'The CSS fallback\'s wash (the WebGPU version doesn\'t use it)', 'Bright cores of the streaks'],
  'rain': ['Drops and haze'],
  'lightning': ['Sky flash', 'Bolt'],
  'fire': ['Base of the flames', 'Middle of the flames', 'Flame tips and embers'],
  'water': ['Deep water, towards the bottom', 'Shallow water, towards the top', 'Light patterns'],
  'curtain': ['Lower edge', 'Middle of the curtain', 'Upper fringe'],
  'starfield': ['Sky at the top', 'Sky at the bottom, and the milky way', 'Stars'],
}
