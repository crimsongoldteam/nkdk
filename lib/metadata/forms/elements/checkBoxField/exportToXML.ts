import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TCheckBoxFieldXML, TCheckBoxField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportCheckBoxFieldToXML = (data: TCheckBoxField | undefined): TCheckBoxFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    CheckBoxType: data.checkBoxType,
    EditFormat: data.editFormat,
    EqualItemsWidth: data.equalItemsWidth,
    Font: exportFontToXML(data.font),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    TextColor: exportColorToXML(data.textColor),
    ThreeState: data.threeState,
  }
}

registerExport(ZElementType.enum.CheckBoxField, exportCheckBoxFieldToXML)