import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { ParameterValueXML, SettingsParameterValue, SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { exportSettingsParameterValueDcscorItemsToXML } from "../settingsParameterValueCollection/dcscorItemsXML"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

const appearanceParameterRules = AppearanceFieldsRules.properties as unknown as Partial<
  Record<string, SettingsParameterValuePropertyRule>
>

const orderedAppearanceParameterNames = Object.keys(AppearanceFieldsRules.properties) as string[]

type DataSetFieldAppearanceRule = PropertyRule & { appearanceXml?: "dataSetField" }

const usesDataSetFieldAppearanceXML = (rule: PropertyRule): boolean =>
  (rule as DataSetFieldAppearanceRule).appearanceXml === "dataSetField"

const exportDataSetFieldAppearanceToXML = (
  context: ConfigurationContextWithExportToXML,
  value: AppearanceFields,
  referenceMetadata?: AppearanceFields | undefined
): AppearanceFieldsXML | undefined => {
  const format = value["Формат"]
  if (format === undefined) return undefined

  const formatRule = appearanceParameterRules["Формат"]
  if (formatRule === undefined) return undefined

  const formatXml = exportPropertyToXML({
    context,
    rule: formatRule,
    value: format,
    referenceMetadata: referenceMetadata?.["Формат"],
  }) as ParameterValueXML | undefined

  if (formatXml?.["dcscor:value"] === undefined) return undefined

  return {
    "dcsset:format": {
      "dcsset:value": formatXml["dcscor:value"],
    },
  }
}

const exportAppearanceToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: AppearanceFields | undefined,
  referenceMetadata?: AppearanceFields | undefined
): AppearanceFieldsXML | undefined => {
  if (!value) return undefined

  if (usesDataSetFieldAppearanceXML(rule)) {
    return exportDataSetFieldAppearanceToXML(context, value, referenceMetadata)
  }

  const { itemType: _i, ...fields } = value
  const parameters = fields as Record<string, SettingsParameterValue>

  const ref = referenceMetadata
  const { itemType: _r, ...refFields } = ref ?? {}
  const referenceParameters = ref ? (refFields as Record<string, SettingsParameterValue>) : undefined

  return exportSettingsParameterValueDcscorItemsToXML({
    context,
    ruleSet: { parameterRules: appearanceParameterRules },
    parameters,
    referenceParameters,
    orderedParameterNames: orderedAppearanceParameterNames,
  })
}

registerTypeRule("AppearanceFields", "exportToXML", exportAppearanceToXML)
