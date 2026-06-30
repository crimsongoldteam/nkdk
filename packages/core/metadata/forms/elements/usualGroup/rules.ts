import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formGroupCommonProperties } from "../formGroup/rules"
export type { ElementRule, PropertyRule }
export const UsualGroupRules = {
  itemType: "UsualGroup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.UsualGroup",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    backColor: {
      yaml: "ЦветФона",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    behavior: systemEnumerationRule({
      yaml: "Поведение",
      typeSE: "UsualGroupBehavior",
      implicitValueYAML: "Auto",
    }),
    childItems: {
      yaml: "Элементы",
      type: "GroupChildItems",
      defaultValue: [],
    },
    childItemsHorizontalAlign: systemEnumerationRule({
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      typeSE: "ItemHorizontalLocation",
      xml: "HorizontalAlign",
      implicitValueYAML: "Auto",
    }),
    childItemsVerticalAlign: systemEnumerationRule({
      yaml: "ВертикальноеПоложениеПодчиненных",
      typeSE: "ItemVerticalAlign",
      xml: "VerticalAlign",
      implicitValueYAML: "Auto",
    }),
    collapsed: booleanRule({ yaml: "Свернута", implicitValueYAML: false }),
    collapsedRepresentationTitle: i8nTextRule({
      yaml: "ЗаголовокСвернутогоОтображения",
    }),
    controlRepresentation: systemEnumerationRule({
      yaml: "ОтображениеУправления",
      typeSE: "UsualGroupControlRepresentation",
      implicitValueYAML: "TitleHyperlink",
    }),
    currentRowUse: systemEnumerationRule({
      yaml: "ИспользованиеТекущейСтроки",
      typeSE: "CurrentRowUse",
      implicitValueYAML: "Auto",
    }),
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    }),
    format: i8nTextRule({ yaml: "Формат" }),
    group: systemEnumerationRule({
      yaml: "Группировка",
      typeSE: "ChildFormItemsGroup",
      defaultValue: "HorizontalIfPossible",
      // defaultValueXML: "HorizontalIfPossible",
      implicitValueYAML: "ГоризонтальнаяЕслиВозможно",
    }),
    hiddenRepresentationTitleBackColor: {
      yaml: "ЦветФонаЗаголовкаСкрытогоОтображения",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
      xml: "HiddenStateTitleBackColor",
    },
    horizontalSpacing: systemEnumerationRule({
      yaml: "ГоризонтальныйИнтервал",
      typeSE: "FormItemSpacing",
      implicitValueYAML: "Auto",
    }),
    itemsAndTitlesAlign: systemEnumerationRule({
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      typeSE: "ItemsAndTitlesAlignVariant",
      implicitValueYAML: "Auto",
    }),
    representation: systemEnumerationRule({
      yaml: "Отображение",
      typeSE: "UsualGroupRepresentation",
      implicitValueYAML: "WeakSeparation",
    }),
    slaveItemsWidth: systemEnumerationRule({
      yaml: "ШиринаПодчиненныхЭлементов",
      xml: "ChildItemsWidth",
      typeSE: "ChildFormItemsWidth",
      noImplicitValueYAML: true,
    }),
    showLeftMargin: booleanRule({ yaml: "ОтображатьОтступСлева", implicitValueYAML: true }),
    showTitle: booleanRule({
      yaml: "ОтображатьЗаголовок",
      defaultValue: true,
      implicitValueYAML: "Истина",
    }),
    table: {
      yaml: "Таблица",
      xml: "AssociatedTableElementId",
      type: "AssociatedTable",
      toEnterprise: false,
    },
    throughAlign: systemEnumerationRule({
      yaml: "СквозноеВыравнивание",
      typeSE: "ThroughAlign",
      implicitValueYAML: "Auto",
    }),
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "DataPath", defaultType: "string" },
    united: booleanRule({ yaml: "Объединенная", implicitValueYAML: true }),
    verticalSpacing: systemEnumerationRule({
      yaml: "ВертикальныйИнтервал",
      typeSE: "FormItemSpacing",
      implicitValueYAML: "Auto",
    }),
    ...formGroupCommonProperties,
    type: systemEnumerationRule({
      yaml: "Вид",
      typeSE: "FormGroupType",
      runtimeOnly: true,
      implicitValueYAML: "UsualGroup",
    }),
  },
} as const satisfies ElementRule
registerElementRule("UsualGroup", UsualGroupRules)
