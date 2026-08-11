export interface DataPathDialectNamePair {
  readonly internal: string
  readonly yaml: string
}

export interface DataPathDialect {
  readonly serviceRoot: DataPathDialectNamePair
  readonly currentRow: DataPathDialectNamePair
}
