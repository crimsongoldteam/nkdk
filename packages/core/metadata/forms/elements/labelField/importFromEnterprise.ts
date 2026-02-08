import { ConfigurationContext } from "~/metadata/context/types"
import { LabelField } from "~/metadata/forms/elements/labelField/types"
import { importElementFromYAMLPartial, registerMetadata } from "~/metadata/metadataFactory"
import {
  FormElementType,
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function importLabelFieldPartialFromEnterprise<To extends LabelField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromYAMLPartial(context, FormElementType.LabelField, source, data) as To
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "LabelField",
  importLabelFieldPartialFromEnterprise as unknown as ImportPartialFromEnterpriseFn
)
