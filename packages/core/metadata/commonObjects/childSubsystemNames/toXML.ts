import { definePropertyTypeRule } from "../../ruleRuntime"
import type { ChildSubsystemNames, ChildSubsystemNamesXML } from "./types"

export const exportChildSubsystemNamesToXML = (
  value: ChildSubsystemNames | undefined
): ChildSubsystemNamesXML | undefined => {
  if (!value || value.length === 0) return undefined
  return value.length === 1 ? value[0] : value
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildSubsystemNames", "exportToXML", (_context, _rule, value) =>
  exportChildSubsystemNamesToXML(value as ChildSubsystemNames | undefined)
)
