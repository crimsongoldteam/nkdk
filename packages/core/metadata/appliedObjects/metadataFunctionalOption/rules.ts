import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataFunctionalOptionRules = {
  itemType: "MetadataFunctionalOption",
  itemTypePrefix: "ФункциональнаяОпция",
  xmlDir: "FunctionalOptions",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "FunctionalOption",
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
    location: {
      yaml: "Размещение",
      xml: "Location",
      type: "string",
      xmlParents: properties,
    },
    privilegedGetMode: {
      yaml: "ПривилегированныйРежимПриПолучении",
      xml: "PrivilegedGetMode",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: true,
      defaultValueYAML: true,
    },
    content: {
      yaml: "СоставФункциональнойОпции",
      xml: "Content",
      type: "MetadataItemLinks",
      xmlParents: properties,
      metadataItemLinksXMLItem: "xr:Object",
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      defaultValueYAML: "Native",
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
