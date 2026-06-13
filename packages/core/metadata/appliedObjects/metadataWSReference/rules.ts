import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataWSReferenceRules = {
  itemType: "MetadataWSReference",
  itemTypePrefix: "WSСсылка",
  xmlDir: "WSReferences",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "WSReference",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      items: [{ name: "WSReferenceManager", category: "Manager" }],
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
    locationURL: {
      yaml: "URL",
      xml: "LocationURL",
      type: "string",
      xmlParents: properties,
    },
    wsDefinition: {
      type: "Template",
      nkdkPath: "WSDefinition.xml",
      xmlPath: "Ext/WSDefinition.xml",
    },
    wsDefinitionSchemas: {
      type: "WSDefinitionSchemas",
      syncExternalOnly: true,
    },
  },
} as const satisfies MetadataItemRule
