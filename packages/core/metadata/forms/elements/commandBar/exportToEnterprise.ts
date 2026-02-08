import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar } from "~/metadata/forms/elements/commandBar/types"
import { exportElementToYAMLPartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function exportCommandBarPartialToEnterprise<From extends CommandBar | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToYAMLPartial(context, "CommandBar", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CommandBar",
  exportCommandBarPartialToEnterprise as ExportPartialToEnterpriseFn
)
