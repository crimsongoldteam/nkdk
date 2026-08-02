export interface RulesSourceEntry {
  readonly path: string
  readonly content: string
}

export function fingerprintRulesSourceTree(root: string | URL): string
export function fingerprintRulesSources(entries: readonly RulesSourceEntry[]): string
