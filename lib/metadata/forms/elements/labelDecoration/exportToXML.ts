import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { TLabelDecorationXML, TLabelDecoration } from "./types"

export const exportLabelDecorationToXML = (data: TLabelDecoration | undefined): TLabelDecorationXML | undefined => {
  if (!data) return undefined

  const base = exportFormDecorationToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    VerticalAlign: data.verticalAlign,
    TitleHeight: data.titleHeight,
    Hyperlink: data.hyperlink,
    HorizontalAlign: data.horizontalAlign,
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    BackColor: exportColorToXML(data.backColor),
  }
}