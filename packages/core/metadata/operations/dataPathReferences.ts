export function rewriteDataPathSegments(
  value: string,
  resolvedSegments: readonly string[],
  segmentIndex: number,
  nextName: string,
): string {
  const sourceSegments = value.split(".")
  return sourceSegments
    .map((segment, index) => {
      if (index !== segmentIndex) return segment
      const resolvedSegment = resolvedSegments[index] ?? ""
      const suffix = segment.slice(resolvedSegment.length)
      return `${nextName}${suffix}`
    })
    .join(".")
}
