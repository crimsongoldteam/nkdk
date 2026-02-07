import { ConfigurationContext } from "~/metadata/context/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { importElementFromEnterprisePartial, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ImportPartialFromEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importInputFieldPartialFromEnterprise<To extends InputField>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.InputField, source, data) as To
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "InputField",
  importInputFieldPartialFromEnterprise as unknown as ImportPartialFromEnterpriseFn
)
