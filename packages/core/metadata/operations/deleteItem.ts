import { dirname } from "path"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataTargetOwner } from "../commonObjects/metadataTargets"
import { collectFormDataPathReferencesForItem, createOperationDataPathOwnerCache } from "./dataPathReferences"
import { applyMetadataOperationFilePlan, type MetadataOperationFileStep } from "./filePlan"
import { parseMetadataOperationPath } from "./operationPath"
import {
  buildMetadataOperationSnapshot,
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
  DeleteMetadataItemParams,
  MetadataOperationBlockedReference,
  MetadataOperationFailure,
  MetadataOperationMode,
  MetadataOperationResult,
} from "./types"
import { exportOperationItemToYamlText } from "./yamlModelIO"

interface DeletePlan {
  steps: MetadataOperationFileStep[]
  plannedChangedFiles: string[]
  blockedReferences: MetadataOperationBlockedReference[]
}

type DeletePlanResult = { ok: true; plan: DeletePlan } | { ok: false; failure: MetadataOperationFailure }

export async function deleteMetadataItem(params: DeleteMetadataItemParams): Promise<MetadataOperationResult> {
  const snapshot = await buildMetadataOperationSnapshot({ projectDir: params.projectDir, requireValidProject: true })
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
      message: "Удаление заблокировано структурными ссылками",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: plan.blockedReferences,
    }
  }

  if (params.allowWrite !== true) return success("plan", plan.plannedChangedFiles)

  const applied = applyMetadataOperationFilePlan({ steps: plan.steps })
  if (!applied.ok) {
    return {
      ok: false,
      code: "write_failed",
      message: applied.message,
      changedFiles: applied.appliedFiles,
      rewrittenReferences: [],
      blockedReferences: [],
      failedStep: applied.failedStep,
      appliedFiles: applied.appliedFiles,
      pendingFiles: applied.pendingFiles,
    }
  }

  return success("applied", applied.changedFiles)
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

  const steps: MetadataOperationFileStep[] = []
  if (blockedReferences.length === 0) {
    if (params.resolved.targetKind === "object") {
      steps.push({ kind: "removePath", path: params.resolved.item.ownerDirPath })
    } else if (params.resolved.targetKind === "fileItem") {
      steps.push({ kind: "removePath", path: dirname(params.resolved.absolutePath) })
    } else {
      removeNamedNode(params.resolved)
      steps.push({
        kind: "writeFile",
        path: params.resolved.item.filePath,
        content: exportOperationItemToYamlText(params.resolved.item, params.snapshot.context),
      })
    }
  }

  return {
    ok: true,
    plan: {
      steps,
      plannedChangedFiles: steps.flatMap(filesForStep),
      blockedReferences,
    },
  }
}

function removeNamedNode(resolved: ResolvedMetadataOperationPath): void {
  if (!resolved.collectionProperty) return
  const collection = resolved.collectionOwnerNode?.[resolved.collectionProperty]
  if (!Array.isArray(collection)) return

  const index = collection.indexOf(resolved.modelNode)
  if (index >= 0) collection.splice(index, 1)
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

function filesForStep(step: MetadataOperationFileStep): string[] {
  if (step.kind === "writeFile") return [step.path]
  if (step.kind === "renamePath") return [step.from, step.to]
  if (step.kind === "removePath") return [step.path]
  return []
}
