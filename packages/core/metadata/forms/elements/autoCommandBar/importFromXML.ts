import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { importCommandBarFromXML } from "~/metadata/forms/elements/commandBar/importFromXML"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  xml: AutoCommandBarXML | undefined
): AutoCommandBar | undefined => {
  if (!xml) return undefined
  const baseFields = importCommandBarFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: AutoCommandBar = {
    elementType: "AutoCommandBar" as FormElementType,
    ...restFields,
  }

  return result
}
