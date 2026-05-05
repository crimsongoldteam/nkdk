import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
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
    enableContentChange: { yaml: "РазрешитьИзменениеСостава", type: "boolean" },
    enabled: { yaml: "Доступность", type: "boolean" },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", toEnterprise: false },
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
    height: { yaml: "Высота", type: "number" },
    hiddenRepresentationTitleBackColor: {
      yaml: "ЦветФонаЗаголовкаСкрытогоОтображения",
      type: "Color",
      xml: "HiddenStateTitleBackColor",
    },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    horizontalSpacing: {
      yaml: "ГоризонтальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      type: "SystemEnumeration",
      typeSE: "ItemsAndTitlesAlignVariant",
    },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean" },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "UsualGroupRepresentation",
    },
    shortcut: {
      yaml: "СочетаниеКлавиш",
      type: "string",
      toEnterprise: false,
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
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "DataPath", defaultType: "string" },
    titleFont: { yaml: "ШрифтЗаголовка", type: "Font" },
    titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color" },
    toolTip: { yaml: "Подсказка", type: "I8nText" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
    united: { yaml: "Объединенная", type: "boolean" },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
      toEnterprise: false,
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      xml: "GroupVerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    verticalSpacing: {
      yaml: "ВертикальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    visible: { yaml: "Видимость", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
  },
} as const satisfies ElementRule

registerElementRule("UsualGroup", UsualGroupRules)
