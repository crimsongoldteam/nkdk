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
    xmlRoot: {
      type: "XMLRoot",
      container: "CommandInterface",
      rootAttributes: commandInterfaceRootAttributes,
      forReferenceOnly: true,
      isFileRoot: true,
      toYAML: false,
      fromYAML: false,
    },
    commandsVisibility: {
      yaml: "ВидимостьКоманд",
      xml: "CommandsVisibility",
      type: "CommandInterfaceVisibilityMap",
    },
    commandsPlacement: {
      yaml: "РазмещениеКоманд",
      xml: "CommandsPlacement",
      type: "CommandInterfacePlacementMap",
    },
    commandsOrder: {
      yaml: "ПорядокКоманд",
      xml: "CommandsOrder",
      type: "CommandInterfaceOrder",
    },
    subsystemsVisibility: {
      yaml: "ВидимостьПодсистем",
      xml: "SubsystemsVisibility",
      type: "CommandInterfaceSubsystemsVisibilityMap",
    },
    subsystemsOrder: {
      yaml: "ПорядокПодсистем",
      xml: "SubsystemsOrder",
      type: "MetadataItemLinks",
      metadataItemLinksXMLItem: "Subsystem",
    },
    groupsOrder: {
      yaml: "ПорядокГрупп",
      xml: "GroupsOrder",
      type: "CommandInterfaceCommandGroups",
      metadataItemLinksXMLItem: "Group",
    },
  },
} as const satisfies MetadataItemRule
