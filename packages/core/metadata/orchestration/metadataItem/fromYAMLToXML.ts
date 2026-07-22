import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { convertPropertiesFromYAMLToXML } from "../property/fromYAMLToXML"
import type { YAMLToXMLOutputRequest, YAMLToXMLResult } from "../property/fromYAMLToXMLTypes"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { findInlineProperty } from "./yamlInline"

export interface ConvertMetadataItemFromYAMLToXMLParams {
  readonly context: ConfigurationContextWithExportToXML
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly name?: string
  readonly outputs: readonly YAMLToXMLOutputRequest[]
  readonly ownerYAML?: unknown
  readonly sparseYAML?: true
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
  const yaml = inline === undefined ? params.yaml : { [inline.yamlKey]: params.yaml }
  const root = findXMLRoot(params.rule)
  const normalizedOutputs = params.outputs.map((output) => ({
    ...output,
    referenceXML: unwrapReferenceBody(output.referenceXML, root),
  }))
  const converted = convertPropertiesFromYAMLToXML({
    context: params.context,
    yaml,
    rule: params.rule,
    name: params.name,
    outputs: normalizedOutputs,
    sparseYAML: params.sparseYAML,
  })
  const outputs = new Map<string, Record<string, unknown>>()

  for (const request of params.outputs) {
    const generated = converted.outputs.get(request.key) ?? {}
    const generatedWithType =
      params.rule.xsiType === undefined ? generated : { "_xsi:type": params.rule.xsiType, ...generated }
    const referenceBody = unwrapReferenceBody(request.referenceXML, root)
    const merged = mergeReferenceXML({
      generated: generatedWithType,
      reference: referenceBody,
      rule: params.rule,
      path: [],
    })
    outputs.set(request.key, wrapXMLRoot({ params, request, root, value: merged }))
  }

  return { outputs, externalWrites: converted.externalWrites }
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
  referenceXML: Record<string, unknown> | undefined,
  root: XMLRootInfo | undefined
): Record<string, unknown> | undefined {
  if (referenceXML === undefined || root === undefined) return referenceXML
  if (root.isFileRoot) {
    const container = referenceXML[root.container]
    return isRecord(container) ? omitRootAttributes(container) : undefined
  }
  const metadataObject = referenceXML.MetaDataObject
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
  referenceXML: Record<string, unknown> | undefined,
  root: XMLRootInfo
): Record<string, string> {
  const referenceRoot = root.isFileRoot
    ? referenceXML?.[root.container]
    : isRecord(referenceXML?.MetaDataObject)
      ? referenceXML.MetaDataObject
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
      } else if (generatedValue !== undefined) {
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
