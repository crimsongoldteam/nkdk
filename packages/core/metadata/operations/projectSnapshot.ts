import { readFileSync } from "fs"
import { dirname, resolve } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { discoverValidationProjectFiles, type ValidationProjectFile } from "~/metadata/validation/projectFiles"
import { validateProject } from "~/metadata/validation/validateProject"
import { parseMetadataYaml, type ParsedYaml } from "~/yaml/parseMetadataYaml"
import { defaultMetadataOperationsContext } from "./context"
import type { MetadataOperationValidationFailed } from "./types"

export interface OperationSnapshotItem {
  resource: ValidationProjectFile
  filePath: string
  projectPath: string
  ownerDirPath: string
  parsed: ParsedYaml
  model: Record<string, unknown>
  rule: MetadataItemRule
  kind: ValidationProjectFile["kind"]
}

export interface MetadataOperationSnapshot {
  ok: true
  projectDir: string
  context: ConfigurationContext
  items: OperationSnapshotItem[]
}

export type MetadataOperationSnapshotResult = MetadataOperationSnapshot | MetadataOperationValidationFailed

export async function buildMetadataOperationSnapshot(params: {
  projectDir: string
  context?: ConfigurationContext
  requireValidProject: boolean
}): Promise<MetadataOperationSnapshotResult> {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultMetadataOperationsContext()

  if (params.requireValidProject) {
    const validation = await validateProject({ projectDir, context })
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
  for (const resource of discoverValidationProjectFiles(projectDir)) {
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
  resource: ValidationProjectFile
  context: ConfigurationContext
  requireValidProject: boolean
}):
  | { ok: true; item: OperationSnapshotItem }
  | { ok: false; failure: MetadataOperationValidationFailed } {
  try {
    const parsed = parseMetadataYaml(readFileSync(params.resource.absolutePath, "utf-8"))
    const rule = params.resource.kind === "form" ? ClientApplicationFormRules : params.resource.owner.spec.rule
    const model =
      params.resource.kind === "form"
        ? (importClientApplicationFormFromYAML(params.context, parsed.data as never) as Record<string, unknown>)
        : (importMetadataItemFromYAML({
            context: params.context,
            yaml: parsed.data,
            rule,
            name: params.resource.owner.name,
          }) as Record<string, unknown> | undefined)

    if (model === undefined) throw new Error("Не удалось импортировать свойства")
    if (params.resource.kind === "properties") model.name ??= params.resource.owner.name

    return {
      ok: true,
      item: {
        resource: params.resource,
        filePath: params.resource.absolutePath,
        projectPath: params.resource.projectPath,
        ownerDirPath: dirname(params.resource.absolutePath),
        parsed,
        model,
        rule,
        kind: params.resource.kind,
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
            filePath: params.resource.absolutePath,
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
