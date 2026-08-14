import { metadataIntegrationServiceChannelsRule } from "./builders"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { moduleRule } from "../../commonObjects/module/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataIntegrationServiceRules = {
  itemType: "MetadataIntegrationService",
  metadataTargetOwner: { kind: "self", root: "IntegrationService" },
  itemTypePrefix: "СервисИнтеграции",
  xmlDir: "IntegrationServices",
  xmlOrder: [
    "internalInfo",
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "externalIntegrationServiceAddress",
    "channels",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "IntegrationService",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      items: [{ name: "IntegrationServiceManager", category: "Manager" }],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueAdoptedXML: "",
    }),
    externalIntegrationServiceAddress: stringRule({
      yaml: "АдресВнешнегоСервисаИнтеграции",
      xml: "ExternalIntegrationServiceAddress",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
    channels: metadataIntegrationServiceChannelsRule({
      yaml: "Каналы",
      xml: "IntegrationServiceChannel",
      xmlParents: childObjects,
      defaultValue: [],
      defaultValueXMLRaw: {},
    }),
    module: moduleRule({
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Module.bsl",
      toXML: false,
      fromXML: false,
    }),
  },
} as const satisfies MetadataItemRule
