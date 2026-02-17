import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { importEventsFromYAML } from "../events"
import { importFormElementTypeFromEnterprise } from "../metadataType/fromYAML"
import { FormElementType } from "../metadataType/types"
import { PropertyRule } from "../properties/types"
import { ToTypedYAML, ToYAML } from "../rules"
import { getElementRule } from "./factory"
import { ElementRule } from "./types"
import { importPropertyFromYAML } from "../properties/fromYAML"

export function importElementFromTypedYAML<T extends NamedElement>(params: {
  context: ConfigurationContext
  yaml: ToTypedYAML<T> & { События?: Record<string, string> }
  name: string
}): T {
  const { context, yaml: yaml, name } = params

  const itemType = importFormElementTypeFromEnterprise(params.context, yaml.Тип)

  const rules = getElementRule<T>(itemType)

  const result: any = {
    itemType: itemType,
    name: name,
  }

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const yamlKey = rule.yaml as keyof typeof params.yaml

    const yamlValue = yaml[yamlKey]

    const importedValue = importPropertyFromYAML({
      context,
      rule: rule,
      yaml: yaml,
      value: yamlValue,
    })

    if (importedValue !== undefined) {
      result[key as keyof T] = importedValue
    }
  }

  const events = importEventsFromYAML(rules.events, "События" in yaml ? yaml.События : undefined)
  Object.assign(result, events)

  return result as T
}

export function importElementFromPartialYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  yaml: ToYAML<T> | undefined
  source?: T
}): T | undefined {
  if (params.yaml === undefined) return params.source

  const rules = getElementRule<T>(params.itemType)

  return importElementFromYAML({
    context: params.context,
    rules: rules,
    yaml: params.yaml as ToYAML<T> & { События?: Record<string, string> },
    itemType: params.itemType,
    source: params.source,
  })
}

function importElementFromYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  rules: ElementRule<T>
  itemType: FormElementType
  yaml: (ToYAML<T> & { События?: Record<string, string> }) | undefined
  source?: T
}): T | undefined {
  const { context, rules, yaml, source, itemType } = params
  if (yaml === undefined) return source

  const result: T = {
    ...(source ? source : {}),
    itemType: itemType,
  } as T

  for (const [key, curRule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const yamlKey = curRule.yaml
    if (yamlKey === undefined) continue

    const sourceValue = source ? source[key] : curRule.defaultValue

    const yamlValue = (yaml as any)[yamlKey]

    const importedValue = importPropertyFromYAML({
      context,
      rule: curRule,
      value: yamlValue,
      yaml: yaml,
      sourceValue,
    })

    if (importedValue !== undefined) {
      result[key as keyof T] = importedValue
    }
  }

  const events = importEventsFromYAML(rules.events, "События" in yaml ? yaml.События : undefined)
  Object.assign(result, events)

  return result
}
