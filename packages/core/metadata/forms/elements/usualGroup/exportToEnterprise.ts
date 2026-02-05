import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/usualGroup/rules"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { exportElementToEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function exportUsualGroupPartialToEnterprise<From extends UsualGroup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToEnterprisePartial(context, "UsualGroup", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "UsualGroup",
  exportUsualGroupPartialToEnterprise as ExportPartialToEnterpriseFn
)
