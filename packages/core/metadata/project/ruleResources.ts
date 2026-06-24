import type { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
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

export type MetadataProjectXmlDescriptor =
  | MetadataProjectObjectXmlDescriptor
  | MetadataProjectExternalXmlDescriptor

export interface MetadataProjectObjectXmlDescriptor {
  kind: "xml"
  role: "objectXml"
  xmlDir: string
}

export type MetadataProjectExternalXmlDescriptor =
  MetadataProjectExternalXmlBaseDescriptor & MetadataProjectExternalXmlPathDescriptor

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

function describePropertyXmlPath(
  propertyRule: PropertyRule
): MetadataProjectExternalXmlPathDescriptor {
  const xmlPath = "xmlPath" in propertyRule ? propertyRule.xmlPath : undefined
  if (typeof xmlPath === "string") {
    return { xmlPath, xmlPathKind: "static" }
  }
  if (typeof xmlPath === "function") {
    return { xmlPathKind: "dynamic" }
  }
  return { xmlPathKind: "sameAsFilePath" }
}
