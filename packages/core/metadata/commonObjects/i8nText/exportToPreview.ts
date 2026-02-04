import { ConfigurationContext } from "~/metadata/context/types"
import { exportI8nTextDefaultToEnterprise } from "./exportToEnterprise"
import { I8nText } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"

export const exportI8nTextToPreview = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  text: I8nText | undefined
): string | undefined => {
  return exportI8nTextDefaultToEnterprise(context, undefined, text)
}


registerTypeRule("I8nText", "exportToPreview", exportToPreview)