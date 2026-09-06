import { isXmlElementNode, xmlTextValue, type XmlElementNode, type ConfigurationContextFromXML } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { UserSettingsID, UserSettingsIDXML } from "./types"

export const importUserSettingsIDFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: UserSettingsIDXML | XmlElementNode | undefined
): UserSettingsID | UserSettingsIDXML | undefined => {
  return isXmlElementNode(xml) ? xmlTextValue(xml) || undefined : xml
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserSettingsID", "importFromXML", importUserSettingsIDFromXML)
