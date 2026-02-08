import { ConfigurationContext } from "~/metadata/context/types"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { importElementFromYAMLPartial, registerMetadata } from "~/metadata/metadataFactory"

import "~/metadata/commonObjects/importFromEnterprise"
import "~/metadata/forms/elements/importFromEnterprise"
import "~/metadata/forms/elements/usualGroup/rules"
import { FormElementType, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import "~/metadata/systemEnumerations/importFromEnterprise"

export function importUsualGroupPartialFromEnterprise<To extends UsualGroup>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromYAMLPartial(context, FormElementType.UsualGroup, source, data)
}

registerMetadata("ImportPartialFromEnterprise", "UsualGroup", importUsualGroupPartialFromEnterprise as any)
