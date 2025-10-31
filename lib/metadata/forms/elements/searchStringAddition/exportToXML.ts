import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { TSearchStringAdditionXML, TSearchStringAddition } from "./types"

export const exportSearchStringAdditionToXML = (data: TSearchStringAddition | undefined): TSearchStringAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportFormItemAdditionToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    HorizontalStretch: data.horizontalStretch,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    BackColor: exportColorToXML(data.backColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
  }
}