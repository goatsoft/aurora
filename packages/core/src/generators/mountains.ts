import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Mountains: layered ridge silhouettes receding into haze, for horizons under an aurora or a
 * sky. Each ridge is ridged fbm along the horizon, so peaks are sharp and valleys soft; farther
 * ridges are lower, smaller and fade towards the haze colour (atmospheric perspective), mist pools
 * in the valleys, and the crests catch a thin rim of light from the sky. Above the farthest ridge
 * the layer is transparent, so whatever is beneath shows through. Ridges drift at different
 * speeds, for a slow parallax.
 */
export const mountains = defineGenerator({
  id: 'mountains',
  label: 'Mountains',
  description: 'Earth: a few peaks on layered ridges, fading into haze, with valley mist and lit crests.',
  colors: 3,
  palette: ['oklch(0.09 0.02 270)', 'oklch(0.36 0.06 268)', 'oklch(0.86 0.11 190)'],
  requires: ['fbm', 'hash'],
  params: {
    ridges: { default: 3, min: 1, max: 6, step: 1, label: 'Ridges', description: 'How many layers of mountains.' },
    peaks: { default: 1.6, min: 1, max: 8, step: 0.1, label: 'Peaks', description: 'How many peaks stand across the nearest ridge; farther ridges have a few more.' },
    height: { default: 0.55, min: 0.1, max: 0.95, step: 0.01, label: 'Height', description: 'How high the tallest peaks reach, as a fraction of the canvas.' },
    roughness: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Roughness', description: 'Gentle hills or jagged peaks.' },
    haze: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Haze', description: 'How much the far ridges fade into the distance.' },
    mist: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Mist', description: 'Mist pooling in the valleys between ridges.' },
    rim: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Rim light', description: 'Light catching the crests.' },
    speed: { default: 0.2, min: 0, max: 2, step: 0.01, label: 'Drift', description: 'How fast the ridges slide past (near ones faster).' },
    scale: { default: 1, min: 0.3, max: 3, step: 0.05, label: 'Scale', description: 'Width of the mountains.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different range.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
// A ridge is a handful of peaks: one per cell along the horizon, each placed, sized and shaped
// by a hash, with concave slopes; ridged noise roughens the rock without adding peaks.
fn crest(x: f32, k: f32, P: Params) -> f32 {
  let cell = floor(x);
  var h = 0.0;
  for (var j = -1; j <= 1; j++) {
    let c = cell + f32(j);
    let r = noise_hash22(vec2f(c, k * 13.7 + P.seed));
    let tall = noise_hash21(vec2f(c * 1.7 + 5.0, k + P.seed));
    let d = x - (c + 0.25 + 0.5 * r.x);
    // Uneven shoulders: one flank longer than the other.
    let w = (0.42 + 0.33 * r.y) * select(1.0, 1.0 + 0.7 * tall, d > 0.0);
    let s = max(1.0 - abs(d) / w, 0.0);
    // A sharp summit on smooth flanks: smoothstep for the shoulders, a power for the tip.
    h = max(h, (0.55 + 0.45 * tall) * mix(s * s * (3.0 - 2.0 * s), pow(s, 0.8), 0.5));
  }
  let rock = noise_ridged(vec2f(x * 4.0, k * 7.3 + P.seed), 4) - 0.5;
  // Foothills between the peaks, so valleys never drop to a flat line.
  let hills = 0.18 + 0.1 * noise_fbm(vec2f(x * 0.9, k + 2.0), 2);
  return max(h, hills) * (1.0 + rock * P.roughness * 0.3);
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let px = 1.0 / ctx.res.y;
  let n = i32(P.ridges);
  var col = c[1];
  var alpha = 0.0;
  for (var i = 0; i < 6; i++) {
    if (i >= n) { break; }
    let k = select(f32(i) / (f32(n) - 1.0), 1.0, n == 1);
    let far = 1.0 - k;
    let x = ctx.uv.x * P.peaks * (1.0 + far * 0.35) / P.scale + ctx.time * P.speed * 0.015 * (0.25 + k) * P.peaks + f32(i) * 3.7;
    let top = 1.0 - P.height * (1.0 - 0.5 * k);
    let span = P.height * (0.8 + 0.2 * k);
    let y = top + (1.0 - crest(x, f32(i), P)) * span;
    let inside = smoothstep(y - px, y + px, ctx.uv.y);
    let depth = max(ctx.uv.y - y, 0.0);
    let shade = mix(c[0], c[1], pow(far, 1.3) * mix(0.3, 1.0, P.haze));
    let rim = P.rim * 0.6 * exp(-depth / (px * (1.5 + 2.5 * k))) * (0.4 + 0.6 * far);
    let mist = P.mist * smoothstep(0.0, 0.12 + 0.2 * k, depth) * far * 0.7;
    let body = mix(mix(shade, c[2], rim), mix(c[1], c[2], 0.12), mist);
    col = mix(col, body, inside);
    alpha = max(alpha, inside);
  }
  return vec4f(col, alpha);
}
`,
  css: ({ colors, params, opacity }) => {
    const [near, far] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    const h = Math.round(params.height * 100)
    return [
      `linear-gradient(in oklab to top, ${near!} 0 ${Math.round(h * 0.35)}%, ${far!} ${Math.round(h * 0.7)}%, transparent ${h}%)`,
    ]
  },
})
