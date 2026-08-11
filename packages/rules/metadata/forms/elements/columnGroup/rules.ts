import { colorRule } from "../../../commonObjects/color/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { pictureRule } from "../../../commonObjects/picture/types"
import { tableChildItemsRule } from "../../commonObjects/childItems/rules"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { i8nTextRule } from "../../../commonObjects/i8nText/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { defineElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
import { formGroupCommonProperties } from "../formGroup/rules"
export type { ElementRule, PropertyRule }
export const ColumnGroupRules = {
  itemType: "ColumnGroup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.ColumnGroup",
  xmlOrder: [
    "visible",
    "userVisible",
    "enabled",
    "readOnly",
    "enableContentChange",
    "title",
    "titleTextColor",
    "titleFont",
    "toolTip",
    "toolTipRepresentation",
    "verticalAlignInGroup",
    "width",
    "height",
    "horizontalStretch",
    "horizontalAlignInGroup",
    "verticalStretch",
    "group",
    "showTitle",
    "titleBackColor",
    "showInHeader",
    "headerDataPath",
    "headerHorizontalAlign",
    "headerPicture",
    "headerFormat",
    "fixingInTable",
    "extendedTooltip",
    "childItems",
    "name",
    "displayImportance",
  ],
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
      implicitValueYAML: "Vertical",
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
export const metadataRuleLayer000 = defineElementRule("ColumnGroup", ColumnGroupRules)
