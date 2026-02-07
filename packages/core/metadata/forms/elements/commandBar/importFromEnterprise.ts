import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar } from "~/metadata/forms/elements/commandBar/types"
import { importElementFromEnterprisePartial, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function importCommandBarPartialFromEnterprise<To extends CommandBar>(
  context: ConfigurationContext,
  _rule: any,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, "CommandBar", source, data as any) as unknown as To
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "CommandBar",
  importCommandBarPartialFromEnterprise as any
)
