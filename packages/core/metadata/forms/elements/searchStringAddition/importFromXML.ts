import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormItemAdditionFromXML } from "~/metadata/forms/elements/formItemAddition/importFromXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/metadata/forms/elements/searchStringAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importSearchStringAdditionFromXML = (
  context: ConfigurationContext,
  xml: SearchStringAdditionXML | undefined
): SearchStringAddition | undefined => {
  if (!xml) return undefined

  const baseFields = importFormItemAdditionFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: SearchStringAddition = {
    elementType: FormElementType.SearchStringAddition,
    ...restFields,
  }

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.Width !== undefined) result.width = xml.Width

  return result
}

registerMetadata("ImportFromXML", "SearchStringAddition", importSearchStringAdditionFromXML)
