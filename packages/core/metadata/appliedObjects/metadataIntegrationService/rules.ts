import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const MetadataIntegrationServiceRules = {
  itemType: "MetadataIntegrationService",
  itemTypePrefix: "СервисИнтеграции",
  xmlDir: "IntegrationServices",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "IntegrationService",
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
      items: [{ name: "IntegrationServiceManager", category: "Manager" }],
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
      defaultValue: ({ name }: { name?: string }) => name,
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
    externalIntegrationServiceAddress: {
      yaml: "АдресВнешнегоСервисаИнтеграции",
      xml: "ExternalIntegrationServiceAddress",
      type: "string",
      xmlParents: properties,
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
    channels: {
      yaml: "Каналы",
      xml: "IntegrationServiceChannel",
      type: "MetadataIntegrationServiceChannels",
      xmlParents: childObjects,
      defaultValue: [],
      defaultValueXMLRaw: {},
    },
    module: {
      type: "Module",
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Module.bsl",
      toXML: false,
      fromXML: false,
    },
  },
  requiredXMLParents: [["ChildObjects"]],
} as const satisfies MetadataItemRule
