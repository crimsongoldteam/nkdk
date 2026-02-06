import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { Popup } from "./types"
export type { ElementRule, PropertyRule }

export const PopupRules: ElementRule<Popup> = {
  properties: {
    enableContentChange: { yaml: "РазрешитьИзменениеСостава", type: "boolean" },
    enabled: { yaml: "Доступность", type: "boolean" },
    height: { yaml: "Высота", type: "number" },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean" },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string" },
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
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      xml: "GroupVerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    visible: { yaml: "Видимость", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    picture: { yaml: "Картинка", type: "Picture" },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "ButtonRepresentation",
    },
    shape: {
      yaml: "Фигура",
      type: "SystemEnumeration",
      typeSE: "ButtonShape",
    },
    shapeRepresentation: {
      yaml: "ОтображениеФигуры",
      type: "SystemEnumeration",
      typeSE: "ButtonShapeRepresentation",
    },
    childItems: { yaml: "ПодчиненныеЭлементы", type: "FieldsList" },
  },
  events: {},
}

registerElementRule("Popup", PopupRules)
