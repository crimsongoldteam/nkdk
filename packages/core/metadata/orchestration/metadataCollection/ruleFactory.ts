import { Type } from "typebox"
import {
  arrayOfSchemaRef,
  recordOfSchemaRef,
  registerJSONSchemaIdentity,
  registerJSONSchemaPropertyRef,
  schemaRef,
} from "../jsonSchemaRefs"
import { ExportToJSONSchemaFn } from "../property/fn"
import type { ImportFromXMLToYAMLFunction } from "../property/importYamlTypes"
import { PropertyRuleType } from "../property/registry"
import type { ConfigurationIndexAddressingMode, MetadataItemRule, PropertyRule } from "../property/types"
import { exportMetadataItemToJSONSchema } from "../metadataItem/toJSONSchema"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { importMetadataItemCollectionFromXMLToYAML } from "./fromXMLToYAML"

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
  /** Для YAML-объекта коллекции: ключ записи → имя с учётом правила свойства владельца. */
  nameFromYAMLKeyForProperty?: (params: { yamlKey: string; propertyRule: PropertyRule }) => string
  /** Имена пустых элементов, которыми дополняется непустая YAML-коллекция без reference XML. */
  completeItemNames?: (params: {
    source: import("../property/fromYAMLToXMLTypes").YAMLPropertySource
    propertyRule: PropertyRule
  }) => readonly string[]
  /** Сохранять элементы reference XML, отсутствующие в YAML. */
  preserveReferenceItems?: true
  /** Не выводить XML-свойства элемента, отсутствующие в его YAML-записи. */
  sparseItems?: true
  mapItemOutput?: Extract<
    import("../property/fromYAMLToXMLTypes").YAMLToXMLNestedRule,
    { kind: "collection" }
  >["mapItemOutput"]
  normalizeItemYAML?: Extract<
    import("../property/fromYAMLToXMLTypes").YAMLToXMLNestedRule,
    { kind: "collection" }
  >["normalizeItemYAML"]
  /** Для YAML-объекта коллекции: YAML-элемент → ключ записи при прямом XML → YAML обходе. */
  recordYamlKeyFromYAML?: (params: { yaml: Record<string, unknown>; name: string }) => string
  fromXMLToYAML?: ImportFromXMLToYAMLFunction
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

  if (params.fromXMLToYAML !== undefined) {
    registerTypeRule(propertyType, "importFromXMLToYAML", params.fromXMLToYAML)
  } else {
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
    itemRuleFromProperty: (propertyRule) =>
      "itemRule" in propertyRule && propertyRule.itemRule !== undefined
        ? (propertyRule.itemRule as MetadataItemRule)
        : undefined,
    yamlShape: params.yamlAsArray === true ? "array" : "record",
    xmlElement,
    keyField: typeof params.keyField === "string" ? params.keyField : undefined,
    nameFromYAMLKey: params.nameFromYAMLKey,
    nameFromYAMLKeyForProperty: params.nameFromYAMLKeyForProperty,
    completeItemNames: params.completeItemNames,
    preserveReferenceItems: params.preserveReferenceItems,
    sparseItems: params.sparseItems,
    mapItemOutput: params.mapItemOutput,
    normalizeItemYAML: params.normalizeItemYAML,
    configurationIndexUidSegment: params.configurationIndexUidSegment,
    configurationIndexAddressing: params.configurationIndexAddressing,
  })

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
