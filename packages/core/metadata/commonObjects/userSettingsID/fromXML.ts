import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"
import { UserSettingsID, UserSettingsIDXML } from "./types"

export const importUserSettingsIDFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: UserSettingsIDXML | undefined
): UserSettingsID | UserSettingsIDXML | undefined => {
  return xml
}

registerTypeRule("UserSettingsID", "importFromXML", importUserSettingsIDFromXML)
