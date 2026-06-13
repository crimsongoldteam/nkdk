import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { UserVisiblePropertyRule } from "~/metadata/orchestration/property/types"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleYAML, type UserVisible } from "./types"

export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleYAML>> | undefined => {
  if (!userVisible) return undefined
  if (userVisible.values.length === 0) return undefined
  if (!rule.yaml) throw new Error("UserVisiblePropertyRule must have yaml property")

  const roles: UserVisibleYAML["Роли"] = {}
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
