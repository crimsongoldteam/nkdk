import type { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { ProjectResourceDescriptor, XmlSyncRoute } from "~/metadata/orchestration/property/fn"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"

export type MetadataProjectResourceDescriptor =
  | MetadataProjectYamlDescriptor
  | MetadataProjectXmlDescriptor
  | MetadataProjectAssetDescriptor
  | MetadataProjectDynamicDescriptor

export type MetadataProjectYamlDescriptor =
  | MetadataProjectConfigurationYamlDescriptor
  | MetadataProjectPropertiesYamlDescriptor

export interface MetadataProjectConfigurationYamlDescriptor {
  kind: "yaml"
  role: "configuration"
}

export interface MetadataProjectPropertiesYamlDescriptor {
  kind: "yaml"
  role: "properties"
  itemTypePrefix: string
}

export type MetadataProjectXmlDescriptor = MetadataProjectObjectXmlDescriptor | MetadataProjectExternalXmlDescriptor

export interface MetadataProjectObjectXmlDescriptor {
  kind: "xml"
  role: "objectXml"
  xmlDir: string
}

export type MetadataProjectExternalXmlDescriptor = MetadataProjectExternalXmlBaseDescriptor &
  MetadataProjectExternalXmlPathDescriptor

export interface MetadataProjectExternalXmlBaseDescriptor {
  kind: "xml"
  role: "externalXml"
  propertyName: string
  propertyType: PropertyRuleType
  filePath: string
}

export type MetadataProjectExternalXmlPathDescriptor =
  | { xmlPathKind: "sameAsFilePath" }
  | { xmlPathKind: "static"; xmlPath: string }
  | { xmlPathKind: "dynamic" }

export interface MetadataProjectAssetDescriptor {
  kind: "asset"
  role: "externalFile"
  propertyName: string
  propertyType: PropertyRuleType
  nkdkDir: string
  extension: string
  nameFrom: NonNullable<PropertyRule["externalFile"]>["nameFrom"]
}

export interface MetadataProjectDynamicDescriptor {
  kind: "dynamic"
  role: "syncExternal"
  propertyName: string
  propertyType: PropertyRuleType
  hasSyncExternalFromXML: boolean
  hasSyncExternalToXML: boolean
  syncExternalOnly: boolean
}

const configurationItemTypes = new Set<string>(["Configuration", "MetadataConfiguration"])

export function describeMetadataRuleResources(rule: MetadataItemRule): MetadataProjectResourceDescriptor[] {
  const resources: MetadataProjectResourceDescriptor[] = []

  if (configurationItemTypes.has(rule.itemType)) {
    resources.push({ kind: "yaml", role: "configuration" })
  } else if (typeof rule.itemTypePrefix === "string") {
    resources.push({ kind: "yaml", role: "properties", itemTypePrefix: rule.itemTypePrefix })
  }

  if (typeof rule.xmlDir === "string") {
    resources.push({ kind: "xml", role: "objectXml", xmlDir: rule.xmlDir })
  }

  for (const [propertyName, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    collectPropertyResources(resources, propertyName, propertyRule)
  }

  return resources
}

export function describeMetadataRuleProjectResources(rule: MetadataItemRule): ProjectResourceDescriptor[] {
  const resources: ProjectResourceDescriptor[] = []

  if (configurationItemTypes.has(rule.itemType)) {
    resources.push({
      kind: "yaml",
      role: "configuration",
      projectPattern: "Конфигурация.yaml",
      required: true,
      repeatable: false,
      owner: "configuration",
      compositionImpact: "none",
      source: { kind: "itemRule", itemType: rule.itemType },
    })
  } else if (typeof rule.itemTypePrefix === "string") {
    resources.push({
      kind: "yaml",
      role: "properties",
      projectPattern: "Свойства.yaml",
      required: true,
      repeatable: false,
      owner: "currentItem",
      compositionImpact: "configurationComposition",
      source: { kind: "itemRule", itemType: rule.itemType },
    })
  }

  for (const [propertyName, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    collectPropertyProjectResources(resources, propertyName, propertyRule)

    const fromType = getTypeRule(propertyRule.type, "projectResources")?.({ propertyRule }) ?? []
    resources.push(
      ...fromType.map((resource) => ({
        ...resource,
        source:
          resource.source.kind === "propertyType"
            ? { kind: "property" as const, propertyName, propertyType: propertyRule.type }
            : resource.source,
      }))
    )
  }

  return resources
}

function collectPropertyProjectResources(
  resources: ProjectResourceDescriptor[],
  propertyName: string,
  propertyRule: PropertyRule
): void {
  const source = { kind: "property" as const, propertyName, propertyType: propertyRule.type }

  const syncArea = propertyRule.syncArea
  if (syncArea?.kind === "objectModule") {
    resources.push({
      kind: "yaml",
      role: "resourceOnly",
      projectPattern: syncArea.yamlFile,
      required: false,
      repeatable: false,
      owner: "currentItem",
      compositionImpact: "none",
      source,
    })
  }

  const nkdkDir = "nkdkDir" in propertyRule ? propertyRule.nkdkDir : undefined
  const nkdkDirPattern = pathValueToProjectPattern(nkdkDir)
  if (nkdkDirPattern !== undefined) {
    resources.push({
      kind: "directory",
      role: "resourceOnly",
      projectPattern: nkdkDirPattern,
      required: false,
      repeatable: false,
      owner: "currentItem",
      compositionImpact: "none",
      source,
    })
  }

  const nkdkPath = "nkdkPath" in propertyRule ? propertyRule.nkdkPath : undefined
  const nkdkPathPattern = pathValueToProjectPattern(nkdkPath)
  if (nkdkPathPattern !== undefined) {
    resources.push({
      kind: "yaml",
      role: "resourceOnly",
      projectPattern: nkdkPathPattern,
      required: false,
      repeatable: false,
      owner: "currentItem",
      compositionImpact: "none",
      source,
    })
  }

  if (propertyRule.externalFile !== undefined) {
    resources.push({
      kind: "directory",
      role: "resourceOnly",
      projectPattern: propertyRule.externalFile.dir,
      required: false,
      repeatable: false,
      owner: "currentItem",
      compositionImpact: "none",
      source,
    })
  }

  if (propertyRule.syncExternalOnly === true && typeof propertyRule.yaml === "string") {
    resources.push({
      kind: "directory",
      role: "resourceOnly",
      projectPattern: propertyRule.yaml,
      required: false,
      repeatable: false,
      owner: "currentItem",
      compositionImpact: "none",
      source,
    })
  }
}

function pathValueToProjectPattern(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined
): string | undefined {
  if (typeof value === "string") return value
  if (typeof value !== "function") return undefined

  const sample = value({ name: "__NKDK_ITEM_NAME__", parentName: "__NKDK_OWNER_NAME__" })
  return sample.split("__NKDK_ITEM_NAME__").join("{itemName}").split("__NKDK_OWNER_NAME__").join("{ownerName}")
}

export function describeMetadataRuleProjectResourcePatterns(rule: MetadataItemRule): string[] {
  return describeMetadataRuleProjectResources(rule)
    .map((resource) => resource.projectPattern)
    .filter((pattern, index, patterns) => patterns.indexOf(pattern) === index)
}

export function describeMetadataRuleXmlSyncRoutes(rule: MetadataItemRule): XmlSyncRoute[] {
  const routes: XmlSyncRoute[] = []

  if (typeof rule.itemTypePrefix === "string" && typeof rule.xmlDir === "string") {
    routes.push({
      kind: "owner",
      yamlPattern: "Свойства.yaml",
      xmlPathPattern: `${rule.xmlDir}/{ownerName}.xml`,
      source: { kind: "itemRule", itemType: rule.itemType },
    })
  }

  for (const [propertyName, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    const fromType = getTypeRule(propertyRule.type, "xmlSyncRoutes")?.({ propertyRule }) ?? []
    routes.push(
      ...fromType.map((route) => ({
        ...route,
        source:
          route.source.kind === "propertyType"
            ? { kind: "property" as const, propertyName, propertyType: propertyRule.type }
            : route.source,
      }))
    )
  }

  return routes
}

export function matchProjectPattern(pattern: string, projectPath: string): Record<string, string> | undefined {
  const patternParts = pattern.split("/")
  const pathParts = projectPath.split("/")
  if (patternParts.length !== pathParts.length) return undefined

  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]
    const match = patternPart.match(/^\{([^}]+)\}$/)
    if (match) {
      if (!pathPart) return undefined
      params[match[1]] = pathPart
    } else if (patternPart !== pathPart) {
      return undefined
    }
  }
  return params
}

export function expandProjectPattern(pattern: string, params: Record<string, string>): string {
  return pattern.replace(/\{([^}]+)\}/g, (_source, key: string) => params[key] ?? "")
}

function collectPropertyResources(
  resources: MetadataProjectResourceDescriptor[],
  propertyName: string,
  propertyRule: PropertyRule
): void {
  if (typeof propertyRule.filePath === "string") {
    resources.push({
      kind: "xml",
      role: "externalXml",
      propertyName,
      propertyType: propertyRule.type,
      filePath: propertyRule.filePath,
      ...describePropertyXmlPath(propertyRule),
    })
  }

  if (propertyRule.externalFile !== undefined) {
    resources.push({
      kind: "asset",
      role: "externalFile",
      propertyName,
      propertyType: propertyRule.type,
      nkdkDir: propertyRule.externalFile.dir,
      extension: propertyRule.externalFile.extension,
      nameFrom: propertyRule.externalFile.nameFrom,
    })
  }

  const hasSyncExternalFromXML = getTypeRule(propertyRule.type, "syncExternalFromXML") !== undefined
  const hasSyncExternalToXML = getTypeRule(propertyRule.type, "syncExternalToXML") !== undefined
  if (hasSyncExternalFromXML || hasSyncExternalToXML || propertyRule.syncExternalOnly === true) {
    resources.push({
      kind: "dynamic",
      role: "syncExternal",
      propertyName,
      propertyType: propertyRule.type,
      hasSyncExternalFromXML,
      hasSyncExternalToXML,
      syncExternalOnly: propertyRule.syncExternalOnly === true,
    })
  }
}

function describePropertyXmlPath(propertyRule: PropertyRule): MetadataProjectExternalXmlPathDescriptor {
  const xmlPath = "xmlPath" in propertyRule ? propertyRule.xmlPath : undefined
  if (typeof xmlPath === "string") {
    return { xmlPath, xmlPathKind: "static" }
  }
  if (typeof xmlPath === "function") {
    return { xmlPathKind: "dynamic" }
  }
  return { xmlPathKind: "sameAsFilePath" }
}
