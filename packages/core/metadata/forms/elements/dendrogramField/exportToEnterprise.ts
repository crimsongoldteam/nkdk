import { ConfigurationContext } from "~/metadata/context/types"
import { DendrogramField } from "~/metadata/forms/elements/dendrogramField/types"
import {
  exportElementToEnterpriseTyped,
  exportElementToYAMLPartial,
  registerMetadata,
} from "~/metadata/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function exportDendrogramFieldTypedToEnterprise<From extends DendrogramField | undefined>(
  context: ConfigurationContext,
  _rule: any,
  data: From
): ToTypedEnterpriseType<From> {
  return exportElementToEnterpriseTyped(
    context,
    "DendrogramField",
    data as any
  ) as unknown as ToTypedEnterpriseType<From>
}

export function exportDendrogramFieldPartialToEnterprise<From extends DendrogramField | undefined>(
  context: ConfigurationContext,
  _rule: any,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToYAMLPartial(context, "DendrogramField", data as any) as unknown as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "DendrogramField",
  exportDendrogramFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
  "ExportTypedToEnterprise",
  "DendrogramField",
  exportDendrogramFieldTypedToEnterprise as ExportTypedToEnterpriseFn
)
