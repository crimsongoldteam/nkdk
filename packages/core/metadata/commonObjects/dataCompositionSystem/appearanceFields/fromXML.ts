import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { importSettingsParameterValueDcscorItemsFromXML } from "../settingsParameterValueCollection/dcscorItemsXML"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

const appearanceParameterRules = AppearanceFieldsRules.properties as unknown as Partial<
  Record<string, SettingsParameterValuePropertyRule>
>

const importAppearanceFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: AppearanceFieldsXML | undefined
): AppearanceFields | undefined => {
  const parameters = importSettingsParameterValueDcscorItemsFromXML({
    context,
    ruleSet: { parameterRules: appearanceParameterRules },
    xml,
    skipUnknownParameters: true,
  })

  if (!parameters) return undefined

  return {
    itemType: "AppearanceFields",
    ...parameters,
  }
}

registerTypeRule("AppearanceFields", "importFromXML", importAppearanceFromXML)
