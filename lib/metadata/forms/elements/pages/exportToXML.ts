import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { exportTableToXML } from "../table/exportToXML"
import { FormElementType } from "../types"
import { Pages, PagesXML } from "./types"

export const exportPagesToXML = (data: Pages | undefined): PagesXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data)!,

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
    AssociatedTable: exportTableToXML(data.associatedTable),
    CurrentPagesState: data.currentPagesState,
    CurrentRowUse: data.currentRowUse,
    PagesRepresentation: data.pagesRepresentation,
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.Pages, exportPagesToXML)
