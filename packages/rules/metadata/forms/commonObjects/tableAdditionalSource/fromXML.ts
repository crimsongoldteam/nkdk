import { ConfigurationContextFromXML, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { TableAdditionalSourceXML } from "./types"

const importTableAdditionalSourceFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: TableAdditionalSourceXML | XmlElementNode | undefined
): string | undefined => {
  if (!xml) return undefined

  if (isXmlElementNode(xml)) {
    const item = xmlElementChildren(xml, "Item")[0]
    return item === undefined ? undefined : xmlTextValue(item) || undefined
  }
  return xml.Item
}

export const metadataPropertyRule000 = definePropertyTypeRule("TableAdditionalSource", "importFromXML", importTableAdditionalSourceFromXML)
