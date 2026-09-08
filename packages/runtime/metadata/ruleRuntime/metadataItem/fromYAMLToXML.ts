import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type {
  XMLItemEnvelope,
  YAMLToXMLItemConversionParams,
  YAMLToXMLResult,
  PrepareXMLItemOutputFunction,
} from "../property/fromYAMLToXMLTypes"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { findInlineProperty } from "./yamlInline"
import { recordCurrentExternalMetadataUuid } from "../externalMetadata/record"
import type { DeferredRulePathSegment } from "../property/importYamlTypes"
import { bindDeferredObjectValues } from "../property/deferredObjectValues"
import { applyXMLItemOwnOutput } from "./ownOutput"

export interface ConvertMetadataItemFromYAMLToXMLParams
  extends YAMLToXMLItemConversionParams {
  readonly convertProperties: (
    params: YAMLToXMLItemConversionParams
  ) => YAMLToXMLResult
  readonly ownerYAML?: unknown
  readonly prepareOutput?: PrepareXMLItemOutputFunction
  readonly propertyRule?: PropertyRule
}

interface XMLRootInfo {
  readonly propertyKey: string
  readonly container: string
  readonly isFileRoot: boolean
  readonly fallback:
    | Record<string, string>
    | ((params: { data: unknown; ownerMetadataItem: unknown }) => Record<string, string>)
}

export function convertMetadataItemFromYAMLToXML(params: ConvertMetadataItemFromYAMLToXMLParams): YAMLToXMLResult {
  const item = prepareMetadataItemXMLExecution(params)
  return item.finish(params.convertProperties(item.properties))
}

type MetadataItemXMLPreparationParams = Omit<ConvertMetadataItemFromYAMLToXMLParams, "convertProperties">

/** Общая подготовка без исполнения свойств. XML-источник уже имеет mapping свойств. */
export function prepareMetadataItemXMLExecution(
  params: MetadataItemXMLPreparationParams,
  importedProperties?: Record<string, unknown>,
): { readonly properties: YAMLToXMLItemConversionParams; finish(converted: YAMLToXMLResult): YAMLToXMLResult } {
  const context = params.prepareContext?.() ?? params.context
  const inline = findInlineProperty(params.rule)
  if (
    importedProperties === undefined
    && inline === undefined
    && params.yaml !== undefined
    && !isRecord(params.yaml)
    && params.sparseYAML !== true
  ) {
    const rulePath = params.rulePath ?? []
    const path = rulePath.length === 0 ? params.rule.itemType : rulePath.join(".")
    throw new Error(`${params.rule.itemType}: ожидался YAML-объект; путь rules: ${path}`)
  }
  const yaml = importedProperties ?? (inline === undefined ? params.yaml : { [inline.yamlKey]: params.yaml })
  const root = findXMLRoot(params.rule)
  const normalizedOutputs = params.outputs.map((output) => ({
    ...output,
    xmlEnvelope: prepareXMLItemEnvelope(params, root),
    itemPreparation: output.itemPreparation ?? params.prepareOutput?.({
      context, yaml: params.yaml, itemRule: params.rule,
      name: params.name ?? params.sourceItemName, propertyRule: params.propertyRule,
    }),
  }))
  const itemName = params.name ?? params.sourceItemName
  const itemContext: ConfigurationContextWithExportToXML =
    itemName === undefined
      ? context
      : {
          ...context,
          importFromYAML: {
            ...(context.importFromYAML ?? {}),
            parent: { name: itemName },
          },
        }
  const properties: YAMLToXMLItemConversionParams = {
    context: itemContext,
    yaml,
    annotations: params.annotations,
    rule: params.rule,
    name: params.name,
    namePropertyKey: params.namePropertyKey,
    sourceItemName: params.sourceItemName,
    outputs: normalizedOutputs,
    propertyValues: params.propertyValues,
    sparseYAML: params.sparseYAML,
    omitDefaultsForSparseYAML: params.omitDefaultsForSparseYAML,
    externalWriteFactory: params.externalWriteFactory,
    profile: params.profile,
    rulePath: params.rulePath,
    deferredRulePath: enterDeferredNestedRule(params.deferredRulePath ?? [], params.rule.itemType),
  }
  const finish = (converted: YAMLToXMLResult): YAMLToXMLResult => {
    const outputs = new Map<string, Record<string, unknown>>()
    const deferredByOutput = new Map<string, ReturnType<typeof bindDeferredObjectValues>>()

    for (const request of normalizedOutputs) {
      const generated = converted.outputs.get(request.key) ?? {}
      const generatedWithType =
        params.rule.xsiType === undefined ? generated : { ...request.xmlEnvelope.bodyAttributes, ...generated }
      const finalRoot = wrapXMLRoot(request.xmlEnvelope, applyXMLItemOwnOutput(generatedWithType, request.itemPreparation))
      outputs.set(request.key, finalRoot)
      const prefix = request.xmlEnvelope.path
      deferredByOutput.set(
        request.key,
        bindDeferredObjectValues(
          finalRoot,
          (converted.deferredByOutput.get(request.key) ?? []).map((entry) => ({
            ...entry,
            valuePath: [...prefix, ...entry.valuePath],
          }))
        )
      )
    }

    if (params.rule.externalMetadata !== undefined) {
      const uuid = readMetadataItemUuid(outputs.values().next().value, params.rule, root)
      if (uuid !== undefined) recordCurrentExternalMetadataUuid({ context: itemContext, uuid })
    }

    return { outputs, deferredByOutput, externalWrites: converted.externalWrites }
  }
  return { properties, finish }
}

function enterDeferredNestedRule(
  path: readonly DeferredRulePathSegment[],
  itemType: string
): readonly DeferredRulePathSegment[] {
  const last = path.at(-1)
  if (last === undefined) return path
  return [...path.slice(0, -1), { ...last, nestedItemType: itemType }]
}

function readMetadataItemUuid(
  xml: Record<string, unknown> | undefined,
  rule: MetadataItemRule,
  root: XMLRootInfo | undefined
): string | undefined {
  if (xml === undefined) return undefined
  const uuidRule = Object.values(rule.properties).find((property) => property.type === "uuid")
  if (uuidRule === undefined) return undefined
  let current: unknown = unwrapXMLBody(xml, root)
  for (const parent of uuidRule.xmlParents ?? []) current = isRecord(current) ? current[parent] : undefined
  if (!isRecord(current)) return undefined
  const value = current[uuidRule.xml ?? "Uuid"]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function findXMLRoot(rule: MetadataItemRule): XMLRootInfo | undefined {
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    if (propertyRule.type !== "XMLRoot") continue
    return {
      propertyKey,
      container: propertyRule.container as string,
      isFileRoot: propertyRule.isFileRoot === true,
      fallback: propertyRule.rootAttributes as XMLRootInfo["fallback"],
    }
  }
  return undefined
}

function unwrapXMLBody(
  xml: unknown,
  root: XMLRootInfo | undefined
): Record<string, unknown> | undefined {
  if (!isRecord(xml)) return undefined
  if (root === undefined) return xml
  if (root.isFileRoot) {
    const container = xml[root.container]
    return isRecord(container) ? container : undefined
  }
  const metadataObject = isRecord(xml.MetaDataObject) ? xml.MetaDataObject : xml
  if (!isRecord(metadataObject)) return undefined
  const container = metadataObject[root.container]
  return isRecord(container) ? container : undefined
}

function prepareXMLItemEnvelope(
  params: MetadataItemXMLPreparationParams,
  root: XMLRootInfo | undefined,
): XMLItemEnvelope {
  return {
    path: root === undefined ? [] : root.isFileRoot ? [root.container] : ["MetaDataObject", root.container],
    rootAttributes: root === undefined ? {} : getRootAttributes(params, root),
    bodyAttributes: params.rule.xsiType === undefined ? {} : { "_xsi:type": params.rule.xsiType },
  }
}

function wrapXMLRoot(envelope: XMLItemEnvelope, value: Record<string, unknown>): Record<string, unknown> {
  let result = value
  for (let index = envelope.path.length - 1; index >= 0; index--) {
    result = { [envelope.path[index]!]: index === 0 ? { ...envelope.rootAttributes, ...result } : result }
  }
  return result
}

function getRootAttributes(
  params: MetadataItemXMLPreparationParams,
  root: XMLRootInfo
): Record<string, string> {
  return typeof root.fallback === "function"
    ? root.fallback({ data: params.yaml, ownerMetadataItem: params.ownerYAML })
    : root.fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
