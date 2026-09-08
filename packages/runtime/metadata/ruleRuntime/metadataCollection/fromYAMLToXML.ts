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
import { yamlMappingEntries } from "../../../yaml/mappingTags"
import { markYAMLValueTag, yamlScalarTagAt } from "../../../yaml/scalarTags"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import type { YAMLPropertySource } from "../property/fromYAMLToXMLTypes"
import { getChildContextToXML } from "../../context/childContext"
import type { DeferredRulePathSegment } from "../property/importYamlTypes"
import type { DeferredValuePath } from "../property/deferredObjectValues"
import { assertRequiredConfigurationIdentity } from "../property/requiredIdentity"
import type { XmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"
import { decodeXmlRawValue, type XmlRawValue } from "../../../xml/structure/rawCodec"
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

interface CollectionEntry {
  readonly yaml: unknown
  readonly name?: string
  readonly rawXml?: XmlRawValue
}

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
    propertyRule: params.propertyRule,
    source: params.source,
    materializeCanonicalItems: params.materializeCanonicalItems,
  })
  const outputItems = new Map(params.outputs.map(({ key }) => [key, [] as unknown[]]))
  const deferredByOutput = new Map(params.outputs.map(({ key }) => [key, [] as DeferredValuePath[]]))
  const externalWrites: YAMLToXMLExternalWrite[] = []
  let defaultItemRule: MetadataItemRule | undefined

  entries.forEach(({ yaml, name, rawXml }, index) => {
    if (params.profile !== undefined) params.profile.nestedItemCount++
    if (rawXml !== undefined) {
      const elementName = params.descriptor.xmlElement ?? name ?? params.descriptor.itemRule.itemType
      const nodes = decodeXmlRawValue(rawXml, { elementName }).nodes
      for (const output of params.outputs) {
        const items = outputItems.get(output.key)!
        for (const node of nodes) {
          items.push(params.descriptor.xmlElement === undefined
            ? { [node.name]: node }
            : node)
        }
      }
      return
    }
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
    defaultItemRule ??=
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
    let preparedContext: ConfigurationContextWithExportToXML | undefined
    const prepareContext = () => preparedContext ??= prepareMetadataCollectionItemXMLContext({
      context: params.context, descriptor: params.descriptor, yaml: normalizedYAML,
      name, index, itemRule, propertyRule: params.propertyRule,
    })
    const itemOutputs = params.outputs.map(({ key }) => ({ key }))
    const converted = params.convertItem({
      convertProperties: params.convertProperties,
      prepareOutput: params.prepareItemOutput,
      propertyRule: params.propertyRule,
      context: params.context,
      prepareContext,
      yaml: normalizedYAML,
      annotations: params.annotations,
      rule: itemRule,
      name,
      namePropertyKey: params.descriptor.keyField,
      outputs: itemOutputs,
      sparseYAML: params.descriptor.sparseItems,
      externalWriteFactory: params.externalWriteFactory,
      profile: params.profile,
      rulePath: [...(params.rulePath ?? [params.descriptor.itemRule.itemType]), name ?? index],
      deferredRulePath: params.deferredRulePath,
    })
    for (const output of itemOutputs) {
      const xml = converted.outputs.get(output.key) ?? {}
      const exportClaimId = readXmlAnomalyExportClaim(normalizedYAML)
      if (exportClaimId !== undefined) {
        const claimTarget = params.descriptor.unwrapXMLItem?.({ xml, itemRule }) ?? xml
        markXmlAnomalyExportClaim(claimTarget, exportClaimId, true)
      }
      if (xml !== undefined) {
        const items = outputItems.get(output.key)!
        const itemIndex = items.length
        items.push(xml)
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

export function prepareMetadataCollectionItemXMLContext(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly descriptor: CollectionDescriptor
  readonly yaml: unknown
  readonly name?: string
  readonly index: number
  readonly itemRule: MetadataItemRule
  readonly propertyRule?: PropertyRule
}): ConfigurationContextWithExportToXML {
  const { context, descriptor, yaml, name, index, itemRule, propertyRule } = params
  const indexed = descriptor.resolveItemContext?.({ context, yaml, name, index, itemRule, propertyRule })
    ?? configurationIndexCollectionItemContext(params)
  const itemContext = name === undefined || itemRule.externalMetadata === undefined ? indexed : getChildContextToXML({
    context: indexed, itemType: itemRule.itemType, path: `${itemRule.itemType}.${name}`, name,
    externalMetadata: itemRule.externalMetadata,
  })
  const currentPath = collectionItemCurrentPath({ context, propertyRule, name })
  const referenceRemap = itemContext.importFromYAML?.referenceRemap
  const prepared = currentPath === undefined || referenceRemap === undefined ? itemContext : {
    ...itemContext,
    importFromYAML: { ...itemContext.importFromYAML, referenceRemap: { ...referenceRemap, currentPath } },
  }
  assertRequiredConfigurationIdentity({ context: prepared, kind: descriptor.requiredIdentity })
  return prepared
}

function completeCollectionEntries(params: {
  entries: CollectionEntry[]
  descriptor: CollectionDescriptor
  propertyRule: PropertyRule | undefined
  source: YAMLPropertySource | undefined
  materializeCanonicalItems: true | undefined
}): CollectionEntry[] {
  if (params.descriptor.yamlShape !== "record") return params.entries
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
  const requestedNames = ruleNames
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

function collectionEntries(
  yaml: unknown,
  annotations: XmlAnomalyAnnotations | undefined,
  descriptor: CollectionDescriptor,
  propertyRule: PropertyRule | undefined
): CollectionEntry[] {
  const rawItems = readXmlAnomalyRawCollectionItems(yaml)
  if (descriptor.yamlShape === "array") {
    const entries = Array.isArray(yaml) ? yaml.map((item, index) => ({
      yaml: transferCollectionValueTag(yaml, index, item),
    })) : []
    for (const item of rawItems) entries.splice(item.index, 0, { yaml: item.yaml })
    return entries
  }
  if (!isRecord(yaml)) return []
  const entries = yamlMappingEntries(yaml)
  const result: CollectionEntry[] = entries.map(([runtimeKey, value]) => {
    const logicalKey = annotations?.keyAt(yaml, runtimeKey)?.logicalKey ?? runtimeKey
    const annotation = annotations?.at(yaml, runtimeKey)
    return {
    yaml: transferCollectionValueTag(yaml, runtimeKey, value),
    name:
      (propertyRule === undefined
        ? undefined
        : descriptor.nameFromYAMLKeyForProperty?.({ yamlKey: logicalKey, propertyRule })) ??
      descriptor.nameFromYAMLKey?.(logicalKey) ??
      logicalKey,
    ...(annotation?.kind === "raw" && annotation.xml !== undefined
      ? { rawXml: annotation.xml }
      : {}),
  }
  })
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
