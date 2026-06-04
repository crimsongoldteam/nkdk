import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { canConvertToPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { ToMetadata } from ".."
import { getTypeRule } from "../formElement/factory"
import { ExportToXMLFunction, ExportToXMLFunctionNew } from "./fn"
import {
  applyAutoRequiredXMLParents,
  applyRequiredXMLParents,
  collectAutoRequiredXMLParentRoot,
  getOrderedKeysToXML,
  shouldProcessProperty,
  XML_SOURCE_KEYS,
} from "./helpers"
import { ItemXML, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextWithExportToXML
  metadata: ToMetadata<Rule["itemType"]> | undefined
  referenceMetadata?: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  tag?: string[]
}): ItemXML => {
  const { context, metadata: metadata, referenceMetadata, rule, tag: tag } = params

  const result: ItemXML = {}

  const xmlContext = context.exportToXML?.context
  if (xmlContext) {
    if (xmlContext.propertiesItemXmlStack === undefined) {
      xmlContext.propertiesItemXmlStack = []
    }
    xmlContext.propertiesItemXmlStack.push(result)
  }

  const orderedKeys = getOrderedKeysToXML({ rule, tag, referenceMetadata })
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
      const referenceValue = referenceMetadata === undefined ? undefined : (referenceMetadata as any)[key]

      const shouldUseReferenceForUndefined =
        ruleProp.preserveFromReferenceXML === true && value === undefined && (ruleProp as any).exportNilValue !== true
      let valueToExport = metadataHasOwnKey && !shouldUseReferenceForUndefined ? value : referenceValue

      // derivedFrom: вычисляем значение из наличия связанного свойства, если в модели нет явного значения
      if ("derivedFrom" in ruleProp && (ruleProp as any).derivedFrom?.externalFile && !metadataHasOwnKey) {
        const referencedKey = (ruleProp as any).derivedFrom.externalFile as string
        const referencedValue = metadata !== undefined ? (metadata as any)[referencedKey] : undefined
        valueToExport = referencedValue !== undefined
      }

      const exportedValue = exportPropertyToXML({
        context: currentContext,
        rule: ruleProp,
        value: valueToExport,
        referenceMetadata: referenceValue,
        metadataItem: metadata,
      })

      setXMLValue(key, result, ruleProp, exportedValue, referenceMetadata)
    }
  } finally {
    xmlContext?.propertiesItemXmlStack?.pop()
  }

  applyAutoRequiredXMLParents(result, autoRequiredXMLParentRoots)

  if (rule.requiredXMLParents) {
    applyRequiredXMLParents(result, rule.requiredXMLParents, tag)
  }

  return result
}

export const setXMLValue = (key: string, xml: any, rule: PropertyRule, value: any, referenceMetadata?: any): void => {
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
  const sourceXmlKey = referenceMetadata?.[XML_SOURCE_KEYS]?.[key]
  const xmlKey = [canonicalXmlKey, ...((rule as any).xmlAliases ?? [])].includes(sourceXmlKey)
    ? sourceXmlKey
    : canonicalXmlKey

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
    if (isDefaultValue(exportedValue, rule.defaultValue) || (exportedValue === undefined && isDefaultValue(value, rule.defaultValue))) {
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
  if (isDefaultValue(exportedValue, rule.defaultValue) || (exportedValue === undefined && isDefaultValue(value, rule.defaultValue))) {
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

  const name = typeof (metadataItem as { name?: unknown } | undefined)?.name === "string"
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
