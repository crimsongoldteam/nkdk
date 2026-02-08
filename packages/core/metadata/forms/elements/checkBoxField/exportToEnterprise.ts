import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField } from "~/metadata/forms/elements/checkBoxField/types"
import { exportElementToYAMLPartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function exportCheckBoxFieldPartialToEnterprise<From extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToYAMLPartial(context, "CheckBoxField", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CheckBoxField",
  exportCheckBoxFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
