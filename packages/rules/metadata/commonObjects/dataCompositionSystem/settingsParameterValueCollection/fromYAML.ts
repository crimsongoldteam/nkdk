import { ConfigurationContext } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import type { SettingsParameterValueCollectionPropertyRule } from "@nkdk/runtime/rule-kit"
import { asExplicitYAMLStringIfMarked } from "@nkdk/runtime"
import { XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"
import { xmlAnomalyTagPayload, yamlScalarTagAt } from "@nkdk/runtime"
import { importParameterValueFromYAML } from "../parameterValue/fromYAML"
import type { SettingsParameterValueYAML } from "../parameterValue/types"
import { getSettingsParameterValueRuleForParameter } from "./ruleSet"
import type { SettingsParameterValueCollection, SettingsParameterValueCollectionYAML } from "./types"

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const wrapYamlFragment = (paramName: string, yamlFragment: unknown): SettingsParameterValueYAML => {
  if (yamlFragment === undefined || yamlFragment === null) {
    return { Параметр: paramName }
  }
  if (typeof yamlFragment === "object" && !Array.isArray(yamlFragment)) {
    const o = yamlFragment as Record<string, unknown>
    return {
      ...o,
      ...("Значение" in o ? { Значение: asExplicitYAMLStringIfMarked(o, "Значение", o["Значение"]) } : {}),
      Параметр: o["Параметр"] ?? paramName,
    } as SettingsParameterValueYAML
  }
  return { Значение: yamlFragment as never, Параметр: paramName }
}

const importSettingsParameterValueCollectionFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: SettingsParameterValueCollectionYAML | unknown,
  source?: SettingsParameterValueCollection
): SettingsParameterValueCollection | undefined => {
  if (value === undefined || value === null) return undefined
  if (value === XML_PRESENT_TAG_VALUE) {
    return { itemType: "SettingsParameterValueCollection", parameters: {} }
  }
  if (!isPlainObject(value)) return undefined

  const collRule = rule as SettingsParameterValueCollectionPropertyRule
  const parameters: SettingsParameterValueCollection["parameters"] = {}

  for (const [paramName, yamlFragment] of Object.entries(value)) {
    const itemRule = getSettingsParameterValueRuleForParameter(collRule, paramName)
    if (itemRule === undefined) continue

    const nilTransport = settingsNilTransport(value, paramName, yamlFragment)
    const valueFragment = nilTransport === undefined
      ? asExplicitYAMLStringIfMarked(value, paramName, yamlFragment)
      : removeSettingsNilTransport(yamlFragment, nilTransport)
    const wrapped = wrapYamlFragment(paramName, valueFragment)
    const imported = importParameterValueFromYAML(context, itemRule, wrapped, source?.parameters[paramName])
    if (imported !== undefined) {
      parameters[paramName] = {
        ...imported,
        parameter: paramName,
        ...(nilTransport === undefined ? {} : { xmlNil: true }),
      }
    }
  }

  if (Object.keys(parameters).length === 0) return undefined
  const orderedParameters: SettingsParameterValueCollection["parameters"] = {}
  for (const name of Object.keys(source?.parameters ?? {})) {
    if (parameters[name] !== undefined) orderedParameters[name] = parameters[name]
  }
  for (const [name, parameter] of Object.entries(parameters)) {
    if (orderedParameters[name] === undefined) orderedParameters[name] = parameter
  }
  return { itemType: "SettingsParameterValueCollection", parameters: orderedParameters }
}

type SettingsNilTransport = "scalar" | "value"

function settingsNilTransport(
  collection: Record<string, unknown>,
  parameterName: string,
  fragment: unknown,
): SettingsNilTransport | undefined {
  if (yamlScalarTagAt(collection, parameterName) === "xml/value") {
    assertNilPayload(fragment)
    return "scalar"
  }
  if (isPlainObject(fragment) && yamlScalarTagAt(fragment, "Значение") === "xml/value") {
    assertNilPayload(fragment.Значение)
    return "value"
  }
  return undefined
}

function assertNilPayload(value: unknown): void {
  if (typeof value !== "string" || xmlAnomalyTagPayload("xml/value", value) !== "Nil") {
    throw new Error("для значения параметра настройки допустим только !xml/value Nil")
  }
}

function removeSettingsNilTransport(fragment: unknown, transport: SettingsNilTransport): unknown {
  if (transport === "scalar") return undefined
  const { Значение: _nil, ...rest } = fragment as Record<string, unknown>
  return rest
}

export const metadataPropertyRule000 = definePropertyTypeRule("SettingsParameterValueCollection", "importFromYAML", importSettingsParameterValueCollectionFromYAML)
