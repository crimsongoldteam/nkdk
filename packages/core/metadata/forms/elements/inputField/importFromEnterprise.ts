import { ConfigurationContext } from "~/metadata/context/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { importElementFromYAMLPartial, registerMetadata } from "~/metadata/metadataFactory"
import {
  FormElementType,
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function importInputFieldPartialFromEnterprise<To extends InputField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromYAMLPartial(context, FormElementType.InputField, source, data) as To
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "InputField",
  importInputFieldPartialFromEnterprise as unknown as ImportPartialFromEnterpriseFn
)
