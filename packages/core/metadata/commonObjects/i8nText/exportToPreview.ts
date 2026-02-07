import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { exportI8nTextDefaultToEnterprise } from "./exportToEnterprise"
import { I8nText } from "./types"

export const exportI8nTextToPreview = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  text: I8nText | undefined
): string | undefined => {
  return exportI8nTextDefaultToEnterprise(context, undefined, text)
}

registerTypeRule("I8nText", "exportToPreview", exportI8nTextToPreview)
