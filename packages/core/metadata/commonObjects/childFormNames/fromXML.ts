import { ConfigurationContextFromXML } from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexCollectionXmlNodeLogicalAddress,
} from "@nkdk/runtime"
import type { ConfigurationIndexCollector } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"

/** Импортирует список имён форм из XML-тегов Form в ChildObjects. */
export const importChildFormNamesFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): string[] | undefined => {
  if (xml === undefined || xml === null) return undefined
  if (Array.isArray(xml)) return xml.length > 0 ? xml : undefined
  return [xml as string]
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildFormNames", "importFromXML", importChildFormNamesFromXML)

export const collectChildFormNamesOmittedChildrenFromXML = (params: {
  context: ConfigurationContextFromXML
  xml: unknown
}): void => {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined) return
  const names = Array.isArray(params.xml) ? params.xml : [params.xml]
  if (!names.every((name): name is string => typeof name === "string")) return
  setChildFormNamesOmittedChildren(collection.collector, getConfigurationIndexCollectionXmlNodeLogicalAddress(collection), names)
}

export const metadataPropertyRule001 = definePropertyTypeRule("ChildFormNames", "collectConfigurationIndexFromXML", collectChildFormNamesOmittedChildrenFromXML)

export function setChildFormNamesOmittedChildren(
  collector: ConfigurationIndexCollector,
  address: string,
  names: readonly string[]
): void {
  if (names.length === 0) return
  collector.setOmittedChildren(address, { kind: "names", names })
}
