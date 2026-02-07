import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField } from "~/metadata/forms/elements/checkBoxField/types"
import { exportElementToEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function exportCheckBoxFieldPartialToEnterprise<From extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToEnterprisePartial(context, "CheckBoxField", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CheckBoxField",
  exportCheckBoxFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
