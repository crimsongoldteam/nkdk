import fs from "fs"
import { basename, join } from "path"
import type { ConfigurationContext, ConfigurationContextFromXML } from "../../../context/types"
import { importMetadataItemFromXMLToYAML } from "../../../orchestration/metadataItem/fromXMLToYAML"
import type { MetadataItemRule, PropertyRule } from "../../../orchestration/property/types"
import { getTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { importContentFromXML } from "../../../../xml/import/importer"
import { importFromYAML } from "../../../../yaml/import"
import { createLocalIndexesCollector } from "../../../project/localIndexes"
import { TopLevelMetadataItemRules } from "../topLevelRules"
import type { StructuralNode, StructuralState } from "./types"

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
      addYaml(nodes, rule, entry.name, yaml)
    }
  }

  return { nodes }
}

function addYaml(nodes: Map<string, StructuralNode>, rule: MetadataItemRule, name: string, yaml: unknown): void {
  const prefix = rule.itemTypePrefix!
  const objectPath = `${prefix}.${name}`
  nodes.set(objectPath, { path: objectPath, kind: "object", name, referencePath: objectPath })
  addYamlCollections(nodes, rule, asRecord(yaml) ?? {}, objectPath)
}

function addYamlCollections(
  nodes: Map<string, StructuralNode>,
  rule: MetadataItemRule,
  yaml: Record<string, unknown>,
  ownerPath: string
): void {
  for (const property of Object.values(rule.properties) as PropertyRule[]) {
    const target = property.operationTarget
    if (target?.kind !== "namedCollectionTarget" || !target.requiresMigration || property.yaml === undefined) continue

    const collection = asRecord(yaml[property.yaml])
    if (collection === undefined) continue
    const itemRule = nestedItemRule(property)

    for (const [name, value] of Object.entries(collection)) {
      if (name.length === 0) {
        throw new Error(`Некорректное имя узла: владелец ${ownerPath}, тип ${target.migrationSegment}`)
      }
      const path = `${ownerPath}.${target.migrationSegment}.${name}`
      nodes.set(path, {
        path,
        kind: structuralKind(target.targetKind),
        name,
        referencePath: path,
      })
      const item = asRecord(value)
      if (itemRule !== undefined && item !== undefined) addYamlCollections(nodes, itemRule, item, path)
    }
  }
}

function nestedItemRule(property: PropertyRule): MetadataItemRule | undefined {
  const collectionRule = getTypeRule(property.type, "collectionItemRule")
  if (collectionRule?.itemRule !== undefined) return collectionRule.itemRule
  return "itemRule" in property ? (property.itemRule as MetadataItemRule | undefined) : undefined
}

function structuralKind(kind: string): StructuralNode["kind"] {
  if (kind === "resource" || kind === "addressingAttribute") return "attribute"
  if (kind === "attribute" || kind === "tabularSection" || kind === "dimension") return kind
  throw new Error(`Неподдерживаемый структурный тип: ${kind}`)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export async function collectStructuralStateFromXML(params: {
  xmlDir: string
  context: ConfigurationContextFromXML
}): Promise<StructuralState> {
  const nodes = new Map<string, StructuralNode>()
  if (!fs.existsSync(params.xmlDir)) return { nodes }
  const context =
    params.context.exportToYAML === undefined
      ? { ...params.context, exportToYAML: { toTyped: false as const } }
      : params.context

  for (const rule of TopLevelMetadataItemRules) {
    if (!rule.xmlDir || !rule.itemTypePrefix) continue
    const dir = join(params.xmlDir, rule.xmlDir)
    if (!fs.existsSync(dir)) continue
    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".xml")) continue
      const name = basename(entry.name, ".xml")
      const content = await fs.promises.readFile(join(dir, entry.name), "utf-8")
      const parsed = importContentFromXML<{ MetaDataObject: unknown }>(content)
      const yaml = importMetadataItemFromXMLToYAML({
        context,
        xml: parsed.MetaDataObject,
        rule,
        name,
        traversal: {
          yamlPath: [],
          rulePath: [],
          collector: createLocalIndexesCollector(),
        },
      })
      if (yaml !== undefined) addYaml(nodes, rule, name, yaml)
    }
  }

  return { nodes }
}
