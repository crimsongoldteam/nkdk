import { ConfigurationContext } from "~/metadata/context/types"
import { LabelField } from "~/metadata/forms/elements/labelField/types"
import { exportElementToYAMLPartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function exportLabelFieldPartialToEnterprise<From extends LabelField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToYAMLPartial(context, "LabelField", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "LabelField",
  exportLabelFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
