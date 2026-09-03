import { exportBooleanToYAML } from "../boolean/toYAML"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { PropertyRule, UserVisiblePropertyRule, ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext, type XmlAnomalyAnnotations } from "@nkdk/runtime"
import {
  projectMetadataTargetOccurrencesToYAML,
  assignMetadataTargetUuidAnnotations,
} from "@nkdk/runtime/rule-kit"
import type { UserVisible, UserVisibleRolesYAML, UserVisibleYAML } from "./types"
import { collectUserVisibleMetadataTargetOccurrences } from "./metadataTargetOccurrences"

export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined,
  annotations?: XmlAnomalyAnnotations,
): Partial<Record<string, UserVisibleYAML>> | undefined => {
  const raw = exportPreparedUserVisibleToYAML(context, rule, userVisible, annotations)
  if (raw === undefined) return undefined
  const projected = projectMetadataTargetOccurrencesToYAML({
    value: raw,
    occurrences: collectUserVisibleMetadataTargetOccurrences({
      value: raw,
      representation: "yaml",
      yamlPath: [rule.yaml!],
      propRule: rule,
    }),
  })
  if (annotations !== undefined) assignMetadataTargetUuidAnnotations({
    yaml: raw, annotations, occurrences: projected.uuidOccurrences,
  })
  return raw
}

const exportPreparedUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  userVisible: UserVisible | undefined,
  annotations?: XmlAnomalyAnnotations,
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
    if (item.name === "") annotations?.setKey(roles, "", {
      kind: "invalid", occurrence: 1, target: "key", logicalKey: "",
    })
  })

  return {
    [rule.yaml]: {
      ...(userVisible.common ? {} : { Разрешить: "Ложь" as const }),
      Роли: roles,
    },
  }
}

const exportAnnotatedUserVisibleToYAML: ExportToYAMLFunctionNew = ({ context, rule, value, annotations }) =>
  exportPreparedUserVisibleToYAML(context, rule, value, annotations)

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "exportToYAML", exportAnnotatedUserVisibleToYAML)
