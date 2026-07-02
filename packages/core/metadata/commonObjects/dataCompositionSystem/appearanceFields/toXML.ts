import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { exportPropertyToXML, PropertyRule, registerTypeRule } from "../../../orchestration"
import type {
  ParameterValueXML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
} from "../parameterValue/types"
import { exportSettingsParameterValueDcscorItemsToXML } from "../settingsParameterValueCollection/dcscorItemsXML"
import { AppearanceFieldsPropertyRule, AppearanceFieldsRules, directAppearanceXmlTags } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

const appearanceParameterRules = AppearanceFieldsRules.properties as unknown as Partial<
  Record<string, SettingsParameterValuePropertyRule>
>

const orderedAppearanceParameterNames = Object.keys(AppearanceFieldsRules.properties) as string[]

const usesDataSetFieldAppearanceXML = (rule: PropertyRule): boolean =>
  (rule as AppearanceFieldsPropertyRule).appearanceXml === "dataSetField"

const exportDataSetFieldAppearanceToXML = (
  context: ConfigurationContextWithExportToXML,
  value: AppearanceFields,
  referenceMetadata?: AppearanceFields | undefined
): AppearanceFieldsXML | undefined => {
  const result: AppearanceFieldsXML = {}

  for (const parameterName of orderedAppearanceParameterNames) {
    const fieldValue = value[parameterName as keyof AppearanceFields]
    if (fieldValue === undefined || parameterName === "itemType") continue

    const parameterRule = appearanceParameterRules[parameterName]
    const xmlTag = directAppearanceXmlTags[parameterName as keyof typeof directAppearanceXmlTags]
    if (parameterRule === undefined || xmlTag === undefined) continue

    const referenceField = referenceMetadata?.[parameterName as keyof AppearanceFields]
    const itemXml = exportPropertyToXML({
      context,
      rule: parameterRule,
      value: fieldValue,
      referenceMetadata: referenceField,
    }) as ParameterValueXML | undefined

    if (itemXml?.["dcscor:value"] !== undefined) {
      result[xmlTag] = {
        "dcsset:value": itemXml["dcscor:value"],
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
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
