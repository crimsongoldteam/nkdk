import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup } from "~/metadata/forms/elements/buttonGroup/types"
import { importElementFromEnterprisePartial, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ImportPartialFromEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function importButtonGroupPartialFromEnterprise<To extends ButtonGroup>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.ButtonGroup, source, data) as To
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "ButtonGroup",
  importButtonGroupPartialFromEnterprise as unknown as ImportPartialFromEnterpriseFn
)
