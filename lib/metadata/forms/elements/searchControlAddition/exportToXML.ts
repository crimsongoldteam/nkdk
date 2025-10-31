import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { TSearchControlAdditionXML, TSearchControlAddition } from "./types"

export const exportSearchControlAdditionToXML = (data: TSearchControlAddition | undefined): TSearchControlAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportFormItemAdditionToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxWidth: data.autoMaxWidth,
    MaxWidth: data.maxWidth,
    HorizontalStretch: data.horizontalStretch,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    BackColor: exportColorToXML(data.backColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
  }
}