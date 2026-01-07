import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormItemAdditionToXML } from "~/metadata/forms/elements/formItemAddition/exportToXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/metadata/forms/elements/searchStringAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportSearchStringAdditionToXML = (
  context: ConfigurationContext,
  data: SearchStringAddition | undefined
): SearchStringAdditionXML | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportFormItemAdditionToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    BackColor: exportColorToXML(context, data.backColor),
    BorderColor: exportColorToXML(context, data.borderColor),
    Font: exportFontToXML(context, data.font),
    HorizontalStretch: data.horizontalStretch,
    TextColor: exportColorToXML(context, data.textColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    Width: data.width,  }
}

registerMetadata("ExportToXML", "SearchStringAddition", exportSearchStringAdditionToXML)
