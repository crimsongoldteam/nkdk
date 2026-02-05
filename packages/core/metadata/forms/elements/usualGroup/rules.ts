import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { UsualGroup } from "./types"
export type { ElementRule, PropertyRule }

export const UsualGroupRules: ElementRule<UsualGroup> = {
  properties: {
    backColor: { yaml: "ЦветФона", type: "Color", enterprise: true },
    behavior: {
      yaml: "Поведение",
      type: "SystemEnumeration",
      typeDetailed: "UsualGroupBehavior",
      enterprise: true,
    },
    childItemsHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeDetailed: "ItemHorizontalLocation",
      enterprise: true,
    },
    childItemsVerticalAlign: {
      yaml: "ВертикальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeDetailed: "ItemVerticalAlign",
      enterprise: true,
    },
    collapsed: { yaml: "Свернута", type: "boolean", enterprise: true },
    collapsedRepresentationTitle: {
      yaml: "ЗаголовокСвернутогоОтображения",
      type: "I8nText",
      enterprise: true,
    },
    controlRepresentation: {
      yaml: "ОтображениеУправления",
      type: "SystemEnumeration",
      typeDetailed: "UsualGroupControlRepresentation",
      enterprise: true,
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      type: "SystemEnumeration",
      typeDetailed: "CurrentRowUse",
      enterprise: true,
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeDetailed: "DisplayImportance",
      enterprise: true,
    },
    enableContentChange: { yaml: "РазрешитьИзменениеСостава", type: "boolean", enterprise: true },
    enabled: { yaml: "Доступность", type: "boolean", enterprise: true },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", enterprise: true },
    format: { yaml: "Формат", type: "I8nText", enterprise: true },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeDetailed: "ChildFormItemsGroup",
      enterprise: true,
    },
    height: { yaml: "Высота", type: "number", enterprise: true },
    hiddenRepresentationTitleBackColor: {
      yaml: "ЦветФонаЗаголовкаСкрытогоОтображения",
      type: "Color",
      enterprise: true,
    },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      type: "SystemEnumeration",
      typeDetailed: "ItemHorizontalLocation",
      enterprise: true,
    },
    horizontalSpacing: {
      yaml: "ГоризонтальныйИнтервал",
      type: "SystemEnumeration",
      typeDetailed: "FormItemSpacing",
      enterprise: true,
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", enterprise: true },
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      type: "SystemEnumeration",
      typeDetailed: "ItemsAndTitlesAlignVariant",
      enterprise: true,
    },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean", enterprise: true },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeDetailed: "UsualGroupRepresentation",
      enterprise: true,
    },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string", enterprise: true },
    showLeftMargin: { yaml: "ОтображатьОтступСлева", type: "boolean", enterprise: true },
    showTitle: { yaml: "ОтображатьЗаголовок", type: "boolean", enterprise: true },
    table: { yaml: "Таблица", type: "string", enterprise: true },
    throughAlign: {
      yaml: "СквозноеВыравнивание",
      type: "SystemEnumeration",
      typeDetailed: "ThroughAlign",
      enterprise: true,
    },
    title: { yaml: "Заголовок", type: "I8nText", enterprise: true },
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "string", enterprise: true },
    titleFont: { yaml: "ШрифтЗаголовка", type: "Font", enterprise: true },
    titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color", enterprise: true },
    toolTip: { yaml: "Подсказка", type: "I8nText", enterprise: true },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeDetailed: "ToolTipRepresentation",
      enterprise: true,
    },
    united: { yaml: "Объединенная", type: "boolean", enterprise: true },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlAlt: "ЗапретитьИспользование",
      type: "UserVisible",
      enterprise: true,
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      type: "SystemEnumeration",
      typeDetailed: "ItemVerticalAlign",
      enterprise: true,
    },
    verticalSpacing: {
      yaml: "ВертикальныйИнтервал",
      type: "SystemEnumeration",
      typeDetailed: "FormItemSpacing",
      enterprise: true,
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", enterprise: true },
    visible: { yaml: "Видимость", type: "boolean", enterprise: true },
    width: { yaml: "Ширина", type: "number", enterprise: true },
  },
  events: {
    onChange: "ПриИзменении",
  },
}

registerElementRule("UsualGroup", UsualGroupRules)
