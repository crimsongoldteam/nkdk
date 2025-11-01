import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { TLabelDecorationXML, TLabelDecoration } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportLabelDecorationToXML = (data: TLabelDecoration | undefined): TLabelDecorationXML | undefined => {
  if (!data) return undefined

  const base = exportFormDecorationToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    BackColor: exportColorToXML(data.backColor),
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    HorizontalAlign: data.horizontalAlign,
    Hyperlink: data.hyperlink,
    TitleHeight: data.titleHeight,
    VerticalAlign: data.verticalAlign,
  }
}

registerExport(ZElementType.enum.LabelDecoration, exportLabelDecorationToXML)