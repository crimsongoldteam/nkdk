import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { Diagnostic, DiagnosticSeverity, DiagnosticSource } from "./types"

export type YamlPath = readonly (string | number)[]

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
  const position =
    parsed.locations.keyPosition(path) ??
    parsed.locations.nodePosition(path) ??
    (path.length === 0 ? parsed.locations.rootPosition() : { line: 1, col: 1 })

  return {
    filePath,
    line: position.line,
    col: position.col,
    message,
    severity,
    source,
    path: yamlPathToPointer(path),
  }
}

function yamlPathToPointer(path: YamlPath): string | undefined {
  if (path.length === 0) return undefined
  return `/${path.map((segment) => String(segment).replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`
}
