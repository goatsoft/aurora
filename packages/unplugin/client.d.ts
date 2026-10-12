/** Types for `import hero from './hero.aurora'`. Add "@goatsoft/aurora-unplugin/client" to tsconfig `types`. */
declare module '*.aurora' {
  import type { AuroraModule } from '@goatsoft/aurora'

  const aurora: AuroraModule
  export default aurora
}
