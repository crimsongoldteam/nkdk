import fs from "fs"
import { basename, join } from "path"
import type { ConfigurationContext, ConfigurationContextFromXML } from "../../../context/types"
import { importMetadataItemFromXML, importMetadataItemFromYAML } from "../../../orchestration"
import type { MetadataItemRule } from "../../../orchestration/property/types"
import { importContentFromXML } from "../../../../xml/import/importer"
import { importFromYAML } from "../../../../yaml/import"
import { TopLevelMetadataItemRules } from "../topLevelRules"
import type { StructuralNode, StructuralState } from "./types"
import { withYAMLImportDiagnostics } from "../../../orchestration/yamlImportError"

export async function collectStructuralStateFromYAML(params: {
  yamlDir: string
  context: ConfigurationContext
}): Promise<StructuralState> {
  const nodes = new Map<string, StructuralNode>()
  if (!fs.existsSync(params.yamlDir)) throw new Error(`YAML-каталог не найден: ${params.yamlDir}`)

  for (const rule of TopLevelMetadataItemRules) {
    if (!rule.itemTypePrefix) continue
    const dir = join(params.yamlDir, rule.itemTypePrefix)
    if (!fs.existsSync(dir)) continue
    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const yamlPath = join(dir, entry.name, "Свойства.yaml")
      if (!fs.existsSync(yamlPath)) continue
      const yaml = importFromYAML<Record<string, unknown>>(await fs.promises.readFile(yamlPath, "utf-8"))
      const itemContext = withYAMLImportDiagnostics(params.context, {
        sourceFile: yamlPath,
        objectPath: `${rule.itemTypePrefix}.${entry.name}`,
      })
      const model = importMetadataItemFromYAML({ context: itemContext, yaml, rule, name: entry.name })
      if (model) addModel(nodes, rule, entry.name, model as Record<string, unknown>)
    }
  }

  return { nodes }
}

export async function collectStructuralStateFromXML(params: {
  xmlDir: string
  context: ConfigurationContextFromXML
}): Promise<StructuralState> {
  const nodes = new Map<string, StructuralNode>()
  if (!fs.existsSync(params.xmlDir)) return { nodes }

  for (const rule of TopLevelMetadataItemRules) {
    if (!rule.xmlDir || !rule.itemTypePrefix) continue
    const dir = join(params.xmlDir, rule.xmlDir)
    if (!fs.existsSync(dir)) continue
    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".xml")) continue
      const name = basename(entry.name, ".xml")
      const content = await fs.promises.readFile(join(dir, entry.name), "utf-8")
      const parsed = importContentFromXML<{ MetaDataObject: unknown }>(content)
      const model = importMetadataItemFromXML({ context: params.context, xml: parsed.MetaDataObject, rule })
      if (model) addModel(nodes, rule, name, model as Record<string, unknown>)
    }
  }

  return { nodes }
}

function addModel(
  nodes: Map<string, StructuralNode>,
  rule: MetadataItemRule,
  name: string,
  model: Record<string, unknown>
): void {
  const prefix = rule.itemTypePrefix!
  const objectPath = `${prefix}.${name}`
  nodes.set(objectPath, { path: objectPath, kind: "object", name, referencePath: objectPath })

  for (const attr of asItems(model["attributes"])) {
    const attrName = requireNodeName(attr, objectPath, "Реквизит")
    const path = `${objectPath}.Реквизит.${attrName}`
    nodes.set(path, { path, kind: "attribute", name: attrName, referencePath: path })
  }

  for (const attr of asItems(model["addressingAttributes"])) {
    const attrName = requireNodeName(attr, objectPath, "РеквизитАдресации")
    const path = `${objectPath}.РеквизитАдресации.${attrName}`
    nodes.set(path, { path, kind: "attribute", name: attrName, referencePath: path })
  }

  for (const section of asItems(model["tabularSections"])) {
    const sectionName = requireNodeName(section, objectPath, "ТабличнаяЧасть")
    const sectionPath = `${objectPath}.ТабличнаяЧасть.${sectionName}`
    nodes.set(sectionPath, { path: sectionPath, kind: "tabularSection", name: sectionName, referencePath: sectionPath })
    for (const attr of asItems(section["attributes"])) {
      const attrName = requireNodeName(attr, sectionPath, "Реквизит")
      const attrPath = `${sectionPath}.Реквизит.${attrName}`
      nodes.set(attrPath, { path: attrPath, kind: "attribute", name: attrName, referencePath: attrPath })
    }
  }

  for (const dim of asItems(model["dimensions"])) {
    const dimName = requireNodeName(dim, objectPath, "Измерение")
    const path = `${objectPath}.Измерение.${dimName}`
    nodes.set(path, { path, kind: "dimension", name: dimName, referencePath: path })
  }

  for (const resource of asItems(model["resources"])) {
    const resourceName = requireNodeName(resource, objectPath, "Ресурс")
    const path = `${objectPath}.Ресурс.${resourceName}`
    nodes.set(path, { path, kind: "attribute", name: resourceName, referencePath: path })
  }
}

function requireNodeName(item: Record<string, unknown>, ownerPath: string, nodeType: string): string {
  const name = item["name"]
  if (typeof name === "string" && name.length > 0) return name
  throw new Error(`Некорректное имя узла: владелец ${ownerPath}, тип ${nodeType}`)
}

function asItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value))
    return value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
  return []
}
