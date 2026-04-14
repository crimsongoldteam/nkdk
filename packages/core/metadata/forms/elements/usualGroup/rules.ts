import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }

export const UsualGroupRules = {
  itemType: "UsualGroup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.UsualGroup",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    backColor: { yaml: "ЦветФона", type: "Color" },
    behavior: {
      yaml: "Поведение",
      type: "SystemEnumeration",
      typeSE: "UsualGroupBehavior",
    },
    childItems: {
      type: "GroupChildItems",
      defaultValue: [],
      fromPartialYAML: true,
      toPartialYAML: false,
      required: true,
    },
    childItemsHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      xml: "HorizontalAlign",
    },
    childItemsVerticalAlign: {
      yaml: "ВертикальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      xml: "VerticalAlign",
    },
    collapsed: { yaml: "Свернута", type: "boolean" },
    collapsedRepresentationTitle: {
      yaml: "ЗаголовокСвернутогоОтображения",
      type: "I8nText",
    },
    controlRepresentation: {
      yaml: "ОтображениеУправления",
      type: "SystemEnumeration",
      typeSE: "UsualGroupControlRepresentation",
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      type: "SystemEnumeration",
      typeSE: "CurrentRowUse",
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    format: { yaml: "Формат", type: "I8nText" },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
      toPartialYAML: false,
      defaultValue: "HorizontalIfPossible",
      // defaultValueXML: "HorizontalIfPossible",
      required: true,
    },
    hiddenRepresentationTitleBackColor: {
      yaml: "ЦветФонаЗаголовкаСкрытогоОтображения",
      type: "Color",
      xml: "HiddenStateTitleBackColor",
    },
    horizontalSpacing: {
      yaml: "ГоризонтальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
    },
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      type: "SystemEnumeration",
      typeSE: "ItemsAndTitlesAlignVariant",
    },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "UsualGroupRepresentation",
    },
    showLeftMargin: { yaml: "ОтображатьОтступСлева", type: "boolean" },
    showTitle: {
      yaml: "ОтображатьЗаголовок",
      toPartialYAML: false,
      type: "boolean",
      defaultValue: true,
      // defaultValueXML: true,
    },
    table: {
      yaml: "Таблица",
      xml: "AssociatedTableElementId",
      type: "AssociatedTable",
      toEnterprise: false,
    },
    throughAlign: {
      yaml: "СквозноеВыравнивание",
      type: "SystemEnumeration",
      typeSE: "ThroughAlign",
    },
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "DataPath", defaultType: "string" },
    united: { yaml: "Объединенная", type: "boolean" },
    verticalSpacing: {
      yaml: "ВертикальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
    },
    ...formGroupCommonProperties,
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    },
  },
} as const satisfies ElementRule

registerElementRule("UsualGroup", UsualGroupRules)
