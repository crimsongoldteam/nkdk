import { ConfigurationContextFromXML } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { readBooleanXML } from "../../../commonObjects/boolean/xmlValue"

type ScrollBarUse = "AutoUse" | "DontUse" | "UseAlways"

const importScrollBarUseFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
): ScrollBarUse | undefined => {
  const value = readBooleanXML(xml)
  if (value === true) return "UseAlways"
  if (value === false) return "DontUse"

  return undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("ScrollBarUseBoolean", "importFromXML", importScrollBarUseFromXML)
