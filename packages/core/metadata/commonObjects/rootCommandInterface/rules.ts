import {
  commandInterfaceCommandGroupsRule,
  commandInterfaceOrderRule,
  commandInterfacePlacementMapRule,
  commandInterfaceSubsystemsOrderRule,
  commandInterfaceSubsystemsVisibilityMapRule,
  commandInterfaceVisibilityMapRule,
} from "~/metadata/commonObjects/rootCommandInterface/builders"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const commandInterfaceRootAttributes = {
  _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
  "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  _version: "2.20",
}
export const RootCommandInterfaceRules = {
  itemType: "RootCommandInterface",
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommandInterface",
      rootAttributes: commandInterfaceRootAttributes,
      forReferenceOnly: true,
      isFileRoot: true,
      toYAML: false,
      fromYAML: false,
    }),
    commandsVisibility: commandInterfaceVisibilityMapRule({
      yaml: "ВидимостьКоманд",
      xml: "CommandsVisibility",
    }),
    commandsPlacement: commandInterfacePlacementMapRule({
      yaml: "РазмещениеКоманд",
      xml: "CommandsPlacement",
    }),
    commandsOrder: commandInterfaceOrderRule({
      yaml: "ПорядокКоманд",
      xml: "CommandsOrder",
    }),
    subsystemsVisibility: commandInterfaceSubsystemsVisibilityMapRule({
      yaml: "ВидимостьПодсистем",
      xml: "SubsystemsVisibility",
    }),
    subsystemsOrder: commandInterfaceSubsystemsOrderRule({
      yaml: "ПорядокПодсистем",
      xml: "SubsystemsOrder",
      metadataTarget: { kind: "object", roots: ["Subsystem"], allowNested: true },
      metadataItemLinksXMLItem: "Subsystem",
    }),
    groupsOrder: commandInterfaceCommandGroupsRule({
      yaml: "ПорядокГрупп",
      xml: "GroupsOrder",
      metadataItemLinksXMLItem: "Group",
    }),
  },
} as const satisfies MetadataItemRule
