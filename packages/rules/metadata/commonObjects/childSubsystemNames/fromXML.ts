import { definePropertyTypeRule } from "../../ruleRuntime"
import type { ChildSubsystemNames, ChildSubsystemNamesXML } from "./types"
import type { XmlElementNode } from "@nkdk/runtime"
import { childNamesFromXML } from "../childNamesXML"

export const importChildSubsystemNamesFromXML = (
  input: ChildSubsystemNamesXML | XmlElementNode | XmlElementNode[] | undefined
): ChildSubsystemNames | undefined => {
  const value = childNamesFromXML(input) as ChildSubsystemNamesXML | undefined
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildSubsystemNames", "importFromXML", (_context, _rule, value) =>
  importChildSubsystemNamesFromXML(value as ChildSubsystemNamesXML | XmlElementNode | XmlElementNode[] | undefined)
)

export const metadataPropertyRule001 = definePropertyTypeRule("ChildSubsystemNames", "xmlImportPropertyBehavior", {
  repeatedXMLNodes: true,
})
