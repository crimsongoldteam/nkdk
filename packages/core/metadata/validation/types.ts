export type DiagnosticSource = "syntax" | "structure" | "external-file" | "cross-file" | "reference"
export type DiagnosticSeverity = "error" | "warning"
export type MetadataKind =
  | "catalog"
  | "document"
  | "enumeration"
  | "dataProcessor"
  | "documentJournal"
  | "httpService"
  | "informationRegister"
  | "accumulationRegister"
  | "exchangePlan"

export interface Diagnostic {
  filePath: string
  line: number
  col: number
  message: string
  severity: DiagnosticSeverity
  source: DiagnosticSource
  path?: string
}
