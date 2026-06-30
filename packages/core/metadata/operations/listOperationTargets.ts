import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { describeMetadataRuleOperationTargets } from "~/metadata/project/ruleResources"
import { discoverMetadataProjectResources, type MetadataProjectPropertiesYamlRef } from "~/metadata/project/resources"
import { importFromYAML } from "~/yaml/import"
import { defaultMetadataOperationsContext } from "./context"
import type { MetadataOperationTarget } from "./types"

export interface ListMetadataOperationTargetsParams {
  projectDir: string
  query?: string
  kind?: MetadataOperationTarget["kind"]
  owner?: {
    itemTypePrefix: string
    name: string
  }
  limit?: number
  context?: ConfigurationContext
}

export interface ListedMetadataOperationTarget {
  target: MetadataOperationTarget
  displayPath: string
  projectPath?: string
  canRename: boolean
  canDelete: boolean
  requiresMigration: boolean
}

export interface ListMetadataOperationTargetsResult {
  ok: true
  targets: ListedMetadataOperationTarget[]
}

export function listMetadataOperationTargets(params: ListMetadataOperationTargetsParams): ListMetadataOperationTargetsResult {
  const context = params.context ?? defaultMetadataOperationsContext()
  const targets: ListedMetadataOperationTarget[] = []
  const resources = discoverMetadataProjectResources(params.projectDir)

  for (const resource of resources) {
    if (resource.role !== "properties" || resource.nesting.length > 0 || resource.absolutePath === undefined) continue

    targets.push({
      target: { kind: "object", itemTypePrefix: resource.owner.dir, name: resource.owner.name },
      displayPath: `${resource.owner.dir}.${resource.owner.name}`,
      projectPath: resource.projectPath,
      canRename: true,
      canDelete: true,
      requiresMigration: true,
    })
    targets.push(...listChildTargets({ projectDir: params.projectDir, resource, context }))
  }

  return {
    ok: true,
    targets: targets
      .filter((target) => matchesTargetFilters(target, params))
      .sort((left, right) => left.displayPath.localeCompare(right.displayPath, "ru"))
      .slice(0, params.limit ?? 100),
  }
}

function listChildTargets(params: {
  projectDir: string
  resource: MetadataProjectPropertiesYamlRef
  context: ConfigurationContext
}): ListedMetadataOperationTarget[] {
  const descriptors = describeMetadataRuleOperationTargets(params.resource.owner.spec.rule)
  const targets: ListedMetadataOperationTarget[] = []
  const model = readModel(params.resource, params.context)

  for (const descriptor of descriptors) {
    const declaration = descriptor.declaration
    if (declaration.kind === "namedCollectionTarget" && model !== undefined) {
      for (const name of namedItems(model[descriptor.propertyName])) {
        targets.push({
          target: {
            kind: declaration.targetKind,
            owner: { itemTypePrefix: params.resource.owner.dir, name: params.resource.owner.name },
            name,
          },
          displayPath: `${params.resource.owner.dir}.${params.resource.owner.name}.${declaration.migrationSegment}.${name}`,
          projectPath: params.resource.projectPath,
          canRename: true,
          canDelete: true,
          requiresMigration: declaration.requiresMigration,
        })
      }
      continue
    }

    if (declaration.kind === "fileItemCollectionTarget") {
      targets.push(
        ...listFileItemTargets({
          projectDir: params.projectDir,
          resource: params.resource,
          folderName: declaration.folderName,
          yamlFileName: declaration.yamlFileName,
          role: declaration.role,
        }),
      )
    }
  }

  return targets
}

function readModel(
  resource: MetadataProjectPropertiesYamlRef,
  context: ConfigurationContext,
): Record<string, unknown> | undefined {
  if (resource.absolutePath === undefined) return undefined

  try {
    const yaml = importFromYAML<Record<string, unknown>>(readFileSync(resource.absolutePath, "utf-8"))
    return importMetadataItemFromYAML({
      context,
      yaml,
      rule: resource.owner.spec.rule,
      name: resource.owner.name,
    }) as Record<string, unknown> | undefined
  } catch {
    return undefined
  }
}

function namedItems(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => (isRecord(item) && typeof item.name === "string" ? item.name : undefined))
    .filter((name): name is string => name !== undefined)
}

function listFileItemTargets(params: {
  projectDir: string
  resource: MetadataProjectPropertiesYamlRef
  folderName: string
  yamlFileName: string
  role: Extract<MetadataOperationTarget, { kind: "fileItem" }>["role"]
}): ListedMetadataOperationTarget[] {
  const folderPath = join(params.projectDir, params.resource.owner.dir, params.resource.owner.name, params.folderName)
  if (!existsSync(folderPath)) return []

  return readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(join(folderPath, entry.name, params.yamlFileName)))
    .map((entry) => ({
      target: {
        kind: "fileItem" as const,
        owner: { itemTypePrefix: params.resource.owner.dir, name: params.resource.owner.name },
        role: params.role,
        name: entry.name,
      },
      displayPath: `${params.resource.owner.dir}.${params.resource.owner.name}.${roleDisplaySegment(params.role)}.${entry.name}`,
      projectPath: `${params.resource.owner.dir}/${params.resource.owner.name}/${params.folderName}/${entry.name}/${params.yamlFileName}`,
      canRename: true,
      canDelete: true,
      requiresMigration: false,
    }))
}

function matchesTargetFilters(target: ListedMetadataOperationTarget, params: ListMetadataOperationTargetsParams): boolean {
  if (params.kind !== undefined && target.target.kind !== params.kind) return false
  if (params.owner !== undefined) {
    const owner = targetOwner(target.target)
    if (owner.itemTypePrefix !== params.owner.itemTypePrefix || owner.name !== params.owner.name) return false
  }
  if (params.query !== undefined) {
    const query = params.query.toLocaleLowerCase("ru")
    if (!target.displayPath.toLocaleLowerCase("ru").includes(query)) return false
  }

  return true
}

function targetOwner(target: MetadataOperationTarget): { itemTypePrefix: string; name: string } {
  if (target.kind === "object") return { itemTypePrefix: target.itemTypePrefix, name: target.name }
  return target.owner
}

function roleDisplaySegment(role: Extract<MetadataOperationTarget, { kind: "fileItem" }>["role"]): string {
  if (role === "form") return "Форма"
  if (role === "template") return "Макет"
  return "Команда"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
