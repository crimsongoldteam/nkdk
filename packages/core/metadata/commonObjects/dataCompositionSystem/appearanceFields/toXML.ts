import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { SettingsParameterValue, SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { exportSettingsParameterValueDcscorItemsToXML } from "../settingsParameterValueCollection/dcscorItemsXML"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

const appearanceParameterRules = AppearanceFieldsRules.properties as unknown as Partial<
  Record<string, SettingsParameterValuePropertyRule>
>

const orderedAppearanceParameterNames = Object.keys(AppearanceFieldsRules.properties) as string[]

const exportAppearanceToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: AppearanceFields | undefined,
  referenceMetadata?: AppearanceFields | undefined
): AppearanceFieldsXML | undefined => {
  if (!value) return undefined

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
