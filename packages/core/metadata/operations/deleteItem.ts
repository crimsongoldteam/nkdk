import { dirname } from "path"
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type { MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets"
import { applyMetadataOperationFilePlan, type MetadataOperationFileStep } from "./filePlan"
import { buildMetadataOperationSnapshot, type MetadataOperationSnapshot, type OperationSnapshotItem } from "./projectSnapshot"
import { collectBlockedReferences, collectStructuralReferencesForItem, type StructuralReferenceInput } from "./references"
import { resolveMetadataOperationTarget, type ResolvedMetadataOperationTarget } from "./targetResolver"
import type {
  MetadataOperationBlockedReference,
  MetadataOperationFailure,
  MetadataOperationMode,
  MetadataOperationResult,
  MetadataOperationTarget,
} from "./types"
import { exportOperationItemToYamlText } from "./yamlModelIO"

export interface DeleteMetadataItemParams {
  projectDir: string
  target: MetadataOperationTarget
  allowWrite?: boolean
}

interface DeletePlan {
  steps: MetadataOperationFileStep[]
  plannedChangedFiles: string[]
  blockedReferences: MetadataOperationBlockedReference[]
}

export function deleteMetadataItem(params: DeleteMetadataItemParams): MetadataOperationResult {
  const snapshot = buildMetadataOperationSnapshot({ projectDir: params.projectDir, requireValidProject: true })
  if (!snapshot.ok) return snapshot

  const resolved = resolveMetadataOperationTarget(snapshot, params.target)
  if (!resolved.ok) return failure(resolved.code, resolved.message)

  const plan = buildDeletePlan({ snapshot, resolved })
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

  if (params.allowWrite !== true) return success("plan", plan, plan.plannedChangedFiles)

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

  return success("applied", plan, applied.changedFiles)
}

function buildDeletePlan(params: {
  snapshot: MetadataOperationSnapshot
  resolved: ResolvedMetadataOperationTarget
}): DeletePlan {
  const references = params.snapshot.items.flatMap(collectItemReferences)
  const blockedReferences = collectBlockedReferences({
    items: references,
    deletedPrefix: params.resolved.targetPrefix,
    isInsideDeletedTree: deletedTreeMatcher(params.resolved),
  })

  const steps: MetadataOperationFileStep[] = []
  if (blockedReferences.length === 0) {
    if (params.resolved.target.kind === "object") {
      steps.push({ kind: "removePath", path: params.resolved.item.ownerDirPath })
    } else if (params.resolved.target.kind === "fileItem") {
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
    steps,
    plannedChangedFiles: steps.flatMap(filesForStep),
    blockedReferences,
  }
}

function removeNamedNode(resolved: ResolvedMetadataOperationTarget): void {
  if (!resolved.collectionProperty) return
  const collection = resolved.item.model[resolved.collectionProperty]
  if (!Array.isArray(collection)) return

  const index = collection.indexOf(resolved.modelNode)
  if (index >= 0) collection.splice(index, 1)
}

function collectItemReferences(item: OperationSnapshotItem): StructuralReferenceInput[] {
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

function deletedTreeMatcher(resolved: ResolvedMetadataOperationTarget): (filePath: string) => boolean {
  if (resolved.target.kind === "object") {
    const root = resolved.item.ownerDirPath
    return (filePath) => filePath === root || filePath.startsWith(`${root}/`)
  }
  if (resolved.target.kind === "fileItem") {
    const root = dirname(resolved.absolutePath)
    return (filePath) => filePath === root || filePath.startsWith(`${root}/`)
  }
  return () => false
}

function success(mode: MetadataOperationMode, plan: DeletePlan, changedFiles: string[]): MetadataOperationResult {
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
