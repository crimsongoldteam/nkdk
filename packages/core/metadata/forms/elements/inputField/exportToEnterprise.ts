import { ConfigurationContext } from "~/metadata/context/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { exportElementToEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function exportInputFieldPartialToEnterprise<From extends InputField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToEnterprisePartial(context, "InputField", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "InputField",
  exportInputFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
