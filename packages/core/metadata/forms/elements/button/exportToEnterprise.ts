import { ConfigurationContext } from "~/metadata/context/types"
import { Button } from "~/metadata/forms/elements/button/types"
import { exportElementToEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function exportButtonPartialToEnterprise<From extends Button | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToEnterprisePartial(context, "Button", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "Button",
  exportButtonPartialToEnterprise as ExportPartialToEnterpriseFn
)
