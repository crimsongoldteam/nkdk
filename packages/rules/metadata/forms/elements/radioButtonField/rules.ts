import { choiceListRule } from "../../../commonObjects/choiceList/types"
import { colorRule } from "../../../commonObjects/color/types"
import { fontRule } from "../../../commonObjects/font/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { defineElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
import { settingsComposerRadioFieldKinds } from "../../settingsComposer/dataPathGraph"
export type { ElementRule, PropertyRule }
export const RadioButtonFieldRules = {
  itemType: "RadioButtonField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.RadioButtonField",
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
    "radioButtonType",
    "itemWidth",
    "itemHeight",
    "itemTitleHeight",
    "columnsCount",
    "equalColumnsWidth",
    "choiceList",
    "font",
    "textColor",
    "backColor",
    "borderColor",
    "contextMenu",
    "extendedTooltip",
    "events",
    "name",
    "displayImportance",
  ],
  properties: {
    backColor: colorRule({
      yaml: "ЦветФона",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    choiceList: choiceListRule({
      yaml: "СписокВыбора",
      toEnterprise: false,
    }),
    columnsCount: numberRule({ yaml: "КоличествоКолонок", implicitValueYAML: 0 }),
    equalColumnsWidth: booleanRule({ yaml: "ОдинаковаяШиринаКолонок", noImplicitValueYAML: true }),
    font: fontRule({
      yaml: "Шрифт",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    }),
    itemHeight: numberRule({ yaml: "ВысотаЭлемента", implicitValueYAML: 0 }),
    itemTitleHeight: numberRule({ yaml: "ВысотаЗаголовкаЭлемента", implicitValueYAML: 0 }),
    itemWidth: numberRule({ yaml: "ШиринаЭлемента", implicitValueYAML: 0 }),
    radioButtonType: systemEnumerationRule({
      yaml: "ВидПереключателя",
      typeSE: "RadioButtonType",
      implicitValueYAML: "Auto",
      defaultValueXML: "Auto",
    }),
    textColor: colorRule({
      yaml: "ЦветТекста",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      defaultType: "string",
      allowedKinds: [
        "string", "decimal", "CatalogRef.*", "DefinedType.*", "EnumRef.*",
        "FormattedString", "ChartOfAccountsRef.*", "ChartOfCharacteristicTypesRef.*", "<standard-enum>",
        ...settingsComposerRadioFieldKinds,
      ],
      allowComposite: false,
    }),
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule
export const metadataRuleLayer000 = defineElementRule("RadioButtonField", RadioButtonFieldRules)
