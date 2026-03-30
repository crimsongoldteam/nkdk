import { MetadataItemRule } from "~/metadata/orchestration"

export const GroupItemFieldRules = {
  itemType: "GroupItemField",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
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
    },
    periodAdditionType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionPeriodAdditionType",
      xml: "dcsset:periodAdditionType",
      yaml: "ТипДополнения",
    },
    periodAdditionBegin: {
      type: "MetadataValue",
      valueType: "dateTime",
      withType: true,
      xml: "dcsset:periodAdditionBegin",
      yaml: "НачалоПериода",
    },
    periodAdditionEnd: {
      type: "MetadataValue",
      valueType: "dateTime",
      withType: true,
      xml: "dcsset:periodAdditionEnd",
      yaml: "КонецПериода",
    },
  },
} as const satisfies MetadataItemRule

export const GroupItemAutoRules = {
  itemType: "GroupItemAuto",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
    },
  },
} as const satisfies MetadataItemRule
