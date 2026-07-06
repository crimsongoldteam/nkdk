import type { OwnerTypeRef } from "./dataPath/types"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export type ValidationPendingCheck = {
  kind: "dataPath"
  filePath: string
  yamlPath: YamlPath
  owner: OwnerTypeRef
  value: string
  policy: "formDataPath"
}

export interface ValidationPendingCheckResult {
  diagnostics: Diagnostic[]
}
