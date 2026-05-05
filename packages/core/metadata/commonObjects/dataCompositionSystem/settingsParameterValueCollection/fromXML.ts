import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { SettingsParameterValueCollectionPropertyRule } from "~/metadata/orchestration/property/types"
import { importSettingsParameterValueDcscorItemsFromXML } from "./dcscorItemsXML"
import type { SettingsParameterValueCollection, SettingsParameterValueCollectionXML } from "./types"

const importSettingsParameterValueCollectionFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: SettingsParameterValueCollectionXML | undefined
): SettingsParameterValueCollection | undefined => {
  const collRule = rule as SettingsParameterValueCollectionPropertyRule
  const parameters = importSettingsParameterValueDcscorItemsFromXML({
    context,
    ruleSet: {
      defaultItemRule: collRule.defaultItemRule,
      parameterRules: collRule.parameterRules,
    },
    xml,
    skipUnknownParameters: collRule.defaultItemRule === undefined,
  })

  if (!parameters || Object.keys(parameters).length === 0) return undefined

  return {
    itemType: "SettingsParameterValueCollection",
    parameters,
  }
}

registerTypeRule("SettingsParameterValueCollection", "importFromXML", importSettingsParameterValueCollectionFromXML)
