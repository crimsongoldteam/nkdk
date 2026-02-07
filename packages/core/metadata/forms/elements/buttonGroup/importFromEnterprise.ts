import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromEnterprisePartial, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { ButtonGroup } from "./types"

export function importButtonGroupPartialFromEnterprise<To extends ButtonGroup>(
  context: ConfigurationContext,
  data: ToPartialEnterpriseType<To> | undefined,
  source?: To
): To {
  return importElementFromEnterprisePartial(context, FormElementType.ButtonGroup, data, source)
}

registerMetadata("ImportPartialFromEnterprise", "ButtonGroup", importButtonGroupPartialFromEnterprise as any)
