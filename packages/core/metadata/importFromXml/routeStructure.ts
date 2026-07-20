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
  readonly routes: readonly CompiledXmlImportRoute[]
}

interface CompiledXmlPattern {
  segments: readonly CompiledXmlPatternSegment[]
}

type CompiledXmlPatternSegment =
  | { kind: "static"; value: string }
  | { kind: "template"; parts: readonly CompiledTemplatePart[] }
  | { kind: "rest"; key: string }

type CompiledTemplatePart = { kind: "literal"; value: string } | { kind: "parameter"; key: string }

export function compileXmlImportRouteStructure(routes: readonly XmlImportRoute[]): XmlImportRouteStructure {
  return { routes: routes.map((route) => ({ route, pattern: compilePattern(route.xmlPattern) })) }
}

export function matchXmlImportRouteStructure(structure: XmlImportRouteStructure, path: string): XmlImportRouteMatch[] {
  const pathSegments = path.split("/")
  const matches: XmlImportRouteMatch[] = []
  for (const compiled of structure.routes) {
    const values = matchCompiledPattern(compiled.pattern, pathSegments)
    if (values === undefined) continue
    matches.push(createMatch(compiled.route, values))
  }
  return matches
}

function compilePattern(pattern: string): CompiledXmlPattern {
  return { segments: pattern.split("/").map(compileSegment) }
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
