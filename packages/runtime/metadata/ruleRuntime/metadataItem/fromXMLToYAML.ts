import type { ConfigurationContextFromXML } from "../../context/types"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import type { DirectImportTraversal } from "../property/importYamlTypes"
import { enterNestedYamlRule } from "../property/yamlRuleCursor"
import type { MetadataItemRule } from "../property/types"
import type { PropertyRuleExecution } from "../property/fn"
import { findInlineProperty } from "./yamlInline"
import { currentPropertyRuleRegistrySet } from "../property/propertyRuleExecutionContext"
import type { MetadataItemXmlImportAugmenter } from "./augmenterRegistry"
import type { XmlElementNode } from "../../../xml/import/document"
import { xmlImportCompatibilityContainer } from "../xmlAnomaly/compatibilityView"
import { projectXmlAuditRemainder } from "../xmlAnomaly/yamlProjection"

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
  const traversalRootNode = params.traversal.xmlNodes?.length === 1
    ? params.traversal.xmlNodes[0]
    : undefined
  const rootNodeFromTraversal = !isXmlElementNode(params.xml) && traversalRootNode !== undefined
  const rootNode = isXmlElementNode(params.xml)
    ? params.xml
    : rootNodeFromTraversal
      ? traversalRootNode
      : undefined
  const root = asRecord(rootNode?.compatibilityValue ?? params.xml)
  const sourceNode = rootNode === undefined
    ? undefined
    : xmlRoot === undefined
      ? rootNode
      : rootNode.content.find(
          (node): node is XmlElementNode =>
            node.type === "element" && node.name === xmlRoot.container,
        )
  const sourceValue = sourceNode?.compatibilityValue ?? (
    xmlRoot === undefined ? root : root?.[xmlRoot.container]
  )
  const source = asRecord(sourceValue)
  if (source === undefined) return undefined
  const inline = findInlinePropertyCached(params.rule)

  const context = contextWithItemParent(params.context, params.name, params.rule.itemType)
  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule: params.rule,
    sources: [{
      context,
      xml: sourceNode ?? source,
      claimAuditRoot: !(rootNodeFromTraversal && sourceNode === rootNode),
    }],
    itemName: params.name,
    yamlPath: params.traversal.yamlPath,
    rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
    collector: params.traversal.collector,
    deferred: params.traversal.deferred,
    dependent: params.traversal.dependent,
    audit: params.traversal.audit,
    annotations: params.traversal.annotations,
    profile: params.traversal.profile,
    propertyXML: params.propertyXML,
    execution: propertyExecutionFromTraversal(params.traversal),
  })
  if (yaml !== undefined) {
    const augmenterRegistry = propertyExecutionFromTraversal(params.traversal) ??
      currentPropertyRuleRegistrySet<{
        applyMetadataItemXmlImportAugmenter(
          value: Parameters<MetadataItemXmlImportAugmenter["augment"]>[0],
        ): void
      }>()
    const augmenterSource = sourceNode === undefined
      ? source
      : asRecord(xmlImportCompatibilityContainer({
          node: sourceNode,
          audit: params.traversal.audit,
          boundary: {
            itemType: params.rule.itemType,
            yamlPath: params.traversal.yamlPath,
            rulePath: params.traversal.rulePath,
          },
        })) ?? source
    augmenterRegistry?.applyMetadataItemXmlImportAugmenter({
      context,
      rule: params.rule,
      source: augmenterSource,
      yaml,
    })
    if (
      sourceNode !== undefined &&
      params.traversal.audit !== undefined &&
      params.traversal.annotations !== undefined &&
      inline === undefined
    ) {
      projectXmlAuditRemainder({
        yaml,
        annotations: params.traversal.annotations,
        audit: params.traversal.audit,
        root: sourceNode,
        boundary: {
          itemType: params.rule.itemType,
          yamlPath: params.traversal.yamlPath,
          rulePath: params.traversal.rulePath,
        },
      })
    }
  }
  return inline === undefined ? yaml : yaml?.[inline.yamlKey]
}

function propertyExecutionFromTraversal(
  traversal: DirectImportTraversal,
): PropertyRuleExecution | undefined {
  return traversal.execution as PropertyRuleExecution | undefined
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
  name: string | undefined,
  itemType: string,
): ConfigurationContextFromXML {
  if (context.exportToYAML === undefined) return context
  return {
    ...context,
    exportToYAML: {
      ...context.exportToYAML,
      ...(name === undefined ? {} : { parent: { name } }),
      metadataItemTypes: [...(context.exportToYAML.metadataItemTypes ?? []), itemType],
    },
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function isXmlElementNode(value: unknown): value is XmlElementNode {
  return value !== null &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "element" &&
    "compatibilityValue" in value
}
