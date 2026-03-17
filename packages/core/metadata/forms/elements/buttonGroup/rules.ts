import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }

export const ButtonGroupRules = {
  itemType: "ButtonGroup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.ButtonGroup",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    childItems: {
      yaml: "Элементы",
      type: "CommandBarChildItems",
      toPartialYAML: false,
      defaultValue: [],
      required: true,
    },
    // В XML CommandSource идёт сразу после ChildItems
    commandSource: { yaml: "ИсточникКоманд", type: "string" },
    enableContentChange: {
      yaml: "РазрешитьИзменениеСостава",
      type: "boolean",
      defaultValueYAML: true,
    },
    enabled: {
      yaml: "Доступность",
      type: "boolean",
      defaultValueYAML: true,
    },
    extendedTooltip: {
      yaml: "РасширеннаяПодсказка",
      type: "ExtendedTooltip",
      toEnterprise: false,
    },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      defaultValueYAML: "Auto",
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      xml: "GroupVerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    readOnly: {
      yaml: "ТолькоПросмотр",
      type: "boolean",
      defaultValueYAML: false,
    },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "ButtonGroupRepresentation",
    },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string", toEnterprise: false },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
    titleFont: { yaml: "ШрифтЗаголовка", type: "Font" },
    titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color" },
    toolTip: { yaml: "Подсказка", type: "I8nText" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
    },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
      toEnterprise: false,
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    visible: { yaml: "Видимость", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
  },
} as const satisfies ElementRule

registerElementRule("ButtonGroup", ButtonGroupRules)
