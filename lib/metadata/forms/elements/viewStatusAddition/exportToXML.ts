import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { TViewStatusAdditionXML, TViewStatusAddition } from "./types"

export const exportViewStatusAdditionToXML = (data: TViewStatusAddition | undefined): TViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportFormItemAdditionToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxWidth: data.autoMaxWidth,
    HorizontalAlign: data.horizontalAlign,
    MaxWidth: data.maxWidth,
    Border: exportBorderToXML(data.border),
    HorizontalStretch: data.horizontalStretch,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    TitleTextColor: exportColorToXML(data.titleTextColor),
    BackColor: exportColorToXML(data.backColor),
    ButtonsBackColor: exportColorToXML(data.buttonsBackColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
    TitleFont: exportFontToXML(data.titleFont),
  }
}