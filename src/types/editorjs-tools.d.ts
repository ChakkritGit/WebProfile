/**
 * These Editor.js tools ship JS without bundled type declarations. They are
 * only ever passed to Editor.js's `tools` map, which types them as
 * `ToolConstructable`, so a nominal class shape is enough — and it keeps
 * `strict` on for the rest of the codebase.
 */
declare module '@editorjs/checklist' {
  const Checklist: new (...args: unknown[]) => unknown
  export default Checklist
}

declare module '@editorjs/marker' {
  const Marker: new (...args: unknown[]) => unknown
  export default Marker
}

declare module '@editorjs/link' {
  const LinkTool: new (...args: unknown[]) => unknown
  export default LinkTool
}

declare module '@editorjs/embed' {
  /**
   * One entry of the service table the tool assembles in `prepare` — the same
   * shape the package documents for `config.services`. Declared here because
   * `embed-tool.ts` reads the table to turn a pasted URL into embed data rather
   * than keeping a second copy of seventeen services' URL patterns.
   */
  export interface EmbedServiceConfig {
    regex: RegExp
    embedUrl: string
    html: string
    height?: number
    width?: number
    id?: (groups: string[]) => string
  }
  const Embed: {
    new (...args: unknown[]): unknown
    services: Record<string, EmbedServiceConfig>
  }
  export default Embed
}

declare module '@editorjs/attaches' {
  const Attaches: new (...args: unknown[]) => unknown
  export default Attaches
}

declare module 'editorjs-toggle-block' {
  const ToggleBlock: new (...args: unknown[]) => unknown
  export default ToggleBlock
}

declare module 'editorjs-alert' {
  const Alert: new (...args: unknown[]) => unknown
  export default Alert
}

declare module 'editorjs-text-alignment-blocktune' {
  const AlignmentTune: new (...args: unknown[]) => unknown
  export default AlignmentTune
}
