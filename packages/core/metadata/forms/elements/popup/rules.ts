import { registerElementRule } from "~/metadata/metadataFactory/elements/ruleFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { Popup } from "./types"
export type { ElementRule, PropertyRule }

export const PopupRules = {
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroup.Popup",
  properties: {
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    commandSource: { yaml: "ИсточникКоманд", type: "string" },
    childItems: {
      yaml: "ПодчиненныеЭлементы",
      type: "ChildItems",
      defaultValue: [],
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    enableContentChange: { yaml: "РазрешитьИзменениеСостава", type: "boolean" },
    enabled: { yaml: "Доступность", type: "boolean" },
    extendedTooltip: { type: "ExtendedTooltip", toEnterprise: false },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    picture: { yaml: "Картинка", type: "Picture" },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean" },
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
} as const satisfies ElementRule<Popup, "extendedTooltip">

registerElementRule("Popup", PopupRules as ElementRule<Popup, "extendedTooltip">)
