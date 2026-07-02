import { exchangePlanContentItemsRule } from "~/metadata/commonObjects/exchangePlanContent/builders"
import { metadataItemLinkRule } from "~/metadata/commonObjects/metadataPath/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const ExchangePlanContentItemRules = {
  itemType: "ExchangePlanContentItem",
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
      required: true,
      implicitValueYAML: "Allow",
    }),
  },
} as const satisfies MetadataItemRule
export const ExchangePlanContentRules = {
  itemType: "ExchangePlanContent",
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
