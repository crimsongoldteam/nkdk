import { dirname, join } from "node:path"
import { parseMetadataOperationPath } from "./operationPath"
import { readIndexedOperationReferences } from "./indexReferences"
import {
  hasMetadataOperationErrors,
  metadataOperationFailure,
  metadataOperationValidationFailure,
} from "./results"
import { resolveMetadataOperationCanonicalTarget } from "./targetResolver"
import type {
  FindMetadataReferencesParams,
  MetadataOperationBlockedReference,
  MetadataOperationDiagnostic,
  MetadataOperationResult,
} from "./types"

export async function findMetadataReferences(params: FindMetadataReferencesParams): Promise<MetadataOperationResult> {
  const refreshed = await params.projectState.refreshAndValidate({ projectDir: params.projectDir })
  const diagnostics = [...refreshed.diagnostics]
  if (hasMetadataOperationErrors(diagnostics) && params.ignoreValidationErrors !== true) {
    return metadataOperationValidationFailure("YAML-проект содержит ошибки validation", diagnostics)
  }
  const resultDiagnostics = hasMetadataOperationErrors(diagnostics)
    ? [...diagnostics, incompleteSearchWarning(params.projectDir)]
    : diagnostics

  const parsedPath = parseMetadataOperationPath(params.path)
  if (!parsedPath.ok) return metadataOperationFailure(parsedPath.code, parsedPath.message, resultDiagnostics)
  const canonical = resolveMetadataOperationCanonicalTarget(parsedPath)
  if (!canonical.ok) return metadataOperationFailure(canonical.code, canonical.message, resultDiagnostics)

  const indexed = await readIndexedOperationReferences({
    projectState: params.projectState,
    path: params.path,
    componentPath: params.componentPath,
    target: canonical,
  })
  if (!indexed.ok) return metadataOperationFailure("target_not_found", indexed.message, resultDiagnostics)
  const blockedReferences = indexed.references.flatMap((reference): MetadataOperationBlockedReference[] => {
    if (isInsideTargetTree(reference.projectPath, indexed.source.projectPath, canonical.targetKind)) return []
    return [{
      filePath: join(params.projectDir, ...reference.projectPath.split("/")),
      yamlPath: reference.yamlPath,
      value: reference.kind === "metadataTarget" ? reference.canonical : reference.value,
    }]
  })
  if (blockedReferences.length > 0) {
    return {
      ok: false,
      code: "references_found",
      message: "Найдены внешние ссылки",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences,
      diagnostics: resultDiagnostics,
    }
  }
  return {
    ok: true,
    mode: "plan",
    changedFiles: [],
    rewrittenReferences: [],
    createdMigration: undefined,
    blockedReferences: [],
    diagnostics: resultDiagnostics,
  }
}

function isInsideTargetTree(
  sourceProjectPath: string,
  targetProjectPath: string,
  targetKind: "object" | "namedCollection" | "fileItem",
): boolean {
  if (targetKind === "namedCollection") return false
  const root = dirname(targetProjectPath)
  return sourceProjectPath === root || sourceProjectPath.startsWith(`${root}/`)
}

function incompleteSearchWarning(projectDir: string): MetadataOperationDiagnostic {
  return {
    filePath: projectDir,
    line: 1,
    col: 1,
    severity: "warning",
    source: "reference",
    code: "search_result_may_be_incomplete",
    message: "Результат поиска может быть неполным из-за ошибок validation",
  }
}
