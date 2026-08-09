import { exchangePlanContentItemsRule } from "./builders"
import { metadataItemLinkRule } from "../metadataPath/types"
import { xmlRootRule } from "../xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import type { MetadataItemRule } from "../../ruleRuntime/property/types"
export const ExchangePlanContentItemRules = {
  itemType: "ExchangePlanContentItem",
  xmlOrder: [
    "metadata",
    "autoRecord",
  ],
  properties: {
    metadata: metadataItemLinkRule({
      yaml: "Метаданные",
      xml: "Metadata",
      required: true,
    }),
    autoRecord: systemEnumerationRule({
      yaml: "Авторегистрация",
      xml: "AutoRecord",
      typeSE: "AutoChangeRecord",
      defaultValueXML: "Allow",
      implicitValueYAML: "Allow",
      preserveExplicitDefaultXML: true,
    }),
  },
} as const satisfies MetadataItemRule
export const ExchangePlanContentRules = {
  itemType: "ExchangePlanContent",
  xmlOrder: [
    "items",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "ExchangePlanContent",
      rootAttributes: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
        "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        _version: "2.20",
      },
      forReferenceOnly: true,
      isFileRoot: true,
    }),
    items: exchangePlanContentItemsRule({
      xml: "Item",
      defaultValueXMLEmpty: [],
      defaultValue: [],
      yamlInline: true,
      yaml: "items",
    }),
  },
} as const satisfies MetadataItemRule
