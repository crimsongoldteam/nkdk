export type DiagnosticSource = "syntax" | "structure" | "external-file" | "cross-file" | "reference"
export type DiagnosticSeverity = "error" | "warning"

export interface Diagnostic {
  filePath: string
  line: number
  col: number
  message: string
  severity: DiagnosticSeverity
  source: DiagnosticSource
  path?: string
}

export interface MetadataDiagnostic extends Diagnostic {
  readonly code?: string
  readonly value?: string
}
