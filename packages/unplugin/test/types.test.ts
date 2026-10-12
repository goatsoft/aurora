import type { AuroraModule } from '@goatsoft/aurora'
import { expectTypeOf, it } from 'vitest'
import type hero from '../../../presets/goat/hero.aurora'

it('types .aurora imports as AuroraModule (client.d.ts)', () => {
  expectTypeOf<typeof hero>().toEqualTypeOf<AuroraModule>()
})
