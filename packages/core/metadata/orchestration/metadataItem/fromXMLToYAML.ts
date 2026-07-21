import type { ConfigurationContextFromXML } from "../../context/types"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import type { DirectImportTraversal } from "../property/importYamlTypes"
import { enterNestedYamlRule } from "../property/yamlRuleCursor"
import type { MetadataItemRule } from "../property/types"
import { findInlineProperty } from "./yamlInline"

type InlineProperty = ReturnType<typeof findInlineProperty>

const inlineProperties = new WeakMap<MetadataItemRule, InlineProperty | null>()

export function importMetadataItemFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  xml: unknown
  name?: string
  traversal: DirectImportTraversal
  propertyXML?: ReadonlyMap<string, unknown>
}): unknown {
  const xmlRoot = Object.values(params.rule.properties).find(
    (propertyRule) => propertyRule.type === "XMLRoot" && typeof propertyRule.container === "string"
  )
  const root = asRecord(params.xml)
  const source = xmlRoot === undefined ? root : asRecord(root?.[xmlRoot.container])
  if (source === undefined) return undefined

  const yaml = importPropertiesFromXMLToYAML({
    context: contextWithItemParent(params.context, params.name),
    rule: params.rule,
    xml: source,
    itemName: params.name,
    yamlPath: params.traversal.yamlPath,
    rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
    collector: params.traversal.collector,
    propertyXML: params.propertyXML,
  })
  const inline = findInlinePropertyCached(params.rule)
  return inline === undefined ? yaml : yaml?.[inline.yamlKey]
}

function findInlinePropertyCached(rule: MetadataItemRule): InlineProperty {
  const cached = inlineProperties.get(rule)
  if (cached !== undefined) return cached ?? undefined
  const inline = findInlineProperty(rule)
  inlineProperties.set(rule, inline ?? null)
  return inline
}

function contextWithItemParent(
  context: ConfigurationContextFromXML,
  name: string | undefined
): ConfigurationContextFromXML {
  if (name === undefined || context.exportToYAML === undefined) return context
  return {
    ...context,
    exportToYAML: { ...context.exportToYAML, parent: { name } },
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
