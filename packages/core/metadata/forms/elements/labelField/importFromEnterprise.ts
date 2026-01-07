import { ConfigurationContext } from "~/metadata/context/types"
import { LabelField, LabelFieldEnterprise } from "~/metadata/forms/elements/labelField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importLabelFieldFromEnterprise = (
  context: ConfigurationContext,
  data: LabelFieldEnterprise | undefined,
  name: string
): LabelField | undefined => {
  if (!data) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: LabelField = {
    elementType: FormElementType.LabelField,
    ...restFields,
  }

  return result
}

registerMetadata("ImportFromEnterprise", "LabelField", importLabelFieldFromEnterprise)

