import { ConfigurationContextFromXML } from "../../../context/types"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import type { SettingsParameterValueCollectionPropertyRule } from "../../../ruleRuntime/property/types"
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

export const metadataPropertyRule000 = definePropertyTypeRule("SettingsParameterValueCollection", "importFromXML", importSettingsParameterValueCollectionFromXML)
