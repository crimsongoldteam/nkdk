import { stringRule } from "~/metadata/commonObjects/string/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }
export const commonButtonProperties = {
  type: {
    yaml: "Вид",
    type: "SystemEnumeration",
    typeSE: "FormButtonType",
    implicitValueYAML: "UsualButton",
  },
  visible: { yaml: "Видимость", type: "boolean", implicitValueYAML: true },
  userVisible: {
    yaml: "Использование",
    type: "UserVisible",
    toEnterprise: false,
  },
  titleHeight: { yaml: "ВысотаЗаголовка", type: "number", implicitValueYAML: 0 },
  representation: {
    yaml: "Отображение",
    type: "SystemEnumeration",
    typeSE: "ButtonRepresentation",
    implicitValueYAML: "Auto",
  },
  defaultButton: { yaml: "КнопкаПоУмолчанию", type: "boolean", implicitValueYAML: false },
  skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean", noImplicitValueYAML: true },
  enabled: { yaml: "Доступность", type: "boolean", implicitValueYAML: true },
  defaultItem: { yaml: "АктивизироватьПоУмолчанию", type: "boolean", implicitValueYAML: false },
  width: { yaml: "Ширина", type: "number", implicitValueYAML: 0 },
  autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
  maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
  height: { yaml: "Высота", type: "number", implicitValueYAML: 0 },
  autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
  maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
  horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: false },
  verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", implicitValueYAML: false },
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
  check: { yaml: "Пометка", type: "boolean", implicitValueYAML: false },
  commandName: { yaml: "ИмяКоманды", type: "CommandName" },
  parameter: {
    yaml: "Параметр",
    xml: "Parameter",
    type: "ButtonParameter",
    toEnterprise: false,
  },
  dataPath: { yaml: "Данные", xml: "DataPath", type: "DataPath", defaultType: "string" },
  textColor: {
    yaml: "ЦветТекста",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  backColor: {
    yaml: "ЦветФона",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  borderColor: {
    yaml: "ЦветРамки",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  font: {
    yaml: "Шрифт",
    type: "Font",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
  },
  picture: { yaml: "Картинка", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
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
  commandUniqueness: { yaml: "УникальностьКоманды", type: "boolean", implicitValueYAML: true },
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
  onlyInAllActions: { yaml: "ТолькоВоВсехДействиях", type: "boolean", noImplicitValueYAML: true },
} as const satisfies Omit<ElementRule["properties"], "name">
export const ButtonRules = {
  itemType: "Button",
  enterpriseField: "FormButton",
  enterpriseFieldType: "FormButtonType.UsualButton",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    ...commonButtonProperties,
  },
} as const satisfies ElementRule
export const CommandBarButtonRules = {
  itemType: "CommandBarButton",
  xmlTag: "Button",
  enterpriseField: "FormButton",
  enterpriseFieldType: "FormButtonType.CommandBarButton",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    ...commonButtonProperties,
  },
} as const satisfies ElementRule
registerElementRule("Button", ButtonRules)
registerElementRule("CommandBarButton", CommandBarButtonRules)
