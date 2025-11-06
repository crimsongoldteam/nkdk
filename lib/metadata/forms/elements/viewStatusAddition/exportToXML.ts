import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { TViewStatusAdditionXML, TViewStatusAddition } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportViewStatusAdditionToXML = (data: TViewStatusAddition | undefined): TViewStatusAdditionXML | undefined => {
  if (!data) return undefined
 
  return {
   _id: data.id ?? "",
   _name: data.name ?? "",
    ContextMenu: exportFormGroupToXML(data.contextMenu),
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedToolTip: exportFormDecorationToXML(data.extendedToolTip),
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Title: exportI8nTextToXML(data.title),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
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

registerExport(ZElementType.enum.ViewStatusAddition, exportViewStatusAdditionToXML)