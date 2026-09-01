import { importMetadataItemFromXMLToYAML } from "../../../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../../../../ruleRuntime/property/typeRuleRegistry"
import { GroupItemFieldRules } from "./rules"

const compactDefaultXMLKeys = new Set([
  "dcsset:use",
  "dcsset:groupType",
  "dcsset:periodAdditionType",
  "dcsset:periodAdditionBegin",
  "dcsset:periodAdditionEnd",
])

export const importGroupItemFieldFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  name,
  traversal,
}) => {
  const yaml = importMetadataItemFromXMLToYAML({
    context,
    rule: GroupItemFieldRules,
    xml,
    name,
    traversal,
  })
  if (yaml === undefined || yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined

  const value = yaml as Record<string, unknown>
  if (typeof value.Поле !== "string") return undefined
  const keys = Object.keys(value).filter((key) =>
    value[key] !== undefined || !compactDefaultXMLKeys.has(key)
  )
  if (keys.length === 1) {
    const hasRetainedAnnotation = [...(traversal.annotations?.entries() ?? [])].some(({ parent, key }) =>
      parent === value && (typeof key !== "string" || !compactDefaultXMLKeys.has(key))
    )
    if (hasRetainedAnnotation) return value
    traversal.annotations?.deleteSubtree(value)
    return value.Поле
  }
  return value
}

export const metadataPropertyRule000 = definePropertyTypeRule("GroupItemField", "importFromXMLToYAML", importGroupItemFieldFromXMLToYAML)
