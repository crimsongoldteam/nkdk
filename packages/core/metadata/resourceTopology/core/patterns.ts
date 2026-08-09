export function matchMetadataPathPattern(
  pattern: string,
  path: string
): Readonly<Record<string, string>> | undefined {
  const patternParts = splitPath(pattern)
  const pathParts = splitPath(path)
  const values: Record<string, string> = {}

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const remaining = patternPart.match(/^\{([^}]+)\.\.\.\}$/)
    if (remaining !== null) {
      if (index !== patternParts.length - 1 || index >= pathParts.length) return undefined
      return addValue(values, remaining[1], pathParts.slice(index).join("/")) ? values : undefined
    }

    const pathPart = pathParts[index]
    if (pathPart === undefined) return undefined
    const segmentValues = matchSegment(patternPart, pathPart)
    if (segmentValues === undefined) return undefined
    for (const [key, value] of Object.entries(segmentValues)) {
      if (!addValue(values, key, value)) return undefined
    }
  }

  return patternParts.length === pathParts.length ? values : undefined
}

export function expandMetadataPathPattern(
  pattern: string,
  values: Readonly<Record<string, string>>
): string {
  return pattern.replace(/\{([^}]+?)(?:\.\.\.)?\}/g, (placeholder, key: string) => values[key] ?? placeholder)
}

export function joinMetadataPathPatterns(base: string, tail: string): string {
  const normalizedBase = base.replace(/^\/+|\/+$/g, "")
  const normalizedTail = tail.replace(/^\/+|\/+$/g, "")
  if (normalizedBase === "") return normalizedTail
  if (normalizedTail === "") return normalizedBase
  return `${normalizedBase}/${normalizedTail}`
}

function splitPath(value: string): string[] {
  if (value === "") return []
  return value.replace(/\\/g, "/").split("/")
}

function matchSegment(pattern: string, value: string): Readonly<Record<string, string>> | undefined {
  const keys = [...pattern.matchAll(/\{([^}]+)\}/g)].map((match) => match[1])
  if (keys.length === 0) return pattern === value ? {} : undefined

  const expression = new RegExp(
    `^${pattern
      .split(/\{[^}]+\}/g)
      .map(escapeRegExp)
      .join("(.+)")}$`
  )
  const match = value.match(expression)
  if (match === null) return undefined

  const values: Record<string, string> = {}
  for (const [index, key] of keys.entries()) {
    const matched = match[index + 1]
    if (matched === undefined || !addValue(values, key, matched)) return undefined
  }
  return values
}

function addValue(values: Record<string, string>, key: string, value: string): boolean {
  const previous = values[key]
  if (previous !== undefined && previous !== value) return false
  values[key] = value
  return true
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
