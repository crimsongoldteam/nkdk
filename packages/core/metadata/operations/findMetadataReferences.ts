import { dirname } from "path"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataTargetOwner } from "../commonObjects/metadataTargets"
import { prepareYamlProject, prepareYamlProjectWithPool } from "../project/preparedYamlProject"
import { collectFormDataPathReferencesForItem, createOperationDataPathOwnerCache } from "./dataPathReferences"
import { parseMetadataOperationPath } from "./operationPath"
import {
  buildMetadataOperationSnapshotFromPreparedProject,
  type MetadataOperationSnapshot,
  type OperationSnapshotItem,
} from "./projectSnapshot"
import {
  collectBlockedReferences,
  collectStructuralReferencesForItem,
  type StructuralReferenceCollectionResult,
  type StructuralReferenceInput,
} from "./references"
import { resolveMetadataOperationPath, type ResolvedMetadataOperationPath } from "./targetResolver"
import type {
  FindMetadataReferencesParams,
  MetadataOperationBlockedReference,
  MetadataOperationFailure,
  MetadataOperationMode,
  MetadataOperationResult,
  MetadataOperationValidationFailed,
} from "./types"
import { defaultMetadataOperationsContext } from "./context"

interface DeletePlan {
  blockedReferences: MetadataOperationBlockedReference[]
}

type DeletePlanResult = { ok: true; plan: DeletePlan } | { ok: false; failure: MetadataOperationFailure }

export async function findMetadataReferences(params: FindMetadataReferencesParams): Promise<MetadataOperationResult> {
  const context = defaultMetadataOperationsContext()
  const prepared =
    params.preparedYamlProjectPool !== undefined
      ? await prepareYamlProjectWithPool({
          projectDir: params.projectDir,
          context,
          pool: params.preparedYamlProjectPool,
        })
      : await prepareYamlProject({ projectDir: params.projectDir, context })
  if (!prepared.ok) return validationFailure(prepared.message, prepared.diagnostics)
  const syntaxErrors = prepared.project.workers
    .flatMap((worker) => worker.yamlFiles)
    .flatMap((file) => file.syntaxDiagnostics)
    .filter((diagnostic) => diagnostic.severity === "error")
  if (syntaxErrors.length > 0) return validationFailure("YAML-проект содержит ошибки подготовки", syntaxErrors)

  const snapshot = buildMetadataOperationSnapshotFromPreparedProject({
    project: prepared.project,
    context,
    requireValidProject: false,
  })
  if (!snapshot.ok) return snapshot

  const parsedPath = parseMetadataOperationPath(params.path)
  if (!parsedPath.ok) return failure(parsedPath.code, parsedPath.message)

  const resolved = resolveMetadataOperationPath(snapshot, parsedPath)
  if (!resolved.ok) return failure(resolved.code, resolved.message)

  const planResult = buildDeletePlan({ snapshot, resolved })
  if (!planResult.ok) return planResult.failure
  const plan = planResult.plan
  if (plan.blockedReferences.length > 0) {
    return {
      ok: false,
      code: "references_found",
      message: "Найдены внешние ссылки",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: plan.blockedReferences,
    }
  }

  void params.allowWrite
  return success("plan", [])
}

function validationFailure(
  message: string,
  diagnostics: MetadataOperationValidationFailed["diagnostics"]
): MetadataOperationValidationFailed {
  return {
    ok: false,
    code: "validation_failed",
    message,
    diagnostics,
  }
}

function buildDeletePlan(params: {
  snapshot: MetadataOperationSnapshot
  resolved: ResolvedMetadataOperationPath
}): DeletePlanResult {
  const references: StructuralReferenceInput[] = []
  for (const item of params.snapshot.items) {
    const collected = collectItemReferences(item)
    if (!collected.ok) return { ok: false, failure: failure(collected.code, collected.message) }
    references.push(...collected.references)
  }
  const isInsideDeletedTree = deletedTreeMatcher(params.resolved)
  const blockedReferences = collectBlockedReferences({
    items: references,
    deletedPrefix: params.resolved.targetPrefix,
    isInsideDeletedTree,
  })
  blockedReferences.push(
    ...collectBlockedDataPathReferences({
      snapshot: params.snapshot,
      targetPrefix: params.resolved.targetPrefix,
      isInsideDeletedTree,
    })
  )

  return {
    ok: true,
    plan: {
      blockedReferences,
    },
  }
}

function collectBlockedDataPathReferences(params: {
  snapshot: MetadataOperationSnapshot
  targetPrefix: string
  isInsideDeletedTree: (filePath: string) => boolean
}): MetadataOperationBlockedReference[] {
  const ownerCache = createOperationDataPathOwnerCache({
    projectDir: params.snapshot.projectDir,
    context: params.snapshot.context,
  })
  const blockedReferences: MetadataOperationBlockedReference[] = []

  for (const item of params.snapshot.items) {
    for (const reference of collectFormDataPathReferencesForItem({
      item,
      ownerCache,
      targetPrefix: params.targetPrefix,
    })) {
      if (params.isInsideDeletedTree(reference.filePath)) continue
      blockedReferences.push({ filePath: reference.filePath, yamlPath: reference.yamlPath, value: reference.value })
    }
  }

  return blockedReferences
}

function collectItemReferences(item: OperationSnapshotItem): StructuralReferenceCollectionResult {
  return collectStructuralReferencesForItem({
    item,
    parsed: item.parsed,
    owner: ownerForItem(item),
  })
}

function ownerForItem(item: OperationSnapshotItem): MetadataTargetOwner | undefined {
  const root = rootFromYAML[item.resource.owner.dir]
  return root ? { root, objectName: item.resource.owner.name } : undefined
}

function deletedTreeMatcher(resolved: ResolvedMetadataOperationPath): (filePath: string) => boolean {
  if (resolved.targetKind === "object") {
    const root = resolved.item.ownerDirPath
    return (filePath) => filePath === root || filePath.startsWith(`${root}/`)
  }
  if (resolved.targetKind === "fileItem") {
    const root = dirname(resolved.absolutePath)
    return (filePath) => filePath === root || filePath.startsWith(`${root}/`)
  }
  return () => false
}

function success(mode: MetadataOperationMode, changedFiles: string[]): MetadataOperationResult {
  return {
    ok: true,
    mode,
    changedFiles,
    rewrittenReferences: [],
    createdMigration: undefined,
    blockedReferences: [],
  }
}

function failure(code: MetadataOperationFailure["code"], message: string): MetadataOperationFailure {
  return {
    ok: false,
    code,
    message,
    changedFiles: [],
    rewrittenReferences: [],
    blockedReferences: [],
  }
}
