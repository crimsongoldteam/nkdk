import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { FormElementType } from "../types"
import { FormItemAddition, FormItemAdditionXML } from "./types"

export const exportFormItemAdditionToXML = (data: FormItemAddition | undefined): FormItemAdditionXML | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToXML(data)!,

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
  }
}

registerExport(FormElementType.FormItemAddition, exportFormItemAdditionToXML)
