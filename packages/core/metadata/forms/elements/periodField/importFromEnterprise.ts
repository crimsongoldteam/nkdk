import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { PeriodField, PeriodFieldEnterprise } from "~/metadata/forms/elements/periodField/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPeriodFieldFromEnterprise = (
  context: ConfigurationContext,
  data: PeriodFieldEnterprise | undefined,
  name: string
): PeriodField | undefined => {
  if (!data) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: PeriodField = {
    elementType: FormElementType.PeriodField,
    ...restFields,
  }

  return result
}

registerMetadata("ImportFromEnterprise", "PeriodField", importPeriodFieldFromEnterprise)
