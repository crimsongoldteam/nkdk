export type CompletionRow = Record<string, unknown>

export type CompletionValue = {
  value: string
  label: string
  detail?: string
}

export function rowsToCompletionValues(rows: CompletionRow[]): CompletionValue[] {
  return rows.flatMap((row) => {
    const value = typeof row.value === "string" ? row.value : firstStringColumn(row)

    if (!value) {
      return []
    }

    const item: CompletionValue = {
      value,
      label: typeof row.label === "string" ? row.label : value,
    }

    if (typeof row.detail === "string") {
      item.detail = row.detail
    }

    return [item]
  })
}

function firstStringColumn(row: CompletionRow): string | undefined {
  return Object.values(row).find((value): value is string => typeof value === "string")
}
