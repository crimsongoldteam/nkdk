import { MetadataItemRule } from "~/metadata/orchestration"

export const GroupItemFieldRules = {
  itemType: "GroupItemField",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      defaultValueYAML: true,
    },
    field: {
      type: "string",
      xml: "dcsset:field",
      yaml: "Поле",
    },
    groupType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппировки",
      defaultValueXML: "Items",
      defaultValueYAML: "Items",
    },
    periodAdditionType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionPeriodAdditionType",
      xml: "dcsset:periodAdditionType",
      yaml: "ТипДополнения",
      defaultValueXML: "None",
      defaultValueYAML: "None",
    },
    periodAdditionBegin: {
      type: "MetadataValue",
      valueType: "dateTime",
      withType: true,
      xml: "dcsset:periodAdditionBegin",
      yaml: "НачалоПериода",
      defaultValueXML: "0001-01-01T00:00:00",
    },
    periodAdditionEnd: {
      type: "MetadataValue",
      valueType: "dateTime",
      withType: true,
      xml: "dcsset:periodAdditionEnd",
      yaml: "КонецПериода",
      defaultValueXML: "0001-01-01T00:00:00",
    },
  },
} as const satisfies MetadataItemRule
