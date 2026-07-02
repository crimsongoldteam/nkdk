import { exportBooleanToYAML } from "../boolean/toYAML"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { UserVisiblePropertyRule } from "../../orchestration/property/types"
import { ConfigurationContext } from "../../context/types"
import type { UserVisible, UserVisibleRolesYAML, UserVisibleYAML } from "./types"

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
    roles[item.name] = exportBooleanToYAML(context, undefined, item.value)!
  })

  return {
    [rule.yaml]: {
      ...(userVisible.common ? {} : { Разрешить: "Ложь" as const }),
      Роли: roles,
    },
  }
}

registerTypeRule("UserVisible", "exportToYAML", exportUserVisibleToYAML as any)
