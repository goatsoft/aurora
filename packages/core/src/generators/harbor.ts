import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * City: a calm harbor, river or bay below the horizon, catching shimmering vertical columns of
 * reflected skyline and sky light across rippling water, with a glowing embankment along the
 * shoreline. Transparent above `horizon`, so the skyline and sky sit cleanly behind the shore.
 */
export const harbor = defineGenerator({
  id: 'harbor',
  label: 'Harbor',
  description: 'City: shoreline water below the horizon, with shimmering vertical light reflections and embankment lights.',
  colors: 3,
  palette: ['oklch(0.08 0.025 250)', 'oklch(0.24 0.065 235)', 'oklch(0.88 0.12 80)'],
  requires: ['simplex', 'hash'],
  params: {
    horizon: { default: 0.28, min: 0.08, max: 0.65, step: 0.01, label: 'Waterline', description: 'Height of the water from the bottom of the canvas.' },
    reflections: { default: 0.8, min: 0, max: 1, step: 0.01, label: 'Reflections', description: 'Brightness of the vertical light columns reflected across the water.' },
    columns: { default: 10, min: 3, max: 24, step: 1, label: 'Columns', description: 'How many skyline light columns reflect across the harbor.' },
    ripples: { default: 1, min: 0.2, max: 3, step: 0.05, label: 'Ripples', description: 'Higher gives finer horizontal ripples; lower gives broad swells.' },
    chop: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Chop', description: 'How much the waves break and widen the reflected columns.' },
    shoreline: { default: 0.65, min: 0, max: 1, step: 0.01, label: 'Shoreline', description: 'Brightness of the pier and embankment lights along the water\'s edge.' },
    speed: { default: 0.4, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How fast the water ripples.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different pattern of reflections.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let px = 1.0 / ctx.res.y;
  let shore = 1.0 - P.horizon;
  let mask = smoothstep(shore - px * 1.5, shore + px * 1.5, ctx.uv.y);
  let shoreGlow = exp(-abs(ctx.uv.y - shore) / max(px * 4.5, 0.004)) * P.shoreline * smoothstep(0.08, shore, ctx.uv.y);
  if (mask <= 1e-4 && shoreGlow <= 1e-4) { return vec4f(c[2], 0.0); }
  let v = clamp((ctx.uv.y - shore) / max(P.horizon, 0.04), 0.0, 1.0);
  let t = ctx.time * P.speed;
  let freqY = min(95.0 * P.ripples / (0.12 + 0.88 * v), ctx.res.y * 0.28);
  let wp = vec2f(ctx.uv.x * aspect * 5.5 + P.seed * 3.1, v * freqY * 0.14);
  let waveA = noise_simplex(wp + vec2f(t * 0.45, -t * 0.9));
  let waveB = noise_simplex(wp * vec2f(1.8, 2.3) + vec2f(-t * 0.55, t * 1.1) + 7.4);
  let ripple = (waveA * 0.65 + waveB * 0.35) * smoothstep(0.0, 0.06, v);
  let disp = ripple * P.chop * (0.014 + 0.038 * v);
  let n = P.columns;
  let x = (ctx.uv.x * aspect + disp) * n + P.seed * 5.7;
  let base = floor(x);
  var colLight = 0.0;
  var colTint = 0.0;
  for (var j = -1; j <= 1; j++) {
    let id = base + f32(j);
    let h = noise_hash22(vec2f(id, P.seed * 17.0 + 3.0));
    let cx = id + 0.2 + 0.6 * h.x;
    let width = (0.14 + 0.24 * h.y) * (1.0 + v * P.chop * 1.4);
    let reach = 0.25 + 0.75 * pow(h.x, 0.85);
    let fadeY = exp(-v / max(reach, 0.12)) * (1.0 - 0.25 * v);
    let dx = abs(x - cx) / width;
    let streak = exp(-dx * dx * 2.2) * fadeY * (0.35 + 0.65 * h.y);
    colLight += streak;
    colTint += streak * step(0.55, h.x);
  }
  let crest = smoothstep(-0.35, 0.75, ripple) * (0.55 + 0.45 * sin(v * freqY + waveA * 3.2 - t * 3.0));
  let refl = clamp(colLight * mix(0.65, 1.35 * crest, 0.45 + 0.5 * P.chop) * P.reflections, 0.0, 1.2);
  let waterBase = mix(c[1], c[0], pow(v, 0.65));
  let swell = clamp((ripple * 0.5 + 0.5) * (1.0 - v * 0.6) * 0.28, 0.0, 1.0);
  var col = mix(waterBase, c[1], swell);
  let reflHue = mix(c[2], c[1], clamp(colTint / max(colLight, 1e-4), 0.0, 1.0) * 0.45);
  col = mix(col, reflHue, clamp(refl, 0.0, 1.0));
  let lampX = ctx.uv.x * aspect * n * 3.2 + P.seed * 11.0;
  let lampH = noise_hash21(vec2f(floor(lampX), P.seed + 9.0));
  let lamps = (0.45 + 0.55 * exp(-pow((fract(lampX) - 0.5) * 3.2, 2.0)) * step(0.25, lampH)) * shoreGlow;
  col = mix(col, c[2], clamp(lamps, 0.0, 1.0));
  return vec4f(col, clamp(max(mask, lamps), 0.0, 1.0));
}
`,
  css: ({ colors, params, opacity }) => {
    const [deep, mid, light] = colors
    const h = Math.round(params.horizon * 100)
    return [
      `radial-gradient(45% ${Math.round(h * 0.85)}% at 50% ${100 - h}% in oklab, ${formatOklch({ ...light!, alpha: opacity * params.reflections * 0.55 })}, transparent)`,
      `linear-gradient(in oklab to top, ${formatOklch({ ...deep!, alpha: opacity })} 0 ${Math.round(h * 0.65)}%, ${formatOklch({ ...mid!, alpha: opacity * 0.95 })} ${h}%, transparent ${Math.min(100, h + 2)}%)`,
    ]
  },
})
