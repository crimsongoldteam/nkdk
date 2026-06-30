import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"

export const MetadataDocumentNumeratorRules = {
  itemType: "MetadataDocumentNumerator",
  metadataTargetOwner: { kind: "self", root: "DocumentNumerator" },
  itemTypePrefix: "Нумератор",
  xmlDir: "DocumentNumerators",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "DocumentNumerator",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: ["Properties"],
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    numberType: {
      yaml: "ТипНомера",
      type: "SystemEnumeration",
      typeSE: "DocumentNumberType",
      defaultValueXML: "String",
      xmlParents: ["Properties"],
      implicitValueYAML: "String",
    },
    numberLength: {
      yaml: "ДлинаНомера",
      type: "number",
      defaultValueXML: 9,
      xmlParents: ["Properties"],
      implicitValueYAML: 9,
    },
    numberAllowedLength: {
      yaml: "ДопустимаяДлинаНомера",
      type: "SystemEnumeration",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      xmlParents: ["Properties"],
      implicitValueYAML: "Variable",
    },
    numberPeriodicity: {
      yaml: "ПериодичностьНомера",
      type: "SystemEnumeration",
      typeSE: "DocumentNumberPeriodicity",
      defaultValueXML: "Nonperiodical",
      xmlParents: ["Properties"],
      implicitValueYAML: "Nonperiodical",
    },
    checkUnique: {
      yaml: "КонтрольУникальности",
      type: "boolean",
      defaultValueXML: true,
      xmlParents: ["Properties"],
      implicitValueYAML: true,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: ["Properties"],
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
