export function recordedPath(path: string): string {
  const withSlashes = path.replaceAll("\\", "/")
  if (/^[a-z]:\//i.test(withSlashes)) return withSlashes.slice(2)
  if (path.startsWith("\\")) return withSlashes
  return path
}

export function recordedArgument(argument: string): string {
  const separator = argument.indexOf("=")
  if (separator < 0) return recordedPath(argument)
  return `${argument.slice(0, separator + 1)}${recordedPath(argument.slice(separator + 1))}`
}
