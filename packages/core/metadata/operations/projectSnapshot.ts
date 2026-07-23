import { readFileSync } from "fs"
import { dirname, resolve } from "path"
import type { ConfigurationContext } from "../context/types"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { PreparedYamlFile, PreparedYamlProject } from "../project/preparedYamlProject"
import { discoverValidationProjectFiles, type ValidationProjectFile } from "../validation/projectFiles"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { validateProject, type ValidationWorkerPoolHandle } from "../validation/validateProject"
import { parseMetadataYaml, type ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { YamlLocationIndex } from "../../yaml/locationIndex"
import { defaultMetadataOperationsContext } from "./context"
import type { MetadataOperationValidationFailed } from "./types"

export interface OperationSnapshotItem {
  resource: ValidationProjectFile
  filePath: string
  projectPath: string
  ownerDirPath: string
  parsed: ParsedYaml
  yaml: Record<string, unknown>
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
  validationWorkerPoolHandle?: ValidationWorkerPoolHandle
}): Promise<MetadataOperationSnapshotResult> {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultMetadataOperationsContext()

  if (params.requireValidProject) {
    const validation = await (params.validationWorkerPoolHandle?.validateProject({ projectDir, context }) ??
      validateProject({ projectDir, context, concurrency: 1 }))
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
  for (const resource of await discoverValidationProjectFiles(projectDir)) {
    const item = importSnapshotItem({ resource, context, requireValidProject: params.requireValidProject })
    if (item.ok) {
      items.push(item.item)
      continue
    }
    if (params.requireValidProject) return item.failure
  }

  return { ok: true, projectDir, context, items }
}

export function buildMetadataOperationSnapshotFromPreparedProject(params: {
  project: PreparedYamlProject
  context: ConfigurationContext
  requireValidProject: boolean
}): MetadataOperationSnapshotResult {
  const items: OperationSnapshotItem[] = []
  for (const worker of params.project.workers) {
    for (const yamlFile of worker.yamlFiles) {
      const resource = resolveValidationProjectFile(params.project.projectDir, yamlFile.filePath)
      if (resource === undefined) continue

      const item = importPreparedSnapshotItem({
        resource,
        yamlFile,
        context: params.context,
        requireValidProject: params.requireValidProject,
      })
      if (item.ok) {
        items.push(item.item)
        continue
      }
      if (params.requireValidProject) return item.failure
    }
  }

  return { ok: true, projectDir: params.project.projectDir, context: params.context, items }
}

function importSnapshotItem(params: {
  resource: ValidationProjectFile
  context: ConfigurationContext
  requireValidProject: boolean
}): { ok: true; item: OperationSnapshotItem } | { ok: false; failure: MetadataOperationValidationFailed } {
  try {
    const parsed = parseMetadataYaml(readFileSync(params.resource.absolutePath, "utf-8"))
    const rule = params.resource.kind === "form" ? ClientApplicationFormRules : params.resource.owner.spec.rule
    const yaml = requireYamlObject(parsed.data)

    return {
      ok: true,
      item: {
        resource: params.resource,
        filePath: params.resource.absolutePath,
        projectPath: params.resource.projectPath,
        ownerDirPath: dirname(params.resource.absolutePath),
        parsed,
        yaml,
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

function importPreparedSnapshotItem(params: {
  resource: ValidationProjectFile
  yamlFile: PreparedYamlFile
  context: ConfigurationContext
  requireValidProject: boolean
}): { ok: true; item: OperationSnapshotItem } | { ok: false; failure: MetadataOperationValidationFailed } {
  try {
    const parsed = parsedYamlForOperationTransition(params.yamlFile.data)
    const rule = params.resource.kind === "form" ? ClientApplicationFormRules : params.resource.owner.spec.rule
    const yaml = requireYamlObject(parsed.data)

    return {
      ok: true,
      item: {
        resource: params.resource,
        filePath: params.resource.absolutePath,
        projectPath: params.resource.projectPath,
        ownerDirPath: dirname(params.resource.absolutePath),
        parsed,
        yaml,
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

function requireYamlObject(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>
  throw new Error("Ожидался YAML-объект")
}

function parsedYamlForOperationTransition(data: unknown): ParsedYaml {
  return {
    text: "",
    data,
    locations: emptyYamlLocationIndex(),
    syntaxErrors: [],
  }
}

function emptyYamlLocationIndex(): YamlLocationIndex {
  return {
    rootPosition: () => ({ line: 1, col: 1 }),
    keyPosition: () => undefined,
    keyOccurrences: () => [],
    valuePosition: () => undefined,
    nodePosition: () => undefined,
  }
}
