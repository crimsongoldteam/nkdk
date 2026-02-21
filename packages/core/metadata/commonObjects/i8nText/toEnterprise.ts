import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { exportI8nTextDefaultToYAML } from "./toYAML"
import { I8nText } from "./types"

export const exportI8nTextToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  text: I8nText | undefined
): string | undefined => {
  return exportI8nTextDefaultToYAML(context, text)
}

registerTypeRule("I8nText", "exportToEnterprise", exportI8nTextToEnterprise)
