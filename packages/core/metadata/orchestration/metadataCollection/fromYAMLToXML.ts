import { childUid, indexedUid, yamlIndexUid, yamlKeyUid } from "../../configurationIndex/logicalAddress"
import { withConfigurationIndexExportLogicalAddress } from "../../configurationIndex/referenceView"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { convertMetadataItemFromYAMLToXML } from "../metadataItem/fromYAMLToXML"
import type {
  YAMLToXMLNestedRule,
  YAMLToXMLExternalWriteFactory,
  YAMLToXMLExternalWrite,
  YAMLToXMLOutputRequest,
  YAMLToXMLResult,
  YAMLToXMLProfile,
} from "../property/fromYAMLToXMLTypes"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import type { YAMLPropertySource } from "../property/fromYAMLToXMLTypes"
import { getChildContextToXML } from "../../context/helpers"

type CollectionDescriptor = Extract<YAMLToXMLNestedRule, { kind: "collection" }>

export interface ConvertMetadataCollectionFromYAMLToXMLParams {
  readonly context: ConfigurationContextWithExportToXML
  readonly yaml: unknown
  readonly descriptor: CollectionDescriptor
  readonly propertyRule?: PropertyRule
  readonly source?: YAMLPropertySource
  readonly outputs: readonly YAMLToXMLOutputRequest[]
  readonly externalWriteFactory?: YAMLToXMLExternalWriteFactory
  readonly profile?: YAMLToXMLProfile
  readonly rulePath?: readonly (string | number)[]
}

export function convertMetadataCollectionFromYAMLToXML(
  params: ConvertMetadataCollectionFromYAMLToXMLParams
): YAMLToXMLResult {
  const entries = completeCollectionEntries({
    entries: collectionEntries(params.yaml, params.descriptor, params.propertyRule),
    descriptor: params.descriptor,
    itemRule: params.descriptor.itemRule,
    propertyRule: params.propertyRule,
    source: params.source,
    outputs: params.outputs,
  })
  const outputItems = new Map(params.outputs.map(({ key }) => [key, [] as unknown[]]))
  const externalWrites: YAMLToXMLExternalWrite[] = []

  entries.forEach(({ yaml, name }, index) => {
    if (params.profile !== undefined) params.profile.nestedItemCount++
    const defaultItemRule =
      (params.propertyRule === undefined ? undefined : params.descriptor.itemRuleFromProperty?.(params.propertyRule)) ??
      params.descriptor.itemRule
    const itemRule =
      params.descriptor.resolveItemRule?.({ yaml, name, index, propertyRule: params.propertyRule }) ?? defaultItemRule
    const normalizedYAML =
      params.descriptor.normalizeItemYAML?.({ yaml, name, index, propertyRule: params.propertyRule }) ?? yaml
    const indexedItemContext = configurationIndexItemContext({
      context: params.context,
      descriptor: params.descriptor,
      yaml: normalizedYAML,
      name,
      index,
    })
    const itemContext =
      name === undefined || itemRule.externalMetadata === undefined
        ? indexedItemContext
        : getChildContextToXML({
            context: indexedItemContext,
            itemType: itemRule.itemType,
            path: `${itemRule.itemType}.${name}`,
            name,
            externalMetadata: itemRule.externalMetadata,
          })
    const itemOutputs = params.outputs.map((output) => ({
      key: output.key,
      referenceXML: findReferenceItem({
        output,
        descriptor: params.descriptor,
        itemRule,
        yaml: normalizedYAML,
        name,
        index,
      }),
    }))
    const converted = convertMetadataItemFromYAMLToXML({
      context: itemContext,
      yaml: normalizedYAML,
      rule: itemRule,
      name,
      namePropertyKey: params.descriptor.keyField,
      outputs: itemOutputs,
      sparseYAML: params.descriptor.sparseItems,
      externalWriteFactory: params.externalWriteFactory,
      profile: params.profile,
      rulePath: [...(params.rulePath ?? [params.descriptor.itemRule.itemType]), name ?? index],
    })
    for (const output of itemOutputs) {
      const xml = converted.outputs.get(output.key) ?? {}
      outputItems.get(output.key)!.push(
        params.descriptor.mapItemOutput?.({
          xml,
          yaml: normalizedYAML,
          name,
          index,
          itemRule,
          propertyRule: params.propertyRule,
          context: itemContext,
        }) ?? xml
      )
    }
    externalWrites.push(...converted.externalWrites)
  })

  return {
    outputs: new Map(
      params.outputs.map(({ key }) => {
        const items = outputItems.get(key)!
        const value = params.descriptor.xmlElement === undefined ? items : { [params.descriptor.xmlElement]: items }
        return [key, value as Record<string, unknown>]
      })
    ),
    externalWrites,
  }
}

function completeCollectionEntries(params: {
  entries: { yaml: unknown; name?: string }[]
  descriptor: CollectionDescriptor
  itemRule: MetadataItemRule
  propertyRule: PropertyRule | undefined
  source: YAMLPropertySource | undefined
  outputs: readonly YAMLToXMLOutputRequest[]
}): { yaml: unknown; name?: string }[] {
  if (params.descriptor.yamlShape !== "record") return params.entries
  const referenceNames = collectReferenceNames(params)
  if (params.descriptor.preserveReferenceItems !== true && referenceNames.length > 0) {
    const referenceOrder = new Map(referenceNames.map((name, index) => [name, index]))
    return params.entries.toSorted(
      (left, right) =>
        (referenceOrder.get(left.name ?? "") ?? Number.MAX_SAFE_INTEGER) -
        (referenceOrder.get(right.name ?? "") ?? Number.MAX_SAFE_INTEGER)
    )
  }
  const requestedNames =
    referenceNames.length > 0
      ? referenceNames
      : params.entries.length > 0 && params.propertyRule !== undefined && params.source !== undefined
        ? (params.descriptor.completeItemNames?.({ source: params.source, propertyRule: params.propertyRule }) ?? [])
        : []
  if (requestedNames.length === 0) return params.entries

  const byName = new Map(params.entries.map((entry) => [entry.name, entry]))
  const result = requestedNames.map((name) => byName.get(name) ?? { name, yaml: {} })
  for (const entry of params.entries) {
    if (entry.name === undefined || !requestedNames.includes(entry.name)) result.push(entry)
  }
  return result
}

function collectReferenceNames(params: {
  descriptor: CollectionDescriptor
  outputs: readonly YAMLToXMLOutputRequest[]
}): string[] {
  const result: string[] = []
  const keyField = params.descriptor.keyField ?? "name"
  const keyRule = params.descriptor.itemRule.properties[keyField]
  if (keyRule === undefined) return result
  for (const output of params.outputs) {
    const collection = collectionReferenceValue(output.referenceXML, params.descriptor.xmlElement)
    const items = Array.isArray(collection) ? collection : collection === undefined ? [] : [collection]
    for (const item of items) {
      if (!isRecord(item)) continue
      const name = readXMLProperty(item, keyRule, keyField)
      if (typeof name === "string" && !result.includes(name)) result.push(name)
    }
  }
  return result
}

function collectionEntries(
  yaml: unknown,
  descriptor: CollectionDescriptor,
  propertyRule: PropertyRule | undefined
): { yaml: unknown; name?: string }[] {
  if (descriptor.yamlShape === "array") {
    return Array.isArray(yaml) ? yaml.map((item) => ({ yaml: item })) : []
  }
  if (!isRecord(yaml)) return []
  return Object.entries(yaml).map(([key, value]) => ({
    yaml: value,
    name:
      (propertyRule === undefined
        ? undefined
        : descriptor.nameFromYAMLKeyForProperty?.({ yamlKey: key, propertyRule })) ??
      descriptor.nameFromYAMLKey?.(key) ??
      key,
  }))
}

function findReferenceItem(params: {
  output: YAMLToXMLOutputRequest
  descriptor: CollectionDescriptor
  itemRule: MetadataItemRule
  yaml: unknown
  name?: string
  index: number
}): Record<string, unknown> | undefined {
  const collection = collectionReferenceValue(params.output.referenceXML, params.descriptor.xmlElement)
  const rawItems = Array.isArray(collection) ? collection.filter(isRecord) : isRecord(collection) ? [collection] : []
  const items = rawItems.flatMap((item) => {
    const unwrapped = params.descriptor.unwrapReferenceItem?.({ xml: item, itemRule: params.itemRule })
    return unwrapped === undefined && params.descriptor.unwrapReferenceItem !== undefined ? [] : [unwrapped ?? item]
  })
  if (params.descriptor.referenceIdentity !== undefined) {
    const identity = params.descriptor.referenceIdentity.fromYAML({
      yaml: params.yaml,
      name: params.name,
      itemRule: params.itemRule,
    })
    if (identity !== undefined) {
      const matches = items.filter(
        (item) =>
          params.descriptor.referenceIdentity!.fromXML({
            xml: item,
            itemRule: params.itemRule,
          }) === identity
      )
      return matches.length === 1 ? matches[0] : undefined
    }
  }
  const keyField = params.descriptor.keyField
  if (keyField !== undefined && isRecord(params.yaml)) {
    const keyRule = params.itemRule.properties[keyField]
    const yamlKey = keyRule?.yaml
    const yamlValue = yamlKey === undefined ? undefined : params.yaml[yamlKey]
    if (keyRule !== undefined) {
      const found = items.find((item) => readXMLProperty(item, keyRule, keyField) === yamlValue)
      if (found !== undefined) return found
    }
  }
  if (params.name !== undefined) {
    const nameRule = params.itemRule.properties.name
    if (nameRule !== undefined) {
      const found = items.find((item) => readXMLProperty(item, nameRule, "name") === params.name)
      if (found !== undefined) return found
      return undefined
    }
  }
  return items[params.index]
}

function collectionReferenceValue(referenceXML: unknown, xmlElement: string | undefined): unknown {
  if (xmlElement !== undefined && Array.isArray(referenceXML)) {
    return referenceXML.flatMap((value) => {
      if (
        !isRecord(value) ||
        Object.prototype.hasOwnProperty.call(value, "_xsi:type") ||
        !Object.prototype.hasOwnProperty.call(value, xmlElement)
      )
        return value
      const nested = value[xmlElement]
      return Array.isArray(nested) ? nested : [nested]
    })
  }
  if (
    xmlElement !== undefined &&
    isRecord(referenceXML) &&
    Object.prototype.hasOwnProperty.call(referenceXML, xmlElement)
  ) {
    return referenceXML[xmlElement]
  }
  return referenceXML
}

function readXMLProperty(
  item: Record<string, unknown>,
  rule: { xml?: string; xmlParents?: string[]; xmlAliases?: string[] },
  propertyKey: string
): unknown {
  let current: unknown = item
  for (const parent of rule.xmlParents ?? []) {
    if (!isRecord(current)) return undefined
    current = current[parent]
  }
  if (!isRecord(current)) return undefined
  const canonical = rule.xml ?? `${propertyKey.charAt(0).toUpperCase()}${propertyKey.slice(1)}`
  for (const key of [canonical, ...(rule.xmlAliases ?? [])]) {
    if (Object.prototype.hasOwnProperty.call(current, key)) return current[key]
  }
  return undefined
}

function configurationIndexItemContext(params: {
  context: ConfigurationContextWithExportToXML
  descriptor: CollectionDescriptor
  yaml: unknown
  name?: string
  index: number
}): ConfigurationContextWithExportToXML {
  const runtime = params.context.exportToXML.configurationIndex
  if (runtime === undefined) return params.context
  const keyName = collectionKeyName(params.descriptor, params.yaml, params.name)
  const useYamlPath =
    runtime.yamlPathAddressing === true || params.descriptor.configurationIndexAddressing === "yamlPath"
  if (useYamlPath) {
    return withConfigurationIndexExportLogicalAddress(
      params.context,
      params.descriptor.yamlShape === "array" || keyName === undefined
        ? yamlIndexUid(runtime.logicalAddress, params.index)
        : yamlKeyUid(runtime.logicalAddress, keyName)
    )
  }
  const segment =
    params.descriptor.configurationIndexUidSegment ??
    runtime.childCollectionUidSegment ??
    params.descriptor.itemRule.itemType
  return withConfigurationIndexExportLogicalAddress(
    params.context,
    keyName === undefined
      ? indexedUid(runtime.logicalAddress, segment, params.index)
      : childUid(runtime.logicalAddress, segment, keyName)
  )
}

function collectionKeyName(
  descriptor: CollectionDescriptor,
  yaml: unknown,
  name: string | undefined
): string | undefined {
  if (name !== undefined) return name
  if (descriptor.keyField === undefined || !isRecord(yaml)) return undefined
  const keyRule = descriptor.itemRule.properties[descriptor.keyField]
  const value = keyRule?.yaml === undefined ? undefined : yaml[keyRule.yaml]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
