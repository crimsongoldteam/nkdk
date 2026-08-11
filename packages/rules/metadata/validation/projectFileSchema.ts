import type { TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "@nkdk/runtime"
import { classifyMetadataProjectPath } from "../projectDefinition/resources"
import type { RuleRegistrySet, RuleSchemaRuntime } from "@nkdk/runtime/rule-kit"
import { createRuleSchemaRuntime, currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { parseProjectPath, projectPathFromFileSystem } from "../projectDefinition/path"
import {
  exportJSONSchemaForMetadataItemRule,
  exportJSONSchemaForSchemaName as exportRegisteredJSONSchemaForSchemaName,
  ProjectFileSchemaError,
} from "./schemaRegistry"

export { ProjectFileSchemaError } from "./schemaRegistry"
export {
  exportJSONSchemaGraph,
  schemaNameFromRef,
  type JSONSchemaGraph,
  type JSONSchemaGraphRoot,
} from "../projectDefinition/schemaRegistry"

export interface ExportJSONSchemaForProjectFileParams {
  context: ConfigurationContext
  filePath: string
  projectDir?: string
  mode?: JSONSchemaExportMode
}

export interface ExportJSONSchemaForSchemaNameParams {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
}

export interface ProjectFileSchemaRuntime {
  readonly rules: Pick<RuleRegistrySet, "projectSpecs" | "resourceTopology">
  readonly schemas: RuleSchemaRuntime
}

const expectedPatterns =
  "Ожидались Конфигурация.yaml или пути вида <Вид>/<Имя>/Свойства.yaml и <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export function exportJSONSchemaForProjectFile(
  params: ExportJSONSchemaForProjectFileParams,
  runtime?: ProjectFileSchemaRuntime,
): TSchema {
  const contextualRules = currentRuleRegistrySet<RuleRegistrySet>()
  const effectiveRuntime = runtime ?? (contextualRules === undefined ? undefined : {
    rules: contextualRules,
    schemas: createRuleSchemaRuntime(
      contextualRules,
      (name, available) => new ProjectFileSchemaError(
        `Неизвестная JSON Schema "${name}". Доступные имена: ${available.join(", ")}`,
      ),
    ),
  })
  const normalized = normalizeProjectPath(params)

  if (!normalized.toLowerCase().endsWith(".yaml")) {
    throw new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов")
  }

  const resourceContext = (() => {
    if (effectiveRuntime === undefined) return undefined
    const rootSpec = effectiveRuntime.rules.projectSpecs.get("")
    if (rootSpec === undefined) {
      throw new ProjectFileSchemaError("Не найден корневой project spec")
    }
    return {
      topology: effectiveRuntime.rules.resourceTopology.get(),
      rootSpec,
      projectSpecs: effectiveRuntime.rules.projectSpecs,
    }
  })()
  const resource = classifyMetadataProjectPath(
    normalized,
    resourceContext,
  )
  if (!resource) {
    throw new ProjectFileSchemaError(expectedPatterns)
  }

  if (resource.kind !== "yaml") {
    throw new ProjectFileSchemaError("JSON Schema для этого вида metadata-ресурса не поддерживается")
  }

  if (effectiveRuntime !== undefined) {
    if (resource.role === "form") {
      return effectiveRuntime.schemas.exportRule({
        context: params.context,
        rule: resource.itemRule,
        mode: params.mode,
      })
    }
    return effectiveRuntime.schemas.exportDefinition({
      context: params.context,
      mode: params.mode,
      excludeImplicitValueYAML: true,
      definition: {
        export: ({ context, execution }) => resource.owner.spec.exportSchema({
          context,
          execution,
          mode: params.mode,
          ...(resource.role === "properties" ? { name: resource.owner.name } : {}),
        }),
      },
    })
  }

  if (resource.role === "form") {
    return exportJSONSchemaForMetadataItemRule({
      context: params.context,
      rule: resource.itemRule,
      mode: params.mode,
    })
  }

  if (resource.role === "configuration") {
    return resource.owner.spec.exportSchema({
      context: params.context,
      mode: params.mode,
      execution: currentRuleRegistrySet<RuleRegistrySet>()?.execution,
    })
  }

  if (resource.role === "properties") {
    return resource.owner.spec.exportSchema({
      context: params.context,
      mode: params.mode,
      name: resource.owner.name,
      execution: currentRuleRegistrySet<RuleRegistrySet>()?.execution,
    })
  }

  throw new ProjectFileSchemaError("JSON Schema для этого вида metadata-ресурса не поддерживается")
}

export function exportJSONSchemaForSchemaName(params: ExportJSONSchemaForSchemaNameParams): TSchema {
  return exportRegisteredJSONSchemaForSchemaName(params)
}

function normalizeProjectPath(params: Pick<ExportJSONSchemaForProjectFileParams, "filePath" | "projectDir">): string {
  const { filePath, projectDir } = params
  if (projectDir) {
    try {
      return projectPathFromFileSystem(projectDir, filePath)
    } catch {
      throw new ProjectFileSchemaError("Файл находится вне указанного YAML-проекта")
    }
  }

  try {
    return parseProjectPath(filePath)
  } catch {
    throw new ProjectFileSchemaError(expectedPatterns)
  }
}
