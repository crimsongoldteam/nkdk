import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField } from "~/metadata/forms/elements/checkBoxField/types"
import { importElementFromEnterprisePartial, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ImportPartialFromEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function importCheckBoxFieldPartialFromEnterprise<To extends CheckBoxField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.CheckBoxField, source, data) as To
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "CheckBoxField",
  importCheckBoxFieldPartialFromEnterprise as unknown as ImportPartialFromEnterpriseFn
)
