import { booleanRule } from "../../commonObjects/boolean/types"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { PredefinedRules } from "../../commonObjects/predefined/rules"
import { PredefinedItemRules } from "../../commonObjects/predefinedItem/rules"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

const predefinedCalculationTypeTarget = {
  kind: "value",
  valueKinds: ["predefinedValue"],
} as const

const ChartOfCalculationTypesPredefinedItemRules = {
  ...PredefinedItemRules,
  xmlOrder: [
    "name",
    "code",
    "description",
    "actionPeriodIsBase",
    "base",
    "leading",
    "displaced",
    "id",
  ],
  properties: {
    ...PredefinedItemRules.properties,
    isFolder: {
      ...PredefinedItemRules.properties.isFolder,
      toXML: false,
    },
    actionPeriodIsBase: booleanRule({
      yaml: "ПериодДействияБазовый",
      xml: "ActionPeriodIsBase",
      defaultValueXML: false,
      preserveExplicitDefaultXML: true,
    }),
    base: metadataItemLinksRule({
      yaml: "Базовые",
      xml: "Base",
      metadataItemLinksXMLItem: "CalculationType",
      metadataTarget: predefinedCalculationTypeTarget,
    }),
    leading: metadataItemLinksRule({
      yaml: "Ведущие",
      xml: "Leading",
      metadataItemLinksXMLItem: "CalculationType",
      metadataTarget: predefinedCalculationTypeTarget,
    }),
    displaced: metadataItemLinksRule({
      yaml: "Вытесняющие",
      xml: "Displaced",
      metadataItemLinksXMLItem: "CalculationType",
      metadataTarget: predefinedCalculationTypeTarget,
    }),
  },
} as const satisfies MetadataItemRule

export const ChartOfCalculationTypesPredefinedRules = {
  ...PredefinedRules,
  xmlOrder: [
    "items",
  ],
  properties: {
    ...PredefinedRules.properties,
    items: {
      ...PredefinedRules.properties.items,
      itemRule: ChartOfCalculationTypesPredefinedItemRules,
    },
  },
} as const satisfies MetadataItemRule
