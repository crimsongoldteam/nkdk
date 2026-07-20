import { capitalize } from "../../../helpers/capitalize"
import {
  getConfigurationIndexPropertyXmlValue,
  getConfigurationIndexSourceXmlKey,
} from "../../configurationIndex/referenceView"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import { canConvertToPascalCase } from "../../helpers/canConvertToPascalCase"
import { ToMetadata } from ".."
import { getTypeRule } from "./typeRuleRegistry"
import { ExportToXMLFunction, ExportToXMLFunctionNew } from "./fn"
import {
  applyAutoRequiredXMLParents,
  collectAutoRequiredXMLParentRoot,
  getOrderedKeysToXML,
  shouldProcessProperty,
  XML_SOURCE_KEYS,
} from "./helpers"
import type { ItemXML, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextWithExportToXML
  metadata: ToMetadata<Rule["itemType"]> | undefined
  referenceMetadata?: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  tag?: string[]
}): ItemXML => {
  const { context, metadata: metadata, rule, tag: tag } = params
  const referenceMetadata = params.referenceMetadata ?? createConfigurationIndexReferenceView(context)

  const result: ItemXML = {}

  const xmlContext = context.exportToXML?.context
  if (xmlContext) {
    if (xmlContext.propertiesItemXmlStack === undefined) {
      xmlContext.propertiesItemXmlStack = []
    }
    xmlContext.propertiesItemXmlStack.push(result)
  }

  const orderedKeys = getOrderedKeysToXML({ context, rule, tag, referenceMetadata })
  if (context.exportToXML.configurationIndex?.xmlNode()?.order !== undefined) {
    context.exportToXML.configurationIndex.collector.setOrder(
      context.exportToXML.configurationIndex.logicalAddress,
      orderedKeys
    )
  }
  const autoRequiredXMLParentRoots = new Set<string>()

  try {
    for (const key of orderedKeys) {
      if (key === "itemType") continue
      const ruleProp = rule.properties[key]
      if (
        !shouldProcessProperty({
          rule: ruleProp,
          operation: "exportToXML",
          metadataItem: metadata,
          context,
          propertyKey: key,
          referenceMetadata,
        })
      ) {
        continue
      }

      collectAutoRequiredXMLParentRoot(ruleProp, autoRequiredXMLParentRoots)

      const currentContext: ConfigurationContextWithExportToXML = {
        ...context,
        exportToXML: { ...context.exportToXML },
      }

      const metadataHasOwnKey =
        metadata !== null &&
        metadata !== undefined &&
        typeof metadata === "object" &&
        Object.prototype.hasOwnProperty.call(metadata, key)
      const value = metadataHasOwnKey ? (metadata as any)[key] : undefined
      const referenceValue =
        referenceMetadata === undefined || (referenceMetadata as any)[key] === undefined
          ? configurationIndexXmlValueToReference(getConfigurationIndexPropertyXmlValue(currentContext, key))
          : (referenceMetadata as any)[key]

      const shouldUseReferenceForUndefined =
        ruleProp.preserveFromReferenceXML === true && value === undefined && (ruleProp as any).exportNilValue !== true
      let valueToExport = metadataHasOwnKey && !shouldUseReferenceForUndefined ? value : referenceValue

      const exportedValue = shouldRestoreReferenceAutoColor({
        rule: ruleProp,
        metadataHasOwnKey,
        referenceMetadata,
        referenceValue,
        propertyKey: key,
      })
        ? "auto"
        : exportPropertyToXML({
            context: currentContext,
            rule: ruleProp,
            value: valueToExport,
            referenceMetadata: referenceValue,
            metadataItem: metadata,
          })

      setXMLValue(key, result, ruleProp, exportedValue, referenceMetadata, currentContext)
    }
  } finally {
    xmlContext?.propertiesItemXmlStack?.pop()
  }

  applyAutoRequiredXMLParents(result, autoRequiredXMLParentRoots)

  return result
}

const shouldRestoreReferenceAutoColor = (params: {
  rule: PropertyRule
  metadataHasOwnKey: boolean
  referenceMetadata: unknown
  referenceValue: unknown
  propertyKey: string
}): boolean => {
  const { rule, metadataHasOwnKey, referenceMetadata, referenceValue, propertyKey } = params

  if (rule.type !== "Color") return false
  if (metadataHasOwnKey) return false
  if (referenceValue !== undefined) return false
  if (referenceMetadata === undefined || referenceMetadata === null || typeof referenceMetadata !== "object")
    return false

  const sourceKeys = (referenceMetadata as Record<PropertyKey, unknown>)[XML_SOURCE_KEYS]
  if (sourceKeys === undefined || sourceKeys === null || typeof sourceKeys !== "object") return false

  return Object.prototype.hasOwnProperty.call(sourceKeys, propertyKey)
}

const createConfigurationIndexReferenceView = (
  context: ConfigurationContextWithExportToXML
): Record<PropertyKey, unknown> | undefined => {
  const node = context.exportToXML.configurationIndex?.xmlNode()
  if (node === undefined) return undefined

  const view: Record<PropertyKey, unknown> = {}
  for (const key of node.order ?? []) view[key] = undefined
  for (const key of node.present ?? []) view[key] = undefined
  Object.defineProperty(view, XML_SOURCE_KEYS, {
    value: node.aliases ?? {},
    enumerable: false,
  })
  return view
}

const configurationIndexXmlValueToReference = (value: ReturnType<typeof getConfigurationIndexPropertyXmlValue>): any => {
  if (value === undefined) return undefined
  if (value.userSettingsId !== undefined) return value.userSettingsId
  if (value.xsiNil === true) return { "_xsi:nil": true }
  if (
    value.xsiType !== undefined ||
    value.xmlText !== undefined ||
    value.xmlPrefix !== undefined ||
    value.explicitEmpty === true
  ) {
    return {
      ...(value.xsiType === undefined ? {} : { "_xsi:type": value.xsiType }),
      ...(value.xmlPrefix === undefined ? {} : { "_xmlns": value.xmlPrefix }),
      ...(value.xmlText === undefined ? {} : { "#text": value.xmlText }),
    }
  }
  return undefined
}

export const setXMLValue = (
  key: string,
  xml: any,
  rule: PropertyRule,
  value: any,
  referenceMetadata?: any,
  context?: ConfigurationContextWithExportToXML
): void => {
  if (value === undefined) return

  if (Array.isArray(value) && value.length === 0) {
    // Пустой массив + xmlParents + defaultValueXMLRaw → создаём пустой контейнер (например <ChildObjects/>)
    const hasRaw = "defaultValueXMLRaw" in rule
    if (rule.xmlParents !== undefined && hasRaw) {
      let currentXml = xml
      for (let i = 0; i < rule.xmlParents.length - 1; i++) {
        const xmlParent = rule.xmlParents[i]
        if (currentXml[xmlParent] === undefined) {
          currentXml[xmlParent] = {}
        }
        currentXml = currentXml[xmlParent]
      }
      currentXml[rule.xmlParents[rule.xmlParents.length - 1]] = (rule as any).defaultValueXMLRaw
    }
    return
  }

  const canonicalXmlKey = rule.xml ?? capitalize(key)
  const sourceXmlKey = referenceMetadata?.[XML_SOURCE_KEYS]?.[key] ?? (context === undefined ? undefined : getConfigurationIndexSourceXmlKey(context, key))
  const xmlKey = [canonicalXmlKey, ...((rule as any).xmlAliases ?? [])].includes(sourceXmlKey)
    ? sourceXmlKey
    : canonicalXmlKey
  const configurationIndex = context?.exportToXML.configurationIndex
  if (configurationIndex !== undefined) {
    configurationIndex.collector.setPresent(configurationIndex.logicalAddress, key)
    if (sourceXmlKey !== undefined) {
      configurationIndex.collector.setAlias(configurationIndex.logicalAddress, key, sourceXmlKey)
    }
  }

  if (rule.xmlParents === undefined) {
    xml[xmlKey] = value
    return
  }

  let currentXml = xml
  for (const xmlParent of rule.xmlParents) {
    if (currentXml[xmlParent] === undefined) {
      currentXml[xmlParent] = {}
    }
    currentXml = currentXml[xmlParent]
  }

  currentXml[xmlKey] = value
}

export const exportPropertyToXML = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: any
  referenceMetadata?: any
  metadataItem?: any
}): any | undefined => {
  const { context, rule, value, metadataItem, referenceMetadata } = params

  const defaultValueXML = rule.defaultValueXML
  const hasRaw = "defaultValueXMLRaw" in rule

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToXML") : undefined

  if (shouldRestoreReferenceEmptyI8nTextRaw({ context, rule, value, referenceMetadata, metadataItem })) {
    return (rule as any).defaultValueXMLRaw
  }

  if (!typeExportFn) {
    if (isDefaultValue(value, rule.defaultValue)) {
      if (shouldLetSetXMLValueCreateRawParent(value, rule)) return value
      return hasRaw ? (rule as any).defaultValueXMLRaw : defaultValueXML
    }
    return wrapWithNamespace(rule, value)
  }

  if (typeExportFn.length === 1) {
    const exportedValue = (typeExportFn as ExportToXMLFunctionNew)({
      context,
      rule,
      value,
      metadataItem,
      referenceMetadata,
    })
    if (
      isDefaultValue(exportedValue, rule.defaultValue) ||
      (exportedValue === undefined && isDefaultValue(value, rule.defaultValue))
    ) {
      if (shouldLetSetXMLValueCreateRawParent(value, rule)) return value
      if (hasRaw) return (rule as any).defaultValueXMLRaw
      const fallback = (typeExportFn as ExportToXMLFunctionNew)({
        context,
        rule,
        value: defaultValueXML as any,
        metadataItem,
        referenceMetadata,
      })
      return wrapWithNamespace(rule, fallback)
    }
    return wrapWithNamespace(rule, exportedValue)
  }

  const exportedValue = (typeExportFn as ExportToXMLFunction)(context, rule, value, referenceMetadata)
  if (
    isDefaultValue(exportedValue, rule.defaultValue) ||
    (exportedValue === undefined && isDefaultValue(value, rule.defaultValue))
  ) {
    if (shouldLetSetXMLValueCreateRawParent(value, rule)) return value
    if (hasRaw) return (rule as any).defaultValueXMLRaw
    const fallback = (typeExportFn as ExportToXMLFunction)(context, rule, defaultValueXML, referenceMetadata)
    return wrapWithNamespace(rule, fallback)
  }
  return wrapWithNamespace(rule, exportedValue)
}

const isDefaultValue = (value: unknown, defaultValue: unknown): boolean => {
  if (value === defaultValue) return true
  return Array.isArray(value) && Array.isArray(defaultValue) && value.length === 0 && defaultValue.length === 0
}

const shouldLetSetXMLValueCreateRawParent = (value: unknown, rule: PropertyRule): boolean =>
  Array.isArray(value) &&
  value.length === 0 &&
  rule.xmlParents !== undefined &&
  "defaultValueXMLRaw" in rule &&
  typeof (rule as any).defaultValueXMLRaw === "object" &&
  (rule as any).defaultValueXMLRaw !== null

const shouldRestoreReferenceEmptyI8nTextRaw = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: unknown
  referenceMetadata: unknown
  metadataItem: unknown
}): boolean => {
  const { context, rule, value, referenceMetadata, metadataItem } = params
  if (rule.type !== "I8nText") return false
  if ((rule as any).emptyAsRawXML !== true || !("defaultValueXMLRaw" in rule)) return false
  if (!isExplicitEmptyI8nText(referenceMetadata)) return false

  const name =
    typeof (metadataItem as { name?: unknown } | undefined)?.name === "string"
      ? (metadataItem as { name: string }).name
      : undefined
  if (name === undefined) return false

  return isGeneratedDefaultI8nTextForName(context, value, name)
}

const isExplicitEmptyI8nText = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false

  const keys = Object.keys(value)
  if (keys.length !== 1 || keys[0] !== "items") return false

  const items = (value as { items?: unknown }).items
  return typeof items === "object" && items !== null && !Array.isArray(items) && Object.keys(items).length === 0
}

const isGeneratedDefaultI8nTextForName = (
  context: ConfigurationContextWithExportToXML,
  value: unknown,
  name: string
): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false

  const items = (value as { items?: unknown }).items
  if (typeof items !== "object" || items === null || Array.isArray(items)) return false

  const entries = Object.entries(items)
  if (entries.length === 0) return false

  return entries.every(
    ([lang, itemValue]) =>
      lang === context.defaultLanguage && typeof itemValue === "string" && canConvertToPascalCase(itemValue, name)
  )
}

const wrapWithNamespace = (rule: PropertyRule, value: any): any => {
  if (value === undefined || value === null) return value
  const ns = (rule as any).xmlNamespace
  if (!ns) return value
  if (typeof value === "object") return value
  return { "#text": value, _xmlns: ns }
}
