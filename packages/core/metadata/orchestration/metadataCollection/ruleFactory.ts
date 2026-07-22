import { Type } from "typebox"
import {
  arrayOfSchemaRef,
  recordOfSchemaRef,
  registerJSONSchemaIdentity,
  registerJSONSchemaPropertyRef,
  schemaRef,
} from "../jsonSchemaRefs"
import {
  ExportToJSONSchemaFn,
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ImportFromXMLFunction,
  importFromYAMLFunction,
} from "../property/fn"
import type { ImportFromXMLToYAMLFunction } from "../property/importYamlTypes"
import { PropertyRuleType } from "../property/registry"
import type { ConfigurationIndexAddressingMode, MetadataItemRule, PropertyRule } from "../property/types"
import { ToMetadata } from "../metadataItem/registry"
import { exportMetadataItemToJSONSchema } from "../metadataItem/toJSONSchema"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { NamedMetadataItem } from "./types"
import { importMetadataItemCollectionFromXML } from "./fromXML"
import { importMetadataItemCollectionFromXMLToYAML } from "./fromXMLToYAML"
import { importMetadataItemCollectionFromYAMLAsArray, importMetadataItemCollectionFromYAMLAsRecord } from "./fromYAML"
import { exportMetadataCollectionToXML, registerMetadataCollectionConfigurationIndexOptions } from "./toXML"
import { exportMetadataCollectionToYAMLAsArray, exportMetadataCollectionToYAMLAsRecord } from "./toYAML"

type JSONSchemaCollectionShape = "record" | "array" | "schema"

type CollectionRule<Rule extends MetadataItemRule, CollectionType extends PropertyRuleType, XMLKey extends string> = {
  propertyType: CollectionType
  itemRule: Rule
  xmlElement?: XMLKey
  yamlAsArray?: true
  keyField?: keyof Rule["properties"]
  /** Канонический сегмент logicalAddress для элементов этой metadata-item коллекции. */
  configurationIndexUidSegment?: string
  /** Режим построения logicalAddress для данных файла индекса конфигурации. */
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  /** Для YAML-объекта коллекции: ключ записи → внутреннее имя элемента (например стандартный реквизит) */
  nameFromYAMLKey?: (yamlKey: string) => string
  /** Для YAML-объекта коллекции: элемент → ключ записи (если не совпадает со String(item[keyField])) */
  recordYamlKeyFromItem?: (item: ToMetadata<Rule["itemType"]> & NamedMetadataItem) => string
  /** Для YAML-объекта коллекции: YAML-элемент → ключ записи при прямом XML → YAML обходе. */
  recordYamlKeyFromYAML?: (params: { yaml: Record<string, unknown>; name: string }) => string
  fromXML?: ImportFromXMLFunction
  fromXMLToYAML?: ImportFromXMLToYAMLFunction
  toXML?: ExportToXMLFunctionNew
  fromYAML?: importFromYAMLFunction
  toYAML?: ExportToYAMLFunction
  toJSONSchema?: ExportToJSONSchemaFn
  /** Регистрирует item-правило коллекции для обхода вложенных metadata target. */
  collectionItemRule?: true
  schemaName?: string
  schemaShape?: JSONSchemaCollectionShape
}

export const registerMetadataItemCollectionRule = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  params: CollectionRule<Rule, CollectionType, XMLKey>
): void => {
  const { propertyType, itemRule, xmlElement } = params
  const schemaName = params.schemaName ?? itemRule.itemType
  const schemaShape = params.schemaShape ?? (params.yamlAsArray ? "array" : "record")
  registerMetadataCollectionConfigurationIndexOptions({
    propertyType,
    ...(params.configurationIndexUidSegment === undefined
      ? {}
      : { configurationIndexUidSegment: params.configurationIndexUidSegment }),
    ...(params.configurationIndexAddressing === undefined
      ? {}
      : { configurationIndexAddressing: params.configurationIndexAddressing }),
    ...(params.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
  })

  registerJSONSchemaIdentity({
    name: schemaName,
    source: itemRule,
    exporter: ({ context }) => {
      if (schemaShape === "schema" && params.toJSONSchema !== undefined) {
        return (
          params.toJSONSchema({
            context,
            rule: { type: propertyType } as PropertyRule,
            value: undefined,
          }) ?? Type.Unknown()
        )
      }

      return exportMetadataItemToJSONSchema({ context, rule: itemRule })
    },
  })

  registerJSONSchemaPropertyRef(propertyType, () => {
    if (schemaShape === "schema") return schemaRef(schemaName)
    return schemaShape === "array" ? arrayOfSchemaRef(schemaName) : recordOfSchemaRef(schemaName)
  })

  const fromXMLDefault: ImportFromXMLFunction = (context, rule, xml) => {
    const effectiveElement = xmlElement ?? (rule as any).xml
    const options = {
      propertyType,
      configurationIndexUidSegment: params.configurationIndexUidSegment,
      configurationIndexAddressing: params.configurationIndexAddressing,
      ...(params.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
    }
    if (Array.isArray(xml)) {
      // Если каждый элемент массива — обёртка вида `{[effectiveElement]: body | [bodies]}`,
      // расплющиваем в массив тел. Такую форму даёт XML-парсер для тегов, помеченных
      // `options.isArray` (например `<ChildItems>` в импортёре), — содержимое тега
      // всегда оборачивается в массив, даже если он встречается один раз.
      const isWrapped = xml.every(
        (entry) =>
          entry !== null && typeof entry === "object" && !Array.isArray(entry) && effectiveElement in (entry as object)
      )
      const bodies = isWrapped
        ? xml.flatMap((entry: any) => {
            const inner = entry[effectiveElement]
            return Array.isArray(inner) ? inner : [inner]
          })
        : xml
      return importMetadataItemCollectionFromXML(itemRule, effectiveElement, options)(context, rule, {
        [effectiveElement]: bodies,
      })
    }
    // Если parent уже вытащил содержимое по rule.xml и вернул одиночный элемент (а не контейнер),
    // оборачиваем его, чтобы коллекционная процедура могла прочитать `xml[effectiveElement]`.
    if (xml !== undefined && xml !== null && typeof xml === "object" && !(effectiveElement in (xml as object))) {
      return importMetadataItemCollectionFromXML(itemRule, effectiveElement, options)(context, rule, {
        [effectiveElement]: [xml],
      })
    }
    return importMetadataItemCollectionFromXML(itemRule, effectiveElement, options)(context, rule, xml)
  }
  const fromXML = params.fromXML ?? fromXMLDefault
  registerTypeRule(propertyType, "importFromXML", fromXML)

  if (params.fromXMLToYAML !== undefined) {
    registerTypeRule(propertyType, "importFromXMLToYAML", params.fromXMLToYAML)
  } else if (params.fromXML === undefined) {
    registerTypeRule(propertyType, "importFromXMLToYAML", ({ context, rule, xml, traversal }) =>
      importMetadataItemCollectionFromXMLToYAML({
        context,
        rule,
        xml,
        itemRule,
        xmlElement: xmlElement ?? rule.xml ?? "Item",
        keyField: typeof params.keyField === "string" ? params.keyField : undefined,
        propertyType,
        configurationIndexUidSegment: params.configurationIndexUidSegment,
        configurationIndexAddressing: params.configurationIndexAddressing,
        ...(params.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
        ...(params.recordYamlKeyFromYAML === undefined ? {} : { recordYamlKeyFromYAML: params.recordYamlKeyFromYAML }),
        traversal,
      })
    )
  }
  registerTypeRule(propertyType, "nestedItemRule", { itemRule })
  registerTypeRule(propertyType, "yamlToXMLNestedRule", {
    kind: "collection",
    itemRule,
    yamlShape: params.yamlAsArray === true ? "array" : "record",
    xmlElement,
    keyField: typeof params.keyField === "string" ? params.keyField : undefined,
    nameFromYAMLKey: params.nameFromYAMLKey,
    configurationIndexUidSegment: params.configurationIndexUidSegment,
    configurationIndexAddressing: params.configurationIndexAddressing,
  })

  const fromYAMLDefault: importFromYAMLFunction = (context, _rule, value, source) =>
    params.yamlAsArray
      ? importMetadataItemCollectionFromYAMLAsArray({
          context,
          itemRule,
          yaml: value,
          source,
          keyField: params.keyField,
        })
      : importMetadataItemCollectionFromYAMLAsRecord({
          context,
          itemRule,
          yaml: value,
          nameFromYAMLKey: params.nameFromYAMLKey,
        })

  const fromYAML = params.fromYAML ?? fromYAMLDefault
  registerTypeRule(propertyType, "importFromYAML", fromYAML)

  const toYAMLDefault: ExportToYAMLFunction = (context, _rule, value) =>
    params.yamlAsArray
      ? exportMetadataCollectionToYAMLAsArray({ context, data: value, itemRule })
      : exportMetadataCollectionToYAMLAsRecord({
          context,
          data: value,
          itemRule,
          keyField: params.keyField!,
          recordYamlKeyFromItem: params.recordYamlKeyFromItem,
        })

  const toYAML = params.toYAML ?? toYAMLDefault
  registerTypeRule(propertyType, "exportToYAML", toYAML)

  const toXMLDefault: ExportToXMLFunctionNew = (p) => {
    // Когда родительское правило использует ровно тот же XML-элемент, что и обёртка коллекции,
    // возвращаем массив напрямую — иначе получилось бы двойное вложение `<tag><tag>...</tag></tag>`.
    const effectiveXmlElement = xmlElement !== undefined && (p.rule as any)?.xml === xmlElement ? undefined : xmlElement
    return exportMetadataCollectionToXML({
      context: p.context,
      rule: p.rule,
      data: p.value,
      referenceData: p.referenceMetadata,
      itemRule,
      xmlElement: effectiveXmlElement,
      keyField: params.keyField,
      propertyType,
      configurationIndexUidSegment: params.configurationIndexUidSegment,
      configurationIndexAddressing: params.configurationIndexAddressing,
      ...(params.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
    })
  }

  const toXML = params.toXML ?? toXMLDefault
  registerTypeRule(propertyType, "exportToXML", toXML)

  const toJSONSchemaDefault: ExportToJSONSchemaFn = ({ context }) => {
    const schemaStack = context.exportToJSONSchema?.schemaStack ?? []
    if (schemaStack.includes(propertyType)) {
      return params.yamlAsArray ? Type.Array(Type.Unknown()) : Type.Record(Type.String(), Type.Unknown())
    }

    const itemSchema = exportMetadataItemToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: {
          mode: context.exportToJSONSchema?.mode ?? "inline",
          refs: context.exportToJSONSchema?.refs ?? new Set(),
          includeNestedChildItems: context.exportToJSONSchema?.includeNestedChildItems,
          propertySchemaOverrides: context.exportToJSONSchema?.propertySchemaOverrides,
          schemaStack: [...schemaStack, propertyType],
        },
      },
      rule: itemRule,
    })
    if (params.yamlAsArray) return Type.Array(itemSchema)
    return Type.Record(Type.String(), itemSchema)
  }

  const toJSONSchema = params.toJSONSchema ?? toJSONSchemaDefault
  registerTypeRule(propertyType, "exportToJSONSchema", toJSONSchema)

  if (params.collectionItemRule) {
    registerTypeRule(propertyType, "collectionItemRule", {
      itemRule: itemRule as unknown as MetadataItemRule,
    })
  }
}
