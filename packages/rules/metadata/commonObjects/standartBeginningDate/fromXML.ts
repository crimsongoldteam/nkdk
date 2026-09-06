import { claimCanonicalXmlImportAttribute, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { StandartBeginningDate, StandartBeginningDateXML } from "./types"

export const importStandartBeginningDateFromXML = (
  xml: StandartBeginningDateXML | XmlElementNode | undefined
): StandartBeginningDate | undefined => {
  if (!xml) return undefined
  if (isXmlElementNode(xml)) {
    const variantNode = xmlElementChildren(xml, "v8:variant")[0]
    if (variantNode === undefined ||
      (variantNode.attributes.length === 0 && variantNode.content.every(child => child.type === "text"))) return undefined
    const variant = xmlTextValue(variantNode) as StandartBeginningDate["variant"]
    if (!variant) return undefined
    const dateNode = xmlElementChildren(xml, "v8:date")[0]
    const date = dateNode === undefined ? undefined : xmlTextValue(dateNode) || undefined
    return { variant, ...(date !== undefined ? { date } : {}) }
  }

  const variantXml = xml["v8:variant"]
  claimCanonicalXmlImportAttribute({
    value: variantXml,
    name: "xsi:type",
    expectedValue: "v8:StandardBeginningDateVariant",
  })
  const variant = variantXml?.["#text"]
  if (!variant) return undefined

  return {
    variant,
    ...(xml["v8:date"] !== undefined ? { date: xml["v8:date"] } : {}),
  }
}
