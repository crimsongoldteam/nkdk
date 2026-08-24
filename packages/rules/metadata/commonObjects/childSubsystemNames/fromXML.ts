import { definePropertyTypeRule } from "../../ruleRuntime"
import type { ChildSubsystemNames, ChildSubsystemNamesXML } from "./types"

export const importChildSubsystemNamesFromXML = (
  value: ChildSubsystemNamesXML | undefined
): ChildSubsystemNames | undefined => {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildSubsystemNames", "importFromXML", (_context, _rule, value) =>
  importChildSubsystemNamesFromXML(value as ChildSubsystemNamesXML | undefined)
)

export const metadataPropertyRule001 = definePropertyTypeRule("ChildSubsystemNames", "xmlImportPropertyBehavior", {
  repeatedXMLNodes: true,
})
