import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"

export const exportCommandNameToEnterprise = (_params: {
  context: ConfigurationContext
  rule: PropertyRule
  value?: string
}): string | undefined => {
  return "КомандаЗаглушка"
}

registerTypeRule("CommandName", "exportToEnterprise", exportCommandNameToEnterprise)
