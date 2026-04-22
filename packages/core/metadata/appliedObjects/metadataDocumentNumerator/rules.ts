import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const numeratorProperties = ["DocumentNumerator", "Properties"]

export const MetadataDocumentNumeratorRules = {
  itemType: "MetadataDocumentNumerator",
  itemTypePrefix: "Нумератор",
  properties: {
    uuid: {
      type: "string",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: ["DocumentNumerator"],
    },
    name: {
      type: "string",
      xmlParents: numeratorProperties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: numeratorProperties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: numeratorProperties,
      defaultValueXMLRaw: "",
    },
    numberType: {
      yaml: "ТипНомера",
      type: "SystemEnumeration",
      typeSE: "DocumentNumberType",
      defaultValueXML: "String",
      xmlParents: numeratorProperties,
      defaultValueYAML: "String",
    },
    numberLength: {
      yaml: "ДлинаНомера",
      type: "number",
      defaultValueXML: 9,
      xmlParents: numeratorProperties,
      defaultValueYAML: 9,
    },
    numberAllowedLength: {
      yaml: "ДопустимаяДлинаНомера",
      type: "SystemEnumeration",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      xmlParents: numeratorProperties,
      defaultValueYAML: "Variable",
    },
    numberPeriodicity: {
      yaml: "ПериодичностьНомера",
      type: "SystemEnumeration",
      typeSE: "DocumentNumberPeriodicity",
      defaultValueXML: "Nonperiodical",
      xmlParents: numeratorProperties,
      defaultValueYAML: "Nonperiodical",
    },
    checkUnique: {
      yaml: "КонтрольУникальности",
      type: "boolean",
      defaultValueXML: true,
      xmlParents: numeratorProperties,
      defaultValueYAML: true,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      defaultValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: numeratorProperties,
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
