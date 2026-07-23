import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { convertPropertiesFromYAMLToXML } from "../property/fromYAMLToXML"
import type {
  YAMLToXMLExternalWriteFactory,
  YAMLToXMLOutputRequest,
  YAMLToXMLResult,
  YAMLToXMLProfile,
} from "../property/fromYAMLToXMLTypes"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { findInlineProperty } from "./yamlInline"
import { recordCurrentExternalMetadataUuid } from "../externalMetadata/record"

export interface ConvertMetadataItemFromYAMLToXMLParams {
  readonly context: ConfigurationContextWithExportToXML
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly name?: string
  readonly namePropertyKey?: string
  readonly sourceItemName?: string
  readonly outputs: readonly YAMLToXMLOutputRequest[]
  readonly propertyValues?: ReadonlyMap<string, unknown>
  readonly ownerYAML?: unknown
  readonly sparseYAML?: true
  readonly externalWriteFactory?: YAMLToXMLExternalWriteFactory
  readonly profile?: YAMLToXMLProfile
  readonly rulePath?: readonly (string | number)[]
}

interface XMLRootInfo {
  readonly propertyKey: string
  readonly container: string
  readonly isFileRoot: boolean
  readonly fallback:
    | Record<string, string>
    | ((params: { data: unknown; referenceData: unknown; ownerMetadataItem: unknown }) => Record<string, string>)
}

export function convertMetadataItemFromYAMLToXML(params: ConvertMetadataItemFromYAMLToXMLParams): YAMLToXMLResult {
  const inline = findInlineProperty(params.rule)
  if (inline === undefined && params.yaml !== undefined && !isRecord(params.yaml)) {
    throw new Error(`${params.rule.itemType}: ожидался YAML-объект`)
  }
  const yaml = inline === undefined ? params.yaml : { [inline.yamlKey]: params.yaml }
  const root = findXMLRoot(params.rule)
  const normalizedOutputs = params.outputs.map((output) => ({
    ...output,
    referenceXML: sanitizeReferenceXML(unwrapReferenceBody(output.referenceXML, root)),
  }))
  const itemName = params.name ?? params.sourceItemName
  const itemContext: ConfigurationContextWithExportToXML =
    itemName === undefined
      ? params.context
      : {
          ...params.context,
          importFromYAML: {
            ...(params.context.importFromYAML ?? {}),
            parent: { name: itemName },
          },
        }
  const converted = convertPropertiesFromYAMLToXML({
    context: itemContext,
    yaml,
    rule: params.rule,
    name: params.name,
    namePropertyKey: params.namePropertyKey,
    sourceItemName: params.sourceItemName,
    outputs: normalizedOutputs,
    propertyValues: params.propertyValues,
    sparseYAML: params.sparseYAML,
    externalWriteFactory: params.externalWriteFactory,
    profile: params.profile,
    rulePath: params.rulePath,
  })
  const outputs = new Map<string, Record<string, unknown>>()

  for (const request of params.outputs) {
    const generated = converted.outputs.get(request.key) ?? {}
    const generatedWithType =
      params.rule.xsiType === undefined ? generated : { "_xsi:type": params.rule.xsiType, ...generated }
    const referenceBody = sanitizeReferenceXML(unwrapReferenceBody(request.referenceXML, root))
    const merged = mergeReferenceXML({
      generated: generatedWithType,
      reference: referenceBody,
      rule: params.rule,
      path: [],
    })
    outputs.set(request.key, wrapXMLRoot({ params, request, root, value: merged }))
  }

  if (params.rule.externalMetadata !== undefined) {
    const uuid = readMetadataItemUuid(outputs.values().next().value, params.rule, root)
    if (uuid !== undefined) recordCurrentExternalMetadataUuid({ context: itemContext, uuid })
  }

  return { outputs, externalWrites: converted.externalWrites }
}

function readMetadataItemUuid(
  xml: Record<string, unknown> | undefined,
  rule: MetadataItemRule,
  root: XMLRootInfo | undefined
): string | undefined {
  if (xml === undefined) return undefined
  const uuidRule = Object.values(rule.properties).find((property) => property.type === "uuid")
  if (uuidRule === undefined) return undefined
  let current: unknown = unwrapReferenceBody(xml, root)
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

function unwrapReferenceBody(
  referenceXML: unknown,
  root: XMLRootInfo | undefined
): Record<string, unknown> | undefined {
  if (!isRecord(referenceXML)) return undefined
  if (root === undefined) return referenceXML
  if (root.isFileRoot) {
    const container = referenceXML[root.container]
    return isRecord(container) ? omitRootAttributes(container) : undefined
  }
  const metadataObject = isRecord(referenceXML.MetaDataObject) ? referenceXML.MetaDataObject : referenceXML
  if (!isRecord(metadataObject)) return undefined
  const container = metadataObject[root.container]
  return isRecord(container) ? container : undefined
}

function wrapXMLRoot(params: {
  params: ConvertMetadataItemFromYAMLToXMLParams
  request: YAMLToXMLOutputRequest
  root: XMLRootInfo | undefined
  value: Record<string, unknown>
}): Record<string, unknown> {
  const { root } = params
  if (root === undefined) return params.value
  const rootAttributes = getRootAttributes(params.params, params.request.referenceXML, root)
  if (root.isFileRoot) return { [root.container]: { ...rootAttributes, ...params.value } }
  return { MetaDataObject: { ...rootAttributes, [root.container]: params.value } }
}

function getRootAttributes(
  params: ConvertMetadataItemFromYAMLToXMLParams,
  referenceXML: unknown,
  root: XMLRootInfo
): Record<string, string> {
  const reference = isRecord(referenceXML) ? referenceXML : undefined
  const referenceRoot = root.isFileRoot
    ? reference?.[root.container]
    : isRecord(reference?.MetaDataObject)
      ? reference.MetaDataObject
      : undefined
  if (isRecord(referenceRoot)) {
    const attributes = Object.fromEntries(
      Object.entries(referenceRoot).filter(([key, value]) => key.startsWith("_") && typeof value === "string")
    )
    if (Object.keys(attributes).length > 0) return attributes as Record<string, string>
  }
  return typeof root.fallback === "function"
    ? root.fallback({ data: params.yaml, referenceData: referenceXML, ownerMetadataItem: params.ownerYAML })
    : root.fallback
}

function omitRootAttributes(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith("_")))
}

function mergeReferenceXML(params: {
  generated: Record<string, unknown>
  reference: Record<string, unknown> | undefined
  rule: MetadataItemRule
  path: readonly string[]
}): Record<string, unknown> {
  const { generated, reference, rule, path } = params
  if (reference === undefined) return generated
  const result: Record<string, unknown> = {}
  for (const [key, referenceValue] of Object.entries(reference)) {
    if (Object.prototype.hasOwnProperty.call(generated, key)) {
      const generatedValue = generated[key]
      if (isRecord(generatedValue) && isRecord(referenceValue)) {
        result[key] = mergeReferenceXML({
          generated: generatedValue,
          reference: referenceValue,
          rule,
          path: [...path, key],
        })
      } else if (generatedValue !== undefined || referenceValue === undefined) {
        result[key] = generatedValue
      }
      continue
    }
    const propertyRule = findPropertyRule(rule, path, key)
    if (propertyRule !== undefined) {
      if (propertyRule.preserveFromReferenceXML === true) result[key] = referenceValue
      continue
    }
    result[key] = referenceValue
  }
  for (const [key, generatedValue] of Object.entries(generated)) {
    if (generatedValue === undefined || Object.prototype.hasOwnProperty.call(result, key)) continue
    const propertyRule = findPropertyRule(rule, path, key)
    if (propertyRule === undefined && isRecord(generatedValue)) {
      const nested = mergeReferenceXML({
        generated: generatedValue,
        reference: {},
        rule,
        path: [...path, key],
      })
      if (Object.keys(nested).length === 0) continue
      result[key] = nested
      continue
    }
    if (
      propertyRule !== undefined &&
      propertyRule.defaultValueXML === generatedValue &&
      reference?.[key] === undefined
    ) {
      continue
    }
    result[key] = generatedValue
  }
  return result
}

function sanitizeReferenceXML(value: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (value === undefined) return undefined
  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (key === "#text" && typeof entry === "string" && entry.trim() === "") continue
    result[key] = sanitizeReferenceValue(entry)
  }
  return result
}

function sanitizeReferenceValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeReferenceValue)
  if (!isRecord(value)) return value
  return sanitizeReferenceXML(value)
}

function findPropertyRule(rule: MetadataItemRule, path: readonly string[], xmlKey: string): PropertyRule | undefined {
  return Object.entries(rule.properties).find(([key, propertyRule]) => {
    const parents = propertyRule.xmlParents ?? []
    if (parents.length !== path.length || parents.some((parent, index) => parent !== path[index])) return false
    const canonical = propertyRule.xml ?? `${key.charAt(0).toUpperCase()}${key.slice(1)}`
    return canonical === xmlKey || (propertyRule.xmlAliases ?? []).includes(xmlKey)
  })?.[1]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
