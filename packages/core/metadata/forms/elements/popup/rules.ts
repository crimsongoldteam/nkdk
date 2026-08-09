import { colorRule } from "../../../commonObjects/color/types"
import { pictureRule } from "../../../commonObjects/picture/types"
import { commandBarChildItemsRule } from "../../commonObjects/childItems/rules"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import type { PropertyRule } from "../../../ruleRuntime/property/types"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
export type { ElementRule, PropertyRule }
export const PopupRules = {
  itemType: "Popup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.Popup",
  xmlOrder: [
    "visible",
    "userVisible",
    "enabled",
    "readOnly",
    "enableContentChange",
    "title",
    "titleTextColor",
    "titleFont",
    "toolTip",
    "toolTipRepresentation",
    "width",
    "height",
    "horizontalStretch",
    "verticalStretch",
    "picture",
    "commandSource",
    "representation",
    "shape",
    "shapeRepresentation",
    "backColor",
    "borderColor",
    "extendedTooltip",
    "childItems",
    "name",
    "displayImportance",
  ],
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
