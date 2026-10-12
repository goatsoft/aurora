import type { AuroraModule } from '@goatsoft/aurora'
import type hero from '~/presets/goat/hero.aurora'
import { expectTypeOf, it } from 'vitest'

it('types .aurora imports as AuroraModule (client.d.ts)', () => {
  expectTypeOf<typeof hero>().toEqualTypeOf<AuroraModule>()
})
