import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { THTMLDocumentFieldXML, THTMLDocumentField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportHTMLDocumentFieldToXML = (data: THTMLDocumentField | undefined): THTMLDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    UserAgentInformation: data.userAgentInformation,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }
}

registerExport(ZElementType.enum.HTMLDocumentField, exportHTMLDocumentFieldToXML)