import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TCheckBoxFieldXML, TCheckBoxField } from "./types"

export const exportCheckBoxFieldToXML = (data: TCheckBoxField | undefined): TCheckBoxFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    CheckBoxType: data.checkBoxType,
    ItemTitleHeight: data.itemTitleHeight,
    ItemHeight: data.itemHeight,
    EqualItemsWidth: data.equalItemsWidth,
    ThreeState: data.threeState,
    EditFormat: data.editFormat,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    BackColor: exportColorToXML(data.backColor),
    ItemWidth: data.itemWidth,
    Font: exportFontToXML(data.font),
  }
}