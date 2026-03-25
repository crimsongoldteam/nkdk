import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { ParameterValueXML } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

type AppearanceFieldParameterKey = keyof typeof AppearanceFieldsRules.properties

const exportAppearanceToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: AppearanceFields | undefined,
  referenceMetadata?: AppearanceFields | undefined
): AppearanceFieldsXML | undefined => {
  if (!value) return undefined

  const items: ParameterValueXML[] = []

  for (const parameter of Object.keys(AppearanceFieldsRules.properties) as AppearanceFieldParameterKey[]) {
    const itemXml = exportAppearanceFieldParameterItem(context, parameter, value, referenceMetadata)
    if (itemXml !== undefined) {
      items.push(itemXml)
    }
  }

  if (items.length === 0) return undefined

  return {
    "dcscor:item": items.length === 1 ? items[0] : items,
  }
}

function exportAppearanceFieldParameterItem(
  context: ConfigurationContextWithExportToXML,
  parameter: AppearanceFieldParameterKey,
  value: AppearanceFields,
  referenceMetadata?: AppearanceFields
): ParameterValueXML | undefined {
  const fieldValue = value[parameter]
  if (fieldValue === undefined) return undefined

  const propRule = AppearanceFieldsRules.properties[parameter]
  const referenceField = referenceMetadata?.[parameter]
  const itemXml = exportPropertyToXML({
    context,
    rule: propRule,
    value: fieldValue,
    referenceMetadata: referenceField,
  })
  return itemXml !== undefined ? (itemXml as ParameterValueXML) : undefined
}

registerTypeRule("Appearance", "exportToXML", exportAppearanceToXML)
