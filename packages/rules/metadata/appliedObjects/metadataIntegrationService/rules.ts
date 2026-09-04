import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { metadataIntegrationServiceChannelsRule } from "./builders"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
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
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
      items: [{ name: "IntegrationServiceManager", category: "Manager" }],
    }),
    uuid: metadataIdentityProperties.uuid,
    name: stringRule({
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    synonym: metadataIdentityProperties.synonym,
    comment: metadataIdentityProperties.comment,
    externalIntegrationServiceAddress: stringRule({
      yaml: "АдресВнешнегоСервисаИнтеграции",
      xml: "ExternalIntegrationServiceAddress",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
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
