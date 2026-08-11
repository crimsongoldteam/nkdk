import { readFileSync } from "fs"
import { dirname, resolve } from "path"
import type { ConfigurationContext } from "@nkdk/runtime"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { PreparedYamlFile, PreparedYamlProject } from "../project/preparedYamlProject"
import { discoverValidationProjectFiles, type ValidationProjectFile } from "../validation/projectFiles"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { createValidationProjectComponent } from "../validation/projectComponents"
import { validateProject, type ValidationWorkerPoolHandle } from "../project/validateProject"
import { parseMetadataYaml, type ParsedYaml } from "@nkdk/runtime"
import type { YamlLocationIndex } from "@nkdk/runtime"
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

export type BuildMetadataOperationSnapshotParams = {
  projectDir: string
  context?: ConfigurationContext
  validationWorkerPoolHandle?: ValidationWorkerPoolHandle
} & (
  | { requireValidProject: true; validationProjectDir: string }
  | { requireValidProject: false; validationProjectDir?: never }
)

export async function buildMetadataOperationSnapshot(
  params: BuildMetadataOperationSnapshotParams
): Promise<MetadataOperationSnapshotResult> {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultMetadataOperationsContext()

  if (params.requireValidProject) {
    const validationProjectDir = resolve(params.validationProjectDir)
    const validation = await (params.validationWorkerPoolHandle?.validateProject({
      projectDir: validationProjectDir,
      context,
    }) ?? validateProject({ projectDir: validationProjectDir, context, concurrency: 1 }))
    const errors = [...validation.diagnostics].filter((diagnostic) => diagnostic.severity === "error")
    validation.diagnostics.release()
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

export function buildMetadataOperationSnapshotFromProjectPaths(params: {
  projectDir: string
  projectPaths: readonly string[]
  context?: ConfigurationContext
}): MetadataOperationSnapshotResult {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultMetadataOperationsContext()
  const items: OperationSnapshotItem[] = []
  for (const rootProjectPath of new Set(params.projectPaths)) {
    const address = componentAddress(rootProjectPath)
    if (address === undefined) continue
    const component = createValidationProjectComponent(projectDir, address.component)
    const resource = resolveValidationProjectFile(component.componentDir, address.projectPath, component)
    if (resource === undefined) continue
    const item = importSnapshotItem({ resource, context, requireValidProject: true })
    if (!item.ok) return item.failure
    items.push(item.item)
  }
  return { ok: true, projectDir, context, items }
}

function componentAddress(rootProjectPath: string): {
  component: { kind: "configuration" } | { kind: "configurationExtension"; name: string }
  projectPath: string
} | undefined {
  const segments = rootProjectPath.split("/")
  if (segments[0] === "cf" && segments.length > 1) {
    return { component: { kind: "configuration" }, projectPath: segments.slice(1).join("/") }
  }
  if (segments[0] === "cfe" && segments[1] !== undefined && segments.length > 2) {
    return {
      component: { kind: "configurationExtension", name: segments[1] },
      projectPath: segments.slice(2).join("/"),
    }
  }
  return undefined
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
