import { expandImportPattern } from "./routes"
import type { XmlImportRoute } from "./types"

export type XmlImportRouteMatch =
  | {
      kind: "assignment"
      route: Extract<XmlImportRoute, { kind: "assignment" }>
      targetProjectPath: string
      values: Record<string, string>
    }
  | {
      kind: "externalFile"
      route: Extract<XmlImportRoute, { kind: "externalFile" }>
      targetProjectPath: string
      assignmentTargetProjectPath: string
      values: Record<string, string>
    }
  | { kind: "ignore"; route: Extract<XmlImportRoute, { kind: "ignore" }>; values: Record<string, string> }

export interface CompiledXmlImportRoute {
  route: XmlImportRoute
  pattern: CompiledXmlPattern
}

export interface XmlImportRouteStructure {
  readonly routesByFirstSegment: ReadonlyMap<string, readonly CompiledXmlImportRoute[]>
  readonly fallbackRoutes: readonly CompiledXmlImportRoute[]
}

export interface XmlImportRouteMatchOptions {
  onPatternVisited?: () => void
}

interface CompiledXmlPattern {
  segments: readonly CompiledXmlPatternSegment[]
}

type CompiledXmlPatternSegment =
  | { kind: "static"; value: string }
  | { kind: "template"; parts: readonly CompiledTemplatePart[] }
  | { kind: "rest"; key: string }

type CompiledTemplatePart = { kind: "literal"; value: string } | { kind: "parameter"; key: string }

const MAX_XML_ROUTE_RECURSION_DEPTH = 16

export function compileXmlImportRouteStructure(routes: readonly XmlImportRoute[]): XmlImportRouteStructure {
  const routesByFirstSegment = new Map<string, CompiledXmlImportRoute[]>()
  const fallbackRoutes: CompiledXmlImportRoute[] = []
  for (const route of routes.flatMap(expandRouteRecursion)) {
    const compiled = { route, pattern: compilePattern(route.xmlPattern) }
    const first = compiled.pattern.segments[0]
    if (first?.kind === "static") {
      routesByFirstSegment.set(first.value, [...(routesByFirstSegment.get(first.value) ?? []), compiled])
    } else {
      fallbackRoutes.push(compiled)
    }
  }
  return { routesByFirstSegment, fallbackRoutes }
}

export function matchXmlImportRouteStructure(
  structure: XmlImportRouteStructure,
  path: string,
  options: XmlImportRouteMatchOptions = {}
): XmlImportRouteMatch[] {
  const pathSegments = path.split("/")
  const matches: XmlImportRouteMatch[] = []
  const candidates = [...(structure.routesByFirstSegment.get(pathSegments[0] ?? "") ?? []), ...structure.fallbackRoutes]
  for (const compiled of candidates) {
    options.onPatternVisited?.()
    const values = matchCompiledPattern(compiled.pattern, pathSegments)
    if (values === undefined) continue
    matches.push(createMatch(compiled.route, values))
  }
  return matches
}

function compilePattern(pattern: string): CompiledXmlPattern {
  return { segments: pattern.split("/").map(compileSegment) }
}

function expandRouteRecursion(route: XmlImportRoute): XmlImportRoute[] {
  const recursion = route.recursion
  if (recursion === undefined || !startsWithPatternRoot(route.xmlPattern, recursion.xmlRootPattern)) return [route]
  const result: XmlImportRoute[] = [route]
  for (let depth = 1; depth <= MAX_XML_ROUTE_RECURSION_DEPTH; depth += 1) {
    const xmlRootPattern = nestedRootPattern(recursion.xmlRootPattern, recursion.xmlChildDir, depth)
    const targetRootPattern = nestedRootPattern(recursion.targetRootPattern, recursion.targetChildDir, depth)
    const xmlPattern = replacePatternRoot(route.xmlPattern, recursion.xmlRootPattern, xmlRootPattern)
    if (route.kind === "ignore") {
      result.push({ ...route, xmlPattern })
      continue
    }
    const targetPattern = replacePatternRoot(route.targetPattern, recursion.targetRootPattern, targetRootPattern)
    if (route.kind === "assignment") {
      result.push({
        ...route,
        xmlPattern,
        targetPattern,
        role: recursion.assignmentRole,
        inputRole: route.inputRole ?? (route.role === "fileItem" || route.source.kind === "itemRule" ? "metadata" : "property"),
      })
      continue
    }
    result.push({
      ...route,
      xmlPattern,
      targetPattern,
      assignmentTargetPattern: replacePatternRoot(
        route.assignmentTargetPattern,
        recursion.targetRootPattern,
        targetRootPattern
      ),
    })
  }
  return result
}

function nestedRootPattern(rootPattern: string, childDir: string, depth: number): string {
  const steps = Array.from({ length: depth }, (_, index) => `${childDir}/{recursiveItemName${index + 1}}`)
  return [rootPattern, ...steps].join("/")
}

function startsWithPatternRoot(pattern: string, rootPattern: string): boolean {
  if (!pattern.startsWith(rootPattern)) return false
  const boundary = pattern[rootPattern.length]
  return boundary === undefined || boundary === "/" || boundary === "."
}

function replacePatternRoot(pattern: string, rootPattern: string, replacement: string): string {
  return startsWithPatternRoot(pattern, rootPattern) ? `${replacement}${pattern.slice(rootPattern.length)}` : pattern
}

function compileSegment(segment: string): CompiledXmlPatternSegment {
  const rest = segment.match(/^\{([^}]+)\.\.\.\}$/)
  if (rest !== null) return { kind: "rest", key: rest[1]! }
  const parameterMatches = [...segment.matchAll(/\{([^}]+)\}/g)]
  if (parameterMatches.length === 0) return { kind: "static", value: segment }
  const parts: CompiledTemplatePart[] = []
  let offset = 0
  for (const match of parameterMatches) {
    if (match.index === undefined) continue
    if (match.index > offset) parts.push({ kind: "literal", value: segment.slice(offset, match.index) })
    parts.push({ kind: "parameter", key: match[1]! })
    offset = match.index + match[0].length
  }
  if (offset < segment.length) parts.push({ kind: "literal", value: segment.slice(offset) })
  return { kind: "template", parts }
}

function matchCompiledPattern(
  pattern: CompiledXmlPattern,
  pathSegments: readonly string[]
): Record<string, string> | undefined {
  const values: Record<string, string> = {}
  for (let index = 0; index < pattern.segments.length; index += 1) {
    const segment = pattern.segments[index]!
    if (segment.kind === "rest") {
      if (index !== pattern.segments.length - 1 || index >= pathSegments.length) return undefined
      values[segment.key] = pathSegments.slice(index).join("/")
      return values
    }
    const pathSegment = pathSegments[index]
    if (pathSegment === undefined) return undefined
    if (!matchSegment(segment, pathSegment, values)) return undefined
  }
  return pattern.segments.length === pathSegments.length ? values : undefined
}

function matchSegment(
  segment: Exclude<CompiledXmlPatternSegment, { kind: "rest" }>,
  value: string,
  values: Record<string, string>
): boolean {
  if (segment.kind === "static") return segment.value === value
  const expression = new RegExp(`^${segment.parts.map(templatePartRegex).join("")}$`)
  const match = value.match(expression)
  if (match === null) return false
  let valueIndex = 1
  for (const part of segment.parts) {
    if (part.kind !== "parameter") continue
    const next = match[valueIndex++]!
    const previous = values[part.key]
    if (previous !== undefined && previous !== next) return false
    values[part.key] = next
  }
  return true
}

function templatePartRegex(part: CompiledTemplatePart): string {
  return part.kind === "literal" ? escapeRegExp(part.value) : "(.+)"
}

function createMatch(route: XmlImportRoute, values: Record<string, string>): XmlImportRouteMatch {
  if (route.kind === "ignore") return { kind: "ignore", route, values }
  const targetProjectPath = expandTarget(route.targetPattern, values)
  if (route.kind === "assignment") return { kind: "assignment", route, targetProjectPath, values }
  return {
    kind: "externalFile",
    route,
    targetProjectPath,
    assignmentTargetProjectPath: expandTarget(route.assignmentTargetPattern, values),
    values,
  }
}

function expandTarget(pattern: string, values: Record<string, string>): string {
  return expandImportPattern(pattern, values).replace(/\\/g, "/").replace(/^\.\//, "")
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
}
