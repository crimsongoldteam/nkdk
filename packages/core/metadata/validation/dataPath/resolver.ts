import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { Diagnostic } from "../types"
import { diagnosticAtYamlPath, type YamlPath } from "../yamlLocations"
import {
  resolveDataPathCore,
  type ResolvedDataPathTarget,
  type ResolveDataPathCoreResult,
  type TableContext,
} from "./coreResolver"
import type { FormDataPathIndex } from "./formIndex"
import type { OwnerMetadataCache } from "./ownerCache"

export type { ResolvedDataPathTarget, TableContext } from "./coreResolver"

export interface ResolveDataPathParams {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  value: string
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
}

export type ResolveDataPathResult =
  | { status: "ok"; target?: ResolvedDataPathTarget; diagnostics: Diagnostic[] }
  | { status: "warning"; target?: ResolvedDataPathTarget; diagnostics: Diagnostic[] }
  | { status: "error"; diagnostics: Diagnostic[] }

export function resolveDataPath(params: ResolveDataPathParams): ResolveDataPathResult {
  const core = resolveDataPathCore({
    value: params.value,
    nameMode: "yaml",
    index: params.index,
    ownerCache: params.ownerCache,
    ...(params.tableContext !== undefined ? { tableContext: params.tableContext } : {}),
  })

  const diagnostics = diagnosticsFromCore({ params, core })

  if (core.status === "ok") return { status: "ok", target: core.target, diagnostics }
  if (core.status === "warning") return { status: "warning", target: core.target, diagnostics }
  return { status: "error", diagnostics }
}

function diagnosticsFromCore(params: {
  params: ResolveDataPathParams
  core: ResolveDataPathCoreResult
}): Diagnostic[] {
  if (params.core.status === "ok") return []

  return params.core.issues.flatMap((issue) =>
    issue.ownerDiagnostics ??
    [
      diagnosticAtYamlPath({
        filePath: params.params.filePath,
        parsed: params.params.parsed,
        path: params.params.yamlPath,
        severity: issue.severity,
        source: "structure",
        message: issue.message,
      }),
    ]
  )
}
