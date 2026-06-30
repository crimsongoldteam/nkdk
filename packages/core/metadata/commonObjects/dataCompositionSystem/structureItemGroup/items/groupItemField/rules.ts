import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const GroupItemFieldRules = {
  itemType: "GroupItemField",
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
      order: 1,
    }),
    field: stringRule({
      xml: "dcsset:field",
      yaml: "Поле",
      order: 2,
    }),
    groupType: systemEnumerationRule({
      typeSE: "DataCompositionGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппировки",
      defaultValueXML: "Items",
      implicitValueYAML: "Items",
      order: 3,
    }),
    periodAdditionType: systemEnumerationRule({
      typeSE: "DataCompositionPeriodAdditionType",
      xml: "dcsset:periodAdditionType",
      yaml: "ТипДополнения",
      defaultValueXML: "None",
      implicitValueYAML: "None",
      order: 4,
    }),
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
