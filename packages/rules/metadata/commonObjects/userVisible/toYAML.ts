import { exportBooleanToYAML } from "../boolean/toYAML"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { UserVisiblePropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import type { UserVisible, UserVisibleRolesYAML, UserVisibleYAML } from "./types"
import { exportStringMetadataTargetToYAML } from "../../ruleRuntime/property/metadataTargetString"

const roleTargetRule = {
  type: "string",
  metadataTarget: { kind: "object", roots: ["Role"] },
} as const

export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleYAML>> | undefined => {
  if (!userVisible) return undefined
  if (!rule.yaml) throw new Error("UserVisiblePropertyRule must have yaml property")
  if (userVisible.values.length === 0) {
    if (userVisible.common) return undefined

    return {
      [rule.yaml]: {
        Разрешить: "Ложь" as const,
      },
    }
  }

  const roles: UserVisibleRolesYAML = {}
  userVisible.values.forEach((item) => {
    const name = isUuid(item.name)
      ? item.name
      : exportStringMetadataTargetToYAML({ rule: roleTargetRule, value: item.name, owner: undefined }) as string
    roles[name] = exportBooleanToYAML(context, undefined, item.value)!
  })

  return {
    [rule.yaml]: {
      ...(userVisible.common ? {} : { Разрешить: "Ложь" as const }),
      Роли: roles,
    },
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "exportToYAML", exportUserVisibleToYAML as any)
