import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { UserSettingsID, UserSettingsIDXML } from "./types"

export const importUserSettingsIDFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: UserSettingsIDXML | undefined
): UserSettingsID | UserSettingsIDXML | undefined => {
  if (context.fromXML.forReference) return xml

  return xml !== undefined ? true : undefined
}

registerTypeRule("UserSettingsID", "importFromXML", importUserSettingsIDFromXML)
