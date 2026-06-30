import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const clientApplicationInterfaceRootAttributes = {
  _xmlns: "http://v8.1c.ru/8.2/managed-application/core",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  "_xsi:type": "InterfaceLayouter",
}
export const ClientApplicationInterfaceRules = {
  itemType: "ClientApplicationInterface",
  properties: {
    xmlRoot: xmlRootRule({
      container: "ClientApplicationInterface",
      rootAttributes: clientApplicationInterfaceRootAttributes,
      forReferenceOnly: true,
      isFileRoot: true,
      toYAML: false,
      fromYAML: false,
    }),
    panelDefs: {
      xml: "panelDef",
      type: "ClientApplicationInterfacePanelDefs",
      toYAML: false,
      fromYAML: false,
    },
    top: {
      yaml: "Верх",
      xml: "top",
      type: "ClientApplicationInterfaceItems",
    },
    left: {
      yaml: "Лево",
      xml: "left",
      type: "ClientApplicationInterfaceItems",
    },
    right: {
      yaml: "Право",
      xml: "right",
      type: "ClientApplicationInterfaceItems",
    },
    bottom: {
      yaml: "Низ",
      xml: "bottom",
      type: "ClientApplicationInterfaceItems",
    },
  },
} as const satisfies MetadataItemRule
