import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }

export const ButtonRules = {
  itemType: "Button",
  enterpriseField: "FormButton",
  enterpriseFieldType: "FormButtonType.UsualButton",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    check: { yaml: "Пометка", type: "boolean" },
    commandName: { yaml: "ИмяКоманды", type: "CommandName" },
    commandUniqueness: { yaml: "УникальностьКоманды", type: "boolean" },
    defaultButton: { yaml: "КнопкаПоУмолчанию", type: "boolean" },
    defaultItem: { yaml: "АктивизироватьПоУмолчанию", type: "boolean" },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      defaultValueYAML: "Auto",
    },
    enabled: { yaml: "Доступность", type: "boolean" },
    extendedTooltip: {
      yaml: "РасширеннаяПодсказка",
      type: "ExtendedTooltip",
      toEnterprise: false,
    },
    font: { yaml: "Шрифт", type: "Font" },
    height: { yaml: "Высота", type: "number" },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      defaultValueYAML: "Auto",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    locationInCommandBar: {
      yaml: "ПоложениеВКоманднойПанели",
      type: "SystemEnumeration",
      typeSE: "ButtonLocationInCommandBar",
      defaultValueYAML: "Auto",
    },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    onlyInAllActions: { yaml: "ТолькоВоВсехДействиях", type: "boolean" },
    onMainServerUnavalableBehavior: {
      yaml: "ПоведениеПриНедоступностиОсновногоСервера",
      type: "SystemEnumeration",
      typeSE: "OnMainServerUnavalableBehavior",
      defaultValueYAML: "Auto",
    },
    picture: { yaml: "Картинка", type: "Picture" },
    pictureLocation: {
      yaml: "ПоложениеКартинки",
      type: "SystemEnumeration",
      typeSE: "FormButtonPictureLocation",
      defaultValueYAML: "Auto",
    },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "ButtonRepresentation",
      defaultValueYAML: "Auto",
    },
    representationInContextMenu: {
      yaml: "ОтображениеВКонтекстномМеню",
      type: "SystemEnumeration",
      typeSE: "ButtonLocationInContextMenu",
      toEnterprise: false,
      defaultValueYAML: "Auto",
    },
    shape: {
      yaml: "Фигура",
      type: "SystemEnumeration",
      typeSE: "ButtonShape",
      defaultValueYAML: "Auto",
    },
    shapeRepresentation: {
      yaml: "ОтображениеФигуры",
      type: "SystemEnumeration",
      typeSE: "ButtonShapeRepresentation",
      defaultValueYAML: "Auto",
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
      defaultValueYAML: "Auto",
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormButtonType",
      defaultValueYAML: "UsualButton",
    },
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
      defaultValueYAML: "Auto",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    visible: { yaml: "Видимость", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
  },
} as const satisfies ElementRule

registerElementRule("Button", ButtonRules)
