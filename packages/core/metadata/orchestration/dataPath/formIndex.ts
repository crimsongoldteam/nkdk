import type {
  FormDataPathAdditionalColumnsByTablePath,
  FormDataPathSource,
} from "./types"

export interface FormDataPathDiagnostic {
  filePath: string
  line: number
  col: number
  message: string
  severity: "error" | "warning"
  source: "syntax" | "structure" | "external-file" | "cross-file" | "reference"
  path?: string
}

export interface FormDataPathIndex {
  roots: Map<string, FormDataPathSource>
  additionalColumnsByTablePath: FormDataPathAdditionalColumnsByTablePath
  tableDataPathByElementName: ReadonlyMap<string, string>
  duplicateDiagnostics: FormDataPathDiagnostic[]
  getRoot(name: string): FormDataPathSource | undefined
}

declare module "../property/localFacts" {
  interface LocalMetadataIndex {
    formDataPathIndex?: FormDataPathIndex
  }
}
