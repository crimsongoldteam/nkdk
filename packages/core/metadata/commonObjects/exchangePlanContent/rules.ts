import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const ExchangePlanContentItemRules = {
  itemType: "ExchangePlanContentItem",
  properties: {
    metadata: {
      yaml: "Метаданные",
      xml: "Metadata",
      type: "MetadataItemLink",
      required: true,
    },
    autoRecord: {
      yaml: "Авторегистрация",
      xml: "AutoRecord",
      type: "SystemEnumeration",
      typeSE: "AutoChangeRecord",
      required: true,
      implicitValueYAML: "Allow",
    },
  },
} as const satisfies MetadataItemRule

export const ExchangePlanContentRules = {
  itemType: "ExchangePlanContent",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
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
    },
    items: {
      type: "ExchangePlanContentItems",
      xml: "Item",
      defaultValueXMLEmpty: [],
      defaultValue: [],
      yamlInline: true,
      yaml: "items",
    },
    // extensionProperty: {
    //   yaml: "СвойствоРасширения",
    //   xml: "ExtensionProperty",
    //   type: "string",
    // },
  },
} as const satisfies MetadataItemRule
