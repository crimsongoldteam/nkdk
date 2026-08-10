import type {
  FormDataPathAdditionalColumnsByTablePath,
  FormDataPathSource,
} from "./types"
import type { DataPathDialect } from "./dialect"

export interface FormDataPathDiagnostic {
  filePath: string
  line: number
  col: number
  message: string
  severity: "error" | "warning"
  source: "syntax" | "structure" | "external-file" | "cross-file" | "reference"
  path?: string
}

export interface FormDataPathTabularElementDeclaration {
  readonly kind: "tabularFormElement"
  readonly dataPath?: string
}

export interface FormDataPathIndex {
  roots: Map<string, FormDataPathSource>
  additionalColumnsByTablePath: FormDataPathAdditionalColumnsByTablePath
  tabularElementsByName: ReadonlyMap<string, FormDataPathTabularElementDeclaration>
  dialect?: DataPathDialect
  duplicateDiagnostics: FormDataPathDiagnostic[]
  getRoot(name: string): FormDataPathSource | undefined
}

declare module "../property/localFacts" {
  interface LocalMetadataIndex {
    formDataPathIndex?: FormDataPathIndex
  }
}
