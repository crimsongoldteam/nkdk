import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TRadioButtonFieldXML, TRadioButtonField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["DataPath", "Visible", "UserVisible", "Enabled", "ReadOnly", "SkipOnInput", "Title", "TitleTextColor", "TitleFont", "TitleLocation", "TitleHeight", "ToolTip", "ToolTipRepresentation", "WarningOnEditRepresentation", "WarningOnEdit", "Shortcut", "HorizontalAlign", "VerticalAlign", "GroupHorizontalAlign", "GroupVerticalAlign", "OnMainServerUnavalableBehavior", "RadioButtonType", "ItemTitleHeight", "ColumnsCount", "Font", "TextColor", "ContextMenu", "ExtendedTooltip", "Events"]

export const exportRadioButtonFieldToXML = (data: TRadioButtonField | undefined): TRadioButtonFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TRadioButtonFieldXML>( {
    ...base,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    ChoiceList: exportChoiceListToXML(data.choiceList),
    ColumnsCount: data.columnsCount,
    EqualColumnsWidth: data.equalColumnsWidth,
    Font: exportFontToXML(data.font),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    RadioButtonType: data.radioButtonType,
    TextColor: exportColorToXML(data.textColor),
  }, ORDER)
}

registerExport(ZElementType.enum.RadioButtonField, exportRadioButtonFieldToXML)