import { ConfigurationContext } from "~/metadata/context/types"
import { PictureField, PictureFieldEnterprise } from "~/metadata/forms/elements/pictureField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPictureFieldFromEnterprise = (
  context: ConfigurationContext,
  data: PictureFieldEnterprise | undefined,
  name: string
): PictureField | undefined => {
  if (!data) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: PictureField = {
    elementType: FormElementType.PictureField,
    ...restFields,
  }

  return result
}

registerMetadata("ImportFromEnterprise", "PictureField", importPictureFieldFromEnterprise)

