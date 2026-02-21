import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { importEventsFromYAML } from "../events"
import { importFormElementTypeFromYAML } from "../metadataType/fromYAML"
import { FormElementType } from "../metadataType/types"
import { importPropertiesFromYAML } from "../properties/fromYAML"
import { ToTypedYAML, ToYAML } from "../rules"
import { getElementRule } from "./factory"
import { ElementRule } from "./types"

export function importElementFromTypedYAML<T extends NamedElement>(params: {
  context: ConfigurationContext
  yaml: ToTypedYAML<T> & { События?: Record<string, string> }
  name: string
}): T {
  const { context, yaml: yaml, name } = params

  const itemType = importFormElementTypeFromYAML(params.context, yaml.Тип)

  const rules = getElementRule<T>(itemType)

  const properties = importPropertiesFromYAML({
    context,
    yaml: yaml as ToYAML<T> & { События?: Record<string, string> },
    metadataType: itemType,
    rules,
  })

  // for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
  //   const yamlKey = rule.yaml as keyof typeof params.yaml

  //   const yamlValue = yaml[yamlKey]

  //   const importedValue = importPropertyFromYAML({
  //     context,
  //     rule: rule,
  //     yaml: yaml,
  //     value: yamlValue,
  //   })

  //   if (importedValue !== undefined) {
  //     result[key as keyof T] = importedValue
  //   }
  // }

  const events = importEventsFromYAML({
    rule: rules,
    yaml: yaml,
  })

  const result: T = {
    ...properties,
    ...events,
    itemType: itemType,
    name: name,
  }

  return result as T
}

export function importElementFromPartialYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  yaml: ToYAML<T> | undefined
  source?: T
}): T | undefined {
  const { context, itemType, yaml, source } = params
  // if (yaml === undefined) return source

  const rules = getElementRule<T>(itemType)

  return importElementFromYAML({
    context: context,
    rules: rules,
    yaml: yaml as ToYAML<T> & { События?: Record<string, string> },
    itemType: itemType,
    source: source,
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
  // if (yaml === undefined) return source

  const properties = importPropertiesFromYAML({
    context,
    yaml: yaml as ToYAML<T> & { События?: Record<string, string> },
    metadataType: itemType,
    rules,
    source,
  })

  // for (const [key, curRule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
  //   const yamlKey = curRule.yaml
  //   // if (yamlKey === undefined) continue

  //   const sourceValue = source ? source[key] : curRule.defaultValue

  //   const yamlValue = yaml && yamlKey ? (yaml as any)[yamlKey] : undefined

  //   const importedValue = importPropertyFromYAML({
  //     context,
  //     rule: curRule,
  //     value: yamlValue,
  //     yaml: yaml,
  //     sourceValue,
  //   })

  //   if (importedValue !== undefined) {
  //     result[key as keyof T] = importedValue
  //   }
  // }

  const events = importEventsFromYAML({
    rule: rules,
    yaml: yaml,
  })

  const result: T = {
    ...(source ? source : {}),
    ...properties,
    ...events,
    itemType: itemType,
  }

  return result
}
