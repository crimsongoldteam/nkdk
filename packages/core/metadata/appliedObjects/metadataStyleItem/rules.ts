import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataStyleItemRules = {
  itemType: "MetadataStyleItem",
  itemTypePrefix: "ЭлементСтиля",
  xmlDir: "StyleItems",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "StyleItem",
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
      xmlParents: properties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    type: {
      yaml: "Тип",
      type: "SystemEnumeration",
      typeSE: "StyleElementType",
      xmlParents: properties,
    },
    value: {
      yaml: "Значение",
      type: "StyleItemValue",
      xml: "Value",
      xmlParents: properties,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
