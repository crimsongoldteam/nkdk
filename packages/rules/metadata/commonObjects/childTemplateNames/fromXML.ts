import { ConfigurationContextFromXML } from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexCollectionXmlNodeLogicalAddress,
} from "@nkdk/runtime"
import type { ConfigurationIndexCollector } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"

/** Импортирует список имён макетов из XML-тегов Template в ChildObjects. */
export const importChildTemplateNamesFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): string[] | undefined => {
  if (xml === undefined || xml === null) return undefined
  if (Array.isArray(xml)) return xml.length > 0 ? xml : undefined
  return [xml as string]
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildTemplateNames", "importFromXML", importChildTemplateNamesFromXML)

export const metadataPropertyRule001 = definePropertyTypeRule("ChildTemplateNames", "collectConfigurationIndexFromXML", ({ context, xml }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return
  const names = Array.isArray(xml) ? xml : [xml]
  if (!names.every((name): name is string => typeof name === "string")) return
  setChildTemplateNamesOmittedChildren(
    collection.collector,
    getConfigurationIndexCollectionXmlNodeLogicalAddress(collection),
    names
  )
})

export function setChildTemplateNamesOmittedChildren(
  collector: ConfigurationIndexCollector,
  address: string,
  names: readonly string[]
): void {
  if (names.length === 0) return
  collector.setOmittedChildren(address, { kind: "names", names })
}
