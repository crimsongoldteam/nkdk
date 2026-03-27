import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importPropertyFromXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { ParameterValueXML, SettingsParameterValue } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

type AppearanceFieldParameterKey = keyof typeof AppearanceFieldsRules.properties

const importAppearanceFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: AppearanceFieldsXML | undefined
): AppearanceFields | undefined => {
  if (!xml) return undefined
  const items = asArray<ParameterValueXML>(xml["dcscor:item"])
  const fields: Partial<AppearanceFields> = {}

  for (const itemXml of items) {
    const entry = importAppearanceFieldItem(context, itemXml)
    if (entry !== undefined) {
      fields[entry.parameter] = entry.value
    }
  }

  return {
    itemType: "AppearanceFields",
    ...fields,
  }
}

const importAppearanceFieldItem = (
  context: ConfigurationContextFromXML,
  itemXml: ParameterValueXML
): { parameter: AppearanceFieldParameterKey; value: SettingsParameterValue } | undefined => {
  const parameter = itemXml["dcscor:parameter"] as AppearanceFieldParameterKey
  const propRule = AppearanceFieldsRules.properties[parameter]
  const value = importPropertyFromXML({
    context,
    rule: propRule,
    value: itemXml,
  })
  if (value === undefined) return undefined
  return { parameter, value }
}

registerTypeRule("AppearanceFields", "importFromXML", importAppearanceFromXML)
