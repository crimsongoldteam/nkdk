function formatViolation({ from, to, rule }) {
  return `${rule.name}: ${from}${to ? ` -> ${to}` : ""}`
}

export function assertNoNewViolations(result) {
  const errors = result.summary.violations.filter(
    ({ rule }) => rule.severity === "error"
  )
  if (errors.length === 0) return

  throw new Error(
    `Новые архитектурные нарушения (${errors.length}):\n${errors
      .map(formatViolation)
      .join("\n")}`
  )
}
