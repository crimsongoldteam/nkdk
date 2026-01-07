import { ConfigurationContext } from "~/metadata/context/types"
import { Page, PageEnterprise } from "~/metadata/forms/elements/page/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPageFromEnterprise = (
  context: ConfigurationContext,
  data: PageEnterprise | undefined,
  name: string
): Page | undefined => {
  if (!data) return undefined

  const baseFields = importFormGroupFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: Page = {
    elementType: FormElementType.Page,
    ...restFields,
  }

  return result
}

registerMetadata("ImportFromEnterprise", "Page", importPageFromEnterprise)

