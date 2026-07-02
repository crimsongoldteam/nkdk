import {
  clientApplicationInterfaceItemsRule,
  clientApplicationInterfacePanelDefsRule,
} from "~/metadata/commonObjects/clientApplicationInterface/builders"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
    panelDefs: clientApplicationInterfacePanelDefsRule({
      xml: "panelDef",
      toYAML: false,
      fromYAML: false,
    }),
    top: clientApplicationInterfaceItemsRule({
      yaml: "Верх",
      xml: "top",
    }),
    left: clientApplicationInterfaceItemsRule({
      yaml: "Лево",
      xml: "left",
    }),
    right: clientApplicationInterfaceItemsRule({
      yaml: "Право",
      xml: "right",
    }),
    bottom: clientApplicationInterfaceItemsRule({
      yaml: "Низ",
      xml: "bottom",
    }),
  },
} as const satisfies MetadataItemRule
