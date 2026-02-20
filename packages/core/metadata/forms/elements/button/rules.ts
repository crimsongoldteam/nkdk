import { registerElementRule } from "~/metadata/metadataFactory/elements/factory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { Button } from "./types"
export type { ElementRule, PropertyRule }

export const ButtonRules: ElementRule<Button> = {
  enterpriseField: "FormButton",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    check: { yaml: "Пометка", type: "boolean" },
    commandName: { yaml: "ИмяКоманды", type: "string" },
    commandUniqueness: { yaml: "УникальностьКоманды", type: "boolean" },
    defaultButton: { yaml: "КнопкаПоУмолчанию", type: "boolean" },
    defaultItem: { yaml: "АктивизироватьПоУмолчанию", type: "boolean" },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    enabled: { yaml: "Доступность", type: "boolean" },
    extendedTooltip: {
      yaml: "РасширеннаяПодсказка",
      type: "ExtendedTooltip",
      toEnt: false,
    },
    font: { yaml: "Шрифт", type: "Font" },
    height: { yaml: "Высота", type: "number" },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    locationInCommandBar: {
      yaml: "ПоложениеВКоманднойПанели",
      type: "SystemEnumeration",
      typeSE: "ButtonLocationInCommandBar",
    },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    onlyInAllActions: { yaml: "ТолькоВоВсехДействиях", type: "boolean" },
    onMainServerUnavalableBehavior: {
      yaml: "ПоведениеПриНедоступностиОсновногоСервера",
      type: "SystemEnumeration",
      typeSE: "OnMainServerUnavalableBehavior",
    },
    picture: { yaml: "Картинка", type: "Picture" },
    pictureLocation: {
      yaml: "ПоложениеКартинки",
      type: "SystemEnumeration",
      typeSE: "FormButtonPictureLocation",
    },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "ButtonRepresentation",
    },
    representationInContextMenu: {
      yaml: "ОтображениеВКонтекстномМеню",
      type: "SystemEnumeration",
      typeSE: "ButtonLocationInContextMenu",
      toEnt: false,
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
    skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormButtonType",
    },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
      toEnt: false,
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
  },
}

registerElementRule("Button", ButtonRules)
