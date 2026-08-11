export function aggregateCleanupFailures(primary: unknown, cleanup: unknown): AggregateError {
  const primaryFailures = flattenFailures(primary)
  return new AggregateError(
    [...primaryFailures, ...flattenFailures(cleanup)],
    failureMessage(primaryFailures[0] ?? primary),
  )
}

export function flattenFailures(caught: unknown): unknown[] {
  return caught instanceof AggregateError
    ? caught.errors.flatMap(flattenFailures)
    : [caught]
}

export function failureMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
