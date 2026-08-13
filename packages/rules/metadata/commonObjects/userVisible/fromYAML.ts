import { importBooleanFromYAML } from "../boolean/fromYAML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ImportFromYAMLFunctionNew } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { UserVisible, UserVisibleRolesYAML, UserVisibleYAML } from "./types"
import { importStringMetadataTargetFromYAML } from "../../ruleRuntime/property/metadataTargetString"

const roleTargetRule = {
  type: "string",
  metadataTarget: { kind: "object", roots: ["Role"] },
} as const

export const importUserVisibleFromYAML: ImportFromYAMLFunctionNew = (params: {
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
      name: isUuid(key)
        ? key
        : importStringMetadataTargetFromYAML({ rule: roleTargetRule, value: key, owner: undefined }) as string,
      value: parsedValue!,
    }
  })

  return {
    common: value.Разрешить !== "Ложь",
    values,
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "importFromYAML", importUserVisibleFromYAML)
