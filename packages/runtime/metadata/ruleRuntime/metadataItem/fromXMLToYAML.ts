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
  beforeFinish?: (yaml: Record<string, unknown>) => void
}): unknown {
  const xmlRoot = Object.values(params.rule.properties).find(
    (propertyRule) => propertyRule.type === "XMLRoot" && typeof propertyRule.container === "string"
  )
  const rootNode = isXmlElementNode(params.xml) ? params.xml : undefined
  const root = rootNode === undefined ? objectRecordOrUndefined(params.xml) : undefined
  const sourceNode = rootNode === undefined
    ? undefined
    : xmlRoot === undefined || rootNode.name === xmlRoot.container
      ? rootNode
      : rootNode.content.find(
          (node): node is XmlElementNode =>
            node.type === "element" && node.name === xmlRoot.container,
        )
  const source = sourceNode === undefined
    ? objectRecordOrUndefined(xmlRoot === undefined ? root : root?.[xmlRoot.container])
    : sourceNode.attributes.length > 0 || sourceNode.content.some(node => node.type !== "text")
      ? sourceNode
      : undefined
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
  const augmenterSource = !("metadataItemAugmenter" in params.context.fromXML)
    || typeof params.context.fromXML.metadataItemAugmenter !== "string"
    ? {}
    : sourceNode === undefined
    ? objectRecordOrUndefined(source) ?? {}
    : sourceNode
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
      ...(xmlRoot === undefined || rootNode === undefined ? {} : { envelopeSource: rootNode }),
      claimAuditRoot: shouldClaimAuditRoot({
        rootNodeFromTraversal: rootNode !== undefined && params.traversal.xmlNodes?.includes(rootNode) === true,
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
    dependencies: params.traversal.dependencies,
    roundTrip: params.traversal.roundTrip,
    audit: params.traversal.audit,
    annotations: params.traversal.annotations,
    mode: params.traversal.mode,
    facts: params.traversal.facts,
    produceResult: params.traversal.produceResult,
    profile: params.traversal.profile,
    propertyXML: params.propertyXML,
    propertyXMLNodes: params.propertyXMLNodes,
    execution: propertyExecutionFromTraversal(params.traversal),
    beforeFinish: (yaml) => {
      augmenterRegistry?.applyMetadataItemXmlImportAugmenter({
        context,
        rule: params.rule,
        source: augmenterSource,
        yaml,
      })
      params.beforeFinish?.(yaml)
    },
  })
  if (yaml !== undefined) {
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
