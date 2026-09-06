import { importNumberFromXML } from "../number/fromXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { MetadataField } from "../metadataField/types"
import type { TypeLink, TypeLinkXML } from "./types"

export const importTypeLinkFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: TypeLinkXML | XmlElementNode | undefined
): TypeLink | undefined => {
  if (!xml) return undefined

  if (isXmlElementNode(xml)) {
    if (xml.attributes.length === 0 && xml.content.every(node => node.type === "text") && xmlTextValue(xml) === "") return undefined
    const path = xmlElementChildren(xml, "xr:DataPath")[0]
    if (path === undefined || path.attributes.length === 0 && !path.content.some(node => node.type === "element") && xmlTextValue(path) === "") {
      throw new Error("Invalid TypeLink structure: missing xr:DataPath")
    }
    return {
      dataPath: (xmlTextValue(path) || undefined) as MetadataField,
      linkItem: importNumberFromXML(_context, undefined, xmlElementChildren(xml, "xr:LinkItem")[0]) ?? 0,
    }
  }

  const dataPath = typeof xml["xr:DataPath"] === "string" ? xml["xr:DataPath"] : xml["xr:DataPath"]["#text"]
  const linkItem = importNumberFromXML(_context, undefined, xml["xr:LinkItem"])

  const result: TypeLink = {
    dataPath: dataPath as MetadataField,
    linkItem: linkItem ?? 0,
  }

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeLink", "importFromXML", importTypeLinkFromXML)
