import { capitalize } from "../../../helpers/capitalize"
import type { MetadataItemRule, PropertyRule } from "./types"

export interface YAMLToXMLPlannedProperty {
  readonly propertyKey: string
  readonly propertyRule: PropertyRule
  readonly yamlKey: string | undefined
  readonly xmlPath: readonly string[]
}

export interface YAMLToXMLPlan {
  readonly rule: MetadataItemRule
  readonly properties: readonly YAMLToXMLPlannedProperty[]
}

const plans = new WeakMap<MetadataItemRule, YAMLToXMLPlan>()

export function getYAMLToXMLPlan(rule: MetadataItemRule): YAMLToXMLPlan {
  const cached = plans.get(rule)
  if (cached !== undefined) return cached

  const plan = Object.freeze({
    rule,
    properties: Object.freeze(
      Object.entries(rule.properties).map(([propertyKey, propertyRule]) =>
        Object.freeze({
          propertyKey,
          propertyRule,
          yamlKey: propertyRule.yaml,
          xmlPath: Object.freeze([...(propertyRule.xmlParents ?? []), propertyRule.xml ?? capitalize(propertyKey)]),
        })
      )
    ),
  })

  plans.set(rule, plan)
  return plan
}
