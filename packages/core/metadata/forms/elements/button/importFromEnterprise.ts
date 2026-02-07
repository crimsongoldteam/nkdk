import { ConfigurationContext } from "~/metadata/context/types"
import { Button } from "~/metadata/forms/elements/button/types"
import { importElementFromEnterprisePartial, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ImportPartialFromEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importButtonPartialFromEnterprise<To extends Button>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.Button, source, data) as To
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "Button",
  importButtonPartialFromEnterprise as unknown as ImportPartialFromEnterpriseFn
)
