import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import type { PropertyRule } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexCollectionXmlNodeLogicalAddress,
} from "@nkdk/runtime"
import type { ConfigurationIndexCollector } from "@nkdk/runtime"

export const importChildFileItemNamesFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): string[] | undefined => {
  if (xml === undefined || xml === null) return undefined
  const names = Array.isArray(xml) ? xml.filter((item): item is string => typeof item === "string") : [xml]
  return names.length > 0 && names.every((item) => typeof item === "string") ? names : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildFileItemNames", "importFromXML", importChildFileItemNamesFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("ChildFileItemNames", "collectConfigurationIndexFromXML", ({ context, xml }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return
  const names = Array.isArray(xml) ? xml : [xml]
  if (!names.every((value): value is string => typeof value === "string")) return
  setChildFileItemNamesOmittedChildren(
    collection.collector,
    getConfigurationIndexCollectionXmlNodeLogicalAddress(collection),
    names
  )
})

export function setChildFileItemNamesOmittedChildren(
  collector: ConfigurationIndexCollector,
  address: string,
  names: readonly string[]
): void {
  if (names.length === 0) return
  collector.setOmittedChildren(address, { kind: "names", names })
}
