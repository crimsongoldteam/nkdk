export function serializeBaseline(result) {
  return `${JSON.stringify(result.summary.violations, null, 2)}\n`
}
