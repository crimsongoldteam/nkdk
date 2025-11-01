import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { TSearchStringAdditionXML, TSearchStringAddition } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportSearchStringAdditionToXML = (data: TSearchStringAddition | undefined): TSearchStringAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportFormItemAdditionToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    Font: exportFontToXML(data.font),
    HorizontalStretch: data.horizontalStretch,
    TextColor: exportColorToXML(data.textColor),
    Width: data.width,
  }
}

registerExport(ZElementType.enum.SearchStringAddition, exportSearchStringAdditionToXML)