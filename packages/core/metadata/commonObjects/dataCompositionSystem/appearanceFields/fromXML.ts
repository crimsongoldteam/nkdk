import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importPropertyFromXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { ParameterValueXML, SettingsParameterValue, SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { importSettingsParameterValueDcscorItemsFromXML } from "../settingsParameterValueCollection/dcscorItemsXML"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

const appearanceParameterRules = AppearanceFieldsRules.properties as unknown as Partial<
  Record<string, SettingsParameterValuePropertyRule>
>

type DataSetFieldAppearanceRule = PropertyRule & { appearanceXml?: "dataSetField" }

const usesDataSetFieldAppearanceXML = (rule: PropertyRule): boolean =>
  (rule as DataSetFieldAppearanceRule).appearanceXml === "dataSetField"

const importDataSetFieldAppearanceFromXML = (
  context: ConfigurationContextFromXML,
  xml: AppearanceFieldsXML | undefined
): AppearanceFields | undefined => {
  const format = xml?.["dcsset:format"]
  if (format === undefined) return undefined

  const formatRule = appearanceParameterRules["Формат"]
  if (formatRule === undefined) return undefined

  const value = importPropertyFromXML({
    context,
    rule: formatRule,
    value: {
      "dcscor:parameter": "Формат",
      "dcscor:value": format["dcsset:value"],
    } satisfies ParameterValueXML,
  }) as SettingsParameterValue | undefined

  if (value === undefined) return undefined

  return {
    itemType: "AppearanceFields",
    Формат: value,
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
