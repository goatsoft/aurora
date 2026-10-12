import { AuroraFormatError, parseAurora } from '@goatsoft/aurora-format'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import { documentOf } from './module'
import type { AuroraSource } from './module'
import { mountAurora } from './surface'
import type { AuroraMode, AuroraSurface } from './surface'
import { validateDocument } from './validate'

export type AuroraModeEvent = CustomEvent<{ mode: AuroraMode }>
export type AuroraErrorEvent = CustomEvent<{ error: Error }>

declare global {
  interface HTMLElementTagNameMap {
    'aurora-bg': AuroraBackgroundElement
  }
  interface HTMLElementEventMap {
    'aurora-mode': AuroraModeEvent
    'aurora-error': AuroraErrorEvent
  }
}

/** Fills its offset parent by default; any author style overrides it. */
const DEFAULT_STYLE = ':where(aurora-bg){display:block;position:absolute;inset:0;pointer-events:none}'

/** Loads and validates a `.aurora` file, with every problem named against its URL. */
export async function loadAurora(url: string | URL, init?: RequestInit): Promise<AuroraDocument> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`Could not load ${String(url)}: ${response.status} ${response.statusText}`.trim())
  const result = parseAurora(await response.text())
  const issues = result.ok ? validateDocument(result.doc) : result.issues
  if (issues.length || !result.ok) throw new AuroraFormatError(issues, String(url))
  return result.doc
}

/**
 * `<aurora-bg src="/hero.aurora" scene="landing">`: an Aurora background for any page, no framework
 * needed. Set `src`, or assign `source` a document or an imported `.aurora` module.
 *
 * Style it with `aurora-bg:state(webgpu)` and `aurora-bg:state(css)`. It fires `aurora-mode` when the
 * mode changes and `aurora-error` when a file can't be loaded or is invalid.
 */
export class AuroraBackgroundElement extends HTMLElement {
  static observedAttributes = ['src', 'scene']

  private surface: AuroraSurface | undefined
  private current: AuroraSource | undefined
  private loading: AbortController | undefined
  private readonly internals = this.attachInternals()

  /** What the background is showing: "css" until a WebGPU frame is on screen. */
  get mode(): AuroraMode {
    return this.surface?.mode ?? 'css'
  }

  /** The document or module being shown. Setting it replaces `src`. */
  get source(): AuroraSource | undefined {
    return this.current
  }

  set source(value: AuroraSource | undefined) {
    this.loading?.abort()
    this.show(value)
  }

  get src(): string {
    return this.getAttribute('src') ?? ''
  }

  set src(value: string) {
    this.setAttribute('src', value)
  }

  get scene(): string {
    return this.getAttribute('scene') ?? ''
  }

  set scene(value: string) {
    this.setAttribute('scene', value)
  }

  connectedCallback(): void {
    this.setAttribute('aria-hidden', 'true')
    this.setState('css')
    if (this.current) this.mount()
    else if (this.src) void this.load()
  }

  disconnectedCallback(): void {
    this.loading?.abort()
    this.surface?.dispose()
    this.surface = undefined
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
    if (previous === next || !this.isConnected) return
    if (name === 'src' && next) void this.load()
    else if (name === 'scene' && this.current) {
      this.surface?.dispose()
      this.surface = undefined
      this.mount()
    }
  }

  private async load(): Promise<void> {
    this.loading?.abort()
    const controller = new AbortController()
    this.loading = controller
    try {
      const doc = await loadAurora(new URL(this.src, document.baseURI), { signal: controller.signal })
      if (!controller.signal.aborted) this.show(doc)
    } catch (error) {
      if (controller.signal.aborted) return
      const reason = error instanceof Error ? error : new Error(String(error))
      console.error(`<aurora-bg> ${reason.message}`)
      this.dispatchEvent(new CustomEvent('aurora-error', { detail: { error: reason } }))
    }
  }

  private show(source: AuroraSource | undefined): void {
    this.current = source
    if (!source) {
      this.surface?.dispose()
      this.surface = undefined
      this.setState('css')
    } else if (this.surface) this.surface.update(source)
    else if (this.isConnected) this.mount()
  }

  private mount(): void {
    const source = this.current!
    this.surface = mountAurora(this, source, {
      ...(this.scene ? { scene: this.scene } : {}),
      onModeChange: (mode) => {
        this.setState(mode)
        this.dispatchEvent(new CustomEvent('aurora-mode', { detail: { mode } }))
      },
    })
    if (documentOf(source).canvas.fixed) this.style.position ||= 'fixed'
  }

  private setState(mode: AuroraMode): void {
    this.internals.states.delete(mode === 'css' ? 'webgpu' : 'css')
    this.internals.states.add(mode)
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('aurora-bg')) {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(DEFAULT_STYLE)
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  customElements.define('aurora-bg', AuroraBackgroundElement)
}
