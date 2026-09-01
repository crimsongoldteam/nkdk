import type { ConfigurationContextFromXML } from "../../context/types"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import type { DirectImportTraversal } from "../property/importYamlTypes"
import { enterNestedYamlRule } from "../property/yamlRuleCursor"
import type { MetadataItemRule } from "../property/types"
import type { CompiledPropertyRuleExecution } from "../property/compiledPropertyPlan"
import { findInlineProperty } from "./yamlInline"
import { currentPropertyRuleRegistrySet } from "../property/propertyRuleExecutionContext"
import {
  withResolvedXMLImportObjectVariant,
  type MetadataItemXmlImportAugmenter,
} from "./augmenterRegistry"
import { isXmlElementNode, type XmlElementNode } from "../../../xml/import/document"
import { objectRecordOrUndefined } from "../../../helpers/record"
import {
  xmlImportCompatibilityContainer,
  xmlImportNodeForCompatibilityValue,
} from "../xmlAnomaly/compatibilityView"
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
  propertyXMLNodes?: ReadonlyMap<string, readonly XmlElementNode[]>
}): unknown {
  const xmlRoot = Object.values(params.rule.properties).find(
    (propertyRule) => propertyRule.type === "XMLRoot" && typeof propertyRule.container === "string"
  )
  const traversalRootNode = !isXmlElementNode(params.xml)
    ? xmlImportNodeForCompatibilityValue(params.xml)
      ?? findCompatibilityXmlNode(params.traversal.xmlNodes, params.xml)
    : undefined
  const rootNodeFromTraversal = traversalRootNode !== undefined
  const rootNode = isXmlElementNode(params.xml)
    ? params.xml
    : rootNodeFromTraversal
      ? traversalRootNode
      : undefined
  const root = objectRecordOrUndefined(rootNode?.compatibilityValue ?? params.xml)
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
  const source = objectRecordOrUndefined(sourceValue)
  if (source === undefined) return undefined
  const inline = findInlinePropertyCached(params.rule)
  claimKnownXsiType({
    rule: params.rule,
    sourceNode,
    traversal: params.traversal,
  })

  const augmenterRegistry = propertyExecutionFromTraversal(params.traversal) ??
    currentPropertyRuleRegistrySet<{
      resolveMetadataItemXMLDefaultVariant(
        value: import("./augmenterRegistry").MetadataItemXmlImportVariantParams,
      ): import("../../context/types").XMLImportObjectVariant | undefined
      applyMetadataItemXmlImportAugmenter(
        value: Parameters<MetadataItemXmlImportAugmenter["augment"]>[0],
      ): void
    }>()
  const augmenterSource = sourceNode === undefined
    ? source
    : objectRecordOrUndefined(xmlImportCompatibilityContainer({
        node: sourceNode,
        audit: params.traversal.audit,
        boundary: {
          itemType: params.rule.itemType,
          yamlPath: params.traversal.yamlPath,
          rulePath: params.traversal.rulePath,
        },
      })) ?? source
  const resolvedVariant = augmenterRegistry?.resolveMetadataItemXMLDefaultVariant({
    context: params.context,
    rule: params.rule,
    source: augmenterSource,
  })
  const variantContext = withResolvedXMLImportObjectVariant(params.context, resolvedVariant)
  const context = contextWithItemParent(variantContext, params.name, params.rule.itemType)
  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule: params.rule,
    sources: [{
      context,
      xml: sourceNode ?? source,
      claimAuditRoot: shouldClaimAuditRoot({
        rootNodeFromTraversal,
        sourceNode,
        rootNode,
        audit: params.traversal.audit,
      }),
    }],
    itemName: params.name,
    yamlPath: params.traversal.yamlPath,
    rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
    collector: params.traversal.collector,
    deferred: params.traversal.deferred,
    dependent: params.traversal.dependent,
    audit: params.traversal.audit,
    annotations: params.traversal.annotations,
    mode: params.traversal.mode,
    facts: params.traversal.facts,
    produceResult: params.traversal.produceResult,
    profile: params.traversal.profile,
    propertyXML: params.propertyXML,
    propertyXMLNodes: params.propertyXMLNodes,
    execution: propertyExecutionFromTraversal(params.traversal),
  })
  if (yaml !== undefined) {
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

function shouldClaimAuditRoot(params: {
  readonly rootNodeFromTraversal: boolean
  readonly sourceNode: XmlElementNode | undefined
  readonly rootNode: XmlElementNode | undefined
  readonly audit: DirectImportTraversal["audit"]
}): boolean {
  if (!params.rootNodeFromTraversal || params.sourceNode !== params.rootNode) return true
  if (params.sourceNode === undefined || params.audit === undefined) return false
  const state = params.audit.getOutcome(params.sourceNode).state
  return state === "unclaimed" || state === "unknown"
}

function claimKnownXsiType(params: {
  rule: MetadataItemRule
  sourceNode?: XmlElementNode
  traversal: DirectImportTraversal
}): void {
  if (
    params.rule.xsiType === undefined ||
    params.sourceNode === undefined ||
    params.traversal.audit === undefined
  ) return
  const attribute = params.sourceNode.attributes.find(
    ({ name, value }) => name === "xsi:type" && value === params.rule.xsiType,
  )
  if (attribute === undefined) return
  params.traversal.audit.claim(attribute, {
    itemType: params.rule.itemType,
    yamlPath: params.traversal.yamlPath,
    rulePath: params.traversal.rulePath,
  })
}

function propertyExecutionFromTraversal(
  traversal: DirectImportTraversal,
): CompiledPropertyRuleExecution | undefined {
  return traversal.execution as CompiledPropertyRuleExecution | undefined
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

function findCompatibilityXmlNode(
  roots: readonly XmlElementNode[] | undefined,
  value: unknown,
): XmlElementNode | undefined {
  if (roots === undefined || value === null || typeof value !== "object") return undefined
  const pending = [...roots]
  while (pending.length > 0) {
    const current = pending.pop()!
    if (current.compatibilityValue === value) return current
    for (const child of current.content) {
      if (child.type === "element") pending.push(child)
    }
  }
  return undefined
}
