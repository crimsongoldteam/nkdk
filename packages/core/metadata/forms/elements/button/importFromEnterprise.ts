import { ConfigurationContext } from "~/metadata/context/types"
import { Button } from "~/metadata/forms/elements/button/types"
import {
  importElementFromEnterpriseTyped,
  importElementFromYAMLPartial,
  registerMetadata,
} from "~/metadata/metadataFactory"
import {
  FormElementType,
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function importButtonTypedFromEnterprise<To extends Button>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To> | undefined,
  name: string
): To {
  return importElementFromEnterpriseTyped(context, FormElementType.Button, data, name) as To
}

export function importButtonPartialFromEnterprise<To extends Button>(
  context: ConfigurationContext,
  data: ToPartialEnterpriseType<To> | undefined,
  source?: To
): To {
  return importElementFromYAMLPartial(context, FormElementType.Button, data, source) as To
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "Button",
  importButtonPartialFromEnterprise as unknown as ImportPartialFromEnterpriseFn
)
