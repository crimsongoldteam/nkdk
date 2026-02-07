import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup } from "./types"
import { exportElementToEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function exportButtonGroupPartialToEnterprise<From extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToEnterprisePartial(context, "ButtonGroup", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "ButtonGroup",
  exportButtonGroupPartialToEnterprise as ExportPartialToEnterpriseFn
)
