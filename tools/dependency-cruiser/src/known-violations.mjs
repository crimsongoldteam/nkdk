function violationKey({ type, from, to, rule }) {
  const target = ["module", "reachability"].includes(type) ? "" : to ?? ""
  return `${type}|${from}|${target}|${rule.name}`
}

export function softenKnownViolations(result, knownViolations) {
  const knownKeys = new Set(knownViolations.map(violationKey))
  const violations = result.summary.violations.map((violation) => ({
    ...violation,
    rule: {
      ...violation.rule,
      severity: knownKeys.has(violationKey(violation))
        ? "ignore"
        : violation.rule.severity,
    },
  }))
  const count = (severity) =>
    violations.filter(({ rule }) => rule.severity === severity).length

  return {
    ...result,
    summary: {
      ...result.summary,
      violations,
      error: count("error"),
      warn: count("warn"),
      info: count("info"),
      ignore: count("ignore"),
    },
  }
}
