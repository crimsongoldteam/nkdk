import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }

export const PopupRules = {
  itemType: "Popup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.Popup",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    backColor: { yaml: "ЦветФона", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    commandSource: { yaml: "ИсточникКоманд", type: "string" },
    childItems: {
      yaml: "Элементы",
      type: "CommandBarChildItems",
      defaultValue: [],
      required: true,
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    picture: { yaml: "Картинка", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
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
    ...formGroupCommonProperties,
    shortcut: {
      ...formGroupCommonProperties.shortcut,
      toYAML: false,
      fromYAML: false,
    },
    extendedTooltip: {
      ...formGroupCommonProperties.extendedTooltip,
      toYAML: false,
      fromYAML: false,
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    },
  },
} as const satisfies ElementRule

registerElementRule("Popup", PopupRules)
