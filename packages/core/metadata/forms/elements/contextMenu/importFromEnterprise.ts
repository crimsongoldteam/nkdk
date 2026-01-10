import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export function importContextMenuFromEnterprise<T extends ContextMenuEnterprise | undefined>(
  context: ConfigurationContext,
  data: T
): ImportFromEnterpriseReturn<T, ContextMenu, string> {
  if (data === undefined) return undefined as ImportFromEnterpriseReturn<T, ContextMenu, string>

  const result = importFormGroupFromEnterprise(context, data, data.Имя)

  return {
    ...result,
    elementType: FormElementType.FormGroup,
  } as ImportFromEnterpriseReturn<T, ContextMenu, string>
}
