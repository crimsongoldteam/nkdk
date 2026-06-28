import { posix } from "path"
import {
  describeMetadataRuleXmlSyncRoutes,
  expandProjectPattern,
  matchProjectPattern,
} from "~/metadata/project/ruleResources"
import type { ProjectResourceCompositionImpact, ProjectResourceSource } from "~/metadata/orchestration/property/fn"
import type { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"

export type XmlSyncArea =
  | {
      kind: "owner"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      xmlDir: string
    }
  | {
      kind: "fileItem"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      xmlDir: string
      xmlPath: string
      propertyName: string
      propertyType: PropertyRuleType
      routeParams: Record<string, string>
      compositionImpact: ProjectResourceCompositionImpact
      dumpInfoNames: string[]
    }
  | {
      kind: "externalFile"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      xmlDir: string
      xmlPath: string
      propertyName?: string
      propertyType?: PropertyRuleType
      routeParams: Record<string, string>
      deleteParentAreaBeforeWrite?: boolean
      dumpInfoNames: string[]
    }

export type SyncAreaDeclaration =
  | { kind: "objectModule"; yamlFile: string; xmlPath: string }
  | { kind: "formModule"; yamlFile: string; xmlPath: string }
  | { kind: "formHelp"; yamlDir: string; xmlBasePath: string }
  | { kind: "templateContent"; yamlFile: string; xmlPath: string }
  | { kind: "commandModule"; yamlFile: string; xmlPath: string }

const PROPERTIES_YAML = "Свойства.yaml"

export function resolveXmlSyncAreaForProjectPath(
  projectPath: string,
  rules: readonly MetadataItemRule[]
): XmlSyncArea | undefined {
  const parts = normalizePath(projectPath).split("/")
  const rule = rules.find((candidate) => candidate.itemTypePrefix === parts[0] && candidate.xmlDir !== undefined)
  if (!rule?.itemTypePrefix || !rule.xmlDir || !parts[1]) return undefined

  const itemTypePrefix = rule.itemTypePrefix
  const itemName = parts[1]
  const xmlDir = rule.xmlDir

  if (parts.length === 3 && parts[2] === PROPERTIES_YAML) {
    return { kind: "owner", itemType: rule.itemType, itemTypePrefix, itemName, xmlDir }
  }

  const routedArea = resolveRouteArea({ rule, itemTypePrefix, itemName, xmlDir, projectTail: parts.slice(2).join("/") })
  if (routedArea) return routedArea

  return resolveDeclaredArea({ rule, itemTypePrefix, itemName, xmlDir, parts })
}

function resolveRouteArea(params: {
  rule: MetadataItemRule
  itemTypePrefix: string
  itemName: string
  xmlDir: string
  projectTail: string
}): XmlSyncArea | undefined {
  for (const route of describeMetadataRuleXmlSyncRoutes(params.rule)) {
    if (route.kind === "owner" || route.kind === "resourceOnly") continue
    const routeParams = matchProjectPattern(route.yamlPattern, params.projectTail)
    if (routeParams === undefined) continue
    const sourceProperty = getSourceProperty(route.source)
    if (sourceProperty === undefined) continue
    const expansionParams = {
      ...routeParams,
      ownerName: params.itemName,
      dumpRoot: dumpRoot(params.rule),
    }
    const areaBase = {
      itemType: params.rule.itemType,
      itemTypePrefix: params.itemTypePrefix,
      itemName: params.itemName,
      xmlDir: params.xmlDir,
      xmlPath: posix.join(params.xmlDir, params.itemName, expandProjectPattern(route.xmlPathPattern, expansionParams)),
      propertyName: sourceProperty.propertyName,
      propertyType: sourceProperty.propertyType,
      routeParams,
      dumpInfoNames: (route.dumpInfoNamePatterns ?? []).map((pattern) => expandProjectPattern(pattern, expansionParams)),
    }

    if (route.kind === "fileItem") {
      return {
        kind: "fileItem",
        ...areaBase,
        compositionImpact: "none",
      }
    }

    return {
      kind: "externalFile",
      ...areaBase,
      deleteParentAreaBeforeWrite: route.deleteParentAreaBeforeWrite,
    }
  }

  return undefined
}

function resolveDeclaredArea(params: {
  rule: MetadataItemRule
  itemTypePrefix: string
  itemName: string
  xmlDir: string
  parts: string[]
}): XmlSyncArea | undefined {
  for (const [, propertyRule] of Object.entries(params.rule.properties) as [string, PropertyRule][]) {
    const declaration = propertyRule.syncArea
    if (!declaration) continue

    if (declaration.kind === "objectModule" && matchesTail(params.parts, declaration.yamlFile)) {
      return {
        kind: "externalFile",
        itemType: params.rule.itemType,
        itemTypePrefix: params.itemTypePrefix,
        itemName: params.itemName,
        xmlDir: params.xmlDir,
        xmlPath: posix.join(params.xmlDir, params.itemName, declaration.xmlPath),
        routeParams: {},
        dumpInfoNames: [`${dumpRoot(params.rule)}.${params.itemName}`, `${dumpRoot(params.rule)}.${params.itemName}.ObjectModule`],
      }
    }
  }

  return undefined
}

function normalizePath(path: string): string {
  return path.split(/[\\/]+/).filter(Boolean).join("/")
}

function matchesTail(parts: string[], tail: string): boolean {
  return parts.slice(2).join("/") === normalizePath(tail)
}

function getSourceProperty(source: ProjectResourceSource): { propertyName: string; propertyType: PropertyRuleType } | undefined {
  if (source.kind === "property") {
    return { propertyName: source.propertyName, propertyType: source.propertyType }
  }
  return undefined
}

function dumpRoot(rule: MetadataItemRule): string {
  const external = rule.externalMetadata
  if (external?.segment) return external.segment
  for (const propertyRule of Object.values(rule.properties)) {
    if (propertyRule.type === "XMLRoot" && "container" in propertyRule && typeof propertyRule.container === "string") {
      return propertyRule.container
    }
  }
  return String(rule.itemType).replace(/^Metadata/, "")
}
