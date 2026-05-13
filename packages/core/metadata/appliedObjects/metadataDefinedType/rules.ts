import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataDefinedTypeRules = {
  itemType: "MetadataDefinedType",
  itemTypePrefix: "ОпределяемыйТип",
  xmlDir: "DefinedTypes",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "DefinedType",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [{ name: "DefinedType", category: "DefinedType" }],
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
      type: "TypeDescription",
      xmlParents: properties,
      useAsShortValueYAML: true,
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      defaultValueYAML: "Native",
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
