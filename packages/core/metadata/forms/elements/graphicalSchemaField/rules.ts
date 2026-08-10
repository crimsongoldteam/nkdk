import { colorRule } from "../../../commonObjects/color/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { commandSetRule } from "../../commonObjects/commandSet/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type { PropertyRule } from "../../../ruleRuntime/property/types"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const GraphicalSchemaFieldRules = {
  itemType: "GraphicalSchemaField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.GraphicalSchemaField",
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
    "commandSet",
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
    "edit",
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
    commandSet: commandSetRule({ yaml: "Команда", toEnterprise: false }),
    edit: booleanRule({
      yaml: "Редактирование",
      implicitValueYAML: true,
      toEnterprise: false,
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
        selection: "Выбор",
        beforeWrite: "ПередЗаписью",
        beforePrint: "ПередПечатью",
        afterWrite: "ПослеЗаписи",
        onActivate: "ПриАктивизации",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      defaultType: "FlowchartContextType",
      allowedKinds: ["FlowchartContextType"],
      allowComposite: false,
    }),
    ...formFieldCommonProperties,
    titleHeight: { ...formFieldCommonProperties.titleHeight, implicitValueYAML: 0 },
    ...formFieldDisabledTableRelatedProperties,
  },
} as const satisfies ElementRule
registerElementRule("GraphicalSchemaField", GraphicalSchemaFieldRules)
