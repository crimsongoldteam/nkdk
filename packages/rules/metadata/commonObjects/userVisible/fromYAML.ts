import { importBooleanFromYAML } from "../boolean/fromYAML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ImportFromYAMLFunctionNew } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import {
  cloneMetadataTargetValue,
  importMetadataTargetOccurrencesFromYAML,
} from "@nkdk/runtime/rule-kit"
import type { UserVisible, UserVisibleRolesYAML, UserVisibleYAML } from "./types"
import { collectUserVisibleMetadataTargetOccurrences } from "./metadataTargetOccurrences"

export const importUserVisibleFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: UserVisibleYAML | undefined
  source?: UserVisible | undefined
  yaml?: Record<string, any> | undefined
}): UserVisible | undefined => {
  if (params.value === undefined) return undefined
  const prepared = cloneMetadataTargetValue(params.value) as UserVisibleYAML
  const value = importMetadataTargetOccurrencesFromYAML({
    value: prepared,
    occurrences: collectUserVisibleMetadataTargetOccurrences({
      value: prepared,
      representation: "yaml",
      yamlPath: typeof params.rule.yaml === "string" ? [params.rule.yaml] : [],
      propRule: params.rule,
    }),
  }) as UserVisibleYAML
  return importPreparedUserVisibleFromYAML({ ...params, value })
}

const importPreparedUserVisibleFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: UserVisibleYAML | undefined
  source?: UserVisible | undefined
  yaml?: Record<string, any> | undefined
}): UserVisible | undefined => {
  const { context, value } = params
  if (value === undefined) return undefined

  const roles: UserVisibleRolesYAML = "Роли" in value ? value.Роли : {}
  const values = Object.entries(roles).map(([key, val]) => {
    const parsedValue = importBooleanFromYAML(context, undefined, val)
    return {
      name: key,
      value: parsedValue!,
    }
  })

  return {
    common: value.Разрешить !== "Ложь",
    values,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "importFromYAML", importPreparedUserVisibleFromYAML)
