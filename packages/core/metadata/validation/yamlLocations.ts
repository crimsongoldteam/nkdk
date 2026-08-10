import type { ParsedYaml } from "@nkdk/runtime"
import type {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticSource,
  YamlDiagnosticLocation,
  YamlPath,
} from "@nkdk/runtime"

export type { YamlDiagnosticLocation, YamlPath } from "@nkdk/runtime"

export interface DiagnosticAtYamlPathParams {
  filePath: string
  parsed: ParsedYaml
  path: YamlPath
  severity: DiagnosticSeverity
  source: DiagnosticSource
  message: string
}

export function diagnosticAtYamlPath({
  filePath,
  parsed,
  path,
  severity,
  source,
  message,
}: DiagnosticAtYamlPathParams): Diagnostic {
  return diagnosticAtYamlLocation({
    location: yamlDiagnosticLocationAtPath({ filePath, parsed, path }),
    message,
    severity,
    source,
  })
}

export function yamlDiagnosticLocationAtPath(params: {
  filePath: string
  parsed: ParsedYaml
  path: YamlPath
}): YamlDiagnosticLocation {
  const position =
    params.parsed.locations.keyPosition(params.path) ??
    params.parsed.locations.nodePosition(params.path) ??
    (params.path.length === 0 ? params.parsed.locations.rootPosition() : { line: 1, col: 1 })
  const path = yamlPathToPointer(params.path)
  return { filePath: params.filePath, line: position.line, col: position.col, ...(path === undefined ? {} : { path }) }
}

export function diagnosticAtYamlLocation(params: {
  location: YamlDiagnosticLocation
  severity: DiagnosticSeverity
  source: DiagnosticSource
  message: string
}): Diagnostic {
  return { ...params.location, severity: params.severity, source: params.source, message: params.message }
}

export function yamlPathToPointer(path: YamlPath): string | undefined {
  if (path.length === 0) return undefined
  return `/${path.map((segment) => String(segment).replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`
}
