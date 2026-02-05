import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/usualGroup/rules"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { importElementFromEnterprisePartial, registerMetadata } from "~/metadata/metadataFactory"

import "~/metadata/commonObjects/importFromEnterprise"
import "~/metadata/forms/elements/importFromEnterprise"
import "~/metadata/forms/elements/usualGroup/rules"
import {
  FormElementType,
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
} from "~/metadata/metadataFactory/types"
import "~/metadata/systemEnumerations/importFromEnterprise"

export function importUsualGroupPartialFromEnterprise<To extends UsualGroup>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.UsualGroup, source, data)
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "UsualGroup",
  importUsualGroupPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
