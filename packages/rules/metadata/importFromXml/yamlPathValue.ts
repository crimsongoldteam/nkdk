export function importedYamlValueAtPath(
  root: unknown,
  path: readonly (string | number)[],
): unknown {
  let value = root
  for (const segment of path) {
    if (value === null || typeof value !== "object") return undefined
    value = (value as Record<string | number, unknown>)[segment]
  }
  return value
}
