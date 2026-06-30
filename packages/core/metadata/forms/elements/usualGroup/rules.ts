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
    backColor: {
      yaml: "ЦветФона",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    behavior: {
      yaml: "Поведение",
      type: "SystemEnumeration",
      typeSE: "UsualGroupBehavior",
      implicitValueYAML: "Auto",
    },
    childItems: {
      yaml: "Элементы",
      type: "GroupChildItems",
      defaultValue: [],
    },
    childItemsHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      xml: "HorizontalAlign",
      implicitValueYAML: "Auto",
    },
    childItemsVerticalAlign: {
      yaml: "ВертикальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      xml: "VerticalAlign",
      implicitValueYAML: "Auto",
    },
    collapsed: { yaml: "Свернута", type: "boolean", implicitValueYAML: false },
    collapsedRepresentationTitle: {
      yaml: "ЗаголовокСвернутогоОтображения",
      type: "I8nText",
    },
    controlRepresentation: {
      yaml: "ОтображениеУправления",
      type: "SystemEnumeration",
      typeSE: "UsualGroupControlRepresentation",
      implicitValueYAML: "TitleHyperlink",
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      type: "SystemEnumeration",
      typeSE: "CurrentRowUse",
      implicitValueYAML: "Auto",
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    },
    format: { yaml: "Формат", type: "I8nText" },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
      defaultValue: "HorizontalIfPossible",
      // defaultValueXML: "HorizontalIfPossible",
      implicitValueYAML: "ГоризонтальнаяЕслиВозможно",
    },
    hiddenRepresentationTitleBackColor: {
      yaml: "ЦветФонаЗаголовкаСкрытогоОтображения",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
      xml: "HiddenStateTitleBackColor",
    },
    horizontalSpacing: {
      yaml: "ГоризонтальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
      implicitValueYAML: "Auto",
    },
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      type: "SystemEnumeration",
      typeSE: "ItemsAndTitlesAlignVariant",
      implicitValueYAML: "Auto",
    },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "UsualGroupRepresentation",
      implicitValueYAML: "WeakSeparation",
    },
    slaveItemsWidth: {
      yaml: "ШиринаПодчиненныхЭлементов",
      xml: "ChildItemsWidth",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsWidth",
      noImplicitValueYAML: true,
    },
    showLeftMargin: { yaml: "ОтображатьОтступСлева", type: "boolean", implicitValueYAML: true },
    showTitle: {
      yaml: "ОтображатьЗаголовок",
      type: "boolean",
      defaultValue: true,
      implicitValueYAML: "Истина",
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
      implicitValueYAML: "Auto",
    },
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "DataPath", defaultType: "string" },
    united: { yaml: "Объединенная", type: "boolean", implicitValueYAML: true },
    verticalSpacing: {
      yaml: "ВертикальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
      implicitValueYAML: "Auto",
    },
    ...formGroupCommonProperties,
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
      implicitValueYAML: "UsualGroup",
    },
  },
} as const satisfies ElementRule

registerElementRule("UsualGroup", UsualGroupRules)
