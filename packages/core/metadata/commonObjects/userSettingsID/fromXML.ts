import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { UserSettingsID, UserSettingsIDXML } from "./types"

export const importUserSettingsIDFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: UserSettingsIDXML | undefined
): UserSettingsID | UserSettingsIDXML | undefined => {
  return xml
}

export const metadataPropertyRule000 = definePropertyTypeRule("UserSettingsID", "importFromXML", importUserSettingsIDFromXML)
