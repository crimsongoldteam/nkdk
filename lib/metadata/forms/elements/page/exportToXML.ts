import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { TPageXML, TPage } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportPageToXML = (data: TPage | undefined): TPageXML | undefined => {
  if (!data) return undefined
 
  return {
   _id: data.id ?? "",
   _name: data.name ?? "",
    EnableContentChange: data.enableContentChange,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    Title: exportI8nTextToXML(data.title),
    TitleFont: exportFontToXML(data.titleFont),
    TitleTextColor: exportColorToXML(data.titleTextColor),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    UserVisible: exportUserVisibleToXML(data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,
    ChildItems: exportChildItemsToXML(data.childItems),
    BackColor: exportColorToXML(data.backColor),
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    _DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(data.format),
    Group: data.group,
    HorizontalSpacing: data.horizontalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    Picture: exportPictureToXML(data.picture),
    ShowTitle: data.showTitle,
    SlaveItemsWidth: data.slaveItemsWidth,
    TitleDataPath: data.titleDataPath,
    VerticalAlign: data.verticalAlign,
    VerticalScrollOnReduceSize: data.verticalScrollOnReduceSize,
    VerticalSpacing: data.verticalSpacing,
  }
}

registerExport(ZElementType.enum.Page, exportPageToXML)