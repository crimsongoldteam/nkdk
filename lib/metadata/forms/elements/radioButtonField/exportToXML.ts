import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TRadioButtonFieldXML, TRadioButtonField } from "./types"

export const exportRadioButtonFieldToXML = (data: TRadioButtonField | undefined): TRadioButtonFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    RadioButtonType: data.radioButtonType,
    ItemTitleHeight: data.itemTitleHeight,
    ItemHeight: data.itemHeight,
    ColumnsCount: data.columnsCount,
    EqualColumnsWidth: data.equalColumnsWidth,
    ChoiceList: exportChoiceListToXML(data.choiceList),
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    BackColor: exportColorToXML(data.backColor),
    ItemWidth: data.itemWidth,
    Font: exportFontToXML(data.font),
  }
}