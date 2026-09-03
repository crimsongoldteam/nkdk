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
  PrepareXMLItemOutputFunction,
} from "../property/fromYAMLToXMLTypes"
import { copyXmlAnomalyAnnotationsDeep } from "../../../yaml/xmlAnomalyAnnotations"
import { copyYAMLRuntimeMetadata } from "../../../yaml/runtimeMetadata"
import { markYAMLValueTag, yamlScalarTagAt } from "../../../yaml/scalarTags"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import type { YAMLPropertySource } from "../property/fromYAMLToXMLTypes"
import { getChildContextToXML } from "../../context/childContext"
import type { DeferredRulePathSegment } from "../property/importYamlTypes"
import type { DeferredValuePath } from "../property/deferredObjectValues"
import { assertRequiredConfigurationIdentity } from "../property/requiredIdentity"
import {
  xmlAnnotatedMappingEntries,
  type XmlAnomalyAnnotations,
} from "../../../yaml/xmlAnomalyAnnotations"
import {
  copyXmlAnomalyExportClaim,
  readXmlAnomalyExportClaim,
  readXmlAnomalyRawItem,
  markXmlAnomalyRawItem,
  readXmlAnomalyRawItemXml,
  readXmlAnomalyRawCollectionItems,
  markXmlAnomalyExportClaim,
  XML_ANOMALY_RAW_ITEM_PLACEHOLDER,
} from "../xmlAnomaly/exportClaim"

type CollectionDescriptor = Extract<YAMLToXMLNestedRule, { kind: "collection" }>

export interface ConvertMetadataCollectionFromYAMLToXMLParams {
  readonly convertItem: typeof convertMetadataItemFromYAMLToXML
  readonly convertProperties: Parameters<typeof convertMetadataItemFromYAMLToXML>[0]["convertProperties"]
  readonly context: ConfigurationContextWithExportToXML
  readonly yaml: unknown
  readonly annotations?: XmlAnomalyAnnotations
  readonly descriptor: CollectionDescriptor
  readonly propertyRule?: PropertyRule
  readonly source?: YAMLPropertySource
  readonly outputs: readonly YAMLToXMLOutputRequest[]
  readonly prepareItemOutput?: PrepareXMLItemOutputFunction
  readonly materializeCanonicalItems?: true
  readonly externalWriteFactory?: YAMLToXMLExternalWriteFactory
  readonly profile?: YAMLToXMLProfile
  readonly rulePath?: readonly (string | number)[]
  readonly deferredRulePath?: readonly DeferredRulePathSegment[]
}

export function convertMetadataCollectionFromYAMLToXML(
  params: ConvertMetadataCollectionFromYAMLToXMLParams
): YAMLToXMLResult {
  const entries = completeCollectionEntries({
    entries: collectionEntries(params.yaml, params.annotations, params.descriptor, params.propertyRule),
    descriptor: params.descriptor,
    itemRule: params.descriptor.itemRule,
    propertyRule: params.propertyRule,
    source: params.source,
    outputs: params.outputs,
    materializeCanonicalItems: params.materializeCanonicalItems,
    context: params.context,
  })
  const outputItems = new Map(params.outputs.map(({ key }) => [key, [] as unknown[]]))
  const deferredByOutput = new Map(params.outputs.map(({ key }) => [key, [] as DeferredValuePath[]]))
  const externalWrites: YAMLToXMLExternalWrite[] = []
  const references = new Map(params.outputs.map((output) => [output.key, createReferenceLookup(output, params.descriptor)]))

  entries.forEach(({ yaml, name }, index) => {
    if (params.profile !== undefined) params.profile.nestedItemCount++
    const rawItemClaimId = readXmlAnomalyRawItem(yaml)
    if (rawItemClaimId !== undefined) {
      for (const output of params.outputs) {
        const marker = {}
        markXmlAnomalyExportClaim(marker, rawItemClaimId, true)
        markXmlAnomalyRawItem(marker, rawItemClaimId, readXmlAnomalyRawItemXml(yaml))
        outputItems.get(output.key)!.push(
          params.descriptor.xmlElement === undefined
            ? { [XML_ANOMALY_RAW_ITEM_PLACEHOLDER]: marker }
            : marker,
        )
      }
      return
    }
    const defaultItemRule =
      (params.propertyRule === undefined ? undefined : params.descriptor.itemRuleFromProperty?.(params.propertyRule)) ??
      params.descriptor.itemRule
    const itemRule =
      params.descriptor.resolveItemRule?.({ yaml, name, index, propertyRule: params.propertyRule }) ?? defaultItemRule
    const normalizedYAML =
      params.descriptor.normalizeItemYAML?.({
        yaml,
        annotations: params.annotations,
        name,
        index,
        propertyRule: params.propertyRule,
      }) ?? yaml
    if (
      yaml !== null && typeof yaml === "object"
      && normalizedYAML !== null && typeof normalizedYAML === "object"
    ) {
      copyYAMLRuntimeMetadata(yaml, normalizedYAML)
    }
    copyXmlAnomalyAnnotationsDeep(params.annotations, yaml, normalizedYAML)
    copyXmlAnomalyExportClaim(yaml, normalizedYAML)
    const defaultItemContext = configurationIndexCollectionItemContext({
      context: params.context,
      descriptor: params.descriptor,
      yaml: normalizedYAML,
      name,
      index,
    })
    const indexedItemContext =
      params.descriptor.resolveItemContext?.({
        context: params.context,
        yaml: normalizedYAML,
        name,
        index,
        itemRule,
        propertyRule: params.propertyRule,
      }) ?? defaultItemContext
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
    const currentItemPath = collectionItemCurrentPath({
      context: params.context,
      propertyRule: params.propertyRule,
      name,
    })
    const referenceRemap = itemContext.importFromYAML?.referenceRemap
    const itemContextWithReferenceRemap =
      currentItemPath === undefined || referenceRemap === undefined
        ? itemContext
        : {
            ...itemContext,
            importFromYAML: {
              ...itemContext.importFromYAML,
              referenceRemap: {
                ...referenceRemap,
                currentPath: currentItemPath,
              },
            },
          }
    assertRequiredConfigurationIdentity({
      context: itemContextWithReferenceRemap,
      kind: params.descriptor.requiredIdentity,
    })
    const itemOutputs = params.outputs.map((output) => {
      const referenceXML = references.get(output.key)!({
        context: params.context,
        itemRule,
        propertyRule: params.propertyRule,
        yaml: normalizedYAML,
        name,
        index,
      })
      return { key: output.key, referenceXML }
    })
    const converted = params.convertItem({
      convertProperties: params.convertProperties,
      prepareOutput: params.prepareItemOutput,
      propertyRule: params.propertyRule,
      context: itemContextWithReferenceRemap,
      yaml: normalizedYAML,
      annotations: params.annotations,
      rule: itemRule,
      name,
      namePropertyKey: params.descriptor.keyField,
      outputs: itemOutputs,
      sparseYAML: params.descriptor.sparseItems,
      omitDefaultsForSparseYAML:
        (params.descriptor.omitDefaultsForSparseItems === true &&
          itemOutputs.some(({ referenceXML }) => isAttributeOnlyRecord(referenceXML))) ||
        params.descriptor.omitDefaultsForSparseItem?.({
          yaml: normalizedYAML,
          name,
          referenceXML: itemOutputs.find(({ referenceXML }) => referenceXML !== undefined)?.referenceXML,
          propertyRule: params.propertyRule,
        }) === true
          ? true
          : undefined,
      externalWriteFactory: params.externalWriteFactory,
      profile: params.profile,
      rulePath: [...(params.rulePath ?? [params.descriptor.itemRule.itemType]), name ?? index],
      deferredRulePath: params.deferredRulePath,
    })
    for (const output of itemOutputs) {
      const xml = converted.outputs.get(output.key) ?? {}
      const exportClaimId = readXmlAnomalyExportClaim(normalizedYAML)
      if (exportClaimId !== undefined) markXmlAnomalyExportClaim(xml, exportClaimId, true)
      const mapped =
        params.descriptor.mapItemOutput === undefined
          ? xml
          : params.descriptor.mapItemOutput({
              xml,
              yaml: normalizedYAML,
              name,
              index,
              itemRule,
              propertyRule: params.propertyRule,
              context: itemContextWithReferenceRemap,
              collectionYAML: params.yaml,
              referenceXML: output.referenceXML,
            })
      if (mapped !== undefined) {
        const items = outputItems.get(output.key)!
        const itemIndex = items.length
        items.push(mapped)
        const prefix =
          params.descriptor.xmlElement === undefined ? [itemIndex] : [params.descriptor.xmlElement, itemIndex]
        for (const deferred of converted.deferredByOutput.get(output.key) ?? []) {
          deferredByOutput.get(output.key)!.push({
            ...deferred,
            valuePath: [...prefix, ...deferred.valuePath],
          })
        }
      }
    }
    externalWrites.push(...converted.externalWrites)
  })

  return {
    outputs: new Map(
      params.outputs.flatMap(({ key }) => {
        const items = outputItems.get(key)!
        if (items.length === 0 && params.descriptor.omitEmptyOutput === true) return []
        const value = params.descriptor.xmlElement === undefined ? items : { [params.descriptor.xmlElement]: items }
        return [[key, value as Record<string, unknown>]]
      })
    ),
    deferredByOutput,
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
  materializeCanonicalItems: true | undefined
  context: ConfigurationContextWithExportToXML
}): { yaml: unknown; name?: string }[] {
  if (params.descriptor.yamlShape !== "record") return params.entries
  const referenceNames = collectReferenceNames(params)
  const shapeNames = referenceNames
  const shouldComplete =
    params.entries.length > 0 ||
    params.materializeCanonicalItems === true ||
    params.descriptor.completeItemNames !== undefined
  const ruleNames =
    shouldComplete && params.propertyRule !== undefined && params.source !== undefined
      ? (params.descriptor.completeItemNames?.({ source: params.source, propertyRule: params.propertyRule }) ?? [])
      : []
  if (params.materializeCanonicalItems === true && ruleNames.length === 0) {
    const propertyLabel = params.propertyRule?.yaml ?? params.propertyRule?.type ?? "коллекция"
    throw new Error(`Для свойства ${propertyLabel} не определены канонические стандартные реквизиты`)
  }
  const sourceNames = new Set([
    ...params.entries.flatMap((entry) => entry.name === undefined ? [] : [entry.name]),
    ...(params.descriptor.preserveReferenceItems === true ? shapeNames : []),
  ])
  const completedNames =
    shapeNames.length === 0
      ? ruleNames
      : ruleNames.filter((name) => sourceNames.has(name))
  const completedNameSet = new Set(completedNames)
  const requestedNames = params.descriptor.preserveReferenceItems !== true
    ? completedNames
    : [...completedNames, ...referenceNames.filter((name) => !completedNameSet.has(name))]
  if (requestedNames.length === 0) return params.entries

  const seenNames = new Set<string>()
  const containsDuplicates = params.entries.some(({ name }) => {
    if (name === undefined) return false
    if (seenNames.has(name)) return true
    seenNames.add(name)
    return false
  })
  if (containsDuplicates) {
    return [
      ...params.entries,
      ...requestedNames
        .filter((name) => !seenNames.has(name))
        .map((name) => ({ name, yaml: {} })),
    ]
  }

  const byName = new Map(params.entries.map((entry) => [entry.name, entry]))
  const result = requestedNames.map((name) => byName.get(name) ?? { name, yaml: {} })
  const requestedNameSet = new Set(requestedNames)
  for (const entry of params.entries) {
    if (entry.name === undefined || !requestedNameSet.has(entry.name)) result.push(entry)
  }
  return result
}

function collectReferenceNames(params: {
  descriptor: CollectionDescriptor
  outputs: readonly YAMLToXMLOutputRequest[]
}): string[] {
  const result = new Set<string>()
  const keyField = params.descriptor.keyField ?? "name"
  const keyRule = params.descriptor.itemRule.properties[keyField]
  if (keyRule === undefined) return []
  for (const output of params.outputs) {
    const collection = collectionReferenceValue(output.referenceXML, params.descriptor.xmlElement)
    const items = Array.isArray(collection) ? collection : collection === undefined ? [] : [collection]
    for (const item of items) {
      if (!isRecord(item)) continue
      const name = readXMLProperty(item, keyRule, keyField)
      if (typeof name === "string") result.add(name)
    }
  }
  return [...result]
}

function collectionEntries(
  yaml: unknown,
  annotations: XmlAnomalyAnnotations | undefined,
  descriptor: CollectionDescriptor,
  propertyRule: PropertyRule | undefined
): { yaml: unknown; name?: string }[] {
  const rawItems = readXmlAnomalyRawCollectionItems(yaml)
  if (descriptor.yamlShape === "array") {
    const entries = Array.isArray(yaml) ? yaml.map((item, index) => ({
      yaml: transferCollectionValueTag(yaml, index, item),
    })) : []
    for (const item of rawItems) entries.splice(item.index, 0, { yaml: item.yaml })
    return entries
  }
  if (!isRecord(yaml)) return []
  const entries = annotations === undefined
    ? Object.entries(yaml)
    : xmlAnnotatedMappingEntries(yaml, annotations)
  const result: { yaml: unknown; name?: string }[] = entries.map(([key, value]) => ({
    yaml: transferCollectionValueTag(yaml, key, value),
    name:
      (propertyRule === undefined
        ? undefined
        : descriptor.nameFromYAMLKeyForProperty?.({ yamlKey: key, propertyRule })) ??
      descriptor.nameFromYAMLKey?.(key) ??
      key,
  }))
  for (const item of rawItems) {
    result.splice(item.index, 0, {
      yaml: item.yaml,
      ...(item.name === undefined ? {} : { name: item.name }),
    })
  }
  return result
}

function transferCollectionValueTag(parent: object, key: string | number, value: unknown): unknown {
  const tag = yamlScalarTagAt(parent, key)
  if (tag !== "проверять" && tag !== "изменять") return value
  if (value === null || typeof value !== "object") return value
  markYAMLValueTag(value, tag)
  return value
}

interface ReferenceLookupParams {
  context: ConfigurationContextWithExportToXML
  itemRule: MetadataItemRule
  propertyRule: PropertyRule | undefined
  yaml: unknown
  name?: string
  index: number
}

function createReferenceLookup(output: YAMLToXMLOutputRequest, descriptor: CollectionDescriptor) {
  const collection = collectionReferenceValue(output.referenceXML, descriptor.xmlElement)
  const rawItems = Array.isArray(collection) ? collection.filter(isRecord) : isRecord(collection) ? [collection] : []
  const byRule = new Map<MetadataItemRule, ReturnType<typeof prepareReferenceLookup>>()
  return (params: ReferenceLookupParams): Record<string, unknown> | undefined => {
    let lookup = byRule.get(params.itemRule)
    if (lookup === undefined) {
      lookup = prepareReferenceLookup(rawItems, descriptor, params.itemRule)
      byRule.set(params.itemRule, lookup)
    }
    return lookup(params)
  }
}

function prepareReferenceLookup(rawItems: Record<string, unknown>[], descriptor: CollectionDescriptor, itemRule: MetadataItemRule) {
  const items = rawItems.flatMap((item) => {
    const unwrapped = descriptor.unwrapReferenceItem?.({ xml: item, itemRule })
    return unwrapped === undefined && descriptor.unwrapReferenceItem !== undefined ? [] : [unwrapped ?? item]
  })
  const properties = new Map<string, Map<unknown, Record<string, unknown>>>()
  const findProperty = (key: string, value: unknown) => {
    const rule = itemRule.properties[key]
    if (rule === undefined || Number.isNaN(value)) return undefined
    let index = properties.get(key)
    if (index === undefined) {
      index = new Map()
      for (const item of items) {
        const keyValue = readXMLProperty(item, rule, key)
        if (!index.has(keyValue)) index.set(keyValue, item)
      }
      properties.set(key, index)
    }
    return index.get(value)
  }
  let identities: Map<string, Record<string, unknown> | undefined> | undefined
  return (params: ReferenceLookupParams): Record<string, unknown> | undefined => {
    if (descriptor.referenceIdentity !== undefined) {
      const identity = descriptor.referenceIdentity.fromYAML({ yaml: params.yaml, name: params.name, itemRule })
      if (identity !== undefined) {
        if (identities === undefined) {
          identities = new Map()
          for (const item of items) {
            const key = descriptor.referenceIdentity.fromXML({ xml: item, itemRule })
            if (key !== undefined) identities.set(key, identities.has(key) ? undefined : item)
          }
        }
        return identities.get(identity)
      }
    }
    const keyField = descriptor.keyField
    if (keyField !== undefined && isRecord(params.yaml)) {
      const keyRule = itemRule.properties[keyField]
      const yamlKey = keyRule?.yaml
      const yamlValue = yamlKey === undefined ? undefined : params.yaml[yamlKey]
      if (keyRule !== undefined) {
        const found = findProperty(keyField, yamlValue)
        if (found !== undefined) return found
      }
    }
    if (params.name !== undefined && itemRule.properties.name !== undefined) {
      const referenceName =
        referenceItemName({
          context: params.context,
          propertyRule: params.propertyRule,
          currentName: params.name,
        }) ?? params.name
      return findProperty("name", referenceName)
    }
    return items[params.index]
  }
}

function collectionItemCurrentPath(params: {
  context: ConfigurationContextWithExportToXML
  propertyRule: PropertyRule | undefined
  name: string | undefined
}): string | undefined {
  const referenceRemap = params.context.importFromYAML?.referenceRemap
  const segment = params.propertyRule?.operationTarget?.migrationSegment
  if (referenceRemap === undefined || segment === undefined || params.name === undefined) return undefined
  return `${referenceRemap.currentPath}.${segment}.${params.name}`
}

function referenceItemName(params: {
  context: ConfigurationContextWithExportToXML
  propertyRule: PropertyRule | undefined
  currentName: string
}): string | undefined {
  const currentPath = collectionItemCurrentPath({
    context: params.context,
    propertyRule: params.propertyRule,
    name: params.currentName,
  })
  if (currentPath === undefined) return undefined
  return params.context.importFromYAML?.referenceRemap?.referencePathByCurrentPath.get(currentPath)?.split(".").at(-1)
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

export function configurationIndexCollectionItemContext(params: {
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

function isAttributeOnlyRecord(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).every((key) => key.startsWith("_"))
}
