import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }

export const commonButtonProperties = {
  type: {
    yaml: "Вид",
    type: "SystemEnumeration",
    typeSE: "FormButtonType",
    implicitValueYAML: "UsualButton",
  },
  visible: { yaml: "Видимость", type: "boolean" },
  userVisible: {
    yaml: "Использование",
    type: "UserVisible",
    toEnterprise: false,
  },
  titleHeight: { yaml: "ВысотаЗаголовка", type: "number" },
  representation: {
    yaml: "Отображение",
    type: "SystemEnumeration",
    typeSE: "ButtonRepresentation",
    implicitValueYAML: "Auto",
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
    implicitValueYAML: "Auto",
  },
  verticalAlignInGroup: {
    yaml: "ВертикальноеПоложениеВГруппе",
    xml: "GroupVerticalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemVerticalAlign",
    implicitValueYAML: "Auto",
  },
  check: { yaml: "Пометка", type: "boolean" },
  commandName: { yaml: "ИмяКоманды", type: "CommandName" },
  parameter: {
    yaml: "Параметр",
    xml: "Parameter",
    type: "ButtonParameter",
    toEnterprise: false,
  },
  dataPath: { yaml: "Данные", xml: "DataPath", type: "DataPath", defaultType: "string" },
  textColor: { yaml: "ЦветТекста", type: "Color", metadataTarget: { kind: "styleItem", styleItemTypes: ["Color"] } },
  backColor: { yaml: "ЦветФона", type: "Color", metadataTarget: { kind: "styleItem", styleItemTypes: ["Color"] } },
  borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "styleItem", styleItemTypes: ["Color"] } },
  font: { yaml: "Шрифт", type: "Font", metadataTarget: { kind: "styleItem", styleItemTypes: ["Font"] } },
  picture: { yaml: "Картинка", type: "Picture", metadataTarget: { kind: "commonPicture" } },
  title: {
    yaml: "Заголовок",
    type: "I8nText",
  },
  toolTipRepresentation: {
    yaml: "ОтображениеПодсказки",
    type: "SystemEnumeration",
    typeSE: "ToolTipRepresentation",
    implicitValueYAML: "Auto",
  },
  representationInContextMenu: {
    yaml: "ОтображениеВКонтекстномМеню",
    type: "SystemEnumeration",
    typeSE: "ButtonLocationInContextMenu",
    toEnterprise: false,
    implicitValueYAML: "Auto",
  },
  shape: {
    yaml: "Фигура",
    type: "SystemEnumeration",
    typeSE: "ButtonShape",
    implicitValueYAML: "Auto",
  },
  shapeRepresentation: {
    yaml: "ОтображениеФигуры",
    type: "SystemEnumeration",
    typeSE: "ButtonShapeRepresentation",
    implicitValueYAML: "Auto",
  },
  pictureLocation: {
    yaml: "ПоложениеКартинки",
    type: "SystemEnumeration",
    typeSE: "FormButtonPictureLocation",
    implicitValueYAML: "Auto",
  },
  locationInCommandBar: {
    yaml: "ПоложениеВКоманднойПанели",
    type: "SystemEnumeration",
    typeSE: "ButtonLocationInCommandBar",
    implicitValueYAML: "Auto",
  },
  commandUniqueness: { yaml: "УникальностьКоманды", type: "boolean" },
  onMainServerUnavalableBehavior: {
    yaml: "ПоведениеПриНедоступностиОсновногоСервера",
    type: "SystemEnumeration",
    typeSE: "OnMainServerUnavalableBehavior",
    implicitValueYAML: "Auto",
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
    implicitValueYAML: "Auto",
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
