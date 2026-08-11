import { Type } from "typebox"
import {
  arrayOfSchemaRef,
  recordOfSchemaRef,
  schemaRef,
} from "../jsonSchemaRefs"
import { ExportToJSONSchemaFn } from "../property/fn"
import type { ImportFromXMLToYAMLFunction } from "../property/importYamlTypes"
import { PropertyRuleType } from "../property/registry"
import type { ConfigurationIndexAddressingMode, MetadataItemRule, PropertyRule } from "../property/types"
import { exportMetadataItemToJSONSchema } from "../metadataItem/toJSONSchema"
import {
  registerLegacyPropertyTypeDefinitions,
  resolvePropertyItemRule,
} from "../property/typeRuleRegistry"
import {
  definePropertyTypeRule,
  propertyTypesFromContributions,
  type PropertyTypeRuleContribution,
} from "../property/propertyRuleRegistrySet"
import { getDeclaredPropertyItemRule } from "../property/propertyItemRuleDeclarations"
import { importMetadataItemCollectionFromXMLToYAML } from "./fromXMLToYAML"
import { defineMetadataRules } from "../definition"
import { registerLegacySchemaDefinitions } from "../definition/legacyRuleRegistration"
import type {
  MetadataRulesDefinition,
  MetadataSchemaPropertyRefDefinition,
} from "../definition"
import { emptyMetadataRules } from "../definition/testSupport"
import { withNestedJSONSchemaItemContext } from "../property/jsonSchemaRequiredPolicy"

type JSONSchemaCollectionShape = "record" | "array" | "schema"

type CollectionRule<Rule extends MetadataItemRule, CollectionType extends PropertyRuleType, XMLKey extends string> = {
  propertyType: CollectionType
  itemRule: Rule
  xmlElement?: XMLKey
  yamlAsArray?: true
  keyField?: keyof Rule["properties"]
  /** Канонический сегмент logicalAddress для элементов этой metadata-item коллекции. */
  configurationIndexUidSegment?: string
  /** Идентификатор каждого элемента обязателен в режиме существующих identity. */
  requiredIdentity?: "xmlId"
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
  /** Сохранять в индексе присутствие каждого XML-свойства элемента коллекции. */
  preserveItemPropertyPresence?: true
  /** Не выводить XML-свойства элемента, отсутствующие в его YAML-записи. */
  sparseItems?: true
  /** Не создавать XML-значения по умолчанию для отсутствующих полей разреженного элемента. */
  omitDefaultsForSparseItems?: true
  omitDefaultsForSparseItem?: Extract<
    import("../property/fromYAMLToXMLTypes").YAMLToXMLNestedRule,
    { kind: "collection" }
  >["omitDefaultsForSparseItem"]
  /** Не создавать XML-контейнер, если после преобразования в коллекции нет элементов. */
  omitEmptyOutput?: true
  mapItemOutput?: Extract<
    import("../property/fromYAMLToXMLTypes").YAMLToXMLNestedRule,
    { kind: "collection" }
  >["mapItemOutput"]
  normalizeItemYAML?: Extract<
    import("../property/fromYAMLToXMLTypes").YAMLToXMLNestedRule,
    { kind: "collection" }
  >["normalizeItemYAML"]
  referenceIdentity?: Extract<
    import("../property/fromYAMLToXMLTypes").YAMLToXMLNestedRule,
    { kind: "collection" }
  >["referenceIdentity"]
  /** Для YAML-объекта коллекции: YAML-элемент → ключ записи при прямом XML → YAML обходе. */
  recordYamlKeyFromYAML?: (params: { yaml: Record<string, unknown>; name: string }) => string
  fromXMLToYAML?: ImportFromXMLToYAMLFunction
  toJSONSchema?: ExportToJSONSchemaFn
  /** Регистрирует item-правило коллекции для обхода вложенных metadata target. */
  collectionItemRule?: true
  schemaName?: string
  schemaShape?: JSONSchemaCollectionShape
}

export const defineMetadataItemCollectionRule = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  params: CollectionRule<Rule, CollectionType, XMLKey>
): MetadataRulesDefinition<never> => {
  const { propertyType, itemRule, xmlElement } = params
  const schemaName = params.schemaName ?? itemRule.itemType
  const schemaShape = params.schemaShape ?? (params.yamlAsArray ? "array" : "record")
  const propertyTypeRules: PropertyTypeRuleContribution[] = []
  const schemaExporter = ({ context, execution }: Parameters<MetadataRulesDefinition["schemas"][string]["export"]>[0]) => {
      if (schemaShape === "schema" && params.toJSONSchema !== undefined) {
        return (
          params.toJSONSchema({
            context,
            rule: { type: propertyType } as PropertyRule,
            value: undefined,
            execution,
          }) ?? Type.Unknown()
        )
      }

      return exportMetadataItemToJSONSchema({
        context,
        rule: execution?.getDeclaredPropertyItemRule(propertyType)
          ?? declaredMetadataItemRule(propertyType)
          ?? itemRule,
        execution,
      })
    }

  const schemaPropertyRef: MetadataSchemaPropertyRefDefinition = ({ context, rule, execution }) => {
    const resolvedItemRule = execution?.resolvePropertyItemRule(rule, itemRule)
      ?? resolvePropertyItemRuleLegacy(rule, itemRule)
    if (resolvedItemRule === itemRule) {
      if (schemaShape === "schema") return schemaRef(schemaName)
      return schemaShape === "array" ? arrayOfSchemaRef(schemaName) : recordOfSchemaRef(schemaName)
    }
    if (resolvedItemRule === (execution?.getDeclaredPropertyItemRule(propertyType) ?? declaredMetadataItemRule(propertyType))) {
      if (schemaShape === "schema") return schemaRef(schemaName)
      return schemaShape === "array" ? arrayOfSchemaRef(schemaName) : recordOfSchemaRef(schemaName)
    }
    return exportCollectionSchema({ context, propertyRule: rule, resolvedItemRule, execution })
  }

  if (params.fromXMLToYAML !== undefined) {
    propertyTypeRules.push(definePropertyTypeRule(propertyType, "importFromXMLToYAML", params.fromXMLToYAML))
  } else {
    propertyTypeRules.push(definePropertyTypeRule(propertyType, "importFromXMLToYAML", ({ context, rule, xml, traversal }) =>
      importMetadataItemCollectionFromXMLToYAML({
        context,
        rule,
        xml,
        itemRule: resolvePropertyItemRule(rule, itemRule) ?? itemRule,
        xmlElement: xmlElement ?? rule.xml ?? "Item",
        keyField: typeof params.keyField === "string" ? params.keyField : undefined,
        propertyType,
        configurationIndexUidSegment: params.configurationIndexUidSegment,
        configurationIndexAddressing: params.configurationIndexAddressing,
        preserveItemPropertyPresence: params.preserveItemPropertyPresence,
        ...(params.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
        ...(params.recordYamlKeyFromYAML === undefined ? {} : { recordYamlKeyFromYAML: params.recordYamlKeyFromYAML }),
        traversal,
      })
    ))
  }
  propertyTypeRules.push(definePropertyTypeRule(propertyType, "nestedItemRule", { itemRule }))
  propertyTypeRules.push(definePropertyTypeRule(propertyType, "yamlToXMLNestedRule", {
    kind: "collection",
    itemRule,
    itemRuleFromProperty: (propertyRule) => resolvePropertyItemRule(propertyRule, itemRule),
    yamlShape: params.yamlAsArray === true ? "array" : "record",
    xmlElement,
    keyField: typeof params.keyField === "string" ? params.keyField : undefined,
    nameFromYAMLKey: params.nameFromYAMLKey,
    nameFromYAMLKeyForProperty: params.nameFromYAMLKeyForProperty,
    completeItemNames: params.completeItemNames,
    preserveReferenceItems: params.preserveReferenceItems,
    sparseItems: params.sparseItems,
    omitDefaultsForSparseItems: params.omitDefaultsForSparseItems,
    omitDefaultsForSparseItem: params.omitDefaultsForSparseItem,
    omitEmptyOutput: params.omitEmptyOutput,
    mapItemOutput: params.mapItemOutput,
    normalizeItemYAML: params.normalizeItemYAML,
    referenceIdentity: params.referenceIdentity,
    configurationIndexUidSegment: params.configurationIndexUidSegment,
    requiredIdentity: params.requiredIdentity,
    configurationIndexAddressing: params.configurationIndexAddressing,
  }))

  const exportCollectionSchema = (paramsForSchema: {
    context: Parameters<ExportToJSONSchemaFn>[0]["context"]
    propertyRule: PropertyRule
    resolvedItemRule?: MetadataItemRule
    execution?: Parameters<ExportToJSONSchemaFn>[0]["execution"]
  }) => {
    const { context, propertyRule } = paramsForSchema
    const resolvedItemRule = paramsForSchema.resolvedItemRule
      ?? paramsForSchema.execution?.resolvePropertyItemRule(propertyRule, itemRule)
      ?? resolvePropertyItemRuleLegacy(propertyRule, itemRule)
      ?? itemRule
    const schemaStack = context.exportToJSONSchema?.schemaStack ?? []
    if (schemaStack.includes(propertyType)) {
      return params.yamlAsArray ? Type.Array(Type.Unknown()) : Type.Record(Type.String(), Type.Unknown())
    }

    const itemSchema = exportMetadataItemToJSONSchema({
      context: withNestedJSONSchemaItemContext(context, resolvedItemRule, propertyType),
      rule: resolvedItemRule,
      execution: paramsForSchema.execution,
    })
    if (schemaShape === "schema") return itemSchema
    if (schemaShape === "array") return Type.Array(itemSchema)
    return Type.Record(Type.String(), itemSchema)
  }

  const toJSONSchemaDefault: ExportToJSONSchemaFn = ({ context, rule, execution }) =>
    exportCollectionSchema({ context, propertyRule: rule, execution })

  const customToJSONSchema = params.toJSONSchema
  const toJSONSchema: ExportToJSONSchemaFn =
    customToJSONSchema === undefined
      ? toJSONSchemaDefault
      : (schemaParams) => {
          const resolvedItemRule = schemaParams.execution?.resolvePropertyItemRule(schemaParams.rule, itemRule)
            ?? resolvePropertyItemRuleLegacy(schemaParams.rule, itemRule)
          if (resolvedItemRule === itemRule) return customToJSONSchema(schemaParams)
          return exportCollectionSchema({
            context: schemaParams.context,
            propertyRule: schemaParams.rule,
            resolvedItemRule,
            execution: schemaParams.execution,
          })
        }
  propertyTypeRules.push(definePropertyTypeRule(propertyType, "exportToJSONSchema", toJSONSchema))

  if (params.collectionItemRule) {
    propertyTypeRules.push(definePropertyTypeRule(propertyType, "collectionItemRule", {
      itemRule: itemRule as unknown as MetadataItemRule,
    }))
  }

  return defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: propertyTypesFromContributions(propertyTypeRules),
    metadataItems: { [itemRule.itemType]: itemRule },
    schemas: {
      [schemaName]: {
        source: itemRule,
        export: schemaExporter,
      },
    },
    schemaPropertyRefs: { [propertyType]: schemaPropertyRef },
  })
}

export const registerMetadataItemCollectionRule = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(params: CollectionRule<Rule, CollectionType, XMLKey>): void => {
  const definition = defineMetadataItemCollectionRule(params)
  registerLegacyPropertyTypeDefinitions(definition.propertyTypes)
  registerLegacySchemaDefinitions(definition, params.itemRule)
}

function declaredMetadataItemRule(propertyType: PropertyRuleType): MetadataItemRule | undefined {
  return getDeclaredPropertyItemRule<MetadataItemRule>(propertyType)
}

function resolvePropertyItemRuleLegacy(
  rule: PropertyRule,
  fallback?: MetadataItemRule,
): MetadataItemRule | undefined {
  return (rule.itemRule as MetadataItemRule | undefined) ??
    getDeclaredPropertyItemRule<MetadataItemRule>(rule.type) ??
    fallback
}
