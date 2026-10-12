import type { Generator } from '@/generators/define'
import type { AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora, stringifyAurora } from '@goatsoft/aurora-format'
import { describe, expect, inject, it } from 'vitest'
import { GENERATORS, loadGenerators } from '@/generators/index'
import { validateDocument } from '@/validate'

/**
 * Generator reference docs and starter presets are generated from the generators themselves, so
 * they can't drift. Regenerate with `pnpm test -u`.
 */
await loadGenerators()
const root = inject('root')
const builtins = Object.values(GENERATORS).filter((g) => !g.id.startsWith('test-'))

/** Gradients look better with a whisper of grain on top; elements and the aurora stand alone. */
const WITH_GRAIN = new Set(['mesh-gradient', 'linear-sweep', 'conic'])

function starter(g: Generator): AuroraInput {
  const layers: AuroraInput['layers'] = [{ type: g.id }]
  if (WITH_GRAIN.has(g.id)) layers.push({ type: 'grain', blend: 'overlay', colors: [g.palette.length], params: { amount: 0.06 } })
  return {
    format: 'aurora',
    version: 1,
    name: `${g.label} starter`,
    palette: WITH_GRAIN.has(g.id) ? [...g.palette, 'oklch(1 0 0)'] : [...g.palette],
    layers,
  }
}

function markdown(g: Generator): string {
  const rows = Object.entries(g.params).map(([name, p]) =>
    `| \`${name}\` | ${p.label} | ${p.default}${p.unit ? ` ${p.unit}` : ''} | ${p.min} to ${p.max} | ${p.description} |`)
  return `# ${g.label} (\`${g.id}\`)

${g.description}

![${g.label} with its defaults](/packages/core/test/golden/${g.id}.png)

Reads ${g.colors} palette colour${g.colors === 1 ? '' : 's'}, in order.${g.requires?.length ? ` Uses the noise library: ${g.requires.map((m) => `\`${m}\``).join(', ')}.` : ''}

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
${rows.join('\n')}

## Default palette

${g.palette.map((c) => `- \`${c}\``).join('\n')}

## Starter

[\`presets/starters/${g.id}.aurora\`](/presets/starters/${g.id}.aurora)

\`\`\`json
${stringifyAurora(starter(g)).trim()}
\`\`\`
`
}

describe('generated generator docs and starters', () => {
  it.each(builtins.map((g) => [g.id, g] as const))('%s', async (id, g) => {
    expect(await validateDocument(assertAurora(starter(g)))).toEqual([])
    await expect(markdown(g)).toMatchFileSnapshot(`${root}/docs/generators/${id}.md`)
    await expect(stringifyAurora(starter(g))).toMatchFileSnapshot(`${root}/presets/starters/${id}.aurora`)
  })

  it('indexes every generator', async () => {
    const list = builtins.map((g) => `| [${g.label}](${g.id}.md) | \`${g.id}\` | ${g.description} |`).join('\n')
    await expect(`# Generators\n\nGenerated from the generators' own definitions by \`packages/core/test/docs.test.ts\`; regenerate with \`pnpm test -u\`.\n\n| Generator | Id | |\n|---|---|---|\n${list}\n`).toMatchFileSnapshot(`${root}/docs/generators/README.md`)
  })
})
