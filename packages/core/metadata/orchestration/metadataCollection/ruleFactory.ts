import {
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ImportFromXMLFunction,
  importFromYAMLFunction,
} from "~/metadata/orchestration/property/fn"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { ToMetadata } from "../metadataItem/registry"
import { registerTypeRule } from "../formElement/factory"
import { NamedMetadataItem } from "./types"
import { importMetadataItemCollectionFromXML } from "./fromXML"
import {
  importMetadataItemCollectionFromYAMLAsArray,
  importMetadataItemCollectionFromYAMLAsRecord,
} from "./fromYAML"
import { exportMetadataCollectionToXML } from "./toXML"
import {
  exportMetadataCollectionToYAMLAsArray,
  exportMetadataCollectionToYAMLAsRecord,
} from "./toYAML"

type CollectionRule<Rule extends MetadataItemRule, CollectionType extends PropertyRuleType, XMLKey extends string> = {
  propertyType: CollectionType
  itemRule: Rule
  xmlElement: XMLKey
  yamlAsArray?: true
  keyField?: keyof Rule["properties"]
  /** Для YAML-объекта коллекции: ключ записи → внутреннее имя элемента (например стандартный реквизит) */
  nameFromYAMLKey?: (yamlKey: string) => string
  /** Для YAML-объекта коллекции: элемент → ключ записи (если не совпадает со String(item[keyField])) */
  recordYamlKeyFromItem?: (item: ToMetadata<Rule["itemType"]> & NamedMetadataItem) => string
  fromXML?: ImportFromXMLFunction
  toXML?: ExportToXMLFunctionNew
  fromYAML?: importFromYAMLFunction
  toYAML?: ExportToYAMLFunction
}

export const registerMetadataItemCollectionRule = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  params: CollectionRule<Rule, CollectionType, XMLKey>
): void => {
  const { propertyType, itemRule, xmlElement } = params

  const fromXML = params.fromXML ?? importMetadataItemCollectionFromXML(itemRule, xmlElement)
  registerTypeRule(propertyType, "importFromXML", fromXML)

  const fromYAMLDefault: importFromYAMLFunction = (context, _rule, value) =>
    params.yamlAsArray
      ? importMetadataItemCollectionFromYAMLAsArray({ context, itemRule, yaml: value })
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

  const toXMLDefault: ExportToXMLFunctionNew = (p) =>
    exportMetadataCollectionToXML({
      context: p.context,
      rule: p.rule,
      data: p.value,
      referenceData: p.referenceMetadata,
      itemRule,
      xmlElement,
      keyField: params.keyField,
    })

  const toXML = params.toXML ?? toXMLDefault
  registerTypeRule(propertyType, "exportToXML", toXML)
}
