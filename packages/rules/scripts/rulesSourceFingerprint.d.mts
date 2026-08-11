export interface RulesSourceEntry {
  readonly path: string
  readonly content: string
}

export function fingerprintRulesSourceTree(root: string | URL, entrypoints: readonly string[]): string
export function fingerprintRulesSources(entries: readonly RulesSourceEntry[]): string
