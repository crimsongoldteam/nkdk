import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup } from "./types"
import { importElementFromEnterprisePartial, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function importButtonGroupPartialFromEnterprise<To extends ButtonGroup>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.ButtonGroup, source, data)
}

registerMetadata("ImportPartialFromEnterprise", "ButtonGroup", importButtonGroupPartialFromEnterprise as any)
