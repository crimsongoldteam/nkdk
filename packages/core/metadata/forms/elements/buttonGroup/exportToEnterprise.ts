import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToEnterpriseTyped, exportElementToYAMLPartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { ButtonGroup } from "./types"

export function exportButtonGroupPartialToEnterprise<From extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToYAMLPartial(context, "ButtonGroup", data) as ToPartialEnterpriseType<From>
}

export function exportButtonGroupTypedToEnterprise<From extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToEnterpriseTyped(context, "ButtonGroup", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "ButtonGroup",
  exportButtonGroupPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
  "ExportTypedToEnterprise",
  "ButtonGroup",
  exportButtonGroupPartialToEnterprise as ExportTypedToEnterpriseFn
)
