import { ConfigurationContext } from "~/metadata/context/types"
import { Button } from "~/metadata/forms/elements/button/types"
import { exportElementToEnterpriseTyped } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function exportButtonPartialToEnterprise<From extends Button | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToYAML(context, "Button", data)
}

export function exportButtonTypedToEnterprise<From extends Button | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToEnterpriseTyped(context, "Button", data)
}

registerMetadata("ExportPartialToEnterprise", "Button", exportButtonPartialToEnterprise as ExportPartialToEnterpriseFn)
registerMetadata("ExportTypedToEnterprise", "Button", exportButtonPartialToEnterprise as ExportTypedToEnterpriseFn)
