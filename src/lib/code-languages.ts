/**
 * Languages offered in the studio's code block.
 *
 * Kept in step with the grammars loaded in `src/lib/highlight.ts` — offering a
 * language the highlighter cannot render would silently produce plain output.
 */
export const CODE_LANGUAGES = [
  { value: 'text', label: 'Plain text' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'jsx', label: 'JSX' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'prisma', label: 'Prisma' },
  { value: 'python', label: 'Python' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'java', label: 'Java' },
  { value: 'dart', label: 'Dart' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'docker', label: 'Dockerfile' },
  { value: 'ini', label: 'INI / env' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'diff', label: 'Diff' },
] as const
