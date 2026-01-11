import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { importCommandBarFromEnterprise } from "~/metadata/forms/elements/commandBar/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importAutoCommandBarFromEnterprise = <From extends AutoCommandBarEnterprise | undefined>(
  context: ConfigurationContext,
  data: From
): ImportFromEnterpriseReturn<From, AutoCommandBar, string> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, AutoCommandBar, string>

  const baseFields = importCommandBarFromEnterprise(context, data, data.Имя)

  const result = {
    ...baseFields,
    elementType: FormElementType.CommandBar,
  } as ImportFromEnterpriseReturn<From, AutoCommandBar, string>

  return result
}
