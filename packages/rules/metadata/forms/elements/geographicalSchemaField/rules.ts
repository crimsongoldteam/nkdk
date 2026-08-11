import { colorRule } from "../../../commonObjects/color/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { defineElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const GeographicalSchemaFieldRules = {
  itemType: "GeographicalSchemaField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.GeographicalSchemaField",
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
    "verticalStretch",
    "output",
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
    height: numberRule({ yaml: "Высота", implicitValueYAML: 10 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    output: systemEnumerationRule({
      yaml: "Вывод",
      typeSE: "UseOutput",
      implicitValueYAML: "Auto",
    }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 50 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        detailProcessing: "ОбработкаРасшифровки",
        beforeWrite: "ПередЗаписью",
        beforePrint: "ПередПечатью",
        afterWrite: "ПослеЗаписи",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      defaultType: "GeographicalSchema",
      allowedKinds: ["GeographicalSchema"],
      allowComposite: false,
    }),
    ...formFieldCommonProperties,
    titleHeight: { ...formFieldCommonProperties.titleHeight, implicitValueYAML: 0 },
  },
} as const satisfies ElementRule
export const metadataRuleLayer000 = defineElementRule("GeographicalSchemaField", GeographicalSchemaFieldRules)
