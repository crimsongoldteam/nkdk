import { readFileSync } from "fs"
import { dirname, resolve } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { discoverMetadataProjectResources, type MetadataProjectPropertiesYamlRef } from "~/metadata/project/resources"
import { validateProject } from "~/metadata/validation/validateProject"
import { importFromYAML } from "~/yaml/import"
import { defaultMetadataOperationsContext } from "./context"
import type { MetadataOperationValidationFailed } from "./types"

export interface OperationSnapshotItem {
  resource: MetadataProjectPropertiesYamlRef
  filePath: string
  ownerDirPath: string
  model: Record<string, unknown>
}

export interface MetadataOperationSnapshot {
  ok: true
  projectDir: string
  context: ConfigurationContext
  items: OperationSnapshotItem[]
}

export type MetadataOperationSnapshotResult = MetadataOperationSnapshot | MetadataOperationValidationFailed

export function buildMetadataOperationSnapshot(params: {
  projectDir: string
  context?: ConfigurationContext
  requireValidProject: boolean
}): MetadataOperationSnapshotResult {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultMetadataOperationsContext()

  if (params.requireValidProject) {
    const validation = validateProject({ projectDir, context })
    const errors = validation.diagnostics.filter((diagnostic) => diagnostic.severity === "error")
    if (errors.length > 0) {
      return {
        ok: false,
        code: "validation_failed",
        message: "YAML-проект содержит ошибки validation",
        diagnostics: errors,
      }
    }
  }

  const items: OperationSnapshotItem[] = []
  for (const resource of discoverMetadataProjectResources(projectDir)) {
    if (resource.role !== "properties" || resource.nesting.length > 0 || resource.absolutePath === undefined) continue

    const item = importSnapshotItem({ resource, context, requireValidProject: params.requireValidProject })
    if (item.ok) {
      items.push(item.item)
      continue
    }
    if (params.requireValidProject) return item.failure
  }

  return { ok: true, projectDir, context, items }
}

function importSnapshotItem(params: {
  resource: MetadataProjectPropertiesYamlRef
  context: ConfigurationContext
  requireValidProject: boolean
}):
  | { ok: true; item: OperationSnapshotItem }
  | { ok: false; failure: MetadataOperationValidationFailed } {
  try {
    const yaml = importFromYAML<Record<string, unknown>>(readFileSync(params.resource.absolutePath!, "utf-8"))
    const model = importMetadataItemFromYAML({
      context: params.context,
      yaml,
      rule: params.resource.owner.spec.rule,
      name: params.resource.owner.name,
    }) as Record<string, unknown> | undefined

    if (model === undefined) throw new Error("Не удалось импортировать свойства")

    return {
      ok: true,
      item: {
        resource: params.resource,
        filePath: params.resource.absolutePath!,
        ownerDirPath: dirname(params.resource.absolutePath!),
        model,
      },
    }
  } catch (caught) {
    return {
      ok: false,
      failure: {
        ok: false,
        code: "validation_failed",
        message: caught instanceof Error ? caught.message : String(caught),
        diagnostics: [
          {
            filePath: params.resource.absolutePath!,
            line: 1,
            col: 1,
            severity: "error",
            source: "structure",
            message: caught instanceof Error ? caught.message : String(caught),
          },
        ],
      },
    }
  }
}
