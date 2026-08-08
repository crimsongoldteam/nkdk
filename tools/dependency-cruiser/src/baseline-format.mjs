const boundaryRuleNames = new Set([
  "not-in-allowed",
  "neutral-not-reach-implementations",
])

export function boundaryViolations(result) {
  return result.summary.violations.filter(({ rule }) =>
    boundaryRuleNames.has(rule.name)
  )
}

export function serializeBaseline(result) {
  return `${JSON.stringify(boundaryViolations(result), null, 2)}\n`
}
