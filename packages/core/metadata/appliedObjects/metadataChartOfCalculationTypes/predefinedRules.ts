import { booleanRule } from "../../commonObjects/boolean/types"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { PredefinedRules } from "../../commonObjects/predefined/rules"
import { PredefinedItemRules } from "../../commonObjects/predefinedItem/rules"
import type { MetadataItemRule } from "../../orchestration/property/types"

const ChartOfCalculationTypesPredefinedItemRules = {
  ...PredefinedItemRules,
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
    }),
    leading: metadataItemLinksRule({
      yaml: "Ведущие",
      xml: "Leading",
      metadataItemLinksXMLItem: "CalculationType",
    }),
    displaced: metadataItemLinksRule({
      yaml: "Вытесняющие",
      xml: "Displaced",
      metadataItemLinksXMLItem: "CalculationType",
    }),
  },
} as const satisfies MetadataItemRule

export const ChartOfCalculationTypesPredefinedRules = {
  ...PredefinedRules,
  properties: {
    ...PredefinedRules.properties,
    items: {
      ...PredefinedRules.properties.items,
      itemRule: ChartOfCalculationTypesPredefinedItemRules,
    },
  },
} as const satisfies MetadataItemRule
