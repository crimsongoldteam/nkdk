import { posix } from "path"
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
      childKind: "form" | "template"
      childName: string
      xmlDir: string
      xmlBasePath: string
      ownerCompositionChanges: boolean
    }
  | {
      kind: "externalFile"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      childKind?: "form" | "template" | "command"
      childName?: string
      xmlDir: string
      xmlPath: string
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
const FORM_YAML = "Форма.yaml"

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

  if (parts[2] === "Формы" && parts[3]) {
    const formName = parts[3]
    if (parts.length === 5 && parts[4] === FORM_YAML) {
      return {
        kind: "fileItem",
        itemType: rule.itemType,
        itemTypePrefix,
        itemName,
        childKind: "form",
        childName: formName,
        xmlDir,
        xmlBasePath: posix.join(xmlDir, itemName, "Forms", formName),
        ownerCompositionChanges: false,
      }
    }

    if (parts.length === 5 && parts[4] === "Модуль.bsl") {
      return {
        kind: "externalFile",
        itemType: rule.itemType,
        itemTypePrefix,
        itemName,
        childKind: "form",
        childName: formName,
        xmlDir,
        xmlPath: posix.join(xmlDir, itemName, "Forms", formName, "Ext", "Form", "Module.bsl"),
        dumpInfoNames: [`${dumpRoot(rule)}.${itemName}.Form.${formName}`, `${dumpRoot(rule)}.${itemName}.Form.${formName}.Form`],
      }
    }
  }

  return resolveDeclaredArea({ rule, itemTypePrefix, itemName, xmlDir, parts })
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

function dumpRoot(rule: MetadataItemRule): string {
  const external = rule.externalMetadata
  if (external?.segment) return external.segment
  if (rule.itemType === "MetadataCatalog") return "Catalog"
  return String(rule.itemType).replace(/^Metadata/, "")
}
