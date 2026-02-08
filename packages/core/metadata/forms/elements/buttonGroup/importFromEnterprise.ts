import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromYAMLPartial, registerMetadata } from "~/metadata/metadataFactory"
import { ImportPartialFromEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { ButtonGroup } from "./types"

export function importButtonGroupPartialFromEnterprise<To extends ButtonGroup>(
  context: ConfigurationContext,
  data: ToPartialEnterpriseType<To> | undefined,
  source?: To
): To | undefined {
  return importElementFromYAMLPartial(context, "ButtonGroup", data, source)
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "ButtonGroup",
  importButtonGroupPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
