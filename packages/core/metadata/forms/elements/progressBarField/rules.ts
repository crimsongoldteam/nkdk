import { colorRule } from "../../../commonObjects/color/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type { PropertyRule } from "../../../ruleRuntime/property/types"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const ProgressBarFieldRules = {
  itemType: "ProgressBarField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.ProgressBarField",
  xmlOrder: [
    "dataPath",
    "visible",
    "userVisible",
    "defaultItem",
    "enabled",
    "readOnly",
    "skipOnInput",
    "title",
    "titleTextColor",
    "titleBackColor",
    "titleFont",
    "titleLocation",
    "titleHeight",
    "toolTip",
    "toolTipRepresentation",
    "warningOnEditRepresentation",
    "warningOnEdit",
    "shortcut",
    "horizontalAlign",
    "verticalAlign",
    "horizontalAlignInGroup",
    "verticalAlignInGroup",
    "editMode",
    "cellHyperlink",
    "showInHeader",
    "headerPicture",
    "showInFooter",
    "footerDataPath",
    "footerText",
    "footerTextColor",
    "footerBackColor",
    "footerFont",
    "footerPicture",
    "footerHorizontalAlign",
    "onMainServerUnavalableBehavior",
    "width",
    "autoMaxWidth",
    "maxWidth",
    "height",
    "autoMaxHeight",
    "maxHeight",
    "horizontalStretch",
    "minValue",
    "maxValue",
    "orientation",
    "representation",
    "showPercent",
    "borderColor",
    "contextMenu",
    "extendedTooltip",
    "events",
    "name",
    "displayImportance",
  ],
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 1 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxValue: numberRule({ yaml: "МаксимальноеЗначение", implicitValueYAML: 100 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    minValue: numberRule({ yaml: "МинимальноеЗначение", implicitValueYAML: 0 }),
    orientation: systemEnumerationRule({
      yaml: "Ориентация",
      typeSE: "FormItemOrientation",
      implicitValueYAML: "Horizontal",
    }),
    representation: systemEnumerationRule({
      yaml: "Отображение",
      typeSE: "ProgressBarSmoothingMode",
      implicitValueYAML: "Smooth",
    }),
    showPercent: booleanRule({ yaml: "ОтображатьПроценты", implicitValueYAML: false }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: false }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 32 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      defaultType: "decimal",
    }),
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule
registerElementRule("ProgressBarField", ProgressBarFieldRules)
