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
      defaultValueYAML: "Auto",
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
      defaultValueYAML: "Auto",
    },
    childItemsVerticalAlign: {
      yaml: "ВертикальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      xml: "VerticalAlign",
      defaultValueYAML: "Auto",
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
      defaultValueYAML: "TitleHyperlink",
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      type: "SystemEnumeration",
      typeSE: "CurrentRowUse",
      defaultValueYAML: "Auto",
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      defaultValueYAML: "Auto",
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
      defaultValueYAML: "HorizontalIfPossible",
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
      defaultValueYAML: "Auto",
    },
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      type: "SystemEnumeration",
      typeSE: "ItemsAndTitlesAlignVariant",
      defaultValueYAML: "Auto",
    },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "UsualGroupRepresentation",
      defaultValueYAML: "WeakSeparation",
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
      defaultValueYAML: "Auto",
    },
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "DataPath", defaultType: "string" },
    united: { yaml: "Объединенная", type: "boolean" },
    verticalSpacing: {
      yaml: "ВертикальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
      defaultValueYAML: "Auto",
    },
    ...formGroupCommonProperties,
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
      defaultValueYAML: "UsualGroup",
    },
  },
} as const satisfies ElementRule

registerElementRule("UsualGroup", UsualGroupRules)
