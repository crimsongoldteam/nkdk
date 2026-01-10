import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"

type ExportContextMenuToEnterpriseReturn<T> = T extends undefined ? undefined : ContextMenuEnterprise

export function exportContextMenuToEnterprise<T extends ContextMenu | undefined>(
  context: ConfigurationContext,
  data: T
): ExportContextMenuToEnterpriseReturn<T> {
  if (data === undefined) return undefined as ExportContextMenuToEnterpriseReturn<T>

  return {
    ...exportFormGroupToEnterprise(context, data),
    Имя: data.name,
  } as ExportContextMenuToEnterpriseReturn<T>
}
