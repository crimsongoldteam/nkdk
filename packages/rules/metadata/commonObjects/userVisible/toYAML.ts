import { exportBooleanToYAML } from "../boolean/toYAML"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { UserVisiblePropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import {
  cloneMetadataTargetValue,
  exportMetadataTargetOccurrencesToYAML,
} from "@nkdk/runtime/rule-kit"
import type { UserVisible, UserVisibleRolesYAML, UserVisibleYAML } from "./types"
import { collectUserVisibleMetadataTargetOccurrences } from "./metadataTargetOccurrences"
import { markYAMLMappingKeyTag } from "@nkdk/runtime"
import { isMDObjectRefUuid } from "../metadataRef/brokenMDObjectRef"

export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleYAML>> | undefined => {
  const raw = exportPreparedUserVisibleToYAML(context, rule, userVisible)
  if (raw === undefined) return undefined
  const prepared = cloneMetadataTargetValue(raw)
  return exportMetadataTargetOccurrencesToYAML({
    value: prepared,
    occurrences: collectUserVisibleMetadataTargetOccurrences({
      value: prepared,
      representation: "yaml",
      yamlPath: [rule.yaml!],
      propRule: rule,
    }),
  }) as Partial<Record<string, UserVisibleYAML>>
}

const exportPreparedUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined,
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
    if (isMDObjectRefUuid(item.name)) {
      markYAMLMappingKeyTag(roles, item.name, "xml/reference")
    }
  })

  return {
    [rule.yaml]: {
      ...(userVisible.common ? {} : { Разрешить: "Ложь" as const }),
      Роли: roles,
    },
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "exportToYAML", exportPreparedUserVisibleToYAML as any)
