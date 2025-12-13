import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { FormElementType } from "../types"
import { ViewStatusAddition, ViewStatusAdditionXML } from "./types"

export const exportViewStatusAdditionToXML = (
  data: ViewStatusAddition | undefined
): ViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormItemAdditionToXML(data)!,

    ContextMenu: exportCommandBarToXML(data.contextMenu),
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedToolTip: exportFormDecorationToXML(data.extendedToolTip),
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Title: exportI8nTextToXML(data.title),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    UserVisible: exportUserVisibleToXML(data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    ChildItems: exportChildItemsToXML(data.childItems),
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    ButtonsBackColor: exportColorToXML(data.buttonsBackColor),
    Font: exportFontToXML(data.font),
    HorizontalAlign: data.horizontalAlign,
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(data.textColor),
    TitleFont: exportFontToXML(data.titleFont),
    TitleTextColor: exportColorToXML(data.titleTextColor),
    Width: data.width,
  }
}

registerExport(FormElementType.ViewStatusAddition, exportViewStatusAdditionToXML)
