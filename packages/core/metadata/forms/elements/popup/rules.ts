import { colorRule } from "../../../commonObjects/color/types"
import { pictureRule } from "../../../commonObjects/metadataTargets/types"
import { commandBarChildItemsRule } from "../../commonObjects/childItems/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import type { PropertyRule } from "../../../orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }
export const PopupRules = {
  itemType: "Popup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.Popup",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    backColor: colorRule({
      yaml: "ЦветФона",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    commandSource: stringRule({ yaml: "ИсточникКоманд" }),
    childItems: commandBarChildItemsRule({
      yaml: "Элементы",
      defaultValue: [],
    }),
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    }),
    picture: pictureRule({ yaml: "Картинка", metadataTarget: { kind: "object", roots: ["CommonPicture"] } }),
    representation: systemEnumerationRule({
      yaml: "Отображение",
      typeSE: "ButtonRepresentation",
      implicitValueYAML: "Auto",
    }),
    shape: systemEnumerationRule({
      yaml: "Фигура",
      typeSE: "ButtonShape",
      implicitValueYAML: "Auto",
    }),
    shapeRepresentation: systemEnumerationRule({
      yaml: "ОтображениеФигуры",
      typeSE: "ButtonShapeRepresentation",
      implicitValueYAML: "Auto",
    }),
    ...formGroupCommonProperties,
    height: {
      ...formGroupCommonProperties.height,
      implicitValueYAML: 0,
    },
    horizontalStretch: {
      ...formGroupCommonProperties.horizontalStretch,
      noImplicitValueYAML: true,
    },
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
    visible: {
      ...formGroupCommonProperties.visible,
      implicitValueYAML: true,
    },
    width: {
      ...formGroupCommonProperties.width,
      implicitValueYAML: 0,
    },
    type: systemEnumerationRule({
      yaml: "Вид",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    }),
  },
} as const satisfies ElementRule
registerElementRule("Popup", PopupRules)
