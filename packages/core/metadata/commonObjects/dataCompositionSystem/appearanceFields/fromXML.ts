import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importPropertyFromXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { ParameterValueXML, SettingsParameterValue, SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { importSettingsParameterValueDcscorItemsFromXML } from "../settingsParameterValueCollection/dcscorItemsXML"
import { AppearanceFieldsPropertyRule, AppearanceFieldsRules, directAppearanceXmlTags } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

const appearanceParameterRules = AppearanceFieldsRules.properties as unknown as Partial<
  Record<string, SettingsParameterValuePropertyRule>
>

const usesDataSetFieldAppearanceXML = (rule: PropertyRule): boolean =>
  (rule as AppearanceFieldsPropertyRule).appearanceXml === "dataSetField"

const importDataSetFieldAppearanceFromXML = (
  context: ConfigurationContextFromXML,
  xml: AppearanceFieldsXML | undefined
): AppearanceFields | undefined => {
  if (xml === undefined) return undefined

  const parameters: Record<string, SettingsParameterValue> = {}

  for (const [parameterName, xmlTag] of Object.entries(directAppearanceXmlTags)) {
    const fieldXml = xml[xmlTag]
    if (fieldXml === undefined) continue

    const parameterRule = appearanceParameterRules[parameterName]
    if (parameterRule === undefined) continue

    const value = importPropertyFromXML({
      context,
      rule: parameterRule,
      value: {
        "dcscor:parameter": parameterName,
        "dcscor:value": fieldXml["dcsset:value"],
      } satisfies ParameterValueXML,
    }) as SettingsParameterValue | undefined

    if (value !== undefined) {
      parameters[parameterName] = value
    }
  }

  if (Object.keys(parameters).length === 0) return undefined

  return {
    itemType: "AppearanceFields",
    ...parameters,
  }
}

const importAppearanceFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: AppearanceFieldsXML | undefined
): AppearanceFields | undefined => {
  if (usesDataSetFieldAppearanceXML(rule)) {
    return importDataSetFieldAppearanceFromXML(context, xml)
  }

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
