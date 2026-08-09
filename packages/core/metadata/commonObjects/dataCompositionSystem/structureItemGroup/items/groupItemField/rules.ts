import { dateTimeRule } from "../../../../dateTime/types"
import { booleanRule } from "../../../../boolean/types"
import { stringRule } from "../../../../string/types"
import { systemEnumerationRule } from "../../../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../../../ruleRuntime"
export const GroupItemFieldRules = {
  itemType: "GroupItemField",
  xsiType: "dcsset:GroupItemField",
  xmlOrder: [
    "use",
    "field",
    "groupType",
    "periodAdditionType",
    "periodAdditionBegin",
    "periodAdditionEnd",
  ],
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
    }),
    field: stringRule({
      xml: "dcsset:field",
      yaml: "Поле",
    }),
    groupType: systemEnumerationRule({
      typeSE: "DataCompositionGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппировки",
      defaultValueXML: "Items",
      implicitValueYAML: "Items",
    }),
    periodAdditionType: systemEnumerationRule({
      typeSE: "DataCompositionPeriodAdditionType",
      xml: "dcsset:periodAdditionType",
      yaml: "ТипДополнения",
      defaultValueXML: "None",
      implicitValueYAML: "None",
    }),
    periodAdditionBegin: dateTimeRule({
      typedXML: true,
      xml: "dcsset:periodAdditionBegin",
      yaml: "НачалоПериода",
      defaultValueXML: "0001-01-01T00:00:00",
    }),
    periodAdditionEnd: dateTimeRule({
      typedXML: true,
      xml: "dcsset:periodAdditionEnd",
      yaml: "КонецПериода",
      defaultValueXML: "0001-01-01T00:00:00",
    }),
  },
} as const satisfies MetadataItemRule
