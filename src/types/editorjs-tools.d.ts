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
  const Embed: new (...args: unknown[]) => unknown
  export default Embed
}
