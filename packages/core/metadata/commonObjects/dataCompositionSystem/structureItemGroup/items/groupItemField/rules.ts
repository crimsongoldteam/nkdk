import { MetadataItemRule } from "~/metadata/orchestration"

export const GroupItemFieldRules = {
  itemType: "GroupItemField",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      defaultValueYAML: true,
      order: 1,
    },
    field: {
      type: "string",
      xml: "dcsset:field",
      yaml: "Поле",
      order: 2,
    },
    groupType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппировки",
      defaultValueXML: "Items",
      defaultValueYAML: "Items",
      order: 3,
    },
    periodAdditionType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionPeriodAdditionType",
      xml: "dcsset:periodAdditionType",
      yaml: "ТипДополнения",
      defaultValueXML: "None",
      defaultValueYAML: "None",
      order: 4,
    },
    periodAdditionBegin: {
      type: "dateTime",
      typedXML: true,
      xml: "dcsset:periodAdditionBegin",
      yaml: "НачалоПериода",
      defaultValueXML: "0001-01-01T00:00:00",
      order: 5,
    },
    periodAdditionEnd: {
      type: "dateTime",
      typedXML: true,
      xml: "dcsset:periodAdditionEnd",
      yaml: "КонецПериода",
      defaultValueXML: "0001-01-01T00:00:00",
      order: 6,
    },
  },
} as const satisfies MetadataItemRule
