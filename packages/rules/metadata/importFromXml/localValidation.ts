import { validationIssuePathFromPointer, type ValidationIssue } from "@nkdk/runtime"
import type { ProjectStateQueryPort } from "../projectState/contracts"
import type { ProjectStateImportFinalFileStateBatch, ProjectStateImportIndexContribution } from "../projectState/importSession"
import type { ProjectStateDependencyValidator } from "../projectState/contracts/dependencyValidation"
import { createProjectStateOwnerMetadataCache } from "../validation/projectStateDependencyValidation"
import { validatePendingChecks, type ValidationPendingCheck } from "../validation/projectValidationPendingChecks"

export function validateLocalImportSemantics(params: {
  readonly validator: ProjectStateDependencyValidator
  readonly structuredDocuments?: ProjectStateImportIndexContribution["structuredDocuments"]
  readonly final: ProjectStateImportFinalFileStateBatch
  readonly projectDir: string
  readonly queryPort: ProjectStateQueryPort
  readonly pendingChecks: readonly ValidationPendingCheck[]
}): ValidationIssue[] {
  if (params.final.updates.length !== 1) {
    throw new Error("Окончательное состояние одного YAML должно содержать ровно одно обновление")
  }
  const update = params.final.updates[0]!
  if (update.kind !== "yaml") return []
  const validator = params.validator
  const componentPath = update.componentPath
  const projectPath = update.projectPath
  const queryPort = params.queryPort
  const ownerMetadataCache = createProjectStateOwnerMetadataCache({
    projectDir: params.projectDir,
    componentPath,
    queryPort,
  })
  const references = update.pendingReferences.map((reference, index) => ({
    requestId: `import-reference:${index}`,
    componentPath,
    reference: { ...reference, filePath: projectPath },
  }))
  const dependencies = update.pendingChecks.flatMap((check, index) =>
    check.kind === "addressableRequired" || check.kind === "referenceCoverage" || check.kind === "dataPath"
      ? []
      : [{ requestId: `import-dependency:${index}`, componentPath, projectPath, check }]
  )
  const addressableRequired = update.pendingChecks.flatMap((check, index) =>
    check.kind === "addressableRequired"
      ? [{ requestId: `import-required:${index}`, componentPath, projectPath, check }]
      : []
  )
  const referenceCoverage = update.pendingChecks.flatMap((check, index) =>
    check.kind === "referenceCoverage"
      ? [{ requestId: `import-coverage:${index}`, componentPath, projectPath, check }]
      : []
  )
  const dataPathChecks = params.pendingChecks.filter(
    (check): check is Extract<ValidationPendingCheck, { kind: "dataPath" }> => check.kind === "dataPath",
  )
  // Владелец в DataPath — контекст разрешения, а не самостоятельная ссылка.
  // Проверка пути сама запрашивает нужные метаданные; локальный реквизит формы
  // не требует существования объекта из контекста в таблице owners.
  const dataPathDiagnostics = dataPathChecks.flatMap((check) => validatePendingChecks({
    ownerCache: ownerMetadataCache,
    checks: [check],
  }).diagnostics.map((diagnostic) => ({
    ...diagnostic,
    // Ошибка чтения необходимых метаданных относится к использующему их пути,
    // а не к корню текущей формы или к YAML другого задания.
    filePath: check.location.filePath,
    path: check.location.path,
  })))
  const diagnostics = [
    ...dataPathDiagnostics,
    ...validator.validateReferences({
      checks: references,
      projectDir: params.projectDir,
      queryPort,
    }).diagnostics,
    ...validator.validateDependencies({
      checks: dependencies,
      projectDir: params.projectDir,
      queryPort,
    }).diagnostics,
    ...validator.validateAddressableRequired({
      checks: addressableRequired,
      projectDir: params.projectDir,
      queryPort,
    }),
    ...validator.validateReferenceCoverage({
      checks: referenceCoverage,
      projectDir: params.projectDir,
      queryPort,
    }),
    ...validator.validateStructuredDocuments({
      facts: (params.structuredDocuments ?? []).map((entry) => ({ componentPath, projectPath, entry })),
      projectDir: params.projectDir,
      queryPort,
    }),
  ]
  return diagnostics
    .filter(({ severity }) => severity === "error")
    .map(validationIssueFromDiagnostic)
}

export function validationIssueFromDiagnostic(diagnostic: {
  readonly source: string
  readonly code?: unknown
  readonly path?: string
  readonly message: string
}): ValidationIssue {
  return {
    code: importDiagnosticCode(diagnostic),
    kind: importDiagnosticKind(diagnostic.source),
    target: importDiagnosticTarget(diagnostic.path),
    params: { message: diagnostic.message },
  }
}

function importDiagnosticCode(diagnostic: { readonly source: string; readonly code?: unknown }): string {
  return typeof diagnostic.code === "string" ? diagnostic.code : `diagnostic.${diagnostic.source}`
}

function importDiagnosticKind(source: string): ValidationIssue["kind"] {
  return source === "syntax" || source === "external-file" ? "infrastructure" : "semantic"
}

function importDiagnosticTarget(path: string | undefined): ValidationIssue["target"] {
  return { kind: "path", path: validationIssuePathFromPointer(path ?? "") }
}
