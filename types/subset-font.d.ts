// subset-font ships no types; this is the part gruff's prerender uses.
declare module 'subset-font' {
  type Axis = number | { min: number, max: number, default?: number }
  interface Options {
    targetFormat?: 'woff2' | 'woff' | 'sfnt' | 'truetype'
    variationAxes?: Record<string, Axis>
  }
  export default function subsetFont(font: Uint8Array, text: string, options?: Options): Promise<Uint8Array>
}
