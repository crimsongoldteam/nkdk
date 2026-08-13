import { importI8nTextFromXML } from "../../i8nText/fromXML"
import type { I8nTextXML } from "../../i8nText/types"
import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import { definePropertyTypeRule } from "../../../ruleRuntime"
import type { PropertyRule } from "../../../ruleRuntime"
import type { DcsLocalStringTypeXML, DcsLocalStringValue } from "./types"

export const importDcsLocalStringTypeFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: DcsLocalStringTypeXML,
): DcsLocalStringValue | undefined => {
  if (xml === undefined) return undefined
  if (typeof xml === "string") return { kind: "xmlString", text: xml }
  if (typeof xml !== "object" || xml === null) return undefined
  if (xml["_xsi:type"] === "xs:string") {
    return { kind: "xmlString", text: xml["#text"] === undefined ? "" : String(xml["#text"]) }
  }
  return importI8nTextFromXML(context, { type: "I8nText" } as PropertyRule, xml as I8nTextXML)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "importFromXML",
  importDcsLocalStringTypeFromXML,
)
