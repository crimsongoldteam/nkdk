import { colorRule } from "~/metadata/commonObjects/color/types"
import { dataPathRule } from "~/metadata/commonObjects/metadataPath/types"
import { pictureRule } from "~/metadata/commonObjects/metadataTargets/types"
import { tableChildItemsRule } from "~/metadata/forms/commonObjects/childItems/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formGroupCommonProperties } from "../formGroup/rules"
export type { ElementRule, PropertyRule }
export const ColumnGroupRules = {
  itemType: "ColumnGroup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.ColumnGroup",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    childItems: tableChildItemsRule({ yaml: "Элементы", defaultValue: [] }),
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    }),
    fixingInTable: systemEnumerationRule({
      yaml: "ФиксацияВТаблице",
      typeSE: "FixingInTable",
      implicitValueYAML: "None",
    }),
    group: systemEnumerationRule({
      yaml: "Группировка",
      typeSE: "ColumnsGroup",
      defaultValue: "Vertical",
      implicitValueYAML: "Вертикальная",
    }),
    headerDataPath: dataPathRule({ yaml: "ПутьКДаннымШапки", defaultType: "string" }),
    headerFormat: i8nTextRule({ yaml: "ФорматШапки" }),
    headerHorizontalAlign: systemEnumerationRule({
      yaml: "ГоризонтальноеПоложениеВШапке",
      typeSE: "ItemHorizontalLocation",
      implicitValueYAML: "Auto",
    }),
    headerPicture: pictureRule({
      yaml: "КартинкаШапки",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
    }),
    showInHeader: booleanRule({ yaml: "ОтображатьВШапке", implicitValueYAML: false }),
    showTitle: booleanRule({ yaml: "ОтображатьЗаголовок", noImplicitValueYAML: true }),
    titleBackColor: colorRule({
      yaml: "ЦветФонаЗаголовка",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    ...formGroupCommonProperties,
    height: {
      ...formGroupCommonProperties.height,
      implicitValueYAML: 0,
    },
    horizontalStretch: {
      ...formGroupCommonProperties.horizontalStretch,
      implicitValueYAML: false,
    },
    shortcut: {
      ...formGroupCommonProperties.shortcut,
      toYAML: false,
      fromYAML: false,
    },
    visible: {
      ...formGroupCommonProperties.visible,
      implicitValueYAML: true,
    },
    width: {
      ...formGroupCommonProperties.width,
      implicitValueYAML: 0,
    },
    type: systemEnumerationRule({
      yaml: "Вид",
      typeSE: "FormGroupType",
      runtimeOnly: true,
      implicitValueYAML: "ColumnGroup",
    }),
  },
} as const satisfies ElementRule
registerElementRule("ColumnGroup", ColumnGroupRules)
