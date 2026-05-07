import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }

export const commonButtonProperties = {
  type: {
    yaml: "Вид",
    type: "SystemEnumeration",
    typeSE: "FormButtonType",
    defaultValueYAML: "UsualButton",
  },
  visible: { yaml: "Видимость", type: "boolean" },
  userVisible: {
    yaml: "РазрешитьИспользование",
    yamlDeny: "ЗапретитьИспользование",
    type: "UserVisible",
    toEnterprise: false,
  },
  titleHeight: { yaml: "ВысотаЗаголовка", type: "number" },
  representation: {
    yaml: "Отображение",
    type: "SystemEnumeration",
    typeSE: "ButtonRepresentation",
    defaultValueYAML: "Auto",
  },
  defaultButton: { yaml: "КнопкаПоУмолчанию", type: "boolean" },
  skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean" },
  enabled: { yaml: "Доступность", type: "boolean" },
  defaultItem: { yaml: "АктивизироватьПоУмолчанию", type: "boolean" },
  width: { yaml: "Ширина", type: "number" },
  autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
  maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
  height: { yaml: "Высота", type: "number" },
  autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
  maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
  horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
  verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
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
    defaultValueYAML: "Auto",
  },
  check: { yaml: "Пометка", type: "boolean" },
  commandName: { yaml: "ИмяКоманды", type: "CommandName" },
  dataPath: { yaml: "Данные", xml: "DataPath", type: "DataPath", defaultType: "string" },
  textColor: { yaml: "ЦветТекста", type: "Color" },
  backColor: { yaml: "ЦветФона", type: "Color" },
  borderColor: { yaml: "ЦветРамки", type: "Color" },
  font: { yaml: "Шрифт", type: "Font" },
  picture: { yaml: "Картинка", type: "Picture" },
  title: {
    yaml: "Заголовок",
    type: "I8nText",
    yamlPartialOthers: true,
  },
  toolTipRepresentation: {
    yaml: "ОтображениеПодсказки",
    type: "SystemEnumeration",
    typeSE: "ToolTipRepresentation",
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
  pictureLocation: {
    yaml: "ПоложениеКартинки",
    type: "SystemEnumeration",
    typeSE: "FormButtonPictureLocation",
    defaultValueYAML: "Auto",
  },
  locationInCommandBar: {
    yaml: "ПоложениеВКоманднойПанели",
    type: "SystemEnumeration",
    typeSE: "ButtonLocationInCommandBar",
    defaultValueYAML: "Auto",
  },
  commandUniqueness: { yaml: "УникальностьКоманды", type: "boolean" },
  onMainServerUnavalableBehavior: {
    yaml: "ПоведениеПриНедоступностиОсновногоСервера",
    type: "SystemEnumeration",
    typeSE: "OnMainServerUnavalableBehavior",
    defaultValueYAML: "Auto",
  },
  extendedTooltip: {
    yaml: "РасширеннаяПодсказка",
    type: "ExtendedTooltip",
    toEnterprise: false,
  },
  displayImportance: {
    yaml: "ВажностьПриОтображении",
    xml: "_DisplayImportance",
    type: "SystemEnumeration",
    typeSE: "DisplayImportance",
    defaultValueYAML: "Auto",
  },
  onlyInAllActions: { yaml: "ТолькоВоВсехДействиях", type: "boolean" },
} as const satisfies Omit<ElementRule["properties"], "name">

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
    ...commonButtonProperties,
  },
} as const satisfies ElementRule

export const CommandBarButtonRules = {
  itemType: "CommandBarButton",
  xmlTag: "Button",
  enterpriseField: "FormButton",
  enterpriseFieldType: "FormButtonType.CommandBarButton",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    ...commonButtonProperties,
  },
} as const satisfies ElementRule

registerElementRule("Button", ButtonRules)
registerElementRule("CommandBarButton", CommandBarButtonRules)
