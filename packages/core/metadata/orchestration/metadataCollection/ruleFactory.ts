import { Type } from "@sinclair/typebox"
import {
  ExportToJSONSchemaFn,
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ImportFromXMLFunction,
  importFromYAMLFunction,
} from "~/metadata/orchestration/property/fn"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { ToMetadata } from "../metadataItem/registry"
import { exportMetadataItemToJSONSchema } from "../metadataItem/toJSONSchema"
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
  xmlElement?: XMLKey
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
  toJSONSchema?: ExportToJSONSchemaFn
  /** Декларативное создание composition-дочерних узлов в buildGraphFromModel */
  graphChild?: {
    idFrom: keyof Rule["properties"] & string
    edgeName: string
    edgeKind: "composition" | "reference"
  }
}

export const registerMetadataItemCollectionRule = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  params: CollectionRule<Rule, CollectionType, XMLKey>
): void => {
  const { propertyType, itemRule, xmlElement } = params

  const fromXMLDefault: ImportFromXMLFunction = (context, rule, xml) => {
    const effectiveElement = xmlElement ?? (rule as any).xml
    if (Array.isArray(xml)) {
      return importMetadataItemCollectionFromXML(itemRule, effectiveElement)(context, rule, {
        [effectiveElement]: xml,
      })
    }
    // Если parent уже вытащил содержимое по rule.xml и вернул одиночный элемент (а не контейнер),
    // оборачиваем его, чтобы коллекционная процедура могла прочитать `xml[effectiveElement]`.
    if (
      xml !== undefined &&
      xml !== null &&
      typeof xml === "object" &&
      !(effectiveElement in (xml as object))
    ) {
      return importMetadataItemCollectionFromXML(itemRule, effectiveElement)(context, rule, {
        [effectiveElement]: [xml],
      })
    }
    return importMetadataItemCollectionFromXML(itemRule, effectiveElement)(context, rule, xml)
  }
  const fromXML = params.fromXML ?? fromXMLDefault
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
    })
  }

  const toXML = params.toXML ?? toXMLDefault
  registerTypeRule(propertyType, "exportToXML", toXML)

  const toJSONSchemaDefault: ExportToJSONSchemaFn = ({ context }) => {
    const itemSchema = exportMetadataItemToJSONSchema({ context, rule: itemRule })
    return Type.Record(Type.String(), itemSchema)
  }

  const toJSONSchema = params.toJSONSchema ?? toJSONSchemaDefault
  registerTypeRule(propertyType, "exportToJSONSchema", toJSONSchema)

  if (params.graphChild) {
    registerTypeRule(propertyType, "graphChild", {
      idFrom: params.graphChild.idFrom as string,
      edgeName: params.graphChild.edgeName,
      edgeKind: params.graphChild.edgeKind,
      itemRule: itemRule as unknown as MetadataItemRule,
    })
  }
}
